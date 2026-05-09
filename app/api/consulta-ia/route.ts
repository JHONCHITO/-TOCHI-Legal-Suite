import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeAiQuery } from "@/lib/subscription";
import { searchSemanticLegalContent } from "@/lib/services/legal-vector-search";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

    try {
      await consumeAiQuery(session.user.id);
    } catch (limitError) {
      return NextResponse.json(
        { error: limitError instanceof Error ? limitError.message : "Limite de IA alcanzado" },
        { status: 403 }
      );
    }
    const ranked = await searchSemanticLegalContent(pregunta, 8);

    if (!ranked.length) {
      return NextResponse.json({
        respuesta: "No encontre informacion suficiente en la base juridica vectorizada.",
        fuentes: [],
      });
    }

    const contexto = ranked
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

    return NextResponse.json({
      respuesta: respuestaIA.choices[0]?.message?.content || "Sin respuesta",
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
    return NextResponse.json({ error: "Error IA" }, { status: 500 });
  }
}
