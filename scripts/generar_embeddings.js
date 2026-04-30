const mongoose = require("mongoose");
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BATCH_SIZE = 50; // 🔥 controla cuántos procesa por ejecución

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Mongo conectado");

    const db = mongoose.connection.db;
    const collection = db.collection("normas");

    // 🔥 SOLO documentos sin embedding
    const documentos = await collection.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ]
    })
    .limit(BATCH_SIZE)
    .toArray();

    console.log("📄 Documentos sin embedding:", documentos.length);

    if (documentos.length === 0) {
      console.log("🎉 Todo ya está vectorizado");
      return;
    }

    let procesados = 0;
    let errores = 0;

    for (const doc of documentos) {
      try {
        const texto = (doc.contenido || doc.titulo || "").trim();

        // 🔥 FILTRO IMPORTANTE
        if (!texto || texto.length < 30) {
          console.log("⚠️ Saltado:", doc._id);
          continue;
        }

        // 🔥 evitar textos demasiado largos (OpenAI límite)
        const textoRecortado = texto.slice(0, 8000);

        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: textoRecortado,
        });

        const embedding = response.data[0].embedding;

        await collection.updateOne(
          { _id: doc._id },
          { $set: { embedding } }
        );

        console.log("✅ Embedding:", doc._id);
        procesados++;

      } catch (error) {
        console.log("❌ Error en:", doc._id);

        // 🔥 opcional: marcar error para no repetir
        await collection.updateOne(
          { _id: doc._id },
          { $set: { embedding_error: true } }
        );

        errores++;
      }
    }

    console.log("📊 Procesados:", procesados);
    console.log("⚠️ Errores:", errores);

    await mongoose.connection.close();
    console.log("🚀 Embeddings generados");

  } catch (error) {
    console.error("💣 Error general:", error.message);
  }
}

main();