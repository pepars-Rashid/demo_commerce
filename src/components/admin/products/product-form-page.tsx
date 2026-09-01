"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "./product-form";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { useLeaveGuard } from "@/hooks/use-leave-guard";
import type { Product, ProductCategory, ProductItem } from "@/lib/mock/types";

interface ProductFormPageProps {
  categories: ProductCategory[];
  product?: Product;
  productItems?: ProductItem[];
  readOnly?: boolean;
}

export function ProductFormPage(props: ProductFormPageProps) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const { showModal, guard, cancel, confirm, disarm, goBack } =
    useLeaveGuard(isDirty);

  // Return to the exact list state the user came from (its page/search/filter
  // query) — recorded right before opening this page from the list. Falls back
  // to the query-less list URL when nothing was captured (e.g. a direct load).
  function exit() {
    goBack(() => router.replace("/profile/admin/products"));
  }

  return (
    <>
      <div className="mb-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="رجوع إلى قائمة المنتجات"
          onClick={() => guard(exit)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <ProductForm
        {...props}
        layout="page"
        onDone={() => guard(exit)}
        onSaved={() => {
          disarm();
          exit();
        }}
        onDirtyChange={setIsDirty}
      />
      <UnsavedChangesDialog open={showModal} onStay={cancel} onExit={confirm} />
    </>
  );
}
