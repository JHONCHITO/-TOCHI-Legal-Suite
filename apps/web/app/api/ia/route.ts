import OpenAI from "openai";
import dbConnect from "@/lib/mongodb";
import Norma from "@/lib/models/Norma";
import Articulo from "@/lib/models/Articulo";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 🔥 similitud coseno
function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function POST(req: Request) {
  try {
    const { pregunta } = await req.json();

    if (!pregunta) {
      return Response.json({ error: "Pregunta vacía" });
    }

    await dbConnect();

    // 🔥 1. embedding de la pregunta
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: pregunta,
    });

    const queryVector = emb.data[0].embedding;

    // 🔥 2. traer normas y articulos con embedding
    const normas = await Norma.find({ embedding: { $exists: true } })
      .limit(100)
      .lean();

    const articulos = await Articulo.find({ embedding: { $exists: true } })
      .limit(150)
      .lean();

    // 🔥 3. calcular similitud
    const rankedNormas = normas
      .map((n: any) => ({
        source: "norma",
        ...n,
        score: cosineSimilarity(queryVector, n.embedding),
      }));

    const rankedArticulos = articulos
      .map((a: any) => ({
        source: "articulo",
        codigo: a.codigoRef,
        nombre: a.codigoRef,
        articulo: a.numeroArticulo,
        titulo: a.tituloArticulo,
        contenido: a.contenido,
        score: cosineSimilarity(queryVector, a.embedding),
      }));

    const ranked = [...rankedNormas, ...rankedArticulos]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 🔥 4. construir contexto
    let contexto = "";

    ranked.forEach((item) => {
        contexto += `[${item.codigo}] Artículo ${item.articulo}\n`;
        contexto += item.contenido.slice(0, 300) + "\n\n";
      });

    // 🔥 5. IA responde como abogado
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `
Eres un abogado experto en derecho colombiano.

Usa SOLO la información del contexto.

CONTEXTO:
${contexto}

PREGUNTA:
${pregunta}

Responde claro, profesional y citando artículos.
      `,
    });

    return Response.json({
      respuesta: response.output_text,
      fuentes: ranked,
    });

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error IA" });
  }
}
