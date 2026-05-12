"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Copy,
  Edit,
  FileClock,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Scale,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createDocument,
  useAppointments,
  useCase,
  useCommunications,
  useDocuments,
  useInvoices,
} from "@/lib/hooks/use-data";
import {
  appointmentTypeLabels,
  caseStatusColors,
  caseStatusLabels,
  caseTypeLabels,
  documentTypeLabels,
  formatCurrencyCop,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatTime,
  getClientDisplayName,
  invoiceStatusColors,
  invoiceStatusLabels,
} from "@/lib/utils/format";
import {
  LEGAL_TEMPLATES,
  getDefaultTemplateForCaseType,
  getDocumentTypeForTemplate,
  getTemplatesForCaseType,
  type LegalTemplateId,
} from "@/lib/document-templates";
import { toast } from "sonner";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type ClientRecord = {
  _id?: string;
  tipo?: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  email?: string;
  nit?: string;
  cedula?: string;
  ciudad?: string;
  tieneAccesoPortal?: boolean;
};

type TimelineKind = "actuacion" | "documento" | "cita" | "comunicacion" | "factura";

type TimelineItem = {
  id: string;
  kind: TimelineKind;
  date?: string | Date;
  title: string;
  description: string;
  badge?: string;
  href?: string;
};

const timelineStyles: Record<TimelineKind, { icon: ReactNode; tone: string; href?: string }> = {
  actuacion: {
    icon: <Scale className="h-4 w-4" />,
    tone: "bg-primary/10 text-primary",
  },
  documento: {
    icon: <FileText className="h-4 w-4" />,
    tone: "bg-accent/10 text-accent",
    href: "/dashboard/documentos",
  },
  cita: {
    icon: <Calendar className="h-4 w-4" />,
    tone: "bg-chart-3/10 text-chart-3",
    href: "/dashboard/citas",
  },
  comunicacion: {
    icon: <MessageSquare className="h-4 w-4" />,
    tone: "bg-emerald-100 text-emerald-700",
    href: "/dashboard/comunicacion",
  },
  factura: {
    icon: <Wallet className="h-4 w-4" />,
    tone: "bg-amber-100 text-amber-700",
    href: "/dashboard/facturacion",
  },
};

