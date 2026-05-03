"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  Edit,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Scale,
  User,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCase } from "@/lib/hooks/use-data";
import {
  caseStatusColors,
  caseStatusLabels,
  caseTypeLabels,
  formatCurrencyCop,
  formatDate,
  formatDateTime,
  getClientDisplayName,
} from "@/lib/utils/format";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default function CasoDetallePage() {
  const params = useParams<{ id: string }>();
  const caseId = params?.id ?? null;
  const { case: caseData, isLoading, isError, mutate } = useCase(caseId);

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !caseData) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Caso no encontrado</h1>
        <p className="text-muted-foreground">
          El expediente no existe, fue eliminado o no tienes permisos para verlo.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/casos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a casos
            </Link>
          </Button>
          <Button variant="outline" onClick={() => mutate()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const detail = caseData as Record<string, any>;
  const client = isRecord(detail.clienteId) ? detail.clienteId : null;
  const actuaciones = Array.isArray(detail.actuaciones) ? detail.actuaciones : [];
  const documentos = Array.isArray(detail.documentos) ? detail.documentos : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/casos" className="hover:text-foreground">
              Casos
            </Link>
            <span>/</span>
            <span>{detail.numeroInterno || detail.numeroRadicado || "Detalle"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{detail.titulo}</h1>
          <p className="text-muted-foreground">
            {detail.numeroInterno || detail.numeroRadicado || "Sin numero interno"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={caseStatusColors[detail.estado] || "bg-muted text-muted-foreground"}>
            {caseStatusLabels[detail.estado] || detail.estado}
          </Badge>
          <Badge variant="outline">{caseTypeLabels[detail.tipo] || detail.tipo}</Badge>
          <Button asChild>
            <Link href={`/dashboard/casos/${detail._id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del expediente</CardTitle>
              <CardDescription>Datos principales guardados en MongoDB.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">
                  {client ? getClientDisplayName(client as { tipo: string }) : "Sin cliente"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calidad del cliente</p>
                <p className="font-medium">{detail.calidadCliente || "No registrada"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despacho</p>
                <p className="font-medium">{detail.despacho || "Sin despacho"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ciudad</p>
                <p className="font-medium">{detail.ciudad || "Sin ciudad"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                <p className="font-medium">
                  {detail.fechaInicio ? formatDate(detail.fechaInicio) : "Sin fecha"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pr&oacute;xima actuaci&oacute;n</p>
                <p className="font-medium">
                  {detail.fechaProximaActuacion ? formatDate(detail.fechaProximaActuacion) : "Sin fecha"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cuant&iacute;a</p>
                <p className="font-medium">
                  {detail.cuantia ? formatCurrencyCop(detail.cuantia) : "No registrada"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Honorarios</p>
                <p className="font-medium">
                  {detail.honorarios ? formatCurrencyCop(detail.honorarios) : "No registrados"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Descripci&oacute;n</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {detail.descripcion || "Sin descripci&oacute;n"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hechos y pretensiones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Hechos</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {detail.hechos || "Sin hechos registrados"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Pretensiones</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {detail.pretensiones || "Sin pretensiones registradas"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actuaciones</CardTitle>
              <CardDescription>Seguimiento del expediente y trazabilidad del caso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {actuaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">A&uacute;n no hay actuaciones registradas.</p>
              ) : (
                actuaciones.map((actuacion: Record<string, any>, index: number) => (
                  <div key={`${actuacion.fecha || "act"}-${index}`} className="rounded-lg border p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      {actuacion.fecha ? formatDateTime(actuacion.fecha) : "Sin fecha"}
                      {actuacion.tipo ? <Badge variant="outline">{actuacion.tipo}</Badge> : null}
                    </div>
                    <p className="text-sm">{actuacion.descripcion || "Sin descripción"}</p>
                  </div>
                ))
              )}
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones r&aacute;pidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/dashboard/documentos">
                  <FileText className="mr-2 h-4 w-4" />
                  Abrir documentos
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/citas">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver agenda
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/asistente">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Consultar IA
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relacion operativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Cliente vinculado al CRM legal
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Agenda sincronizada con plazos
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Datos listos para soporte documental y jur&iacute;dico
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentos vinculados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {documentos.length === 0 ? (
                <p className="text-muted-foreground">No hay documentos asociados.</p>
              ) : (
                documentos.map((documento: Record<string, any>, index: number) => (
                  <div key={`${documento._id || documento}-${index}`} className="rounded-lg border p-3">
                    {documento.nombre || documento.titulo || "Documento"}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente vinculado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client ? (
                <>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    {getClientDisplayName(client as { tipo: string; nombre?: string; apellido?: string; razonSocial?: string })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    {(client.email as string) || "Sin correo"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    {(client.telefono as string) || "Sin telefono"}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No hay cliente poblado para este caso.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
