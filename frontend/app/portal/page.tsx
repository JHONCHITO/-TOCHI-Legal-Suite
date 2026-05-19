"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  useAppointments,
  useCases,
  useClientMe,
  useCommunications,
  useDocuments,
  useInvoices,
  useNotifications,
} from "@/lib/hooks/use-data";
import {
  appointmentTypeColors,
  appointmentTypeLabels,
  caseStatusColors,
  caseStatusLabels,
  documentTypeLabels,
  formatCurrencyCop,
  formatDateShort,
  formatDateTime,
  getClientDisplayName,
  getInitials,
  invoiceStatusColors,
  invoiceStatusLabels,
} from "@/lib/utils/format";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PortalClient = {
  _id: string;
  tipo: "persona_natural" | "persona_juridica";
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  tieneAccesoPortal?: boolean;
  portalUltimaSincronizacion?: string | Date;
};

type PortalSectionProps = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  items: Array<Record<string, any>>;
  emptyTitle: string;
  emptyDescription: string;
  renderItem: (item: Record<string, any>, index: number) => ReactNode;
};

function PortalSection({
  id,
  title,
  description,
  icon: Icon,
  items,
  emptyTitle,
  emptyDescription,
  renderItem,
}: PortalSectionProps) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-5">
            <p className="font-medium">{emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          items.slice(0, 3).map((item, index) => renderItem(item, index))
        )}
      </CardContent>
    </Card>
  );
}

