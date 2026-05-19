export type UserRole = "superadmin" | "admin" | "abogado" | "asistente" | "cliente";

export function getRoleLandingPath(role: UserRole): string {
  if (role === "superadmin") {
    return "/dashboard/admin";
  }

  if (role === "cliente") {
    return "/portal";
  }

  return "/dashboard";
}
