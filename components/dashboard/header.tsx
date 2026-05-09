"use client";

import Link from "next/link";
import { Bell, Search, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useNotifications } from "@/lib/hooks/use-data";

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const { unreadCount } = useNotifications();

  // Demo user fallback
  const displayName = user?.name || "Abogado Demo";
  const displayRole =
    (user as { rol?: string; role?: string } | undefined)?.rol ||
    user?.role ||
    "abogado";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="flex min-h-20 items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="hidden xl:flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Centro operativo legal
        </div>

        {/* Search */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar casos, clientes, documentos o facturas"
              className="h-12 rounded-full border-border/70 bg-card/85 pl-11 shadow-sm backdrop-blur focus-visible:ring-accent/40"
            />
          </div>

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>Actualizado hace unos segundos</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="outline"
            size="icon"
            className="relative h-11 w-11 rounded-full border-border/70 bg-card/80 shadow-sm"
            asChild
          >
            <Link href="/dashboard/notificaciones">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground shadow">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-11 gap-3 rounded-full border-border/70 bg-card/80 px-3 shadow-sm"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-sm text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold">{displayName}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {displayRole}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/configuracion">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/configuracion">Configuracion</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Cerrar Sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
