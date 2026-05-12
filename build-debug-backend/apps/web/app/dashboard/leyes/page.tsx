"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CODIGOS_COLOMBIANOS } from "@/lib/types";
import { getLegalCodeContent, toLegalSlug } from "@/lib/legal-library";
import {
  BookOpen,
  Clock,
  ExternalLink,
  FileText,
  Gavel,
  Scale,
  Search,
  Star,
} from "lucide-react";

const recentSearches = [
  "1502 codigo civil",
  "debido proceso",
  "justa causa cst",
  "derecho de peticion cpaca",
];

const jurisprudenciaReciente = [
  {
    numero: "C-123/24",
    corte: "Corte Constitucional",
    tema: "Derechos fundamentales en el trabajo",
    fecha: "2024-01-15",
  },
  {
    numero: "SL-456/24",
    corte: "Corte Suprema - Sala Laboral",
    tema: "Indemnizacion por despido injusto",
    fecha: "2024-01-10",
  },
  {
    numero: "T-789/24",
    corte: "Corte Constitucional",
    tema: "Tutela contra empleador",
    fecha: "2024-01-05",
  },
];

export default function LeyesPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("todos");

  useEffect(() => {
    const incoming = searchParams.get("codigo") ?? searchParams.get("q") ?? "";
    if (incoming) {
      setSearchQuery(incoming);
    }
  }, [searchParams]);

  const areas = useMemo(
    () => ["todos", ...new Set(CODIGOS_COLOMBIANOS.flatMap((item) => item.areasDelDerecho))],
    []
  );

  const filteredCodigos = useMemo(() => {
    return CODIGOS_COLOMBIANOS.filter((codigo) => {
      const content = getLegalCodeContent(codigo.codigo);
      const hayContenidoLocal = content?.articulos ?? [];
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        !query ||
        codigo.nombre.toLowerCase().includes(query) ||
        codigo.nombreCorto.toLowerCase().includes(query) ||
        codigo.numeroNorma.toLowerCase().includes(query) ||
        codigo.areasDelDerecho.some((area) => area.toLowerCase().includes(query)) ||
        hayContenidoLocal.some(
          (articulo) =>
            articulo.numero.toLowerCase().includes(query) ||
            articulo.epigrafe.toLowerCase().includes(query) ||
            articulo.resumen.toLowerCase().includes(query) ||
            articulo.palabrasClave?.some((item) => item.toLowerCase().includes(query))
        );

      const matchesArea =
        selectedArea === "todos" ||
        codigo.areasDelDerecho.some(
          (area) => area.toLowerCase() === selectedArea.toLowerCase()
        );

      return matchesSearch && matchesArea;
    });
  }, [searchQuery, selectedArea]);

  const codigosConContenido = CODIGOS_COLOMBIANOS.filter((codigo) =>
    Boolean(getLegalCodeContent(codigo.codigo)?.articulos.length)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base Juridica Colombiana</h1>
          <p className="text-muted-foreground">
            Consulta codigos, resumentes operativos, jurisprudencia y fuentes oficiales.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Codigos y normas</p>
              <p className="text-2xl font-bold">{CODIGOS_COLOMBIANOS.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Con contenido local</p>
              <p className="text-2xl font-bold">{codigosConContenido}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Areas cubiertas</p>
              <p className="text-2xl font-bold">{areas.length - 1}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar codigos, articulos, temas o numero de norma"
                className="h-12 pl-10 text-base"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Button size="lg" className="h-12">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Recientes:</span>
            {recentSearches.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => setSearchQuery(item)}
              >
                <Clock className="mr-1 h-3 w-3" />
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="codigos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="codigos">
            <BookOpen className="mr-2 h-4 w-4" />
            Codigos
          </TabsTrigger>
          <TabsTrigger value="jurisprudencia">
            <Gavel className="mr-2 h-4 w-4" />
            Jurisprudencia
          </TabsTrigger>
          <TabsTrigger value="favoritos">
            <Star className="mr-2 h-4 w-4" />
            Favoritos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="codigos" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {areas.slice(0, 12).map((area) => (
              <Badge
                key={area}
                variant={selectedArea === area ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedArea(area)}
              >
                {area === "todos" ? "Todos" : area}
              </Badge>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCodigos.map((codigo) => {
              const content = getLegalCodeContent(codigo.codigo);
              const articleCount = content?.articulos.length ?? 0;

              return (
                <Link
                  key={codigo.codigo}
                  href={`/dashboard/leyes/${toLegalSlug(codigo.codigo)}`}
                >
                  <Card className="h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Scale className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Badge variant="outline">{codigo.nombreCorto}</Badge>
                          <Badge variant={articleCount > 0 ? "default" : "secondary"}>
                            {articleCount > 0 ? `${articleCount} extractos` : "Fuentes oficiales"}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="mt-3 text-base">{codigo.nombre}</CardTitle>
                      <CardDescription className="text-xs">
                        {codigo.numeroNorma}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {codigo.areasDelDerecho.slice(0, 3).map((area) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {content?.descripcion ??
                          "Explora la ficha del codigo, enlaces oficiales y herramientas de consulta juridica."}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{articleCount > 0 ? "Abrir resumen y articulos" : "Abrir fuentes y ficha"}</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {filteredCodigos.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-8 w-8 text-muted-foreground" />
                <h3 className="font-medium">Sin resultados</h3>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Prueba buscando por nombre del codigo, area del derecho o articulo clave como
                  `1502`, `29`, `62` o `derecho de peticion`.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jurisprudencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jurisprudencia Reciente</CardTitle>
              <CardDescription>Sentencias de consulta rapida para seguimiento.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jurisprudenciaReciente.map((sentencia) => (
                  <div
                    key={sentencia.numero}
                    className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="rounded-lg bg-chart-2/10 p-2">
                      <Gavel className="h-4 w-4 text-chart-2" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{sentencia.numero}</p>
                        <Badge variant="outline" className="text-xs">
                          {sentencia.corte}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{sentencia.tema}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{sentencia.fecha}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fuentes Oficiales</CardTitle>
              <CardDescription>Relatorias y fuentes publicas para investigacion.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    href: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/cc/index.xhtml",
                    title: "Corte Constitucional",
                    subtitle: "Sentencias C, T, SU",
                  },
                  {
                    href: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/csj/index.xhtml",
                    title: "Corte Suprema",
                    subtitle: "Casaciones y tutelas",
                  },
                  {
                    href: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml",
                    title: "Consejo de Estado",
                    subtitle: "Contencioso administrativo",
                  },
                ].map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="rounded-lg bg-chart-1/10 p-2">
                      <Gavel className="h-4 w-4 text-chart-1" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favoritos">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Sin favoritos aun</h3>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                Marca articulos o codigos desde el detalle para construir tu biblioteca de consulta rapida.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enlaces Oficiales</CardTitle>
          <CardDescription>Accede a normativa, jurisprudencia y datos abiertos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                href: "https://www.suin-juriscol.gov.co/",
                title: "SUIN-Juriscol",
                subtitle: "Normativa nacional",
                icon: FileText,
              },
              {
                href: "http://www.secretariasenado.gov.co/senado/basedoc/",
                title: "Secretaria del Senado",
                subtitle: "Codigos y leyes",
                icon: BookOpen,
              },
              {
                href: "https://www.corteconstitucional.gov.co/",
                title: "Corte Constitucional",
                subtitle: "Jurisprudencia constitucional",
                icon: Gavel,
              },
              {
                href: "https://www.datos.gov.co/",
                title: "Datos Abiertos",
                subtitle: "Fuentes publicas",
                icon: Scale,
              },
            ].map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
