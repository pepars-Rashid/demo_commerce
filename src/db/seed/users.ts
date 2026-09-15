import { db } from "@/db/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

export interface SeededUser {
  id: string;
  email: string;
  role: "superAdmin";
}

/**
 * Seed the primary admin (superAdmin).
 * Returns the admin's id so downstream seeds (orders/logs) can attribute actions to them.
 */
export async function seedUsers(): Promise<SeededUser> {
  const email = "admin@demo.com";
  const password = "password123";

  const hashed = await hashPassword(password);

  const [admin] = await db
    .insert(users)
    .values({
      name: "مدير المتجر",
      email,
      password: hashed,
      role: "superAdmin",
    })
    .returning({ id: users.id });

  console.log(`✅ Demo user seeded: ${email} / ${password} (role: superAdmin)`);

  return { id: admin.id, email, role: "superAdmin" };
}