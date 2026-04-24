"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Info,
  Mail,
  Settings,
  Smartphone,
  Scale,
} from "lucide-react";
import { demoNotifications } from "@/lib/demo-data";

const tipoIconos: Record<string, React.ReactNode> = {
  cita: <Calendar className="h-5 w-5 text-blue-500" />,
  caso: <FileText className="h-5 w-5 text-purple-500" />,
  ley: <Scale className="h-5 w-5 text-amber-500" />,
  vencimiento: <Clock className="h-5 w-5 text-red-500" />,
  sistema: <Info className="h-5 w-5 text-gray-500" />,
};

const prioridadBadge: Record<string, string> = {
  alta: "bg-red-100 text-red-800",
  media: "bg-amber-100 text-amber-800",
  baja: "bg-gray-100 text-gray-800",
};

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState(demoNotifications);
  const [filtroTipo, setFiltroTipo] = useState<string>("todas");

  const noLeidas = notifications.filter((item) => !item.leida).length;

  const marcarComoLeida = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, leida: true } : item))
    );
  };

  const marcarTodasComoLeidas = () => {
    setNotifications((current) => current.map((item) => ({ ...item, leida: true })));
  };

  const filtered = useMemo(() => {
    if (filtroTipo === "todas") {
      return notifications;
    }
    return notifications.filter((item) => item.tipo === filtroTipo);
  }, [filtroTipo, notifications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Bell className="h-6 w-6" />
            Notificaciones
            {noLeidas > 0 ? <Badge className="bg-red-500 text-white">{noLeidas}</Badge> : null}
          </h1>
          <p className="text-muted-foreground">
            Alertas de plazos, movimientos, agenda y seguimiento normativo.
          </p>
        </div>
        <Button variant="outline" onClick={marcarTodasComoLeidas} disabled={noLeidas === 0}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Marcar todas como leidas
        </Button>
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

        {["todas", "cita", "ley", "vencimiento"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-3">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No tienes notificaciones en esta categoria</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((notif) => (
                <Card
                  key={notif.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notif.leida ? "border-l-4 border-l-primary bg-primary/5" : ""
                  }`}
                  onClick={() => marcarComoLeida(notif.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="mt-1 flex-shrink-0">{tipoIconos[notif.tipo]}</div>
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
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(notif.fecha), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.mensaje}</p>
                        {notif.enlace ? (
                          <Button variant="link" className="h-auto p-0 text-sm text-primary" asChild>
                            <Link href={notif.enlace}>Ver detalles</Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}

        <TabsContent value="configuracion">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion de notificaciones</CardTitle>
              <CardDescription>Controla correos, push y alertas operativas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4" />
                  Notificaciones por correo
                </h3>
                {[
                  "Recordatorios de audiencias",
                  "Vencimiento de terminos",
                  "Cambios en codigos prioritarios",
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">{item}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium">
                  <Smartphone className="h-4 w-4" />
                  Notificaciones push
                </h3>
                {["Citas urgentes", "Mensajes de clientes"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">{item}</span>
                    <Switch defaultChecked={index === 0} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
