import { clearTables } from "./utils";
import { seedUsers } from "./users";
import { seedProducts } from "./products";
import { seedVariations } from "./variations";

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Clear existing data
  await clearTables();

  // 2. Seed demo user
  await seedUsers();

  // 3. Seed categories, products & items
  await seedProducts();

  // 4. Seed variations (mens-shirts → Size + Color variants)
  await seedVariations();

  console.log("\n🎉 Seeding complete!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});