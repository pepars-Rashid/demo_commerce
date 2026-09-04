import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">الصفحة غير موجودة</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          عذراً، الصفحة التي تبحث عنها غير موجودة. ربما تم نقلها أو حذفها.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Home className="h-4 w-4" />
          <span className="mr-2">العودة للرئية</span>
        </Link>
      </Button>
    </div>
  );
}
