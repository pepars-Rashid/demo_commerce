"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { IconActionButton } from "@/components/admin/icon-action-button";
import type { Product, ProductCategory, ProductItem } from "@/lib/mock/types";
import type { ProductFormValues } from "@/lib/zod/product";
import { productSchema } from "@/lib/zod/product";

interface ProductFormProps {
  categories: ProductCategory[];
  product?: Product;
  productItems?: ProductItem[];
  onDone?: () => void;
  layout?: "sheet" | "page";
  readOnly?: boolean;
}

function variantsToRows(variantsJson: Record<string, string>) {
  return Object.entries(variantsJson).map(([key, value]) => ({
    key,
    value,
  }));
}

function rowsToVariants(
  rows: { key: string; value: string }[],
): Record<string, string> {
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

function defaultValues(
  product?: Product,
  productItems?: ProductItem[],
): ProductFormValues {
  if (!product) {
    return {
      name: "",
      description: "",
      basePrice: 0,
      productImage: "",
      categoryId: "",
      items: [
        {
          sku: "",
          price: 0,
          discountPrice: null,
          qtyInStock: 0,
          variants: [{ key: "", value: "" }],
        },
      ],
    };
  }

  return {
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    productImage: product.productImage ?? "",
    categoryId: product.categoryId,
    items: (productItems ?? []).map((i) => ({
      sku: i.sku,
      price: i.price,
      discountPrice: i.discountPrice,
      qtyInStock: i.qtyInStock,
      variants:
        Object.keys(i.variantsJson).length > 0
          ? variantsToRows(i.variantsJson)
          : [{ key: "", value: "" }],
    })),
  };
}

export function ProductForm({
  categories,
  product,
  productItems = [],
  onDone,
  layout = "sheet",
  readOnly = false,
}: ProductFormProps) {
  const isEdit = Boolean(product);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: defaultValues(product, productItems),
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control, name: "items" });

  async function onSubmit(_data: ProductFormValues) {
    // UI only — no persistence. Real save wires in later.
    // Simulate a brief delay so the user sees the loading state.
    await new Promise((r) => setTimeout(r, 600));
    toast.success("تم الحفظ بنجاح");
    onDone?.();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      {/* ─── Product fields ─── */}
      <div
        className={
          layout === "page"
            ? "grid gap-4 sm:grid-cols-2"
            : "grid gap-4"
        }
      >
        {/* Name */}
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="name">اسم المنتج</FieldLabel>
          <FieldContent>
            <Input
              id="name"
              {...register("name")}
              disabled={readOnly || isSubmitting}
              placeholder="مثال: آيفون 15 برو"
              aria-invalid={!!errors.name}
            />
            <FieldError errors={errors.name ? [errors.name] : undefined} />
          </FieldContent>
        </Field>

        {/* Description */}
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="description">الوصف</FieldLabel>
          <FieldContent>
            <Textarea
              id="description"
              {...register("description")}
              disabled={readOnly || isSubmitting}
              placeholder="وصف موجز للمنتج"
              rows={3}
              aria-invalid={!!errors.description}
            />
            <FieldError
              errors={errors.description ? [errors.description] : undefined}
            />
          </FieldContent>
        </Field>

        {/* Base price */}
        <Field>
          <FieldLabel htmlFor="basePrice">السعر الأساسي (ر.س)</FieldLabel>
          <FieldContent>
            <Input
              id="basePrice"
              type="number"
              inputMode="numeric"
              {...register("basePrice")}
              disabled={readOnly || isSubmitting}
              placeholder="0"
              aria-invalid={!!errors.basePrice}
            />
            <FieldError
              errors={errors.basePrice ? [errors.basePrice] : undefined}
            />
          </FieldContent>
        </Field>

        {/* Category */}
        <Field>
          <FieldLabel htmlFor="categoryId">التصنيف</FieldLabel>
          <FieldContent>
            <Select
              value={form.watch("categoryId")}
              onValueChange={(value) =>
                form.setValue("categoryId", value, { shouldValidate: true })
              }
              disabled={readOnly || isSubmitting}
            >
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={errors.categoryId ? [errors.categoryId] : undefined}
            />
          </FieldContent>
        </Field>

        {/* Image URL */}
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="productImage">رابط صورة المنتج</FieldLabel>
          <FieldContent>
            <Input
              id="productImage"
              {...register("productImage")}
              disabled={readOnly || isSubmitting}
              placeholder="https://..."
              aria-invalid={!!errors.productImage}
            />
            <FieldError
              errors={
                errors.productImage ? [errors.productImage] : undefined
              }
            />
          </FieldContent>
        </Field>
      </div>

      <Separator />

      {/* ─── Variant items ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">المتغيرات (SKUs)</h3>
            <p className="text-xs text-muted-foreground">
              أضف متغيرات المنتج بأسعارها ومخزونها
            </p>
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                appendItem({
                  sku: "",
                  price: 0,
                  discountPrice: null,
                  qtyInStock: 0,
                  variants: [{ key: "", value: "" }],
                })
              }
            >
              <Plus className="h-4 w-4" />
              إضافة متغير
            </Button>
          )}
        </div>

        {errors.items?.message && (
          <p className="text-sm font-normal text-destructive">
            {errors.items.message}
          </p>
        )}

        <div className="space-y-3">
          {itemFields.map((itemField, itemIndex) => (
            <VariantItemCard
              key={itemField.id}
              itemIndex={itemIndex}
              control={control}
              register={register}
              errors={errors}
              isSubmitting={isSubmitting}
              readOnly={readOnly}
              canRemove={itemFields.length > 1}
              onRemove={() => removeItem(itemIndex)}
            />
          ))}
        </div>
      </div>

      {/* ─── Actions ─── */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-2 pt-2">
          {onDone ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onDone}
            >
              إلغاء
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {isSubmitting
              ? "جاري الحفظ..."
              : isEdit
                ? "حفظ التغييرات"
                : "إضافة المنتج"}
          </Button>
        </div>
      )}
    </form>
  );
}

