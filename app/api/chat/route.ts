import { CODIGOS_COLOMBIANOS } from "@/lib/types";
import { getFallbackLegalUpdates } from "@/lib/legal-updates";
import { buildLegalAssistantFallback } from "@/lib/services/legal-assistant-fallback";

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
- Usa lenguaje claro y profesional.
- Cuando cites normas o sentencias, menciona la fuente oficial.
- Si la pregunta implica actualidad, jurisprudencia reciente, normas nuevas o cambios recientes, prioriza informacion actual con fuentes oficiales colombianas.
- No inventes articulos ni sentencias.
- Si no hay certeza suficiente, dilo claramente.
- Al final de respuestas juridicas complejas agrega: "Esta informacion es orientativa. Para casos especificos, consulte con un abogado."

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
              title: source.title || source.url,
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
              title: annotation.title || annotation.url,
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

    const shouldSearchWeb = needsOfficialWebSearch(latestUserMessage.content);
    if (!process.env.OPENAI_API_KEY) {
      const fallback = await buildLegalAssistantFallback(latestUserMessage.content);
      return Response.json({
        message: fallback.message,
        respuesta: fallback.message,
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
        message: fallback.message,
        respuesta: fallback.message,
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
        message: fallback.message,
        respuesta: fallback.message,
        sources: fallback.references,
        usedWebSearch: false,
        model: fallback.model,
        fallback: fallback.fallback,
      });
    }

    return Response.json({
      message,
      respuesta: message,
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
