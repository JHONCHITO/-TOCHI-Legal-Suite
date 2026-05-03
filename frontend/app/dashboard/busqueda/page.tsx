"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";

type ResultadoBusqueda = {
  tipo?: string;
  source?: string;
  codigo?: string;
  articulo?: string;
  titulo?: string;
  resumen?: string;
  enlace?: string;
  link?: string;
  fuente?: string;
  nombre?: string;
  score?: number;
};

type FuenteOficial = {
  fuente: string;
  titulo: string;
  link: string;
};

type RespuestaIA = {
  respuesta?: string;
  fuentes?: Array<{
    source?: string;
    codigo?: string;
    nombre?: string;
    articulo?: string;
    titulo?: string;
    score?: number;
  }>;
};

const sugerencias = [
  "debido proceso",
  "ley 200",
  "contrato de trabajo",
  "derecho de peticion",
  "nulidad y restablecimiento",
];

function buildSearchUrl(query: string) {
  const value = query.trim();
  return value ? `/dashboard/busqueda?q=${encodeURIComponent(value)}` : "/dashboard/busqueda";
}

export default function BusquedaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";

  const [query, setQuery] = useState(queryFromUrl);
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [fuentes, setFuentes] = useState<FuenteOficial[]>([]);
  const [respuestaIA, setRespuestaIA] = useState("");
  const [fuentesIA, setFuentesIA] = useState<RespuestaIA["fuentes"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const term = queryFromUrl.trim();

    if (!term) {
      setResultados([]);
      setFuentes([]);
      setRespuestaIA("");
      setFuentesIA([]);
      setError("");
      setLoading(false);
      return;
    }

    let active = true;

    const run = async () => {
      setLoading(true);
      setError("");

      const encoded = encodeURIComponent(term);

      const [internal, official, ai] = await Promise.all([
        fetch(`/api/busqueda?q=${encoded}`)
          .then(async (response) => (response.ok ? (response.json() as Promise<ResultadoBusqueda[]>) : []))
          .catch(() => []),
        fetch(`/api/fuentes?q=${encoded}`)
          .then(async (response) => (response.ok ? (response.json() as Promise<FuenteOficial[]>) : []))
          .catch(() => []),
        fetch("/api/consulta-ia", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pregunta: term }),
        })
          .then(async (response) => (response.ok ? (response.json() as Promise<RespuestaIA>) : null))
          .catch(() => null),
      ]);

      if (!active) {
        return;
      }

      setResultados(Array.isArray(internal) ? internal : []);
      setFuentes(Array.isArray(official) ? official : []);
      setRespuestaIA(typeof ai?.respuesta === "string" ? ai.respuesta : "");
      setFuentesIA(Array.isArray(ai?.fuentes) ? ai.fuentes : []);
      setError("");
      setLoading(false);
    };

    void run();

    return () => {
      active = false;
    };
  }, [queryFromUrl]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.replace(buildSearchUrl(query), { scroll: false });
  };

  const resultadosIAs = fuentesIA ?? [];

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-background to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Busqueda juridica real
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Busca normas, articulos y respuesta IA en un solo lugar</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Consultamos la base local, MongoDB, la biblioteca vectorizada y fuentes oficiales para que la pantalla no se quede vacia.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[430px]">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Resultados internos</p>
                  <p className="text-2xl font-bold">{resultados.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Fuentes oficiales</p>
                  <p className="text-2xl font-bold">{fuentes.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">IA consultada</p>
                  <p className="text-2xl font-bold">{respuestaIA ? "Si" : "No"}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Busca por articulo, tema, norma, sentencia o palabra clave"
                className="h-12 pl-10 text-base"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-11">
                <Search className="mr-2 h-4 w-4" />
                Buscar en la suite
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => router.push("/dashboard/leyes", { scroll: false })}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Volver a codigos
              </Button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Sugerencias:</span>
            {sugerencias.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => router.replace(buildSearchUrl(item), { scroll: false })}
              >
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Procesando busqueda juridica...
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {queryFromUrl ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Respuesta de la IA</CardTitle>
              <CardDescription>
                La IA usa la base vectorizada y el contexto legal disponible para explicar la consulta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {respuestaIA ? (
                <>
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {respuestaIA}
                  </div>
                  {resultadosIAs.length ? (
                    <div className="flex flex-wrap gap-2">
                      {resultadosIAs.slice(0, 6).map((item, index) => (
                        <Badge key={`${item?.codigo || "fuente"}-${item?.articulo || index}`} variant="outline">
                          {item?.codigo || item?.nombre || "Fuente"}{item?.articulo ? ` - Art. ${item.articulo}` : ""}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Si no ves respuesta aqui, la consulta aun no encontro contexto vectorizado suficiente.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Resultados internos</CardTitle>
                <CardDescription>Coincidencias en MongoDB y en la biblioteca juridica local.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resultados.length ? (
                  resultados.map((item, index) => {
                    const href = item.enlace || item.link || "";
                    const label = item.tipo || item.source || item.fuente || "resultado";

                    return (
                      <div key={`${label}-${item.codigo || index}-${item.articulo || ""}`} className="rounded-lg border p-4 transition-colors hover:bg-muted/30">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{label}</Badge>
                              {item.codigo ? <Badge variant="outline">{item.codigo}</Badge> : null}
                              {item.articulo ? <Badge variant="outline">Art. {item.articulo}</Badge> : null}
                            </div>
                            <h3 className="text-base font-semibold">{item.titulo || item.nombre || item.fuente || "Resultado juridico"}</h3>
                            <p className="text-sm text-muted-foreground">{item.resumen || "Coincidencia encontrada en la base juridica."}</p>
                          </div>
                          {href ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={href}>
                                Abrir
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    No hubo coincidencias internas. Prueba una palabra clave mas especifica o sigue con la respuesta IA y las fuentes oficiales.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fuentes oficiales</CardTitle>
                  <CardDescription>Accesos directos para validar el texto completo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fuentes.length ? (
                    fuentes.map((item) => (
                      <a
                        key={`${item.fuente}-${item.titulo}`}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.fuente}</p>
                          <p className="text-xs text-muted-foreground">{item.titulo}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay fuentes cargadas todavia.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atajos juridicos</CardTitle>
                  <CardDescription>Abre la IA o los codigos desde esta busqueda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" asChild>
                    <Link href={`/dashboard/asistente?context=${encodeURIComponent(queryFromUrl)}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Preguntar a la IA
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/leyes">
                      <Scale className="mr-2 h-4 w-4" />
                      Volver a codigos legales
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Empieza una busqueda</CardTitle>
            <CardDescription>
              Puedes buscar por articulo, norma, codigo, tema o palabra clave y la IA devolvera contexto real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "Normativa",
                  subtitle: "Busca codigos, leyes y normas activas.",
                  icon: FileText,
                },
                {
                  title: "Jurisprudencia",
                  subtitle: "Consulta fuentes oficiales y relatorias.",
                  icon: BookOpen,
                },
                {
                  title: "IA vectorizada",
                  subtitle: "Responde con el contexto cargado en MongoDB.",
                  icon: Sparkles,
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border p-4">
                  <item.icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                "debido proceso",
                "contrato de trabajo",
                "nulidad y restablecimiento",
                "articulo 1502",
              ].map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.replace(buildSearchUrl(item), { scroll: false })}
                >
                  {item}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
