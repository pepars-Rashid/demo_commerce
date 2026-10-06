import { db } from "@/db/db";
import { sql } from "drizzle-orm";
import {
  inventoryLog,
  orderLine,
  product,
  productItem,
  shopOrder,
  type OrderStatus,
} from "@/db/schema";
import { mulberry32, randInt, daysAgoUtc } from "./utils";
import type { SeedActors } from "./users";
import type { CatalogItem } from "./products";

const PRNG_SEED = 1234567;
const ADDRESSES = [
  "حي الياسمين، شارع الأمير محمد، الرياض 13325",
  "حي النخيل، طريق الملك فهد، جدة 23442",
  "حي العزيزية، شارع التحلية، الدمام 32424",
  "حي الروضة، شارع الستين، الرياض 12831",
  "حي الحمراء، شارع فلسطين، جدة 23522",
  "حي الملقا، طريق الملك عبدالعزيز، الرياض 13514",
  "حي الأندلس، شارع التخصصي، جدة 23325",
  "حي الراكة، طريق الأمير سلطان، الخبر 34421",
];

// DummyJSON ids we treat as "hot sellers" so the best-seller chart has clear winners.
const HOT_DUMMY_IDS = new Set([122, 78, 174, 100, 181, 187, 4, 85]);

const STATUS_PLAN: { status: OrderStatus; count: number; band: [number, number] }[] = [
  { status: "delivered", count: 36, band: [56, 21] },
  { status: "shipped", count: 16, band: [28, 7] },
  { status: "paid", count: 12, band: [14, 2] },
  { status: "pending", count: 8, band: [6, 0] },
  { status: "cancelled", count: 8, band: [49, 1] },
];

/** Bias toward recent days within a band (upward weekly growth). */
function daysInBand(rng: () => number, [min, max]: [number, number]): number {
  const r = rng();
  return Math.round(max + (min - max) * Math.pow(r, 1.4));
}

type LineRef = { item: CatalogItem; qty: number };

function pickItem(
  rng: () => number,
  items: CatalogItem[],
  hot: CatalogItem[]
): CatalogItem | undefined {
  if (hot.length > 0 && rng() < 0.35) return hot[Math.floor(rng() * hot.length)];
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
}

/** Apply a stock change + write an audit log for a manual/admin action. */
async function applyAdjust(
  rng: () => number,
  items: CatalogItem[],
  pool: CatalogItem[],
  change: number,
  reason: string,
  userId: string,
  orderLineId: number | null,
  daysAgo: number
) {
  if (pool.length === 0) return;
  const item = pool[Math.floor(rng() * pool.length)];
  const newQty = item.qtyInStock + change;
  if (newQty < 0) return; // respects the stock ≥ 0 CHECK
  await db
    .update(productItem)
    .set({ qtyInStock: newQty })
    .where(sql`${productItem.id} = ${item.id}`);
  await db.insert(inventoryLog).values({
    productItemId: item.id,
    orderLineId,
    userId,
    change,
    reason,
    createdAt: daysAgoUtc(daysAgo, rng),
  });
}

/**
 * Seed 80 synthetic orders (status/date spread) + per-line inventory logs,
 * then opManager/superAdmin audit adjustments. All orderLine / inventoryLog
 * rows are append-only. Returns nothing (logs + stock are written directly).
 */
