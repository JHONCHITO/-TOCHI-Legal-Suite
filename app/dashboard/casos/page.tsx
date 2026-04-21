"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
} from "lucide-react";
import Link from "next/link";

// Mock data
const mockCases = [
  {
    id: "1",
    numeroInterno: "TOCHI-2024-00001",
    titulo: "Demanda Laboral - Despido Injustificado",
    cliente: "Juan Perez",
    tipo: "laboral",
    estado: "activo",
    fechaInicio: "2024-01-15",
    fechaProximaActuacion: "2024-02-15",
    abogado: "Dr. Carlos Martinez",
  },
  {
    id: "2",
    numeroInterno: "TOCHI-2024-00002",
    titulo: "Sucesion Intestada - Familia Garcia",
    cliente: "Maria Garcia",
    tipo: "familia",
    estado: "en_tramite",
    fechaInicio: "2024-01-10",
    fechaProximaActuacion: "2024-02-20",
    abogado: "Dra. Ana Lopez",
  },
  {
    id: "3",
    numeroInterno: "TOCHI-2024-00003",
    titulo: "Cobro Ejecutivo - Pagares",
    cliente: "Empresa ABC S.A.S",
    tipo: "civil",
    estado: "audiencia_pendiente",
    fechaInicio: "2024-01-05",
    fechaProximaActuacion: "2024-02-10",
    abogado: "Dr. Carlos Martinez",
  },
  {
    id: "4",
    numeroInterno: "TOCHI-2024-00004",
    titulo: "Divorcio Contencioso",
    cliente: "Pedro Rodriguez",
    tipo: "familia",
    estado: "activo",
    fechaInicio: "2024-01-20",
    fechaProximaActuacion: "2024-02-25",
    abogado: "Dra. Ana Lopez",
  },
  {
    id: "5",
    numeroInterno: "TOCHI-2023-00150",
    titulo: "Accion de Tutela - Salud",
    cliente: "Rosa Martinez",
    tipo: "constitucional",
    estado: "sentencia",
    fechaInicio: "2023-12-01",
    fechaProximaActuacion: null,
    abogado: "Dr. Carlos Martinez",
  },
];

const estadoColors: Record<string, string> = {
  consulta: "bg-muted text-muted-foreground",
  activo: "bg-accent/20 text-accent",
  en_tramite: "bg-primary/20 text-primary",
  audiencia_pendiente: "bg-warning/20 text-warning-foreground",
  sentencia: "bg-chart-3/20 text-chart-3",
  cerrado: "bg-muted text-muted-foreground",
  archivado: "bg-muted text-muted-foreground",
};

const tipoLabels: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  laboral: "Laboral",
  familia: "Familia",
  comercial: "Comercial",
  administrativo: "Administrativo",
  constitucional: "Constitucional",
  tributario: "Tributario",
};

export default function CasosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  const filteredCases = mockCases.filter((caso) => {
    const matchesSearch =
      caso.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caso.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caso.numeroInterno.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTipo = filterTipo === "todos" || caso.tipo === filterTipo;
    const matchesEstado = filterEstado === "todos" || caso.estado === filterEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion de Casos</h1>
          <p className="text-muted-foreground">
            Administra todos los casos de tu firma
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/casos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Caso
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Casos Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Audiencias Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Casos Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Nuevos Este Mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por titulo, cliente o numero..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {Object.entries(tipoLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="en_tramite">En Tramite</SelectItem>
                  <SelectItem value="audiencia_pendiente">Audiencia Pendiente</SelectItem>
                  <SelectItem value="sentencia">Sentencia</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Casos</CardTitle>
          <CardDescription>
            {filteredCases.length} casos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Titulo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Proxima Actuacion</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caso) => (
                <TableRow key={caso.id}>
                  <TableCell className="font-mono text-xs">
                    {caso.numeroInterno}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/casos/${caso.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {caso.titulo}
                    </Link>
                  </TableCell>
                  <TableCell>{caso.cliente}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tipoLabels[caso.tipo]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={estadoColors[caso.estado]}>
                      {caso.estado.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {caso.fechaProximaActuacion ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {caso.fechaProximaActuacion}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/casos/${caso.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          Documentos
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
