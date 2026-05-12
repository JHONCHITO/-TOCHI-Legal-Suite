"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Calendar, CheckCircle, Clock, FileText, Info, Mail, RefreshCw, Settings, Smartphone, Scale } from "lucide-react";
import { markNotificationsRead, useNotifications } from "@/lib/hooks/use-data";
import { toast } from "sonner";

type UserPreferences = {
  recordatoriosJudiciales?: boolean;
  cambiosNormativos?: boolean;
  resumenDiario?: boolean;
  carteraVencida?: boolean;
  email?: boolean;
  push?: boolean;
};

type UserProfile = {
  notificationPreferences?: UserPreferences;
};

const DEFAULT_PREFERENCES: Required<UserPreferences> = {
  recordatoriosJudiciales: true,
  cambiosNormativos: true,
  resumenDiario: true,
  carteraVencida: true,
  email: true,
  push: false,
};

async function fetcher(url: string) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "No se pudo cargar el perfil");
  }
  return payload as UserProfile;
}

const tipoIconos: Record<string, React.ReactNode> = {
  cita_proxima: <Calendar className="h-5 w-5 text-blue-500" />,
  cita_cancelada: <Clock className="h-5 w-5 text-red-500" />,
  caso_actualizado: <FileText className="h-5 w-5 text-purple-500" />,
  documento_nuevo: <FileText className="h-5 w-5 text-blue-500" />,
  vencimiento: <Clock className="h-5 w-5 text-red-500" />,
  actualizacion_ley: <Scale className="h-5 w-5 text-amber-500" />,
  mensaje: <Mail className="h-5 w-5 text-emerald-500" />,
  sistema: <Info className="h-5 w-5 text-gray-500" />,
};

const prioridadBadge: Record<string, string> = {
  alta: "bg-red-100 text-red-800",
  media: "bg-amber-100 text-amber-800",
  baja: "bg-gray-100 text-gray-800",
};

