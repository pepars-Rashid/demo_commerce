import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المنتجات</h1>
          <p className="text-sm text-muted-foreground">
            إدارة المنتجات والمتغيرات والأسعار
          </p>
        </div>
        <Button>إضافة منتج جديد</Button>
      </div>
      <div className="flex h-60 items-center justify-center rounded-lg border">
        <div className="text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            سيتم إضافة جدول المنتجات قريباً
          </p>
        </div>
      </div>
    </div>
  );
}