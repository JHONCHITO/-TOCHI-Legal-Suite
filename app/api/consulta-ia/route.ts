import { NextResponse } from "next/server";
import OpenAI from "openai";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { pregunta, chatId } = await req.json();

    // ===============================
    // 🔒 VALIDACIÓN
    // ===============================
    if (!pregunta || pregunta.trim().length < 3) {
      return NextResponse.json(
        { error: "Pregunta inválida" },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = mongoose.connection.db;

    if (!db) throw new Error("No hay conexión a MongoDB");

    // ===============================
    // 🧠 EMBEDDING DE LA PREGUNTA
    // ===============================
    const embeddingQuery = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: pregunta,
    });

    const vector = embeddingQuery.data[0].embedding;

    // ===============================
    // 🔎 VECTOR SEARCH PRO
    // ===============================
    const resultados = await db.collection("normas").aggregate([
      {
        $vectorSearch: {
          index: "prestamosDB",
          path: "embedding",
          queryVector: vector,
          numCandidates: 1000,
          limit: 10,
        },
      },
      {
        $addFields: {
          score: { $meta: "vectorSearchScore" },
        },
      },
      {
        $match: {
          score: { $gte: 0.7 }, // 🔥 filtro calidad
        },
      },
      {
        $sort: { score: -1 },
      },
    ]).toArray();

    // ===============================
    // ⚠️ SIN RESULTADOS
    // ===============================
    if (!resultados || resultados.length === 0) {
      return NextResponse.json({
        respuesta:
          "No encontré información legal suficiente para responder con certeza.",
        fuentes: [],
      });
    }

    // ===============================
    // 🧱 CONTEXTO LEGAL PRO
    // ===============================
    const contexto = resultados
      .map((doc: any, i: number) => {
        return `
[Fuente ${i + 1}]
Norma: ${doc.nombre || "N/A"}
Artículo: ${doc.articulo || "N/A"}

${doc.contenido?.slice(0, 1200)}
`;
      })
      .join("\n-----------------\n");

    // ===============================
    // 🧠 MEMORIA (CHAT)
    // ===============================
    let historial: any[] = [];

    if (chatId) {
      try {
        const chat = await db
          .collection("chats")
          .findOne({ _id: new mongoose.Types.ObjectId(chatId) });

        if (chat?.mensajes) {
          historial = chat.mensajes.slice(-6); // últimos mensajes
        }
      } catch (e) {
        console.log("⚠️ Error leyendo historial");
      }
    }

    // ===============================
    // ⚖️ IA NIVEL ABOGADO
    // ===============================
    const respuestaIA = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  temperature: 0.2,
  messages: [
    {
      role: "system",
      content: `Eres un abogado experto en derecho colombiano.`,
    },
    {
      role: "user",
      content: `Pregunta: ${pregunta}\n\nContexto:\n${contexto}`,
    },
  ],
});

    const respuesta = respuestaIA.choices[0].message.content;

    // ===============================
    // 💾 GUARDAR CHAT
    // ===============================
    let nuevoChatId = chatId;

    if (!chatId) {
      const nuevo = await db.collection("chats").insertOne({
        mensajes: [],
        createdAt: new Date(),
      });

      nuevoChatId = nuevo.insertedId;
    }

   await db.collection("chats").updateOne(
  { _id: new mongoose.Types.ObjectId(nuevoChatId as string) },
  {
    $push: {
      mensajes: {
        $each: [
          { rol: "user", texto: pregunta },
          { rol: "ia", texto: respuesta },
        ] as any,
      },
    },
  } as any
);

    // ===============================
    // 📤 RESPUESTA FINAL
    // ===============================
    return NextResponse.json({
      respuesta,
      chatId: nuevoChatId,
      fuentes: resultados.map((doc: any) => ({
        nombre: doc.nombre,
        articulo: doc.articulo,
        score: doc.score,
      })),
    });

  } catch (error: any) {
    console.error("💣 Error IA:", error.message);

    return NextResponse.json(
      { error: "Error procesando la consulta IA" },
      { status: 500 }
    );
  }
}