import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductFormPage } from "@/components/admin/products/product-form-page";
import { getProductById, getProductCategories } from "@/lib/actions/product";

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

  const productId = parseInt(id, 10);
  if (Number.isNaN(productId)) {
    notFound();
  }

  const [product, categories] = await Promise.all([
    getProductById(productId),
    getProductCategories(),
  ]);

  if (!product) {
    notFound();
  }

  const mappedCategories = categories.map((c) => ({
    id: String(c.id),
    parentCategoryId: c.parentCategoryId ? String(c.parentCategoryId) : null,
    categoryName: c.categoryName,
    slug: c.slug,
    categoryImage: c.categoryImage,
  }));

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
            categories={mappedCategories}
            product={{
              id: String(product.id),
              categoryId: String(product.categoryId),
              name: product.name,
              description: product.description,
              basePrice: Number(product.basePrice),
              totalStock: product.totalStock,
              productImage: product.productImage,
            }}
            productItems={product.items.map((i) => ({
              id: String(i.id),
              productId: String(i.productId),
              sku: i.sku ?? "",
              qtyInStock: i.qtyInStock,
              reservedStock: i.reservedStock,
              price: Number(i.price),
              discountPrice: i.discountPrice ? Number(i.discountPrice) : null,
              images: i.images,
              variantsJson: i.variantsJson,
            }))}
            readOnly={isView}
          />
        </CardContent>
      </Card>
    </div>
  );
}