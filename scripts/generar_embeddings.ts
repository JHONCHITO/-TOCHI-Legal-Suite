// 🔥 ESTO SIEMPRE PRIMERO
import "dotenv/config";

import OpenAI from "openai";
import dbConnect from "../lib/mongodb";
import Articulo from "../lib/models/Articulo";
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

    async function procesarNormas() {
      while (true) {
        const normas = await Norma.find({
          embedding: { $exists: false },
          codigo: { $exists: true, $nin: [null, ""] },
          articulo: { $exists: true, $ne: "" },
        }).limit(BATCH_SIZE);

        if (normas.length === 0) {
          break;
        }

        console.log(`📦 Procesando normas: ${normas.length}`);

        for (const norma of normas) {
          try {
            if (!norma.contenido) continue;

            const response = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: norma.contenido.slice(0, 1000),
            });

            norma.embedding = response.data[0].embedding;
            await norma.save();

            totalProcesados++;
            console.log(`✅ Norma ${norma.codigo} Art ${norma.articulo}`);

            await new Promise((res) => setTimeout(res, 150));
          } catch (err: any) {
            console.error(`❌ Error en norma ${norma.articulo}:`, err.message);
          }
        }
      }
    }

    async function procesarArticulos() {
      while (true) {
        const articulos = await Articulo.find({
          embedding: { $exists: false },
          codigoRef: { $exists: true, $nin: [null, ""] },
          numeroArticulo: { $exists: true, $ne: "" },
        }).limit(BATCH_SIZE);

        if (articulos.length === 0) {
          break;
        }

        console.log(`📦 Procesando articulos: ${articulos.length}`);

        for (const articulo of articulos) {
          try {
            if (!articulo.contenido) continue;

            const texto = [
              articulo.tituloArticulo,
              articulo.titulo,
              articulo.capitulo,
              articulo.libro,
              articulo.contenido,
            ]
              .filter(Boolean)
              .join("\n");

            const response = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: texto.slice(0, 1500),
            });

            articulo.embedding = response.data[0].embedding;
            await articulo.save();

            totalProcesados++;
            console.log(`✅ Articulo ${articulo.codigoRef} #${articulo.numeroArticulo}`);

            await new Promise((res) => setTimeout(res, 150));
          } catch (err: any) {
            console.error(`❌ Error en articulo ${articulo.numeroArticulo}:`, err.message);
          }
        }
      }
    }

    await procesarNormas();
    await procesarArticulos();

    console.log("🔥 Proceso completo terminado");
    process.exit(0);

  } catch (error) {
    console.error("💣 ERROR GENERAL:", error);
    process.exit(1);
  }
}

generarEmbeddings();
