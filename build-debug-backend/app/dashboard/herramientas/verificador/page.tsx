"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ResultadoVerificacion {
  tipo: string;
  numero: string;
  estado: "valido" | "invalido" | "no_encontrado" | "verificando";
  mensaje: string;
  fuente: string;
  detalles?: Record<string, string>;
}

interface VerificacionReciente {
  _id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  estado: "valido" | "invalido" | "no_encontrado" | "verificando";
  mensaje: string;
  fuente: string;
  createdAt: string;
}

interface VerificacionesPayload {
  result?: ResultadoVerificacion;
  recentVerifications?: VerificacionReciente[];
  error?: string;
}

export default function VerificadorDocumentosPage() {
  const [tipoDocumento, setTipoDocumento] = useState("cedula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [recentVerifications, setRecentVerifications] = useState<VerificacionReciente[]>([]);

  useEffect(() => {
    let active = true;

    const loadRecent = async () => {
      try {
        const response = await fetch("/api/verificaciones");
        const payload = (await response.json()) as VerificacionesPayload;
        if (!response.ok) {
          throw new Error(payload?.error || "No se pudo cargar el historial");
        }

        if (active) {
          setRecentVerifications(payload.recentVerifications || []);
        }
      } catch {
        if (active) {
          setRecentVerifications([]);
        }
      }
    };

    void loadRecent();

    return () => {
      active = false;
    };
  }, []);

  const verificarDocumento = async () => {
    if (!numeroDocumento.trim()) {
      toast.error("Ingresa un número para verificar");
      return;
    }

    setLoading(true);
    setResultado({
      tipo: tipoDocumento,
      numero: numeroDocumento,
      estado: "verificando",
      mensaje: "Verificando...",
      fuente: "Base interna TOCHI y validación de formato",
    });

    try {
      const response = await fetch("/api/verificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoDocumento,
          numeroDocumento,
        }),
      });

      const payload = (await response.json()) as VerificacionesPayload;
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo verificar el documento");
      }

      if (payload.result) {
        setResultado(payload.result);
      }

      setRecentVerifications(payload.recentVerifications || []);
      toast.success("Verificación completada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo verificar el documento");
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "valido":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "invalido":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "no_encontrado":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case "verificando":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "valido":
        return <Badge className="bg-green-100 text-green-800">Válido</Badge>;
      case "invalido":
        return <Badge className="bg-red-100 text-red-800">No válido</Badge>;
      case "no_encontrado":
        return <Badge className="bg-yellow-100 text-yellow-800">No encontrado</Badge>;
      case "verificando":
        return <Badge className="bg-blue-100 text-blue-800">Verificando...</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificador de Documentos</h1>
        <p className="text-muted-foreground">
          Verifica cédulas, NIT, tarjetas profesionales y radicados con trazabilidad interna.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Verificar documento
              </CardTitle>
              <CardDescription>
                Ingresa los datos del documento a revisar y TOCHI consultará la base interna.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cedula">Cédula de ciudadanía</SelectItem>
                    <SelectItem value="nit">NIT Empresa</SelectItem>
                    <SelectItem value="tarjeta_profesional">Tarjeta profesional abogado</SelectItem>
                    <SelectItem value="poder">Poder judicial</SelectItem>
                    <SelectItem value="sentencia">Número de sentencia</SelectItem>
                    <SelectItem value="radicado">Radicado judicial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {tipoDocumento === "cedula" && "Número de cédula"}
                  {tipoDocumento === "nit" && "Número de NIT"}
                  {tipoDocumento === "tarjeta_profesional" && "Número de tarjeta profesional"}
                  {tipoDocumento === "poder" && "Código de verificación del poder"}
                  {tipoDocumento === "sentencia" && "Número de sentencia"}
                  {tipoDocumento === "radicado" && "Número de radicado"}
                </Label>
                <Input
                  placeholder={
                    tipoDocumento === "cedula" ? "Ej: 1020304050" :
                    tipoDocumento === "nit" ? "Ej: 900123456-7" :
                    tipoDocumento === "tarjeta_profesional" ? "Ej: 123456" :
                    tipoDocumento === "poder" ? "Ej: ABC123XYZ" :
                    tipoDocumento === "sentencia" ? "Ej: T-123/2024" :
                    "Ej: 11001310300120240001500"
                  }
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verificarDocumento()}
                />
              </div>

              <Button
                className="w-full"
                onClick={verificarDocumento}
                disabled={loading || !numeroDocumento.trim()}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Verificar
              </Button>
            </CardContent>
          </Card>

          {resultado && (
            <Card
              className={
                resultado.estado === "valido" ? "border-green-200 bg-green-50" :
                resultado.estado === "invalido" ? "border-red-200 bg-red-50" :
                resultado.estado === "verificando" ? "border-blue-200 bg-blue-50" :
                "border-yellow-200 bg-yellow-50"
              }
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {getEstadoIcon(resultado.estado)}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium">Resultado</span>
                      {getEstadoBadge(resultado.estado)}
                    </div>
                    <p className="text-sm">{resultado.mensaje}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{resultado.fuente}</p>

                    {resultado.detalles && (
                      <div className="mt-4 space-y-2">
                        {Object.entries(resultado.detalles).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historial de verificaciones</CardTitle>
              <CardDescription>Las últimas consultas quedan registradas para auditoría interna.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentVerifications.length === 0 ? (
                <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Aún no hay verificaciones guardadas.
                </p>
              ) : (
                recentVerifications.map((item) => (
                  <div key={item._id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.numeroDocumento}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.tipoDocumento.replace("_", " ")}</p>
                      </div>
                      <Badge variant="outline">{new Date(item.createdAt).toLocaleString("es-CO")}</Badge>
                    </div>
                    <div className="mb-2">{getEstadoBadge(item.estado)}</div>
                    <p className="text-sm text-muted-foreground">{item.mensaje}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enlaces de verificación oficial</CardTitle>
              <CardDescription>
                Consulta directamente en las fuentes oficiales cuando necesites certificación externa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="https://www.registraduria.gov.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Registraduría Nacional</p>
                    <p className="text-sm text-muted-foreground">Verificar cédulas</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <a
                href="https://www.rues.org.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">RUES</p>
                    <p className="text-sm text-muted-foreground">Verificar empresas y NIT</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <a
                href="https://sirna.ramajudicial.gov.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">SIRNA</p>
                    <p className="text-sm text-muted-foreground">Verificar tarjetas profesionales</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <a
                href="https://consultaprocesos.ramajudicial.gov.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Rama Judicial</p>
                    <p className="text-sm text-muted-foreground">Verificar procesos y sentencias</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <a
                href="https://www.notinet.com.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Notinet Legal</p>
                    <p className="text-sm text-muted-foreground">Verificar normas vigentes</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Aviso importante</p>
                  <p className="mt-1 text-amber-700">
                    Esta herramienta hace validación de referencia y trazabilidad interna. Para certificaciones
                    oficiales, consulta directamente las entidades correspondientes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
