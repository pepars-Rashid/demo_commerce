import { z } from "zod";

export const productItemSchema = z.object({
  key: z.string().optional(),
  sku: z.string().min(1, "رمز المنتج (SKU) مطلوب"),
  price: z.coerce.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
  discountPrice: z.coerce
    .number()
    .min(0, "سعر الخصم يجب أن يكون 0 أو أكثر")
    .optional()
    .nullable(),
  qtyInStock: z.coerce
    .number()
    .int()
    .min(0, "المخزون يجب أن يكون 0 أو أكثر"),
  images: z.array(z.string()).default([]),
  variants: z
    .array(
      z.object({
        key: z.string().min(1, "مفتاح المتغير مطلوب"),
        value: z.string().min(1, "قيمة المتغير مطلوبة"),
      }),
    )
    .min(1, "أضف متغيراً واحداً على الأقل"),
});

export const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().optional().nullable(),
  basePrice: z.coerce.number().min(0, "السعر الأساسي يجب أن يكون 0 أو أكثر"),
  productImage: z.string().min(1, "صورة المنتج مطلوبة"),
  categoryId: z.string().min(1, "يرجى اختيار التصنيف"),
  items: z
    .array(productItemSchema)
    .min(1, "أضف متغيراً واحداً على الأقل"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductItemFormValues = z.infer<typeof productItemSchema>;