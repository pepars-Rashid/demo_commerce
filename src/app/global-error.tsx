"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">حدث خطأ غير متوقع</h2>
            <p className="text-sm text-muted-foreground">
              حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground">
                رمز الخطأ: {error.digest}
              </p>
            )}
          </div>
          <Button onClick={reset}>إعادة المحاولة</Button>
        </div>
      </body>
    </html>
  );
}
