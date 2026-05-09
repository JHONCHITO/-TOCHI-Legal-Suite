"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { KeyRound, Loader2, Lock, Save, Shield, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";

type SecurityPreferences = {
  autenticacionReforzada: boolean;
  bloqueoInactividad: boolean;
  registroAccesos: boolean;
  alertasSesion: boolean;
  respaldosCifrados: boolean;
  consentimientoHabeasData: boolean;
};

type UserProfile = {
  rol?: string;
  email?: string;
  securityPreferences?: Partial<SecurityPreferences>;
};

const DEFAULT_SECURITY: SecurityPreferences = {
  autenticacionReforzada: true,
  bloqueoInactividad: true,
  registroAccesos: true,
  alertasSesion: true,
  respaldosCifrados: false,
  consentimientoHabeasData: true,
};

const ROLE_DETAILS: Record<string, { label: string; detail: string; capabilities: string[] }> = {
  superadmin: {
    label: "Superadmin",
    detail: "Control total sobre la suite y la infraestructura.",
    capabilities: ["Usuarios", "Roles", "Auditoria", "Automatizaciones"],
  },
  admin: {
    label: "Administrador",
    detail: "Gestiona equipo, casos, clientes y configuración general.",
    capabilities: ["Equipo", "Casos", "Plantillas", "Facturación"],
  },
  abogado: {
    label: "Abogado",
    detail: "Opera expedientes, documentos, agenda e IA jurídica.",
    capabilities: ["Casos", "Documentos", "IA", "Agenda"],
  },
  asistente: {
    label: "Asistente jurídico",
    detail: "Apoya la operación documental y el seguimiento interno.",
    capabilities: ["Documentos", "Agenda", "Seguimiento", "Búsqueda"],
  },
  cliente: {
    label: "Cliente",
    detail: "Acceso al portal, documentos y seguimiento de su caso.",
    capabilities: ["Portal", "Documentos", "Agenda", "Mensajes"],
  },
};

async function fetcher(url: string) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "No se pudo cargar la configuración");
  }
  return payload as UserProfile;
}

export default function SeguridadPage() {
  const { data: userData, error, isLoading, mutate } = useSWR<UserProfile>("/api/users/me", fetcher);
  const [saving, setSaving] = useState(false);
  const [security, setSecurity] = useState<SecurityPreferences>(DEFAULT_SECURITY);

  useEffect(() => {
    if (!userData) {
      return;
    }

    setSecurity({
      ...DEFAULT_SECURITY,
      ...(userData.securityPreferences || {}),
    });
  }, [userData]);

  const currentRole = userData?.rol || "abogado";
  const roleInfo = ROLE_DETAILS[currentRole] || ROLE_DETAILS.abogado;

  const securityCards = useMemo(
    () => [
      { label: "Autenticación reforzada", key: "autenticacionReforzada" as const },
      { label: "Bloqueo por inactividad", key: "bloqueoInactividad" as const },
      { label: "Registro de accesos", key: "registroAccesos" as const },
      { label: "Alertas por inicio de sesión", key: "alertasSesion" as const },
      { label: "Respaldos cifrados", key: "respaldosCifrados" as const },
      { label: "Consentimiento y habeas data", key: "consentimientoHabeasData" as const },
    ],
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          securityPreferences: security,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo guardar la seguridad");
      }

      await mutate();
      toast.success("Preferencias de seguridad guardadas");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "No se pudo guardar la seguridad");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-8 text-center text-destructive">
          No se pudo cargar la configuración de seguridad.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seguridad y protección de datos</h1>
          <p className="text-muted-foreground">
            Controles mínimos para información sensible de clientes, casos y documentos legales.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{roleInfo.label}</Badge>
          <Badge variant="outline">{userData?.email || "Sin correo"}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Estado general</p>
              <p className="text-2xl font-bold">{security.autenticacionReforzada ? "Protegido" : "Ajuste pendiente"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Usuarios con acceso</p>
              <p className="text-2xl font-bold">{currentRole === "superadmin" ? "Total" : "Limitado"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <KeyRound className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Sesiones activas</p>
              <p className="text-2xl font-bold">{security.alertasSesion ? "Monitor" : "Sin alerta"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Respaldos</p>
              <p className="text-2xl font-bold">{security.respaldosCifrados ? "Activos" : "Pendiente"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Controles de seguridad</CardTitle>
            <CardDescription>Activa barreras reales para trabajo con información reservada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityCards.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={security[item.key]}
                  onCheckedChange={(checked) =>
                    setSecurity((current) => ({
                      ...current,
                      [item.key]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Política sugerida</CardTitle>
            <CardDescription>Checklist para cumplimiento básico dentro de la firma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge>Acceso por roles</Badge>
            <Badge variant="secondary">Confidencialidad de expedientes</Badge>
            <Badge variant="outline">
              {security.respaldosCifrados ? "Respaldo cifrado activo" : "Respaldo cifrado recomendado"}
            </Badge>
            <Badge variant="outline">
              {security.consentimientoHabeasData ? "Habeas data configurado" : "Pendiente: consentimiento y habeas data"}
            </Badge>
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              La configuración se guarda en tu perfil y se refleja en toda la suite.
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Rol actual: {roleInfo.label}</p>
              <p className="text-sm text-muted-foreground">{roleInfo.detail}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar seguridad
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
