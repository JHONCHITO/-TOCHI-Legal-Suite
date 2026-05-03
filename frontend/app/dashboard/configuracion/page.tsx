"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Shield, UserCog, Bell, Building2, Save } from "lucide-react";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Ajustes de firma, perfil profesional, automatizacion y politicas internas.
        </p>
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
            <Input placeholder="TOCHI Legal Suite" />
            <Input placeholder="Jhon Rique Chito Ruiz" />
            <Input placeholder="Tarjeta profesional / identificacion" />
            <Input placeholder="Correo oficial" />
            <Input placeholder="Telefono principal" />
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Guardar perfil
            </Button>
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
              "Recordar plazos judiciales",
              "Avisar cambios normativos",
              "Enviar resumen diario",
              "Mostrar alertas de cartera vencida",
            ].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{item}</span>
                <Switch defaultChecked={index < 3} />
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
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Administrador", detail: "Control total de la suite" },
              { name: "Abogado", detail: "Casos, clientes y documentos" },
              { name: "Asistente juridico", detail: "Consulta y apoyo documental" },
            ].map((role) => (
              <div key={role.name} className="rounded-lg border p-3">
                <p className="font-medium">{role.name}</p>
                <p className="text-sm text-muted-foreground">{role.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado de proteccion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge>Autenticacion activa</Badge>
            <Badge variant="secondary">MongoDB conectado</Badge>
            <Badge variant="outline">Pendiente: politicas de respaldo</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
