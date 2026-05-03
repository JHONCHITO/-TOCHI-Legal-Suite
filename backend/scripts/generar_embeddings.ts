// 🔥 ESTO SIEMPRE PRIMERO
import "dotenv/config";

import OpenAI from "openai";
import dbConnect from "../lib/mongodb";
import Norma from "../lib/models/Norma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function generarEmbeddings(): Promise<void> {
  try {
    console.log("🚀 Generando embeddings en lotes...");

    console.log("MONGO URI:", process.env.MONGODB_URI ? "OK" : "NO CARGADA");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const BATCH_SIZE = 100;
    let totalProcesados = 0;

    while (true) {
      // 🔥 SOLO LOS QUE FALTAN
      const normas = await Norma.find({
        embedding: { $exists: false },
        codigo: { $exists: true, $nin: [null, ""] },
        articulo: { $exists: true, $ne: "" }
      }).limit(BATCH_SIZE);

      if (normas.length === 0) {
        console.log("🎉 TODOS LOS EMBEDDINGS GENERADOS");
        break;
      }

      console.log(`📦 Procesando lote de ${normas.length}`);

      for (const norma of normas) {
        try {
          if (!norma.contenido) continue;

          console.log(`🔎 ${norma.codigo} Art ${norma.articulo}`);

          const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: norma.contenido.slice(0, 1000),
          });

          const embedding = response.data[0].embedding;

          norma.embedding = embedding;
          await norma.save();

          totalProcesados++;
          console.log(`✅ ${totalProcesados} → Art ${norma.articulo}`);

          // ⏳ PAUSA (evita errores de API)
          await new Promise(res => setTimeout(res, 150));

        } catch (err: any) {
          console.error(`❌ Error en Art ${norma.articulo}:`, err.message);
        }
      }
    }

    console.log("🔥 Proceso completo terminado");
    process.exit(0);

  } catch (error) {
    console.error("💣 ERROR GENERAL:", error);
    process.exit(1);
  }
}

generarEmbeddings();
