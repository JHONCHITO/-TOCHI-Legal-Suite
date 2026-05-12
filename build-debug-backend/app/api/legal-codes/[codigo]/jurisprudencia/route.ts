import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeAiQuery } from "@/lib/subscription";
import { buildLegalAssistantFallback } from "@/lib/services/legal-assistant-fallback";
import { searchSemanticLegalContent } from "@/lib/services/legal-vector-search";
import { buildLegalCodeDetail, findExactLegalArticle } from "@/lib/services/legal-catalog";

export const runtime = "nodejs";
export const maxDuration = 60;

const INTERNAL_ROLES = new Set(["superadmin", "admin", "abogado", "asistente"]);
const OFFICIAL_DOMAINS = [
  "suin-juriscol.gov.co",
  "secretariasenado.gov.co",
  "jurisprudencia.ramajudicial.gov.co",
  "corteconstitucional.gov.co",
];

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

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

function toJurisprudenceSources(items: Array<{ title: string; url: string; source?: string }>) {
  return items.map((item) => ({
    title: item.title,
    url: item.url,
    source: item.source,
  }));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

function extractResponseText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const textParts = output.flatMap((item: any) =>
    Array.isArray(item?.content)
      ? item.content
          .filter((content: any) => content?.type === "output_text" && content?.text)
          .map((content: any) => content.text)
      : []
  );

  return textParts.join("\n").trim();
}

function extractSources(payload: any) {
  const sources: JurisprudenceSource[] = [];
  const seen = new Set<string>();
  const output = Array.isArray(payload?.output) ? payload.output : [];

  for (const item of output) {
    if (item?.type === "web_search_call") {
      const sourceItems = item?.action?.sources;
      if (Array.isArray(sourceItems)) {
        for (const source of sourceItems) {
          if (source?.url && !seen.has(source.url)) {
            seen.add(source.url);
            sources.push({
              title: source.title || source.url,
              url: source.url,
              source: source.title || "web_search",
            });
          }
        }
      }
    }

    if (item?.type === "message" && Array.isArray(item?.content)) {
      for (const content of item.content) {
        const annotations = Array.isArray(content?.annotations) ? content.annotations : [];
        for (const annotation of annotations) {
          if (annotation?.type === "url_citation" && annotation?.url && !seen.has(annotation.url)) {
            seen.add(annotation.url);
            sources.push({
              title: annotation.title || annotation.url,
              url: annotation.url,
              source: annotation.title || "url_citation",
            });
          }
        }
      }
    }
  }

  return sources;
}

