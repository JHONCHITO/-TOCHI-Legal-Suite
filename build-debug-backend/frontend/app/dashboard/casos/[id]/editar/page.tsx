"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, FileText, Loader2, Plus, Save, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCase, useClients, updateCase } from "@/lib/hooks/use-data";
import { caseStatusLabels, caseTypeLabels, getClientDisplayName } from "@/lib/utils/format";
import { toast } from "sonner";

function toDateInputValue(value: unknown) {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function EditarCasoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { case: caseDetail, isLoading, isError } = useCase(id || null);
  const { clients, isLoading: loadingClients } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");
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
    if (!caseDetail) return;
    const detail = caseDetail as Record<string, any>;
    setFormData({
      titulo: detail.titulo || "",
      tipo: detail.tipo || "civil",
      estado: detail.estado || "consulta",
      clienteId:
        typeof detail.clienteId === "string" ? detail.clienteId : detail.clienteId?._id || "",
      calidadCliente: detail.calidadCliente || "demandante",
      descripcion: detail.descripcion || "",
      hechos: detail.hechos || "",
      pretensiones: detail.pretensiones || "",
      despacho: detail.despacho || "",
      ciudad: detail.ciudad || "",
      numeroProceso: detail.numeroProceso || "",
      contraparte: detail.contraparte || "",
      contraparteAbogado: detail.contraparteAbogado || "",
      fechaProximaActuacion: toDateInputValue(detail.fechaProximaActuacion),
      cuantia: detail.cuantia ? String(detail.cuantia) : "",
      honorarios: detail.honorarios ? String(detail.honorarios) : "",
      notas: detail.notas || "",
    });
  }, [caseDetail]);

  const filteredClients = useMemo(() => {
    const query = clienteSearch.trim().toLowerCase();
    if (!query) {
      return clients;
    }

    return clients.filter((client: {
      nombre?: string;
      apellido?: string;
      razonSocial?: string;
      email?: string;
      cedula?: string;
      nit?: string;
    }) => {
      const haystack = [
        client.nombre,
        client.apellido,
        client.razonSocial,
        client.email,
        client.cedula,
        client.nit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [clienteSearch, clients]);

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.tipo || !formData.clienteId || !formData.calidadCliente || !formData.descripcion) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCase(id, {
        ...formData,
        cuantia: formData.cuantia ? Number(formData.cuantia) : undefined,
        honorarios: formData.honorarios ? Number(formData.honorarios) : undefined,
        fechaProximaActuacion: formData.fechaProximaActuacion || undefined,
      });
      toast.success("Caso actualizado correctamente");
      router.push(`/dashboard/casos/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar caso");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !caseDetail) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Caso no encontrado</h1>
        <Button asChild>
          <Link href="/dashboard/casos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a casos
          </Link>
        </Button>
      </div>
    );
  }

  const detail = caseDetail as Record<string, any>;

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
          <h1 className="text-2xl font-bold tracking-tight">Editar Caso</h1>
          <p className="text-muted-foreground">
            Modifica la informaci&oacute;n principal del expediente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/casos/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al caso
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
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha del expediente</CardTitle>
            <CardDescription>Datos del expediente guardados en MongoDB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>N&uacute;mero interno</Label>
                <Input value={detail.numeroInterno || "Auto-generado"} disabled />
              </div>
              <div className="space-y-2">
                <Label>N&uacute;mero de proceso</Label>
                <Input
                  value={formData.numeroProceso}
                  onChange={(e) => setFormData({ ...formData, numeroProceso: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
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
              <Label>T&iacute;tulo del caso *</Label>
              <Input
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
                <Input
                  placeholder="Escribe nombre, correo o documento para filtrar"
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                />
                <Select
                  value={formData.clienteId}
                  onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClients ? "Cargando..." : "Seleccionar cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClients.map((client: { _id: string; tipo: string; nombre?: string; apellido?: string; razonSocial?: string }) => (
                      <SelectItem key={client._id} value={client._id}>
                        {getClientDisplayName(client)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Puedes escribir arriba para filtrar o crear un cliente nuevo si no aparece en la lista.
                </p>
              </div>
              <div className="space-y-2">
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
                <Label>Despacho</Label>
                <Input
                  placeholder="Juzgado 5 Civil Municipal de Bogot&aacute;"
                  value={formData.despacho}
                  onChange={(e) => setFormData({ ...formData, despacho: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input
                  placeholder="Bogot&aacute;"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2" id="fecha-proxima-actuacion">
                <Label>Fecha pr&oacute;xima actuaci&oacute;n</Label>
                <Input
                  type="date"
                  value={formData.fechaProximaActuacion}
                  onChange={(e) => setFormData({ ...formData, fechaProximaActuacion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cuant&iacute;a (COP)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.cuantia}
                  onChange={(e) => setFormData({ ...formData, cuantia: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2" id="honorarios">
                <Label>Honorarios (COP)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.honorarios}
                  onChange={(e) => setFormData({ ...formData, honorarios: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado del caso</Label>
                <div className="flex items-center rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                  {caseStatusLabels[formData.estado] || formData.estado}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripci&oacute;n del caso *</Label>
              <Textarea
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
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="#cliente-principal">
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  Vincular cliente y contraparte
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="#fecha-proxima-actuacion">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  Crear plazo y audiencia inicial
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/documentos">
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  Cargar documentos base
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="#honorarios">
                  <Briefcase className="mr-2 h-4 w-4 text-primary" />
                  Definir estrategia y honorarios
                </Link>
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
        </div>
      </div>
    </form>
  );
}
