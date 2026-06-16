import type { User } from "./types";

export const users: User[] = [
  {
    id: "user_admin",
    name: "أحمد المدير",
    email: "admin@demo-commerce.sa",
    emailVerified: true,
    image: null,
    role: "superAdmin",
  },
  {
    id: "user_sara",
    name: "سارة العتيبي",
    email: "sara@example.com",
    emailVerified: true,
    image: null,
    role: "user",
  },
  {
    id: "user_khaled",
    name: "خالد الدوسري",
    email: "khaled@example.com",
    emailVerified: false,
    image: null,
    role: "user",
  },
  {
    id: "user_noura",
    name: "نورة القحطاني",
    email: "noura@example.com",
    emailVerified: true,
    image: null,
    role: "user",
  },
  {
    id: "user_faisal",
    name: "فيصل الشهري",
    email: "faisal@example.com",
    emailVerified: true,
    image: null,
    role: "superAdmin",
  },
  {
    id: "user_reem",
    name: "ريم الحربي",
    email: "reem@example.com",
    emailVerified: false,
    image: null,
    role: "user",
  },
];

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getUserName(id: string): string {
  return users.find((u) => u.id === id)?.name ?? "—";
}
