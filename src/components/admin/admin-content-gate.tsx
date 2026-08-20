import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function AdminContentGate({
  authPromise,
  children,
}: {
  authPromise: Promise<Session | null>;
  children: React.ReactNode;
}) {
  const session = await authPromise;

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  // Fresh DB role check (catches demotions) — only for content, inside Suspense
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true },
  });

  if (dbUser?.role !== "superAdmin") {
    redirect("/profile");
    return null;
  }

  return <>{children}</>;
}