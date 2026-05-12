const mongoose = require("mongoose");
require("dotenv").config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Mongo conectado");

  const db = mongoose.connection.db;
  const collection = db.collection("normas");

  // 🔍 Buscar documentos grandes (los PDFs)
  const documentos = await collection.find({
    contenido: { $exists: true }
  }).toArray();

  console.log("📄 Documentos encontrados:", documentos.length);

  for (const doc of documentos) {
    try {
      if (!doc.contenido) continue;

      // 🔥 dividir por "Artículo"
      const partes = doc.contenido.split(/Artículo\s+\d+/gi);

      console.log(`📘 Dividiendo: ${doc.nombre} → ${partes.length} partes`);

      for (let i = 1; i < partes.length; i++) {
        const contenido = partes[i].trim();

        if (contenido.length < 50) continue;

        await collection.insertOne({
          nombre: doc.nombre,
          articulo: i,
          titulo: `Artículo ${i}`,
          contenido: contenido,
        });
      }

    } catch (error) {
      console.log("❌ Error con:", doc._id);
    }
  }

  mongoose.connection.close();
  console.log("🚀 División completada");
}

main();