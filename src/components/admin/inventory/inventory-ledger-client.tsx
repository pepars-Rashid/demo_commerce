"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Copy, Loader2, Plus, Search, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { formatDateTime, formatNumber } from "@/lib/admin-format";
import { getInventoryLogs } from "@/lib/actions/inventory";
import type { InventoryLedgerResult, InventoryLogRow } from "@/lib/actions/inventory";

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "orders", label: "من الطلبات" },
  { value: "manual", label: "يدوي / تعديلات المنتجات" },
];

interface InventoryLedgerClientProps {
  initialData: InventoryLedgerResult;
  searchValue: string;
  fromValue: string;
  toValue: string;
  sourceValue: string;
}

// Shared phrasing for the rendered line and the copy text (kept identical).
function actorLabel(log: InventoryLogRow): string {
  return log.userId ? `#${log.userId}` : "#النظام";
}

export function InventoryLedgerClient({
  initialData,
  searchValue,
  fromValue,
  toValue,
  sourceValue,
}: InventoryLedgerClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Live copy of searchParams so async callbacks (the debounced search push)
  // compose on the newest URL instead of a stale render-time value.
  const searchParamsRef = useRef(searchParams);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchValue);
  const [from, setFrom] = useState(fromValue);
  const [to, setTo] = useState(toValue);
  const [source, setSource] = useState<string>(sourceValue || "all");

  // Editing guard: a date field that still has focus is treated as "actively
  // being edited" and is not overwritten by the URL-sync effects below.
  const editingRef = useRef({ from: false, to: false });
  // Tracks the provider value we last synced into the local select, so the
  // source re-sync below only fires on a genuine URL change (and never on mount).
  const lastSourceValueRef = useRef(sourceValue);

  // logs reflect `initialData` (fresh on each server re-render). Load-more rows
  // are keyed by URL so they reset on filter change without remounting, keeping
  // the debounced search input focused. A cheap signature of the current first
  // page also discards appended rows when the data revalidates under the same URL.
  const initialDataSig = `${initialData.totalCount}:${initialData.logs[0]?.id ?? "none"}`;
  const urlKey = `${pathname}?${searchParams.toString()}`;
  const [loadMore, setLoadMore] = useState<{
    urlKey: string;
    sig: string;
    rows: InventoryLogRow[];
    page: number;
    hasMore: boolean;
    totalCount: number;
  }>({
    urlKey,
    sig: initialDataSig,
    rows: [],
    page: initialData.page,
    hasMore: initialData.hasMore,
    totalCount: initialData.totalCount,
  });
  // Loading is scoped to the URL the request belongs to, so switching filters
  // doesn't leave a stale spinner/disabled button on the new page.
  const [loadingMoreUrlKey, setLoadingMoreUrlKey] = useState<string | null>(null);
  const isLoadingMore = loadingMoreUrlKey === urlKey;

  const activeLoadMore =
    loadMore.urlKey === urlKey && loadMore.sig === initialDataSig
      ? loadMore
      : null;
  const page = activeLoadMore?.page ?? initialData.page;
  const hasMore = activeLoadMore?.hasMore ?? initialData.hasMore;
  const totalCount = activeLoadMore?.totalCount ?? initialData.totalCount;

  // Appended rows can overlap a refreshed page 1 — de-dupe so keys stay unique.
  const allRows = [...initialData.logs, ...(activeLoadMore?.rows ?? [])];
  const seenIds = new Set<number>();
  const logs: InventoryLogRow[] = [];
  for (const log of allRows) {
    if (seenIds.has(log.id)) continue;
    seenIds.add(log.id);
    logs.push(log);
  }

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Keep the live URL available to async buildUrl callbacks (the debounced
  // search push). Synced in an effect (not during render) to satisfy
  // react-hooks/refs.
  useEffect(() => {
    searchParamsRef.current = searchParams;
  });

  // The URL is the source of truth; local state only mirrors it so inputs stay
  // smooth while typing/picking. These effects re-sync the inputs from the
  // URL-derived props on any external change (browser back/forward, reset,
  // shared links) — while never clobbering a field that is mid-edit.
  useEffect(() => {
    if (!searchTimerRef.current) setSearch(searchValue);
  }, [searchValue]);
  useEffect(() => {
    if (!editingRef.current.from) setFrom(fromValue);
  }, [fromValue]);
  useEffect(() => {
    if (!editingRef.current.to) setTo(toValue);
  }, [toValue]);
  useEffect(() => {
    if (lastSourceValueRef.current !== sourceValue) {
      lastSourceValueRef.current = sourceValue;
      setSource(sourceValue);
    }
  }, [sourceValue]);

  function clearSearchDebounce() {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParamsRef.current.toString());
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
      searchTimerRef.current = null;
      startTransition(() => {
        router.push(buildUrl({ search: value || undefined, page: undefined }));
      });
    }, 500);
  }

  function handleFromChange(value: string) {
    clearSearchDebounce();
    setFrom(value);
    startTransition(() => {
      router.push(buildUrl({ from: value || undefined, to, page: undefined }));
    });
  }

  function handleToChange(value: string) {
    clearSearchDebounce();
    setTo(value);
    startTransition(() => {
      router.push(buildUrl({ from, to: value || undefined, page: undefined }));
    });
  }

  function handleSourceChange(value: string) {
    clearSearchDebounce();
    setSource(value);
    startTransition(() => {
      router.push(
        buildUrl({ source: value === "all" ? undefined : value, page: undefined }),
      );
    });
  }

  function handleReset() {
    clearSearchDebounce();
    setSearch("");
    startTransition(() => {
      router.push(
        buildUrl({
          search: undefined,
          from: undefined,
          to: undefined,
          source: undefined,
          page: undefined,
        }),
      );
    });
  }

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;
    // Capture the key + data signature this request belongs to so a user who
    // navigates/filters mid-flight doesn't attach stale rows to the new view.
    const requestUrlKey = urlKey;
    const requestSig = initialDataSig;
    const baseRows = activeLoadMore?.rows ?? [];
    setLoadingMoreUrlKey(requestUrlKey);
    try {
      const nextPage = page + 1;
      const result = await getInventoryLogs({
        page: nextPage,
        pageSize: 20,
        search: searchValue.trim() || undefined,
        from: fromValue,
        to: toValue,
        source: sourceValue === "all" ? undefined : sourceValue,
      });
      setLoadMore({
        urlKey: requestUrlKey,
        sig: requestSig,
        rows: [...baseRows, ...result.logs],
        page: result.page,
        hasMore: result.hasMore,
        totalCount: result.totalCount,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل المزيد");
    } finally {
      setLoadingMoreUrlKey(null);
    }
  }

  function serializeForCopy(target: InventoryLogRow[]): string {
    return target
      .map((log, index) => {
        const actor = actorLabel(log);
        const verb = log.change >= 0 ? "إضافة" : "خصم";
        const order =
          log.orderId != null
            ? ` من الطلب #${log.orderId}`
            : " من تعديل يدوي (لا طلب)";
        const product = log.productName ?? "منتج محذوف";
        return `${index + 1}. ${actor}: ${verb} ${formatNumber(Math.abs(log.change))} وحدة على المنتج "${product}"${order} لسبب "${log.reason}" في ${formatDateTime(log.createdAt)} #${log.id}`;
      })
      .join("\n");
  }

  async function handleCopy() {
    const text = serializeForCopy(logs);
    if (!text) {
      toast.info("لا يوجد سجل لنسخه");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ السجل");
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success("تم نسخ السجل");
      } catch {
        toast.error("تعذر نسخ السجل");
      }
    }
  }

  function renderActor(log: InventoryLogRow) {
    return actorLabel(log);
  }
