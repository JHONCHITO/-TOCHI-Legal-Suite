"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, Save, UserRound } from "lucide-react";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h1>
          <p className="text-muted-foreground">
            Crea una ficha CRM legal con datos de contacto, identificacion, origen y notas internas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/clientes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a clientes
            </Link>
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Guardar cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ficha de cliente</CardTitle>
          <CardDescription>Persona natural o juridica con datos base para expedientes y facturacion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de cliente</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                <option>Persona natural</option>
                <option>Persona juridica</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Documento / NIT</label>
              <Input placeholder="1020304050" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre o razon social</label>
              <Input placeholder="Jhon Chito Ruiz" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciudad</label>
              <Input placeholder="Bogota" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo</label>
              <Input placeholder="cliente@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefono</label>
              <Input placeholder="3001234567" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Direccion</label>
            <Input placeholder="Carrera 10 # 20 - 30" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notas internas</label>
            <Textarea rows={5} placeholder="Fuente del cliente, sensibilidad del caso, condiciones comerciales y preferencias de contacto." />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <UserRound className="h-4 w-4 text-primary" />
            Vinculacion directa con casos y documentos
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            Preparado para correos y seguimiento
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <Phone className="h-4 w-4 text-primary" />
            Compatible con comunicacion y recordatorios
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