type NotificationItem = {
  id?: string;
  _id?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  enlace?: string;
  leida?: boolean;
  prioridad?: string;
  fecha?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function NotificacionesPage() {
  const [filtroTipo, setFiltroTipo] = useState<string>("todas");
  const [syncing, setSyncing] = useState(false);
  const { data: profile, mutate: mutateProfile } = useSWR<UserProfile>("/api/users/me", fetcher);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [activatingBrowserNotifications, setActivatingBrowserNotifications] = useState(false);
  const { notifications, unreadCount, isLoading, isError, mutate, streamStatus, browserPermission, requestBrowserNotifications } =
    useNotifications({ desktopNotifications: browserNotificationsEnabled });
  const { data: session } = useSession();
  const canSync = ["superadmin", "admin", "abogado", "asistente"].includes(session?.user?.role || "");

  const normalizedNotifications = useMemo(
    () => (notifications as NotificationItem[]).map((item) => ({ ...item, id: item.id || item._id })),
    [notifications]
  );

  const noLeidas = unreadCount || normalizedNotifications.filter((item) => !item.leida).length;

  useEffect(() => {
    setBrowserNotificationsEnabled(Boolean(profile?.notificationPreferences?.push));
  }, [profile?.notificationPreferences?.push]);

  const handleEnableBrowserNotifications = async () => {
    setActivatingBrowserNotifications(true);
    try {
      const granted = await requestBrowserNotifications();
      if (!granted) {
        throw new Error(
          browserPermission === "denied"
            ? "El navegador bloqueo las notificaciones. Debes habilitarlas desde la configuracion del navegador."
            : "No se pudo activar el permiso de notificaciones."
        );
      }

      setBrowserNotificationsEnabled(true);

      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationPreferences: {
            ...DEFAULT_PREFERENCES,
            ...(profile?.notificationPreferences || {}),
            push: true,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo guardar la preferencia push");
      }

      await mutateProfile();
      toast.success("Notificaciones del navegador activadas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo activar el navegador");
    } finally {
      setActivatingBrowserNotifications(false);
    }
  };

  const marcarComoLeida = async (id?: string) => {
    if (!id) return;
    await markNotificationsRead(id);
    await mutate();
  };

  const marcarTodasComoLeidas = async () => {
    await markNotificationsRead();
    await mutate();
  };

  const sincronizarAhora = async (options?: { silent?: boolean }) => {
    setSyncing(true);
    try {
      const response = await fetch("/api/notifications/sync", { method: "POST" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo sincronizar");
      }

      await mutate();
      if (!options?.silent) {
        toast.success("Notificaciones sincronizadas");
      }
    } catch (error) {
      if (!options?.silent) {
        toast.error(error instanceof Error ? error.message : "No se pudo sincronizar");
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (canSync) {
      void sincronizarAhora({ silent: true });
    }
  }, [canSync]);

  const filtered = useMemo(() => {
    if (filtroTipo === "todas") {
      return normalizedNotifications;
    }
    return normalizedNotifications.filter((item) => item.tipo === filtroTipo);
  }, [filtroTipo, normalizedNotifications]);

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
            Alertas de plazos, movimientos, agenda y seguimiento normativo en tiempo real.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              variant={streamStatus === "connected" ? "default" : "outline"}
              className={streamStatus === "connected" ? "bg-emerald-600 text-white" : ""}
            >
              {streamStatus === "connected"
                ? "Tiempo real activo"
                : streamStatus === "connecting"
                  ? "Conectando al flujo"
                  : "Modo respaldo"}
            </Badge>
            <Badge variant="outline">Actualizacion cada 15s</Badge>
          </div>
          {isLoading ? <p className="mt-2 text-sm text-muted-foreground">Cargando notificaciones...</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canSync ? (
            <Button variant="outline" onClick={() => sincronizarAhora()} disabled={syncing || isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              Sincronizar ahora
            </Button>
          ) : null}
          <Button variant="outline" onClick={marcarTodasComoLeidas} disabled={noLeidas === 0 || isLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar todas como leidas
          </Button>
        </div>
      </div>

      <Card className="border-primary/15 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Entrega en tiempo real</h2>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">
              TOCHI escucha los eventos por SSE, los convierte en avisos del navegador cuando tienes permiso
              activo y respeta la preferencia push guardada en tu perfil.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={streamStatus === "connected" ? "default" : "outline"}
                className={streamStatus === "connected" ? "bg-emerald-600 text-white" : ""}
              >
                {streamStatus === "connected"
                  ? "SSE conectado"
                  : streamStatus === "connecting"
                    ? "SSE conectando"
                    : "SSE en respaldo"}
              </Badge>
              <Badge variant={browserNotificationsEnabled ? "default" : "outline"}>
                {browserNotificationsEnabled ? "Push del perfil activo" : "Push del perfil inactivo"}
              </Badge>
              <Badge
                variant={browserPermission === "granted" ? "default" : browserPermission === "denied" ? "destructive" : "outline"}
                className={browserPermission === "granted" ? "bg-primary text-primary-foreground" : ""}
              >
                {browserPermission === "granted"
                  ? "Permiso del navegador concedido"
                  : browserPermission === "denied"
                    ? "Permiso del navegador bloqueado"
                    : browserPermission === "unsupported"
                      ? "Navegador sin soporte"
                      : "Permiso del navegador pendiente"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void handleEnableBrowserNotifications()}
              disabled={activatingBrowserNotifications || browserPermission === "unsupported"}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              {browserPermission === "granted" && browserNotificationsEnabled
                ? "Notificaciones activadas"
                : activatingBrowserNotifications
                  ? "Activando..."
                  : "Activar notificaciones del navegador"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/configuracion">Abrir configuracion</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            No se pudieron cargar las notificaciones.
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="todas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todas" onClick={() => setFiltroTipo("todas")}>
            Todas
          </TabsTrigger>
          <TabsTrigger value="cita_proxima" onClick={() => setFiltroTipo("cita_proxima")}>
            Citas
          </TabsTrigger>
          <TabsTrigger value="actualizacion_ley" onClick={() => setFiltroTipo("actualizacion_ley")}>
            Leyes
          </TabsTrigger>
          <TabsTrigger value="vencimiento" onClick={() => setFiltroTipo("vencimiento")}>
            Vencimientos
          </TabsTrigger>
          <TabsTrigger value="configuracion">
            <Settings className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {["todas", "cita_proxima", "actualizacion_ley", "vencimiento"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-3">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No tienes notificaciones en esta categoria</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((notif) => {
                const fechaBase = notif.fecha || notif.createdAt || notif.updatedAt;
                return (
                  <Card
                    key={notif.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notif.leida ? "border-l-4 border-l-primary bg-primary/5" : ""
                    }`}
                    onClick={() => marcarComoLeida(notif.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="mt-1 flex-shrink-0">{tipoIconos[notif.tipo] || tipoIconos.sistema}</div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-medium ${!notif.leida ? "text-foreground" : "text-muted-foreground"}`}>
                                {notif.titulo}
                              </h3>
                              {notif.prioridad ? (
                                <Badge className={prioridadBadge[notif.prioridad] || prioridadBadge.media} variant="secondary">
                                  {notif.prioridad}
                                </Badge>
                              ) : null}
                            </div>
                            {fechaBase ? (
                              <span className="whitespace-nowrap text-xs text-muted-foreground">
                                {formatDistanceToNow(parseISO(fechaBase), { addSuffix: true, locale: es })}
                              </span>
                            ) : null}
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
                );
              })
            )}
          </TabsContent>
        ))}

        <TabsContent value="configuracion">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion de notificaciones</CardTitle>
              <CardDescription>La configuracion real se guarda en tu perfil de usuario y se sincroniza con esta vista.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <Mail className="mb-3 h-4 w-4 text-primary" />
                  <p className="font-medium">Correo y recordatorios</p>
                  <p className="text-sm text-muted-foreground">
                    Se activan desde tu perfil para avisos judiciales, novedad normativa y resumen diario.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <Smartphone className="mb-3 h-4 w-4 text-primary" />
                  <p className="font-medium">Push y actividad</p>
                  <p className="text-sm text-muted-foreground">
                    Las alertas llegan por SSE y se revalidan cada 15 segundos como respaldo.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <Settings className="mb-3 h-4 w-4 text-primary" />
                  <p className="font-medium">Ajustes por rol</p>
                  <p className="text-sm text-muted-foreground">
                    Cada rol ve distintas opciones y permisos de acuerdo con su nivel de acceso.
                  </p>
                </div>
              </div>

              <Button asChild>
                <Link href="/dashboard/configuracion">Abrir configuracion real</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
