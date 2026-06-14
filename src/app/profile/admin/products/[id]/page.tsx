import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) notFound();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile/admin/products">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تعديل المنتج</h1>
          <p className="text-sm text-muted-foreground">
            تعديل المنتج رقم {productId}
          </p>
        </div>
      </div>
      <div className="flex h-60 items-center justify-center rounded-lg border">
        <p className="text-sm text-muted-foreground">
          نموذج تعديل المنتج قريباً
        </p>
      </div>
    </div>
  );
}