import { requireAdmin } from "@/lib/auth/require-admin";
import { Sidebar } from "./sidebar";

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
    <div className="flex min-h-screen">
      <Sidebar
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
        }}
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
