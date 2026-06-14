import { ShoppingCart } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الطلبات</h1>
          <p className="text-sm text-muted-foreground">
            عرض وإدارة طلبات المتجر
          </p>
        </div>
      </div>
      <div className="flex h-60 items-center justify-center rounded-lg border">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            سيتم إضافة جدول الطلبات قريباً
          </p>
        </div>
      </div>
    </div>
  );
}