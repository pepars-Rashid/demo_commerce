import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateTime } from "@/lib/admin-format";
import type { OrderDetail } from "@/lib/actions/order";

interface OrderDetailBodyProps {
  order: OrderDetail;
  /** Rendered where the status normally sits (read badge or editing controls). */
  statusSlot?: ReactNode;
}

/**
 * Shared presentational body for an order's detail.
 * Top = shop_order summary (customer, date, status, addresses, total), then a
 * list of order_line cards with brief product details and a link to the
 * product's admin view page.
 */
export function OrderDetailBody({ order, statusSlot }: OrderDetailBodyProps) {
  return (
    <div className="space-y-6">
      {/* ── Order summary (shop_order info) ─────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>ملخص الطلب</CardTitle>
          <span className="text-lg font-bold underline">
            {formatCurrency(Number(order.orderTotal))}
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {statusSlot ?? null}
            <span className="text-sm text-muted-foreground">
              {formatDateTime(order.orderDate)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                العميل
              </p>
              <p className="text-sm font-medium">
                {order.customerName ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.customerEmail ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                تاريخ الإنشاء
              </p>
              <p className="text-sm">{formatDateTime(order.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                عنوان الشحن
              </p>
              <p className="text-sm leading-relaxed">
                {order.shippingAddress}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                عنوان الفوترة
              </p>
              <p className="text-sm leading-relaxed">
                {order.billingAddress}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Order lines (order_line cards) ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            عناصر الطلب{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({order.lines.length} سطر · {order.totalQty} قطعة)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد عناصر.</p>
          ) : (
            order.lines.map((line, index) => (
              <div key={line.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {line.productId != null ? (
                      <Link
                        href={`/profile/admin/products/${line.productId}?view=true`}
                        className="text-sm font-medium underline"
                      >
                        {line.productName ?? "منتج غير متوفر"}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        {line.productName ?? "منتج غير متوفر"}
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {line.sku ? (
                        <span className="font-mono">{line.sku}</span>
                      ) : null}
                      {Object.entries(line.variantsJson).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="text-[10px]">
                          {k}: {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {line.qty} × {formatCurrency(Number(line.price))}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(Number(line.lineTotal))}
                    </span>
                  </div>
                </div>
                {index < order.lines.length - 1 ? (
                  <Separator className="my-2" />
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}