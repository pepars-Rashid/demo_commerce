"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductForm } from "./product-form";
import type {
  Product,
  ProductCategory,
  ProductItem,
} from "@/lib/mock/types";

interface ProductFormSheetProps {
  categories: ProductCategory[];
  product?: Product;
  productItems?: ProductItem[];
}

export function ProductFormSheet({
  categories,
  product,
  productItems,
}: ProductFormSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  // Closing the sheet returns to the underlying list page.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      router.back();
    }
  }

  const isEdit = Boolean(product);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="w-full gap-0 overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "حدّث بيانات المنتج ومتغيراته."
              : "أدخل بيانات المنتج وأضف متغيراته."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ProductForm
            categories={categories}
            product={product}
            productItems={productItems}
            onDone={() => handleOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
