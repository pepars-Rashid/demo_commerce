import { z } from "zod"

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "الاسم يجب أن يكون حرفين على الأقل")
      .max(64, "الاسم طويل جداً"),
    email: z.email("يرجى إدخال بريد إلكتروني صحيح"),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .max(128, "كلمة المرور طويلة جداً"),
    confirmPassword: z.string().min(1, "يرجى تأكيد كلمة المرور"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمة المرور غير متطابقة",
    path: ["confirmPassword"],
  })

export type SignupSchema = z.infer<typeof signupSchema>