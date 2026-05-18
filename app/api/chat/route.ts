import { CODIGOS_COLOMBIANOS } from "@/lib/types";
import { getFallbackLegalUpdates } from "@/lib/legal-updates";
import { buildLegalAssistantFallback } from "@/lib/services/legal-assistant-fallback";
import { findExactLegalArticle } from "@/lib/services/legal-catalog";
import { sanitizeLegalAiResponse } from "@/lib/ai-response";

export const maxDuration = 60;

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

const OFFICIAL_DOMAINS = [
  "suin-juriscol.gov.co",
  "secretariasenado.gov.co",
  "jurisprudencia.ramajudicial.gov.co",
  "corteconstitucional.gov.co",
];

const LEGAL_SYSTEM_PROMPT = `Eres TOCHI Legal Assistant, un asistente legal especializado en derecho colombiano.

REGLAS:
- Responde siempre en espanol.
- Usa lenguaje tecnico, sobrio y profesional, propio de un despacho juridico.
- Estructura la respuesta con orden claro: conclusion breve, fundamento normativo, aplicacion al caso, riesgos o puntos de revision y siguiente paso practico.
- Cuando cites normas o sentencias, menciona la fuente oficial cuando sea posible.
- Si la pregunta implica actualidad, jurisprudencia reciente, normas nuevas o cambios recientes, prioriza informacion actual con fuentes oficiales colombianas.
- No inventes articulos ni sentencias.
- Si no hay certeza suficiente, dilo con precision y explica que extremo requiere verificacion adicional.
- No cierres con frases como "consulte con un abogado" o equivalentes.
- Si la respuesta lo permite, termina con una recomendacion util para el despacho: teoria del caso, matriz de pruebas, estrategia procesal, escrito sugerido, riesgo principal o accion inmediata.
- Si hace falta una precision adicional, formula una pregunta corta y relevante al final.

CODIGOS DISPONIBLES EN LA APP:
${CODIGOS_COLOMBIANOS.map((c) => `- ${c.nombre} (${c.nombreCorto})`).join("\n")}

FUENTES OFICIALES PRIORITARIAS:
- SUIN-Juriscol
- Secretaria del Senado
- Relatoria Rama Judicial
- Corte Constitucional`;