export default function CasoDetallePage() {
  const params = useParams<{ id: string }>();
  const caseId = params?.id ?? null;
  const { case: caseData, isLoading, isError, mutate } = useCase(caseId);
  const { documents, isLoading: documentsLoading, mutate: mutateDocuments } = useDocuments({
    casoId: caseId ?? undefined,
  });
  const { appointments, isLoading: appointmentsLoading, mutate: mutateAppointments } = useAppointments({
    casoId: caseId ?? undefined,
  });
  const { invoices, isLoading: invoicesLoading, mutate: mutateInvoices } = useInvoices({
    casoId: caseId ?? undefined,
  });
  const { communications, isLoading: communicationsLoading, mutate: mutateCommunications } = useCommunications({
    casoId: caseId ?? undefined,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplateId>("memorial");
  const [templateTouched, setTemplateTouched] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    if (!caseData || templateTouched) return;
    const detail = caseData as Record<string, any>;
    setSelectedTemplate(getDefaultTemplateForCaseType(detail.tipo));
  }, [caseData, templateTouched]);

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
  const clientRecord = client ? (client as ClientRecord) : null;
  const actuaciones = Array.isArray(detail.actuaciones) ? detail.actuaciones : [];
  const recommendedTemplates = getTemplatesForCaseType(detail.tipo);
  const caseDocuments = useMemo(() => {
    if (documents.length > 0) return documents;
    if (Array.isArray(detail.documentos)) return detail.documentos;
    return [];
  }, [documents, detail.documentos]);

  const activeAppointments = useMemo(
    () =>
      [...appointments].filter(
        (item: Record<string, any>) => item.estado !== "cancelada" && item.estado !== "completada"
      ),
    [appointments]
  );

  const nextAppointment = activeAppointments[0] as Record<string, any> | undefined;

  const financeSummary = useMemo(() => {
    const total = invoices.reduce((sum: number, invoice: Record<string, any>) => sum + Number(invoice.total || 0), 0);
    const paid = invoices.reduce((sum: number, invoice: Record<string, any>) => sum + Number(invoice.montoPagado || 0), 0);
    const pending = invoices.reduce((sum: number, invoice: Record<string, any>) => sum + Number(invoice.saldoPendiente || 0), 0);
    return {
      total,
      paid,
      pending,
      count: invoices.length,
    };
  }, [invoices]);

  const caseFinancialBalance = Math.max(
    Number(detail.honorarios || 0) - Number(detail.honorariosPagados || 0),
    0
  );
  const feeProgress = detail.honorarios
    ? Math.min(100, Math.round((Number(detail.honorariosPagados || 0) / Number(detail.honorarios)) * 100))
    : 0;

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [];

    actuaciones.forEach((actuacion: Record<string, any>, index: number) => {
      items.push({
        id: `act-${index}-${String(actuacion.fecha || index)}`,
        kind: "actuacion",
        date: actuacion.fecha,
        title: actuacion.tipo ? `Actuacion: ${actuacion.tipo}` : "Actuacion registrada",
        description: actuacion.descripcion || "Sin descripcion",
        badge: actuacion.tipo,
      });
    });

    caseDocuments.forEach((documento: Record<string, any>, index: number) => {
      items.push({
        id: `doc-${documento._id || index}`,
        kind: "documento",
        date: documento.createdAt || documento.updatedAt,
        title: documento.nombre || "Documento",
        description: `${documentTypeLabels[documento.tipo] || documento.tipo || "Documento"} · ${
          documento.estado || "borrador"
        }`,
        badge: documento.estado,
        href: "/dashboard/documentos",
      });
    });

    appointments.forEach((appointment: Record<string, any>, index: number) => {
      items.push({
        id: `apt-${appointment._id || index}`,
        kind: "cita",
        date: appointment.fechaInicio,
        title: appointment.titulo || "Cita",
        description: `${appointmentTypeLabels[appointment.tipo] || appointment.tipo || "Cita"} · ${
          appointment.ubicacion || appointment.descripcion || "Sin ubicacion"
        }`,
        badge: appointment.estado,
        href: "/dashboard/citas",
      });
    });

    communications.forEach((communication: Record<string, any>, index: number) => {
      items.push({
        id: `comm-${communication._id || index}`,
        kind: "comunicacion",
        date: communication.fecha || communication.createdAt,
        title: communication.asunto || `Comunicacion ${communication.canal || ""}`.trim(),
        description: communication.mensaje || "Sin mensaje",
        badge: communication.estado,
        href: "/dashboard/comunicacion",
      });
    });

    invoices.forEach((invoice: Record<string, any>, index: number) => {
      items.push({
        id: `inv-${invoice._id || index}`,
        kind: "factura",
        date: invoice.fechaEmision || invoice.createdAt,
        title: invoice.numero ? `Factura ${invoice.numero}` : "Factura",
        description: `${invoiceStatusLabels[invoice.estado] || invoice.estado || "pendiente"} · ${
          formatCurrencyCop(Number(invoice.total || 0))
        } · saldo ${formatCurrencyCop(Number(invoice.saldoPendiente || 0))}`,
        badge: invoice.estado,
        href: "/dashboard/facturacion",
      });
    });

    return items.sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });
  }, [appointments, actuaciones, caseDocuments, communications, invoices]);

  const selectedTemplateLabel =
    LEGAL_TEMPLATES.find((item) => item.value === selectedTemplate)?.label || "Memorial";

  const clientDisplayName = client
    ? getClientDisplayName({
        tipo: clientRecord?.tipo || "persona_natural",
        nombre: clientRecord?.nombre,
        apellido: clientRecord?.apellido,
        razonSocial: clientRecord?.razonSocial,
      })
    : "Sin cliente";

  const buildPromptData = () => ({
    demandante: clientDisplayName,
    demandado: detail.contraparte || detail.contraparteAbogado || "Parte contraria",
    ciudad: detail.ciudad || clientRecord?.ciudad || "",
    juzgado: detail.despacho || "",
    hechos: [detail.descripcion, detail.hechos].filter(Boolean).join("\n\n"),
    pretensiones: detail.pretensiones || "",
    fundamentos: `Caso ${caseTypeLabels[detail.tipo] || detail.tipo || "sin tipo"} en estado ${
      caseStatusLabels[detail.estado] || detail.estado || "sin estado"
    }. Radicado: ${detail.numeroRadicado || detail.numeroProceso || detail.numeroInterno || "N/A"}.`,
  });

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: selectedTemplate,
          datos: buildPromptData(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo generar el documento");
      }

      setGeneratedDraft(String(payload.documento || ""));
      toast.success("Borrador generado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el documento");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generatedDraft.trim()) {
      toast.error("Primero genera un borrador");
      return;
    }

    setIsSavingDraft(true);
    try {
      const created = await createDocument({
        nombre: `${selectedTemplateLabel} - ${detail.titulo}`,
        tipo: getDocumentTypeForTemplate(selectedTemplate) || "otro",
        estado: "borrador",
        clienteId: clientRecord?._id || detail.clienteId?._id,
        casoId: detail._id,
        descripcion: `Borrador generado desde Expediente 360 para ${detail.numeroInterno || detail.numeroRadicado || detail.titulo}`,
        contenido: generatedDraft,
        etiquetas: ["ia", "expediente-360", selectedTemplate],
      });

      toast.success("Documento guardado como borrador")
      setGeneratedDraft(generatedDraft);
      await Promise.all([mutate(), mutateDocuments(), mutateInvoices(), mutateAppointments(), mutateCommunications()]);
      return created;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el documento");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!generatedDraft.trim()) return;
    await navigator.clipboard.writeText(generatedDraft);
    toast.success("Borrador copiado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/casos" className="hover:text-foreground">
              Casos
            </Link>
            <span>/</span>
            <span>{detail.numeroInterno || detail.numeroRadicado || "Expediente"}</span>
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
          <Button asChild variant="outline">
            <Link href={`/dashboard/casos/${detail._id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.36)]">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-accent/15 px-3 py-1 text-accent hover:bg-accent/15">
                Expediente 360
              </Badge>
              <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1">
                {clientDisplayName}
              </Badge>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-balance lg:text-4xl">
                Control total del caso, el cliente, los plazos y la cartera.
              </h2>
              <p className="max-w-3xl text-muted-foreground text-pretty">
                Esta vista consolida en un solo lugar la informacion que normalmente queda repartida
                entre expedientes, documentos, agenda, comunicaciones y cobros.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link href="/dashboard/casos">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a casos
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-border/70">
                <Link href="/dashboard/documentos">
                  <FileText className="mr-2 h-4 w-4" />
                  Documentos
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-border/70">
                <Link href="/dashboard/facturacion">
                  <Wallet className="mr-2 h-4 w-4" />
                  Facturacion
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Cliente
                  </p>
                  <p className="mt-1 text-sm font-semibold">{clientDisplayName}</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {clientRecord?.email || "No hay cliente vinculado"}
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Actuacion proxima
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {detail.fechaProximaActuacion ? formatDateShort(detail.fechaProximaActuacion) : "Sin fecha"}
                  </p>
                </div>
                <div className="rounded-2xl bg-chart-3/10 p-3 text-chart-3">
                  <Clock3Icon />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {detail.despacho || "Despacho no registrado"}
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Honorarios
                  </p>
                  <p className="mt-1 text-sm font-semibold">{formatCurrencyCop(Number(detail.honorarios || 0))}</p>
                </div>
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Pagados {formatCurrencyCop(Number(detail.honorariosPagados || 0))} - saldo{" "}
                {formatCurrencyCop(caseFinancialBalance)}
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Documentos
                  </p>
                  <p className="mt-1 text-sm font-semibold">{caseDocuments.length} relacionados</p>
                </div>
                <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {documentsLoading ? "Actualizando documentos..." : "Sincronizados con el expediente"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-2 rounded-2xl bg-muted/40 p-2">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="cronologia">Cronologia</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="facturacion">Facturacion</TabsTrigger>
          <TabsTrigger value="ia">IA y borradores</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Datos del expediente</CardTitle>
                  <CardDescription>La informacion principal de la causa en un solo lugar.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{clientDisplayName}</p>
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
                    <p className="text-sm text-muted-foreground">Proxima actuacion</p>
                    <p className="font-medium">
                      {detail.fechaProximaActuacion ? formatDate(detail.fechaProximaActuacion) : "Sin fecha"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cuantia</p>
                    <p className="font-medium">
                      {detail.cuantia ? formatCurrencyCop(Number(detail.cuantia)) : "No registrada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Numero de proceso</p>
                    <p className="font-medium">{detail.numeroProceso || "Sin numero de proceso"}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Hechos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {detail.hechos || "Sin hechos registrados"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pretensiones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {detail.pretensiones || "Sin pretensiones registradas"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Descripcion y notas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Descripcion</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {detail.descripcion || "Sin descripcion"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Notas internas</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {detail.notas || "Sin notas internas"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen rapido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {client ? "Cliente vinculado al CRM" : "Sin cliente vinculado"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {appointments.length} citas relacionadas
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {caseDocuments.length} documentos relacionados
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    {financeSummary.count} facturas relacionadas
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Partes y contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {client ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        {clientDisplayName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        {clientRecord?.email || "Sin correo"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        {clientRecord?.tipo === "persona_juridica"
                          ? `NIT: ${clientRecord?.nit || "N/A"}`
                          : `CC: ${clientRecord?.cedula || "N/A"}`}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No hay cliente poblado para este caso.</p>
                  )}
                  <div className="border-t pt-3" />
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    {detail.contraparte || detail.contraparteAbogado || "Sin contraparte"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {detail.despacho || "Sin despacho"}
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    {detail.juez || "Sin juez registrado"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Honorarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total pactado</span>
                    <span className="font-medium">{formatCurrencyCop(Number(detail.honorarios || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pagado</span>
                    <span className="font-medium">{formatCurrencyCop(Number(detail.honorariosPagados || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saldo</span>
                    <span className="font-medium">{formatCurrencyCop(caseFinancialBalance)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${feeProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{feeProgress}% de honorarios registrados.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cronologia" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardHeader>
                <CardTitle>Linea de tiempo</CardTitle>
                <CardDescription>Actuaciones, documentos, agenda, comunicaciones y cobros.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aun no hay actividad registrada.</p>
                ) : (
                  timeline.map((item) => {
                    const style = timelineStyles[item.kind];
                    const content = (
                      <div className="flex items-start gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/40">
                        <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${style.tone}`}>
                          {style.icon}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{item.title}</p>
                            {item.badge ? <Badge variant="outline">{item.badge}</Badge> : null}
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.date ? formatDateTime(item.date) : "Sin fecha"}
                          </p>
                        </div>
                      </div>
                    );

                    if (item.href) {
                      return (
                        <Link key={item.id} href={item.href} className="block">
                          {content}
                        </Link>
                      );
                    }

                    return <div key={item.id}>{content}</div>;
                  })
                )}
              </CardContent>
            </Card>

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
                    <Link href="/dashboard/facturacion">
                      <Wallet className="mr-2 h-4 w-4" />
                      Revisar cartera
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
                  <CardTitle className="text-lg">Indicadores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Actuaciones</span>
                    <span className="font-medium text-foreground">{actuaciones.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Documentos</span>
                    <span className="font-medium text-foreground">{caseDocuments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Comunicaciones</span>
                    <span className="font-medium text-foreground">{communications.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Facturas</span>
                    <span className="font-medium text-foreground">{financeSummary.count}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Documentos del expediente</CardTitle>
                <CardDescription>Archivos, borradores y escritos asociados al caso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {documentsLoading ? (
                  <div className="flex h-[180px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : caseDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay documentos vinculados.</p>
                ) : (
                  caseDocuments.map((documento: Record<string, any>, index: number) => (
                    <div key={documento._id || index} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{documento.nombre || "Documento"}</p>
                            <Badge variant="outline">
                              {documentTypeLabels[documento.tipo] || documento.tipo || "Documento"}
                            </Badge>
                            {documento.estado ? (
                              <Badge className={documento.estado === "finalizado" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}>
                                {documento.estado}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {documento.descripcion || "Sin descripcion"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {documento.createdAt ? formatDateTime(documento.createdAt) : "Sin fecha"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href="/dashboard/documentos">
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Ver biblioteca
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Borrador IA</CardTitle>
                <CardDescription>Genera un escrito y guardalo como documento del caso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Plantilla</p>
                  <div className="grid gap-2">
                  {(recommendedTemplates.length ? recommendedTemplates : LEGAL_TEMPLATES).map((template) => (
                      <button
                        key={template.value}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(template.value);
                          setTemplateTouched(true);
                        }}
                        className={`rounded-2xl border p-3 text-left transition-colors ${
                          selectedTemplate === template.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <p className="font-medium">{template.label}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={handleGenerateDraft} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generar borrador
                    </>
                  )}
                </Button>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Resultado</p>
                    {generatedDraft ? (
                      <Button variant="ghost" size="sm" onClick={handleCopyDraft}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </Button>
                    ) : null}
                  </div>
                  <Textarea
                    value={generatedDraft}
                    readOnly
                    placeholder="Aqui aparecera el borrador generado..."
                    className="min-h-[280px]"
                  />
                </div>

                <Button className="w-full" variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft}>
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar como documento"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Agenda del expediente</CardTitle>
                <CardDescription>Audiencias, reuniones y seguimientos ligados al caso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointmentsLoading ? (
                  <div className="flex h-[180px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay citas ligadas al expediente.</p>
                ) : (
                  appointments.map((appointment: Record<string, any>) => (
                    <div key={appointment._id} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{appointment.titulo || "Cita"}</p>
                            <Badge className={appointmentTypeLabels[appointment.tipo] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                              {appointmentTypeLabels[appointment.tipo] || appointment.tipo || "Cita"}
                            </Badge>
                            {appointment.estado ? <Badge variant="outline">{appointment.estado}</Badge> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {appointment.descripcion || appointment.ubicacion || "Sin descripcion"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.fechaInicio ? formatDateTime(appointment.fechaInicio) : "Sin fecha"}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{appointment.esVirtual ? "Virtual" : "Presencial"}</p>
                          <p>{appointment.fechaFin ? formatTime(appointment.fechaFin) : ""}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Siguiente actuacion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {nextAppointment ? (
                  <>
                    <p className="font-medium text-foreground">{nextAppointment.titulo || "Cita"}</p>
                    <p>{nextAppointment.fechaInicio ? formatDateTime(nextAppointment.fechaInicio) : "Sin fecha"}</p>
                    <p>{nextAppointment.descripcion || nextAppointment.ubicacion || "Sin descripcion"}</p>
                    <Button asChild className="w-full" variant="outline">
                      <Link href="/dashboard/citas">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Ver calendario
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p>No hay citas pendientes para este expediente.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facturacion" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Facturacion vinculada</CardTitle>
                <CardDescription>Honorarios, cartera y pagos del expediente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoicesLoading ? (
                  <div className="flex h-[180px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay facturas asociadas a este caso.</p>
                ) : (
                  invoices.map((invoice: Record<string, any>) => (
                    <div key={invoice._id} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{invoice.numero || "Factura"}</p>
                            {invoice.estado ? (
                              <Badge className={invoiceStatusColors[invoice.estado] || "bg-muted text-muted-foreground"}>
                                {invoiceStatusLabels[invoice.estado] || invoice.estado}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.concepto || "Sin concepto"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vence {invoice.fechaVencimiento ? formatDateShort(invoice.fechaVencimiento) : "sin fecha"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrencyCop(Number(invoice.total || 0))}</p>
                          <p className="text-xs text-muted-foreground">
                            Saldo {formatCurrencyCop(Number(invoice.saldoPendiente || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen financiero</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Honorarios pactados</span>
                    <span className="font-medium">{formatCurrencyCop(Number(detail.honorarios || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Honorarios pagados</span>
                    <span className="font-medium">{formatCurrencyCop(Number(detail.honorariosPagados || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Saldo honorarios</span>
                    <span className="font-medium">{formatCurrencyCop(caseFinancialBalance)}</span>
                  </div>
                  <div className="border-t pt-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total facturado</span>
                    <span className="font-medium">{formatCurrencyCop(financeSummary.total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total pagado</span>
                    <span className="font-medium">{formatCurrencyCop(financeSummary.paid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Saldo pendiente</span>
                    <span className="font-medium">{formatCurrencyCop(financeSummary.pending)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acceso al portal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    {clientRecord?.tieneAccesoPortal
                      ? "Portal habilitado para este cliente."
                      : "Portal pendiente de activacion."}
                  </p>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/dashboard/clientes">
                      <Users className="mr-2 h-4 w-4" />
                      Abrir CRM
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Asistente IA del expediente</CardTitle>
                <CardDescription>
                  Genera borradores con contexto real del caso y guardalos como documentos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {LEGAL_TEMPLATES.map((template) => (
                    <button
                      key={template.value}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(template.value);
                        setTemplateTouched(true);
                      }}
                      className={`rounded-3xl border p-4 text-left transition-all ${
                        selectedTemplate === template.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <p className="font-medium">{template.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleGenerateDraft} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generar borrador
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft}>
                    {isSavingDraft ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar como documento"
                    )}
                  </Button>
                  <Button variant="ghost" onClick={handleCopyDraft} disabled={!generatedDraft.trim()}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar borrador
                  </Button>
                </div>

                <Textarea
                  value={generatedDraft}
                  readOnly
                  placeholder="El resultado del modelo aparecera aqui..."
                  className="min-h-[420px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contexto usado por la IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em]">Plantilla activa</p>
                  <p className="mt-1 font-medium text-foreground">{selectedTemplateLabel}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em]">Cliente</p>
                  <p className="mt-1 font-medium text-foreground">{clientDisplayName}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em]">Expediente</p>
                  <p className="mt-1 font-medium text-foreground">{detail.numeroInterno || detail.numeroRadicado || "Sin numero"}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em]">Objetivo</p>
                  <p className="mt-1 font-medium text-foreground">
                    Crear un borrador listo para revisar, ajustar y guardar en MongoDB.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Clock3Icon() {
  return <FileClock className="h-4 w-4" />;
}
