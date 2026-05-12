"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Layers3,
  ListOrdered,
  Loader2,
  MessageSquare,
  Scale,
  Search,
  Star,
} from "lucide-react";
import {
  getCodigoLegal,
  getLegalCodeContent,
  getOfficialLegalResources,
  toLegalSlug,
} from "@/lib/legal-library";

type ViewerArticle = {
  number: string;
  title: string;
  content: string;
  libro?: string;
  capitulo?: string;
  seccion?: string;
  sectionLabel?: string;
};

type ViewerResource = {
  label: string;
  url: string;
};

type DraftSource = {
  source?: string;
  codigo?: string;
  nombre?: string;
  articulo?: string;
  titulo?: string;
  score?: number;
  url?: string;
};

type JurisprudenceItem = {
  title?: string;
  court?: string;
  citation?: string;
  date?: string;
  holding?: string;
  relevance?: string;
  url?: string;
  source?: string;
};

type JurisprudenceSource = {
  title: string;
  url: string;
  source?: string;
};

type JurisprudenceArticle = {
  number: string;
  title: string;
  content: string;
  libro?: string;
  capitulo?: string;
  seccion?: string;
  sectionLabel?: string;
};

type JurisprudenceResponse = {
  codigo: string;
  nombre: string;
  articulo: JurisprudenceArticle;
  summary: string;
  jurisprudence: JurisprudenceItem[];
  sources: JurisprudenceSource[];
  resources?: ViewerResource[];
  usedWebSearch: boolean;
  fallback: boolean;
  model: string;
  generatedAt: string;
};

export interface LegalCodeListItem {
  _id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  year: number;
  source?: "db" | "local";
  articles: Array<{
    number: string;
    title: string;
    content: string;
  }>;
}

export interface LegalCodeDetailItem extends Omit<LegalCodeListItem, "description"> {
  description?: string;
  resources?: ViewerResource[];
  articles: Array<ViewerArticle>;
}

type Props = {
  code: LegalCodeListItem;
  detail: LegalCodeDetailItem | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onToggleFavorite?: (codeId: string) => void;
  favorite?: boolean;
};

function normalizeArticle(article: ViewerArticle) {
  return {
    number: article.number,
    title: article.title || `Articulo ${article.number}`,
    content: article.content || "Contenido no disponible.",
    libro: article.libro,
    capitulo: article.capitulo,
    seccion: article.seccion,
    sectionLabel: article.sectionLabel || buildSectionLabel(article),
  };
}

function buildSectionLabel(article: ViewerArticle) {
  const parts = [article.libro, article.capitulo, article.seccion].filter(Boolean);
  return parts.length ? parts.join(" / ") : "General";
}

function buildAnchor(value: string, index: number) {
  return `${value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${index}`;
}

function normalizeTokens(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && !["del", "las", "los", "una", "uno", "por", "para", "con", "art", "codigo", "ley"].includes(item));
}

