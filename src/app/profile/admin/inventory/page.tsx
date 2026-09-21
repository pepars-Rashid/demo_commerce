import { Suspense } from "react";
import { getInventoryLogs } from "@/lib/actions/inventory";
import { InventoryLedgerClient } from "@/components/admin/inventory/inventory-ledger-client";

interface InventoryPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    from?: string;
    to?: string;
    source?: string;
  }>;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const sp = await searchParams;

  const page = parseInt(sp.page ?? "1", 10) || 1;
  const search = sp.search ?? "";
  // Default the ledger interval to today when no explicit range is supplied.
  const today = toDateInputValue(new Date());
  const from = sp.from ?? today;
  const to = sp.to ?? today;
  const source = sp.source ?? "all";

  const data = await getInventoryLogs({
    page,
    pageSize: 20,
    search: search || undefined,
    from,
    to,
    source,
  });

  return (
    <Suspense fallback={null}>
      <InventoryLedgerClient
        initialData={data}
        searchValue={search}
        fromValue={from}
        toValue={to}
        sourceValue={source}
      />
    </Suspense>
  );
}