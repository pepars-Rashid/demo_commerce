import { db } from "@/db/db";
import {
  inventoryLog,
  orderLine,
  product,
  productItem,
  shopOrder,
  users,
  type OrderStatus,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { asc, eq, sql } from "drizzle-orm";
import type { SeededUser } from "./users";

// Demo customers referenced by orders. The admin (superAdmin) is seeded separately
// in users.ts and passed in as the actor for admin stock adjustments.
interface CustomerSeed {
  name: string;
  email: string;
  role: "user" | "operationManager";
}

const CUSTOMERS: CustomerSeed[] = [
  { name: "سارة العتيبي", email: "sara@example.com", role: "user" },
  { name: "خالد الدوسري", email: "khaled@example.com", role: "user" },
  { name: "نورة القحطاني", email: "noura@example.com", role: "user" },
  { name: "ريم الحربي", email: "reem@example.com", role: "user" },
  { name: "فيصل الشهري", email: "faisal@example.com", role: "operationManager" },
];

interface OrderLineDef {
  /** index into the product items array (fetched ordered by id) */
  itemIndex: number;
  qty: number;
}

interface OrderDef {
  customerEmail: string;
  status: OrderStatus;
  daysAgo: number;
  shippingAddress: string;
  lines: OrderLineDef[];
}

// A spread of orders across all statuses so M3 has full coverage.
// Line items reference seeded product items by their position.
const ORDERS: OrderDef[] = [
  {
    customerEmail: "sara@example.com",
    status: "delivered",
    daysAgo: 12,
    shippingAddress: "حي الياسمين، شارع الأمير محمد، الرياض 13325",
    lines: [
      { itemIndex: 6, qty: 1 },
      { itemIndex: 2, qty: 1 },
      { itemIndex: 1, qty: 2 },
    ],
  },
  {
    customerEmail: "khaled@example.com",
    status: "shipped",
    daysAgo: 10,
    shippingAddress: "حي النخيل، طريق الملك فهد، جدة 23442",
    lines: [{ itemIndex: 2, qty: 1 }],
  },
  {
    customerEmail: "noura@example.com",
    status: "paid",
    daysAgo: 8,
    shippingAddress: "حي العزيزية، شارع التحلية، الدمام 32424",
    lines: [{ itemIndex: 3, qty: 1 }],
  },
  {
    customerEmail: "reem@example.com",
    status: "pending",
    daysAgo: 6,
    shippingAddress: "حي الروضة، شارع الستين، الرياض 12831",
    lines: [{ itemIndex: 1, qty: 2 }],
  },
  {
    customerEmail: "sara@example.com",
    status: "cancelled",
    daysAgo: 9,
    shippingAddress: "حي الياسمين، شارع الأمير محمد، الرياض 13325",
    lines: [{ itemIndex: 0, qty: 1 }],
  },
  {
    customerEmail: "khaled@example.com",
    status: "paid",
    daysAgo: 5,
    shippingAddress: "حي النخيل، طريق الملك فهد، جدة 23442",
    lines: [{ itemIndex: 4, qty: 1 }],
  },
  {
    customerEmail: "noura@example.com",
    status: "delivered",
    daysAgo: 3,
    shippingAddress: "حي العزيزية، شارع التحلية، الدمام 32424",
    lines: [{ itemIndex: 5, qty: 2 }],
  },
  {
    customerEmail: "reem@example.com",
    status: "shipped",
    daysAgo: 2,
    shippingAddress: "حي الروضة، شارع الستين، الرياض 12831",
    lines: [{ itemIndex: 7, qty: 1 }],
  },
];

// Positive stock adjustments (besides orders) so the ledger / M4 has variety.
// These are admin actions — no order line origin, attributed to the admin user.
const ADJUSTMENTS: { itemIndex: number; qty: number; reason: string }[] = [
  { itemIndex: 0, qty: 15, reason: "admin_adjustment" },
  { itemIndex: 3, qty: 8, reason: "return" },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Seed demo customers, shop orders, order lines, and the inventory ledger
 * (every log records WHO + origin order line).
 *
 * @param admin The seeded superAdmin, used as the actor for admin stock adjustments.
 */
export async function seedOrders(admin: SeededUser) {
  // ── 1. Seed demo customers ─────────────────────────────────────────────
  const emailToId = new Map<string, string>();
  for (const c of CUSTOMERS) {
    const hashed = await hashPassword("password123");
    const [row] = await db
      .insert(users)
      .values({ name: c.name, email: c.email, role: c.role, password: hashed })
      .returning({ id: users.id });
    emailToId.set(c.email, row.id);
  }
  console.log(`✅ ${CUSTOMERS.length} customer users seeded`);

  // ── 2. Load product items to reference in order lines ─────────────────
  const items = await db
    .select({ id: productItem.id, price: productItem.price })
    .from(productItem)
    .orderBy(asc(productItem.id));
  console.log(`✅ Loaded ${items.length} product items`);

  // ── 3. Seed orders + lines + inventory logs ────────────────────────────
  for (const def of ORDERS) {
    const userId = emailToId.get(def.customerEmail)!;
    const orderDate = daysAgo(def.daysAgo);

    // Compute order total from line items (decimal money, 2 dp)
    const orderTotal = def.lines
      .reduce((sum, l) => sum + l.qty * Number(items[l.itemIndex].price), 0)
      .toFixed(2);

    const [order] = await db
      .insert(shopOrder)
      .values({
        userId,
        orderDate,
        orderTotal,
        orderStatus: def.status,
        shippingAddress: def.shippingAddress,
        billingAddress: def.shippingAddress,
        createdAt: orderDate,
        updatedAt: orderDate,
      })
      .returning({ id: shopOrder.id });

    for (const { itemIndex, qty } of def.lines) {
      const item = items[itemIndex];

      // Insert the line first to capture its id (the inventory log's origin).
      const [line] = await db
        .insert(orderLine)
        .values({
          productItemId: item.id,
          orderId: order.id,
          qty,
          price: item.price,
          createdAt: orderDate,
        })
        .returning({ id: orderLine.id });

      // Stock out + audit log (who = customer, origin = order line)
      await db
        .update(productItem)
        .set({ qtyInStock: sql`${productItem.qtyInStock} - ${qty}` })
        .where(eq(productItem.id, item.id));

      await db.insert(inventoryLog).values({
        userId,
        orderLineId: line.id,
        productItemId: item.id,
        change: -qty,
        reason: "order_placed",
        createdAt: orderDate,
      });
    }
  }

  // ── 4. Positive stock adjustments (restock / return) ───────────────────
  // Admin/system work: no order line origin, attributed to the admin actor.
  for (const { itemIndex, qty, reason } of ADJUSTMENTS) {
    const item = items[itemIndex];
    await db
      .update(productItem)
      .set({ qtyInStock: sql`${productItem.qtyInStock} + ${qty}` })
      .where(eq(productItem.id, item.id));

    await db.insert(inventoryLog).values({
      userId: admin.id,
      orderLineId: null,
      productItemId: item.id,
      change: qty,
      reason,
    });
  }

  // ── 5. Reconcile denormalized product.totalStock ───────────────────────
  // product.totalStock is denormalized from product_item.qty_in_stock. Products
  // that got their single item replaced by variants (variations.ts) or had stock
  // decremented/incremented here would otherwise keep a stale total. Bulk UPDATE
  // is far more performant than a per-product loop — a single correlated pass.
  // Uses fully-qualified names so the subquery can't be ambiguous.
  await db.update(product).set({
    totalStock: sql.raw(`
      (
        SELECT COALESCE(SUM("product_item"."qty_in_stock"), 0)
        FROM "product_item"
        WHERE "product_item"."product_id" = "product"."id"
      )
    `),
  });

  console.log("✅ Product totalStock reconciled from item sums");

  console.log(`✅ ${ORDERS.length} orders + inventory logs seeded`);
}
