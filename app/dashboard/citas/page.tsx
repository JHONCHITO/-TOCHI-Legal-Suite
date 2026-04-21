"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  CalendarIcon,
  Clock,
  MapPin,
  User,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

// Mock appointments data
const mockAppointments = [
  {
    id: "1",
    titulo: "Audiencia Inicial - Caso Perez",
    tipo: "audiencia",
    cliente: "Juan Perez",
    fecha: new Date(),
    horaInicio: "10:00",
    horaFin: "12:00",
    ubicacion: "Juzgado 5 Civil Municipal de Bogota",
    esVirtual: false,
    estado: "programada",
  },
  {
    id: "2",
    titulo: "Reunion con cliente",
    tipo: "reunion",
    cliente: "Maria Garcia",
    fecha: new Date(),
    horaInicio: "15:00",
    horaFin: "16:00",
    ubicacion: "Oficina",
    esVirtual: false,
    estado: "confirmada",
  },
  {
    id: "3",
    titulo: "Conciliacion Extrajudicial",
    tipo: "conciliacion",
    cliente: "Pedro Lopez",
    fecha: addDays(new Date(), 1),
    horaInicio: "09:00",
    horaFin: "11:00",
    ubicacion: "Centro de Conciliacion",
    esVirtual: false,
    estado: "programada",
  },
  {
    id: "4",
    titulo: "Consulta Virtual - Empresa ABC",
    tipo: "consulta",
    cliente: "Empresa ABC S.A.S",
    fecha: addDays(new Date(), 2),
    horaInicio: "14:00",
    horaFin: "15:00",
    ubicacion: "Google Meet",
    esVirtual: true,
    linkVirtual: "https://meet.google.com/abc-def-ghi",
    estado: "confirmada",
  },
  {
    id: "5",
    titulo: "Audiencia de Fallo",
    tipo: "audiencia",
    cliente: "Rosa Martinez",
    fecha: addDays(new Date(), 3),
    horaInicio: "11:00",
    horaFin: "13:00",
    ubicacion: "Juzgado 2 Laboral del Circuito",
    esVirtual: false,
    estado: "programada",
  },
];

const tipoColors: Record<string, string> = {
  audiencia: "bg-destructive/20 text-destructive",
  reunion: "bg-primary/20 text-primary",
  conciliacion: "bg-accent/20 text-accent",
  consulta: "bg-chart-3/20 text-chart-3",
  diligencia: "bg-chart-4/20 text-chart-4",
};

const estadoIcons: Record<string, React.ReactNode> = {
  programada: <AlertCircle className="h-4 w-4 text-warning" />,
  confirmada: <CheckCircle className="h-4 w-4 text-accent" />,
  cancelada: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function CitasPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const appointmentsForDate = mockAppointments.filter((apt) =>
    isSameDay(apt.fecha, selectedDate)
  );

  const upcomingAppointments = mockAppointments
    .filter((apt) => apt.fecha >= new Date())
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .slice(0, 5);

  // Get dates with appointments for calendar highlighting
  const datesWithAppointments = mockAppointments.map((apt) => apt.fecha);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">
            Gestiona tus citas, audiencias y reuniones
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
              <DialogDescription>
                Programa una nueva cita, audiencia o reunion
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4 mt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Titulo</FieldLabel>
                  <Input placeholder="Ej: Audiencia Inicial" />
                </Field>
                <Field>
                  <FieldLabel>Tipo</FieldLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audiencia">Audiencia</SelectItem>
                      <SelectItem value="reunion">Reunion</SelectItem>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="conciliacion">Conciliacion</SelectItem>
                      <SelectItem value="diligencia">Diligencia</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Fecha</FieldLabel>
                    <Input type="date" />
                  </Field>
                  <Field>
                    <FieldLabel>Hora</FieldLabel>
                    <Input type="time" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Cliente</FieldLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Juan Perez</SelectItem>
                      <SelectItem value="2">Maria Garcia</SelectItem>
                      <SelectItem value="3">Empresa ABC S.A.S</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Ubicacion</FieldLabel>
                  <Input placeholder="Ej: Juzgado 5 Civil Municipal" />
                </Field>
                <Field>
                  <FieldLabel>Notas</FieldLabel>
                  <Textarea placeholder="Notas adicionales..." />
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cita</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Citas Hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Esta Semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Audiencias Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Virtuales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
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
              modifiers={{
                hasAppointment: datesWithAppointments,
              }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </CardTitle>
            <CardDescription>
              {appointmentsForDate.length} citas programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsForDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Sin citas para este dia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No tienes citas programadas para esta fecha
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar cita
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointmentsForDate.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold">{appointment.horaInicio}</span>
                      <span className="text-xs text-muted-foreground">
                        {appointment.horaFin}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{appointment.titulo}</h4>
                        <Badge className={tipoColors[appointment.tipo]}>
                          {appointment.tipo}
                        </Badge>
                        {estadoIcons[appointment.estado]}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {appointment.cliente}
                        </div>
                        <div className="flex items-center gap-2">
                          {appointment.esVirtual ? (
                            <Video className="h-3 w-3" />
                          ) : (
                            <MapPin className="h-3 w-3" />
                          )}
                          {appointment.ubicacion}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver detalle
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Proximas Citas</CardTitle>
          <CardDescription>Tus citas de los proximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center gap-4 p-4 rounded-lg border"
              >
                <div className="rounded-lg bg-primary/10 p-3">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{appointment.titulo}</h4>
                    <Badge className={tipoColors[appointment.tipo]}>
                      {appointment.tipo}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(appointment.fecha, "d MMM", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appointment.horaInicio}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {appointment.cliente}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Ver
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
