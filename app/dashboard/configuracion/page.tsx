"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Bell, Loader2, Phone, Save, Shield, UserCog } from "lucide-react";
import { toast } from "sonner";
import { saveWhatsAppIntegration, useWhatsAppIntegration } from "@/lib/hooks/use-data";

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
  const { integration: whatsappIntegration, isLoading: isLoadingWhatsAppIntegration, mutate: mutateWhatsAppIntegration } = useWhatsAppIntegration();
  const [saving, setSaving] = useState(false);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [perfil, setPerfil] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    tarjetaProfesional: "",
    firma: "",
    especialidades: "",
  });
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [whatsappConfig, setWhatsAppConfig] = useState({
    accessToken: "",
    phoneNumberId: "",
    webhookVerifyToken: "",
    graphVersion: "v21.0",
    defaultCountryCode: "57",
    publicAppUrl: "",
    businessAccountId: "",
    enabled: true,
  });

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

  useEffect(() => {
    if (!whatsappIntegration) {
      return;
    }

    setWhatsAppConfig({
      accessToken: "",
      phoneNumberId: whatsappIntegration.phoneNumberId || "",
      webhookVerifyToken: "",
      graphVersion: whatsappIntegration.graphVersion || "v21.0",
      defaultCountryCode: whatsappIntegration.defaultCountryCode || "57",
      publicAppUrl: whatsappIntegration.publicAppUrl || "",
      businessAccountId: whatsappIntegration.businessAccountId || "",
      enabled: typeof whatsappIntegration.enabled === "boolean" ? whatsappIntegration.enabled : true,
    });
  }, [whatsappIntegration]);

  const currentRole = userData?.rol || "abogado";
  const roleInfo = ROLE_DETAILS[currentRole] || ROLE_DETAILS.abogado;
  const canEditWhatsApp = currentRole === "admin" || currentRole === "superadmin";
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

  const handleWhatsAppSave = async () => {
    if (!canEditWhatsApp) {
      toast.error("Solo administradores pueden guardar la integracion de WhatsApp");
      return;
    }

    setSavingWhatsApp(true);
    try {
      await saveWhatsAppIntegration({
        ...whatsappConfig,
      });
      await mutateWhatsAppIntegration();
      toast.success("Integracion de WhatsApp guardada");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "No se pudo guardar WhatsApp");
    } finally {
      setSavingWhatsApp(false);
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
            Ajustes de perfil, firmas, alertas y permisos por rol en la suite legal.
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
              Perfil profesional
            </CardTitle>
            <CardDescription>Datos usados en documentos, alertas y portal del cliente.</CardDescription>
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
            <Input value={perfil.tarjetaProfesional} onChange={(event) => setPerfil((current) => ({ ...current, tarjetaProfesional: event.target.value }))} placeholder="Tarjeta profesional" />
            <Input value={perfil.telefono} onChange={(event) => setPerfil((current) => ({ ...current, telefono: event.target.value }))} placeholder="Telefono principal" />
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
              Preferencias de alerta
            </CardTitle>
            <CardDescription>Activa la manera en que TOCHI te avisa sobre plazos y novedades.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "recordatoriosJudiciales", label: "Recordatorios judiciales" },
              { key: "cambiosNormativos", label: "Cambios normativos" },
              { key: "resumenDiario", label: "Resumen diario" },
              { key: "carteraVencida", label: "Alertas de cartera vencida" },
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
            {currentRole === "admin" || currentRole === "superadmin" ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                Este perfil puede revisar usuarios, permisos y automatizaciones de la suite.
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Este perfil trabaja con los modulos operativos asignados por la firma.
              </div>
            )}
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
              Cuando guardes aqui, las alertas y el perfil se actualizan en toda la suite.
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Integracion WhatsApp
            </CardTitle>
            <CardDescription>
              TOCHI lee esta configuracion desde MongoDB para enviar mensajes con Meta Cloud API o usar el enlace de respaldo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingWhatsAppIntegration ? (
              <div className="flex h-[180px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={whatsappIntegration?.configured ? "default" : "outline"}>
                    {whatsappIntegration?.configured ? "Configurado" : "Pendiente"}
                  </Badge>
                  <Badge variant="secondary">Fuente: {whatsappIntegration?.source || "database"}</Badge>
                  <Badge variant="outline">Modo: {whatsappIntegration?.mode || "wa_me"}</Badge>
                  <Badge variant="outline">Webhook: {whatsappIntegration?.hasWebhookToken ? "listo" : "pendiente"}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number ID</label>
                    <Input
                      value={whatsappConfig.phoneNumberId}
                      onChange={(event) => setWhatsAppConfig((current) => ({ ...current, phoneNumberId: event.target.value }))}
                      placeholder="Id del numero de WhatsApp"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Account ID</label>
                    <Input
                      value={whatsappConfig.businessAccountId}
                      onChange={(event) => setWhatsAppConfig((current) => ({ ...current, businessAccountId: event.target.value }))}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Graph Version</label>
                    <Input
                      value={whatsappConfig.graphVersion}
                      onChange={(event) => setWhatsAppConfig((current) => ({ ...current, graphVersion: event.target.value }))}
                      placeholder="v21.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Codigo pais</label>
                    <Input
                      value={whatsappConfig.defaultCountryCode}
                      onChange={(event) => setWhatsAppConfig((current) => ({ ...current, defaultCountryCode: event.target.value }))}
                      placeholder="57"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">URL publica de TOCHI</label>
                    <Input
                      value={whatsappConfig.publicAppUrl}
                      onChange={(event) => setWhatsAppConfig((current) => ({ ...current, publicAppUrl: event.target.value }))}
                      placeholder="https://tu-dominio.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Token</label>
                    <Input
                      type="password"
                      value={whatsappConfig.accessToken}
                      onChange={(event) => setWhatsAppConfig((current) => ({ ...current, accessToken: event.target.value }))}
                      placeholder={whatsappIntegration?.hasAccessToken ? "Guardado en base de datos" : "Pega tu token de Meta"}
                    />
                    <p className="text-xs text-muted-foreground">Deja vacio para conservar el valor guardado.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Webhook Verify Token</label>
                    <Input
                      type="password"
                      value={whatsappConfig.webhookVerifyToken}
                      onChange={(event) => setWhatsAppConfig((current) => ({ ...current, webhookVerifyToken: event.target.value }))}
                      placeholder={whatsappIntegration?.hasWebhookToken ? "Guardado en base de datos" : "Token para Meta y TOCHI"}
                    />
                    <p className="text-xs text-muted-foreground">Deja vacio para conservar el valor guardado.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Integracion activa</p>
                    <p className="text-sm text-muted-foreground">
                      Si la desactivas, TOCHI usa solo el enlace de respaldo de WhatsApp.
                    </p>
                  </div>
                  <Switch
                    checked={whatsappConfig.enabled}
                    onCheckedChange={(checked) =>
                      setWhatsAppConfig((current) => ({
                        ...current,
                        enabled: checked,
                      }))
                    }
                    disabled={!canEditWhatsApp}
                  />
                </div>

                {!canEditWhatsApp ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Solo un administrador puede editar esta integracion. Tu perfil puede revisar el estado, pero no cambiar los secretos.
                  </div>
                ) : null}
              </>
            )}
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
              Guardar configuracion
            </>
          )}
        </Button>
        <Button onClick={handleWhatsAppSave} disabled={savingWhatsApp || isLoadingWhatsAppIntegration || !canEditWhatsApp} className="ml-3">
          {savingWhatsApp ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando WhatsApp...
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Guardar WhatsApp
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
