"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ElementType } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight,
  Calendar,
  CircleDollarSign,
  Clock3,
  Database,
  FileText,
  MoreHorizontal,
  RefreshCcw,
  ShieldCheck,
  Users,
  Wallet,
  AlertTriangle,
  Search,
  Scale,
  MessageSquare,
} from "lucide-react";
import { formatDateShort, formatDateTime } from "@/lib/utils/format";
import { useAdminOverviewInitialData } from "@/components/dashboard/admin-overview-provider";

type AdminOverview = {
  summary: {
    users: {
      total: number;
      active: number;
      superadmins: number;
      admins: number;
      abogados: number;
      asistentes: number;
      clientes: number;
    };
    subscriptions: {
      total: number;
      active: number;
      trialing: number;
      pastDue: number;
      canceled: number;
      expiringSoon: number;
    };
    operations: {
      cases: number;
      clients: number;
      documents: number;
      invoices: number;
      appointments: number;
      communications: number;
      searches: number;
      verifications: number;
    };
  };
  users: Array<{
    _id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    rol: string;
    activo: boolean;
    createdAt: string;
    subscription: {
      status: string;
      planId: string;
      planName: string;
      trialEnd?: string | null;
      currentPeriodEnd?: string | null;
      accessUntil?: string | null;
      daysLeft?: number | null;
      notes?: string;
    } | null;
  }>;
  activities: Array<{
    _id: string;
    type: string;
    title: string;
    description: string;
    date: string;
    href?: string;
    tone?: "neutral" | "success" | "warning" | "danger";
  }>;
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrador",
  abogado: "Abogado",
  asistente: "Asistente",
  cliente: "Cliente",
};

const ROLE_BADGES: Record<string, string> = {
  superadmin: "bg-red-100 text-red-800",
  admin: "bg-purple-100 text-purple-800",
  abogado: "bg-blue-100 text-blue-800",
  asistente: "bg-emerald-100 text-emerald-800",
  cliente: "bg-slate-100 text-slate-800",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  trialing: "Prueba",
  past_due: "Vencido",
  canceled: "Cancelado",
};

const STATUS_BADGES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  trialing: "bg-blue-100 text-blue-800",
  past_due: "bg-amber-100 text-amber-800",
  canceled: "bg-muted text-muted-foreground",
};

const ACTIVITY_LABELS: Record<string, string> = {
  usuario: "Usuario",
  cliente: "Cliente",
  caso: "Caso",
  documento: "Documento",
  factura: "Factura",
  cita: "Cita",
  comunicacion: "Comunicacion",
  busqueda: "Busqueda",
  verificacion: "Verificacion",
  suscripcion: "Suscripcion",
};

const ACTIVITY_ICONS: Record<string, ElementType> = {
  usuario: Users,
  cliente: Users,
  caso: Scale,
  documento: FileText,
  factura: CircleDollarSign,
  cita: Calendar,
  comunicacion: MessageSquare,
  busqueda: Search,
  verificacion: ShieldCheck,
  suscripcion: Wallet,
};

const ACTIVITY_BADGES: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
};

const EMPTY_OVERVIEW: AdminOverview = {
  summary: {
    users: {
      total: 0,
      active: 0,
      superadmins: 0,
      admins: 0,
      abogados: 0,
      asistentes: 0,
      clientes: 0,
    },
    subscriptions: {
      total: 0,
      active: 0,
      trialing: 0,
      pastDue: 0,
      canceled: 0,
      expiringSoon: 0,
    },
    operations: {
      cases: 0,
      clients: 0,
      documents: 0,
      invoices: 0,
      appointments: 0,
      communications: 0,
      searches: 0,
      verifications: 0,
    },
  },
  users: [],
  activities: [],
};

