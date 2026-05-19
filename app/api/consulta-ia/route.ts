import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sanitizeLegalAiResponse } from "@/lib/ai-response";
import { consumeAiQuery } from "@/lib/subscription";
import { searchSemanticLegalContent } from "@/lib/services/legal-vector-search";
import { buildLegalAssistantFallback } from "@/lib/services/legal-assistant-fallback";
import { detectCode, extractArticleNumber, findExactLegalArticle } from "@/lib/services/legal-catalog";

export const runtime = "nodejs";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { pregunta } = await req.json();
    if (!pregunta || !String(pregunta).trim()) {
      return NextResponse.json({ error: "Pregunta vacia" }, { status: 400 });
    }

    const exactArticle = await findExactLegalArticle(pregunta);
    if (exactArticle) {
      const respuesta = [
        `${exactArticle.nombre} - Articulo ${exactArticle.articulo}`,
        exactArticle.titulo ? `Titulo: ${exactArticle.titulo}` : null,
        "",
        exactArticle.contenido,
        "",
        "La consulta se resolvio con el texto completo cargado en TOCHI.",
      ]
        .filter(Boolean)
        .join("\n");

      return NextResponse.json({
        respuesta,
        fuentes: [
          {
            source: exactArticle.source,
            codigo: exactArticle.codigo,
            nombre: exactArticle.nombre,
            articulo: exactArticle.articulo,
            titulo: exactArticle.titulo,
            url: exactArticle.url,
          },
          ...exactArticle.resources.map((resource) => ({
            source: "oficial",
            codigo: exactArticle.codigo,
            nombre: exactArticle.nombre,
            titulo: resource.label,
            url: resource.url,
          })),
        ],
        fallback: false,
        model: `exact-${exactArticle.source}`,
      });
    }

    const ranked = await searchSemanticLegalContent(pregunta, 8);
    const focusCode = detectCode(pregunta);
    const articleNumber = extractArticleNumber(pregunta);
    const normalizedArticle = articleNumber ? normalizeText(articleNumber) : "";
    const focusedRanked = focusCode
      ? ranked.filter((doc: any) => normalizeText(String(doc.codigo || "")) === normalizeText(focusCode.codigo))
      : ranked;
    const narrowedRanked = normalizedArticle
      ? focusedRanked.filter((doc: any) => {
          const docArticle = normalizeText(String(doc.articulo || ""));
          return docArticle === normalizedArticle;
      })
      : focusedRanked;

    if (!openai) {
      const fallback = await buildLegalAssistantFallback(pregunta, { semanticHits: narrowedRanked, limit: 6 });
      return NextResponse.json({
        respuesta: fallback.message,
        fuentes: fallback.references,
        fallback: fallback.fallback,
        model: fallback.model,
      });
    }

    if (!narrowedRanked.length) {
      const fallback = await buildLegalAssistantFallback(pregunta, { semanticHits: narrowedRanked, limit: 6 });
      return NextResponse.json({
        respuesta: fallback.message,
        fuentes: fallback.references,
        fallback: fallback.fallback,
        model: fallback.model,
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

    const contexto = narrowedRanked
      .map((doc: any, index: number) => {
        return `Fuente ${index + 1} (${doc.source}):
Norma: ${doc.titulo}
Codigo: ${doc.codigo}
Articulo: ${doc.articulo}
Titulo: ${doc.titulo || ""}

${String(doc.contenido || doc.resumen || "").slice(0, 1200)}
`;
      })
      .join("\n------\n");

    try {
      const respuestaIA = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Eres un asesor juridico senior para despachos de abogados en Colombia. Responde en espanol, con tono tecnico, sobrio y profesional. Usa una estructura clara: conclusion breve, fundamento normativo, aplicacion al caso, riesgos o puntos de revision y siguiente paso practico. Cita el codigo, articulo o fuente oficial cuando sea posible. No inventes datos ni cierres genericos para publico general. No cierres con frases como 'consulte con un abogado' o equivalentes. Si falta informacion, dilo con precision y sugiere la accion concreta que seguiria un abogado.",
          },
          {
            role: "user",
            content: `Pregunta: ${pregunta}\n\nContexto:\n${contexto}`,
          },
        ],
      });

      return NextResponse.json({
        respuesta: sanitizeLegalAiResponse(respuestaIA.choices[0]?.message?.content || "Sin respuesta"),
        fuentes: narrowedRanked.map((doc: any) => ({
          source: doc.source,
          codigo: doc.codigo,
          nombre: doc.nombre,
          articulo: doc.articulo,
          titulo: doc.titulo,
          score: doc.score,
        })),
      });
    } catch (error) {
      console.error("Error IA, usando fallback local:", error);
      const fallback = await buildLegalAssistantFallback(pregunta, { semanticHits: narrowedRanked, limit: 6 });
      return NextResponse.json({
        respuesta: fallback.message,
        fuentes: fallback.references,
        fallback: fallback.fallback,
        model: fallback.model,
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error IA" }, { status: 500 });
  }
}
