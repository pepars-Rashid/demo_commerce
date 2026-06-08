import { clearTables } from "./utils";
import { seedUsers } from "./users";
import { seedProducts } from "./products";

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Clear existing data
  await clearTables();

  // 2. Seed demo user
  await seedUsers();

  // 3. Seed categories, products & items
  await seedProducts();

  console.log("\n🎉 Seeding complete!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});