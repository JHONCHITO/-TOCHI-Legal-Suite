"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
} from "lucide-react";
import Link from "next/link";

// Mock data
const mockClients = [
  {
    id: "1",
    tipo: "persona_natural",
    nombre: "Juan",
    apellido: "Perez",
    email: "juan.perez@email.com",
    telefono: "3001234567",
    ciudad: "Bogota",
    casosActivos: 2,
    activo: true,
  },
  {
    id: "2",
    tipo: "persona_natural",
    nombre: "Maria",
    apellido: "Garcia",
    email: "maria.garcia@email.com",
    telefono: "3009876543",
    ciudad: "Medellin",
    casosActivos: 1,
    activo: true,
  },
  {
    id: "3",
    tipo: "persona_juridica",
    razonSocial: "Empresa ABC S.A.S",
    nit: "900123456-7",
    email: "contacto@empresaabc.com",
    telefono: "6012345678",
    ciudad: "Bogota",
    casosActivos: 3,
    activo: true,
  },
  {
    id: "4",
    tipo: "persona_natural",
    nombre: "Pedro",
    apellido: "Rodriguez",
    email: "pedro.rodriguez@email.com",
    telefono: "3105551234",
    ciudad: "Cali",
    casosActivos: 1,
    activo: true,
  },
  {
    id: "5",
    tipo: "persona_juridica",
    razonSocial: "Comercializadora XYZ Ltda",
    nit: "800987654-3",
    email: "legal@xyz.com.co",
    telefono: "6049876543",
    ciudad: "Barranquilla",
    casosActivos: 0,
    activo: false,
  },
];

export default function ClientesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = mockClients.filter((client) => {
    const name = client.tipo === "persona_natural"
      ? `${client.nombre} ${client.apellido}`
      : client.razonSocial;
    return (
      name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getClientName = (client: typeof mockClients[0]) => {
    return client.tipo === "persona_natural"
      ? `${client.nombre} ${client.apellido}`
      : client.razonSocial;
  };

  const getInitials = (client: typeof mockClients[0]) => {
    if (client.tipo === "persona_natural") {
      return `${client.nombre?.[0] || ""}${client.apellido?.[0] || ""}`.toUpperCase();
    }
    return client.razonSocial?.slice(0, 2).toUpperCase() || "EM";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion de Clientes</h1>
          <p className="text-muted-foreground">
            Administra tus clientes y sus casos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clientes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Clientes Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">98</div>
            <p className="text-xs text-muted-foreground">Personas Naturales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">58</div>
            <p className="text-xs text-muted-foreground">Empresas</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={client.tipo === "persona_juridica" ? "bg-chart-2/20 text-chart-2" : "bg-primary/20 text-primary"}>
                      {client.tipo === "persona_juridica" ? (
                        <Building className="h-5 w-5" />
                      ) : (
                        getInitials(client)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{getClientName(client)}</CardTitle>
                    <CardDescription className="text-xs">
                      {client.tipo === "persona_juridica" ? `NIT: ${client.nit}` : "Persona Natural"}
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
            <CardContent>
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
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Badge variant={client.activo ? "default" : "secondary"}>
                  {client.activo ? "Activo" : "Inactivo"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {client.casosActivos} casos activos
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