function dedupeSources(items: JurisprudenceSource[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeText(item.url || item.title);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeJurisprudenceItem(item: JurisprudenceItem) {
  return {
    title: item.title || "Jurisprudencia relevante",
    court: item.court || "Corte o tribunal no especificado",
    citation: item.citation || "",
    date: item.date || "",
    holding: item.holding || "",
    relevance: item.relevance || "",
    url: item.url || "",
    source: item.source || "web_search",
  };
}

function buildFallbackQuestion(codeName: string, articleNumber: string, articleTitle: string) {
  return [
    `Jurisprudencia precisa sobre el articulo ${articleNumber} del ${codeName}.`,
    articleTitle ? `Titulo: ${articleTitle}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildPrompt(codeName: string, codeLabel: string, articleNumber: string, articleTitle: string, articleText: string, sectionLabel: string) {
  return [
    `Codigo: ${codeLabel}`,
    `Nombre: ${codeName}`,
    `Articulo: ${articleNumber}`,
    articleTitle ? `Titulo: ${articleTitle}` : null,
    sectionLabel ? `Seccion: ${sectionLabel}` : null,
    "",
    "Texto completo del articulo:",
    articleText,
    "",
    "Busca jurisprudencia estrictamente relacionada con este articulo, no con temas generales.",
    "Prioriza decisiones oficiales que interpreten directamente la norma y explica por que cada una es relevante.",
    "Si un fallo es tangencial, descartalo.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const session = await auth();
    const role = session?.user ? (session.user.role || (session.user as { rol?: string }).rol || "") : "";
    if (!session?.user?.id || !INTERNAL_ROLES.has(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { codigo } = await params;
    const { searchParams } = new URL(request.url);
    const articulo = searchParams.get("articulo")?.trim();
    const titulo = searchParams.get("titulo")?.trim() || "";

    if (!articulo) {
      return NextResponse.json({ error: "Articulo requerido" }, { status: 400 });
    }

    const detail = await buildLegalCodeDetail(codigo);
    if (!detail) {
      return NextResponse.json({ error: "Codigo legal no encontrado" }, { status: 404 });
    }

    const selectedArticle =
      detail.articles.find((item) => normalizeText(item.number) === normalizeText(articulo)) ||
      null;

    const exactArticle = selectedArticle
      ? null
      : await findExactLegalArticle(`${detail.name} articulo ${articulo} ${titulo}`.trim());

    const article = selectedArticle || (exactArticle
      ? {
          number: exactArticle.articulo,
          title: exactArticle.titulo,
          content: exactArticle.contenido,
          libro: undefined,
          capitulo: undefined,
          seccion: undefined,
        }
      : null);

    if (!article) {
      return NextResponse.json({ error: "Articulo no encontrado" }, { status: 404 });
    }

    const sectionLabel = [article.libro, article.capitulo, article.seccion].filter(Boolean).join(" / ") || "General";
    const prompt = buildPrompt(detail.name, detail.code, article.number, article.title, article.content, sectionLabel);
    const fallbackQuestion = buildFallbackQuestion(detail.name, article.number, article.title);
    const semanticHits = await searchSemanticLegalContent(fallbackQuestion, 8).catch(() => []);
    const fallback = await buildLegalAssistantFallback(fallbackQuestion, {
      semanticHits,
      limit: 6,
    });

    if (!openai) {
      return NextResponse.json({
        codigo: detail.code,
        nombre: detail.name,
        articulo: {
          number: article.number,
          title: article.title,
          content: article.content,
          libro: article.libro,
          capitulo: article.capitulo,
          seccion: article.seccion,
          sectionLabel,
        },
        summary: fallback.message,
        jurisprudence: [],
        sources: toJurisprudenceSources(fallback.references),
        resources: detail.resources || [],
        usedWebSearch: false,
        fallback: true,
        model: fallback.model,
        generatedAt: new Date().toISOString(),
      });
    }

    try {
      await consumeAiQuery(session.user.id);
    } catch (limitError) {
      return NextResponse.json(
        { error: limitError instanceof Error ? limitError.message : "Limite de IA alcanzado" },
        { status: 403 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: `Eres un investigador de jurisprudencia colombiana para abogados.

Objetivo:
- Analizar el articulo exacto entregado.
- Encontrar jurisprudencia oficial directamente relacionada con ese articulo.
- Priorizar decisiones de la Corte Constitucional, Corte Suprema de Justicia, Consejo de Estado o la corporacion competente segun el tema.
- No inventar citas, fechas ni enlaces.
- Responder SOLO con JSON valido y sin markdown.

JSON esperado:
{
  "summary": "string",
  "jurisprudence": [
    {
      "title": "string",
      "court": "string",
      "citation": "string",
      "date": "YYYY-MM-DD",
      "holding": "string",
      "relevance": "string",
      "url": "https://..."
    }
  ],
  "sources": [
    {
      "title": "string",
      "url": "https://...",
      "source": "string"
    }
  ]
}

Reglas:
- Devuelve entre 2 y 5 decisiones como maximo, solo si son realmente pertinentes.
- Si no hay un fallo exacto, explica la linea jurisprudencial mas cercana y dilo con claridad.
- Usa preferentemente fuentes oficiales de Colombia.`,
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }],
          },
        ],
        tools: [
          {
            type: "web_search",
            user_location: {
              type: "approximate",
              country: "CO",
              city: "Bogota",
              region: "Bogota D.C.",
              timezone: "America/Bogota",
            },
            filters: {
              allowed_domains: OFFICIAL_DOMAINS,
            },
          },
        ],
        tool_choice: "auto",
        include: ["web_search_call.action.sources"],
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      return NextResponse.json({
        codigo: detail.code,
        nombre: detail.name,
        articulo: {
          number: article.number,
          title: article.title,
          content: article.content,
          libro: article.libro,
          capitulo: article.capitulo,
          seccion: article.seccion,
          sectionLabel,
        },
        summary: fallback.message,
        jurisprudence: [],
        sources: toJurisprudenceSources(fallback.references),
        resources: detail.resources || [],
        usedWebSearch: false,
        fallback: true,
        model: fallback.model,
        generatedAt: new Date().toISOString(),
      });
    }

    const payload = await response.json();
    const text = extractResponseText(payload);
    const parsed = safeJsonParse<{
      summary?: string;
      jurisprudence?: JurisprudenceItem[];
      sources?: JurisprudenceSource[];
    }>(extractJsonObject(text));

    if (!parsed) {
      return NextResponse.json({
        codigo: detail.code,
        nombre: detail.name,
        articulo: {
          number: article.number,
          title: article.title,
          content: article.content,
          libro: article.libro,
          capitulo: article.capitulo,
          seccion: article.seccion,
          sectionLabel,
        },
        summary: fallback.message,
        jurisprudence: [],
        sources: fallback.references,
        resources: detail.resources || [],
        usedWebSearch: false,
        fallback: true,
        model: fallback.model,
        generatedAt: new Date().toISOString(),
      });
    }

    const responseSources = dedupeSources([
      ...(parsed.sources || []),
      ...extractSources(payload),
    ]);

    return NextResponse.json({
      codigo: detail.code,
      nombre: detail.name,
      articulo: {
        number: article.number,
        title: article.title,
        content: article.content,
        libro: article.libro,
        capitulo: article.capitulo,
        seccion: article.seccion,
        sectionLabel,
      },
      summary: parsed.summary || fallback.message,
      jurisprudence: Array.isArray(parsed.jurisprudence)
        ? parsed.jurisprudence.slice(0, 5).map(normalizeJurisprudenceItem)
        : [],
      sources: responseSources.length ? responseSources : toJurisprudenceSources(fallback.references),
      resources: detail.resources || [],
      usedWebSearch: true,
      fallback: false,
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en jurisprudencia automatica:", error);
    return NextResponse.json({ error: "Error al consultar jurisprudencia" }, { status: 500 });
  }
}
