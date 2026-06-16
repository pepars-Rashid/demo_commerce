"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconActionButton } from "@/components/admin/icon-action-button";
import type {
  Product,
  ProductCategory,
  ProductItem,
} from "@/lib/mock/types";

interface ItemRow {
  key: string;
  sku: string;
  price: string;
  discountPrice: string;
  qtyInStock: string;
  variants: string;
}

interface ProductFormProps {
  categories: ProductCategory[];
  product?: Product;
  productItems?: ProductItem[];
  /** Called after a successful save (e.g. to close a modal or navigate). */
  onDone?: () => void;
  /** Layout variant — full pages use a wider 2-column grid. */
  layout?: "sheet" | "page";
}

function variantsToText(variantsJson: Record<string, string>): string {
  return Object.entries(variantsJson)
    .map(([k, v]) => `${k}: ${v}`)
    .join("، ");
}

function makeKey() {
  return Math.random().toString(36).slice(2, 10);
}

export function ProductForm({
  categories,
  product,
  productItems = [],
  onDone,
  layout = "sheet",
}: ProductFormProps) {
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(
    product ? String(product.basePrice) : "",
  );
  const [productImage, setProductImage] = useState(product?.productImage ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [items, setItems] = useState<ItemRow[]>(
    productItems.length > 0
      ? productItems.map((i) => ({
          key: i.id,
          sku: i.sku,
          price: String(i.price),
          discountPrice: i.discountPrice != null ? String(i.discountPrice) : "",
          qtyInStock: String(i.qtyInStock),
          variants: variantsToText(i.variantsJson),
        }))
      : [
          {
            key: makeKey(),
            sku: "",
            price: "",
            discountPrice: "",
            qtyInStock: "",
            variants: "",
          },
        ],
  );

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        key: makeKey(),
        sku: "",
        price: "",
        discountPrice: "",
        qtyInStock: "",
        variants: "",
      },
    ]);
  }

  function removeItem(key: string) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((i) => i.key !== key),
    );
  }

  function updateItem(key: string, field: keyof ItemRow, value: string) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)),
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("يرجى إدخال اسم المنتج");
      return;
    }
    if (!categoryId) {
      toast.error("يرجى اختيار التصنيف");
      return;
    }

    // UI only — no persistence. Real save wires in later.
    toast.success("تم الحفظ بنجاح");
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={
          layout === "page"
            ? "grid gap-4 sm:grid-cols-2"
            : "grid gap-4"
        }
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">اسم المنتج</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: آيفون 15 برو"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">الوصف</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف موجز للمنتج"
            rows={3}
            className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="basePrice">السعر الأساسي (ر.س)</Label>
          <Input
            id="basePrice"
            type="number"
            inputMode="numeric"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">التصنيف</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="productImage">رابط صورة المنتج</Label>
          <Input
            id="productImage"
            value={productImage}
            onChange={(e) => setProductImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">المتغيرات (SKUs)</h3>
            <p className="text-xs text-muted-foreground">
              أضف متغيرات المنتج بأسعارها ومخزونها
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
            إضافة متغير
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.key}
              className="rounded-lg border bg-muted/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  المتغير {index + 1}
                </span>
                <IconActionButton
                  type="button"
                  size="icon-sm"
                  label="حذف المتغير"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeItem(item.key)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </IconActionButton>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">رمز المنتج (SKU)</Label>
                  <Input
                    value={item.sku}
                    onChange={(e) =>
                      updateItem(item.key, "sku", e.target.value)
                    }
                    placeholder="SKU-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">المخزون</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={item.qtyInStock}
                    onChange={(e) =>
                      updateItem(item.key, "qtyInStock", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">السعر (ر.س)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(item.key, "price", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">سعر الخصم (ر.س)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={item.discountPrice}
                    onChange={(e) =>
                      updateItem(item.key, "discountPrice", e.target.value)
                    }
                    placeholder="اختياري"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">المتغيرات (variantsJson)</Label>
                  <Input
                    value={item.variants}
                    onChange={(e) =>
                      updateItem(item.key, "variants", e.target.value)
                    }
                    placeholder="اللون: أسود، التخزين: 256GB"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            إلغاء
          </Button>
        ) : null}
        <Button type="submit">
          {isEdit ? "حفظ التغييرات" : "إضافة المنتج"}
        </Button>
      </div>
    </form>
  );
}
