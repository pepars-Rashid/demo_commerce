import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { isAdmin } from "@/lib/auth/permissions";

export async function AdminSidebar({
  authPromise,
}: {
  authPromise: Promise<Session | null>;
}) {
  const session = await authPromise;

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  // JWT role check (fast, no DB) — lets BOTH admin roles into the admin shell.
  // Customers are blocked here; permission to MUTATE is enforced server-side
  // per-feature (assertAdmin / requireSuperAdmin).
  if (!isAdmin(session.user.role)) {
    redirect("/profile");
    return null;
  }

  return (
    <AppSidebar
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }}
    />
  );
}