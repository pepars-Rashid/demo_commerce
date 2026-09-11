import { z } from "zod";

export const categorySchema = z.object({
  categoryName: z
    .string()
    .min(1, "اسم التصنيف مطلوب")
    .max(255, "الاسم طويل جداً"),
  slug: z
    .string()
    .min(1, "الرابط (Slug) مطلوب")
    .regex(
      /^[a-z0-9]+([-/][a-z0-9]+)*$/,
      "أحرف لاتينية صغيرة وأرقام وشرطات فقط"
    ),
  // "" = top-level category (no parent).
  parentCategoryId: z.string().optional().default(""),
  categoryImage: z.string().optional().default(""),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
