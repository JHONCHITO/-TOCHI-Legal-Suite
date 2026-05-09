"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  ChevronLeft,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  RadioTower,
  Scale,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[];
}

const internalRoles = ["superadmin", "admin", "abogado", "asistente"];
const adminRoles = ["superadmin", "admin"];
const clientRoles = ["cliente"];

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/casos", label: "Casos", icon: Briefcase },
  { href: "/dashboard/intake", label: "Intake inteligente", icon: RadioTower, roles: internalRoles },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users, roles: internalRoles },
  { href: "/dashboard/citas", label: "Calendario", icon: Calendar },
  { href: "/dashboard/documentos", label: "Documentos", icon: FileText },
  { href: "/dashboard/portal", label: "Portal cliente", icon: ShieldCheck, roles: clientRoles },
  { href: "/dashboard/leyes", label: "Codigos Legales", icon: Scale, roles: internalRoles },
  { href: "/dashboard/actualizaciones", label: "Novedades", icon: RadioTower, roles: internalRoles },
  { href: "/dashboard/asistente", label: "Asistente IA", icon: MessageSquare, roles: ["superadmin", "admin", "abogado"] },
  { href: "/dashboard/facturacion", label: "Facturacion", icon: CreditCard },
  { href: "/dashboard/comunicacion", label: "Comunicacion", icon: MessageSquare, roles: internalRoles },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3, roles: ["superadmin", "admin", "abogado"] },
  { href: "/dashboard/seguridad", label: "Seguridad", icon: Shield, roles: adminRoles },
  { href: "/dashboard/herramientas", label: "Herramientas", icon: Wrench, roles: internalRoles },
  { href: "/dashboard/admin/usuarios", label: "Usuarios", icon: ShieldCheck, roles: adminRoles },
];

const bottomItems: NavItem[] = [
  { href: "/dashboard/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/precios", label: "Mi Suscripcion", icon: CreditCard, roles: internalRoles },
  { href: "/dashboard/configuracion", label: "Configuracion", icon: Settings, roles: internalRoles },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json()).catch(() => null);

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  const { data: userData } = useSWR(session?.user?.id ? `/api/users/me` : null, fetcher);
  const userRole = userData?.rol || "abogado";

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const filteredBottomItems = bottomItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  useEffect(() => {
    if (userRole === "cliente") {
      setCollapsed(false);
    }
  }, [userRole]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setCollapsed(true)}
      />

      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-sidebar/95 text-sidebar-foreground shadow-2xl backdrop-blur-xl transition-all duration-300",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "w-64",
          "lg:translate-x-0"
        )}
      >
        <div className="h-1 bg-gradient-to-r from-accent via-primary to-chart-3" />

        <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent via-accent to-primary text-sidebar-primary-foreground shadow-lg shadow-accent/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight">TOCHI</span>
              <span className="text-xs text-sidebar-foreground/70">Legal Suite</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden border border-sidebar-border/70 text-sidebar-foreground hover:bg-sidebar-accent lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {!collapsed && (
          <div className="border-b border-sidebar-border px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/50">Rol</p>
            <p className="text-sm font-medium text-sidebar-foreground capitalize">
              {userRole === "superadmin" ? "Super Admin" : userRole}
            </p>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-accent/15"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-sidebar-foreground/80 group-hover:bg-white/10 group-hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {item.badge && !collapsed && (
                  <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border px-3 py-4">
          {filteredBottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-accent/15"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-sidebar-foreground/80 group-hover:bg-white/10 group-hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sidebar-foreground/80 transition-all duration-200 hover:-translate-x-0.5 hover:bg-destructive/20 hover:text-destructive"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
            </span>
            {!collapsed && <span className="text-sm font-medium">Cerrar Sesion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
