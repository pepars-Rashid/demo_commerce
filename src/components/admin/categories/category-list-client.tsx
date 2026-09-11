"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ArchiveRestore,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { IconActionButton } from "@/components/admin/icon-action-button";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import {
  deleteCategory,
  batchDeleteCategories,
  restoreCategory,
} from "@/lib/actions/category";
import { formatNumber } from "@/lib/admin-format";
import { cn } from "@/lib/utils";
import { useTableSelection } from "@/hooks/use-table-selection";
import type { CategoryListResult } from "@/lib/actions/category";

interface CategoryListClientProps {
  initialData: CategoryListResult;
  onlyArchivedValue: string;
  searchValue: string;
}

export function CategoryListClient({
  initialData,
  onlyArchivedValue,
  searchValue,
}: CategoryListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);

  const [search, setSearch] = useState(searchValue);
  const [onlyArchived, setOnlyArchived] = useState(
    onlyArchivedValue === "true",
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const { categories, totalPages, page } = initialData;

  const {
    selectedIds,
    selectedCount,
    isAllSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    getSelectedItems,
    isSelected,
  } = useTableSelection({
    items: categories,
    getId: (c) => c.id,
    autoClearOnChange: true,
  });

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === "") {
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

  function handleArchiveChange(value: boolean) {
    setOnlyArchived(value);
    startTransition(() => {
      router.push(
        buildUrl({
          archived: value ? "true" : undefined,
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

  function handleNavigate(href: string) {
    if (isPending) return;
    setPendingNavHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      toast.success(`تم أرشفة "${deleteTarget.name}"`);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء الأرشفة");
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmBatchDelete() {
    const ids = Array.from(selectedIds);
    const count = ids.length;
    setIsDeleting(true);
    try {
      await batchDeleteCategories(ids);
      clearSelection();
      setBatchDeleteOpen(false);
      toast.success(`تم أرشفة ${formatNumber(count)} تصنيف`);
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء الأرشفة");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleRestore(id: number, name: string) {
    try {
      await restoreCategory(id);
      toast.success(`تمت استعادة "${name}"`);
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء الاستعادة");
    }
  }

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
        title="التصنيفات"
        description="إدارة تصنيفات المنتجات"
        action={
          <Button
            disabled={isPending}
            onClick={() => handleNavigate("/profile/admin/categories/new")}
          >
            {isPending && pendingNavHref === "/profile/admin/categories/new" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            إضافة تصنيف
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ابحث باسم التصنيف..."
            className="ps-9"
          />
        </div>
        <Button
          variant={onlyArchived ? "secondary" : "outline"}
          disabled={isPending}
          onClick={() => handleArchiveChange(!onlyArchived)}
        >
          <ArchiveRestore className="h-4 w-4" />
          عرض المؤرشفة
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={onlyArchived ? "لا توجد تصنيفات" : "لا توجد تصنيفات نشطة"}
          description="لم يتم العثور على تصنيفات مطابقة. جرّب تعديل البحث أو أضف تصنيفاً جديداً."
          action={
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleNavigate("/profile/admin/categories/new")}
            >
              {isPending && pendingNavHref === "/profile/admin/categories/new" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              إضافة تصنيف
            </Button>
          }
        />
      ) : (
        <div
          className={cn(
            "rounded-lg border transition-opacity",
            isPending && "opacity-60",
          )}
        >
          {selectedCount > 0 && (
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
              <span className="text-sm text-muted-foreground">
                تم تحديد {formatNumber(selectedCount)}{" "}
                {selectedCount === 1 ? "تصنيف" : "تصنيفات"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSelection()}
                  disabled={isDeleting}
                >
                  إلغاء التحديد
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBatchDeleteOpen(true)}
                  disabled={isDeleting || onlyArchived}
                >
                  <Trash2 className="h-4 w-4" />
                  أرشفة المحدد
                </Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input"
                      aria-label="تحديد الكل"
                    />
                  </div>
                </TableHead>
                <TableHead className="w-10 text-muted-foreground">#</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الرابط (Slug)</TableHead>
                <TableHead>التصنيف الأب</TableHead>
                <TableHead>المنتجات</TableHead>
                <TableHead>الفرعية</TableHead>
                <TableHead className="text-start">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category, index) => {
                const rowNumber =
                  (page - 1) * initialData.pageSize + index + 1;
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected(category.id)}
                          onChange={() =>
                            toggleSelect(category.id)}
                          disabled={onlyArchived}
                          className="h-4 w-4 rounded border-input"
                          aria-label={`تحديد ${category.categoryName}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {rowNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.categoryName}
                        {onlyArchived && (
                          <Badge variant="secondary" className="shrink-0">
                            مؤرشفة
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.parentCategoryName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatNumber(category.productCount)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatNumber(category.childCount)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onlyArchived ? (
                          <IconActionButton
                            label="استعادة"
                            disabled={isPending}
                            onClick={() =>
                              handleRestore(category.id, category.categoryName)
                            }
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </IconActionButton>
                        ) : (
                          <>
                            <IconActionButton
                              label="عرض"
                              disabled={isPending}
                              onClick={() =>
                                handleNavigate(
                                  `/profile/admin/categories/${category.id}?view=true`,
                                )
                              }
                            >
                              {isPending &&
                              pendingNavHref ===
                                `/profile/admin/categories/${category.id}?view=true` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </IconActionButton>
                            <IconActionButton
                              label="تعديل"
                              disabled={isPending}
                              onClick={() =>
                                handleNavigate(
                                  `/profile/admin/categories/${category.id}`,
                                )
                              }
                            >
                              {isPending &&
                              pendingNavHref ===
                                `/profile/admin/categories/${category.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </IconActionButton>
                            <IconActionButton
                              label="أرشفة"
                              className="text-destructive hover:text-destructive"
                              disabled={isPending || isDeleting}
                              onClick={() =>
                                setDeleteTarget({
                                  id: category.id,
                                  name: category.categoryName,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconActionButton>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
                  {getPageNumbers().map((p, i) => (
                    <PaginationItem key={`${p}-${i}`}>
                      {p === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
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
                      )}
                    </PaginationItem>
                  ))}
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
        description={
          <>
            هل أنت متأكد من أرشفة هذا التصنيف؟
            <span className="mt-2 block text-muted-foreground">
              سيتم إخفاؤه عن العملاء و المنصّات، ويمكن استعادته لاحقاً.
            </span>
            <span className="mt-3 block rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <span className="block font-bold text-destructive">
                {'"'}{deleteTarget?.name}{'"'}
              </span>
            </span>
          </>
        }
        onConfirm={confirmDelete}
        disabled={isDeleting}
      />

      <DeleteDialog
        open={batchDeleteOpen}
        onOpenChange={(open) => !open && setBatchDeleteOpen(false)}
        description={
          <>
            هل أنت متأكد من أرشفة{" "}
            <span className="font-bold text-destructive">
              {formatNumber(selectedCount)}{" "}
              {selectedCount === 1 ? "تصنيف" : "تصنيفات"}
            </span>
            ؟
            <span className="mt-2 block text-muted-foreground">
              يمكن استعادتها لاحقاً.
            </span>
            <span className="mt-3 block max-h-40 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3">
              {getSelectedItems().map((s) => (
                <span key={s.id} className="block font-bold text-destructive">
                  {'"'}{s.categoryName}{'"'}
                </span>
              ))}
            </span>
          </>
        }
        onConfirm={confirmBatchDelete}
        disabled={isDeleting}
      />
    </div>
  );
}