/* ─── Internal sub-component ─── */

interface VariantItemCardProps {
  itemIndex: number;
  control: ReturnType<typeof useForm<ProductFormValues>>["control"];
  register: ReturnType<typeof useForm<ProductFormValues>>["register"];
  errors: ReturnType<typeof useForm<ProductFormValues>>["formState"]["errors"];
  isSubmitting: boolean;
  readOnly: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

function VariantItemCard({
  itemIndex,
  control,
  register,
  errors,
  isSubmitting,
  readOnly,
  canRemove,
  onRemove,
}: VariantItemCardProps) {
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: `items.${itemIndex}.variants`,
  });

  const itemErrors = errors.items?.[itemIndex];

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          المتغير {itemIndex + 1}
        </span>
        {!readOnly && (
          <IconActionButton
            type="button"
            size="icon-sm"
            label="حذف المتغير"
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
            disabled={!canRemove || isSubmitting}
          >
            <Trash2 className="h-4 w-4" />
          </IconActionButton>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* SKU */}
        <Field>
          <FieldLabel className="text-xs">رمز المنتج (SKU)</FieldLabel>
          <FieldContent>
            <Input
              {...register(`items.${itemIndex}.sku`)}
              disabled={readOnly || isSubmitting}
              placeholder="SKU-001"
              aria-invalid={!!itemErrors?.sku}
            />
            <FieldError
              errors={itemErrors?.sku ? [itemErrors.sku as { message?: string }] : undefined}
            />
          </FieldContent>
        </Field>

        {/* Qty in stock */}
        <Field>
          <FieldLabel className="text-xs">المخزون</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              inputMode="numeric"
              {...register(`items.${itemIndex}.qtyInStock`)}
              disabled={readOnly || isSubmitting}
              placeholder="0"
              aria-invalid={!!itemErrors?.qtyInStock}
            />
            <FieldError
              errors={
                itemErrors?.qtyInStock
                  ? [itemErrors.qtyInStock as { message?: string }]
                  : undefined
              }
            />
          </FieldContent>
        </Field>

        {/* Price */}
        <Field>
          <FieldLabel className="text-xs">السعر (ر.س)</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              inputMode="numeric"
              {...register(`items.${itemIndex}.price`)}
              disabled={readOnly || isSubmitting}
              placeholder="0"
              aria-invalid={!!itemErrors?.price}
            />
            <FieldError
              errors={
                itemErrors?.price
                  ? [itemErrors.price as { message?: string }]
                  : undefined
              }
            />
          </FieldContent>
        </Field>

        {/* Discount price */}
        <Field>
          <FieldLabel className="text-xs">سعر الخصم (ر.س)</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              inputMode="numeric"
              {...register(`items.${itemIndex}.discountPrice`)}
              disabled={readOnly || isSubmitting}
              placeholder="اختياري"
              aria-invalid={!!itemErrors?.discountPrice}
            />
            <FieldError
              errors={
                itemErrors?.discountPrice
                  ? [itemErrors.discountPrice as { message?: string }]
                  : undefined
              }
            />
          </FieldContent>
        </Field>

        {/* ─── Structured variants (key/value rows) ─── */}
        <Field className="sm:col-span-2">
          <FieldLabel className="text-xs">المتغيرات</FieldLabel>
          <FieldContent className="space-y-2">
            {variantFields.map((vf, vIndex) => (
              <div key={vf.id} className="flex items-start gap-2">
                <Input
                  {...register(
                    `items.${itemIndex}.variants.${vIndex}.key`,
                  )}
                  disabled={readOnly || isSubmitting}
                  placeholder="مثال: اللون"
                  className="flex-1"
                  aria-invalid={
                    !!itemErrors?.variants?.[vIndex]?.key
                  }
                />
                <Input
                  {...register(
                    `items.${itemIndex}.variants.${vIndex}.value`,
                  )}
                  disabled={readOnly || isSubmitting}
                  placeholder="مثال: أسود"
                  className="flex-1"
                  aria-invalid={
                    !!itemErrors?.variants?.[vIndex]?.value
                  }
                />
                {!readOnly && variantFields.length > 1 && (
                  <IconActionButton
                    type="button"
                    size="icon-sm"
                    label="حذف"
                    variant="ghost"
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeVariant(vIndex)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconActionButton>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={() => appendVariant({ key: "", value: "" })}
                className="gap-1 text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة متغير
              </Button>
            )}
            <FieldError
              errors={
                itemErrors?.variants
                  ? [
                      ...(Array.isArray(itemErrors.variants)
                        ? itemErrors.variants
                        : []),
                    ]
                  : undefined
              }
            />
          </FieldContent>
        </Field>
      </div>
    </div>
  );
}