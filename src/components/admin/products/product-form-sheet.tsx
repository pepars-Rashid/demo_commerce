"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductForm } from "./product-form";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { useLeaveGuard } from "@/hooks/use-leave-guard";
import type { Product, ProductCategory, ProductItem } from "@/lib/mock/types";

interface ProductFormSheetProps {
  categories: ProductCategory[];
  product?: Product;
  productItems?: ProductItem[];
  readOnly?: boolean;
}

/**
 * True while the current URL is a product modal route. The sheet only ever
 * mounts inside the `@modal` slot during an intercepted navigation, so on the
 * main page (direct visit → `@modal` renders `default.tsx`) this component
 * isn't mounted at all. `usePathname()` returns the masked browser URL which
 * is exactly the modal route when interception is active.
 */
function isModalProductRoute(pathname: string): boolean {
  return /^\/profile\/admin\/products\/(new|\d+)$/.test(pathname);
}

export function ProductFormSheet({
  categories,
  product,
  productItems,
  readOnly = false,
}: ProductFormSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDirty, setIsDirty] = useState(false);
  const { showModal, guard, cancel, confirm, disarm } = useLeaveGuard(isDirty);

  const isEdit = Boolean(product);

  // Derive the sheet's open state from the URL rather than a useState that
  // Cache Components / <Activity> would preserve and stick. Recomputing on
  // every render means reopening a product (URL → /products/[id] again)
  // always flips `open` back to true, and closing (URL → /products) sets it
  // false — no stale false, no ghost portal.
  const open = isModalProductRoute(pathname);

  // Close the sheet AND navigate to the list. Used by every guarded exit.
  function exit() {
    router.replace("/profile/admin/products");
  }

  // X, outside click, or Escape → treat as a leave attempt.
  function handleOpenChange(next: boolean) {
    if (!next) {
      guard(exit);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
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
                ? "حدّث بيانات المنتج ومتغيّراته."
                : "أدخل بيانات المنتج وأضف متغيّراته."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProductForm
              categories={categories}
              product={product}
              productItems={productItems}
              readOnly={readOnly}
              onDone={() => guard(exit)}
              onSaved={() => {
                disarm();
                exit();
              }}
              onDirtyChange={setIsDirty}
            />
          </div>
        </SheetContent>
      </Sheet>
      <UnsavedChangesDialog open={showModal} onStay={cancel} onExit={confirm} />
    </>
  );
}
