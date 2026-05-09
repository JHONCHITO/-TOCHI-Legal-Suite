import "dotenv/config";

import { refreshLegalEmbeddings } from "../lib/services/legal-embeddings";

async function generarEmbeddings(): Promise<void> {
  try {
    console.log("🚀 Generando embeddings legales...");
    console.log("MONGO URI:", process.env.MONGODB_URI ? "OK" : "NO CARGADA");
    console.log("OPENAI:", process.env.OPENAI_API_KEY ? "OK" : "NO CARGADA");

    const result = await refreshLegalEmbeddings();

    console.log("🔥 Proceso completo terminado");
    console.log(
      `📊 Normas: ${result.normas} | Articulos: ${result.articulos} | Articles: ${result.articles} | Leyes: ${result.leySubdocuments}`
    );
    console.log(`✅ Total de embeddings procesados: ${result.total}`);
    process.exit(0);
  } catch (error) {
    console.error("💣 ERROR GENERAL:", error);
    process.exit(1);
  }
}

generarEmbeddings();
