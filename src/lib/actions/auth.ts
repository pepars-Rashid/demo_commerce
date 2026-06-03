"use server";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { signupSchema } from "@/lib/zod/signup";

export type SignupResult =
  | { success: true }
  | { success: false; error: string };

export async function signupAction(
  prevState: SignupResult | undefined,
  formData: FormData,
): Promise<SignupResult> {
  // 1. Validate form fields
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "بيانات غير صحيحة";
    return { success: false, error: firstError };
  }

  const { name, email, password } = parsed.data;

  try {
    // 2. Check duplicate email
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
    }

    // 3. Hash password and create user
    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });
  } catch {
    return {
      success: false,
      error: "حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى",
    };
  }

  return { success: true };
}