"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Search,
  Scale,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { caseStatusLabels, formatDate, getClientDisplayName } from "@/lib/utils/format";
import { toast } from "sonner";

type SearchType = "radicado" | "cedula" | "nombre";

type ProcessResult = {
  caseId: string;
  numeroInterno: string;
  radicado: string;
  despacho: string;
  tipo: string;
  demandante: string;
  demandado: string;
  estado: string;
  fechaRadicacion?: string;
  ultimaActuacion?: string;
  ciudad?: string;
  officialUrl: string;
  source: string;
  matchedField: string;
};

type RecentSearch = {
  _id: string;
  searchType: SearchType;
  searchValue: string;
  resultsCount: number;
  createdAt: string;
};

type ProcessesPayload = {
  results: ProcessResult[];
  recentSearches: RecentSearch[];
  total: number;
};

async function fetcher(url: string) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "No se pudieron cargar los procesos");
  }
  return payload as ProcessesPayload;
}

export default function ConsultaProcesosPage() {
  const [searchType, setSearchType] = useState<SearchType>("radicado");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [lastQuery, setLastQuery] = useState<string>("");

  const loadRecentSearches = async () => {
    try {
      const response = await fetch("/api/processes");
      const payload = (await response.json()) as ProcessesPayload;
      if (!response.ok) {
        throw new Error("No se pudo cargar el historial");
      }
      setRecentSearches(payload.recentSearches || []);
    } catch {
      setRecentSearches([]);
    }
  };

  useEffect(() => {
    void loadRecentSearches();
  }, []);

  const handleSearch = async (valueOverride?: string, typeOverride?: SearchType) => {
    const queryValue = (valueOverride ?? searchValue).trim();
    const queryType = typeOverride ?? searchType;

    if (!queryValue) {
      toast.error("Ingresa un valor para buscar");
      return;
    }

    setLoading(true);
    setSearched(true);
    setLastQuery(queryValue);

    try {
      const response = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchType: queryType,
          searchValue: queryValue,
        }),
      });

      const payload = (await response.json()) as ProcessesPayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo consultar el proceso");
      }

      setResults(payload.results || []);
      setRecentSearches(payload.recentSearches || []);
      toast.success(payload.total ? `Se encontraron ${payload.total} coincidencias` : "Consulta completada sin coincidencias");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo consultar el proceso");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getStateBadge = (estado: string) => {
    const label = caseStatusLabels[estado] || estado;
    if (estado === "sentencia") {
      return <Badge className="bg-emerald-100 text-emerald-800">{label}</Badge>;
    }
    if (estado === "apelacion") {
      return <Badge className="bg-orange-100 text-orange-800">{label}</Badge>;
    }
    if (estado === "audiencia_pendiente" || estado === "en_tramite") {
      return <Badge className="bg-blue-100 text-blue-800">{label}</Badge>;
    }
    return <Badge variant="secondary">{label}</Badge>;
  };

  const searchSummary = useMemo(() => {
    if (!searched) {
      return "Busca por radicado, cedula/NIT o nombre de parte y TOCHI consultara tus expedientes cargados.";
    }

    if (!loading && results.length === 0) {
      return `No encontramos coincidencias para "${lastQuery}". Revisa el dato o usa el portal oficial para verificar manualmente.`;
    }

    return `Mostrando ${results.length} coincidencias para "${lastQuery}".`;
  }, [searched, loading, results.length, lastQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consulta de Procesos</h1>
        <p className="text-muted-foreground">
          Busca procesos en los expedientes internos de TOCHI y deja trazabilidad de cada consulta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar proceso
          </CardTitle>
          <CardDescription>
            TOCHI consulta primero la base interna de casos y conserva el historial de búsquedas para seguimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de búsqueda</Label>
              <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="radicado">Número de radicado</SelectItem>
                  <SelectItem value="cedula">Cédula / NIT</SelectItem>
                  <SelectItem value="nombre">Nombre de parte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>
                {searchType === "radicado"
                  ? "Número de radicado"
                  : searchType === "cedula"
                    ? "Número de cédula o NIT"
                    : "Nombre de parte"}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={
                    searchType === "radicado"
                      ? "Ej: 11001310300120240001500"
                      : searchType === "cedula"
                        ? "Ej: 1020304050"
                        : "Ej: Juan Perez"
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={() => void handleSearch()} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium mb-1">Cobertura real de TOCHI</p>
            <p className="text-muted-foreground">
              La consulta busca primero expedientes internos por radicado, proceso, cliente o parte contraria.
              Si no aparece coincidencia, puedes abrir la fuente oficial de la Rama Judicial.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados de la búsqueda</CardTitle>
              <CardDescription>{searchSummary}</CardDescription>
            </CardHeader>
            <CardContent>
              {!searched ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-medium">Aún no hay búsquedas</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Escribe un radicado, documento o nombre para consultar los expedientes cargados en TOCHI.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex h-[220px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Scale className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-medium">No se encontraron procesos</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Revisa el dato, prueba con otro criterio o contrástalo en la Rama Judicial.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((proceso) => (
                    <div key={proceso.caseId} className="rounded-lg border p-4">
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{proceso.source}</Badge>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                              {proceso.matchedField}
                            </Badge>
                          </div>
                          <div className="flex items-start gap-3">
                            <Scale className="mt-1 h-5 w-5 text-primary" />
                            <div>
                              <p className="font-mono text-sm font-medium">{proceso.radicado}</p>
                              <p className="text-sm text-muted-foreground">{proceso.despacho}</p>
                              <p className="text-xs text-muted-foreground">Interno: {proceso.numeroInterno}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {getStateBadge(proceso.estado)}
                          <Badge variant="outline">{proceso.tipo}</Badge>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Demandante</p>
                            <p className="font-medium">{proceso.demandante}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Demandado</p>
                            <p className="font-medium">{proceso.demandado}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Fecha de radicación</p>
                            <p className="font-medium">{proceso.fechaRadicacion ? formatDate(proceso.fechaRadicacion) : "Sin dato"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Ciudad</p>
                            <p className="font-medium">{proceso.ciudad || "Sin dato"}</p>
                          </div>
                        </div>
                      </div>

                      {proceso.ultimaActuacion ? (
                        <div className="mt-4 rounded-lg bg-muted/50 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Última actuación</p>
                          <p className="mt-1 text-sm">{proceso.ultimaActuacion}</p>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/casos/${proceso.caseId}`}>
                            <Clock className="mr-2 h-4 w-4" />
                            Abrir expediente
                          </Link>
                        </Button>
                        <Button asChild variant="secondary" size="sm">
                          <a href={proceso.officialUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ver en Rama Judicial
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial reciente</CardTitle>
              <CardDescription>Las últimas búsquedas quedan registradas para retomar consultas rápido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSearches.length === 0 ? (
                <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Aún no hay historial de consultas.
                </p>
              ) : (
                recentSearches.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => {
                      setSearchType(item.searchType);
                      setSearchValue(item.searchValue);
                      void handleSearch(item.searchValue, item.searchType);
                    }}
                    className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.searchValue}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.searchType} · {item.resultsCount} resultados
                        </p>
                      </div>
                      <Badge variant="outline">{new Date(item.createdAt).toLocaleDateString("es-CO")}</Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referencia oficial</CardTitle>
              <CardDescription>
                Si un expediente no está cargado en TOCHI, usa la fuente oficial para validar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="https://consultaprocesos.ramajudicial.gov.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">Consulta Procesos</p>
                  <p className="text-sm text-muted-foreground">Portal oficial de la Rama Judicial</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
