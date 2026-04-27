require("dotenv").config();

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generarEmbeddings() {
  try {
    console.log("🚀 Generando embeddings...");

    // 🔥 cargar módulos correctamente
    const { dbConnect, Norma } = await getModules();

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const normas = await Norma.find().limit(50);

    for (const norma of normas) {
      console.log(`🔎 ${norma.codigo} Art ${norma.articulo}`);

      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: norma.contenido.slice(0, 1000),
      });

      norma.embedding = embedding.data[0].embedding;
      await norma.save();
    }

    console.log("🔥 Embeddings generados correctamente");
    process.exit();

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

// 🔥 IMPORT DINÁMICO AQUÍ
async function getModules() {
  const dbModule = await import("../lib/mongodb");
  const normaModule = await import("../lib/models/Norma");

  return {
    dbConnect: dbModule.default,
    Norma: normaModule.default,
  };
}

generarEmbeddings();