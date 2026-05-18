"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  FileText,
  Loader2,
  MessageSquare,
  ListChecks,
  Upload,
  Wallet,
  Briefcase,
  Download,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  approvePortalDocument,
  uploadDocument,
  useAppointments,
  useCases,
  useCommunications,
  useDocuments,
  useInvoices,
  useNotifications,
} from "@/lib/hooks/use-data";
import {
  appointmentTypeLabels,
  caseStatusLabels,
  documentTypeLabels,
  formatCurrencyCop,
  formatDateShort,
  formatDateTime,
  getClientDisplayName,
  invoiceStatusLabels,
} from "@/lib/utils/format";

async function fetcher(url: string) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "No se pudo cargar la informacion del portal");
  }
  return payload;
}

export default function ClientPortalPage() {
  const { data: userData, isLoading: userLoading } = useSWR("/api/users/me", fetcher);
  const { data: client, isLoading: clientLoading, mutate: mutateClient } = useSWR("/api/clients/me", fetcher);
  const { cases, isLoading: casesLoading } = useCases();
  const { documents, isLoading: documentsLoading, mutate: mutateDocuments } = useDocuments();
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { communications, isLoading: communicationsLoading } = useCommunications();
  const { notifications, unreadCount, isLoading: notificationsLoading } = useNotifications();

  const [isUploading, setIsUploading] = useState(false);
  const [selectedUploadCaseId, setSelectedUploadCaseId] = useState("");
  const [selectedUploadType, setSelectedUploadType] = useState("otro");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [approvingDocumentId, setApprovingDocumentId] = useState<string | null>(null);

  const activeCases = useMemo(
    () => cases.filter((item: Record<string, any>) => !["cerrado", "archivado"].includes(item.estado)),
    [cases]
  );

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((item: Record<string, any>) => item.estado !== "cancelada" && item.estado !== "completada")
        .slice(0, 4),
    [appointments]
  );

  const pendingInvoices = useMemo(
    () => invoices.filter((item: Record<string, any>) => item.estado !== "pagada").slice(0, 4),
    [invoices]
  );

  const recentDocuments = useMemo(() => documents.slice(0, 6), [documents]);
  const recentNotifications = useMemo(() => notifications.slice(0, 6), [notifications]);
  const recentActuations = useMemo(() => {
    const timeline = cases.flatMap((item: Record<string, any>) =>
      (item.actuaciones || []).map((actuacion: Record<string, any>) => ({
        ...actuacion,
        caseId: String(item._id),
        caseTitle: item.titulo || "Caso",
        caseNumber: item.numeroInterno || item.numeroRadicado || "",
      }))
    );

    return timeline
      .sort((a: Record<string, any>, b: Record<string, any>) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 6);
  }, [cases]);
  const approvalPendingDocuments = useMemo(
    () =>
      documents.filter(
        (item: Record<string, any>) =>
          item.portalCompartido && (item.estado === "revision" || item.requiereAprobacion)
      ),
    [documents]
  );
  const recentMessages = useMemo(() => communications.slice(0, 4), [communications]);

  const totals = useMemo(() => {
    const totalFacturado = invoices.reduce((sum: number, item: Record<string, any>) => sum + Number(item.total || 0), 0);
    const totalPendiente = invoices.reduce((sum: number, item: Record<string, any>) => sum + Number(item.saldoPendiente || 0), 0);
    return {
      cases: cases.length,
      activeCases: activeCases.length,
      documents: documents.length,
      appointments: appointments.length,
      invoices: invoices.length,
      totalFacturado,
      totalPendiente,
    };
  }, [activeCases.length, appointments.length, cases.length, documents.length, invoices]);

  const clientName = client
    ? getClientDisplayName({
        tipo: client.tipo,
        nombre: client.nombre,
        apellido: client.apellido,
        razonSocial: client.razonSocial,
      })
    : "Cliente";

  const handleUploadDocument = async () => {
    if (!uploadFile) {
      toast.error("Selecciona un archivo para subir");
      return;
    }

    if (!uploadTitle.trim()) {
      toast.error("Escribe un nombre para el archivo");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("nombre", uploadTitle.trim());
      formData.append("descripcion", uploadDescription.trim());
      formData.append("tipo", selectedUploadType);
      if (selectedUploadCaseId) {
        formData.append("casoId", selectedUploadCaseId);
      }

      await uploadDocument(formData);
      toast.success("Archivo cargado correctamente");
      setUploadFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setSelectedUploadType("otro");
      setSelectedUploadCaseId("");
      await mutateDocuments();
      await mutateClient();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleApproveDocument = async (documentId: string, documentName: string) => {
    const confirmed = window.confirm(
      `Quieres aprobar y firmar el documento "${documentName}" con tu nombre registrado?`
    );
    if (!confirmed) {
      return;
    }

    setApprovingDocumentId(documentId);
    try {
      await approvePortalDocument(documentId, { firmaNombre: clientName });
      toast.success("Documento aprobado y firmado");
      await mutateDocuments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo aprobar el documento");
    } finally {
      setApprovingDocumentId(null);
    }
  };

  if (
    userLoading ||
    clientLoading ||
    casesLoading ||
    documentsLoading ||
    appointmentsLoading ||
    invoicesLoading ||
    communicationsLoading ||
    notificationsLoading
  ) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (userData?.rol !== "cliente") {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Portal de cliente</CardTitle>
          <CardDescription>
            Esta vista esta pensada para clientes con acceso habilitado. Si necesitas revisar el
            trabajo interno del despacho, entra al panel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Ir al panel interno
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Sin perfil de cliente</CardTitle>
          <CardDescription>
            Tu abogado todavía no ha sincronizado tu expediente al portal. Pidele que use el
            boton "Enviar al portal" desde la ficha del cliente para vincular tu cuenta y
            compartir tus casos, documentos, citas y facturas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section id="resumen" className="rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.36)]">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-accent/15 px-3 py-1 text-accent hover:bg-accent/15">
                Portal cliente
              </Badge>
              <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1">
                {client.tieneAccesoPortal ? "Acceso habilitado" : "Acceso pendiente"}
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-balance lg:text-4xl">
                Hola, {clientName}.
              </h1>
              <p className="max-w-3xl text-muted-foreground text-pretty">
                Aqui ves el estado de tus casos, documentos, agenda y facturacion sin depender del
                panel interno del despacho.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link href="#casos">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Ver casos
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-border/70">
                <Link href="#documentos">
                  <FileText className="mr-2 h-4 w-4" />
                  Ver documentos
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Casos activos</p>
                  <p className="mt-1 text-2xl font-bold">{totals.activeCases}</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Documentos</p>
                  <p className="mt-1 text-2xl font-bold">{totals.documents}</p>
                </div>
                <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pendiente</p>
                  <p className="mt-1 text-2xl font-bold">{formatCurrencyCop(totals.totalPendiente)}</p>
                </div>
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Agenda</p>
                  <p className="mt-1 text-2xl font-bold">{totals.appointments}</p>
                </div>
                <div className="rounded-2xl bg-chart-3/10 p-3 text-chart-3">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="notificaciones">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notificaciones recientes
              </CardTitle>
              <CardDescription>
                Alertas de tu caso, agenda y documentos. Sin informacion de otros clientes.
              </CardDescription>
            </div>
            {unreadCount > 0 ? <Badge className="rounded-full bg-destructive text-destructive-foreground">{unreadCount}</Badge> : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Todavia no tienes notificaciones.
              </div>
            ) : (
              recentNotifications.map((notif: Record<string, any>) => (
                <div key={String(notif._id)} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{notif.titulo || "Notificacion"}</p>
                      <p className="text-sm text-muted-foreground">{notif.mensaje || "Sin detalle"}</p>
                    </div>
                    {notif.leida ? <Badge variant="outline">Leida</Badge> : <Badge>Nuevo</Badge>}
                  </div>
                  {notif.enlace ? (
                    <Button asChild variant="link" className="mt-2 h-auto p-0">
                      <Link href={notif.enlace}>Ver detalle</Link>
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card id="actuaciones">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="h-5 w-5 text-primary" />
                Actuaciones del caso
              </CardTitle>
              <CardDescription>
                Seguimiento de movimientos, tareas y avances registrados por el despacho.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActuations.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aun no hay actuaciones visibles para tus casos.
              </div>
            ) : (
              recentActuations.map((actuacion: Record<string, any>) => (
                <div key={`${actuacion.caseId}-${String(actuacion.fecha)}-${actuacion.tipo}`} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{actuacion.tipo || "Actuacion"}</p>
                      <p className="text-xs text-muted-foreground">
                        {actuacion.caseNumber || "Caso"} · {actuacion.caseTitle || "Caso"}
                      </p>
                      <p className="text-sm text-muted-foreground">{actuacion.descripcion || "Sin descripcion"}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(actuacion.fecha)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card id="subir-archivo">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Subir archivo al expediente
            </CardTitle>
            <CardDescription>
              Comparte soportes o anexos para que el despacho los revise desde tu propio portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Nombre del archivo</Label>
              <Input
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder="Ej: Certificado medico"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select value={selectedUploadType} onValueChange={setSelectedUploadType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="otro">Otro</SelectItem>
                  <SelectItem value="memorial">Memorial</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="poder">Poder</SelectItem>
                  <SelectItem value="recurso">Recurso</SelectItem>
                  <SelectItem value="concepto">Concepto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Asociar a un caso</Label>
              <Select
                value={selectedUploadCaseId || "__none__"}
                onValueChange={(value) => setSelectedUploadCaseId(value === "__none__" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un caso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin caso</SelectItem>
                  {activeCases.map((caso: Record<string, any>) => (
                    <SelectItem key={String(caso._id)} value={String(caso._id)}>
                      {caso.numeroInterno || caso.numeroRadicado || caso.titulo || "Caso"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Archivo</Label>
              <Input
                type="file"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setUploadFile(nextFile);
                  if (nextFile && !uploadTitle.trim()) {
                    setUploadTitle(nextFile.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {uploadFile ? `Seleccionado: ${uploadFile.name}` : "PDF, imagen o documento de soporte."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={uploadDescription}
                onChange={(event) => setUploadDescription(event.target.value)}
                placeholder="Agrega contexto para que el despacho entienda el archivo"
                className="min-h-[120px]"
              />
            </div>

            <Button onClick={handleUploadDocument} disabled={isUploading} className="rounded-full">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar al despacho
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen rapido</CardTitle>
            <CardDescription>Estado actual de tu relacion con el despacho.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Casos totales</p>
              <p className="mt-2 text-2xl font-bold">{totals.cases}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Facturas</p>
              <p className="mt-2 text-2xl font-bold">{totals.invoices}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Facturacion total</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrencyCop(totals.totalFacturado)}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Acceso portal</p>
              <p className="mt-2 text-2xl font-bold">{client.tieneAccesoPortal ? "Si" : "Pendiente"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="casos">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Casos recientes</CardTitle>
              <CardDescription>Expedientes que puedes revisar desde tu portal.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeCases.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aun no tienes casos visibles en el portal.
              </div>
            ) : (
              activeCases.slice(0, 4).map((caso: Record<string, any>) => (
                <div key={String(caso._id)} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{caso.titulo || "Caso"}</p>
                      <p className="text-xs text-muted-foreground">
                        {caso.numeroInterno || caso.numeroRadicado || "Sin numero"} ·{" "}
                        {caseStatusLabels[caso.estado] || caso.estado || "Activo"}
                      </p>
                    </div>
                    <Badge variant="outline">{caseStatusLabels[caso.estado] || caso.estado || "Activo"}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card id="documentos">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Documentos recientes</CardTitle>
              <CardDescription>Archivos que el despacho ya compartio contigo.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDocuments.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Todavia no hay documentos compartidos.
              </div>
            ) : (
              recentDocuments.map((document: Record<string, any>) => (
                <div key={String(document._id)} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{document.nombre || document.archivoNombre || "Documento"}</p>
                      <p className="text-xs text-muted-foreground">
                        {documentTypeLabels[document.tipo] || document.tipo || "Documento"} ·{" "}
                        {formatDateShort(document.createdAt)}
                      </p>
                      {document.descripcion ? (
                        <p className="text-sm text-muted-foreground">{document.descripcion}</p>
                      ) : null}
                    </div>
                    {document.archivoUrl ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={document.archivoUrl} download={document.archivoNombre || document.nombre || "archivo"}>
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card id="agenda">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Agenda</CardTitle>
              <CardDescription>Próximas citas y compromisos.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No tienes citas proximas.
              </div>
            ) : (
              upcomingAppointments.map((appointment: Record<string, any>) => (
                <div key={String(appointment._id)} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{appointment.titulo || "Cita"}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointmentTypeLabels[appointment.tipo] || appointment.tipo || "Agenda"} ·{" "}
                        {formatDateTime(appointment.fechaInicio)}
                      </p>
                    </div>
                    <Badge variant="outline">{appointment.estado || "programada"}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card id="facturas">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Facturas</CardTitle>
              <CardDescription>Estado financiero y pagos pendientes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No tienes facturas pendientes.
              </div>
            ) : (
              pendingInvoices.map((invoice: Record<string, any>) => (
                <div key={String(invoice._id)} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.numero || "Factura"}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoiceStatusLabels[invoice.estado] || invoice.estado || "Pendiente"} ·{" "}
                        {formatCurrencyCop(Number(invoice.total || 0))}
                      </p>
                      {invoice.concepto ? <p className="text-sm text-muted-foreground">{invoice.concepto}</p> : null}
                    </div>
                    <Badge variant="outline">{invoice.estado || "pendiente"}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="mensajes">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comunicaciones recientes
          </CardTitle>
          <CardDescription>Interacciones compartidas con el despacho.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recentMessages.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-4">
              No hay mensajes recientes.
            </div>
          ) : (
            recentMessages.map((message: Record<string, any>) => (
              <div key={String(message._id)} className="rounded-2xl border p-4">
                <p className="font-medium">{message.asunto || "Mensaje"}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                  {message.contenido || message.mensaje || "Sin contenido"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {approvalPendingDocuments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Documentos pendientes de aprobacion</CardTitle>
            <CardDescription>Revisa y firma los documentos que el despacho te compartio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvalPendingDocuments.map((document: Record<string, any>) => (
              <div key={String(document._id)} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
                <div>
                  <p className="font-medium">{document.nombre || "Documento"}</p>
                  <p className="text-xs text-muted-foreground">
                    {documentTypeLabels[document.tipo] || document.tipo || "Documento"}
                  </p>
                </div>
                <Button
                  onClick={() => handleApproveDocument(String(document._id), document.nombre || document.archivoNombre || "documento")}
                  disabled={approvingDocumentId === String(document._id)}
                >
                  {approvingDocumentId === String(document._id) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Aprobar y firmar"
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
