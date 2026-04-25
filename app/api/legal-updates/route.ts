import {
  getAreaDefinition,
  getFallbackLegalUpdates,
  getMonitoringSourcesForArea,
  type LegalAreaKey,
} from "@/lib/legal-updates";

export const maxDuration = 60;

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const area = getAreaDefinition(searchParams.get("area")).key as LegalAreaKey;
  const fallback = getFallbackLegalUpdates(area);

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(fallback);
  }

  try {
    const areaDefinition = getAreaDefinition(area);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: `Eres un monitor juridico colombiano para una app de abogados.

Objetivo:
- Buscar novedades juridicas recientes y confiables para el area ${areaDefinition.label}.
- Limitarte a fuentes oficiales colombianas.
- Entregar SOLO un JSON valido sin markdown.

JSON esperado:
{
  "summary": "string",
  "legalUpdates": [
    {
      "title": "string",
      "type": "norma",
      "source": "string",
      "date": "YYYY-MM-DD",
      "summary": "string",
      "url": "https://...",
      "impact": "string"
    }
  ],
  "jurisprudenceUpdates": [
    {
      "title": "string",
      "type": "jurisprudencia",
      "source": "string",
      "date": "YYYY-MM-DD",
      "summary": "string",
      "url": "https://...",
      "impact": "string"
    }
  ]
}

Reglas:
- Maximo 4 normas y 4 decisiones jurisprudenciales.
- Si no encuentras novedades verificables muy recientes, usa fuentes oficiales permanentes y dilo en el summary.
- No inventes fechas, URLs ni sentencias.
- El area tiene estos focos: ${areaDefinition.keywords.join(", ")}.`,
        input: `Busca novedades oficiales para el area ${areaDefinition.label} en Colombia, con enfoque en normas y jurisprudencia recientes o vigentes de consulta diaria.`,
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
              allowed_domains: [
                "suin-juriscol.gov.co",
                "secretariasenado.gov.co",
                "jurisprudencia.ramajudicial.gov.co",
                "corteconstitucional.gov.co",
              ],
            },
          },
        ],
        tool_choice: "auto",
      }),
      signal: req.signal,
    });

    if (!response.ok) {
      return Response.json(fallback);
    }

    const payload = await response.json();
    const text =
      (typeof payload?.output_text === "string" && payload.output_text) ||
      payload?.output?.flatMap((item: any) =>
        Array.isArray(item?.content)
          ? item.content
              .filter((content: any) => content?.type === "output_text")
              .map((content: any) => content.text)
          : []
      )?.join("\n") ||
      "";

    const parsed = safeJsonParse<{
      summary?: string;
      legalUpdates?: typeof fallback.legalUpdates;
      jurisprudenceUpdates?: typeof fallback.jurisprudenceUpdates;
    }>(extractJsonObject(text));

    if (!parsed) {
      return Response.json(fallback);
    }

    return Response.json({
      area,
      generatedAt: new Date().toISOString(),
      summary: parsed.summary || fallback.summary,
      legalUpdates: parsed.legalUpdates?.length ? parsed.legalUpdates : fallback.legalUpdates,
      jurisprudenceUpdates: parsed.jurisprudenceUpdates?.length
        ? parsed.jurisprudenceUpdates
        : fallback.jurisprudenceUpdates,
      monitoringLinks: getMonitoringSourcesForArea(area),
      usedFallback: false,
    });
  } catch (error) {
    console.error("Error en /api/legal-updates:", error);
    return Response.json(fallback);
  }
}