export async function seedOrders(actors: SeedActors, items: CatalogItem[]) {
  const rng = mulberry32(PRNG_SEED);
  const hot = items.filter((i) => HOT_DUMMY_IDS.has(i.dummyId));

  let orderCount = 0;
  let lineCount = 0;

  for (const plan of STATUS_PLAN) {
    for (let i = 0; i < plan.count; i++) {
      const daysAgo = daysInBand(rng, plan.band);
      const orderDate = daysAgoUtc(daysAgo, rng);

      // Pick a customer + lines (1-3 lines, qty 1-3).
      const customer = actors.customers[Math.floor(rng() * actors.customers.length)];
      const nLines = randInt(rng, 1, 3);
      const lines: LineRef[] = [];
      let orderTotal = 0;
      for (let l = 0; l < nLines; l++) {
        const item = pickItem(rng, items, hot);
        if (!item) break;
        const qty = randInt(rng, 1, 3);
        const newQty = item.qtyInStock - qty;
        if (newQty < 0) continue; // guard against negative stock
        item.qtyInStock = newQty; // track locally for later adjustments
        lines.push({ item, qty });
        orderTotal += qty * Number(item.discountPrice ?? item.price);
      }
      if (lines.length === 0) continue;

      const address = ADDRESSES[Math.floor(rng() * ADDRESSES.length)];
      const [order] = await db
        .insert(shopOrder)
        .values({
          userId: customer.id,
          orderDate,
          orderTotal: orderTotal.toFixed(2),
          orderStatus: plan.status,
          shippingAddress: address,
          billingAddress: address,
          createdAt: orderDate,
          updatedAt: orderDate,
        })
        .returning({ id: shopOrder.id });
      orderCount++;

      for (const { item, qty } of lines) {
        const [line] = await db
          .insert(orderLine)
          .values({
            productItemId: item.id,
            orderId: order.id,
            qty,
            price: (item.discountPrice ?? item.price),
            createdAt: orderDate,
          })
          .returning({ id: orderLine.id });
        lineCount++;
        await db
          .update(productItem)
          .set({ qtyInStock: sql`${productItem.qtyInStock} - ${qty}` })
          .where(sql`${productItem.id} = ${item.id}`);
        await db.insert(inventoryLog).values({
          productItemId: item.id,
          orderLineId: line.id,
          userId: customer.id,
          change: -qty,
          reason: "طلب شراء",
          createdAt: orderDate,
        });
      }
    }
  }

  console.log(`✅ ${orderCount} orders with ${lineCount} order lines seeded`);

  // ── opManager product CRUD audit logs ───────────────────────────────
  const op = actors.ops[0];
  // Products created mid-window by an opManager (+new stock).
  for (let i = 0; i < 8; i++) {
    await applyAdjust(rng, items, hot, randInt(rng, 8, 30), "إضافة منتج", op.id, null, randInt(rng, 40, 55));
  }
  // Products updated (stock tweaks, ±).
  for (let i = 0; i < 6; i++) {
    await applyAdjust(rng, items, hot, randInt(rng, -8, 12), "تعديل منتج", op.id, null, randInt(rng, 30, 50));
  }
  // Products deleted (no stock effect, change = 0).
  for (let i = 0; i < 2; i++) {
    await applyAdjust(rng, items, hot, 0, "حذف منتج", op.id, null, randInt(rng, 20, 45));
  }

  // ── superAdmin manual inventory logs ────────────────────────────────
  for (let i = 0; i < 10; i++) {
    await applyAdjust(rng, items, items, randInt(rng, -15, 20), "تصحيح جرد", actors.admin.id, null, randInt(rng, 3, 50));
  }
  for (let i = 0; i < 8; i++) {
    await applyAdjust(rng, items, items, randInt(rng, 1, 10), "مرتجع", actors.admin.id, null, randInt(rng, 10, 45));
  }
  for (let i = 0; i < 7; i++) {
    await applyAdjust(rng, items, items, -randInt(rng, 1, 6), "تالف", actors.admin.id, null, randInt(rng, 5, 40));
  }

  // ── Reconcile denormalized product.totalStock ───────────────────────
  await db.update(product).set({
    totalStock: sql.raw(`
      (
        SELECT COALESCE(SUM("product_item"."qty_in_stock"), 0)
        FROM "product_item"
        WHERE "product_item"."product_id" = "product"."id"
      )
    `),
  });
  console.log("✅ product.totalStock reconciled from item sums");
}