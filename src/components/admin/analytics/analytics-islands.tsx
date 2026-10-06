import {
  getCategoryTreeStats,
  getInventoryByReason,
  getOrdersByStatus,
  getRevenueTrend,
} from "@/lib/actions/analytics";
import { OrdersStatusBar } from "./orders-status-bar";
import { InventoryReasonsPie } from "./inventory-reasons-pie";
import { CategoryTreePie } from "./category-tree-pie";
import { RevenueTrendLine } from "./revenue-trend-line";

/** Server islands — each streams one cached aggregation to its chart. */
export async function OrdersStatusIsland() {
  const data = await getOrdersByStatus();
  return <OrdersStatusBar data={data} />;
}

export async function InventoryReasonsIsland() {
  const data = await getInventoryByReason();
  return <InventoryReasonsPie data={data} />;
}

export async function CategoryTreeIsland() {
  const data = await getCategoryTreeStats();
  return <CategoryTreePie data={data} />;
}

export async function RevenueTrendIsland() {
  const data = await getRevenueTrend();
  return <RevenueTrendLine data={data} />;
}
