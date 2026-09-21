import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { InventoryLogNewForm } from "@/components/admin/inventory/inventory-log-new-form";

export default async function NewInventoryLogPage() {
  // Strict guard — superAdmin only. Any other role is redirected by the guard.
  const admin = await requireSuperAdmin();
  if (!admin) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile/admin/inventory" aria-label="رجوع">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">سجل مخزون يدوي</h1>
          <p className="text-sm text-muted-foreground">
            أضف تغيير مخزون يدوي غير مرتبط بطلب (سجل تدقيقي) — أدخل رمز SKU الصحيح
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات السجل</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryLogNewForm />
        </CardContent>
      </Card>
    </div>
  );
}