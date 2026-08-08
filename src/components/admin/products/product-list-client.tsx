"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { IconActionButton } from "@/components/admin/icon-action-button";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { deleteProduct, batchDeleteProducts } from "@/lib/actions/product";
import { formatCurrency, formatNumber } from "@/lib/admin-format";
import type { ProductListResult } from "@/lib/actions/product";

interface ProductListClientProps {
  initialData: ProductListResult;
  categories: { id: number; categoryName: string }[];
  searchValue: string;
  categoryIdValue: string;
}

export function ProductListClient({
  initialData,
  categories,
  searchValue,
  categoryIdValue,
}: ProductListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchValue);
  const [categoryId, setCategoryId] = useState(categoryIdValue);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { products, totalPages, page } = initialData;

  const allSelected = useMemo(
    () => products.length > 0 && selected.size === products.length,
    [selected, products],
  );

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === products.length) {
        return new Set();
      }
      return new Set(products.map((p) => p.id));
    });
  }, [products]);

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
    startTransition(() => {
      router.push(buildUrl({ search: value || undefined, page: undefined }));
    });
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    startTransition(() => {
      router.push(
        buildUrl({
          categoryId: value === "all" ? undefined : value,
          page: undefined,
        }),
      );
    });
  }

  function handlePageChange(newPage: number) {
    startTransition(() => {
      router.push(buildUrl({ page: String(newPage) }));
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      toast.success(`تم حذف المنتج "${deleteTarget.name}"`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  }

  async function handleBatchDelete() {
    const ids = Array.from(selected);
    const count = ids.length;
    try {
      await batchDeleteProducts(ids);
      setSelected(new Set());
      toast.success(`تم حذف ${formatNumber(count)} منتج`);
      startTransition(() => router.refresh());
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  }

  // Build pagination range
  function getPageNumbers(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="المنتجات"
        description="إدارة المنتجات والمتغيرات والأسعار"
        action={
          <Button asChild>
            <Link href="/profile/admin/products/new">
              <Plus className="h-4 w-4" />
              إضافة منتج
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ابحث باسم المنتج..."
            className="ps-9"
          />
        </div>
        <Select value={categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="كل التصنيفات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.categoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="لا توجد منتجات"
          description="لم يتم العثور على منتجات مطابقة. جرّب تعديل البحث أو أضف منتجاً جديداً."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/admin/products/new">
                <Plus className="h-4 w-4" />
                إضافة منتج
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          {/* Batch delete bar */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
              <span className="text-sm text-muted-foreground">
                تم تحديد {formatNumber(selected.size)}{" "}
                {selected.size === 1 ? "منتج" : "منتجات"}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
                حذف المحدد
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input"
                      aria-label="تحديد الكل"
                    />
                  </div>
                </TableHead>
                <TableHead className="w-10 text-muted-foreground">#</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>السعر الأساسي</TableHead>
                <TableHead>المتغيرات</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead className="text-start">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => {
                const rowNumber = (page - 1) * initialData.pageSize + index + 1;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selected.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="h-4 w-4 rounded border-input"
                          aria-label={`تحديد ${product.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {rowNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.categoryName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(product.basePrice))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatNumber(product.itemCount)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.totalStock === 0 ? (
                        <Badge variant="destructive">نفد المخزون</Badge>
                      ) : (
                        formatNumber(product.totalStock)
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconActionButton label="عرض" asChild>
                          <Link
                            href={`/profile/admin/products/${product.id}?view=true`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </IconActionButton>
                        <IconActionButton label="تعديل" asChild>
                          <Link
                            href={`/profile/admin/products/${product.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </IconActionButton>
                        <IconActionButton
                          label="حذف"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({
                              id: product.id,
                              name: product.name,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-4 py-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={page > 1 ? buildUrl({ page: String(page - 1) }) : "#"}
                      onClick={(e) => {
                        if (page <= 1) {
                          e.preventDefault();
                          return;
                        }
                        e.preventDefault();
                        handlePageChange(page - 1);
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((p, i) =>
                    p === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
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
                      href={
                        page < totalPages
                          ? buildUrl({ page: String(page + 1) })
                          : "#"
                      }
                      onClick={(e) => {
                        if (page >= totalPages) {
                          e.preventDefault();
                          return;
                        }
                        e.preventDefault();
                        handlePageChange(page + 1);
                      }}
                      className={
                        page >= totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        description={`هل أنت متأكد من حذف المنتج "${
          deleteTarget?.name ?? ""
        }"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}