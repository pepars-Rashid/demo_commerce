import { db } from "@/db/db";
import { count, min, max, sql as dsql } from "drizzle-orm";
import {
  productCategory,
  product,
  productItem,
  users,
  shopOrder,
  orderLine,
  inventoryLog,
  variation,
  variationOption,
  productConfiguration,
} from "@/db/schema";
import { clearTables } from "./utils";
import { seedUsers } from "./users";
import { seedCategories } from "./categories";
import { seedProducts } from "./products";
import { seedOrders } from "./orders";

async function main() {
  const reset = process.argv.includes("--reset");
  console.log(reset ? "🌱 Resetting & re-seeding database...\n" : "🌱 Seeding database...\n");

  // Idempotency: refuse to double-seed unless --reset is passed.
  if (!reset) {
    const [existing] = await db
      .select({ value: count() })
      .from(productItem);
    if (Number(existing.value) > 0) {
      console.log(
        "ℹ️  Data already exists — skipping. Use `npm run seed -- --reset` for a clean re-seed."
      );
      return;
    }
  }

  if (reset) await clearTables();

  // FK order: users → categories → products(+variants) → orders(+logs).
  const actors = await seedUsers();
  const leafIds = await seedCategories();
  const items = await seedProducts(leafIds);
  await seedOrders(actors, items);

  // ── Summary ─────────────────────────────────────────────────────────
  console.log("\n📊 Seed summary");
  const counts: Array<[string, number]> = [];
  const [c1] = await db.select({ value: count() }).from(productCategory);
  counts.push(["categories", Number(c1.value)]);
  const [c2] = await db.select({ value: count() }).from(product);
  counts.push(["products", Number(c2.value)]);
  const [c3] = await db.select({ value: count() }).from(productItem);
  counts.push(["productItems", Number(c3.value)]);
  const [c4] = await db.select({ value: count() }).from(variation);
  counts.push(["variations", Number(c4.value)]);
  const [c5] = await db.select({ value: count() }).from(variationOption);
  counts.push(["variationOptions", Number(c5.value)]);
  const [c6] = await db.select({ value: count() }).from(productConfiguration);
  counts.push(["productConfigs", Number(c6.value)]);
  const [c7] = await db.select({ value: count() }).from(users);
  counts.push(["users", Number(c7.value)]);
  const [c8] = await db.select({ value: count() }).from(shopOrder);
  counts.push(["orders", Number(c8.value)]);
  const [c9] = await db.select({ value: count() }).from(orderLine);
  counts.push(["orderLines", Number(c9.value)]);
  const [c10] = await db.select({ value: count() }).from(inventoryLog);
  counts.push(["inventoryLogs", Number(c10.value)]);
  for (const [label, n] of counts) {
    console.log(`  ${label.padEnd(18)} ${String(n).padStart(5)}`);
  }

  const [inv] = await db
    .select({ value: dsql`COALESCE(SUM(${productItem.qtyInStock} * ${productItem.price}), 0)` })
    .from(productItem);
  console.log(
    `  ${"totalInventoryValue".padEnd(18)} $${Number(Number(inv.value).toFixed(2)).toLocaleString("en")}`
  );

  const [range] = await db
    .select({ min: min(shopOrder.orderDate), max: max(shopOrder.orderDate) })
    .from(shopOrder);
  console.log(
    `  ${"orderDateRange".padEnd(18)} ${range.min?.toISOString().slice(0, 10)} → ${range.max?.toISOString().slice(0, 10)}`
  );

  console.log("\n🎉 Seeding complete!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});