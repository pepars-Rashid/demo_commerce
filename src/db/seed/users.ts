import { db } from "@/db/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

export interface SeedUserRef {
  id: string;
  email: string;
}

export interface SeedActors {
  admin: SeedUserRef; // superAdmin
  ops: SeedUserRef[]; // 2 × operationManager
  customers: SeedUserRef[]; // 14 × user (buyers)
}

const PASSWORD = "password123";

const STAFF = [
  { name: "مدير المتجر", email: "admin@demo.com", role: "superAdmin" },
  { name: "فيصل الشهري", email: "faisal@example.com", role: "operationManager" },
  { name: "ناصر القرشي", email: "nasser@example.com", role: "operationManager" },
];

const CUSTOMERS: { name: string; email: string }[] = [
  { name: "سارة العتيبي", email: "sara@example.com" },
  { name: "خالد الدوسري", email: "khaled@example.com" },
  { name: "نورة القحطاني", email: "noura@example.com" },
  { name: "ريم الحربي", email: "reem@example.com" },
  { name: "عبدالله المطيري", email: "abdullah@example.com" },
  { name: "لمى السبيعي", email: "lama@example.com" },
  { name: "هند الشمري", email: "hind@example.com" },
  { name: "سلطان الغامدي", email: "sultan@example.com" },
  { name: "جواهر العمري", email: "jawharah@example.com" },
  { name: "فهد البقمي", email: "fahad@example.com" },
  { name: "مها الزهراني", email: "maha@example.com" },
  { name: "بدر الجهني", email: "badr@example.com" },
  { name: "رهف العوفي", email: "rahaf@example.com" },
  { name: "عبدالرحمن السديري", email: "abdurahman@example.com" },
];

/**
 * Seed 17 users (1 superAdmin, 2 operationManager, 14 customers).
 * All share the dev password ("password123"). Admin email is preserved so the
 * existing admin login keeps working. Returns typed refs for downstream seeding.
 */
export async function seedUsers(): Promise<SeedActors> {
  const hashed = await hashPassword(PASSWORD);

  const [admin] = await db
    .insert(users)
    .values({ name: STAFF[0].name, email: STAFF[0].email, password: hashed, role: "superAdmin" })
    .returning({ id: users.id });

  const ops: SeedUserRef[] = [];
  for (const s of STAFF.slice(1)) {
    const [row] = await db
      .insert(users)
      .values({ name: s.name, email: s.email, password: hashed, role: "operationManager" })
      .returning({ id: users.id });
    ops.push({ id: row.id, email: s.email });
  }

  const customers: SeedUserRef[] = [];
  for (const c of CUSTOMERS) {
    const [row] = await db
      .insert(users)
      .values({ name: c.name, email: c.email, password: hashed, role: "user" })
      .returning({ id: users.id });
    customers.push({ id: row.id, email: c.email });
  }

  console.log(
    `✅ ${STAFF.length + CUSTOMERS.length} users seeded (${STAFF[0].email} / ${PASSWORD} = superAdmin)`
  );
  return { admin: { id: admin.id, email: STAFF[0].email }, ops, customers };
}