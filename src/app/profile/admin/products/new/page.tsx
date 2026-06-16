import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductFormPage } from "@/components/admin/products/product-form-page";
import { categories } from "@/lib/mock/categories";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile/admin/products" aria-label="رجوع">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إضافة منتج جديد</h1>
          <p className="text-sm text-muted-foreground">
            أدخل بيانات المنتج وأضف متغيراته
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المنتج</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductFormPage categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
