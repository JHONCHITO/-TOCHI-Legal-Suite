"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { KeyRound, Lock, Shield, ShieldCheck, UserCheck } from "lucide-react";

export default function SeguridadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seguridad y Proteccion de Datos</h1>
        <p className="text-muted-foreground">
          Controles minimos para informacion sensible de clientes, casos y documentos legales.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Estado general</p>
              <p className="text-2xl font-bold">Protegido</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Usuarios con acceso</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <KeyRound className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Sesiones activas</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Respaldos</p>
              <p className="text-2xl font-bold">Pendiente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Controles de seguridad</CardTitle>
            <CardDescription>Activa barreras minimas para trabajo con informacion reservada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Autenticacion reforzada",
              "Bloqueo por inactividad",
              "Registro de accesos",
              "Alertas por inicio de sesion",
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
            <CardTitle>Politica sugerida</CardTitle>
            <CardDescription>Checklist para cumplimiento basico dentro de la firma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge>Acceso por roles</Badge>
            <Badge variant="secondary">Confidencialidad de expedientes</Badge>
            <Badge variant="outline">Respaldo cifrado recomendado</Badge>
            <Badge variant="outline">Pendiente: consentimiento y habeas data</Badge>
            <div className="pt-4">
              <Button className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Revisar politica interna
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
