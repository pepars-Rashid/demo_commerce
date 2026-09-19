import { cache } from "react";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/require-admin";
import { isSuperAdmin } from "@/lib/auth/permissions";

/**
 * STRICT — auth + fresh DB role check for `superAdmin` only.
 * Mirrors `requireAdmin` but gates on `superAdmin` (the full-control role).
 * Used to conditionally render the manage (edit) surface for orders inventory,
 * users, etc. — even if a lower role forces the URL, the DB re-check redirects them.
 */
export const requireSuperAdmin = cache(async () => {
  const session = await getAdminSession(); // JWT-checked any-admin entry
  if (!session?.user?.id) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true },
  });

  if (!isSuperAdmin(dbUser?.role)) {
    redirect("/profile");
    return null;
  }

  return session;
});