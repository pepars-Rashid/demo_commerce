import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductFormPage } from "@/components/admin/products/product-form-page";
import { getProductCategories } from "@/lib/actions/product";

export default async function NewProductPage() {
  const categories = await getProductCategories();

  const mappedCategories = categories.map((c) => ({
    id: String(c.id),
    parentCategoryId: c.parentCategoryId ? String(c.parentCategoryId) : null,
    categoryName: c.categoryName,
    slug: c.slug,
    categoryImage: c.categoryImage,
  }));

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
          <ProductFormPage categories={mappedCategories} />
        </CardContent>
      </Card>
    </div>
  );
}