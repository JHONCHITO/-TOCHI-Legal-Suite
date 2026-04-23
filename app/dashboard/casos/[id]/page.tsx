"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText, Gavel, MessageSquare, Users } from "lucide-react";

const caseDetails: Record<
  string,
  {
    numeroInterno: string;
    titulo: string;
    cliente: string;
    estado: string;
    tipo: string;
    juzgado: string;
    proximaActuacion: string;
    estrategia: string;
    hitos: string[];
    documentos: string[];
  }
> = {
  "1": {
    numeroInterno: "TOCHI-2026-00021",
    titulo: "Demanda laboral por despido injustificado",
    cliente: "Juan Perez",
    estado: "Activo",
    tipo: "Laboral",
    juzgado: "Juzgado 5 Laboral del Circuito",
    proximaActuacion: "2026-04-24",
    estrategia: "Consolidar prueba documental, liquidacion de acreencias y preparar interrogatorio de parte.",
    hitos: [
      "Recepcion de documentos del trabajador",
      "Cuantificacion preliminar de pretensiones",
      "Audiencia inicial programada",
    ],
    documentos: ["Demanda inicial", "Liquidacion laboral", "Contrato de trabajo"],
  },
  "2": {
    numeroInterno: "TOCHI-2026-00019",
    titulo: "Cobro ejecutivo comercial",
    cliente: "Empresa ABC S.A.S.",
    estado: "Audiencia pendiente",
    tipo: "Comercial",
    juzgado: "Juzgado 8 Civil Municipal",
    proximaActuacion: "2026-04-26",
    estrategia: "Impulsar medidas cautelares y verificar notificacion al ejecutado.",
    hitos: ["Presentacion de demanda", "Auto admisorio", "Seguimiento de embargo"],
    documentos: ["Pagare", "Poder", "Certificado de existencia"],
  },
  "3": {
    numeroInterno: "TOCHI-2026-00012",
    titulo: "Tutela por derecho a la salud",
    cliente: "Rosa Martinez",
    estado: "En tramite",
    tipo: "Constitucional",
    juzgado: "Juzgado Primero Penal Municipal",
    proximaActuacion: "2026-04-23",
    estrategia: "Radicar soporte medico actualizado y reforzar perjuicio irremediable.",
    hitos: ["Radicacion de tutela", "Traslado a EPS", "Solicitud de medida provisional"],
    documentos: ["Historia clinica", "Orden medica", "Escrito de tutela"],
  },
};

export default function CasoDetallePage() {
  const params = useParams<{ id: string }>();
  const detail = caseDetails[params.id];

  if (!detail) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Caso no encontrado</h1>
        <Button asChild>
          <Link href="/dashboard/casos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a casos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/casos" className="hover:text-foreground">
              Casos
            </Link>
            <span>/</span>
            <span>{detail.numeroInterno}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{detail.titulo}</h1>
          <p className="text-muted-foreground">{detail.numeroInterno}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{detail.estado}</Badge>
          <Badge variant="outline">{detail.tipo}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del expediente</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{detail.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despacho / entidad</p>
                <p className="font-medium">{detail.juzgado}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proxima actuacion</p>
                <p className="font-medium">{detail.proximaActuacion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{detail.tipo}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estrategia juridica</CardTitle>
              <CardDescription>Linea de accion inmediata para este expediente.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{detail.estrategia}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hitos del proceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.hitos.map((item) => (
                <div key={item} className="rounded-lg border p-3 text-sm">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones rapidas</CardTitle>
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
              <CardTitle className="text-lg">Documentos clave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.documentos.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relacion operativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Cliente vinculado al CRM legal
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Agenda y plazos sincronizados
              </div>
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-primary" />
                Listo para seguimiento procesal
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
