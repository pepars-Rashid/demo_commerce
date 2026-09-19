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
import { OrderDetailBody } from "@/components/admin/orders/order-detail-body";
import { OrderStatusEditor } from "@/components/admin/orders/order-status-editor";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { useLeaveGuard } from "@/hooks/use-leave-guard";
import type { OrderDetail } from "@/lib/actions/order";

interface OrderDetailSheetProps {
  order: OrderDetail;
  /** Whether the current session may edit (superAdmin). */
  canManage: boolean;
  /** Force read-only (e.g. ?view=true). */
  viewOnly?: boolean;
}

/** True while the current URL is an order modal route (intercepted navigation). */
function isModalOrderRoute(pathname: string): boolean {
  return /^\/profile\/admin\/orders\/\d+$/.test(pathname);
}

/**
 * Sheet modal for an order's detail.
 * - superAdmin (canManage && !viewOnly): manage — status Select + leave guard.
 * - operationManager (or ?view=true): read-only — static status badge, no
 *   edit affordance (a completely different, view-only presentation).
 */
export function OrderDetailSheet({
  order,
  canManage,
  viewOnly = false,
}: OrderDetailSheetProps) {
  const router = useRouter();
  const pathname = usePathname();

  // View-only (op-manager, or ?view=true) must NOT arm the router guard — a
  // stale `isDirty` left over from a previous edit session would otherwise make
  // it show the unsaved-changes dialog on a read-only view. Only actual edits
  // arm the guard; view never does.
  const readOnly = !canManage || viewOnly;

  const [isDirty, setIsDirty] = useState(false);
  const { showModal, guard, cancel, confirm, disarm, goBack } =
    useLeaveGuard(isDirty && !readOnly);

  // Derive open state from the URL (products pattern) so Cache Components /
  // <Activity> never stick a stale open/closed value.
  const open = isModalOrderRoute(pathname);

  // Remount on every open so the previous status edit state / dirty flag reset.
  const [resetKey, setResetKey] = useState(0);
  useLayoutEffect(() => {
    return () => setResetKey((k) => k + 1);
  }, []);

  function exit() {
    goBack(() => router.replace("/profile/admin/orders"));
  }

  function handleOpenChange(next: boolean) {
    if (!next) guard(exit);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto sm:max-w-xl"
        >
          <SheetHeader>
            <SheetTitle>{readOnly ? "تفاصيل الطلب" : "إدارة الطلب"}</SheetTitle>
            <SheetDescription>طلب رقم #{order.id}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <OrderDetailBody
              key={resetKey}
              order={order}
              statusSlot={
                readOnly ? (
                  <OrderStatusBadge status={order.orderStatus} />
                ) : (
                  <OrderStatusEditor
                    orderId={order.id}
                    initialStatus={order.orderStatus}
                    onDirtyChange={setIsDirty}
                    onSaved={disarm}
                  />
                )
              }
            />
          </div>
        </SheetContent>
      </Sheet>
      <UnsavedChangesDialog open={showModal} onStay={cancel} onExit={confirm} />
    </>
  );
}