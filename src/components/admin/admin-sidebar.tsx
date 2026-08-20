import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";

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

  // JWT role check (fast, no DB) — blocks non-admins from even seeing the admin shell
  if (session.user.role !== "superAdmin") {
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