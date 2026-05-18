"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Briefcase, Calendar, FileText, Loader2, Plus, Save, Users } from "lucide-react";
import { useClients, createCase } from "@/lib/hooks/use-data";
import { getClientDisplayName, caseTypeLabels, caseStatusLabels, formatCopNumber, parseCopNumber } from "@/lib/utils/format";
import { toast } from "sonner";

export default function NuevoCasoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdFilter = searchParams.get("clienteId") || "";
  const { clients, isLoading: loadingClients } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientOptions = useMemo(
    () =>
      clients.map((client: {
        _id: string;
        tipo: string;
        nombre?: string;
        apellido?: string;
        razonSocial?: string;
        email?: string;
        cedula?: string;
        nit?: string;
      }) => ({
        value: client._id,
        label: getClientDisplayName(client),
        keywords: [client.email, client.cedula, client.nit].filter(Boolean) as string[],
      })),
    [clients]
  );
  const noClientsAvailable = !loadingClients && clientOptions.length === 0;
  const selectedClient = useMemo(() => {
    if (!clienteIdFilter) return null;
    return clients.find((client: { _id: string }) => String(client._id) === clienteIdFilter) || null;
  }, [clienteIdFilter, clients]);

  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "civil",
    estado: "consulta",
    clienteId: "",
    calidadCliente: "demandante",
    descripcion: "",
    hechos: "",
    pretensiones: "",
    despacho: "",
    ciudad: "",
    numeroProceso: "",
    contraparte: "",
    contraparteAbogado: "",
    fechaProximaActuacion: "",
    cuantia: "",
    honorarios: "",
    notas: "",
  });

  useEffect(() => {
    if (clienteIdFilter && !formData.clienteId) {
      setFormData((current) => ({ ...current, clienteId: clienteIdFilter }));
    }
  }, [clienteIdFilter, formData.clienteId]);

  const missingRequiredFields = [
    !formData.titulo.trim() ? { id: "titulo-caso", label: "Titulo del caso" } : null,
    !formData.tipo ? { id: "tipo-caso", label: "Tipo de caso" } : null,
    !formData.clienteId ? { id: "cliente-principal", label: "Cliente principal" } : null,
    !formData.calidadCliente ? { id: "calidad-cliente", label: "Calidad del cliente" } : null,
    !formData.descripcion.trim() ? { id: "descripcion-caso", label: "Descripcion" } : null,
  ].filter((field): field is { id: string; label: string } => Boolean(field));

  const handleSubmit = async () => {
    if (missingRequiredFields.length > 0) {
      toast.error(
        `Faltan campos requeridos: ${missingRequiredFields.map((field) => field.label).join(", ")}`
      );
      document.getElementById(missingRequiredFields[0].id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    try {
      const caseData = {
        ...formData,
        cuantia: formData.cuantia ? parseCopNumber(formData.cuantia) : undefined,
        honorarios: formData.honorarios ? parseCopNumber(formData.honorarios) : undefined,
        fechaProximaActuacion: formData.fechaProximaActuacion ? new Date(formData.fechaProximaActuacion) : undefined,
      };

      await createCase(caseData);
      toast.success("Caso creado correctamente");
      router.push("/dashboard/casos");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear caso");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Caso</h1>
          <p className="text-muted-foreground">
            Abre un expediente con datos del cliente, tipo de proceso, plazos y estrategia inicial.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/casos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a casos
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar caso
              </>
            )}
          </Button>
        </div>
      </div>

      {clienteIdFilter ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Caso preparado para el cliente seleccionado</p>
              <p className="text-sm text-muted-foreground">
                {selectedClient
                  ? getClientDisplayName(selectedClient)
                  : "El cliente quedó preseleccionado desde la ficha."}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/casos">Ver todos los casos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha del expediente</CardTitle>
            <CardDescription>Base operativa para procesos civiles, laborales, penales o administrativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {missingRequiredFields.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Antes de guardar falta completar:</p>
                <p className="mt-1">{missingRequiredFields.map((field) => field.label).join(", ")}</p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2" id="tipo-caso">
                <Label>Tipo de caso *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(caseTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado inicial *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(caseStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo-caso">Titulo del caso *</Label>
              <Input
                id="titulo-caso"
                placeholder="Ej: Demanda laboral por despido injustificado"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2" id="cliente-principal">
                <div className="flex items-center justify-between gap-3">
                  <Label>Cliente principal *</Label>
                  <Button asChild variant="link" size="sm" className="h-auto px-0">
                    <Link href="/dashboard/clientes/nuevo">
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Crear cliente
                    </Link>
                  </Button>
                </div>
                <SearchableCombobox
                  value={formData.clienteId}
                  onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                  options={clientOptions}
                  placeholder={loadingClients ? "Cargando..." : "Seleccionar cliente"}
                  searchPlaceholder="Escribe nombre, correo o documento"
                  emptyText="No hay clientes para mostrar"
                />
                <p className="text-xs text-muted-foreground">
                  Escribe para buscar un cliente existente o crea uno nuevo si no aparece en la lista.
                </p>
                {noClientsAvailable ? (
                  <p className="text-xs font-medium text-amber-700">
                    No tienes clientes cargados todavía. Crea uno antes de guardar un caso.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2" id="calidad-cliente">
                <Label>Calidad del cliente *</Label>
                <Select
                  value={formData.calidadCliente}
                  onValueChange={(value) => setFormData({ ...formData, calidadCliente: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demandante">Demandante</SelectItem>
                    <SelectItem value="demandado">Demandado</SelectItem>
                    <SelectItem value="tercero">Tercero</SelectItem>
                    <SelectItem value="victima">Victima</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Contraparte</Label>
                <Input
                  placeholder="Nombre de la contraparte"
                  value={formData.contraparte}
                  onChange={(e) => setFormData({ ...formData, contraparte: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Abogado contraparte</Label>
                <Input
                  placeholder="Nombre del abogado"
                  value={formData.contraparteAbogado}
                  onChange={(e) => setFormData({ ...formData, contraparteAbogado: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Juzgado / Despacho</Label>
                <Input
                  placeholder="Juzgado 5 Civil Municipal de Bogota"
                  value={formData.despacho}
                  onChange={(e) => setFormData({ ...formData, despacho: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input
                  placeholder="Bogota"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Numero de proceso</Label>
                <Input
                  placeholder="11001-31-03-005-2026-00025-00"
                  value={formData.numeroProceso}
                  onChange={(e) => setFormData({ ...formData, numeroProceso: e.target.value })}
                />
              </div>
              <div className="space-y-2" id="fecha-proxima-actuacion">
                <Label>Fecha proxima actuacion</Label>
                <Input
                  type="date"
                  value={formData.fechaProximaActuacion}
                  onChange={(e) => setFormData({ ...formData, fechaProximaActuacion: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cuantia (COP)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={formData.cuantia}
                  onChange={(e) =>
                    setFormData({ ...formData, cuantia: formatCopNumber(parseCopNumber(e.target.value)) })
                  }
                />
              </div>
              <div className="space-y-2" id="honorarios">
                <Label>Honorarios (COP)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={formData.honorarios}
                  onChange={(e) =>
                    setFormData({ ...formData, honorarios: formatCopNumber(parseCopNumber(e.target.value)) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion-caso">Descripcion del caso *</Label>
              <Textarea
                id="descripcion-caso"
                rows={3}
                placeholder="Breve descripcion del asunto legal"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Hechos relevantes</Label>
              <Textarea
                rows={4}
                placeholder="Resume el conflicto, la pretension principal, pruebas iniciales y riesgos del asunto."
                value={formData.hechos}
                onChange={(e) => setFormData({ ...formData, hechos: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Pretensiones</Label>
              <Textarea
                rows={3}
                placeholder="Indica las pretensiones principales del caso."
                value={formData.pretensiones}
                onChange={(e) => setFormData({ ...formData, pretensiones: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea
                rows={3}
                placeholder="Notas internas, estrategia o recordatorios."
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Checklist operativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => document.getElementById("cliente-principal")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <Users className="mr-2 h-4 w-4 text-primary" />
                Vincular cliente y contraparte
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => document.getElementById("fecha-proxima-actuacion")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <Calendar className="mr-2 h-4 w-4 text-primary" />
                Crear plazo y audiencia inicial
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/documentos">
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  Cargar documentos base
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => document.getElementById("honorarios")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <Briefcase className="mr-2 h-4 w-4 text-primary" />
                Definir estrategia y honorarios
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campos requeridos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>Titulo del caso</li>
                <li>Tipo de caso</li>
                <li>Cliente principal</li>
                <li>Calidad del cliente</li>
                <li>Descripcion</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integraciones</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {["Alertas", "Facturacion", "Documentos IA", "Calendario"].map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
