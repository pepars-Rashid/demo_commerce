"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  OrderStatusBadge,
  orderStatusOptions,
} from "@/components/admin/order-status-badge";
import { updateOrderStatus } from "@/lib/actions/order";
import type { OrderStatus } from "@/lib/mock/types";

interface OrderStatusEditorProps {
  orderId: number;
  initialStatus: OrderStatus;
  /**
   * Reports whether the status currently differs from what's saved.
   * The parent uses this to arm/disarm the unsaved-changes guard.
   */
  onDirtyChange: (dirty: boolean) => void;
  /** Called immediately after a successful save. */
  onSaved?: () => void;
}

/**
 * superAdmin-only status editor. Lets the manager put the order in ANY state
 * (pending/paid/shipped/delivered/cancelled) to handle real-world edge cases.
 */
export function OrderStatusEditor({
  orderId,
  initialStatus,
  onDirtyChange,
  onSaved,
}: OrderStatusEditorProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  // Baseline of the last state saved to the DB (so "dirty" resets after saving).
  const [lastSaved, setLastSaved] = useState<OrderStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const dirty = status !== lastSaved;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  function save() {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status);
        setLastSaved(status);
        toast.success("تم تحديث حالة الطلب");
        onSaved?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={(value) => setStatus(value as OrderStatus)}
      >
        <SelectTrigger className="w-auto" aria-label="حالة الطلب">
          <OrderStatusBadge status={status} />
        </SelectTrigger>
        <SelectContent>
          {orderStatusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        type="button"
        onClick={save}
        disabled={!dirty || isPending}
      >
        {isPending ? "جاري الحفظ…" : "حفظ الحالة"}
      </Button>
    </div>
  );
}