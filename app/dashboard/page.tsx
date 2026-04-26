"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  MessageSquare,
  Scale,
  Shield,
  Users,
  BarChart3,
  Clock,
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
  { title: "Gestion de casos", description: "Expedientes, actuaciones y estrategia.", href: "/dashboard/casos", icon: Briefcase },
  { title: "Agenda inteligente", description: "Audiencias, plazos y reuniones.", href: "/dashboard/citas", icon: Calendar },
  { title: "Base juridica", description: "Codigos, articulos y fuentes oficiales.", href: "/dashboard/leyes", icon: Scale },
  { title: "Documentos", description: "Plantillas, escritos y generador IA.", href: "/dashboard/documentos", icon: FileText },
  { title: "Clientes", description: "CRM legal y relacion comercial.", href: "/dashboard/clientes", icon: Users },
  { title: "Facturacion", description: "Honorarios, facturas y recaudo.", href: "/dashboard/facturacion", icon: CreditCard },
  { title: "Comunicacion", description: "WhatsApp, correo y seguimiento.", href: "/dashboard/comunicacion", icon: MessageSquare },
  { title: "Reportes", description: "Resultados e indicadores del despacho.", href: "/dashboard/reportes", icon: BarChart3 },
  { title: "Seguridad", description: "Accesos y proteccion de datos.", href: "/dashboard/seguridad", icon: Shield },
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
    facturacion: { totalFacturado: 0, totalPagado: 0, totalPendiente: 0 },
  };

  const recentCases = data?.recentCases || [];
  const recentAppointments = data?.recentAppointments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro Operativo Legal</h1>
          <p className="text-muted-foreground">
            Vista general de tu suite: expedientes, agenda, documentos, base juridica, cartera y alertas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/leyes/${toLegalSlug("CODIGO_CIVIL")}`}>
              <Scale className="mr-2 h-4 w-4" />
              Abrir base juridica
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/casos/nuevo">
              <Briefcase className="mr-2 h-4 w-4" />
              Nuevo caso
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
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
              icon={DollarSign}
              trend={stats.facturacion.totalPagado > 0 ? { value: 5, positive: true } : undefined}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modulos del ERP legal</CardTitle>
              <CardDescription>Todo lo esencial de una firma en una sola navegacion.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {modules.map((module) => (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-muted/40"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <module.icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-medium">{module.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
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
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Briefcase className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay casos registrados</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
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
                  }) => {
                    return (
                      <Link
                        key={caso._id}
                        href={`/dashboard/casos/${caso._id}`}
                        className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="rounded-lg bg-primary/10 p-2">
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
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
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
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay citas proximas</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
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
                  }) => {
                    return (
                      <div key={item._id} className="flex items-start gap-4 rounded-lg border p-4">
                        <div className="rounded-lg bg-accent/10 p-2">
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
                            <span>{formatTime(item.fechaInicio)} - {formatTime(item.fechaFin)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
