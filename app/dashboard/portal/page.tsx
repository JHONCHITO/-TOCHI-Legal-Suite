"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  Calendar,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  ShieldCheck,
  Wallet,
  Users,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  approvePortalDocument,
  uploadDocument,
  useAppointments,
  useCases,
  useClients,
  useCommunications,
  useDocuments,
  useInvoices,
} from "@/lib/hooks/use-data";
import {
  appointmentTypeLabels,
  caseStatusLabels,
  caseTypeLabels,
  documentTypeLabels,
  formatCurrencyCop,
  formatDateShort,
  formatDateTime,
  formatTime,
  getClientDisplayName,
  invoiceStatusLabels,
} from "@/lib/utils/format";
import { toast } from "sonner";

async function fetcher(url: string) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "No se pudo cargar la informacion del portal");
  }
  return payload;
}

export default function PortalClientePage() {
  const { data: userData, isLoading: userLoading } = useSWR("/api/users/me", fetcher);
  const { clients, isLoading: clientsLoading } = useClients();
  const { cases, isLoading: casesLoading } = useCases();
  const { documents, isLoading: documentsLoading, mutate } = useDocuments();
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { communications, isLoading: communicationsLoading } = useCommunications();

  const client = clients[0] ?? null;
  const clientName = client
    ? getClientDisplayName({
        tipo: client.tipo,
        nombre: client.nombre,
        apellido: client.apellido,
        razonSocial: client.razonSocial,
      })
    : "Cliente";

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
        .slice(0, 5),
    [appointments]
  );

  const pendingInvoices = useMemo(
    () => invoices.filter((item: Record<string, any>) => item.estado !== "pagada").slice(0, 5),
    [invoices]
  );

  const recentDocuments = useMemo(() => documents.slice(0, 5), [documents]);
  const approvalPendingDocuments = useMemo(
    () =>
      documents.filter(
        (item: Record<string, any>) =>
          item.portalCompartido && (item.estado === "revision" || item.requiereAprobacion)
      ),
    [documents]
  );
  const recentMessages = useMemo(() => communications.slice(0, 5), [communications]);

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
      await mutate();
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
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo aprobar el documento");
    } finally {
      setApprovingDocumentId(null);
    }
  };

  if (userLoading) {
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
            Esta vista esta pensada para clientes con acceso habilitado. Si quieres revisar un
            expediente como equipo interno, usa el modulo de casos o abre el cliente desde el CRM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            El portal centraliza casos, documentos, agenda y facturacion para el cliente final.
          </p>
          <Button asChild>
            <Link href="/dashboard/casos">
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir a casos
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (clientsLoading || casesLoading || documentsLoading || appointmentsLoading || invoicesLoading || communicationsLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Sin perfil de cliente</CardTitle>
          <CardDescription>
            No encontramos un registro de cliente vinculado a tu correo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.36)]">
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
                Aqui ves el estado de tus casos, documentos, agenda y facturacion sin llamar al
                despacho para cada detalle.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link href="/dashboard/casos">
                  <Users className="mr-2 h-4 w-4" />
                  Ver casos
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-border/70">
                <Link href="/dashboard/documentos">
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
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Facturacion pendiente</p>
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
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Subir archivo al expediente
              </CardTitle>
              <CardDescription>
                Carga soportes, anexos o documentos que quieras enviar al despacho para revision.
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              {approvalPendingDocuments.length} pendientes de aprobacion
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
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

          <div className="space-y-2 xl:col-span-2">
            <Label>Descripcion</Label>
            <Textarea
              value={uploadDescription}
              onChange={(event) => setUploadDescription(event.target.value)}
              placeholder="Agrega contexto para que el despacho entienda el archivo"
              className="min-h-[120px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 xl:col-span-2">
            <Button variant="outline" onClick={() => setUploadFile(null)} disabled={isUploading || !uploadFile}>
              Limpiar
            </Button>
            <Button onClick={handleUploadDocument} disabled={isUploading || !uploadFile}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir al expediente
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-2 rounded-2xl bg-muted/40 p-2">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="casos">Casos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="facturacion">Facturacion</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del portal</CardTitle>
                <CardDescription>Visibilidad rapida de tu actividad con el despacho.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Perfil</p>
                  <p className="font-medium">{clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo</p>
                  <p className="font-medium">{client.email || "Sin correo"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{client.telefono || "Sin telefono"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Portal</p>
                  <p className="font-medium">{client.tieneAccesoPortal ? "Habilitado" : "Pendiente"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Casos totales</p>
                  <p className="font-medium">{totals.cases}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Facturacion total</p>
                  <p className="font-medium">{formatCurrencyCop(totals.totalFacturado)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Soporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {client.email || "Sin correo"}
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Comunicacion documentada y trazable
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Citas, audiencias y seguimientos
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="casos" className="space-y-4">
          {activeCases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tienes casos activos en este momento.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {activeCases.map((caso: Record<string, any>) => (
                <Card key={caso._id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{caso.titulo || "Caso"}</CardTitle>
                      <Badge className={caseStatusLabels[caso.estado] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                        {caseStatusLabels[caso.estado] || caso.estado}
                      </Badge>
                      <Badge variant="outline">{caseTypeLabels[caso.tipo] || caso.tipo}</Badge>
                    </div>
                    <CardDescription>{caso.numeroInterno || caso.numeroRadicado || "Sin numero"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{caso.descripcion || "Sin descripcion"}</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Proxima actuacion</p>
                        <p className="text-sm font-medium">
                          {caso.fechaProximaActuacion ? formatDateShort(caso.fechaProximaActuacion) : "Sin fecha"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cuantia</p>
                        <p className="text-sm font-medium">
                          {caso.cuantia ? formatCurrencyCop(Number(caso.cuantia)) : "No registrada"}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/dashboard/casos/${caso._id}`}>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Ver expediente
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          {recentDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay documentos visibles para tu cuenta.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {recentDocuments.map((documento: Record<string, any>) => (
                <Card key={documento._id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{documento.nombre || "Documento"}</CardTitle>
                      <Badge variant="outline">{documentTypeLabels[documento.tipo] || documento.tipo}</Badge>
                    </div>
                    <CardDescription>
                      {documento.estado || "borrador"}
                      {documento.aprobadoPorClienteAt ? ` · Aprobado ${formatDateTime(documento.aprobadoPorClienteAt)}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{documento.descripcion || "Sin descripcion"}</p>
                    <p>{documento.casoId?.titulo || documento.casoId?.numeroInterno || "Sin caso asociado"}</p>
                    <p>{documento.createdAt ? formatDateTime(documento.createdAt) : "Sin fecha"}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {documento.archivoUrl ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={documento.archivoUrl} download={documento.archivoNombre || documento.nombre || "archivo"}>
                            Descargar
                          </a>
                        </Button>
                      ) : null}
                      {documento.portalCompartido && (documento.estado === "revision" || documento.requiereAprobacion) ? (
                        <Button
                          size="sm"
                          onClick={() => handleApproveDocument(String(documento._id), documento.nombre || "Documento")}
                          disabled={approvingDocumentId === documento._id}
                        >
                          {approvingDocumentId === documento._id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Aprobando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Aprobar y firmar
                            </>
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay citas programadas.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment: Record<string, any>) => (
                <Card key={appointment._id}>
                  <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{appointment.titulo || "Cita"}</p>
                        <Badge variant="outline">{appointmentTypeLabels[appointment.tipo] || appointment.tipo}</Badge>
                        <Badge variant="secondary">{appointment.estado}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.descripcion || appointment.ubicacion || "Sin descripcion"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.fechaInicio ? formatDateTime(appointment.fechaInicio) : "Sin fecha"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{appointment.esVirtual ? "Virtual" : "Presencial"}</p>
                      <p>{appointment.fechaInicio ? formatTime(appointment.fechaInicio) : ""}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="facturacion" className="space-y-4">
          {pendingInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay facturas pendientes.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {pendingInvoices.map((invoice: Record<string, any>) => (
                <Card key={invoice._id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{invoice.numero || "Factura"}</CardTitle>
                      <Badge className={invoiceStatusLabels[invoice.estado] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                        {invoiceStatusLabels[invoice.estado] || invoice.estado}
                      </Badge>
                    </div>
                    <CardDescription>{invoice.concepto || "Sin concepto"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Total</span>
                      <span className="font-medium text-foreground">{formatCurrencyCop(Number(invoice.total || 0))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Saldo</span>
                      <span className="font-medium text-foreground">{formatCurrencyCop(Number(invoice.saldoPendiente || 0))}</span>
                    </div>
                    <p>{invoice.fechaVencimiento ? `Vence ${formatDateShort(invoice.fechaVencimiento)}` : "Sin fecha"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mensajes" className="space-y-4">
          {recentMessages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay mensajes registrados.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((message: Record<string, any>) => (
                <Card key={message._id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{message.asunto || "Mensaje"}</p>
                      <Badge variant="outline">{message.canal || "canal"}</Badge>
                      <Badge variant="secondary">{message.estado || "pendiente"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{message.mensaje || "Sin mensaje"}</p>
                    <p className="text-xs text-muted-foreground">
                      {message.fecha ? formatDateTime(message.fecha) : "Sin fecha"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
