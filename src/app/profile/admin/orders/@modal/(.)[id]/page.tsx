import { getOrderById } from "@/lib/actions/order";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { OrderDetailSheet } from "@/components/admin/orders/order-detail-sheet";

interface InterceptedOrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function InterceptedOrderDetailPage({
  params,
  searchParams,
}: InterceptedOrderDetailPageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const orderId = parseInt(id, 10);
  if (Number.isNaN(orderId)) return null;

  const order = await getOrderById(orderId);
  if (!order) return null;

  const isView = view === "true";

  // Server-side role split inside the sheet too.
  if (order.canManage) {
    const admin = await requireSuperAdmin();
    if (!admin) return null;
    return <OrderDetailSheet order={order} canManage viewOnly={isView} />;
  }

  const viewer = await requireAdmin();
  if (!viewer) return null;
  return <OrderDetailSheet order={order} canManage={false} viewOnly />;
}
