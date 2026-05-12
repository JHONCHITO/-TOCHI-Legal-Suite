"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  MessageSquare,
  Scale,
  Shield,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/lib/hooks/use-data";
import {
  formatCurrencyCop,
  formatDateShort,
  formatTime,
  getClientDisplayName,
  caseStatusColors,
  caseStatusLabels,
  appointmentTypeColors,
  appointmentTypeLabels,
} from "@/lib/utils/format";
import { toLegalSlug } from "@/lib/legal-library";

const modules = [
  { title: "Gestion de casos", description: "Expedientes, actuaciones y estrategia por cliente.", href: "/dashboard/casos", icon: Briefcase },
  { title: "Intake inteligente", description: "Convierte nuevas entradas en cliente, caso y cita.", href: "/dashboard/intake", icon: Sparkles },
  { title: "Agenda inteligente", description: "Audiencias, plazos y reuniones con trazabilidad.", href: "/dashboard/citas", icon: Calendar },
  { title: "Base juridica", description: "Codigos, articulos y fuentes oficiales colombianas.", href: "/dashboard/leyes", icon: Scale },
  { title: "Documentos", description: "Plantillas, escritos y generador asistido por IA.", href: "/dashboard/documentos", icon: FileText },
  { title: "Clientes", description: "CRM legal y relacion comercial centralizada.", href: "/dashboard/clientes", icon: Users },
  { title: "Facturacion", description: "Honorarios, pagos, cartera y recaudo.", href: "/dashboard/facturacion", icon: CreditCard },
  { title: "Portal cliente", description: "Vista privada para casos, facturas y documentos.", href: "/dashboard/portal", icon: Shield },
  { title: "Comunicacion", description: "WhatsApp, correo y seguimiento operativo.", href: "/dashboard/comunicacion", icon: MessageSquare },
  { title: "Reportes", description: "Indicadores, cumplimiento y salud del despacho.", href: "/dashboard/reportes", icon: BarChart3 },
  { title: "Seguridad", description: "Accesos, permisos y proteccion de datos.", href: "/dashboard/seguridad", icon: Shield },
  { title: "Alertas", description: "Vencimientos, novedades y cambios normativos.", href: "/dashboard/notificaciones", icon: Bell },
];

