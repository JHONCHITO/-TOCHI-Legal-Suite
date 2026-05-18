"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useSearchParams } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarIcon,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Plus,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { useAppointments, useClients, createAppointment, deleteAppointment } from "@/lib/hooks/use-data";
import { getClientDisplayName, appointmentTypeLabels, appointmentTypeColors, formatTime } from "@/lib/utils/format";
import { toast } from "sonner";

const estadoIcons: Record<string, React.ReactNode> = {
  programada: <Clock className="h-4 w-4 text-amber-600" />,
  confirmada: <CheckCircle className="h-4 w-4 text-emerald-600" />,
  cancelada: <XCircle className="h-4 w-4 text-destructive" />,
  completada: <CheckCircle className="h-4 w-4 text-primary" />,
};

export default function CitasPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();
  const clienteIdFilter = searchParams.get("clienteId") || "";

  // Form state
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "consulta",
    fechaInicio: "",
    horaInicio: "09:00",
    horaFin: "10:00",
    ubicacion: "",
    esVirtual: false,
    clienteId: "",
    descripcion: "",
  });

  const { appointments, isLoading, mutate } = useAppointments({
    clienteId: clienteIdFilter || undefined,
  });
  const { clients } = useClients();

  useEffect(() => {
    if (clienteIdFilter && !formData.clienteId) {
      setFormData((current) => ({ ...current, clienteId: clienteIdFilter }));
    }
  }, [clienteIdFilter, formData.clienteId]);

  const selectedClient = useMemo(() => {
    if (!clienteIdFilter) return null;
    return clients.find((client: { _id: string }) => String(client._id) === clienteIdFilter) || null;
  }, [clienteIdFilter, clients]);

  const appointmentsWithDates = useMemo(
    () =>
      appointments.map((item: { fechaInicio: string }) => ({
        ...item,
        dateValue: parseISO(item.fechaInicio),
      })),
    [appointments]
  );

  const appointmentsForDate = appointmentsWithDates.filter(
    (apt: { dateValue: Date }) => isSameDay(apt.dateValue, selectedDate)
  );

  const upcomingAppointments = appointmentsWithDates
    .filter((apt: { dateValue: Date; estado: string }) => 
      apt.dateValue >= addDays(new Date(), -1) && 
      apt.estado !== "cancelada" && 
      apt.estado !== "completada"
    )
    .sort((a: { dateValue: Date }, b: { dateValue: Date }) => a.dateValue.getTime() - b.dateValue.getTime())
    .slice(0, 5);

  const datesWithAppointments = appointmentsWithDates.map((item: { dateValue: Date }) => item.dateValue);

  const stats = useMemo(() => {
    const today = appointmentsForDate.length;
    const total = appointments.length;
    const audiencias = appointments.filter((a: { tipo: string }) => a.tipo === "audiencia").length;
    const virtuales = appointments.filter((a: { esVirtual: boolean }) => a.esVirtual).length;
    return { today, total, audiencias, virtuales };
  }, [appointments, appointmentsForDate]);

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.tipo || !formData.fechaInicio) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    setIsSubmitting(true);
    try {
      const fechaInicio = new Date(`${formData.fechaInicio}T${formData.horaInicio}:00`);
      const fechaFin = new Date(`${formData.fechaInicio}T${formData.horaFin}:00`);

      await createAppointment({
        titulo: formData.titulo,
        tipo: formData.tipo,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        ubicacion: formData.ubicacion,
        esVirtual: formData.esVirtual,
        clienteId: formData.clienteId || undefined,
        descripcion: formData.descripcion,
      });

      toast.success("Cita creada correctamente");
      setIsDialogOpen(false);
      setFormData({
        titulo: "",
        tipo: "consulta",
        fechaInicio: "",
        horaInicio: "09:00",
        horaFin: "10:00",
        ubicacion: "",
        esVirtual: false,
        clienteId: "",
        descripcion: "",
      });
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear cita");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteAppointment(deleteId);
      toast.success("Cita eliminada correctamente");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar cita");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

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
              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo *</Label>
                <Input
                  id="titulo"
                  placeholder="Titulo de la cita"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(appointmentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Select
                    value={formData.clienteId}
                    onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: { _id: string; tipo: string; nombre?: string; apellido?: string; razonSocial?: string }) => (
                        <SelectItem key={client._id} value={client._id}>
                          {getClientDisplayName(client)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora inicio</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFin">Hora fin</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicacion</Label>
                <Input
                  id="ubicacion"
                  placeholder="Direccion o enlace virtual"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="esVirtual"
                  checked={formData.esVirtual}
                  onChange={(e) => setFormData({ ...formData, esVirtual: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="esVirtual">Es cita virtual</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Notas</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Notas y objetivo de la cita..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {clienteIdFilter ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Mostrando citas del cliente seleccionado</p>
              <p className="text-sm text-muted-foreground">
                {selectedClient
                  ? getClientDisplayName(selectedClient)
                  : "El filtro de cliente sigue activo en esta pantalla."}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/citas">Ver todas</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Citas del dia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Eventos cargados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.audiencias}</div>
            <p className="text-xs text-muted-foreground">Audiencias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.virtuales}</div>
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
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : appointmentsForDate.length === 0 ? (
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
                {appointmentsForDate.map((appointment: {
                  _id: string;
                  titulo: string;
                  tipo: string;
                  estado: string;
                  fechaInicio: string;
                  fechaFin: string;
                  ubicacion?: string;
                  esVirtual: boolean;
                  clienteId?: { tipo: string; nombre?: string; apellido?: string; razonSocial?: string };
                  casoId?: { numeroInterno: string };
                }) => {
                  return (
                    <div
                      key={appointment._id}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold">{formatTime(appointment.fechaInicio)}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(appointment.fechaFin)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="font-medium">{appointment.titulo}</h4>
                          <Badge className={appointmentTypeColors[appointment.tipo]}>
                            {appointmentTypeLabels[appointment.tipo] || appointment.tipo}
                          </Badge>
                          {estadoIcons[appointment.estado]}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {appointment.clienteId && (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {getClientDisplayName(appointment.clienteId)}
                            </div>
                          )}
                          {appointment.ubicacion && (
                            <div className="flex items-center gap-2">
                              {appointment.esVirtual ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <MapPin className="h-3 w-3" />
                              )}
                              {appointment.ubicacion}
                            </div>
                          )}
                          {appointment.casoId && (
                            <p>Caso: {appointment.casoId.numeroInterno}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(appointment._id)}
                      >
                        Cancelar
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
          {upcomingAppointments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay citas proximas programadas
            </p>
          ) : (
            upcomingAppointments.map((appointment: {
              _id: string;
              titulo: string;
              tipo: string;
              fechaInicio: string;
              clienteId?: { tipo: string; nombre?: string; apellido?: string; razonSocial?: string };
            }) => {
              return (
                <div key={appointment._id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{appointment.titulo}</h4>
                      <Badge className={appointmentTypeColors[appointment.tipo]}>
                        {appointmentTypeLabels[appointment.tipo] || appointment.tipo}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(parseISO(appointment.fechaInicio), "d MMM yyyy", { locale: es })}</span>
                      <span>{formatTime(appointment.fechaInicio)}</span>
                      {appointment.clienteId && (
                        <span>{getClientDisplayName(appointment.clienteId)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar cita</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara la cita del sistema. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Cancelar cita"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
