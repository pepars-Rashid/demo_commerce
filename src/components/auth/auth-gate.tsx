import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export async function AuthGate({
  mode,
  children,
}: {
  mode: "redirect-if-authenticated" | "redirect-if-unauthenticated";
  children: React.ReactNode;
}) {
  const session = await auth();

  if (mode === "redirect-if-authenticated" && session?.user) {
    redirect("/profile");
  }
  if (mode === "redirect-if-unauthenticated" && !session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}