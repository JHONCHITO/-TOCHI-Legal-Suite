"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Bell,
  Calendar,
  FileText,
  Gavel,
  Scale,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Mail,
  Smartphone,
  Filter,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Notificacion {
  id: string
  tipo: "cita" | "caso" | "ley" | "vencimiento" | "sistema"
  titulo: string
  mensaje: string
  fecha: Date
  leida: boolean
  prioridad: "alta" | "media" | "baja"
  enlace?: string
}

const notificacionesMock: Notificacion[] = [
  {
    id: "1",
    tipo: "ley",
    titulo: "Actualizacion del Codigo Laboral",
    mensaje: "El articulo 62 del Codigo Sustantivo del Trabajo ha sido modificado por la Ley 2452 de 2025.",
    fecha: new Date(Date.now() - 1000 * 60 * 30),
    leida: false,
    prioridad: "alta",
    enlace: "/dashboard/leyes/codigo-sustantivo-trabajo",
  },
  {
    id: "2",
    tipo: "cita",
    titulo: "Recordatorio: Audiencia manana",
    mensaje: "Audiencia de conciliacion en el caso Martinez vs. ABC S.A.S programada para manana a las 9:00 AM.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 2),
    leida: false,
    prioridad: "alta",
    enlace: "/dashboard/citas",
  },
  {
    id: "3",
    tipo: "vencimiento",
    titulo: "Termino proximo a vencer",
    mensaje: "El termino para contestar demanda en el proceso 2024-00456 vence en 3 dias.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 5),
    leida: false,
    prioridad: "alta",
  },
  {
    id: "4",
    tipo: "caso",
    titulo: "Nuevo documento en caso",
    mensaje: "Se ha agregado un nuevo documento al caso de familia Rodriguez.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24),
    leida: true,
    prioridad: "media",
  },
  {
    id: "5",
    tipo: "ley",
    titulo: "Nueva sentencia de la Corte Constitucional",
    mensaje: "Sentencia C-123 de 2024 sobre derechos laborales en trabajo remoto.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 48),
    leida: true,
    prioridad: "media",
  },
  {
    id: "6",
    tipo: "sistema",
    titulo: "Bienvenido a TOCHI Legal Suite",
    mensaje: "Tu cuenta ha sido configurada exitosamente. Explora todas las funcionalidades disponibles.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 72),
    leida: true,
    prioridad: "baja",
  },
]

const tipoIconos: Record<string, React.ReactNode> = {
  cita: <Calendar className="h-5 w-5 text-blue-500" />,
  caso: <FileText className="h-5 w-5 text-purple-500" />,
  ley: <Scale className="h-5 w-5 text-amber-500" />,
  vencimiento: <Clock className="h-5 w-5 text-red-500" />,
  sistema: <Info className="h-5 w-5 text-gray-500" />,
}

const prioridadBadge: Record<string, string> = {
  alta: "bg-red-100 text-red-800",
  media: "bg-amber-100 text-amber-800",
  baja: "bg-gray-100 text-gray-800",
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState(notificacionesMock)
  const [filtroTipo, setFiltroTipo] = useState<string>("todas")

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  const marcarComoLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
  }

  const marcarTodasComoLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  const notificacionesFiltradas =
    filtroTipo === "todas"
      ? notificaciones
      : notificaciones.filter((n) => n.tipo === filtroTipo)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notificaciones
            {noLeidas > 0 && (
              <Badge className="bg-red-500 text-white">{noLeidas}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Mantente al dia con tus casos, citas y actualizaciones legales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={marcarTodasComoLeidas} disabled={noLeidas === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como leidas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="todas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todas" onClick={() => setFiltroTipo("todas")}>
            Todas
          </TabsTrigger>
          <TabsTrigger value="cita" onClick={() => setFiltroTipo("cita")}>
            Citas
          </TabsTrigger>
          <TabsTrigger value="ley" onClick={() => setFiltroTipo("ley")}>
            Leyes
          </TabsTrigger>
          <TabsTrigger value="vencimiento" onClick={() => setFiltroTipo("vencimiento")}>
            Vencimientos
          </TabsTrigger>
          <TabsTrigger value="configuracion">
            <Settings className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-3">
          {notificacionesFiltradas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tienes notificaciones</p>
              </CardContent>
            </Card>
          ) : (
            notificacionesFiltradas.map((notif) => (
              <Card
                key={notif.id}
                className={`transition-all hover:shadow-md cursor-pointer ${
                  !notif.leida ? "border-l-4 border-l-primary bg-primary/5" : ""
                }`}
                onClick={() => marcarComoLeida(notif.id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">{tipoIconos[notif.tipo]}</div>
                    <div className="flex-grow space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium ${!notif.leida ? "text-foreground" : "text-muted-foreground"}`}>
                            {notif.titulo}
                          </h3>
                          <Badge className={prioridadBadge[notif.prioridad]} variant="secondary">
                            {notif.prioridad}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(notif.fecha, { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.mensaje}</p>
                      {notif.enlace && (
                        <Button variant="link" className="h-auto p-0 text-primary text-sm">
                          Ver detalles
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="cita" className="space-y-3">
          {notificacionesFiltradas.map((notif) => (
            <Card key={notif.id} className={!notif.leida ? "border-l-4 border-l-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">{tipoIconos[notif.tipo]}</div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{notif.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{notif.mensaje}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ley" className="space-y-3">
          {notificacionesFiltradas.map((notif) => (
            <Card key={notif.id} className={!notif.leida ? "border-l-4 border-l-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">{tipoIconos[notif.tipo]}</div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{notif.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{notif.mensaje}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vencimiento" className="space-y-3">
          {notificacionesFiltradas.map((notif) => (
            <Card key={notif.id} className={!notif.leida ? "border-l-4 border-l-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">{tipoIconos[notif.tipo]}</div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{notif.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{notif.mensaje}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="configuracion">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion de Notificaciones</CardTitle>
              <CardDescription>Personaliza como y cuando recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notificaciones por Email
                </h3>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Recordatorios de citas</p>
                      <p className="text-xs text-muted-foreground">24 horas y 1 hora antes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Vencimiento de terminos</p>
                      <p className="text-xs text-muted-foreground">7, 3 y 1 dia antes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Actualizaciones de leyes</p>
                      <p className="text-xs text-muted-foreground">Cambios en codigos de tu interes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Notificaciones Push
                </h3>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Citas urgentes</p>
                      <p className="text-xs text-muted-foreground">Notificaciones en tiempo real</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Mensajes de clientes</p>
                      <p className="text-xs text-muted-foreground">Del portal de clientes</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Areas de Derecho de Interes
                </h3>
                <div className="flex flex-wrap gap-2 pl-6">
                  {["Civil", "Penal", "Laboral", "Familia", "Comercial", "Administrativo", "Constitucional"].map((area) => (
                    <Badge key={area} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button className="w-full">Guardar Configuracion</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
