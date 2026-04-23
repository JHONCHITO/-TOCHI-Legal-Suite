"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Briefcase, DollarSign, TrendingUp, Trophy } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes y Analitica</h1>
        <p className="text-muted-foreground">
          Indicadores de carga, productividad, resultados y salud comercial de la firma.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Casos abiertos</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Casos resueltos</p>
              <p className="text-2xl font-bold">37</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Ingreso trimestral</p>
              <p className="text-2xl font-bold">$43M</p>
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
            <CardDescription>Distribucion operativa y comercial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { area: "Laboral", casos: 8, rentabilidad: "Alta" },
              { area: "Civil", casos: 6, rentabilidad: "Media" },
              { area: "Constitucional", casos: 5, rentabilidad: "Alta" },
              { area: "Comercial", casos: 5, rentabilidad: "Media" },
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
            <CardDescription>Indicadores para crecer la firma de forma controlada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Ticket promedio de honorarios: $2.38M
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Tiempo promedio de respuesta al cliente: 4.2 horas
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Carga por abogado: 12 expedientes por responsable
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
