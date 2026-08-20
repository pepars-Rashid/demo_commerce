"use client";

import { useRouter } from "next/navigation";
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
  readOnly?: boolean;
}

export function ProductFormSheet({
  categories,
  product,
  productItems,
  readOnly = false,
}: ProductFormSheetProps) {
  const router = useRouter();

  // The sheet is open because this intercepted route is rendered.
  // No useState — closing just navigates back to the list.
  function handleOpenChange(next: boolean) {
    if (!next) {
      router.back();
    }
  }

  const isEdit = Boolean(product);

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
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
            readOnly={readOnly}
            onDone={() => handleOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
