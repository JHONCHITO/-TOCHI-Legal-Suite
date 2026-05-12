"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Search, CheckCircle, XCircle, AlertTriangle, Loader2, ExternalLink, FileText, Upload } from "lucide-react"

interface ResultadoVerificacion {
  tipo: string
  numero: string
  estado: "valido" | "invalido" | "no_encontrado" | "verificando"
  mensaje: string
  detalles?: Record<string, string>
}

export default function VerificadorDocumentosPage() {
  const [tipoDocumento, setTipoDocumento] = useState("cedula")
  const [numeroDocumento, setNumeroDocumento] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null)

  const verificarDocumento = async () => {
    if (!numeroDocumento.trim()) return

    setLoading(true)
    setResultado({ tipo: tipoDocumento, numero: numeroDocumento, estado: "verificando", mensaje: "Verificando..." })

    // Simular verificación
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Resultado simulado
    const esValido = Math.random() > 0.3
    
    setResultado({
      tipo: tipoDocumento,
      numero: numeroDocumento,
      estado: esValido ? "valido" : "invalido",
      mensaje: esValido 
        ? "Documento verificado exitosamente"
        : "No se pudo verificar el documento",
      detalles: esValido ? {
        "Fecha de expedicion": "15/03/2020",
        "Lugar de expedicion": "Bogota D.C.",
        "Estado": "Vigente",
        "Ultima actualizacion": new Date().toLocaleDateString("es-CO")
      } : undefined
    })
    setLoading(false)
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "valido":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "invalido":
        return <XCircle className="h-6 w-6 text-red-500" />
      case "no_encontrado":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case "verificando":
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "valido":
        return <Badge className="bg-green-100 text-green-800">Valido</Badge>
      case "invalido":
        return <Badge className="bg-red-100 text-red-800">No valido</Badge>
      case "no_encontrado":
        return <Badge className="bg-yellow-100 text-yellow-800">No encontrado</Badge>
      case "verificando":
        return <Badge className="bg-blue-100 text-blue-800">Verificando...</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificador de Documentos</h1>
        <p className="text-muted-foreground">
          Verifica la autenticidad de documentos judiciales y de identificacion
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Verificar documento
              </CardTitle>
              <CardDescription>
                Ingresa los datos del documento a verificar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cedula">Cedula de ciudadania</SelectItem>
                    <SelectItem value="nit">NIT Empresa</SelectItem>
                    <SelectItem value="tarjeta_profesional">Tarjeta profesional abogado</SelectItem>
                    <SelectItem value="poder">Poder judicial</SelectItem>
                    <SelectItem value="sentencia">Numero de sentencia</SelectItem>
                    <SelectItem value="radicado">Radicado judicial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {tipoDocumento === "cedula" && "Numero de cedula"}
                  {tipoDocumento === "nit" && "Numero de NIT"}
                  {tipoDocumento === "tarjeta_profesional" && "Numero de tarjeta profesional"}
                  {tipoDocumento === "poder" && "Codigo de verificacion del poder"}
                  {tipoDocumento === "sentencia" && "Numero de sentencia"}
                  {tipoDocumento === "radicado" && "Numero de radicado"}
                </Label>
                <Input
                  placeholder={
                    tipoDocumento === "cedula" ? "Ej: 1020304050" :
                    tipoDocumento === "nit" ? "Ej: 900123456-7" :
                    tipoDocumento === "tarjeta_profesional" ? "Ej: 123456" :
                    tipoDocumento === "poder" ? "Ej: ABC123XYZ" :
                    tipoDocumento === "sentencia" ? "Ej: T-123/2024" :
                    "Ej: 11001310300120240001500"
                  }
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verificarDocumento()}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={verificarDocumento}
                disabled={loading || !numeroDocumento.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Verificar
              </Button>
            </CardContent>
          </Card>

          {resultado && (
            <Card className={
              resultado.estado === "valido" ? "border-green-200 bg-green-50" :
              resultado.estado === "invalido" ? "border-red-200 bg-red-50" :
              resultado.estado === "verificando" ? "border-blue-200 bg-blue-50" :
              "border-yellow-200 bg-yellow-50"
            }>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {getEstadoIcon(resultado.estado)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Resultado</span>
                      {getEstadoBadge(resultado.estado)}
                    </div>
                    <p className="text-sm">{resultado.mensaje}</p>
                    
                    {resultado.detalles && (
                      <div className="mt-4 space-y-2">
                        {Object.entries(resultado.detalles).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enlaces de verificacion oficial</CardTitle>
              <CardDescription>
                Consulta directamente en las fuentes oficiales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a 
                href="https://www.registraduria.gov.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Registraduria Nacional</p>
                    <p className="text-sm text-muted-foreground">Verificar cedulas</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <a 
                href="https://www.rues.org.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">RUES</p>
                    <p className="text-sm text-muted-foreground">Verificar empresas y NIT</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <a 
                href="https://sirna.ramajudicial.gov.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">SIRNA</p>
                    <p className="text-sm text-muted-foreground">Verificar tarjetas profesionales</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <a 
                href="https://consultaprocesos.ramajudicial.gov.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Rama Judicial</p>
                    <p className="text-sm text-muted-foreground">Verificar procesos y sentencias</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <a 
                href="https://www.notinet.com.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Notinet Legal</p>
                    <p className="text-sm text-muted-foreground">Verificar normas vigentes</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Aviso importante</p>
                  <p className="text-amber-700 mt-1">
                    Esta herramienta proporciona verificaciones de referencia. 
                    Para certificaciones oficiales, consulte directamente las entidades correspondientes.
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
