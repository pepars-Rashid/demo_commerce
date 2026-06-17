"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  getProductTotalStock,
} from "@/lib/mock/products";
import { formatCurrency, formatNumber } from "@/lib/admin-format";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
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

  function confirmDelete() {
    if (!deleteTarget) return;
    // UI only — no persistence.
    toast.success(`تم حذف المنتج "${deleteTarget.name}"`);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>السعر الأساسي</TableHead>
                <TableHead>المتغيرات</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead className="text-start">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const itemCount =
                  getProductItemsByProductId(product.id).length;
                const totalStock = getProductTotalStock(product.id);
                return (
                  <TableRow key={product.id}>
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
        description={`هل أنت متأكد من حذف المنتج "${deleteTarget?.name ?? ""}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
