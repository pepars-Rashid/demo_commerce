import { Suspense } from "react";
import { getOrders } from "@/lib/actions/order";
import { OrderListClient } from "@/components/admin/orders/order-list-client";

interface OrdersPageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const sp = await searchParams;

  const page = parseInt(sp.page ?? "1", 10) || 1;
  const search = sp.search ?? "";
  const status = sp.status ?? "";

  const data = await getOrders({
    page,
    pageSize: 10,
    search: search || undefined,
    status: status || undefined,
  });

  return (
    <Suspense fallback={null}>
      <OrderListClient
        initialData={data}
        searchValue={search}
        statusValue={status}
      />
    </Suspense>
  );
}
