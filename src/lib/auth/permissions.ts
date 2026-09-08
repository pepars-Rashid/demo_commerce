// Role-based permission checks — single source of truth for the admin shell,
// server actions, and sidebar/badges. Role ladder: user → operationManager → superAdmin.
// NOTE: role is cached in the JWT; a role change needs a re-login to take effect.

export type Role = "user" | "operationManager" | "superAdmin";

/** Both non-customer roles (admin shell entry). */
export function isAdmin(role: Role | null | undefined): boolean {
  return role === "superAdmin" || role === "operationManager";
}

/** Full control-room powers (users, order cancel, stock adjust, reason-edit). */
export function isSuperAdmin(role: Role | null | undefined): boolean {
  return role === "superAdmin";
}