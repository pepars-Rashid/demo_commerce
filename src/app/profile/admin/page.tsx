import { Suspense } from "react";
import { KpiCards } from "@/components/admin/analytics/kpi-cards";
import { BestSellers } from "@/components/admin/analytics/best-sellers";
import {
  CategoryTreeIsland,
  InventoryReasonsIsland,
  OrdersStatusIsland,
  RevenueTrendIsland,
} from "@/components/admin/analytics/analytics-islands";
import {
  ChartSkeleton,
  ListSkeleton,
  ValueSkeleton,
} from "@/components/admin/analytics/analytics-skeleton";

function KpiFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <ValueSkeleton />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">مرحباً بك في لوحة التحكم</p>
        </div>
      </div>

      <Suspense fallback={<KpiFallback />}>
        <KpiCards />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <CategoryTreeIsland />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <OrdersStatusIsland />
        </Suspense>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <InventoryReasonsIsland />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueTrendIsland />
        </Suspense>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <BestSellers />
      </Suspense>
    </div>
  );
}