export default function PortalPage() {
  const { data: session } = useSession();
  const { client, isLoading: clientLoading, isError: clientError, mutate: mutateClient } = useClientMe();
  const { cases, isLoading: casesLoading, mutate: mutateCases } = useCases();
  const { documents, isLoading: documentsLoading, mutate: mutateDocuments } = useDocuments();
  const { invoices, isLoading: invoicesLoading, mutate: mutateInvoices } = useInvoices();
  const { appointments, isLoading: appointmentsLoading, mutate: mutateAppointments } = useAppointments();
  const { communications, isLoading: communicationsLoading, mutate: mutateCommunications } = useCommunications();
  const { notifications, unreadCount, isLoading: notificationsLoading, mutate: mutateNotifications } = useNotifications();

  const portalClient = client as PortalClient | undefined;
  const displayName =
    (portalClient ? getClientDisplayName(portalClient) : session?.user?.name) || "Cliente";
  const initials = getInitials(displayName);
  const portalReady = Boolean(portalClient?.tieneAccesoPortal);
  const lastSync = portalClient?.portalUltimaSincronizacion
    ? formatDateTime(portalClient.portalUltimaSincronizacion)
    : "Pendiente de sincronización";

  const loading =
    clientLoading ||
    casesLoading ||
    documentsLoading ||
    invoicesLoading ||
    appointmentsLoading ||
    communicationsLoading ||
    notificationsLoading;

  const handleRefresh = async () => {
    await Promise.all([
      mutateClient(),
      mutateCases(),
      mutateDocuments(),
      mutateInvoices(),
      mutateAppointments(),
      mutateCommunications(),
      mutateNotifications(),
    ]);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (clientError || !portalClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="rounded-3xl border bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Portal cliente</p>
                <h1 className="text-3xl font-bold tracking-tight">Acceso de cliente no activado</h1>
                <p className="text-muted-foreground">
                  Aquí verás tus casos, documentos, citas, facturas y mensajes cuando tu abogado vincule tu perfil.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 text-amber-600" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-900">Tu portal todavía no está listo</p>
                  <p className="text-sm text-amber-900/90">
                    Pídele a tu abogado que active y sincronice tu expediente desde la ficha del cliente. Cuando eso ocurra,
                    esta vista mostrará tu información real de forma privada.
                  </p>
                  <p className="text-sm text-amber-900/80">
                    Si ya te vincularon y sigue apareciendo este aviso, vuelve a iniciar sesión para refrescar el acceso.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/login">Volver a iniciar sesión</Link>
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const caseItems = cases as Array<Record<string, any>>;
  const documentItems = documents as Array<Record<string, any>>;
  const invoiceItems = invoices as Array<Record<string, any>>;
  const appointmentItems = appointments as Array<Record<string, any>>;
  const communicationItems = communications as Array<Record<string, any>>;
  const notificationItems = notifications as Array<Record<string, any>>;

  const sections = [
    { label: "Resumen", href: "#resumen" },
    { label: "Casos", href: "#casos" },
    { label: "Documentos", href: "#documentos" },
    { label: "Citas", href: "#citas" },
    { label: "Facturas", href: "#facturas" },
    { label: "Comunicaciones", href: "#comunicaciones" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="rounded-3xl border bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-semibold">
                    {initials}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Portal cliente</p>
                      <Badge variant="secondary">Cliente</Badge>
                      {portalReady ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {displayName}</h1>
                    <p className="text-muted-foreground">
                      Revisa tus casos, documentos, citas, facturas y mensajes compartidos por tu abogado desde un solo lugar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {sections.map((section) => (
                    <Button key={section.href} asChild variant="outline" size="sm">
                      <Link href={section.href}>{section.label}</Link>
                    </Button>
                  ))}
                  <Button variant="secondary" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualizar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                    Salir
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                <Card className="border-muted/60 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Última sincronización</p>
                        <p className="text-lg font-semibold">{lastSync}</p>
                        <p className="text-xs text-muted-foreground">
                          La actualización del despacho queda reflejada en este portal.
                        </p>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2">
                        <RefreshCw className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted/60 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Contacto principal</p>
                        <p className="text-lg font-semibold">{portalClient.email || "Sin correo"}</p>
                        <p className="text-xs text-muted-foreground">
                          {portalClient.telefono || portalClient.celular || "Sin teléfono registrado"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {!portalReady && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-semibold">Tu portal está pendiente de activación</p>
                  <p className="text-sm">
                    Tu abogado todavía no ha sincronizado este perfil. Cuando lo haga, aquí aparecerán tus expedientes,
                    documentos, citas, facturas y comunicaciones compartidas.
                  </p>
                </div>
              </div>
            </div>
          )}

          <section id="resumen" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title="Casos compartidos"
              value={caseItems.length}
              description="Expedientes visibles en tu portal"
              icon={Briefcase}
            />
            <StatsCard
              title="Documentos"
              value={documentItems.length}
              description="Escritos y archivos compartidos"
              icon={FileText}
            />
            <StatsCard
              title="Citas"
              value={appointmentItems.length}
              description="Audiencias, reuniones y seguimiento"
              icon={Calendar}
            />
            <StatsCard
              title="Facturas"
              value={formatCurrencyCop(
                invoiceItems.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)
              )}
              description={`${invoiceItems.length} comprobantes compartidos`}
              icon={CreditCard}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <PortalSection
              id="casos"
              title="Tus casos"
              description="Expedientes y movimientos compartidos por tu despacho."
              icon={Briefcase}
              items={caseItems}
              emptyTitle="Sin casos compartidos"
              emptyDescription="Cuando tu abogado publique un caso, aparecerá aquí con su estado y próxima actuación."
              renderItem={(item, index) => {
                const estado = String(item.estado || "").trim();
                const title = String(item.titulo || "Caso sin título");
                const numero = String(item.numeroInterno || item.numeroRadicado || "").trim();
                const nextActuation = item.fechaProximaActuacion
                  ? formatDateShort(String(item.fechaProximaActuacion))
                  : "";

                return (
                  <div key={String(item._id || index)} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{title}</p>
                          <Badge variant="secondary" className={caseStatusColors[estado] || ""}>
                            {caseStatusLabels[estado] || estado || "Sin estado"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {numero || "Sin radicado visible"}
                        </p>
                        {nextActuation ? (
                          <p className="text-xs text-muted-foreground">
                            Próxima actuación: {nextActuation}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <PortalSection
              id="documentos"
              title="Documentos"
              description="Archivos y escritos que el despacho puso a tu disposición."
              icon={FileText}
              items={documentItems}
              emptyTitle="Sin documentos compartidos"
              emptyDescription="Aquí aparecerán tus documentos cuando el despacho los publique en el portal."
              renderItem={(item, index) => {
                const tipo = String(item.tipo || "").trim();
                const estado = String(item.estado || "").trim();
                const nombre = String(item.nombre || "Documento sin nombre");
                const caso = item.casoId && typeof item.casoId === "object" ? (item.casoId as { titulo?: string; numeroInterno?: string }) : null;

                return (
                  <div key={String(item._id || index)} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{nombre}</p>
                          <Badge variant="secondary">{documentTypeLabels[tipo] || tipo || "Documento"}</Badge>
                          {estado ? (
                            <Badge variant="outline">{estado}</Badge>
                          ) : null}
                        </div>
                        {caso ? (
                          <p className="text-sm text-muted-foreground">
                            Vinculado a {caso.numeroInterno || caso.titulo || "tu caso"}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin caso visible</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <PortalSection
              id="citas"
              title="Citas y seguimiento"
              description="Audiencias, reuniones y compromisos que tu abogado compartió."
              icon={Calendar}
              items={appointmentItems}
              emptyTitle="Sin citas compartidas"
              emptyDescription="Cuando el despacho programe una cita para tu caso, aparecerá aquí."
              renderItem={(item, index) => {
                const estado = String(item.estado || "").trim();
                const tipo = String(item.tipo || "").trim();
                const titulo = String(item.titulo || "Cita sin título");
                const fechaInicio = item.fechaInicio ? formatDateTime(String(item.fechaInicio)) : "";

                return (
                  <div key={String(item._id || index)} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{titulo}</p>
                          {tipo ? (
                            <Badge variant="secondary" className={appointmentTypeColors[tipo] || ""}>
                              {appointmentTypeLabels[tipo] || tipo}
                            </Badge>
                          ) : null}
                          {estado ? <Badge variant="outline">{estado}</Badge> : null}
                        </div>
                        {fechaInicio ? (
                          <p className="text-sm text-muted-foreground">{fechaInicio}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin fecha visible</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <PortalSection
              id="facturas"
              title="Facturas"
              description="Honorarios y pagos visibles para tu seguimiento."
              icon={CreditCard}
              items={invoiceItems}
              emptyTitle="Sin facturas compartidas"
              emptyDescription="Cuando el despacho emita una factura visible para ti, aparecerá aquí."
              renderItem={(item, index) => {
                const estado = String(item.estado || "").trim();
                const numero = String(item.numero || "Factura sin número");
                const total = Number(item.total || 0);

                return (
                  <div key={String(item._id || index)} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{numero}</p>
                          {estado ? (
                            <Badge variant="secondary" className={invoiceStatusColors[estado] || ""}>
                              {invoiceStatusLabels[estado] || estado}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{formatCurrencyCop(total)}</p>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <PortalSection
              id="comunicaciones"
              title="Comunicaciones"
              description="Mensajes, seguimientos y novedades enviadas por tu equipo legal."
              icon={MessageSquare}
              items={communicationItems}
              emptyTitle="Sin comunicaciones registradas"
              emptyDescription="Los mensajes que tu abogado comparta contigo aparecerán aquí."
              renderItem={(item, index) => {
                const canal = String(item.canal || "").trim();
                const mensaje = String(item.mensaje || "").trim();
                const fecha = item.createdAt ? formatDateTime(String(item.createdAt)) : "";

                return (
                  <div key={String(item._id || index)} className="rounded-2xl border p-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {canal ? <Badge variant="secondary">{canal}</Badge> : null}
                        {fecha ? <span className="text-xs text-muted-foreground">{fecha}</span> : null}
                      </div>
                      <p className="text-sm text-foreground">{mensaje || "Sin mensaje visible"}</p>
                    </div>
                  </div>
                );
              }}
            />

            <PortalSection
              id="notificaciones"
              title="Notificaciones"
              description="Alertas, publicaciones y recordatorios del despacho."
              icon={Bell}
              items={notificationItems}
              emptyTitle="Sin notificaciones"
              emptyDescription="Cuando haya novedades para ti, aparecerán aquí."
              renderItem={(item, index) => {
                const titulo = String(item.titulo || "Notificación");
                const mensaje = String(item.mensaje || "").trim();
                const fecha = item.createdAt ? formatDateTime(String(item.createdAt)) : "";

                return (
                  <div key={String(item._id || index)} className="rounded-2xl border p-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Aviso</Badge>
                        {fecha ? <span className="text-xs text-muted-foreground">{fecha}</span> : null}
                      </div>
                      <p className="font-medium">{titulo}</p>
                      <p className="text-sm text-muted-foreground">{mensaje || "Sin detalle visible"}</p>
                    </div>
                  </div>
                );
              }}
            />
          </section>

          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-lg font-semibold">¿Necesitas ayuda rápida?</p>
                <p className="text-sm text-muted-foreground">
                  Si algo no coincide con tu caso, responde al despacho o solicita una actualización del expediente.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="#resumen">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Volver al resumen
                  </Link>
                </Button>
                <Button variant="secondary" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refrescar datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
