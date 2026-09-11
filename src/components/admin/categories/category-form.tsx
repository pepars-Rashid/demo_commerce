"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Expand, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ImageManagerDialog } from "@/components/upload/image-manager-dialog";
import { ImageLightbox } from "@/components/upload/image-lightbox";
import { createCategory, updateCategory } from "@/lib/actions/category";
import type { CategoryFormValues } from "@/lib/zod/category";
import { categorySchema } from "@/lib/zod/category";
import type { Resolver } from "react-hook-form";

interface CategoryOption {
  id: number;
  categoryName: string;
  depth: number;
}

export interface CategoryFormProps {
  options: CategoryOption[];
  category?: {
    id: string;
    categoryName: string;
    slug: string;
    categoryImage: string | null;
    parentCategoryId: number | null;
  };
  onDone?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSaved?: () => void;
  layout?: "sheet" | "page";
  readOnly?: boolean;
}

function defaultValues(
  category?: CategoryFormProps["category"],
): CategoryFormValues {
  return {
    categoryName: category?.categoryName ?? "",
    slug: category?.slug ?? "",
    parentCategoryId: category?.parentCategoryId
      ? String(category.parentCategoryId)
      : "",
    categoryImage: category?.categoryImage ?? "",
  };
}

export function CategoryForm({
  options,
  category,
  onDone,
  onDirtyChange,
  onSaved,
  layout = "sheet",
  readOnly = false,
}: CategoryFormProps) {
  const isEdit = Boolean(category);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryFormValues>,
    defaultValues: defaultValues(category),
  });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const image = useWatch({ control: form.control, name: "categoryImage" });
  const parentValue = useWatch({
    control: form.control,
    name: "parentCategoryId",
  });

  async function onSubmit(data: CategoryFormValues) {
    try {
      // Client-side max-depth guard: a child under a level-3 parent is level 4.
      if (data.parentCategoryId) {
        const parentId = Number(data.parentCategoryId);
        const parentOption = options.find((o) => o.id === parentId);
        if (parentOption && parentOption.depth >= 3) {
          toast.error("لا يمكن أن يتجاوز التصنيف 3 مستويات");
          return;
        }
      }

      if (isEdit && category?.id) {
        const id = parseInt(category.id, 10);
        if (!Number.isNaN(id)) {
          const res = await updateCategory(id, data);
          if (res && res.error === "slug_taken") {
            toast.error("الرابط (Slug) مستخدم بالفعل");
            return;
          }
          if (res && res.error === "cycle") {
            toast.error("لا يمكن جعل التصنيف أصلاً لنفسه أو لأحد فروعه");
            return;
          }
          if (res && res.error === "max_depth") {
            toast.error("لا يمكن أن يتجاوز التصنيف 3 مستويات");
            return;
          }
        }
        toast.success("تم حفظ التغيير بنجاح");
        onDirtyChange?.(false);
        onSaved?.();
      } else {
        const res = await createCategory(data);
        if (res && res.error === "slug_taken") {
          toast.error("الرابط (Slug) مستخدم بالفعل");
          return;
        }
        if (res && res.error === "cycle") {
          toast.error("لا يمكن جعل التصنيف أصلاً لنفسه أو لأحد فروعه");
          return;
        }
        if (res && res.error === "max_depth") {
          toast.error("لا يمكن أن يتجاوز التصنيف 3 مستويات");
          return;
        }
        toast.success("تمت إضافة التصنيف بنجاح");
        form.reset(defaultValues());
        onDirtyChange?.(false);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <div
        className={
          layout === "page"
            ? "grid gap-4 sm:grid-cols-2"
            : "grid gap-4"
        }
      >
        {/* Name */}
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="categoryName">اسم التصنيف</FieldLabel>
          <FieldContent>
            <Input
              id="categoryName"
              {...register("categoryName")}
              disabled={readOnly || isSubmitting}
              placeholder="مثال: إلكترونيات"
              aria-invalid={!!errors.categoryName}
            />
            <FieldError
              errors={errors.categoryName ? [errors.categoryName] : undefined}
            />
          </FieldContent>
        </Field>

        {/* Slug */}
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="slug">الرابط (Slug)</FieldLabel>
          <FieldContent>
            <Input
              id="slug"
              dir="ltr"
              {...register("slug")}
              disabled={readOnly || isSubmitting}
              placeholder="electronics"
              aria-invalid={!!errors.slug}
            />
            <FieldError errors={errors.slug ? [errors.slug] : undefined} />
          </FieldContent>
        </Field>

        {/* Parent */}
        <Field>
          <FieldLabel htmlFor="parentCategoryId">التصنيف الأب</FieldLabel>
          <FieldContent>
            <Select
              value={parentValue}
              onValueChange={(value) =>
                setValue("parentCategoryId", value === "none" ? "" : value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              disabled={readOnly || isSubmitting}
            >
              <SelectTrigger id="parentCategoryId" className="w-full">
                <SelectValue placeholder="بدون تصنيف أب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون تصنيف أب</SelectItem>
                {options.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={
                errors.parentCategoryId
                  ? [errors.parentCategoryId]
                  : undefined
              }
            />
          </FieldContent>
        </Field>

        {/* Image */}
        <Field className="sm:col-span-2">
          <FieldLabel>صورة التصنيف</FieldLabel>
          <FieldContent>
            {image ? (
              <div className="flex flex-col items-start gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-background">
                  <Image
                    fill
                    src={image}
                    alt="صورة التصنيف"
                    className="object-cover"
                    sizes="96px"
                  />
                  <button
                    type="button"
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => setLightboxOpen(true)}
                    aria-label="تكبير الصورة"
                  >
                    <Expand className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="flex w-full flex-col items-start gap-2">
                  <p className="text-sm font-medium">الصورة الرئيسية</p>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => setDialogOpen(true)}
                    >
                      <ImagePlus className="h-4 w-4" />
                      تغيير الصورة
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              !readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed py-8"
                  disabled={isSubmitting}
                  onClick={() => setDialogOpen(true)}
                >
                  <ImagePlus className="h-4 w-4" />
                  رفع صورة التصنيف
                </Button>
              )
            )}
            <FieldError
              errors={errors.categoryImage ? [errors.categoryImage] : undefined}
            />
          </FieldContent>
        </Field>

        <ImageManagerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initialImages={image ? [image] : []}
          maxFiles={1}
          replaceMode
          readOnly={readOnly}
          title="صورة التصنيف"
          description="اختر الصورة الرئيسية للتصنيف — اختيارية"
          onSave={(images) => {
            setValue("categoryImage", images[0] ?? "", {
              shouldValidate: true,
              shouldDirty: true,
            });
            setDialogOpen(false);
          }}
        />

        {image && (
          <ImageLightbox
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
            src={image}
            alt="صورة التصنيف"
          />
        )}
      </div>

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
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {isSubmitting
              ? "جاري الحفظ..."
              : isEdit
                ? "حفظ التغييرات"
                : "إضافة التصنيف"}
          </Button>
        </div>
      )}
    </form>
  );
}
