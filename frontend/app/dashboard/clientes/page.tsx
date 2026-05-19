"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building,
  Edit,
  Eye,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useClients, deleteClient } from "@/lib/hooks/use-data";
import { getClientDisplayName, getInitials } from "@/lib/utils/format";
import { toast } from "sonner";

export default function ClientesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const isPrivileged = userRole === "superadmin" || userRole === "admin";

  const { clients, isLoading, isError, mutate } = useClients({
    search: searchQuery || undefined,
    enabled: status === "authenticated" && !isPrivileged,
  });

  const stats = useMemo(() => {
    const activos = clients.filter((c: { activo: boolean }) => c.activo).length;
    const naturales = clients.filter((c: { tipo: string }) => c.tipo === "persona_natural").length;
    const juridicas = clients.filter((c: { tipo: string }) => c.tipo === "persona_juridica").length;
    return { total: clients.length, activos, naturales, juridicas };
  }, [clients]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteClient(deleteId);
      toast.success("Cliente eliminado correctamente");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar cliente");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isPrivileged) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Vista protegida</CardTitle>
            <CardDescription>
              Los registros de clientes pertenecen al espacio de cada abogado y no se muestran en el panel
              superadmin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El superadmin administra usuarios internos, suscripciones y la plataforma. Los clientes, casos,
              documentos y facturacion permanecen separados por despacho.
            </p>
            <Button asChild>
              <Link href="/dashboard/admin">Ir al panel administrativo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error al cargar los clientes</p>
          <Button variant="outline" onClick={() => mutate()} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Clientes totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.activos}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.naturales}</div>
            <p className="text-xs text-muted-foreground">Personas naturales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.juridicas}</div>
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

      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex h-[300px] flex-col items-center justify-center text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-medium">No hay clientes registrados</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Comienza registrando tu primer cliente
            </p>
            <Button asChild>
              <Link href="/dashboard/clientes/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client: {
            _id: string;
            tipo: string;
            nombre?: string;
            apellido?: string;
            razonSocial?: string;
            cedula?: string;
            nit?: string;
            email: string;
            telefono: string;
            ciudad: string;
            activo: boolean;
            tieneAccesoPortal?: boolean;
            casos?: { _id: string }[];
          }) => {
            const displayName = getClientDisplayName(client);
            const activeCases = client.casos?.length || 0;

            return (
              <Card key={client._id} className="transition-colors hover:border-primary/50">
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
                            ? `NIT: ${client.nit || "N/A"}`
                            : `CC: ${client.cedula || "N/A"}`}
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
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/clientes/${client._id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/clientes/${client._id}/editar`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(client._id)}
                        >
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

                  <div className="flex items-center justify-between border-t pt-4">
                    <Badge variant={client.activo ? "default" : "secondary"}>
                      {client.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant={client.tieneAccesoPortal ? "outline" : "secondary"}>
                        {client.tieneAccesoPortal ? "Portal" : "Sin portal"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{activeCases} casos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Solo se puede eliminar un cliente que no tenga
              casos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
