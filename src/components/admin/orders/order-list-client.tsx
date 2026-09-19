"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Loader2, Pencil, Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { IconActionButton } from "@/components/admin/icon-action-button";
import {
  OrderStatusBadge, orderStatusOptions,
} from "@/components/admin/order-status-badge";
import { formatCurrency, formatDate } from "@/lib/admin-format";
import { cn } from "@/lib/utils";
import type { OrderListResult } from "@/lib/actions/order";

interface OrderListClientProps {
  initialData: OrderListResult;
  searchValue: string;
  statusValue: string;
}

export function OrderListClient({
  initialData,
  searchValue,
  statusValue,
}: OrderListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // Remembers the href currently being navigated to, so the right row action
  // shows its spinner (Eye vs Pencil) while the rest are disabled + frozen.
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);

  const [search, setSearch] = useState(searchValue);
  const [status, setStatus] = useState<string>(statusValue || "all");

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { orders, totalPages, page, canManage } = initialData;

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === "" || value === "all") {
        sp.delete(key);
      } else {
        sp.set(key, value);
      }
    }
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl({ search: value || undefined, page: undefined }));
      });
    }, 500);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    startTransition(() => {
      router.push(buildUrl({ status: value === "all" ? undefined : value, page: undefined }));
    });
  }

  function handlePageChange(newPage: number) {
    startTransition(() => {
      router.push(buildUrl({ page: String(newPage) }));
    });
  }

  // Block double-clicks — one navigation at a time.
  function handleNavigate(href: string) {
    if (isPending) return;
    setPendingNavHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الطلبات" description="عرض وإدارة طلبات المتجر" />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="بحث بالعميل أو رقم الطلب…"
            className="ps-9"
            aria-label="بحث في الطلبات"
          />
        </div>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-auto" aria-label="تصفية حسب الحالة">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {orderStatusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="لا توجد طلبات"
          description="لم يتم العثور على طلبات مطابقة للبحث أو المرشحات الحالية."
        />
      ) : (
        <div
          className={cn(
            "rounded-lg border transition-opacity",
            isPending && "opacity-60",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="text-center">العناصر</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-24 text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">#{o.id}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{o.customerName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{o.customerEmail ?? "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(o.orderDate)}
                  </TableCell>
                  <TableCell className="text-center">{o.lineCount}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(o.orderTotal))}</TableCell>
                  <TableCell><OrderStatusBadge status={o.orderStatus} /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <IconActionButton
                        label="عرض"
                        disabled={isPending}
                        onClick={() =>
                          handleNavigate(`/profile/admin/orders/${o.id}?view=true`)
                        }
                      >
                        {isPending &&
                        pendingNavHref ===
                          `/profile/admin/orders/${o.id}?view=true` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </IconActionButton>
                      {canManage ? (
                        <IconActionButton
                          label="إدارة"
                          disabled={isPending}
                          onClick={() =>
                            handleNavigate(`/profile/admin/orders/${o.id}`)
                          }
                        >
                          {isPending &&
                          pendingNavHref ===
                            `/profile/admin/orders/${o.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                        </IconActionButton>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={page > 1 ? buildUrl({ page: String(page - 1) }) : "#"}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<number[]>((acc, p, i, arr) => {
                  if (acc.length && p - arr[i - 1] > 1) acc.push(-p);
                  acc.push(p);
                  return acc;
                }, [])
                .map((p) =>
                  p < 0 ? (
                    <PaginationItem key={p}><PaginationEllipsis /></PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href={buildUrl({ page: String(p) })}
                        isActive={p === page}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
              <PaginationItem>
                <PaginationNext
                  href={page < totalPages ? buildUrl({ page: String(page + 1) }) : "#"}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) handlePageChange(page + 1);
                  }}
                  className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
