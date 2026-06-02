import { z } from "zod"

export const loginSchema = z.object({
  email: z.email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(128, "كلمة المرور طويلة جداً"),
})

export type LoginSchema = z.infer<typeof loginSchema>