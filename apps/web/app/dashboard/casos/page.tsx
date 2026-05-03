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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Edit,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCases, deleteCase } from "@/lib/hooks/use-data";
import {
  formatCurrencyCop,
  formatDateShort,
  getClientDisplayName,
  caseTypeLabels,
  caseStatusLabels,
  caseStatusColors,
} from "@/lib/utils/format";
import { toast } from "sonner";

export default function CasosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { cases, isLoading, isError, mutate } = useCases({
    search: searchQuery || undefined,
    tipo: filterTipo !== "todos" ? filterTipo : undefined,
    estado: filterEstado !== "todos" ? filterEstado : undefined,
  });

  const stats = useMemo(() => {
    const activos = cases.filter((c: { estado: string }) => c.estado === "activo").length;
    const audiencias = cases.filter((c: { estado: string }) => c.estado === "audiencia_pendiente").length;
    const totalCuantia = cases.reduce((sum: number, c: { cuantia?: number }) => sum + (c.cuantia || 0), 0);
    return { activos, audiencias, total: cases.length, totalCuantia };
  }, [cases]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteCase(deleteId);
      toast.success("Caso eliminado correctamente");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar caso");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (isError) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error al cargar los casos</p>
          <Button variant="outline" onClick={() => mutate()} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{stats.activos}</div>
            <p className="text-xs text-muted-foreground">Casos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.audiencias}</div>
            <p className="text-xs text-muted-foreground">Audiencias pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Expedientes cargados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrencyCop(stats.totalCuantia)}</div>
            <p className="text-xs text-muted-foreground">Cuantia total</p>
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
                  {Object.entries(caseTypeLabels).map(([value, label]) => (
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
                  {Object.entries(caseStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de expedientes</CardTitle>
          <CardDescription>{cases.length} casos en la base de datos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="font-medium">No hay casos registrados</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Comienza creando tu primer caso legal
              </p>
              <Button asChild>
                <Link href="/dashboard/casos/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Caso
                </Link>
              </Button>
            </div>
          ) : (
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
                {cases.map((caso: {
                  _id: string;
                  numeroInterno: string;
                  titulo: string;
                  clienteId?: { nombre?: string; apellido?: string; razonSocial?: string; tipo: string };
                  tipo: string;
                  estado: string;
                  fechaProximaActuacion?: string;
                }) => {
                  const clientName = caso.clienteId
                    ? getClientDisplayName(caso.clienteId)
                    : "Sin cliente";

                  return (
                    <TableRow key={caso._id}>
                      <TableCell className="font-mono text-xs">{caso.numeroInterno}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/casos/${caso._id}`}
                          className="font-medium hover:text-primary"
                        >
                          {caso.titulo}
                        </Link>
                      </TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{caseTypeLabels[caso.tipo] || caso.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={caseStatusColors[caso.estado]}>
                          {caseStatusLabels[caso.estado] || caso.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {caso.fechaProximaActuacion ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDateShort(caso.fechaProximaActuacion)}
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
                              <Link href={`/dashboard/casos/${caso._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/casos/${caso._id}/editar`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(caso._id)}
                            >
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
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar caso</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El caso y todos sus datos asociados seran eliminados
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
