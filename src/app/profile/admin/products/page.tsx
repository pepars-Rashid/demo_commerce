"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Check,
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { IconActionButton } from "@/components/admin/icon-action-button";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { categories, getCategoryName } from "@/lib/mock/categories";
import {
  products,
  getProductItemsByProductId,
} from "@/lib/mock/products";
import { formatCurrency, formatNumber } from "@/lib/admin-format";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesName = term === "" || p.name.toLowerCase().includes(term);
      const matchesCategory =
        categoryId === "all" || p.categoryId === categoryId;
      return matchesName && matchesCategory;
    });
  }, [search, categoryId]);

  const allSelected = useMemo(
    () => filtered.length > 0 && selected.size === filtered.length,
    [selected, filtered],
  );

  const toggleSelect = useCallback((id: string) => {
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
      if (prev.size === filtered.length) {
        return new Set();
      }
      return new Set(filtered.map((p) => p.id));
    });
  }, [filtered]);

  function confirmDelete() {
    if (!deleteTarget) return;
    toast.success(`تم حذف المنتج "${deleteTarget.name}"`);
  }

  function handleBatchDelete() {
    const count = selected.size;
    setSelected(new Set());
    toast.success(`تم حذف ${formatNumber(count)} منتج`);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="المنتجات"
        description="إدارة المنتجات والمتغيرات والأسعار"
        action={
          <Button>
            <a
              href="/profile/admin/products/new"
              className="sm:hidden inline-flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              إضافة منتج
            </a>
            <Link
              href="/profile/admin/products/new"
              className="hidden sm:inline-flex items-center gap-1"
            >
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المنتج..."
            className="ps-9"
          />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="كل التصنيفات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.categoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
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
          {/* Batch delete bar — visible when items are selected */}
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
              {filtered.map((product, index) => {
                const itemCount =
                  getProductItemsByProductId(product.id).length;
                const totalStock = product.totalStock;
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
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getCategoryName(product.categoryId)}
                    </TableCell>
                    <TableCell>{formatCurrency(product.basePrice)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatNumber(itemCount)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {totalStock === 0 ? (
                        <Badge variant="destructive">نفد المخزون</Badge>
                      ) : (
                        formatNumber(totalStock)
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