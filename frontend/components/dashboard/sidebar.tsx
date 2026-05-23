"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  FileText,
  Scale,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  CreditCard,
  Shield,
  RadioTower,
  Wrench,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[];
}

const lawyerNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/casos", label: "Casos", icon: Briefcase },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users, roles: ["superadmin", "admin", "abogado", "asistente"] },
  { href: "/dashboard/citas", label: "Calendario", icon: Calendar },
  { href: "/dashboard/documentos", label: "Documentos", icon: FileText },
  { href: "/dashboard/leyes", label: "Codigos Legales", icon: Scale },
  { href: "/dashboard/actualizaciones", label: "Novedades", icon: RadioTower },
  { href: "/dashboard/asistente", label: "Asistente IA", icon: MessageSquare, roles: ["superadmin", "admin", "abogado"] },
  { href: "/dashboard/facturacion", label: "Facturacion", icon: CreditCard },
  { href: "/dashboard/comunicacion", label: "Comunicacion", icon: MessageSquare, roles: ["superadmin", "admin", "abogado", "asistente"] },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3, roles: ["superadmin", "admin", "abogado"] },
  { href: "/dashboard/seguridad", label: "Seguridad", icon: Shield, roles: ["superadmin", "admin"] },
  { href: "/dashboard/herramientas", label: "Herramientas", icon: Wrench, roles: ["superadmin", "admin", "abogado", "asistente"] },
  { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck, roles: ["superadmin"] },
  { href: "/dashboard/admin/usuarios", label: "Usuarios", icon: ShieldCheck, roles: ["superadmin"] },
];

const adminNavItems: NavItem[] = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/usuarios", label: "Usuarios", icon: Users },
];

const bottomItems: NavItem[] = [
  { href: "/dashboard/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/precios", label: "Mi Suscripcion", icon: CreditCard },
  { href: "/dashboard/configuracion", label: "Configuracion", icon: Settings },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json()).catch(() => null);

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  const { data: userData } = useSWR(session?.user?.id ? `/api/users/me` : null, fetcher);
  const userRole = session?.user?.role || userData?.rol || "abogado";
  const isPrivileged = userRole === "superadmin" || userRole === "admin";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const filteredNavItems = isPrivileged
    ? adminNavItems
    : lawyerNavItems.filter((item) => {
        if (!item.roles) {
          return true;
        }
        return item.roles.includes(userRole);
      });

  const showLabels = mobileOpen || !collapsed;

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobileMenu}
      />

      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-3 z-50 rounded-full border bg-card shadow-sm lg:hidden"
        onClick={() => setMobileOpen((current) => !current)}
        aria-label={mobileOpen ? "Cerrar menu lateral" : "Abrir menu lateral"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-dvh w-[min(88vw,18rem)] max-w-[18rem] flex-col overflow-y-auto bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:w-64 lg:max-w-none",
          collapsed && "lg:w-20"
        )}
      >
        <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
            T
          </div>
          {showLabels && (
            <div className="flex flex-col">
              <span className="font-bold text-lg">TOCHI</span>
              <span className="text-xs text-sidebar-foreground/70">Legal Suite</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden lg:flex text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
          </Button>
        </div>

        {showLabels && (
          <div className="px-4 py-2 border-b border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60">Rol:</p>
            <p className="text-sm font-medium text-sidebar-foreground capitalize">
              {userRole === "superadmin" ? "Super Admin" : userRole}
            </p>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={closeMobileMenu}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {showLabels && <span className="text-sm font-medium">{item.label}</span>}
                {item.badge && showLabels && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={closeMobileMenu}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {showLabels && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {showLabels && <span className="text-sm font-medium">Cerrar Sesion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
