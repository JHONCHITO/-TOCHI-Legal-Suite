"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Briefcase, FileText, LogOut, Scale, ShieldCheck } from "lucide-react";

export function PortalHeader() {
  const { data: session } = useSession();
  const user = session?.user;

  const displayName = user?.name || "Cliente";
  const displayRole = user?.role || "cliente";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold">TOCHI Legal Suite</p>
              <Badge variant="outline" className="rounded-full">
                Portal cliente
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Tu espacio privado para casos, documentos y facturacion
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 text-sm lg:flex">
          <Link href="/portal#resumen">
            <Button variant="ghost" size="sm">
              Resumen
            </Button>
          </Link>
          <Link href="/portal#casos">
            <Button variant="ghost" size="sm">
              <Briefcase className="mr-2 h-4 w-4" />
              Casos
            </Button>
          </Link>
          <Link href="/portal#documentos">
            <Button variant="ghost" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Documentos
            </Button>
          </Link>
          <Link href="/portal#facturas">
            <Button variant="ghost" size="sm">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Facturas
            </Button>
          </Link>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {displayRole}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/portal#resumen">Ir al portal</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/precios">Mi suscripcion</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
