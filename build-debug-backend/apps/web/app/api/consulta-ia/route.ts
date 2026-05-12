import OpenAI from "openai";
import dbConnect from "@/lib/mongodb";
import Norma from "@/lib/models/Norma";
import Articulo from "@/lib/models/Articulo";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i += 1) {
    const valueA = a[i] || 0;
    const valueB = b[i] || 0;
    dot += valueA * valueB;
    magA += valueA * valueA;
    magB += valueB * valueB;
  }

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function POST(req: Request) {
  try {
    const { pregunta } = await req.json();

    if (!pregunta || !String(pregunta).trim()) {
      return Response.json({ error: "Pregunta vacia" }, { status: 400 });
    }

    await dbConnect();

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: pregunta,
    });

    const queryVector = emb.data[0].embedding;
    const normas = await Norma.find({
      embedding: { $exists: true },
      contenido: { $exists: true, $ne: "" },
    })
      .select("codigo nombre articulo titulo contenido embedding")
      .limit(200)
      .lean();

    const articulos = await Articulo.find({
      embedding: { $exists: true },
      contenido: { $exists: true, $ne: "" },
    })
      .select("codigoRef numeroArticulo tituloArticulo contenido embedding")
      .limit(300)
      .lean();

    const rankedNormas = normas
      .filter((norma: any) => Array.isArray(norma.embedding) && norma.embedding.length > 0)
      .map((norma: any) => ({
        source: "norma",
        ...norma,
        score: cosineSimilarity(queryVector, norma.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    const rankedArticulos = articulos
      .filter((articulo: any) => Array.isArray(articulo.embedding) && articulo.embedding.length > 0)
      .map((articulo: any) => ({
        source: "articulo",
        codigo: articulo.codigoRef,
        nombre: articulo.codigoRef,
        articulo: articulo.numeroArticulo,
        titulo: articulo.tituloArticulo,
        contenido: articulo.contenido,
        score: cosineSimilarity(queryVector, articulo.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    const ranked = [...rankedNormas, ...rankedArticulos]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (!ranked.length) {
      return Response.json({
        respuesta: "No encontre informacion suficiente en la base juridica vectorizada.",
        fuentes: [],
      });
    }

    const contexto = ranked
      .map((doc: any, index: number) => {
        return `Fuente ${index + 1} (${doc.source}):
Norma: ${doc.nombre}
Codigo: ${doc.codigo}
Articulo: ${doc.articulo}
Titulo: ${doc.titulo || ""}

${String(doc.contenido || "").slice(0, 1200)}
`;
      })
      .join("\n------\n");

    const respuestaIA = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Eres un abogado experto en derecho colombiano. Responde con base en el contexto dado y cita el codigo y el articulo cuando sea posible.",
        },
        {
          role: "user",
          content: `Pregunta: ${pregunta}\n\nContexto:\n${contexto}`,
        },
      ],
    });

    const respuesta = respuestaIA.choices[0]?.message?.content || "Sin respuesta";

    return Response.json({
      respuesta,
      fuentes: ranked.map((doc: any) => ({
        source: doc.source,
        codigo: doc.codigo,
        nombre: doc.nombre,
        articulo: doc.articulo,
        titulo: doc.titulo,
        score: doc.score,
      })),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Error IA" }, { status: 500 });
  }
}
