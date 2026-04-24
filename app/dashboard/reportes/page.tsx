"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Briefcase, DollarSign, TrendingUp, Trophy } from "lucide-react";
import { demoCases, demoInvoices, formatCurrencyCop } from "@/lib/demo-data";

export default function ReportesPage() {
  const facturado = demoInvoices.reduce((sum, item) => sum + item.valor, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes y Analitica</h1>
        <p className="text-muted-foreground">
          Indicadores para controlar carga operativa, resultados, plazos y salud comercial.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Casos abiertos</p>
              <p className="text-2xl font-bold">{demoCases.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Casos activos</p>
              <p className="text-2xl font-bold">
                {demoCases.filter((item) => item.estado === "activo").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Ingreso visible</p>
              <p className="text-2xl font-bold">{formatCurrencyCop(facturado)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Cumplimiento de plazos</p>
              <p className="text-2xl font-bold">96%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por area</CardTitle>
            <CardDescription>Distribucion operativa actual del despacho.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { area: "Laboral", casos: demoCases.filter((item) => item.tipo === "laboral").length, rentabilidad: "Alta" },
              { area: "Comercial", casos: demoCases.filter((item) => item.tipo === "comercial").length, rentabilidad: "Alta" },
              { area: "Constitucional", casos: demoCases.filter((item) => item.tipo === "constitucional").length, rentabilidad: "Media" },
              { area: "Familia", casos: demoCases.filter((item) => item.tipo === "familia").length, rentabilidad: "Media" },
            ].map((item) => (
              <div key={item.area} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{item.area}</p>
                  <p className="text-sm text-muted-foreground">{item.casos} casos</p>
                </div>
                <Badge>{item.rentabilidad}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analitica ejecutiva</CardTitle>
            <CardDescription>Indicadores de gestion para crecer la firma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Ticket promedio de honorarios: {formatCurrencyCop(facturado / demoInvoices.length)}
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Carga por abogado: {demoCases.length} expedientes en seguimiento
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Cartera pendiente: {
                formatCurrencyCop(
                  demoInvoices.filter((item) => item.estado !== "Pagada").reduce((sum, item) => sum + item.valor, 0)
                )
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
