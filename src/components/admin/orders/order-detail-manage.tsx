"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderDetailBody } from "@/components/admin/orders/order-detail-body";
import { OrderStatusEditor } from "@/components/admin/orders/order-status-editor";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { useLeaveGuard } from "@/hooks/use-leave-guard";
import type { OrderDetail } from "@/lib/actions/order";

/**
 * superAdmin manage view. Adds the status editor (any status allowed) with an
 * unsaved-changes guard: only status can change here, so the dirty surface is
 * tiny but still protected from accidental navigation away.
 */
export function OrderDetailManage({
  order,
  viewOnly = false,
}: {
  order: OrderDetail;
  viewOnly?: boolean;
}) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  // View-only never arms the guard (stale dirty from an edit session must not
  // resurface on a read-only view).
  const { showModal, guard, cancel, confirm, disarm, goBack } =
    useLeaveGuard(isDirty && !viewOnly);

  function exit() {
    goBack(() => router.replace("/profile/admin/orders"));
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="رجوع إلى قائمة الطلبات"
            onClick={() => guard(exit)}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {viewOnly ? "تفاصيل الطلب" : "إدارة الطلب"}
            </h1>
            <p className="text-sm text-muted-foreground">
              طلب رقم #{order.id}
              {viewOnly ? (
                <Badge variant="outline" className="ms-2">
                  عرض
                </Badge>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <OrderDetailBody
        order={order}
        statusSlot={
          viewOnly ? (
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

      <UnsavedChangesDialog open={showModal} onStay={cancel} onExit={confirm} />
    </>
  );
}