"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Briefcase, DollarSign, TrendingUp, Trophy } from "lucide-react";
import { useAppointments, useCases, useInvoices } from "@/lib/hooks/use-data";
import { caseTypeLabels, formatCurrencyCop } from "@/lib/utils/format";

export default function ReportesPage() {
  const { cases, isLoading: loadingCases } = useCases();
  const { invoices, isLoading: loadingInvoices } = useInvoices();
  const { appointments, isLoading: loadingAppointments } = useAppointments();

  const caseItems = cases as Array<{ estado?: string; tipo?: string; area?: string }>;
  const invoiceItems = invoices as Array<{ total?: number; valor?: number; saldoPendiente?: number }>;
  const appointmentItems = appointments as Array<{ estado?: string }>;

  const isLoading = loadingCases || loadingInvoices || loadingAppointments;

  const facturado = useMemo(
    () => invoiceItems.reduce((sum: number, item) => sum + Number(item.total ?? item.valor ?? 0), 0),
    [invoiceItems]
  );

  const carteraPendiente = useMemo(
    () =>
      invoiceItems.reduce((sum: number, item) => sum + Number(item.saldoPendiente ?? item.total ?? item.valor ?? 0), 0),
    [invoiceItems]
  );

  const activeCases = useMemo(
    () => caseItems.filter((item) => item.estado === "activo").length,
    [caseItems]
  );

  const cumplimiento = useMemo(() => {
    if (appointmentItems.length === 0) return 100;
    const completadas = appointmentItems.filter(
      (item) => item.estado === "completada" || item.estado === "confirmada"
    ).length;
    return Math.round((completadas / appointmentItems.length) * 100);
  }, [appointmentItems]);

  const areas = useMemo(() => {
    const counts = caseItems.reduce<Record<string, number>>((acc, item) => {
      const key = item.tipo || item.area || "otro";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([key, casos]) => {
        const count = Number(casos);
        return {
          area: caseTypeLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
          casos: count,
          rentabilidad: count >= 5 ? "Alta" : count >= 2 ? "Media" : "Baja",
        };
      })
      .sort((a, b) => b.casos - a.casos)
      .slice(0, 4);
  }, [caseItems]);

  const ticketPromedio = invoiceItems.length > 0 ? facturado / invoiceItems.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes y Analitica</h1>
        <p className="text-muted-foreground">
          Indicadores reales para controlar carga operativa, resultados, plazos y salud comercial.
        </p>
        {isLoading ? <p className="mt-2 text-sm text-muted-foreground">Cargando indicadores...</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Casos abiertos</p>
              <p className="text-2xl font-bold">{caseItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Casos activos</p>
              <p className="text-2xl font-bold">{activeCases}</p>
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
              <p className="text-2xl font-bold">{cumplimiento}%</p>
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
            {areas.length === 0 ? (
              <p className="rounded-lg border p-4 text-sm text-muted-foreground">Aun no hay casos cargados.</p>
            ) : (
              areas.map((item) => (
                <div key={item.area} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{item.area}</p>
                    <p className="text-sm text-muted-foreground">{item.casos} casos</p>
                  </div>
                  <Badge>{item.rentabilidad}</Badge>
                </div>
              ))
            )}
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
              Ticket promedio de honorarios: {formatCurrencyCop(ticketPromedio)}
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Carga por abogado: {caseItems.length} expedientes en seguimiento
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Cartera pendiente: {formatCurrencyCop(carteraPendiente)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
