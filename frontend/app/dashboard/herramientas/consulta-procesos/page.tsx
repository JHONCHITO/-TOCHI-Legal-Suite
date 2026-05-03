"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Calendar, MapPin, User, Scale, ExternalLink, Loader2 } from "lucide-react"

interface Proceso {
  radicado: string
  despacho: string
  tipo: string
  demandante: string
  demandado: string
  estado: string
  fechaRadicacion: string
  ultimaActuacion: string
  ciudad: string
}

export default function ConsultaProcesosPage() {
  const [searchType, setSearchType] = useState<string>("radicado")
  const [searchValue, setSearchValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchValue.trim()) return
    
    setLoading(true)
    setSearched(true)
    
    // Simular búsqueda - En producción conectar con API de la Rama Judicial
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Datos de ejemplo
    const ejemplos: Proceso[] = [
      {
        radicado: searchValue.includes("-") ? searchValue : `11001310300${searchValue}`,
        despacho: "Juzgado 5 Civil del Circuito de Bogota",
        tipo: "Proceso Declarativo",
        demandante: "Juan Perez Martinez",
        demandado: "Empresa ABC S.A.S.",
        estado: "En tramite",
        fechaRadicacion: "2024-03-15",
        ultimaActuacion: "Auto que admite demanda - 2024-04-20",
        ciudad: "Bogota D.C."
      },
      {
        radicado: `76001310500${Math.floor(Math.random() * 10000)}`,
        despacho: "Juzgado 3 Laboral del Circuito de Cali",
        tipo: "Proceso Ordinario Laboral",
        demandante: "Maria Garcia Lopez",
        demandado: "Comercializadora XYZ Ltda.",
        estado: "Sentencia de primera instancia",
        fechaRadicacion: "2023-11-08",
        ultimaActuacion: "Sentencia favorable al demandante - 2024-04-18",
        ciudad: "Cali"
      }
    ]
    
    setProcesos(ejemplos)
    setLoading(false)
  }

  const getEstadoBadge = (estado: string) => {
    if (estado.includes("tramite")) return <Badge className="bg-blue-100 text-blue-800">En Tramite</Badge>
    if (estado.includes("Sentencia")) return <Badge className="bg-green-100 text-green-800">Con Sentencia</Badge>
    if (estado.includes("Archivado")) return <Badge variant="secondary">Archivado</Badge>
    return <Badge>{estado}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consulta de Procesos</h1>
        <p className="text-muted-foreground">
          Consulta el estado de procesos judiciales en la Rama Judicial de Colombia
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Proceso
          </CardTitle>
          <CardDescription>
            Ingresa el numero de radicado, cedula o nombre para consultar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de busqueda</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="radicado">Numero de Radicado</SelectItem>
                  <SelectItem value="cedula">Cedula/NIT</SelectItem>
                  <SelectItem value="nombre">Nombre de parte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>
                {searchType === "radicado" ? "Numero de radicado" : 
                 searchType === "cedula" ? "Numero de cedula o NIT" : "Nombre"}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={
                    searchType === "radicado" ? "Ej: 11001310300120240001500" :
                    searchType === "cedula" ? "Ej: 1020304050" : "Ej: Juan Perez"
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium mb-1">Formato del radicado (23 digitos):</p>
            <p className="text-muted-foreground font-mono">
              XXXXX-XX-XXX-XXX-XXXX-XXXXX-XX
            </p>
            <p className="text-muted-foreground mt-1">
              Codigo DANE + Especialidad + Despacho + Ano + Consecutivo + Instancia
            </p>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Resultados de la busqueda ({procesos.length})
          </h2>

          {procesos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No se encontraron procesos</p>
                <p className="text-muted-foreground">
                  Verifica los datos e intenta nuevamente
                </p>
              </CardContent>
            </Card>
          ) : (
            procesos.map((proceso, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <Scale className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-mono font-medium">{proceso.radicado}</p>
                          <p className="text-sm text-muted-foreground">{proceso.despacho}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Demandante</p>
                            <p className="font-medium">{proceso.demandante}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Demandado</p>
                            <p className="font-medium">{proceso.demandado}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Fecha radicacion</p>
                            <p className="font-medium">{proceso.fechaRadicacion}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Ciudad</p>
                            <p className="font-medium">{proceso.ciudad}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">Ultima actuacion</p>
                        <p className="font-medium">{proceso.ultimaActuacion}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      {getEstadoBadge(proceso.estado)}
                      <Badge variant="outline">{proceso.tipo}</Badge>
                      <Button variant="outline" size="sm" className="mt-2">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver en Rama Judicial
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="rounded-full bg-blue-100 p-3 h-fit">
              <Scale className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Consulta oficial</h3>
              <p className="text-blue-700 text-sm mt-1">
                Para consultas oficiales y actualizadas, visita el portal de la Rama Judicial:
              </p>
              <a 
                href="https://consultaprocesos.ramajudicial.gov.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm font-medium inline-flex items-center gap-1 mt-2"
              >
                consultaprocesos.ramajudicial.gov.co
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
