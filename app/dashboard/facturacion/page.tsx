"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, FileText, Wallet } from "lucide-react";
import { demoInvoices, getClientById, getClientDisplayName, formatCurrencyCop } from "@/lib/demo-data";

export default function FacturacionPage() {
  const totalFacturado = demoInvoices.reduce((sum, item) => sum + item.valor, 0);
  const totalPendiente = demoInvoices
    .filter((item) => item.estado !== "Pagada")
    .reduce((sum, item) => sum + item.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturacion y Pagos</h1>
          <p className="text-muted-foreground">
            Honorarios, recaudo, cartera y control financiero por cliente y expediente.
          </p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Nueva factura
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Facturado</p>
                <p className="text-2xl font-bold">{formatCurrencyCop(totalFacturado)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendiente por cobrar</p>
                <p className="text-2xl font-bold">{formatCurrencyCop(totalPendiente)}</p>
              </div>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pagadas</p>
                <p className="text-2xl font-bold">
                  {demoInvoices.filter((item) => item.estado === "Pagada").length}
                </p>
              </div>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold">
                  {demoInvoices.filter((item) => item.estado === "Vencida").length}
                </p>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas recientes</CardTitle>
          <CardDescription>Estado comercial actual de la firma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoInvoices.map((invoice) => {
            const client = getClientById(invoice.clienteId);
            return (
              <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{invoice.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {client ? getClientDisplayName(client) : "Cliente"} - {invoice.concepto}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrencyCop(invoice.valor)}</p>
                  <Badge
                    variant={
                      invoice.estado === "Pagada"
                        ? "default"
                        : invoice.estado === "Pendiente"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {invoice.estado}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