function needsOfficialWebSearch(text: string) {
  return /hoy|actual|actualizado|actualizada|actualizacion|actualización|reciente|recientes|nueva|nuevo|ultim|últim|jurisprudencia|sentencia|sentencias|leyes|modificaciones|modificacion|diario|diaria/i.test(
    text
  );
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

function formatSourceTitle(url: string, title?: string) {
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  const cleanUrl = typeof url === "string" ? url.trim() : "";

  if (
    cleanTitle &&
    cleanTitle !== cleanUrl &&
    !/^https?:\/\//i.test(cleanTitle) &&
    !cleanTitle.includes("?") &&
    !cleanTitle.includes("=") &&
    !/%[0-9a-f]{2}/i.test(cleanTitle)
  ) {
    return cleanTitle;
  }

  try {
    const parsed = new URL(cleanUrl, "https://tochi.local");
    const pathname = parsed.pathname.toLowerCase();
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const hostLabels: Record<string, string> = {
      "suin-juriscol.gov.co": "SUIN-Juriscol",
      "secretariasenado.gov.co": "Secretaria del Senado",
      "jurisprudencia.ramajudicial.gov.co": "Rama Judicial",
      "ramajudicial.gov.co": "Rama Judicial",
      "corteconstitucional.gov.co": "Corte Constitucional",
    };

    if (pathname.startsWith("/dashboard/busqueda")) {
      return "Busqueda interna";
    }

    if (pathname.startsWith("/dashboard/leyes/")) {
      return "Ficha normativa";
    }

    if (pathname.startsWith("/dashboard/")) {
      return "Referencia interna";
    }

    return hostLabels[host] || "Fuente oficial";
  } catch {
    return "Fuente oficial";
  }
}

function extractSources(payload: any) {
  const sources: Array<{ title: string; url: string }> = [];
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
              title: formatSourceTitle(source.url, source.title),
              url: source.url,
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
              title: formatSourceTitle(annotation.url, annotation.title),
              url: annotation.url,
            });
          }
        }
      }
    }
  }

  return sources.slice(0, 8);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatMessageInput[] = Array.isArray(body?.messages) ? body.messages : [];
    const latestUserMessage = [...messages].reverse().find((item) => item.role === "user");

    if (!latestUserMessage?.content?.trim()) {
      return Response.json({ error: "No se recibio una consulta valida." }, { status: 400 });
    }

    const exactArticle = await findExactLegalArticle(latestUserMessage.content);
    if (exactArticle) {
      const message = sanitizeLegalAiResponse([
        `${exactArticle.nombre} - Articulo ${exactArticle.articulo}`,
        exactArticle.titulo ? `Titulo: ${exactArticle.titulo}` : null,
        "",
        exactArticle.contenido,
        "",
        "La consulta se resolvio con el texto completo cargado en TOCHI.",
        "Siguiente paso sugerido: contrastar el texto con la fuente oficial enlazada y, si aplica, revisar jurisprudencia asociada.",
      ]
        .filter(Boolean)
        .join("\n"));

      return Response.json({
        message,
        respuesta: message,
        sources: [
          { title: `${exactArticle.nombre} - Art. ${exactArticle.articulo}`, url: exactArticle.url },
          ...exactArticle.resources,
        ],
        usedWebSearch: false,
        model: `exact-${exactArticle.source}`,
        fallback: false,
      });
    }

    const shouldSearchWeb = needsOfficialWebSearch(latestUserMessage.content);
    if (!process.env.OPENAI_API_KEY) {
      const fallback = await buildLegalAssistantFallback(latestUserMessage.content);
      return Response.json({
        message: sanitizeLegalAiResponse(fallback.message),
        respuesta: sanitizeLegalAiResponse(fallback.message),
        sources: fallback.references,
        usedWebSearch: false,
        model: fallback.model,
        fallback: fallback.fallback,
      });
    }

    const fallbackMonitor = getFallbackLegalUpdates("todas");

    const input = messages.map((message) => ({
      role: message.role,
      content: [{ type: "input_text", text: message.content }],
    }));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: `${LEGAL_SYSTEM_PROMPT}

CONTEXTO INTERNO DE LA APP:
- La app incluye una base juridica local con codigos colombianos.
- Existe un monitor de novedades por areas con este resumen base:
${fallbackMonitor.summary}

Cuando uses informacion de actualidad, devuelve tambien referencias claras a las fuentes oficiales consultadas.`,
        input,
        tools: shouldSearchWeb
          ? [
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
            ]
          : [],
        tool_choice: "auto",
        include: shouldSearchWeb ? ["web_search_call.action.sources"] : [],
      }),
      signal: req.signal,
    });

    if (!response.ok) {
      const fallback = await buildLegalAssistantFallback(latestUserMessage.content);
      return Response.json({
        message: sanitizeLegalAiResponse(fallback.message),
        respuesta: sanitizeLegalAiResponse(fallback.message),
        sources: fallback.references,
        usedWebSearch: false,
        model: fallback.model,
        fallback: fallback.fallback,
      });
    }

    const payload = await response.json();
    const message = extractResponseText(payload);
    const sources = extractSources(payload);

    if (!message) {
      const fallback = await buildLegalAssistantFallback(latestUserMessage.content);
      return Response.json({
        message: sanitizeLegalAiResponse(fallback.message),
        respuesta: sanitizeLegalAiResponse(fallback.message),
        sources: fallback.references,
        usedWebSearch: false,
        model: fallback.model,
        fallback: fallback.fallback,
      });
    }

    const sanitizedMessage = sanitizeLegalAiResponse(message);

    return Response.json({
      message: sanitizedMessage,
      respuesta: sanitizedMessage,
      sources,
      usedWebSearch: shouldSearchWeb,
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return Response.json(
      { error: "Error interno al procesar la consulta legal." },
      { status: 500 }
    );
  }
}
