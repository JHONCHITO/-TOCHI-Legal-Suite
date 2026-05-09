"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createAppointment, createCase, createClient } from "@/lib/hooks/use-data";
import { appointmentTypeLabels, caseStatusLabels, caseTypeLabels } from "@/lib/utils/format";
import { toast } from "sonner";

type IntakeInsights = {
  tituloCasoSugerido: string;
  tipoCasoSugerido: string;
  estadoSugerido: string;
  calidadClienteSugerida: string;
  resumen: string;
  hechosSugeridos: string;
  pretensionesSugeridas: string;
  palabrasClave: string[];
  proximaAccionSugerida: string;
  citaSugerida: {
    titulo: string;
    tipo: string;
    descripcion: string;
  };
};

async function fetcher(url: string) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "No se pudo verificar el acceso");
  }
  return payload;
}

const departamentos = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlantico",
  "Bolivar",
  "Boyaca",
  "Caldas",
  "Caqueta",
  "Casanare",
  "Cauca",
  "Cesar",
  "Choco",
  "Cordoba",
  "Cundinamarca",
  "Guainia",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Narino",
  "Norte de Santander",
  "Putumayo",
  "Quindio",
  "Risaralda",
  "San Andres y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupes",
  "Vichada",
];

export default function IntakePage() {
  const router = useRouter();
  const { data: userData, isLoading: userLoading } = useSWR("/api/users/me", fetcher);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [creationStep, setCreationStep] = useState<"cliente" | "caso" | "cita" | "listo">("cliente");
  const [intakeInsights, setIntakeInsights] = useState<IntakeInsights | null>(null);

  const [formData, setFormData] = useState({
    cliente: {
      tipo: "persona_natural",
      nombre: "",
      apellido: "",
      cedula: "",
      razonSocial: "",
      nit: "",
      representanteLegal: "",
      email: "",
      telefono: "",
      celular: "",
      direccion: "",
      ciudad: "",
      departamento: "",
      notas: "",
      tieneAccesoPortal: true,
    },
    caso: {
      titulo: "",
      tipo: "civil",
      estado: "consulta",
      calidadCliente: "demandante",
      descripcion: "",
      hechos: "",
      pretensiones: "",
      despacho: "",
      numeroProceso: "",
      contraparte: "",
      contraparteAbogado: "",
      fechaProximaActuacion: "",
      cuantia: "",
      honorarios: "",
    },
    cita: {
      crear: true,
      titulo: "",
      tipo: "consulta",
      fecha: "",
      horaInicio: "09:00",
      horaFin: "10:00",
      ubicacion: "",
      esVirtual: false,
      descripcion: "",
    },
  });

  const isNatural = formData.cliente.tipo === "persona_natural";
  const clientPreviewName = useMemo(() => {
    if (isNatural) {
      return [formData.cliente.nombre, formData.cliente.apellido].filter(Boolean).join(" ") || "Cliente nuevo";
    }
    return formData.cliente.razonSocial || "Empresa nueva";
  }, [formData.cliente.apellido, formData.cliente.nombre, formData.cliente.razonSocial, isNatural]);

  const casePreviewTitle = formData.caso.titulo || "Expediente sin titulo";
  const appointmentPreviewTitle = formData.cita.titulo || "Primera cita";

  const isDefaultCaseType = (value: string) => value === "civil";
  const isDefaultCaseStatus = (value: string) => value === "consulta";
  const isDefaultClientQuality = (value: string) => value === "demandante";
  const isDefaultAppointmentType = (value: string) => value === "consulta";

  const applyInsightsData = (insights: IntakeInsights) => {
    setFormData((current) => ({
      ...current,
      caso: {
        ...current.caso,
        titulo: current.caso.titulo || insights.tituloCasoSugerido,
        tipo: !current.caso.tipo || isDefaultCaseType(current.caso.tipo)
          ? insights.tipoCasoSugerido
          : current.caso.tipo,
        estado: !current.caso.estado || isDefaultCaseStatus(current.caso.estado)
          ? insights.estadoSugerido
          : current.caso.estado,
        calidadCliente: !current.caso.calidadCliente || isDefaultClientQuality(current.caso.calidadCliente)
          ? insights.calidadClienteSugerida
          : current.caso.calidadCliente,
        descripcion: current.caso.descripcion || insights.resumen,
        hechos: current.caso.hechos || insights.hechosSugeridos,
        pretensiones: current.caso.pretensiones || insights.pretensionesSugeridas,
      },
      cita: {
        ...current.cita,
        titulo: current.cita.titulo || insights.citaSugerida.titulo,
        tipo: !current.cita.tipo || isDefaultAppointmentType(current.cita.tipo)
          ? insights.citaSugerida.tipo
          : current.cita.tipo,
        descripcion: current.cita.descripcion || insights.citaSugerida.descripcion,
      },
    }));
  };

  const applyInsights = () => {
    if (!intakeInsights) {
      return;
    }

    applyInsightsData(intakeInsights);
    toast.success("Sugerencias aplicadas al formulario");
  };

  const handleAnalyzeWithAI = async () => {
    if (!formData.cliente.email || !formData.caso.descripcion) {
      toast.error("Completa al menos el correo del cliente y la descripcion del caso para analizar");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/intake/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: formData.cliente,
          caso: formData.caso,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo analizar el intake");
      }

      const nextInsights = payload?.suggestions as IntakeInsights | undefined;
      if (!nextInsights) {
        throw new Error("La IA no devolvio sugerencias utilizables");
      }

      setIntakeInsights(nextInsights);
      applyInsightsData(nextInsights);
      toast.success(payload?.fallback ? "Sugerencias generadas con respaldo local" : "IA analizo el intake");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo analizar el intake");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.cliente.email ||
      !formData.cliente.telefono ||
      !formData.cliente.direccion ||
      !formData.cliente.ciudad ||
      !formData.cliente.departamento
    ) {
      toast.error("Completa los datos basicos del cliente");
      return;
    }

    if (isNatural && (!formData.cliente.nombre || !formData.cliente.apellido)) {
      toast.error("Nombre y apellido son requeridos para persona natural");
      return;
    }

    if (!isNatural && !formData.cliente.razonSocial) {
      toast.error("La razon social es requerida para persona juridica");
      return;
    }

    if (
      !formData.caso.titulo ||
      !formData.caso.descripcion ||
      !formData.caso.tipo ||
      !formData.caso.calidadCliente
    ) {
      toast.error("Completa la informacion basica del expediente");
      return;
    }

    if (formData.cita.crear && !formData.cita.fecha) {
      toast.error("Selecciona la fecha de la primera cita");
      return;
    }

    setIsSubmitting(true);
    setCreationStep("cliente");

    try {
      const clientPayload = {
        ...formData.cliente,
        email: formData.cliente.email.trim().toLowerCase(),
      };

      const createdClient = await createClient(clientPayload);
      setCreationStep("caso");

      const casePayload = {
        ...formData.caso,
        clienteId: createdClient._id,
        cuantia: formData.caso.cuantia ? Number(formData.caso.cuantia) : undefined,
        honorarios: formData.caso.honorarios ? Number(formData.caso.honorarios) : undefined,
        fechaProximaActuacion: formData.caso.fechaProximaActuacion
          ? new Date(formData.caso.fechaProximaActuacion)
          : undefined,
      };

      const createdCase = await createCase(casePayload);
      setCreationStep("cita");

      if (formData.cita.crear) {
        try {
          const fechaInicio = new Date(`${formData.cita.fecha}T${formData.cita.horaInicio}:00`);
          const fechaFin = new Date(`${formData.cita.fecha}T${formData.cita.horaFin}:00`);

          await createAppointment({
            titulo: formData.cita.titulo || `Primera cita - ${casePreviewTitle}`,
            tipo: formData.cita.tipo,
            fechaInicio: fechaInicio.toISOString(),
            fechaFin: fechaFin.toISOString(),
            ubicacion: formData.cita.ubicacion,
            esVirtual: formData.cita.esVirtual,
            descripcion: formData.cita.descripcion,
            clienteId: createdClient._id,
            casoId: createdCase._id,
          });
        } catch (appointmentError) {
          toast.error(
            appointmentError instanceof Error
              ? appointmentError.message
              : "El expediente se creo, pero la cita inicial no pudo guardarse"
          );
        }
      }

      setCreationStep("listo");
      toast.success("Ingreso completado: cliente, expediente y cita guardados");
      router.push(`/dashboard/casos/${createdCase._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar el ingreso");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (userData?.rol === "cliente") {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Intake inteligente</CardTitle>
          <CardDescription>
            Este modulo es para el equipo interno que registra nuevos clientes y expedientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Si eres cliente, usa tu portal para revisar casos, documentos y facturas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>/</span>
            <span>Intake inteligente</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Intake inteligente</h1>
          <p className="text-muted-foreground">
            Convierte una nueva entrada en cliente, expediente y primera cita desde un solo flujo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/clientes">
              <Users className="mr-2 h-4 w-4" />
              Ver clientes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/casos">
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir a casos
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos del cliente</CardTitle>
              <CardDescription>Captura la informacion base del CRM legal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de cliente</Label>
                  <Select
                    value={formData.cliente.tipo}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      cliente: { ...formData.cliente, tipo: value },
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persona_natural">Persona natural</SelectItem>
                      <SelectItem value="persona_juridica">Persona juridica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isNatural ? "Cedula" : "NIT"}</Label>
                  <Input
                    value={isNatural ? formData.cliente.cedula : formData.cliente.nit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente: isNatural
                          ? { ...formData.cliente, cedula: e.target.value }
                          : { ...formData.cliente, nit: e.target.value },
                      })
                    }
                    placeholder={isNatural ? "1020304050" : "900123456-7"}
                  />
                </div>
              </div>

              {isNatural ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={formData.cliente.nombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente: { ...formData.cliente, nombre: e.target.value },
                        })
                      }
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido</Label>
                    <Input
                      value={formData.cliente.apellido}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente: { ...formData.cliente, apellido: e.target.value },
                        })
                      }
                      placeholder="Perez"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Razon social</Label>
                    <Input
                      value={formData.cliente.razonSocial}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente: { ...formData.cliente, razonSocial: e.target.value },
                        })
                      }
                      placeholder="Empresa S.A.S."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Representante legal</Label>
                    <Input
                      value={formData.cliente.representanteLegal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente: { ...formData.cliente, representanteLegal: e.target.value },
                        })
                      }
                      placeholder="Nombre del representante"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Correo electronico</Label>
                  <Input
                    type="email"
                    value={formData.cliente.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente: { ...formData.cliente, email: e.target.value },
                      })
                    }
                    placeholder="cliente@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    value={formData.cliente.telefono}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente: { ...formData.cliente, telefono: e.target.value },
                      })
                    }
                    placeholder="3001234567"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Direccion</Label>
                  <Input
                    value={formData.cliente.direccion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente: { ...formData.cliente, direccion: e.target.value },
                      })
                    }
                    placeholder="Carrera 10 # 20 - 30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Celular adicional</Label>
                  <Input
                    value={formData.cliente.celular}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente: { ...formData.cliente, celular: e.target.value },
                      })
                    }
                    placeholder="3107654321"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={formData.cliente.ciudad}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente: { ...formData.cliente, ciudad: e.target.value },
                      })
                    }
                    placeholder="Bogota"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select
                    value={formData.cliente.departamento}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        cliente: { ...formData.cliente, departamento: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium">Habilitar portal del cliente</p>
                  <p className="text-sm text-muted-foreground">Le permitira ver casos, documentos y facturas.</p>
                </div>
                <Switch
                  checked={formData.cliente.tieneAccesoPortal}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      cliente: { ...formData.cliente, tieneAccesoPortal: checked },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notas internas</Label>
                <Textarea
                  rows={4}
                  value={formData.cliente.notas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cliente: { ...formData.cliente, notas: e.target.value },
                    })
                  }
                  placeholder="Origen del cliente, sensibilidad, recomendaciones..."
                />
              </div>
            </CardContent>
          </Card>

          {intakeInsights ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sugerencia IA</CardTitle>
                <CardDescription>La IA analizo la entrada y propuso una ruta inicial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Titulo sugerido</p>
                  <p className="mt-1 font-medium text-foreground">{intakeInsights.tituloCasoSugerido}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tipo y calidad</p>
                  <p className="mt-1 font-medium text-foreground">
                    {caseTypeLabels[intakeInsights.tipoCasoSugerido as keyof typeof caseTypeLabels] || intakeInsights.tipoCasoSugerido} /{" "}
                    {intakeInsights.calidadClienteSugerida}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Proxima accion</p>
                  <p className="mt-1 text-foreground">{intakeInsights.proximaAccionSugerida}</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Palabras clave</p>
                  <p className="mt-1 text-foreground">{intakeInsights.palabrasClave.join(", ")}</p>
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={applyInsights}>
                  Aplicar sugerencias al formulario
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Expediente inicial</CardTitle>
                  <CardDescription>Abre el caso y define la linea base del asunto.</CardDescription>
                </div>
                <Button variant="outline" size="sm" type="button" onClick={handleAnalyzeWithAI} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analizar con IA
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de caso</Label>
                  <Select
                    value={formData.caso.tipo}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, tipo: value },
                      })
                    }
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
                  <Label>Estado inicial</Label>
                  <Select
                    value={formData.caso.estado}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, estado: value },
                      })
                    }
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
                <Label>Titulo del expediente</Label>
                <Input
                  value={formData.caso.titulo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caso: { ...formData.caso, titulo: e.target.value },
                    })
                  }
                  placeholder="Demanda laboral por despido injustificado"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Calidad del cliente</Label>
                  <Select
                    value={formData.caso.calidadCliente}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, calidadCliente: value },
                      })
                    }
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
                <div className="space-y-2">
                  <Label>Numero de proceso</Label>
                  <Input
                    value={formData.caso.numeroProceso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, numeroProceso: e.target.value },
                      })
                    }
                    placeholder="11001-31-03-005-2026-00025-00"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Despacho</Label>
                  <Input
                    value={formData.caso.despacho}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, despacho: e.target.value },
                      })
                    }
                    placeholder="Juzgado 5 Civil Municipal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraparte</Label>
                  <Input
                    value={formData.caso.contraparte}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, contraparte: e.target.value },
                      })
                    }
                    placeholder="Nombre de la contraparte"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Abogado contraparte</Label>
                  <Input
                    value={formData.caso.contraparteAbogado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, contraparteAbogado: e.target.value },
                      })
                    }
                    placeholder="Nombre del abogado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proxima actuacion</Label>
                  <Input
                    type="date"
                    value={formData.caso.fechaProximaActuacion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, fechaProximaActuacion: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cuantia</Label>
                  <Input
                    type="number"
                    value={formData.caso.cuantia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, cuantia: e.target.value },
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Honorarios</Label>
                  <Input
                    type="number"
                    value={formData.caso.honorarios}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caso: { ...formData.caso, honorarios: e.target.value },
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea
                  rows={3}
                  value={formData.caso.descripcion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caso: { ...formData.caso, descripcion: e.target.value },
                    })
                  }
                  placeholder="Breve descripcion del asunto legal"
                />
              </div>

              <div className="space-y-2">
                <Label>Hechos</Label>
                <Textarea
                  rows={4}
                  value={formData.caso.hechos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caso: { ...formData.caso, hechos: e.target.value },
                    })
                  }
                  placeholder="Resume el conflicto y los hechos principales"
                />
              </div>

              <div className="space-y-2">
                <Label>Pretensiones</Label>
                <Textarea
                  rows={3}
                  value={formData.caso.pretensiones}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caso: { ...formData.caso, pretensiones: e.target.value },
                    })
                  }
                  placeholder="Indica las pretensiones principales"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Primera cita</CardTitle>
              <CardDescription>Opcionalmente deja agendada la primera actuacion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium">Crear cita inicial</p>
                  <p className="text-sm text-muted-foreground">Agenda la primera reunion o consulta.</p>
                </div>
                <Switch
                  checked={formData.cita.crear}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      cita: { ...formData.cita, crear: checked },
                    })
                  }
                />
              </div>

              {formData.cita.crear ? (
                <>
                  <div className="space-y-2">
                    <Label>Titulo de la cita</Label>
                    <Input
                      value={formData.cita.titulo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cita: { ...formData.cita, titulo: e.target.value },
                        })
                      }
                      placeholder="Primera consulta del caso"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={formData.cita.tipo}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            cita: { ...formData.cita, tipo: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(appointmentTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={formData.cita.fecha}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cita: { ...formData.cita, fecha: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Hora inicio</Label>
                      <Input
                        type="time"
                        value={formData.cita.horaInicio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cita: { ...formData.cita, horaInicio: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora fin</Label>
                      <Input
                        type="time"
                        value={formData.cita.horaFin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cita: { ...formData.cita, horaFin: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ubicacion</Label>
                      <Input
                        value={formData.cita.ubicacion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cita: { ...formData.cita, ubicacion: e.target.value },
                          })
                        }
                        placeholder="Direccion o enlace virtual"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <p className="font-medium">Cita virtual</p>
                      <p className="text-sm text-muted-foreground">Marcar si la reunion sera por videollamada.</p>
                    </div>
                    <Switch
                      checked={formData.cita.esVirtual}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          cita: { ...formData.cita, esVirtual: checked },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descripcion</Label>
                    <Textarea
                      rows={3}
                      value={formData.cita.descripcion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cita: { ...formData.cita, descripcion: e.target.value },
                        })
                      }
                      placeholder="Objetivo de la reunion o audiencia"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Puedes completar la cita mas tarde desde la agenda si prefieres no agendarla hoy.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vista previa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cliente</p>
                <p className="mt-1 font-medium">{clientPreviewName}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Expediente</p>
                <p className="mt-1 font-medium">{casePreviewTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {caseTypeLabels[formData.caso.tipo] || formData.caso.tipo} ·{" "}
                  {caseStatusLabels[formData.caso.estado] || formData.caso.estado}
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cita</p>
                <p className="mt-1 font-medium">{appointmentPreviewTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {formData.cita.crear ? "Se creara automaticamente" : "No se creara hoy"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flujo de trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-2xl border p-3">
                <UserRound className="h-4 w-4 text-primary" />
                1. Crear cliente y activar portal si aplica
              </div>
              <div className="flex items-center gap-3 rounded-2xl border p-3">
                <Sparkles className="h-4 w-4 text-primary" />
                2. Abrir expediente con la informacion base
              </div>
              <div className="flex items-center gap-3 rounded-2xl border p-3">
                <Calendar className="h-4 w-4 text-primary" />
                3. Agendar la primera cita y dejar trazabilidad
              </div>
              <div className="flex items-center gap-3 rounded-2xl border p-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                4. Redirigir al caso para continuar el trabajo
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Etapa: {creationStep}</p>
              <div className="rounded-2xl border p-4">
                <p className="font-medium text-foreground">Portal listo para el cliente</p>
                <p className="text-xs text-muted-foreground">
                  {formData.cliente.tieneAccesoPortal ? "Si" : "No"}
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="font-medium text-foreground">Honorarios</p>
                <p className="text-xs text-muted-foreground">
                  {formData.caso.honorarios ? formData.caso.honorarios : "Sin valor"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando todo...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Crear cliente, expediente y cita
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
