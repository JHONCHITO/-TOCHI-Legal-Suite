const mongoose = require("mongoose");
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BATCH_SIZE = 200; // 🔥 controla cuántos procesa por ejecución

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Mongo conectado");

    const db = mongoose.connection.db;
    const normasCollection = db.collection("normas");
    const articulosCollection = db.collection("articulos");

    async function procesarColeccion(collection, nombre) {
      const documentos = await collection.find({
        $and: [
          {
            $or: [
              { embedding: { $exists: false } },
              { embedding: { $size: 0 } }
            ]
          },
          {
            $or: [
              { codigo: { $exists: true, $nin: [null, ""] } },
              { codigoRef: { $exists: true, $nin: [null, ""] } }
            ]
          }
        ]
      })
      .limit(BATCH_SIZE)
      .toArray();

      console.log(`📄 ${nombre} sin embedding:`, documentos.length);

      let procesados = 0;
      let errores = 0;

      for (const doc of documentos) {
        try {
          const texto = [
            doc.contenido || "",
            doc.titulo || "",
            doc.tituloArticulo || "",
            doc.epigrafe || "",
            doc.numeroArticulo || "",
          ]
            .filter(Boolean)
            .join("\n")
            .trim();

          if (!texto || texto.length < 30) {
            console.log("⚠️ Saltado:", doc._id);
            continue;
          }

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

          await collection.updateOne(
            { _id: doc._id },
            { $set: { embedding_error: true } }
          );

          errores++;
        }
      }

      console.log(`📊 ${nombre} procesados:`, procesados);
      console.log(`⚠️ ${nombre} errores:`, errores);
    }

    await procesarColeccion(normasCollection, "Normas");
    await procesarColeccion(articulosCollection, "Articulos");

    await mongoose.connection.close();
    console.log("🚀 Embeddings generados");

  } catch (error) {
    console.error("💣 Error general:", error.message);
  }
}

main();
