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
import { CategoryForm } from "./category-form";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { useLeaveGuard } from "@/hooks/use-leave-guard";
import type { CategoryFormProps } from "./category-form";

/**
 * True while the current URL is a category modal route. The sheet only mounts
 * inside the `@modal` slot during an intercepted navigation; on the main page
 * (direct visit → `@modal` renders `default.tsx`) this isn't mounted at all.
 */
function isModalCategoryRoute(pathname: string): boolean {
  return /^\/profile\/admin\/categories\/(new|\d+)$/.test(pathname);
}

export function CategoryFormSheet({
  options,
  category,
  readOnly = false,
}: CategoryFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDirty, setIsDirty] = useState(false);
  const { showModal, guard, cancel, confirm, disarm, goBack } =
    useLeaveGuard(isDirty);

  const isEdit = Boolean(category);

  const open = isModalCategoryRoute(pathname);

  // Remount the form on every open so Cache Components / <Activity> don't
  // preserve stale values + dirty flag between opens.
  const [resetKey, setResetKey] = useState(0);
  useLayoutEffect(() => {
    return () => setResetKey((k) => k + 1);
  }, []);

  function exit() {
    goBack(() => router.replace("/profile/admin/categories"));
  }

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
              {isEdit ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "حدّث بيانات التصنيف (الاسم، الرابط، الأب)."
                : "أدخل بيانات التصنيف الجديد."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <CategoryForm
              key={resetKey}
              options={options}
              category={category}
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
