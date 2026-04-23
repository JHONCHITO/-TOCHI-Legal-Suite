"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, FileText, Wallet } from "lucide-react";

const invoices = [
  { id: "FAC-1021", cliente: "Juan Perez", valor: "$2.400.000", estado: "Pagada" },
  { id: "FAC-1022", cliente: "Empresa ABC S.A.S.", valor: "$5.800.000", estado: "Pendiente" },
  { id: "FAC-1023", cliente: "Maria Garcia", valor: "$1.250.000", estado: "Vencida" },
];

export default function FacturacionPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturacion y Pagos</h1>
          <p className="text-muted-foreground">
            Controla honorarios, cartera, recaudo y documentos de cobro.
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
                <p className="text-2xl font-bold">$15.200.000</p>
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
                <p className="text-2xl font-bold">$6.100.000</p>
              </div>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pagos recibidos</p>
                <p className="text-2xl font-bold">18</p>
              </div>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mora</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas recientes</CardTitle>
          <CardDescription>Estado comercial actual de tus clientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{invoice.id}</p>
                <p className="text-sm text-muted-foreground">{invoice.cliente}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{invoice.valor}</p>
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
