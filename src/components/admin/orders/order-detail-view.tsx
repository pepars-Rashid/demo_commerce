import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderDetailBody } from "@/components/admin/orders/order-detail-body";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import type { OrderDetail } from "@/lib/actions/order";

/**
 * READ-ONLY order detail (for op-manager and superAdmin in `?view=true`).
 * Deliberately has NO edit affordances — the status is a static badge only.
 */
export function OrderDetailView({ order }: { order: OrderDetail }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile/admin/orders" aria-label="رجوع إلى قائمة الطلبات">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              تفاصيل الطلب
            </h1>
            <p className="text-sm text-muted-foreground">
              طلب رقم #{order.id}
              <Badge variant="outline" className="ms-2">
                عرض فقط
              </Badge>
            </p>
          </div>
        </div>
      </div>

      <OrderDetailBody
        order={order}
        statusSlot={<OrderStatusBadge status={order.orderStatus} />}
      />
    </>
  );
}