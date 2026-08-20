import { cache } from "react";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// Creates the auth promise WITHOUT awaiting it — deduped per request.
// The layout passes this promise down; consumers resolve it inside <Suspense>.
export const getAuthPromise = cache(() => auth());

// Resolve the auth promise + redirect if not logged in / not admin (JWT role check).
export async function getAdminSession() {
  const session = await getAuthPromise();
  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }
  // JWT role check (fast, no DB) — blocks non-admins from even seeing the admin shell
  if (session.user.role !== "superAdmin") {
    redirect("/profile");
    return null;
  }
  return session;
}

// FULL — auth (deduped via cache) + fresh DB role check. Used inside Suspense for content only.
export const requireAdmin = cache(async () => {
  const session = await getAdminSession(); // same request dedup
  if (!session?.user?.id) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true },
  });

  if (dbUser?.role !== "superAdmin") {
    redirect("/profile");
    return null;
  }

  return session;
});
