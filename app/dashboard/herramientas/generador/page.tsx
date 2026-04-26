"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Wand2, Copy, Download, Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const tiposDocumento = [
  { value: "tutela", label: "Acción de Tutela" },
  { value: "demanda-civil", label: "Demanda Civil" },
  { value: "demanda-laboral", label: "Demanda Laboral" },
  { value: "derecho-peticion", label: "Derecho de Petición" },
  { value: "contestacion", label: "Contestación de Demanda" },
  { value: "recurso-apelacion", label: "Recurso de Apelación" },
  { value: "recurso-reposicion", label: "Recurso de Reposición" },
  { value: "poder", label: "Poder General/Especial" },
  { value: "contrato-prestacion", label: "Contrato de Prestación de Servicios" },
  { value: "contrato-arrendamiento", label: "Contrato de Arrendamiento" },
  { value: "memorial", label: "Memorial" },
  { value: "incidente-desacato", label: "Incidente de Desacato" },
]

export default function GeneradorDocumentosPage() {
  const [tipoDocumento, setTipoDocumento] = useState("")
  const [datosBasicos, setDatosBasicos] = useState({
    demandante: "",
    demandado: "",
    hechos: "",
    pretensiones: "",
    fundamentos: "",
    derechoVulnerado: "",
    ciudad: "",
    juzgado: "",
  })
  const [documentoGenerado, setDocumentoGenerado] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleGenerar = async () => {
    if (!tipoDocumento) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de documento",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoDocumento,
          datos: datosBasicos,
        }),
      })

      if (!response.ok) throw new Error("Error al generar documento")

      const data = await response.json()
      setDocumentoGenerado(data.documento)
      toast({
        title: "Documento generado",
        description: "El documento ha sido generado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el documento. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopiar = () => {
    navigator.clipboard.writeText(documentoGenerado)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copiado",
      description: "Documento copiado al portapapeles",
    })
  }

  const handleDescargar = () => {
    const blob = new Blob([documentoGenerado], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${tipoDocumento}-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generador de Documentos con IA</h1>
        <p className="text-muted-foreground">
          Genera documentos legales profesionales con ayuda de inteligencia artificial
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Datos del Documento
            </CardTitle>
            <CardDescription>
              Completa la información necesaria para generar el documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="partes" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="partes">Partes</TabsTrigger>
                <TabsTrigger value="hechos">Hechos</TabsTrigger>
                <TabsTrigger value="juridico">Jurídico</TabsTrigger>
              </TabsList>

              <TabsContent value="partes" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Demandante / Accionante</Label>
                  <Input
                    placeholder="Nombre completo e identificación"
                    value={datosBasicos.demandante}
                    onChange={(e) => setDatosBasicos({ ...datosBasicos, demandante: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Demandado / Accionado</Label>
                  <Input
                    placeholder="Nombre o razón social"
                    value={datosBasicos.demandado}
                    onChange={(e) => setDatosBasicos({ ...datosBasicos, demandado: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input
                      placeholder="Ciudad de presentación"
                      value={datosBasicos.ciudad}
                      onChange={(e) => setDatosBasicos({ ...datosBasicos, ciudad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Juzgado (opcional)</Label>
                    <Input
                      placeholder="Juzgado específico"
                      value={datosBasicos.juzgado}
                      onChange={(e) => setDatosBasicos({ ...datosBasicos, juzgado: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hechos" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Hechos</Label>
                  <Textarea
                    placeholder="Describe los hechos relevantes del caso..."
                    className="min-h-[200px]"
                    value={datosBasicos.hechos}
                    onChange={(e) => setDatosBasicos({ ...datosBasicos, hechos: e.target.value })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="juridico" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Pretensiones</Label>
                  <Textarea
                    placeholder="Lista las pretensiones o solicitudes..."
                    className="min-h-[100px]"
                    value={datosBasicos.pretensiones}
                    onChange={(e) => setDatosBasicos({ ...datosBasicos, pretensiones: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fundamentos de Derecho</Label>
                  <Textarea
                    placeholder="Artículos, leyes o jurisprudencia aplicable..."
                    className="min-h-[100px]"
                    value={datosBasicos.fundamentos}
                    onChange={(e) => setDatosBasicos({ ...datosBasicos, fundamentos: e.target.value })}
                  />
                </div>
                {(tipoDocumento === "tutela" || tipoDocumento === "incidente-desacato") && (
                  <div className="space-y-2">
                    <Label>Derecho Fundamental Vulnerado</Label>
                    <Input
                      placeholder="Ej: Derecho a la salud, debido proceso..."
                      value={datosBasicos.derechoVulnerado}
                      onChange={(e) => setDatosBasicos({ ...datosBasicos, derechoVulnerado: e.target.value })}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Button onClick={handleGenerar} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando documento...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar Documento con IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documento Generado</CardTitle>
                <CardDescription>
                  Revisa y edita el documento antes de usarlo
                </CardDescription>
              </div>
              {documentoGenerado && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopiar}>
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDescargar}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="El documento generado aparecerá aquí..."
              className="min-h-[500px] font-mono text-sm"
              value={documentoGenerado}
              onChange={(e) => setDocumentoGenerado(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
