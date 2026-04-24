"use client";

import { useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarIcon,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { demoAppointments, getCaseById, getClientById, getClientDisplayName } from "@/lib/demo-data";

const tipoColors: Record<string, string> = {
  audiencia: "bg-destructive/20 text-destructive",
  reunion: "bg-primary/20 text-primary",
  consulta: "bg-chart-3/20 text-chart-3",
  seguimiento: "bg-accent/20 text-accent",
  conciliacion: "bg-amber-100 text-amber-800",
};

const estadoIcons: Record<string, React.ReactNode> = {
  programada: <Clock className="h-4 w-4 text-amber-600" />,
  confirmada: <CheckCircle className="h-4 w-4 text-emerald-600" />,
  cancelada: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function CitasPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-04-23T12:00:00"));
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const appointments = useMemo(
    () =>
      demoAppointments.map((item) => ({
        ...item,
        dateValue: parseISO(`${item.fecha}T12:00:00`),
      })),
    []
  );

  const appointmentsForDate = appointments.filter((apt) => isSameDay(apt.dateValue, selectedDate));
  const upcomingAppointments = appointments
    .filter((apt) => apt.dateValue >= addDays(new Date("2026-04-23T00:00:00"), -1))
    .sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());

  const datesWithAppointments = appointments.map((item) => item.dateValue);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda Inteligente</h1>
          <p className="text-muted-foreground">
            Audiencias, citas, conciliaciones, reuniones y plazos asociados al expediente.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Cita</DialogTitle>
              <DialogDescription>Programa una nueva actuacion o seguimiento.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Titulo de la cita" />
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" />
                <Input type="time" />
              </div>
              <Input placeholder="Ubicacion o enlace virtual" />
              <Textarea placeholder="Notas y objetivo de la cita..." />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>Guardar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{appointmentsForDate.length}</div>
            <p className="text-xs text-muted-foreground">Citas del dia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">Eventos cargados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {appointments.filter((item) => item.tipo === "audiencia").length}
            </div>
            <p className="text-xs text-muted-foreground">Audiencias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {appointments.filter((item) => item.esVirtual).length}
            </div>
            <p className="text-xs text-muted-foreground">Virtuales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className="rounded-md border"
              modifiers={{ hasAppointment: datesWithAppointments }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}</CardTitle>
            <CardDescription>{appointmentsForDate.length} citas programadas</CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsForDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-medium">Sin citas para este dia</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  No hay audiencias ni reuniones programadas en esta fecha.
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar cita
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointmentsForDate.map((appointment) => {
                  const client = getClientById(appointment.clienteId);
                  const caseData = appointment.casoId ? getCaseById(appointment.casoId) : undefined;

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold">{appointment.horaInicio}</span>
                        <span className="text-xs text-muted-foreground">{appointment.horaFin}</span>
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="font-medium">{appointment.titulo}</h4>
                          <Badge className={tipoColors[appointment.tipo]}>{appointment.tipo}</Badge>
                          {estadoIcons[appointment.estado]}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {client ? getClientDisplayName(client) : "Cliente"}
                          </div>
                          <div className="flex items-center gap-2">
                            {appointment.esVirtual ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <MapPin className="h-3 w-3" />
                            )}
                            {appointment.ubicacion}
                          </div>
                          {caseData ? <p>Caso: {caseData.numeroInterno}</p> : null}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver detalle
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proximas actuaciones</CardTitle>
          <CardDescription>Agenda inmediata de la firma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingAppointments.map((appointment) => {
            const client = getClientById(appointment.clienteId);
            return (
              <div key={appointment.id} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{appointment.titulo}</h4>
                    <Badge className={tipoColors[appointment.tipo]}>{appointment.tipo}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>{appointment.fecha}</span>
                    <span>{appointment.horaInicio}</span>
                    <span>{client ? getClientDisplayName(client) : "Cliente"}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Ver
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
