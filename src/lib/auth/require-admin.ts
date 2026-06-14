import { auth } from "@/lib/auth/auth";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return; // never reached, but satisfies TypeScript
  }

  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (dbUser?.role !== "superAdmin") {
      redirect("/profile");
      return;
    }
  } catch {
    redirect("/profile");
    return;
  }

  return session;
}