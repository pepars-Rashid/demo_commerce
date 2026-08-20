import { Suspense } from "react";
import { getAuthPromise } from "@/lib/auth/require-admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminSidebarSkeleton } from "@/components/admin/admin-sidebar-skeleton";
import { AdminContentGate } from "@/components/admin/admin-content-gate";
import { AdminContentSkeleton } from "@/components/admin/admin-content-skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // NOT awaited — the static shell (providers + header) renders instantly.
  const authPromise = getAuthPromise();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Suspense fallback={<AdminSidebarSkeleton />}>
          <AdminSidebar authPromise={authPromise} />
        </Suspense>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="me-2 h-4"
            />
            <span className="text-xs text-muted-foreground">
              لوحة التحكم
            </span>
          </header>
          <main className="flex-1 p-6">
            <Suspense fallback={<AdminContentSkeleton />}>
              <AdminContentGate authPromise={authPromise}>
                {children}
              </AdminContentGate>
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="bottom-left" richColors />
    </TooltipProvider>
  );
}
