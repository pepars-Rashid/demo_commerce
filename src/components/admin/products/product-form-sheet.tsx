"use client";

import { useLayoutEffect, useState } from "react";
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
  const { showModal, guard, cancel, confirm, disarm, goBack } =
    useLeaveGuard(isDirty);

  const isEdit = Boolean(product);

  // Derive the sheet's open state from the URL rather than a useState that
  // Cache Components / <Activity> would preserve and stick. Recomputing on
  // every render means reopening a product (URL → /products/[id] again)
  // always flips `open` back to true, and closing (URL → /products) sets it
  // false — no stale false, no ghost portal.
  const open = isModalProductRoute(pathname);

  // Remount the form on every open. Cache Components / <Activity> preserve
  // component state across route changes, so without this the form keeps its
  // previously-typed values and stale dirty flag between opens (reopening a
  // product would show discarded edits and re-prompt the unsaved-changes
  // dialog even though nothing was touched). A fresh `key` rebuilds the form
  // with the real defaultValues and `isDirty = false` each time we enter.
  // Force a fresh `ProductForm` every time this sheet hides (even when opening the
  // SAME product id again). Cache Components preserve state across navigations
  // via <Activity>; an effect cleanup runs when Activity hides content (official
  // pattern), so bumping `resetKey` remounts the form fresh (real defaultValues,
  // `isDirty = false`) each time we come back.
  const [resetKey, setResetKey] = useState(0);
  useLayoutEffect(() => {
    return () => setResetKey((k) => k + 1);
  }, []);

  // Close the sheet and return to the exact list state the user came from
  // (its page/search/filter query) — recorded right before the modal opened.
  // Falls back to the query-less list URL when nothing was captured (e.g. a
  // directly-loaded page), which cannot happen for the intercepted sheet.
  function exit() {
    goBack(() => router.replace("/profile/admin/products"));
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
              key={resetKey}
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
