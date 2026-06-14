"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-muted-foreground">
          تعذر تحميل لوحة التحكم. يرجى المحاولة مرة أخرى.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            رمز الخطأ: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={() => unstable_retry()}>إعادة المحاولة</Button>
    </div>
  );
}