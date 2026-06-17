import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/mock/types";

const roleLabels: Record<UserRole, string> = {
  user: "مستخدم",
  superAdmin: "مدير النظام",
};

export const roleOptions = (Object.keys(roleLabels) as UserRole[]).map(
  (value) => ({ value, label: roleLabels[value] }),
);

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role];
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant={role === "superAdmin" ? "default" : "secondary"}>
      {roleLabels[role]}
    </Badge>
  );
}
