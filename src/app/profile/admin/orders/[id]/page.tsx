import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/actions/order";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { OrderDetailView } from "@/components/admin/orders/order-detail-view";
import { OrderDetailManage } from "@/components/admin/orders/order-detail-manage";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: OrderDetailPageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const orderId = parseInt(id, 10);
  if (Number.isNaN(orderId)) notFound();

  const order = await getOrderById(orderId);
  if (!order) notFound();

  // Server-side role split: superAdmin gets the manage surface (respecting
  // ?view=true); operationManager always gets a separate read-only view.
  if (order.canManage) {
    const admin = await requireSuperAdmin();
    if (!admin) return null;
    return <OrderDetailManage order={order} viewOnly={view === "true"} />;
  }

  const viewer = await requireAdmin();
  if (!viewer) return null;
  return <OrderDetailView order={order} />;
}
