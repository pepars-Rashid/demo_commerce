import { z } from "zod";

/**
 * Form schema for a manual (superAdmin) inventory log entry.
 * `direction` + `amount` are combined server-side into a signed `change`
 * (positive = stock in, negative = stock out).
 */
export const inventoryLogSchema = z.object({
  // SKU entered as free text by an admin; resolved to a product_item server-side.
  sku: z
    .string()
    .trim()
    .min(1, "رمز SKU مطلوب")
    .max(64, "رمز SKU طويل جداً"),
  direction: z.enum(["in", "out"], "يرجى اختيار الاتجاه"),
  amount: z.coerce
    .number()
    .int("الكمية يجب أن تكون رقماً صحيحاً")
    .refine((value) => value > 0, "الكمية يجب أن تكون أكبر من صفر"),
  reason: z
    .string()
    .trim()
    .min(3, "السبب مطلوب")
    .max(255, "السبب طويل جداً"),
});

export type InventoryLogFormValues = z.infer<typeof inventoryLogSchema>;