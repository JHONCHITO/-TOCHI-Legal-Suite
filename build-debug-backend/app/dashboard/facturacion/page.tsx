"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CreditCard,
  DollarSign,
  FileText,
  Wallet,
  Plus,
  Loader2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react"
import { useInvoices, useClients, useCases } from "@/lib/hooks/use-data"
import { useToast } from "@/hooks/use-toast"

type FacturaItem = {
  descripcion: string
  cantidad: number
  valorUnitario: number
  subtotal: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value)
}

export default function FacturacionPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { invoices, isLoading, mutate } = useInvoices()
  const { clients } = useClients()
  const { cases } = useCases()
  const { toast } = useToast()

  const [nuevaFactura, setNuevaFactura] = useState({
    numero: "",
    clienteId: "",
    casoId: "",
    concepto: "",
    items: [{ descripcion: "", cantidad: 1, valorUnitario: 0, subtotal: 0 }] as FacturaItem[],
    subtotal: 0,
    iva: 0,
    total: 0,
    estado: "pendiente",
    fechaVencimiento: "",
    notas: "",
  })

  const calcularTotales = (items: FacturaItem[]) => {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.cantidad || 0) * Number(item.valorUnitario || 0),
      0
    )
    const iva = Math.round(subtotal * 0.19)
    const total = subtotal + iva
    return { subtotal, iva, total }
  }

  const handleItemChange = (index: number, field: keyof FacturaItem, value: string | number) => {
    const newItems = [...nuevaFactura.items]
    const updatedItem = { ...newItems[index], [field]: value } as FacturaItem
    updatedItem.subtotal =
      Number(updatedItem.cantidad || 0) * Number(updatedItem.valorUnitario || 0)
    newItems[index] = updatedItem
    const totales = calcularTotales(newItems)
    setNuevaFactura({ ...nuevaFactura, items: newItems, ...totales })
  }

  const addItem = () => {
    setNuevaFactura({
      ...nuevaFactura,
      items: [...nuevaFactura.items, { descripcion: "", cantidad: 1, valorUnitario: 0, subtotal: 0 }],
    })
  }

  const removeItem = (index: number) => {
    const newItems = nuevaFactura.items.filter((_, i) => i !== index)
    const totales = calcularTotales(newItems)
    setNuevaFactura({ ...nuevaFactura, items: newItems, ...totales })
  }

  const handleCrearFactura = async () => {
    if (!nuevaFactura.clienteId || nuevaFactura.items.length === 0) {
      toast({
        title: "Error",
        description: "Seleccione un cliente y agregue al menos un item",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const items = nuevaFactura.items.map((item) => ({
        ...item,
        cantidad: Number(item.cantidad || 0),
        valorUnitario: Number(item.valorUnitario || 0),
        subtotal: Number(item.cantidad || 0) * Number(item.valorUnitario || 0),
      }))
      const totales = calcularTotales(items)
      const facturaData = {
        ...nuevaFactura,
        numero: nuevaFactura.numero.trim(),
        fecha: new Date().toISOString(),
        items,
        subtotal: totales.subtotal,
        iva: totales.iva,
        total: totales.total,
        impuestos: totales.iva,
        descuento: 0,
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facturaData),
      })

      if (!response.ok) throw new Error("Error al crear factura")

      toast({
        title: "Factura creada",
        description: "La factura se ha guardado correctamente",
      })
      setDialogOpen(false)
      setNuevaFactura({
        numero: "",
        clienteId: "",
        casoId: "",
        concepto: "",
        items: [{ descripcion: "", cantidad: 1, valorUnitario: 0, subtotal: 0 }],
        subtotal: 0,
        iva: 0,
        total: 0,
        estado: "pendiente",
        fechaVencimiento: "",
        notas: "",
      })
      mutate()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la factura",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (!response.ok) throw new Error("Error al actualizar")

      toast({
        title: "Estado actualizado",
        description: `Factura marcada como ${nuevoEstado}`,
      })
      mutate()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("Esta seguro de eliminar esta factura?")) return

    try {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Error al eliminar")

      toast({
        title: "Factura eliminada",
        description: "La factura se ha eliminado correctamente",
      })
      mutate()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la factura",
        variant: "destructive",
      })
    }
  }

  const getClientName = (clienteId: string | Record<string, unknown>) => {
    if (!clienteId) return "Sin cliente"

    if (typeof clienteId === "object") {
      const client = clienteId as { tipo?: string; nombre?: string; apellido?: string; razonSocial?: string }
      return client.tipo === "persona_juridica"
        ? client.razonSocial || "Sin cliente"
        : `${client.nombre || ""} ${client.apellido || ""}`.trim() || "Sin cliente"
    }

    const client = clients?.find((c: any) => c._id === clienteId)
    if (!client) return "Sin cliente"
    return client.tipo === "persona_natural"
      ? `${client.nombre || ""} ${client.apellido || ""}`.trim()
      : client.razonSocial || "Sin cliente"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const invoicesList = invoices || []
  const totalFacturado = invoicesList.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
  const totalPendiente = invoicesList
    .filter((inv: any) => inv.estado === "pendiente")
    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
  const facturasPagadas = invoicesList.filter((inv: any) => inv.estado === "pagada").length
  const facturasVencidas = invoicesList.filter((inv: any) => inv.estado === "vencida").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturacion y Pagos</h1>
          <p className="text-muted-foreground">
            Honorarios, recaudo, cartera y control financiero por cliente y expediente.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Factura</DialogTitle>
              <DialogDescription>
                Complete la informacion de la factura
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numero de Factura</Label>
                  <Input
                    placeholder="Auto-generado si se deja vacio"
                    value={nuevaFactura.numero}
                    onChange={(e) => setNuevaFactura({ ...nuevaFactura, numero: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Vencimiento</Label>
                  <Input
                    type="date"
                    value={nuevaFactura.fechaVencimiento}
                    onChange={(e) => setNuevaFactura({ ...nuevaFactura, fechaVencimiento: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={nuevaFactura.clienteId}
                    onValueChange={(v) => setNuevaFactura({ ...nuevaFactura, clienteId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client: any) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.tipo === "persona_natural"
                            ? `${client.nombre || ""} ${client.apellido || ""}`
                            : client.razonSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Caso Relacionado</Label>
                  <Select
                    value={nuevaFactura.casoId}
                    onValueChange={(v) => setNuevaFactura({ ...nuevaFactura, casoId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar caso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases?.map((caso: any) => (
                        <SelectItem key={caso._id} value={caso._id}>
                          {caso.numeroInterno} - {caso.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Concepto General</Label>
                <Input
                  placeholder="Ej: Honorarios profesionales caso laboral"
                  value={nuevaFactura.concepto}
                  onChange={(e) => setNuevaFactura({ ...nuevaFactura, concepto: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items de la Factura</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar item
                  </Button>
                </div>
                <div className="space-y-2">
                  {nuevaFactura.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder="Descripcion"
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(index, "descripcion", e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Cant."
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, "cantidad", Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Valor"
                          value={item.valorUnitario}
                          onChange={(e) => handleItemChange(index, "valorUnitario", Number(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={nuevaFactura.items.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(nuevaFactura.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(nuevaFactura.iva)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(nuevaFactura.total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas adicionales</Label>
                <Textarea
                  placeholder="Notas o condiciones de pago..."
                  value={nuevaFactura.notas}
                  onChange={(e) => setNuevaFactura({ ...nuevaFactura, notas: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearFactura} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Crear Factura"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Facturado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalFacturado)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendiente por Cobrar</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPendiente)}</p>
              </div>
              <Wallet className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Facturas Pagadas</p>
                <p className="text-2xl font-bold">{facturasPagadas}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Facturas Vencidas</p>
                <p className="text-2xl font-bold">{facturasVencidas}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Facturas</CardTitle>
          <CardDescription>Gestione sus facturas y controle el estado de pagos</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay facturas registradas</p>
              <p className="text-sm">Cree su primera factura para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesList.map((invoice: any) => (
                  <TableRow key={invoice._id}>
                    <TableCell className="font-medium">{invoice.numero}</TableCell>
                    <TableCell>{getClientName(invoice.clienteId)}</TableCell>
                    <TableCell>{invoice.concepto || "-"}</TableCell>
                    <TableCell>
                      {new Date(invoice.fecha || invoice.createdAt).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.estado === "pagada"
                            ? "default"
                            : invoice.estado === "pendiente"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {invoice.estado === "pagada" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {invoice.estado === "pendiente" && <Clock className="h-3 w-3 mr-1" />}
                        {invoice.estado === "vencida" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {invoice.estado?.charAt(0).toUpperCase() + invoice.estado?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {invoice.estado === "pendiente" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCambiarEstado(invoice._id, "pagada")}
                            title="Marcar como pagada"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(invoice._id)}
                          title="Eliminar factura"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
