import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryFormPage } from "@/components/admin/categories/category-form-page";
import { getActiveCategories } from "@/lib/actions/category";

export default async function NewCategoryPage() {
  const options = await getActiveCategories();

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile/admin/categories" aria-label="رجوع">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إضافة تصنيف جديد</h1>
          <p className="text-sm text-muted-foreground">
            أدخل بيانات التصنيف وحدّد تصنيفه الأب إن وُجد
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات التصنيف</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryFormPage options={options} />
        </CardContent>
      </Card>
    </div>
  );
}
