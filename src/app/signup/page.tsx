import { Suspense } from "react";
import { SignupForm } from "@/components/signup-form";
import { AuthGate } from "@/components/auth/auth-gate";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <AuthGate mode="redirect-if-authenticated">
            <SignupForm />
          </AuthGate>
        </Suspense>
      </div>
    </div>
  );
}