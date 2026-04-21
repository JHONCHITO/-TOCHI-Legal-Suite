import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  FileText,
  Scale,
} from "lucide-react";
import Link from "next/link";

// Mock data - en produccion vendria de la base de datos
const recentCases = [
  {
    id: "1",
    numeroInterno: "TOCHI-2024-00001",
    titulo: "Demanda Laboral - Despido Injustificado",
    cliente: "Juan Perez",
    estado: "activo",
    tipo: "laboral",
    fechaProximaActuacion: "2024-02-15",
  },
  {
    id: "2",
    numeroInterno: "TOCHI-2024-00002",
    titulo: "Sucesion Intestada",
    cliente: "Maria Garcia",
    estado: "en_tramite",
    tipo: "familia",
    fechaProximaActuacion: "2024-02-20",
  },
  {
    id: "3",
    numeroInterno: "TOCHI-2024-00003",
    titulo: "Cobro Ejecutivo",
    cliente: "Empresa ABC S.A.S",
    estado: "audiencia_pendiente",
    tipo: "civil",
    fechaProximaActuacion: "2024-02-10",
  },
];

const upcomingAppointments = [
  {
    id: "1",
    titulo: "Audiencia Inicial",
    cliente: "Juan Perez",
    fecha: "Hoy, 10:00 AM",
    tipo: "audiencia",
    ubicacion: "Juzgado 5 Civil Municipal",
  },
  {
    id: "2",
    titulo: "Reunion con cliente",
    cliente: "Maria Garcia",
    fecha: "Hoy, 3:00 PM",
    tipo: "reunion",
    ubicacion: "Oficina",
  },
  {
    id: "3",
    titulo: "Conciliacion",
    cliente: "Pedro Lopez",
    fecha: "Manana, 9:00 AM",
    tipo: "conciliacion",
    ubicacion: "Centro de Conciliacion",
  },
];

const estadoColors: Record<string, string> = {
  consulta: "bg-muted text-muted-foreground",
  activo: "bg-accent/20 text-accent",
  en_tramite: "bg-primary/20 text-primary",
  audiencia_pendiente: "bg-warning/20 text-warning-foreground",
  sentencia: "bg-chart-3/20 text-chart-3",
  cerrado: "bg-muted text-muted-foreground",
};

const tipoColors: Record<string, string> = {
  audiencia: "bg-destructive/20 text-destructive",
  reunion: "bg-primary/20 text-primary",
  conciliacion: "bg-accent/20 text-accent",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de vuelta. Aqui tienes un resumen de tu actividad.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/leyes">
              <Scale className="mr-2 h-4 w-4" />
              Consultar Leyes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/casos/nuevo">
              <Briefcase className="mr-2 h-4 w-4" />
              Nuevo Caso
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Casos Activos"
          value={24}
          description="8 con audiencias esta semana"
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
          description="2 audiencias, 3 reuniones"
          icon={Calendar}
        />
        <StatsCard
          title="Ingresos del Mes"
          value="$15.2M"
          description="COP"
          icon={DollarSign}
          trend={{ value: 5, positive: true }}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Casos Recientes</CardTitle>
              <CardDescription>Tus ultimos casos actualizados</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/casos">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCases.map((caso) => (
                <Link
                  key={caso.id}
                  href={`/dashboard/casos/${caso.id}`}
                  className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{caso.titulo}</p>
                      <Badge
                        variant="secondary"
                        className={estadoColors[caso.estado]}
                      >
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
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Proximas Citas</CardTitle>
              <CardDescription>Tu agenda para los proximos dias</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/citas">
                Ver calendario
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((cita) => (
                <div
                  key={cita.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="rounded-lg bg-accent/10 p-2">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{cita.titulo}</p>
                      <Badge
                        variant="secondary"
                        className={tipoColors[cita.tipo]}
                      >
                        {cita.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cita.cliente}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{cita.fecha}</span>
                      <span>{cita.ubicacion}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick access to legal codes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acceso Rapido a Codigos</CardTitle>
          <CardDescription>
            Consulta los codigos legales colombianos mas utilizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { nombre: "Codigo Civil", codigo: "CC", color: "bg-chart-1/10 text-chart-1" },
              { nombre: "Codigo Penal", codigo: "CP", color: "bg-chart-2/10 text-chart-2" },
              { nombre: "CGP", codigo: "CGP", color: "bg-chart-3/10 text-chart-3" },
              { nombre: "Codigo Laboral", codigo: "CST", color: "bg-chart-4/10 text-chart-4" },
            ].map((code) => (
              <Link
                key={code.codigo}
                href={`/dashboard/leyes?codigo=${code.codigo}`}
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className={`rounded-lg p-2 ${code.color}`}>
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{code.nombre}</p>
                  <p className="text-xs text-muted-foreground">{code.codigo}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
