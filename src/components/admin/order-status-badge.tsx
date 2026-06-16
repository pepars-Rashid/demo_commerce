import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/mock/types";

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "قيد الانتظار",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  paid: {
    label: "مدفوع",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  },
  shipped: {
    label: "تم الشحن",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  },
  delivered: {
    label: "تم التسليم",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  cancelled: {
    label: "ملغي",
    className: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
};

export const orderStatusOptions = (
  Object.keys(statusConfig) as OrderStatus[]
).map((value) => ({ value, label: statusConfig[value].label }));

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
