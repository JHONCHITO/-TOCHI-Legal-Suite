"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  MessageSquare,
  Scale,
  Search,
  Star,
} from "lucide-react";
import {
  getCodigoLegal,
  getLegalCodeContent,
  getOfficialLegalResources,
  normalizeLegalSlug,
  toLegalSlug,
} from "@/lib/legal-library";

export default function CodigoDetailPage() {
  const params = useParams<{ codigo: string }>();
  const slug = normalizeLegalSlug(params.codigo);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedArticle, setCopiedArticle] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const codigoData = getCodigoLegal(slug);
  const content = codigoData ? getLegalCodeContent(codigoData.codigo) : undefined;

  const filteredArticles = useMemo(() => {
    const articles = content?.articulos ?? [];
    if (!searchQuery.trim()) {
      return articles;
    }

    const query = searchQuery.toLowerCase();
    return articles.filter(
      (article) =>
        article.numero.toLowerCase().includes(query) ||
        article.epigrafe.toLowerCase().includes(query) ||
        article.resumen.toLowerCase().includes(query) ||
        article.palabrasClave?.some((item) => item.toLowerCase().includes(query))
    );
  }, [content, searchQuery]);

  const groupedArticles = useMemo(() => {
    return filteredArticles.reduce<Record<string, typeof filteredArticles>>((acc, article) => {
      const key = article.titulo || "General";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(article);
      return acc;
    }, {});
  }, [filteredArticles]);

  useEffect(() => {
    setExpandedSections(new Set(Object.keys(groupedArticles)));
  }, [slug, groupedArticles]);

  const toggleSection = (section: string) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, articleNum: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedArticle(articleNum);
    setTimeout(() => setCopiedArticle(null), 2000);
  };

  if (!codigoData) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Scale className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Codigo no encontrado</h2>
        <p className="mb-4 text-muted-foreground">
          El slug `{slug}` no coincide con un codigo cargado en la suite.
        </p>
        <Button asChild>
          <Link href="/dashboard/leyes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Base Juridica
          </Link>
        </Button>
      </div>
    );
  }

  const officialResources = getOfficialLegalResources(codigoData);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/leyes" className="hover:text-foreground">
              Base Juridica
            </Link>
            <span>/</span>
            <span>{codigoData.nombreCorto}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{codigoData.nombre}</h1>
          <p className="text-muted-foreground">{codigoData.numeroNorma}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{codigoData.nombreCorto}</Badge>
            <Badge variant={content ? "default" : "secondary"}>
              {content ? "Resumen local cargado" : "Solo fuentes oficiales"}
            </Badge>
            {codigoData.areasDelDerecho.map((area) => (
              <Badge key={area} variant="secondary">
                {area}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/leyes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/asistente?context=${toLegalSlug(codigoData.codigo)}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Consultar IA
            </Link>
          </Button>
          {codigoData.urlSenado && (
            <Button variant="outline" size="sm" asChild>
              <a href={codigoData.urlSenado} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver fuente oficial
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Entidad emisora</p>
                <p className="font-medium">{codigoData.entidadEmisora}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{codigoData.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado del contenido</p>
                <p className="font-medium">
                  {content ? `${content.articulos.length} extractos disponibles` : "Pendiente de sincronizar"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consulta recomendada</p>
                <p className="font-medium">
                  {content ? "Busqueda local + fuente oficial" : "Fuente oficial"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Busqueda dentro del codigo</CardTitle>
              <CardDescription>
                Busca por articulo, epigrafe, tema o palabra clave.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Ej: 1502, debido proceso, justa causa, nulidad"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {content ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Resumen operativo del codigo</CardTitle>
                  <CardDescription>{content.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {content.temasClave.map((tema) => (
                      <Badge key={tema} variant="secondary">
                        {tema}
                      </Badge>
                    ))}
                  </div>
                  {content.notas?.length ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      {content.notas.map((nota) => (
                        <p key={nota}>{nota}</p>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <div className="space-y-4">
                {Object.entries(groupedArticles).map(([section, articles]) => (
                  <Card key={section}>
                    <CardHeader
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => toggleSection(section)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {expandedSections.has(section) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <CardTitle className="text-lg">{section}</CardTitle>
                        </div>
                        <Badge variant="secondary">{articles.length} articulos</Badge>
                      </div>
                    </CardHeader>
                    {expandedSections.has(section) ? (
                      <CardContent className="space-y-4 pt-0">
                        {articles.map((article) => (
                          <div
                            key={`${section}-${article.numero}`}
                            className="rounded-lg border p-4 transition-colors hover:border-primary/50"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">Art. {article.numero}</Badge>
                                  <span className="font-medium">{article.epigrafe}</span>
                                  {article.vigente ? (
                                    <Badge variant="secondary">Vigente</Badge>
                                  ) : (
                                    <Badge variant="destructive">Revisar vigencia</Badge>
                                  )}
                                </div>

                                {(article.libro || article.capitulo) && (
                                  <p className="text-xs text-muted-foreground">
                                    {[article.libro && `Libro ${article.libro}`, article.capitulo]
                                      .filter(Boolean)
                                      .join(" - ")}
                                  </p>
                                )}

                                {article.titulo ? (
                                  <p className="text-sm font-medium">{article.titulo}</p>
                                ) : null}

                                <p className="text-sm leading-relaxed text-muted-foreground">
                                  {article.contenido ?? article.resumen}
                                </p>

                                {article.palabrasClave?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {article.palabrasClave.map((item) => (
                                      <Badge key={item} variant="outline" className="text-xs">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    copyToClipboard(
                                      `Art. ${article.numero} - ${article.epigrafe}\n${article.resumen}`,
                                      article.numero
                                    )
                                  }
                                >
                                  {copiedArticle === article.numero ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Star className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    ) : null}
                  </Card>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="mb-4 h-8 w-8 text-muted-foreground" />
                    <h3 className="font-medium">No se encontraron resultados locales</h3>
                    <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                      Cambia el termino de busqueda o abre la fuente oficial para revisar el articulado completo.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Contenido local pendiente</CardTitle>
                <CardDescription>
                  Este codigo ya esta indexado en la suite, pero aun no tiene extractos locales cargados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Mientras cargamos el contenido estructurado, puedes usar las fuentes oficiales de SUIN y Senado
                  para revisar el texto completo sin quedarte en una pagina vacia.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {officialResources.map((resource) => (
                    <a
                      key={resource.label}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{resource.label}</p>
                        <p className="text-sm text-muted-foreground">{codigoData.numeroNorma}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fuentes oficiales</CardTitle>
              <CardDescription>Acceso directo al texto normativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {officialResources.map((resource) => (
                <a
                  key={resource.label}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{resource.label}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones rapidas</CardTitle>
              <CardDescription>Usa este codigo en el resto de la suite.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href={`/dashboard/asistente?context=${toLegalSlug(codigoData.codigo)}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Preguntar a la IA
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/documentos">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Usar en documentos
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/notificaciones">
                  <Star className="mr-2 h-4 w-4" />
                  Ver alertas legales
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cobertura</CardTitle>
              <CardDescription>Resumen del contenido cargado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Areas del derecho</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {codigoData.areasDelDerecho.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Extractos disponibles</p>
                <p className="text-lg font-semibold">{content?.articulos.length ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
