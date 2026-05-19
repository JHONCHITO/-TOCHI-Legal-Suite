import { auth } from "@/lib/auth";

// Tipos de roles
export type UserRole = "superadmin" | "admin" | "abogado" | "asistente" | "cliente";

// Permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  superadmin: ["*"], // Acceso total
  admin: [
    "casos:read", "casos:write", "casos:delete",
    "clientes:read", "clientes:write", "clientes:delete",
    "citas:read", "citas:write", "citas:delete",
    "documentos:read", "documentos:write", "documentos:delete",
    "facturas:read", "facturas:write", "facturas:delete",
    "usuarios:read", "usuarios:write",
    "reportes:read",
    "comunicaciones:read", "comunicaciones:write",
  ],
  abogado: [
    "casos:read", "casos:write",
    "clientes:read", "clientes:write",
    "citas:read", "citas:write",
    "documentos:read", "documentos:write",
    "facturas:read", "facturas:write",
    "comunicaciones:read", "comunicaciones:write",
  ],
  asistente: [
    "casos:read",
    "clientes:read",
    "citas:read", "citas:write",
    "documentos:read",
    "comunicaciones:read", "comunicaciones:write",
  ],
  cliente: [
    "mis-casos:read",
    "mis-citas:read",
    "mis-documentos:read",
    "mis-facturas:read",
  ],
};

// Verificar si un rol tiene un permiso específico
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

// Verificar si el usuario es admin o superadmin
export function isAdmin(role: UserRole): boolean {
  return role === "superadmin" || role === "admin";
}

// Verificar si el usuario es superadmin
export function isSuperAdmin(role: UserRole): boolean {
  return role === "superadmin";
}

// Verificar si el usuario es cliente
export function isClient(role: UserRole): boolean {
  return role === "cliente";
}

export function isInternalUser(role: UserRole): boolean {
  return role !== "cliente";
}

export function getRoleLandingPath(role: UserRole): string {
  if (role === "superadmin") {
    return "/dashboard/admin";
  }

  return isClient(role) ? "/portal" : "/dashboard";
}

// Obtener la sesión actual con información del usuario
export async function getSession() {
  try {
    const session = await auth();
    return session;
  } catch {
    return null;
  }
}

// Obtener el usuario actual de la sesión
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;
  return session.user as {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

// Verificar acceso a un recurso
export async function checkAccess(permission: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasPermission(user.role as UserRole, permission);
}

// Filtrar query por usuario si es cliente
export function getClientFilter(userId: string, role: UserRole) {
  if (role === "cliente") {
    return { clienteId: userId };
  }
  return {}; // Sin filtro para otros roles
}
