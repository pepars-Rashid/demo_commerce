import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">الملف الشخصي</h1>
          <p className="text-sm text-muted-foreground">
            مرحباً، {user.name ?? "مستخدم"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium">البريد الإلكتروني</p>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>

          <LogoutButton />
        </div>
      </div>
    </div>
  );
}