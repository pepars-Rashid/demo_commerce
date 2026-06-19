import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductFormPage } from "@/components/admin/products/product-form-page";
import { categories } from "@/lib/mock/categories";
import {
  getProductById,
  getProductItemsByProductId,
} from "@/lib/mock/products";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const isView = view === "true";

  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/profile/admin/products" aria-label="رجوع">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isView ? "تفاصيل المنتج" : "تعديل المنتج"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isView ? (
                <>
                  {product.name}
                  <Badge variant="outline" className="me-2">
                    عرض
                  </Badge>
                </>
              ) : (
                product.name
              )}
            </p>
          </div>
        </div>
        {isView && (
          <Button asChild>
            <Link
              href={`/profile/admin/products/${product.id}`}
            >
              <Pencil className="h-4 w-4" />
              تعديل
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isView ? "تفاصيل المنتج" : "بيانات المنتج"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductFormPage
            categories={categories}
            product={product}
            productItems={getProductItemsByProductId(product.id)}
            readOnly={isView}
          />
        </CardContent>
      </Card>
    </div>
  );
}