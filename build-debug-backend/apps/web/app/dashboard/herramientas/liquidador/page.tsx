"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calculator, Plus, Trash2, Download, FileText } from "lucide-react"

interface ConceptoCosta {
  id: string
  descripcion: string
  valor: number
  cantidad: number
}

// Valor SMLMV 2024-2026
const SMLMV = {
  2024: 1300000,
  2025: 1423500,
  2026: 1540000
}

// Tarifas de agencias en derecho según cuantía
const tarifasAgencias = [
  { min: 0, max: 10, porcentaje: 15 },
  { min: 10, max: 50, porcentaje: 12 },
  { min: 50, max: 100, porcentaje: 10 },
  { min: 100, max: 500, porcentaje: 8 },
  { min: 500, max: 1000, porcentaje: 6 },
  { min: 1000, max: Infinity, porcentaje: 5 },
]

export default function LiquidadorCostasPage() {
  const [year, setYear] = useState<keyof typeof SMLMV>(2026)
  const [tipoProceso, setTipoProceso] = useState("declarativo")
  const [cuantia, setCuantia] = useState<number>(0)
  const [conceptos, setConceptos] = useState<ConceptoCosta[]>([
    { id: "1", descripcion: "Presentacion de demanda", valor: 0, cantidad: 1 },
    { id: "2", descripcion: "Notificaciones", valor: 50000, cantidad: 2 },
    { id: "3", descripcion: "Copias y desgloses", valor: 25000, cantidad: 1 },
  ])
  const [incluirAgencias, setIncluirAgencias] = useState(true)
  const [incluirIVA, setIncluirIVA] = useState(false)

  const smlmvActual = SMLMV[year]
  const cuantiaSMLMV = cuantia / smlmvActual

  const calcularAgencias = () => {
    if (!incluirAgencias || cuantia === 0) return 0
    const tarifa = tarifasAgencias.find(t => cuantiaSMLMV >= t.min && cuantiaSMLMV < t.max)
    if (!tarifa) return 0
    return cuantia * (tarifa.porcentaje / 100)
  }

  const agregarConcepto = () => {
    const nuevo: ConceptoCosta = {
      id: Date.now().toString(),
      descripcion: "",
      valor: 0,
      cantidad: 1
    }
    setConceptos([...conceptos, nuevo])
  }

  const actualizarConcepto = (id: string, campo: keyof ConceptoCosta, valor: string | number) => {
    setConceptos(conceptos.map(c => 
      c.id === id ? { ...c, [campo]: valor } : c
    ))
  }

  const eliminarConcepto = (id: string) => {
    setConceptos(conceptos.filter(c => c.id !== id))
  }

  const subtotalConceptos = conceptos.reduce((acc, c) => acc + (c.valor * c.cantidad), 0)
  const agenciasEnDerecho = calcularAgencias()
  const subtotal = subtotalConceptos + agenciasEnDerecho
  const iva = incluirIVA ? subtotal * 0.19 : 0
  const total = subtotal + iva

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const generarPDF = () => {
    const content = `
LIQUIDACION DE COSTAS PROCESALES
================================

Fecha: ${new Date().toLocaleDateString("es-CO")}
Tipo de proceso: ${tipoProceso}
Cuantía: ${formatCurrency(cuantia)}
SMLMV ${year}: ${formatCurrency(smlmvActual)}

CONCEPTOS:
${conceptos.map(c => `- ${c.descripcion}: ${formatCurrency(c.valor)} x ${c.cantidad} = ${formatCurrency(c.valor * c.cantidad)}`).join("\n")}

Subtotal conceptos: ${formatCurrency(subtotalConceptos)}
${incluirAgencias ? `Agencias en derecho (${(tarifasAgencias.find(t => cuantiaSMLMV >= t.min && cuantiaSMLMV < t.max)?.porcentaje || 0)}%): ${formatCurrency(agenciasEnDerecho)}` : ""}
${incluirIVA ? `IVA (19%): ${formatCurrency(iva)}` : ""}

TOTAL LIQUIDACION: ${formatCurrency(total)}
    `
    
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `liquidacion-costas-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Liquidador de Costas</h1>
        <p className="text-muted-foreground">
          Calcula costas procesales y agencias en derecho segun la normativa colombiana
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos del proceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Año de referencia</Label>
                  <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v) as keyof typeof SMLMV)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    SMLMV: {formatCurrency(smlmvActual)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de proceso</Label>
                  <Select value={tipoProceso} onValueChange={setTipoProceso}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="declarativo">Declarativo</SelectItem>
                      <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
                      <SelectItem value="verbal">Verbal</SelectItem>
                      <SelectItem value="verbal_sumario">Verbal sumario</SelectItem>
                      <SelectItem value="laboral">Laboral ordinario</SelectItem>
                      <SelectItem value="familia">Familia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cuantia del proceso (COP)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cuantia || ""}
                    onChange={(e) => setCuantia(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {cuantiaSMLMV.toFixed(2)} SMLMV
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conceptos de costas</CardTitle>
                <Button size="sm" onClick={agregarConcepto}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conceptos.map((concepto) => (
                  <div key={concepto.id} className="flex items-center gap-3">
                    <Input
                      placeholder="Descripcion"
                      className="flex-1"
                      value={concepto.descripcion}
                      onChange={(e) => actualizarConcepto(concepto.id, "descripcion", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Valor"
                      className="w-32"
                      value={concepto.valor || ""}
                      onChange={(e) => actualizarConcepto(concepto.id, "valor", parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      placeholder="Cant"
                      className="w-20"
                      min={1}
                      value={concepto.cantidad}
                      onChange={(e) => actualizarConcepto(concepto.id, "cantidad", parseInt(e.target.value) || 1)}
                    />
                    <div className="w-28 text-right font-medium">
                      {formatCurrency(concepto.valor * concepto.cantidad)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarConcepto(concepto.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agencias"
                    checked={incluirAgencias}
                    onCheckedChange={(c) => setIncluirAgencias(c as boolean)}
                  />
                  <label htmlFor="agencias" className="text-sm">
                    Incluir agencias en derecho
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="iva"
                    checked={incluirIVA}
                    onCheckedChange={(c) => setIncluirIVA(c as boolean)}
                  />
                  <label htmlFor="iva" className="text-sm">
                    Incluir IVA (19%)
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Liquidacion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal conceptos:</span>
                  <span>{formatCurrency(subtotalConceptos)}</span>
                </div>
                {incluirAgencias && (
                  <div className="flex justify-between text-sm">
                    <span>Agencias en derecho:</span>
                    <span>{formatCurrency(agenciasEnDerecho)}</span>
                  </div>
                )}
                {incluirIVA && (
                  <div className="flex justify-between text-sm">
                    <span>IVA (19%):</span>
                    <span>{formatCurrency(iva)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button className="w-full" onClick={generarPDF}>
                <Download className="h-4 w-4 mr-2" />
                Descargar liquidacion
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Tabla de agencias</CardTitle>
              <CardDescription>
                Porcentajes segun cuantia del proceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {tarifasAgencias.map((t, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {t.max === Infinity 
                        ? `Mas de ${t.min} SMLMV`
                        : `${t.min} - ${t.max} SMLMV`
                      }
                    </span>
                    <span className="font-medium">{t.porcentaje}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Base legal</p>
                  <p className="text-blue-700 mt-1">
                    Articulos 361-366 CGP, Decreto 1542 de 1999, Acuerdo PSAA11-8716 CSJ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
