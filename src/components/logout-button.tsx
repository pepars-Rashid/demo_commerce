"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  async function handleLogout() {
    await signOut({ redirectTo: "/login" });
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      تسجيل الخروج
    </Button>
  );
}