import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const categoryId = Number(id);
  if (Number.isNaN(categoryId)) notFound();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile/admin/categories">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تعديل التصنيف</h1>
          <p className="text-sm text-muted-foreground">
            تعديل التصنيف رقم {categoryId}
          </p>
        </div>
      </div>
      <div className="flex h-60 items-center justify-center rounded-lg border">
        <p className="text-sm text-muted-foreground">
          نموذج تعديل التصنيف قريباً
        </p>
      </div>
    </div>
  );
}