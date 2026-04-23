"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Briefcase, Calendar, FileText, Save, Users } from "lucide-react";

export default function NuevoCasoPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Caso</h1>
          <p className="text-muted-foreground">
            Abre un expediente con datos del cliente, tipo de proceso, plazos y estrategia inicial.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/casos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a casos
            </Link>
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Guardar borrador
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha del expediente</CardTitle>
            <CardDescription>Base operativa para procesos civiles, laborales, penales o administrativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Numero interno</label>
                <Input placeholder="TOCHI-2026-00025" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de caso</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option>Civil</option>
                  <option>Laboral</option>
                  <option>Penal</option>
                  <option>Familia</option>
                  <option>Administrativo</option>
                  <option>Constitucional</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Titulo del caso</label>
              <Input placeholder="Ej: Demanda laboral por despido injustificado" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente principal</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option>Juan Perez</option>
                  <option>Maria Garcia</option>
                  <option>Empresa ABC S.A.S.</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado inicial</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option>Activo</option>
                  <option>Consulta</option>
                  <option>En tramite</option>
                  <option>Audiencia pendiente</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Juzgado / entidad</label>
                <Input placeholder="Juzgado 5 Civil Municipal de Bogota" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Numero de proceso</label>
                <Input placeholder="11001-31-03-005-2026-00025-00" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha proxima actuacion</label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsable</label>
                <Input placeholder="Dr. Jhon Chito Ruiz" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hechos relevantes</label>
              <Textarea
                rows={5}
                placeholder="Resume el conflicto, la pretension principal, pruebas iniciales y riesgos del asunto."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estrategia juridica</label>
              <Textarea
                rows={4}
                placeholder="Indica normas de apoyo, pruebas pendientes, plazos criticos y accion inmediata."
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Checklist operativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Users className="h-4 w-4 text-primary" />
                Vincular cliente y contraparte
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Calendar className="h-4 w-4 text-primary" />
                Crear plazo y audiencia inicial
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <FileText className="h-4 w-4 text-primary" />
                Cargar documentos base
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Briefcase className="h-4 w-4 text-primary" />
                Definir estrategia y honorarios
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integraciones sugeridas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {["Rama Judicial", "Alertas", "Facturacion", "Documentos IA", "WhatsApp"].map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