function buildDraftPrompt(codeName: string, article: ViewerArticle | null, mode: "resumen" | "borrador" | "riesgos") {
  const articleBlock = article
    ? [
        `Articulo activo: ${article.number}`,
        `Titulo: ${article.title}`,
        article.sectionLabel ? `Seccion: ${article.sectionLabel}` : null,
        "",
        article.content,
      ]
        .filter(Boolean)
        .join("\n")
    : "No hay articulo activo.";

  const instructionByMode = {
    resumen: "Haz un resumen ejecutivo, claro y tecnico, del articulo y explica su alcance practico para un abogado litigante.",
    borrador: "Redacta un borrador juridico profesional y estructurado que pueda servir como base de escrito, concepto o estrategia.",
    riesgos: "Identifica riesgos juridicos, puntos de discusion, excepciones, vacios probatorios y alertas de uso practico.",
  }[mode];

  return [
    `Eres un abogado colombiano experto en litigio y redaccion juridica.`,
    `Codigo: ${codeName}`,
    articleBlock,
    "",
    instructionByMode,
    "Responde en espanol, con formato ordenado y con conclusiones accionables.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function LegalCodeDetailView({
  code,
  detail,
  loading,
  error,
  onBack,
  onToggleFavorite,
  favorite,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedArticle, setCopiedArticle] = useState<string | null>(null);
  const [activeArticleNumber, setActiveArticleNumber] = useState<string | null>(null);
  const [draftMode, setDraftMode] = useState<"resumen" | "borrador" | "riesgos">("borrador");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [draftSources, setDraftSources] = useState<DraftSource[]>([]);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [jurisprudenceCache, setJurisprudenceCache] = useState<Record<string, JurisprudenceResponse>>({});
  const [jurisprudenceLoading, setJurisprudenceLoading] = useState(false);
  const [jurisprudenceError, setJurisprudenceError] = useState<string | null>(null);

  const codeData = useMemo(() => getCodigoLegal(code.code), [code.code]);
  const localContent = useMemo(
    () => (codeData ? getLegalCodeContent(codeData.codigo) : null),
    [codeData]
  );

  const officialResources = useMemo<ViewerResource[]>(() => {
    if (detail?.resources?.length) {
      return detail.resources;
    }

    if (!codeData) {
      return [];
    }

    return getOfficialLegalResources(codeData).map((resource) => ({
      label: resource.label,
      url: resource.url,
    }));
  }, [codeData, detail]);

  const articles = useMemo<ViewerArticle[]>(() => {
    if (detail?.articles?.length) {
      return detail.articles.map(normalizeArticle);
    }

    if (localContent?.articulos?.length) {
      return localContent.articulos
        .filter((article) => Boolean(article.numero))
        .map((article) =>
          normalizeArticle({
            number: article.numero,
            title: article.epigrafe || article.titulo || `Articulo ${article.numero}`,
            content: article.contenido || article.resumen,
            libro: article.libro,
            capitulo: article.capitulo,
          } as ViewerArticle)
        );
    }

    return code.articles
      .filter((article) => Boolean(article.number))
      .map((article) =>
        normalizeArticle({
          number: article.number,
          title: article.title,
          content: article.content,
        })
      );
  }, [code.articles, detail, localContent]);

  useEffect(() => {
    if (!articles.length) {
      setActiveArticleNumber(null);
      return;
    }

    setActiveArticleNumber((current) => {
      if (current && articles.some((article) => article.number === current)) {
        return current;
      }

      return articles[0].number;
    });
  }, [articles]);

  const selectedArticle = useMemo(() => {
    if (!articles.length) {
      return null;
    }

    return articles.find((article) => article.number === activeArticleNumber) || articles[0];
  }, [activeArticleNumber, articles]);

  useEffect(() => {
    if (!selectedArticle) {
      setDraftPrompt("");
      return;
    }

    setDraftPrompt(buildDraftPrompt(code.name, selectedArticle, draftMode));
  }, [code.name, draftMode, selectedArticle]);

  useEffect(() => {
    if (!selectedArticle) {
      setJurisprudenceLoading(false);
      setJurisprudenceError(null);
      return;
    }

    if (jurisprudenceCache[selectedArticle.number]) {
      setJurisprudenceLoading(false);
      setJurisprudenceError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setJurisprudenceLoading(true);
    setJurisprudenceError(null);

    const loadJurisprudence = async () => {
      try {
        const response = await fetch(
          `/api/legal-codes/${code.code}/jurisprudencia?articulo=${encodeURIComponent(selectedArticle.number)}&titulo=${encodeURIComponent(selectedArticle.title)}`,
          { signal: controller.signal }
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "No se pudo consultar la jurisprudencia");
        }

        if (!active) {
          return;
        }

        setJurisprudenceCache((current) => ({
          ...current,
          [selectedArticle.number]: payload as JurisprudenceResponse,
        }));
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return;
        }

        setJurisprudenceError(error instanceof Error ? error.message : "No se pudo consultar la jurisprudencia");
      } finally {
        if (active && !controller.signal.aborted) {
          setJurisprudenceLoading(false);
        }
      }
    };

    void loadJurisprudence();

    return () => {
      active = false;
      controller.abort();
    };
  }, [code.code, jurisprudenceCache, selectedArticle?.number, selectedArticle?.title]);

  const relatedArticles = useMemo(() => {
    if (!selectedArticle) {
      return [];
    }

    const selectedSection = buildSectionLabel(selectedArticle);
    const selectedTokens = new Set(
      normalizeTokens(
        [
          selectedArticle.number,
          selectedArticle.title,
          selectedArticle.content,
          selectedArticle.sectionLabel,
          selectedSection,
        ]
          .filter(Boolean)
          .join(" ")
      )
    );

    return articles
      .filter((article) => article.number !== selectedArticle.number)
      .map((article) => {
        const articleTokens = normalizeTokens(
          [
            article.number,
            article.title,
            article.content,
            article.sectionLabel,
            buildSectionLabel(article),
          ]
            .filter(Boolean)
            .join(" ")
        );

        let score = 0;
        if (buildSectionLabel(article) === selectedSection) {
          score += 10;
        }

        for (const token of articleTokens) {
          if (selectedTokens.has(token)) {
            score += token.length > 5 ? 2 : 1;
          }
        }

        return { article, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.article);
  }, [articles, selectedArticle]);

  const filteredArticles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return articles;
    }

    return articles.filter((article) => {
      const haystack = [
        article.number,
        article.title,
        article.content,
        article.libro,
        article.capitulo,
        article.seccion,
        buildSectionLabel(article),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [articles, searchTerm]);

  useEffect(() => {
    if (!filteredArticles.length) {
      return;
    }

    setActiveArticleNumber((current) => {
      if (current && filteredArticles.some((article) => article.number === current)) {
        return current;
      }

      return filteredArticles[0].number;
    });
  }, [filteredArticles]);

  const currentJurisprudence = selectedArticle ? jurisprudenceCache[selectedArticle.number] || null : null;

  const sections = useMemo(() => {
    const groups = new Map<string, { id: string; label: string; articles: ViewerArticle[] }>();

    filteredArticles.forEach((article) => {
      const label = buildSectionLabel(article);
      const current = groups.get(label) || {
        id: buildAnchor(label, groups.size),
        label,
        articles: [],
      };

      current.articles.push(article);
      groups.set(label, current);
    });

    return Array.from(groups.values());
  }, [filteredArticles]);

  const description =
    detail?.description ||
    localContent?.descripcion ||
    code.description ||
    "Explora el codigo, sus articulos completos y las fuentes oficiales.";

  const notes = localContent?.notas || [];
  const totalArticles = articles.length;
  const totalSections = sections.length;
  const sourceLabel = (detail?.source || code.source) === "db" ? "BD sincronizada" : "Fallback local";

  const copyToClipboard = async (text: string, articleNum: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedArticle(articleNum);
    setTimeout(() => setCopiedArticle(null), 2000);
  };

  const generateDraft = async () => {
    if (!selectedArticle) {
      return;
    }

    setDraftLoading(true);
    setDraftError(null);

    try {
      const response = await fetch("/api/consulta-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pregunta: draftPrompt,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo generar el borrador");
      }

      setDraftAnswer(typeof payload?.respuesta === "string" ? payload.respuesta : "");
      setDraftSources(Array.isArray(payload?.fuentes) ? payload.fuentes : []);
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : "No se pudo generar el borrador");
      setDraftAnswer("");
      setDraftSources([]);
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" className="h-auto px-0 text-muted-foreground" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la biblioteca
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{code.name}</h1>
          <p className="text-muted-foreground">{codeData?.numeroNorma || code.description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{codeData?.nombreCorto || code.code}</Badge>
            <Badge variant={detail?.articles?.length ? "default" : "secondary"}>
              {detail?.articles?.length ? "Contenido completo" : "Vista local"}
            </Badge>
            <Badge variant="outline">{sourceLabel}</Badge>
            {code.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/asistente?context=${toLegalSlug(code.code)}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Consultar IA
            </Link>
          </Button>
          {onToggleFavorite ? (
            <Button variant="outline" onClick={() => onToggleFavorite(code._id)}>
              <Star className={`mr-2 h-4 w-4 ${favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              {favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {error}. Se muestra el respaldo local mientras se corrige la conexion.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Vista completa del codigo
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Articulos</p>
            <p className="mt-1 text-2xl font-bold">{totalArticles}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Secciones</p>
            <p className="mt-1 text-2xl font-bold">{totalSections}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Fuentes</p>
            <p className="mt-1 text-2xl font-bold">{officialResources.length}</p>
          </div>
          {notes.length ? (
            <div className="md:col-span-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              {notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Busqueda dentro del codigo</CardTitle>
              <CardDescription>
                Filtra por articulo, titulo, contenido o seccion. Todo el texto cargado queda visible aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ej: 1502, debido proceso, libro cuarto, tutela"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/asistente?context=${toLegalSlug(code.code)}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Abrir IA
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={officialResources[0]?.url || "#"} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Fuente oficial
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {sections.length ? (
            <div className="space-y-4">
              {sections.map((section) => (
                <Card key={section.id} id={section.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Layers3 className="h-4 w-4 text-primary" />
                          {section.label}
                        </CardTitle>
                        <CardDescription>
                          {section.articles.length} articulo{section.articles.length === 1 ? "" : "s"}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{section.articles.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.articles.map((article) => {
                      const isActive = activeArticleNumber === article.number;

                      return (
                      <div
                        key={`${section.id}-${article.number}`}
                        className={`rounded-2xl border p-4 transition-colors ${
                          isActive ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40"
                        } cursor-pointer`}
                        onClick={() => setActiveArticleNumber(article.number)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">Art. {article.number}</Badge>
                              <span className="font-medium">{article.title}</span>
                              {isActive ? <Badge variant="secondary">Activo</Badge> : null}
                            </div>
                            {article.libro || article.capitulo || article.seccion ? (
                              <p className="text-xs text-muted-foreground">
                                {[article.libro, article.capitulo, article.seccion].filter(Boolean).join(" / ")}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(event) => {
                                event.stopPropagation();
                                void copyToClipboard(article.content, article.number);
                              }}
                            >
                              {copiedArticle === article.number ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {article.content}
                        </p>
                      </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-8 w-8 text-muted-foreground" />
                <h3 className="font-medium">No hay articulos para mostrar</h3>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Intenta con otra busqueda o revisa la fuente oficial desde la columna derecha.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListOrdered className="h-4 w-4" />
                Indice rapido
              </CardTitle>
              <CardDescription>Salta a cada seccion y revisa el contenido completo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{section.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {section.articles
                        .slice(0, 4)
                        .map((article) => `Art. ${article.number}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <Badge variant="secondary">{section.articles.length}</Badge>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Articulo activo</CardTitle>
              <CardDescription>
                El artículo seleccionado alimenta el borrador IA y las referencias relacionadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedArticle ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Art. {selectedArticle.number}</Badge>
                    {selectedArticle.sectionLabel ? (
                      <Badge variant="secondary">{selectedArticle.sectionLabel}</Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedArticle.title}</p>
                    <p className="max-h-56 whitespace-pre-wrap overflow-auto text-sm leading-relaxed text-muted-foreground">
                      {selectedArticle.content}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedArticle.content, selectedArticle.number)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar articulo
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/busqueda?q=${encodeURIComponent(`${code.name} ${selectedArticle.number}`)}`}>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar jurisprudencia
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Selecciona un artículo para trabajarlo como expediente.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jurisprudencia automatica</CardTitle>
              <CardDescription>
                Se actualiza con el articulo activo y prioriza decisiones oficiales directamente relacionadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedArticle ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Art. {selectedArticle.number}</Badge>
                    {currentJurisprudence?.fallback ? <Badge variant="secondary">Respaldo local</Badge> : null}
                    {currentJurisprudence?.usedWebSearch ? <Badge variant="secondary">Busqueda oficial</Badge> : null}
                    {!currentJurisprudence && !jurisprudenceLoading ? <Badge variant="outline">Pendiente</Badge> : null}
                  </div>

                  {jurisprudenceLoading && !currentJurisprudence ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Consultando jurisprudencia oficial...
                    </div>
                  ) : null}

                  {jurisprudenceError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {jurisprudenceError}
                    </div>
                  ) : null}

                  {currentJurisprudence ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumen jurisprudencial</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                          {currentJurisprudence.summary}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {currentJurisprudence.jurisprudence.length ? (
                          currentJurisprudence.jurisprudence.map((item, index) => (
                            <div key={`${item.citation || item.title || "jurisprudencia"}-${index}`} className="rounded-xl border p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="font-medium">{item.title || "Jurisprudencia relevante"}</p>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {item.court ? <span>{item.court}</span> : null}
                                    {item.citation ? <span>{item.citation}</span> : null}
                                    {item.date ? <span>{item.date}</span> : null}
                                  </div>
                                </div>
                                {item.url ? (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Abrir
                                    </a>
                                  </Button>
                                ) : null}
                              </div>
                              {item.holding ? (
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.holding}</p>
                              ) : null}
                              {item.relevance ? <p className="mt-2 text-sm leading-relaxed">{item.relevance}</p> : null}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                            No se encontraron decisiones concluyentes. La vista deja el resumen y las fuentes oficiales
                            para seguir investigando el articulo.
                          </div>
                        )}
                      </div>

                      {currentJurisprudence.sources?.length ? (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Fuentes consultadas</p>
                          <div className="space-y-2">
                            {currentJurisprudence.sources.slice(0, 4).map((source) => (
                              <a
                                key={`${source.url}-${source.title}`}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{source.title}</p>
                                  {source.source ? (
                                    <p className="truncate text-xs text-muted-foreground">{source.source}</p>
                                  ) : null}
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {currentJurisprudence.resources?.length ? (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Fuentes oficiales del codigo</p>
                          <div className="space-y-2">
                            {currentJurisprudence.resources.map((resource) => (
                              <a
                                key={resource.label}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
                              >
                                <span className="text-sm font-medium">{resource.label}</span>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      La jurisprudencia se cargara automaticamente cuando selecciones un articulo.
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Selecciona un articulo para ver jurisprudencia asociada.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relacionados</CardTitle>
              <CardDescription>Artículos con mayor cercanía por sección y contenido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedArticles.length ? (
                relatedArticles.map((article) => (
                  <button
                    key={article.number}
                    type="button"
                    className="flex w-full items-start justify-between rounded-xl border p-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => setActiveArticleNumber(article.number)}
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium">
                        Art. {article.number} {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {article.sectionLabel || buildSectionLabel(article)}
                      </p>
                    </div>
                    <Badge variant="secondary">Abrir</Badge>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No hay artículos relacionados suficientes para este caso.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Borrador IA</CardTitle>
              <CardDescription>Genera un resumen, concepto o escrito con contexto del artículo activo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={draftMode === "resumen" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDraftMode("resumen")}
                >
                  Resumen
                </Button>
                <Button
                  variant={draftMode === "borrador" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDraftMode("borrador")}
                >
                  Borrador
                </Button>
                <Button
                  variant={draftMode === "riesgos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDraftMode("riesgos")}
                >
                  Riesgos
                </Button>
              </div>
              <Textarea
                value={draftPrompt}
                onChange={(event) => setDraftPrompt(event.target.value)}
                rows={6}
                placeholder="Escribe aquí qué necesitas que la IA elabore..."
              />
              <Button className="w-full" onClick={() => void generateDraft()} disabled={draftLoading || !selectedArticle}>
                {draftLoading ? "Generando..." : "Generar borrador IA"}
              </Button>
              {draftError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {draftError}
                </div>
              ) : null}
              {draftAnswer ? (
                <div className="space-y-3 rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultado IA</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{draftAnswer}</p>
                </div>
              ) : null}
              {draftSources.length ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Fuentes usadas</p>
                  <div className="space-y-2">
                    {draftSources.slice(0, 4).map((source) => (
                      <div key={`${source.codigo || source.url || source.titulo}-${source.articulo || source.score || ""}`} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{source.nombre || source.codigo || "Fuente"}</p>
                        <p className="text-muted-foreground">
                          {source.articulo ? `Art. ${source.articulo}` : source.titulo || source.source || "Referencia"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fuentes oficiales</CardTitle>
              <CardDescription>Acceso directo al texto normativo y relatorias publicas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {officialResources.length ? (
                officialResources.map((resource) => (
                  <a
                    key={resource.label}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium">{resource.label}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No se encontraron fuentes oficiales enlazadas para este codigo.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones rapidas</CardTitle>
              <CardDescription>Usa este codigo en la IA, documentos y seguimiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href={`/dashboard/asistente?context=${toLegalSlug(code.code)}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Preguntar a la IA
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/documentos">
                  <FileText className="mr-2 h-4 w-4" />
                  Usar en documentos
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/notificaciones">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Ver alertas legales
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
