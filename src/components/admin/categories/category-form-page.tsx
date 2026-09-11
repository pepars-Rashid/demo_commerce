"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "./category-form";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { useLeaveGuard } from "@/hooks/use-leave-guard";
import type { CategoryFormProps } from "./category-form";

export function CategoryFormPage(props: CategoryFormProps) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const { showModal, guard, cancel, confirm, disarm, goBack } =
    useLeaveGuard(isDirty);

  function exit() {
    goBack(() => router.replace("/profile/admin/categories"));
  }

  return (
    <>
      <div className="mb-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="رجوع إلى قائمة التصنيفات"
          onClick={() => guard(exit)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <CategoryForm
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
