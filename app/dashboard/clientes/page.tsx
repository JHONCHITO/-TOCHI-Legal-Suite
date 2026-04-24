"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Building,
  Edit,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { demoCases, demoClients, getClientDisplayName } from "@/lib/demo-data";

export default function ClientesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    return demoClients.filter((client) => {
      const displayName = getClientDisplayName(client).toLowerCase();
      return (
        displayName.includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.ciudad.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((chunk) => chunk[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion de Clientes</h1>
          <p className="text-muted-foreground">
            CRM legal con historial, contacto, expedientes activos y seguimiento.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clientes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{demoClients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{demoClients.filter((item) => item.activo).length}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {demoClients.filter((item) => item.tipo === "persona_natural").length}
            </div>
            <p className="text-xs text-muted-foreground">Personas naturales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {demoClients.filter((item) => item.tipo === "persona_juridica").length}
            </div>
            <p className="text-xs text-muted-foreground">Empresas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre, correo o ciudad..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredClients.map((client) => {
          const displayName = getClientDisplayName(client);
          const activeCases = demoCases.filter((item) => item.clienteId === client.id).length;

          return (
            <Card key={client.id} className="transition-colors hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback
                        className={
                          client.tipo === "persona_juridica"
                            ? "bg-chart-2/20 text-chart-2"
                            : "bg-primary/20 text-primary"
                        }
                      >
                        {client.tipo === "persona_juridica" ? (
                          <Building className="h-5 w-5" />
                        ) : (
                          getInitials(displayName)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{displayName}</CardTitle>
                      <CardDescription className="text-xs">
                        {client.tipo === "persona_juridica"
                          ? `NIT: ${client.nit}`
                          : `CC: ${client.documento}`}
                      </CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {client.telefono}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {client.ciudad}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <Badge variant={client.activo ? "default" : "secondary"}>
                    {client.activo ? "Activo" : "Inactivo"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{activeCases} casos activos</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
