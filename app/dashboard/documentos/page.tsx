"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Plus,
  Search,
  Download,
  Copy,
  Eye,
  Folder,
  FileSignature,
  FileCheck,
  FileClock,
  Sparkles,
} from "lucide-react"

const plantillas = [
  {
    id: "1",
    nombre: "Demanda Civil Ordinaria",
    categoria: "Civil",
    descripcion: "Plantilla para demanda civil de proceso ordinario",
    campos: ["demandante", "demandado", "hechos", "pretensiones", "fundamentos"],
  },
  {
    id: "2",
    nombre: "Contestacion de Demanda",
    categoria: "Civil",
    descripcion: "Plantilla para contestar demanda civil",
    campos: ["demandado", "excepciones", "hechos", "pruebas"],
  },
  {
    id: "3",
    nombre: "Tutela",
    categoria: "Constitucional",
    descripcion: "Accion de tutela para proteccion de derechos fundamentales",
    campos: ["accionante", "accionado", "derechos_vulnerados", "hechos", "pretensiones"],
  },
  {
    id: "4",
    nombre: "Poder General",
    categoria: "General",
    descripcion: "Poder general para representacion judicial",
    campos: ["poderdante", "apoderado", "facultades"],
  },
  {
    id: "5",
    nombre: "Demanda Laboral",
    categoria: "Laboral",
    descripcion: "Demanda ordinaria laboral de primera instancia",
    campos: ["trabajador", "empleador", "salario", "hechos", "pretensiones"],
  },
  {
    id: "6",
    nombre: "Contrato de Prestacion de Servicios",
    categoria: "Comercial",
    descripcion: "Contrato de servicios profesionales",
    campos: ["contratante", "contratista", "objeto", "valor", "plazo"],
  },
  {
    id: "7",
    nombre: "Recurso de Apelacion",
    categoria: "Procesal",
    descripcion: "Recurso de apelacion contra sentencia",
    campos: ["apelante", "providencia", "fundamentos", "pretension"],
  },
  {
    id: "8",
    nombre: "Derecho de Peticion",
    categoria: "Administrativo",
    descripcion: "Derecho de peticion ante entidades publicas",
    campos: ["peticionario", "entidad", "objeto", "fundamentos"],
  },
]

const documentosRecientes = [
  {
    id: "1",
    nombre: "Demanda_Martinez_2024.docx",
    caso: "Caso Martinez vs. ABC S.A.S",
    fecha: "2024-01-15",
    estado: "finalizado",
  },
  {
    id: "2",
    nombre: "Tutela_Derechos_Salud.docx",
    caso: "Tutela EPS Sanitas",
    fecha: "2024-01-14",
    estado: "borrador",
  },
  {
    id: "3",
    nombre: "Contestacion_Proceso_123.docx",
    caso: "Proceso 2024-00123",
    fecha: "2024-01-12",
    estado: "revision",
  },
]

const categoriaColores: Record<string, string> = {
  Civil: "bg-blue-100 text-blue-800",
  Constitucional: "bg-purple-100 text-purple-800",
  General: "bg-gray-100 text-gray-800",
  Laboral: "bg-green-100 text-green-800",
  Comercial: "bg-amber-100 text-amber-800",
  Procesal: "bg-red-100 text-red-800",
  Administrativo: "bg-cyan-100 text-cyan-800",
}

const estadoIconos: Record<string, React.ReactNode> = {
  finalizado: <FileCheck className="h-4 w-4 text-green-500" />,
  borrador: <FileClock className="h-4 w-4 text-amber-500" />,
  revision: <FileSignature className="h-4 w-4 text-blue-500" />,
}

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlantilla, setSelectedPlantilla] = useState<(typeof plantillas)[0] | null>(null)
  const [generatingWithAI, setGeneratingWithAI] = useState(false)

  const filteredPlantillas = plantillas.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos y Plantillas</h1>
          <p className="text-muted-foreground">Genera documentos legales con ayuda de IA</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Subir Documento
        </Button>
      </div>

      <Tabs defaultValue="plantillas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="recientes">Documentos Recientes</TabsTrigger>
          <TabsTrigger value="generador">Generador IA</TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlantillas.map((plantilla) => (
              <Card key={plantilla.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <Badge className={categoriaColores[plantilla.categoria]}>{plantilla.categoria}</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                  <CardDescription>{plantilla.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedPlantilla(plantilla)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{plantilla.nombre}</DialogTitle>
                          <DialogDescription>{plantilla.descripcion}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">Campos requeridos:</p>
                          <div className="flex flex-wrap gap-2">
                            {plantilla.campos.map((campo) => (
                              <Badge key={campo} variant="outline">
                                {campo.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button className="flex-1 gap-2">
                              <Copy className="h-4 w-4" />
                              Usar Plantilla
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <Sparkles className="h-4 w-4" />
                              Generar con IA
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Documentos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documentosRecientes.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {estadoIconos[doc.estado]}
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-sm text-muted-foreground">{doc.caso}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{doc.fecha}</span>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generador" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generador de Documentos con IA
              </CardTitle>
              <CardDescription>
                Describe el documento que necesitas y la IA lo generara automaticamente basandose en los codigos colombianos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Documento</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option value="">Seleccionar tipo...</option>
                  <option value="demanda">Demanda</option>
                  <option value="contestacion">Contestacion de Demanda</option>
                  <option value="tutela">Accion de Tutela</option>
                  <option value="recurso">Recurso</option>
                  <option value="contrato">Contrato</option>
                  <option value="poder">Poder</option>
                  <option value="derecho_peticion">Derecho de Peticion</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe la situacion</label>
                <Textarea
                  placeholder="Ej: Necesito una demanda laboral para un cliente que fue despedido sin justa causa despues de 5 anos de trabajo. El empleador es una empresa de construccion y el salario era de 2 millones de pesos..."
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Caso Relacionado (opcional)</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option value="">Ninguno</option>
                  <option value="1">Caso Martinez vs. ABC S.A.S</option>
                  <option value="2">Tutela EPS Sanitas</option>
                </select>
              </div>
              <Button className="w-full gap-2" disabled={generatingWithAI}>
                <Sparkles className="h-4 w-4" />
                {generatingWithAI ? "Generando documento..." : "Generar Documento con IA"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