export default function DashboardPage() {
  const { data, isLoading, isError, mutate } = useDashboard();

  if (isError) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error al cargar el dashboard</p>
          <Button variant="outline" onClick={() => mutate()} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    casos: { total: 0, activos: 0 },
    clientes: { total: 0, activos: 0 },
    citas: { proximas: 0 },
    facturacion: { total: 0, totalFacturado: 0, totalPagado: 0, totalPendiente: 0 },
  };

  const recentCases = data?.recentCases || [];
  const recentAppointments = data?.recentAppointments || [];

  const operationalBars = [
    {
      label: "Casos activos",
      value: stats.casos.activos,
      percent: Math.min(stats.casos.activos * 8, 100),
      tone: "from-primary via-primary to-primary/70",
    },
    {
      label: "Clientes activos",
      value: stats.clientes.activos,
      percent: Math.min(stats.clientes.activos * 2, 100),
      tone: "from-accent via-accent to-accent/70",
    },
    {
      label: "Citas proximas",
      value: stats.citas.proximas,
      percent: Math.min(stats.citas.proximas * 12, 100),
      tone: "from-chart-3 via-chart-3 to-chart-3/70",
    },
    {
      label: "Cartera pendiente",
      value: formatCurrencyCop(stats.facturacion.totalPendiente),
      percent: Math.min(Math.round((stats.facturacion.totalPendiente || 0) / 250000), 100),
      tone: "from-destructive via-destructive to-destructive/70",
    },
  ];

  const quickSignals = [
    {
      title: "Casos en seguimiento",
      value: stats.casos.activos,
      description: `${stats.casos.total} expedientes abiertos`,
      icon: Target,
    },
    {
      title: "Clientes activos",
      value: stats.clientes.activos,
      description: `${stats.clientes.total} clientes registrados`,
      icon: Users,
    },
    {
      title: "Facturacion visible",
      value: formatCurrencyCop(stats.facturacion.totalFacturado),
      description: `${formatCurrencyCop(stats.facturacion.totalPendiente)} pendiente`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Centro operativo legal
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-balance lg:text-4xl">
            Una sola vista para operar tu despacho con claridad.
          </h1>
          <p className="max-w-3xl text-muted-foreground text-pretty">
            Gestiona expedientes, cartera, agenda, documentos y base juridica desde un panel visual
            pensado para abogados y equipos legales.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full border-border/70 bg-card/80">
            <Link href={`/dashboard/leyes/${toLegalSlug("CODIGO_CIVIL")}`}>
              <Scale className="mr-2 h-4 w-4" />
              Base juridica
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-border/70 bg-card/80">
            <Link href="/dashboard/herramientas">
              <BarChart3 className="mr-2 h-4 w-4" />
              Herramientas
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/dashboard/casos/nuevo">
              <Briefcase className="mr-2 h-4 w-4" />
              Nuevo caso
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[240px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/5 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.36)]">
            <CardContent className="p-0">
              <div className="grid gap-6 p-6 xl:grid-cols-[1.15fr_.85fr] xl:p-8">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-accent/15 px-3 py-1 text-accent hover:bg-accent/15">
                      Operacion en vivo
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1">
                      {stats.casos.activos} casos activos
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance lg:text-5xl">
                      El centro de mando de TOCHI para trabajar con ritmo y orden.
                    </h2>
                    <p className="max-w-2xl text-base text-muted-foreground text-pretty">
                      Convierte tu rutina diaria en una vista ejecutiva: seguimiento de clientes,
                      control financiero, alertas procesales y documentos listos para usar.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="rounded-full px-6">
                      <Link href="/dashboard/casos/nuevo">
                        Crear expediente
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-full border-border/70 px-6">
                      <Link href="/dashboard/reportes">
                        Ver analitica
                      </Link>
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {quickSignals.map((signal) => (
                      <div
                        key={signal.title}
                        className="rounded-3xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="rounded-2xl bg-primary/10 p-3">
                            <signal.icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">{signal.title}</span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{signal.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{signal.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5 shadow-xl shadow-primary/5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Señal del despacho
                      </p>
                      <p className="text-base font-semibold">Carga operativa y cartera</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      Actualizado
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {operationalBars.map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-muted-foreground">{item.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${item.tone}`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        Recaudo
                      </div>
                      <p className="mt-2 text-lg font-semibold">{formatCurrencyCop(stats.facturacion.totalPagado)}</p>
                      <p className="text-xs text-muted-foreground">Monto cobrado y registrado</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Proximas citas
                      </div>
                      <p className="mt-2 text-lg font-semibold">{stats.citas.proximas}</p>
                      <p className="text-xs text-muted-foreground">En los proximos 7 dias</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title="Casos Activos"
              value={stats.casos.activos}
              description={`${stats.casos.total} expedientes en seguimiento`}
              icon={Briefcase}
              trend={stats.casos.activos > 0 ? { value: 12, positive: true } : undefined}
            />
            <StatsCard
              title="Clientes"
              value={stats.clientes.total}
              description={`${stats.clientes.activos} clientes activos`}
              icon={Users}
              trend={stats.clientes.total > 0 ? { value: 8, positive: true } : undefined}
            />
            <StatsCard
              title="Citas Proximas"
              value={stats.citas.proximas}
              description="En los proximos 7 dias"
              icon={Calendar}
            />
            <StatsCard
              title="Facturacion"
              value={formatCurrencyCop(stats.facturacion.totalFacturado)}
              description={`${formatCurrencyCop(stats.facturacion.totalPendiente)} pendiente`}
              icon={CreditCard}
              trend={stats.facturacion.totalPagado > 0 ? { value: 5, positive: true } : undefined}
            />
          </div>

          <Card className="border-border/70 bg-card/90 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.28)]">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Modulos del ERP legal</CardTitle>
                <CardDescription>Todo lo esencial de una firma en una navegacion clara y visual.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/herramientas">
                  Ver herramientas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {modules.map((module) => (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group rounded-3xl border border-border/70 bg-background/75 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-background/95 hover:shadow-[0_20px_50px_-25px_rgba(15,23,42,0.28)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="rounded-2xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/15">
                        <module.icon className="h-5 w-5 text-primary" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="font-semibold tracking-tight">{module.title}</p>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-border/70 bg-card/90 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.22)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Casos recientes</CardTitle>
                  <CardDescription>Expedientes con movimiento o prioridad.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/casos">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 py-10 text-center">
                    <Briefcase className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay casos registrados</p>
                    <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
                      <Link href="/dashboard/casos/nuevo">Crear primer caso</Link>
                    </Button>
                  </div>
                ) : (
                  recentCases.slice(0, 3).map((caso: {
                    _id: string;
                    titulo: string;
                    numeroInterno: string;
                    estado: string;
                    fechaProximaActuacion?: string;
                    clienteId?: { tipo: string; nombre?: string; apellido?: string; razonSocial?: string };
                  }) => (
                    <Link
                      key={caso._id}
                      href={`/dashboard/casos/${caso._id}`}
                      className="group flex items-start gap-4 rounded-3xl border border-border/70 p-4 transition-all hover:border-primary/30 hover:bg-muted/35"
                    >
                      <div className="rounded-2xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/15">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm">{caso.titulo}</p>
                          <Badge variant="secondary" className={caseStatusColors[caso.estado]}>
                            {caseStatusLabels[caso.estado] || caso.estado}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {caso.numeroInterno} - {caso.clienteId ? getClientDisplayName(caso.clienteId) : "Sin cliente"}
                        </p>
                        {caso.fechaProximaActuacion && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Proxima actuacion: {formatDateShort(caso.fechaProximaActuacion)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.22)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Agenda y alertas</CardTitle>
                  <CardDescription>Compromisos inmediatos del despacho.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/citas">
                    Ver calendario
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 py-10 text-center">
                    <Calendar className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay citas proximas</p>
                    <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
                      <Link href="/dashboard/citas">Agendar cita</Link>
                    </Button>
                  </div>
                ) : (
                  recentAppointments.slice(0, 3).map((item: {
                    _id: string;
                    titulo: string;
                    tipo: string;
                    fechaInicio: string;
                    fechaFin: string;
                    clienteId?: { tipo: string; nombre?: string; apellido?: string; razonSocial?: string };
                  }) => (
                    <div key={item._id} className="flex items-start gap-4 rounded-3xl border border-border/70 p-4">
                      <div className="rounded-2xl bg-accent/10 p-3">
                        <Calendar className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{item.titulo}</p>
                          <Badge className={appointmentTypeColors[item.tipo]}>
                            {appointmentTypeLabels[item.tipo] || item.tipo}
                          </Badge>
                        </div>
                        {item.clienteId && (
                          <p className="text-xs text-muted-foreground">
                            {getClientDisplayName(item.clienteId)}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDateShort(item.fechaInicio)}</span>
                          <span>
                            {formatTime(item.fechaInicio)} - {formatTime(item.fechaFin)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
