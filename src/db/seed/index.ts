import { clearTables } from "./utils";
import { seedUsers } from "./users";
import { seedProducts } from "./products";
import { seedVariations } from "./variations";
import { seedOrders } from "./orders";

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Clear existing data
  await clearTables();

  // 2. Seed demo user (superAdmin) — returns the admin id for later attribution
  const admin = await seedUsers();

  // 3. Seed categories, products & items
  await seedProducts();

  // 4. Seed variations (mens-shirts → Size + Color variants)
  await seedVariations();

  // 5. Seed demo customers, orders, lines & inventory logs (owner = admin)
  await seedOrders(admin);

  console.log("\n🎉 Seeding complete!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});