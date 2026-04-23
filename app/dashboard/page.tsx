import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
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
import { toLegalSlug } from "@/lib/legal-library";

const recentCases = [
  {
    id: "1",
    numeroInterno: "TOCHI-2026-00021",
    titulo: "Demanda laboral por despido injustificado",
    cliente: "Juan Perez",
    estado: "activo",
    tipo: "laboral",
    fechaProximaActuacion: "2026-04-24",
  },
  {
    id: "2",
    numeroInterno: "TOCHI-2026-00019",
    titulo: "Cobro ejecutivo comercial",
    cliente: "Empresa ABC S.A.S.",
    estado: "audiencia_pendiente",
    tipo: "comercial",
    fechaProximaActuacion: "2026-04-26",
  },
  {
    id: "3",
    numeroInterno: "TOCHI-2026-00012",
    titulo: "Tutela por derecho a la salud",
    cliente: "Rosa Martinez",
    estado: "en_tramite",
    tipo: "constitucional",
    fechaProximaActuacion: "2026-04-23",
  },
];

const upcomingAppointments = [
  {
    id: "1",
    titulo: "Audiencia inicial",
    cliente: "Juan Perez",
    fecha: "Hoy, 10:00 AM",
    tipo: "audiencia",
    ubicacion: "Juzgado 5 Civil Municipal",
  },
  {
    id: "2",
    titulo: "Llamada con cliente corporativo",
    cliente: "Empresa ABC S.A.S.",
    fecha: "Hoy, 3:00 PM",
    tipo: "seguimiento",
    ubicacion: "WhatsApp / llamada",
  },
  {
    id: "3",
    titulo: "Revision de tutela",
    cliente: "Rosa Martinez",
    fecha: "Manana, 8:30 AM",
    tipo: "revision",
    ubicacion: "Oficina",
  },
];

const modules = [
  {
    title: "Gestion de casos",
    description: "Expedientes, estado del proceso, actuaciones y responsables.",
    href: "/dashboard/casos",
    icon: Briefcase,
  },
  {
    title: "Agenda inteligente",
    description: "Audiencias, citas, plazos y recordatorios.",
    href: "/dashboard/citas",
    icon: Calendar,
  },
  {
    title: "Base juridica",
    description: "Codigos, articulos, fuentes oficiales y apoyo IA.",
    href: "/dashboard/leyes",
    icon: Scale,
  },
  {
    title: "Documentos",
    description: "Plantillas, generador IA y biblioteca documental.",
    href: "/dashboard/documentos",
    icon: FileText,
  },
  {
    title: "Clientes",
    description: "CRM legal con historial y contacto rapido.",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    title: "Facturacion",
    description: "Honorarios, facturas, recaudo y cartera.",
    href: "/dashboard/facturacion",
    icon: CreditCard,
  },
  {
    title: "Comunicacion",
    description: "WhatsApp, correo y seguimiento de clientes.",
    href: "/dashboard/comunicacion",
    icon: MessageSquare,
  },
  {
    title: "Reportes",
    description: "Rendimiento, ingresos y carga operativa.",
    href: "/dashboard/reportes",
    icon: BarChart3,
  },
  {
    title: "Seguridad",
    description: "Accesos, politicas y proteccion de datos.",
    href: "/dashboard/seguridad",
    icon: Shield,
  },
  {
    title: "Alertas",
    description: "Vencimientos, novedades y cambios normativos.",
    href: "/dashboard/notificaciones",
    icon: Bell,
  },
];

const estadoColors: Record<string, string> = {
  activo: "bg-accent/20 text-accent",
  en_tramite: "bg-primary/20 text-primary",
  audiencia_pendiente: "bg-amber-100 text-amber-800",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro Operativo Legal</h1>
          <p className="text-muted-foreground">
            Vista general de tu ERP legal: casos, agenda, alertas, documentos, clientes y control financiero.
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Casos Activos"
          value={24}
          description="8 con audiencia esta semana"
          icon={Briefcase}
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Clientes"
          value={156}
          description="12 nuevos este mes"
          icon={Users}
          trend={{ value: 8, positive: true }}
        />
        <StatsCard
          title="Citas Hoy"
          value={5}
          description="2 audiencias y 3 seguimientos"
          icon={Calendar}
        />
        <StatsCard
          title="Ingresos del Mes"
          value="$15.2M"
          description="COP facturados"
          icon={DollarSign}
          trend={{ value: 5, positive: true }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modulos del ERP legal</CardTitle>
          <CardDescription>
            Acceso rapido a las piezas clave que me pediste incluir en la suite.
          </CardDescription>
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
              <CardDescription>Expedientes con movimiento cercano.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/casos">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCases.map((caso) => (
              <Link
                key={caso.id}
                href={`/dashboard/casos/${caso.id}`}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{caso.titulo}</p>
                    <Badge variant="secondary" className={estadoColors[caso.estado]}>
                      {caso.estado.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {caso.numeroInterno} - {caso.cliente}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Proxima actuacion: {caso.fechaProximaActuacion}
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Agenda y alertas</CardTitle>
              <CardDescription>Plazos y reuniones mas cercanos.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/citas">
                Ver calendario
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.map((item) => (
              <div key={item.id} className="flex items-start gap-4 rounded-lg border p-4">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Calendar className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{item.titulo}</p>
                    <Badge variant="outline">{item.tipo}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.cliente}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.fecha}</span>
                    <span>{item.ubicacion}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
