"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Edit,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClient } from "@/lib/hooks/use-data";
import { formatDate, getClientDisplayName, getInitials } from "@/lib/utils/format";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default function ClienteDetallePage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id ?? null;
  const { client, isLoading, isError, mutate } = useClient(clientId);

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Cliente no encontrado</h1>
        <p className="text-muted-foreground">
          El cliente no existe, fue eliminado o no tienes permisos para verlo.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/clientes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a clientes
            </Link>
          </Button>
          <Button variant="outline" onClick={() => mutate()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const detail = client as Record<string, any>;
  const cases = Array.isArray(detail.casos) ? detail.casos : [];
  const displayName = getClientDisplayName(detail as { tipo: string; nombre?: string; apellido?: string; razonSocial?: string });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/clientes" className="hover:text-foreground">
              Clientes
            </Link>
            <span>/</span>
            <span>{displayName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              <p className="text-muted-foreground">
                {detail.tipo === "persona_juridica"
                  ? `NIT: ${detail.nit || "N/A"}`
                  : `CC: ${detail.cedula || "N/A"}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={detail.activo ? "default" : "secondary"}>
            {detail.activo ? "Activo" : "Inactivo"}
          </Badge>
          <Button asChild variant="outline">
            <Link href={`/dashboard/clientes/${detail._id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos de contacto</CardTitle>
              <CardDescription>Informaci&oacute;n base del CRM legal.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Correo electr&oacute;nico</p>
                <p className="font-medium">{detail.email || "Sin correo"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tel&eacute;fono</p>
                <p className="font-medium">{detail.telefono || "Sin telefono"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Celular adicional</p>
                <p className="font-medium">{detail.celular || "No registrado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Direcci&oacute;n</p>
                <p className="font-medium">{detail.direccion || "Sin direccion"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ciudad</p>
                <p className="font-medium">{detail.ciudad || "Sin ciudad"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departamento</p>
                <p className="font-medium">{detail.departamento || "Sin departamento"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Creado</p>
                <p className="font-medium">
                  {detail.createdAt ? formatDate(detail.createdAt) : "Sin fecha"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Portal cliente</p>
                <p className="font-medium">
                  {detail.tieneAccesoPortal ? "Habilitado" : "No habilitado"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas internas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {detail.notas || "Sin notas internas"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Casos asociados</CardTitle>
              <CardDescription>Expedientes vinculados a este cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay casos asociados.</p>
              ) : (
                cases.map((caso: Record<string, any>, index: number) => (
                  <div key={caso._id || index} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{caso.titulo || "Caso sin titulo"}</p>
                        <p className="text-xs text-muted-foreground">
                          {caso.numeroInterno || caso.numeroRadicado || "Sin numero"}
                        </p>
                      </div>
                      <Badge variant="outline">{caso.estado || "consulta"}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/casos/${caso._id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Ver caso
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/casos/${caso._id}/editar`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen r&aacute;pido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {cases.length} casos asociados
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                {detail.email || "Sin correo"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                {detail.telefono || "Sin telefono"}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {detail.ciudad || "Sin ciudad"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones r&aacute;pidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/dashboard/casos/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear caso
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/citas">
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Programar cita
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
