"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Bell, Loader2, Save, Shield, UserCog } from "lucide-react";
import { toast } from "sonner";

type UserPreferences = {
  recordatoriosJudiciales: boolean;
  cambiosNormativos: boolean;
  resumenDiario: boolean;
  carteraVencida: boolean;
  email: boolean;
  push: boolean;
};

type UserProfile = {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  tarjetaProfesional?: string;
  firma?: string;
  especialidades?: string[];
  rol?: string;
  notificationPreferences?: Partial<UserPreferences>;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  recordatoriosJudiciales: true,
  cambiosNormativos: true,
  resumenDiario: true,
  carteraVencida: true,
  email: true,
  push: false,
};

const ROLE_DETAILS: Record<string, { label: string; detail: string; capabilities: string[] }> = {
  superadmin: {
    label: "Superadmin",
    detail: "Control total de la suite y la infraestructura.",
    capabilities: ["Usuarios", "Roles", "Auditoria", "Automatizaciones"],
  },
  admin: {
    label: "Administrador",
    detail: "Gestiona equipo, casos, clientes y configuracion general.",
    capabilities: ["Equipo", "Casos", "Plantillas", "Facturacion"],
  },
  abogado: {
    label: "Abogado",
    detail: "Opera expedientes, documentos, agenda e IA juridica.",
    capabilities: ["Casos", "Documentos", "IA", "Agenda"],
  },
  asistente: {
    label: "Asistente juridico",
    detail: "Apoya la operacion documental y el seguimiento interno.",
    capabilities: ["Documentos", "Agenda", "Seguimiento", "Busqueda"],
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
    throw new Error(payload?.error || "No se pudo cargar la configuracion");
  }
  return payload;
}

export default function ConfiguracionPage() {
  const { data: userData, error, isLoading, mutate } = useSWR<UserProfile>("/api/users/me", fetcher);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    tarjetaProfesional: "",
    firma: "",
    especialidades: "",
  });
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (!userData) {
      return;
    }

    setPerfil({
      nombre: userData.nombre || "",
      apellido: userData.apellido || "",
      telefono: userData.telefono || "",
      tarjetaProfesional: userData.tarjetaProfesional || "",
      firma: userData.firma || "",
      especialidades: Array.isArray(userData.especialidades) ? userData.especialidades.join(", ") : "",
    });

    setPreferences({
      ...DEFAULT_PREFERENCES,
      ...(userData.notificationPreferences || {}),
    });
  }, [userData]);

  const currentRole = userData?.rol || "abogado";
  const roleInfo = ROLE_DETAILS[currentRole] || ROLE_DETAILS.abogado;
  const specialities = useMemo(
    () =>
      perfil.especialidades
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [perfil.especialidades]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...perfil,
          especialidades: specialities,
          notificationPreferences: preferences,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo guardar la configuracion");
      }

      await mutate();
      toast.success("Configuracion guardada");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "No se pudo guardar la configuracion");
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
          No se pudo cargar la configuracion del usuario.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
          <p className="text-muted-foreground">
            Ajustes de firma, perfil profesional, automatizacion y politicas internas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{roleInfo.label}</Badge>
          <Badge variant="outline">{userData?.email || "Sin correo"}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Perfil de la firma
            </CardTitle>
            <CardDescription>Datos visibles en documentos, contratos y plantillas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={perfil.nombre}
                onChange={(event) => setPerfil((current) => ({ ...current, nombre: event.target.value }))}
                placeholder="Nombre"
              />
              <Input
                value={perfil.apellido}
                onChange={(event) => setPerfil((current) => ({ ...current, apellido: event.target.value }))}
                placeholder="Apellido"
              />
            </div>

            <Input
              value={perfil.tarjetaProfesional}
              onChange={(event) => setPerfil((current) => ({ ...current, tarjetaProfesional: event.target.value }))}
              placeholder="Tarjeta profesional"
            />

            <Input
              value={perfil.telefono}
              onChange={(event) => setPerfil((current) => ({ ...current, telefono: event.target.value }))}
              placeholder="Telefono principal"
            />

            <Input value={userData?.email || ""} disabled placeholder="Correo oficial" />

            <Textarea
              value={perfil.firma}
              onChange={(event) => setPerfil((current) => ({ ...current, firma: event.target.value }))}
              placeholder="Firma / nombre para aprobaciones y documentos"
              className="min-h-[96px]"
            />

            <Textarea
              value={perfil.especialidades}
              onChange={(event) => setPerfil((current) => ({ ...current, especialidades: event.target.value }))}
              placeholder="Especialidades separadas por coma, por ejemplo: penal, laboral, familia"
              className="min-h-[96px]"
            />

            <div className="flex flex-wrap gap-2">
              {specialities.slice(0, 4).map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Preferencias operativas
            </CardTitle>
            <CardDescription>Define como se comporta la suite en agenda y alertas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "recordatoriosJudiciales", label: "Recordar plazos judiciales" },
              { key: "cambiosNormativos", label: "Avisar cambios normativos" },
              { key: "resumenDiario", label: "Enviar resumen diario" },
              { key: "carteraVencida", label: "Mostrar alertas de cartera vencida" },
              { key: "email", label: "Enviar por correo" },
              { key: "push", label: "Notificaciones push" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={preferences[item.key as keyof UserPreferences]}
                  onCheckedChange={(checked) =>
                    setPreferences((current) => ({
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
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Roles y acceso
            </CardTitle>
            <CardDescription>{roleInfo.detail}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {roleInfo.capabilities.map((capability) => (
                <Badge key={capability} variant="outline">
                  {capability}
                </Badge>
              ))}
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Rol actual: {roleInfo.label}</p>
              <p className="text-sm text-muted-foreground">
                La navegacion y la experiencia de TOCHI se ajustan segun este rol.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado de proteccion
            </CardTitle>
            <CardDescription>Indicadores reales de la cuenta y su seguridad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge>Autenticacion activa</Badge>
            <Badge variant="secondary">Sesion cargada desde MongoDB</Badge>
            <Badge variant="outline">Alertas sincronizadas con perfil</Badge>
            <Badge variant="outline">Rol: {roleInfo.label}</Badge>
            <p className="text-sm text-muted-foreground">
              Cuando guardes aqui, el perfil se actualiza en toda la suite.
            </p>
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
              Guardar perfil
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
