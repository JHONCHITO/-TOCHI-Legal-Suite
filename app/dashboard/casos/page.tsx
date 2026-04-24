"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Edit,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { demoCases, getClientById, getClientDisplayName, formatCurrencyCop } from "@/lib/demo-data";

const estadoColors: Record<string, string> = {
  consulta: "bg-muted text-muted-foreground",
  activo: "bg-accent/20 text-accent",
  en_tramite: "bg-primary/20 text-primary",
  audiencia_pendiente: "bg-amber-100 text-amber-800",
  sentencia: "bg-emerald-100 text-emerald-800",
  cerrado: "bg-muted text-muted-foreground",
};

const tipoLabels: Record<string, string> = {
  civil: "Civil",
  laboral: "Laboral",
  constitucional: "Constitucional",
  comercial: "Comercial",
  familia: "Familia",
  administrativo: "Administrativo",
};

export default function CasosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  const filteredCases = useMemo(() => {
    return demoCases.filter((caso) => {
      const client = getClientById(caso.clienteId);
      const clientName = client ? getClientDisplayName(client).toLowerCase() : "";
      const matchesSearch =
        caso.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caso.numeroInterno.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caso.juzgado.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.includes(searchQuery.toLowerCase());
      const matchesTipo = filterTipo === "todos" || caso.tipo === filterTipo;
      const matchesEstado = filterEstado === "todos" || caso.estado === filterEstado;
      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [filterEstado, filterTipo, searchQuery]);

  const totalCuantia = filteredCases.reduce((sum, item) => sum + (item.cuantia ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion de Casos</h1>
          <p className="text-muted-foreground">
            Expedientes, plazos, responsables, estrategia juridica y documentos del proceso.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/casos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Caso
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{demoCases.filter((item) => item.estado === "activo").length}</div>
            <p className="text-xs text-muted-foreground">Casos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {demoCases.filter((item) => item.estado === "audiencia_pendiente").length}
            </div>
            <p className="text-xs text-muted-foreground">Audiencias pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{demoCases.length}</div>
            <p className="text-xs text-muted-foreground">Expedientes cargados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrencyCop(totalCuantia)}</div>
            <p className="text-xs text-muted-foreground">Cuantia del filtro actual</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por titulo, cliente, numero o juzgado..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="en_tramite">En tramite</SelectItem>
                  <SelectItem value="audiencia_pendiente">Audiencia pendiente</SelectItem>
                  <SelectItem value="sentencia">Sentencia</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de expedientes</CardTitle>
          <CardDescription>{filteredCases.length} casos visibles en la suite</CardDescription>
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
                <TableHead>Proxima actuacion</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caso) => {
                const client = getClientById(caso.clienteId);
                const clientName = client ? getClientDisplayName(client) : "Cliente";

                return (
                  <TableRow key={caso.id}>
                    <TableCell className="font-mono text-xs">{caso.numeroInterno}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/casos/${caso.id}`} className="font-medium hover:text-primary">
                        {caso.titulo}
                      </Link>
                    </TableCell>
                    <TableCell>{clientName}</TableCell>
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
                        <span className="text-sm text-muted-foreground">-</span>
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
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/documentos">
                              <FileText className="mr-2 h-4 w-4" />
                              Documentos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
