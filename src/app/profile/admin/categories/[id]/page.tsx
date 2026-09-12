import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryFormPage } from "@/components/admin/categories/category-form-page";
import {
  getCategoryById,
  getActiveCategories,
  getCategoryWithDescendants,
} from "@/lib/actions/category";
import { withCategoryDepth } from "@/lib/category-depth";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function EditCategoryPage({
  params,
  searchParams,
}: EditCategoryPageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const isView = view === "true";

  const categoryId = parseInt(id, 10);
  if (Number.isNaN(categoryId)) {
    notFound();
  }

  const [category, excluded, all] = await Promise.all([
    getCategoryById(categoryId),
    getCategoryWithDescendants(categoryId),
    getActiveCategories(),
  ]);
  if (!category) {
    notFound();
  }

  // Exclude self + descendants from the parent options (prevent cycles), then
  // compute the depth of each remaining option for the client-side max-depth check.
  const options = withCategoryDepth(
    all.filter((c) => !excluded.has(c.id)),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/profile/admin/categories" aria-label="رجوع">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isView ? "تفاصيل التصنيف" : "تعديل التصنيف"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isView ? (
                <>
                  {category.categoryName}
                  <Badge variant="outline" className="me-2">
                    عرض
                  </Badge>
                </>
              ) : (
                category.categoryName
              )}
            </p>
          </div>
        </div>
        {isView && (
          <Button asChild>
            <Link href={`/profile/admin/categories/${category.id}`}>
              <Pencil className="h-4 w-4" />
              تعديل
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isView ? "تفاصيل التصنيف" : "بيانات التصنيف"}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryFormPage
            options={options}
            category={{
              id: String(category.id),
              categoryName: category.categoryName,
              slug: category.slug,
              categoryImage: category.categoryImage,
              parentCategoryId: category.parentCategoryId,
            }}
            readOnly={isView}
          />
        </CardContent>
      </Card>
    </div>
  );
}