return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="سجل المخزون"
        description="سجل التغيرات والمخزون (سجل تدقيقي)"
        action={
          initialData.canManage ? (
            <Button asChild size="sm">
              <Link href="/profile/admin/inventory/new">
                <Plus className="h-4 w-4" />
                سجل يدوي جديد
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="بحث: منتج، SKU، سبب، رقم السجل، رقم الطلب..."
                className="ps-8"
                aria-label="البحث في السجل"
              />
            </div>
            <span className="text-sm text-muted-foreground">من</span>
            <Input
              type="date"
              value={from}
              onChange={(e) => handleFromChange(e.target.value)}
              onFocus={() => {
                editingRef.current.from = true;
              }}
              onBlur={() => {
                editingRef.current.from = false;
              }}
              aria-label="من تاريخ"
              className="w-auto"
            />
            <span className="text-sm text-muted-foreground">إلى</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => handleToChange(e.target.value)}
              onFocus={() => {
                editingRef.current.to = true;
              }}
              onBlur={() => {
                editingRef.current.to = false;
              }}
              aria-label="إلى تاريخ"
              className="w-auto"
            />
            <Select value={source} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-[210px]" aria-label="مصدر السجل">
                <SelectValue placeholder="المصدر" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              مسح الفلاتر
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>إجمالي {formatNumber(totalCount)} سجل</span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleCopy}
              disabled={!logs.length}
            >
              <Copy className="h-4 w-4" />
              نسخ الكل
            </Button>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          </div>
        </CardContent>
      </Card>

      {/* Ledger */}
      {logs.length === 0 && !isPending ? (
        <EmptyState
          icon={Warehouse}
          title="لا توجد سجلات"
          description="جرّب توسيع نطاق التاريخ أو مسح الفلاتر."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>سجل المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea type="always" className="h-[480px]">
              <div className="flex flex-col gap-1.5 font-mono text-[13px] leading-snug">
                {logs.map((log, index) => (
                  <div key={log.id} className="rounded-md bg-muted/40 px-2 py-1 font-mono">
                    <span className="font-medium text-foreground">{index + 1}.</span>{" "}
                    <span className="font-medium">{renderActor(log)}:</span>{" "}
                    <span
                      className={
                        log.change >= 0
                          ? "font-medium text-emerald-500"
                          : "font-medium text-destructive"
                      }
                    >
                      {log.change >= 0 ? "إضافة" : "خصم"}{" "}
                      {formatNumber(Math.abs(log.change))}
                    </span>{" "}
                    <span className="text-muted-foreground">وحدة على المنتج &quot;</span>
                    {log.productId != null ? (
                      <Link
                        href={`/profile/admin/products/${log.productId}?view=true`}
                        className=" underline underline-offset-4"
                      >
                        {log.productName ?? "منتج غير متوفر"}
                      </Link>
                    ) : (
                      <span className="font-medium">{log.productName ?? "منتج محذوف"}</span>
                    )}
                    <span className="text-muted-foreground">&quot;</span>{" "}
                    {log.orderId != null ? (
                      <span className="text-muted-foreground">
                        من الطلب{" "}
                        <Link
                          href={`/profile/admin/orders/${log.orderId}`}
                          className="text-primary underline underline-offset-4"
                        >
                          #{log.orderId}
                        </Link>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        من تعديل يدوي (لا طلب)
                      </span>
                    )}
                    <span className="text-muted-foreground">، لسبب &quot;</span>
                    {log.reason}
                    <span className="text-muted-foreground">&quot; في </span>
                    {formatDateTime(log.createdAt)}{" "}
                    <span className="text-muted-foreground">#{log.id}</span>
                  </div>
                ))}

                {hasMore ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    disabled={isLoadingMore}
                    onClick={handleLoadMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جارٍ التحميل...
                      </>
                    ) : (
                      "تحميل المزيد"
                    )}
                  </Button>
                ) : logs.length > 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    لا يوجد المزيد من السجلات لعرضها ضمن هذا النطاق
                  </p>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}