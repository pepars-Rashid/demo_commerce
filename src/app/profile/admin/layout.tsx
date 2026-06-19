import { requireAdmin } from "@/lib/auth/require-admin";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  if (!session?.user) {
    return null; // redirected by requireAdmin
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          user={{
            name: session.user.name ?? null,
            email: session.user.email ?? null,
            image: session.user.image ?? null,
          }}
        />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="h-4 me-2"
            />
            <span className="text-xs text-muted-foreground">
              لوحة التحكم
            </span>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="bottom-left" richColors />
    </TooltipProvider>
  );
}