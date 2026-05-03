"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { ArrowLeft, Briefcase, Calendar, FileText, Loader2, Save, Users } from "lucide-react";
import { useClients, createCase } from "@/lib/hooks/use-data";
import { getClientDisplayName, caseTypeLabels, caseStatusLabels } from "@/lib/utils/format";
import { toast } from "sonner";

export default function NuevoCasoPage() {
  const router = useRouter();
  const { clients, isLoading: loadingClients } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.tipo || !formData.clienteId || !formData.calidadCliente || !formData.descripcion) {
      toast.error("Por favor completa los campos requeridos: titulo, tipo, cliente, calidad y descripcion");
      return;
    }

    setIsSubmitting(true);
    try {
      const caseData = {
        ...formData,
        cuantia: formData.cuantia ? parseFloat(formData.cuantia) : undefined,
        honorarios: formData.honorarios ? parseFloat(formData.honorarios) : undefined,
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
    <div className="space-y-6">
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha del expediente</CardTitle>
            <CardDescription>Base operativa para procesos civiles, laborales, penales o administrativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label>Titulo del caso *</Label>
              <Input
                placeholder="Ej: Demanda laboral por despido injustificado"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente principal *</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClients ? "Cargando..." : "Seleccionar cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: { _id: string; tipo: string; nombre?: string; apellido?: string; razonSocial?: string }) => (
                      <SelectItem key={client._id} value={client._id}>
                        {getClientDisplayName(client)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
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
                  type="number"
                  placeholder="0"
                  value={formData.cuantia}
                  onChange={(e) => setFormData({ ...formData, cuantia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Honorarios (COP)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.honorarios}
                  onChange={(e) => setFormData({ ...formData, honorarios: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripcion del caso *</Label>
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
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Users className="h-4 w-4 text-primary" />
                Vincular cliente y contraparte
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Calendar className="h-4 w-4 text-primary" />
                Crear plazo y audiencia inicial
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <FileText className="h-4 w-4 text-primary" />
                Cargar documentos base
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Briefcase className="h-4 w-4 text-primary" />
                Definir estrategia y honorarios
              </div>
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
    </div>
  );
}
