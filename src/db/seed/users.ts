import { db } from "@/db/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

export async function seedUsers() {
  const email = "admin@demo.com";
  const password = "password123";

  const hashed = await hashPassword(password);

  await db.insert(users).values({
    name: "مدير المتجر",
    email,
    password: hashed,
    role: "superAdmin",
  });

  console.log(`✅ Demo user seeded: ${email} / ${password} (role: superAdmin)`);
}