export default function AdminHomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const initialData = useAdminOverviewInitialData();
  const overview = initialData || EMPTY_OVERVIEW;
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const users = overview.users || [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) =>
      `${user.nombre} ${user.apellido} ${user.email} ${user.rol}`.toLowerCase().includes(term)
    );
  }, [overview.users, search]);

  const handleExtendAccess = async (userId: string, days: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extendAccessDays: days }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "No se pudo extender el acceso");
      }

      const subscription = payload.subscription;
      toast({
        title: "Acceso extendido",
        description: subscription?.currentPeriodEnd
          ? `Nuevo vencimiento: ${formatDateShort(subscription.currentPeriodEnd)}`
          : `Se agregaron ${days} dias al acceso`,
      });
      router.refresh();
    } catch (extendError) {
      toast({
        title: "Error",
        description: extendError instanceof Error ? extendError.message : "No se pudo extender el acceso",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !currentActive }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "No se pudo actualizar el estado");
      }

      toast({
        title: currentActive ? "Usuario desactivado" : "Usuario activado",
        description: currentActive ? "El acceso quedo suspendido" : "El acceso quedo habilitado nuevamente",
      });
      router.refresh();
    } catch (toggleError) {
      toast({
        title: "Error",
        description: toggleError instanceof Error ? toggleError.message : "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    const confirmed = confirm(`Eliminar a ${displayName}? Esta accion no se puede deshacer.`);
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "No se pudo eliminar el usuario");
      }

      toast({
        title: "Usuario eliminado",
        description: `${displayName} fue retirado del sistema`,
      });
      router.refresh();
    } catch (deleteError) {
      toast({
        title: "Error",
        description: deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const summary = overview.summary;
  const metrics = [
    {
      title: "Usuarios",
      value: summary.users.total || 0,
      description: `${summary.users.active || 0} activos`,
      icon: Users,
    },
    {
      title: "Clientes",
      value: summary.operations.clients || 0,
      description: "Clientes en la base",
      icon: Database,
    },
    {
      title: "Casos",
      value: summary.operations.cases || 0,
      description: "Expedientes registrados",
      icon: Scale,
    },
    {
      title: "Documentos",
      value: summary.operations.documents || 0,
      description: "Documentos y plantillas",
      icon: FileText,
    },
    {
      title: "Suscripciones activas",
      value: summary.subscriptions.active || 0,
      description: `${summary.subscriptions.expiringSoon || 0} por vencer`,
      icon: Wallet,
    },
    {
      title: "Vencidas",
      value: summary.subscriptions.pastDue || 0,
      description: `${summary.subscriptions.canceled || 0} canceladas`,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-800">Solo dueno</Badge>
            <Badge variant="outline">Superadmin</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Panel de administracion</h1>
          <p className="max-w-3xl text-muted-foreground">
            Vista total de usuarios, suscripciones, actividad reciente y control de acceso del sistema.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/usuarios">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Gestionar usuarios
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.refresh()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-primary/10 p-3">
                <metric.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Actividad reciente</CardTitle>
              <CardDescription>Registro vivo de lo que ha pasado en la plataforma.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/admin/usuarios">
                Ver cuentas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!overview.activities.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
                <Clock3 className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Aun no hay actividad para mostrar</p>
                <p className="text-sm text-muted-foreground">
                  Cuando se registren casos, documentos, citas o usuarios, apareceran aqui.
                </p>
              </div>
            ) : (
              overview.activities.map((activity) => {
                const ActivityIcon = ACTIVITY_ICONS[activity.type] || Clock3;
                return (
                  <Link
                    key={activity._id}
                    href={activity.href || "/dashboard/admin"}
                    className="flex items-start gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="rounded-2xl bg-primary/10 p-2">
                      <ActivityIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={ACTIVITY_BADGES[activity.tone || "neutral"]}>
                          {ACTIVITY_LABELS[activity.type] || "Actividad"}
                        </Badge>
                        <p className="font-medium">{activity.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(activity.date)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de suscripciones</CardTitle>
            <CardDescription>Resumen de prueba, vigencia y cuentas vencidas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Activas", value: summary.subscriptions.active || 0 },
                { label: "En prueba", value: summary.subscriptions.trialing || 0 },
                { label: "Vencidas", value: summary.subscriptions.pastDue || 0 },
                { label: "Canceladas", value: summary.subscriptions.canceled || 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border p-4">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">Reglas de acceso</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>• La prueba gratuita dura 7 dias habiles.</li>
                <li>• Si el periodo vence y no se extiende, el acceso se corta.</li>
                <li>• El superadmin puede extender dias o apagar cuentas desde esta pantalla.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Cuentas y accesos</CardTitle>
              <CardDescription>Busca, extiende, desactiva o elimina usuarios del sistema.</CardDescription>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, correo o rol..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Acceso</TableHead>
                <TableHead>Suscripcion</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const subscription = user.subscription;
                const displayName = `${user.nombre} ${user.apellido}`.trim();
                const accessUntil = subscription?.accessUntil || subscription?.currentPeriodEnd || subscription?.trialEnd;
                const daysLeft = subscription?.daysLeft;
                const accessLabel = subscription
                  ? daysLeft === null || daysLeft === undefined
                    ? "Sin vencimiento"
                    : daysLeft < 0
                      ? "Vencido"
                      : `${daysLeft} dias restantes`
                  : "Sin plan";

                return (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {user.nombre?.[0]}
                          {user.apellido?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{displayName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_BADGES[user.rol] || "bg-slate-100 text-slate-800"}>
                        {ROLE_LABELS[user.rol] || user.rol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {subscription ? (
                        <div className="space-y-1">
                          <Badge className={STATUS_BADGES[subscription.status] || STATUS_BADGES.active}>
                            {STATUS_LABELS[subscription.status] || subscription.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {accessUntil ? `Hasta ${formatDateShort(accessUntil)}` : "Sin fecha limite"}
                          </p>
                          <p className="text-xs text-muted-foreground">{accessLabel}</p>
                        </div>
                      ) : (
                        <Badge variant="secondary">Sin suscripcion</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscription ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{subscription.planName}</p>
                          <p className="text-xs text-muted-foreground">{subscription.notes || "Sin observaciones"}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No aplica</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.activo ? "default" : "secondary"}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.rol === "superadmin" ? (
                        <Badge variant="outline">Protegido</Badge>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExtendAccess(user._id, 7)}>
                              Extender 7 dias
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExtendAccess(user._id, 30)}>
                              Extender 30 dias
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(user._id, user.activo)}>
                              {user.activo ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteUser(user._id, displayName)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay cuentas que coincidan con ese filtro.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
