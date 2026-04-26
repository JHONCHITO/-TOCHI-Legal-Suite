"use client"

import { useMemo, useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  Eye,
  FileCheck,
  FileClock,
  FileSignature,
  FileText,
  Folder,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Loader2,
  Upload,
} from "lucide-react"
import { useDocuments, useCases, useClients } from "@/lib/hooks/use-data"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const categoriaColores: Record<string, string> = {
  Laboral: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Constitucional: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Civil: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Administrativo: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  Penal: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Familia: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
}

const estadoIconos: Record<string, React.ReactNode> = {
  finalizado: <FileCheck className="h-4 w-4 text-green-500" />,
  borrador: <FileClock className="h-4 w-4 text-amber-500" />,
  revision: <FileSignature className="h-4 w-4 text-blue-500" />,
}

const plantillasBase = [
  { id: "tutela", nombre: "Accion de Tutela", categoria: "Constitucional", descripcion: "Plantilla para proteccion de derechos fundamentales" },
  { id: "demanda-civil", nombre: "Demanda Civil", categoria: "Civil", descripcion: "Demanda para procesos civiles ordinarios" },
  { id: "demanda-laboral", nombre: "Demanda Laboral", categoria: "Laboral", descripcion: "Demanda ordinaria laboral" },
  { id: "derecho-peticion", nombre: "Derecho de Peticion", categoria: "Administrativo", descripcion: "Solicitud ante entidades publicas o privadas" },
  { id: "poder", nombre: "Poder Especial", categoria: "Civil", descripcion: "Otorgamiento de poder a apoderado" },
  { id: "contestacion", nombre: "Contestacion de Demanda", categoria: "Civil", descripcion: "Respuesta a demanda en contra" },
  { id: "recurso-apelacion", nombre: "Recurso de Apelacion", categoria: "Civil", descripcion: "Impugnacion de decisiones judiciales" },
  { id: "incidente-desacato", nombre: "Incidente de Desacato", categoria: "Constitucional", descripcion: "Por incumplimiento de fallo de tutela" },
]

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { documents, isLoading, mutate } = useDocuments()
  const { cases } = useCases()
  const { clients } = useClients()
  const { toast } = useToast()

  const [nuevoDocumento, setNuevoDocumento] = useState({
    nombre: "",
    tipo: "",
    categoria: "",
    casoId: "",
    clienteId: "",
    contenido: "",
    estado: "borrador",
  })

  const filteredPlantillas = useMemo(() => {
    return plantillasBase.filter(
      (item) =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const handleCrearDocumento = async () => {
    if (!nuevoDocumento.nombre || !nuevoDocumento.tipo) {
      toast({
        title: "Error",
        description: "El nombre y tipo son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoDocumento),
      })

      if (!response.ok) throw new Error("Error al crear documento")

      toast({
        title: "Documento creado",
        description: "El documento se ha guardado correctamente",
      })
      setDialogOpen(false)
      setNuevoDocumento({
        nombre: "",
        tipo: "",
        categoria: "",
        casoId: "",
        clienteId: "",
        contenido: "",
        estado: "borrador",
      })
      mutate()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el documento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEliminarDocumento = async (id: string) => {
    if (!confirm("Esta seguro de eliminar este documento?")) return

    try {
      const response = await fetch(`/api/documents/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Error al eliminar")

      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente",
      })
      mutate()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      })
    }
  }

  const getClientName = (clienteId: string) => {
    const client = clients?.find((c: any) => c._id === clienteId)
    if (!client) return "Sin cliente"
    return client.tipoPersona === "natural"
      ? `${client.nombres} ${client.apellidos}`
      : client.razonSocial
  }

  const getCaseName = (casoId: string) => {
    const caso = cases?.find((c: any) => c._id === casoId)
    return caso ? caso.numeroInterno : "Sin caso"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const documentsList = documents || []
  const finalizados = documentsList.filter((d: any) => d.estado === "finalizado").length
  const enRevision = documentsList.filter((d: any) => d.estado === "revision").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos y Plantillas</h1>
          <p className="text-muted-foreground">
            Biblioteca legal para escritos, contratos, tutelas y documentos procesales.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Documento</DialogTitle>
              <DialogDescription>
                Complete la informacion del documento
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del documento *</Label>
                <Input
                  placeholder="Ej: Demanda laboral - Juan Perez"
                  value={nuevoDocumento.nombre}
                  onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, nombre: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={nuevoDocumento.tipo}
                    onValueChange={(v) => setNuevoDocumento({ ...nuevoDocumento, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demanda">Demanda</SelectItem>
                      <SelectItem value="tutela">Tutela</SelectItem>
                      <SelectItem value="recurso">Recurso</SelectItem>
                      <SelectItem value="contrato">Contrato</SelectItem>
                      <SelectItem value="poder">Poder</SelectItem>
                      <SelectItem value="memorial">Memorial</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={nuevoDocumento.categoria}
                    onValueChange={(v) => setNuevoDocumento({ ...nuevoDocumento, categoria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laboral">Laboral</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                      <SelectItem value="Penal">Penal</SelectItem>
                      <SelectItem value="Constitucional">Constitucional</SelectItem>
                      <SelectItem value="Administrativo">Administrativo</SelectItem>
                      <SelectItem value="Familia">Familia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={nuevoDocumento.clienteId}
                    onValueChange={(v) => setNuevoDocumento({ ...nuevoDocumento, clienteId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client: any) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.tipoPersona === "natural"
                            ? `${client.nombres} ${client.apellidos}`
                            : client.razonSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Caso relacionado</Label>
                  <Select
                    value={nuevoDocumento.casoId}
                    onValueChange={(v) => setNuevoDocumento({ ...nuevoDocumento, casoId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
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
                <Label>Estado</Label>
                <Select
                  value={nuevoDocumento.estado}
                  onValueChange={(v) => setNuevoDocumento({ ...nuevoDocumento, estado: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="revision">En revision</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearDocumento} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar documento"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{plantillasBase.length}</div>
            <p className="text-xs text-muted-foreground">Plantillas disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{documentsList.length}</div>
            <p className="text-xs text-muted-foreground">Documentos guardados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{enRevision}</div>
            <p className="text-xs text-muted-foreground">En revision</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{finalizados}</div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plantillas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="documentos">Mis Documentos</TabsTrigger>
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPlantillas.map((template) => (
              <Card key={template.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <Badge className={categoriaColores[template.categoria] || "bg-gray-100 text-gray-800"}>
                      {template.categoria}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.nombre}</CardTitle>
                  <CardDescription>{template.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/herramientas/generador">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generar con IA
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Mis Documentos
              </CardTitle>
              <CardDescription>
                Documentos guardados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {documentsList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay documentos guardados</p>
                  <p className="text-sm">Crea tu primer documento o genera uno con IA</p>
                </div>
              ) : (
                documentsList.map((doc: any) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {estadoIconos[doc.estado] || <FileText className="h-4 w-4" />}
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.clienteId ? getClientName(doc.clienteId) : "Sin cliente"}
                          {doc.casoId ? ` - ${getCaseName(doc.casoId)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={categoriaColores[doc.categoria] || ""}>
                        {doc.categoria || doc.tipo}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString("es-CO")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarDocumento(doc._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generador">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generador de documentos con IA
              </CardTitle>
              <CardDescription>
                Accede al generador completo de documentos legales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/herramientas/generador">
                <Button className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ir al Generador de Documentos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
