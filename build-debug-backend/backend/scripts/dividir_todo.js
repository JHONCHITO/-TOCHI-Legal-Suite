const mongoose = require("mongoose");
require("dotenv").config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Mongo conectado");

  const db = mongoose.connection.db;
  const collection = db.collection("normas");

  // 🔥 solo documentos grandes (evita duplicados)
  const docs = await collection.find({
    contenido: { $exists: true },
    articulo: { $exists: false } // 👈 evita reprocesar
  }).toArray();

  console.log("📄 Documentos encontrados:", docs.length);

  for (const doc of docs) {
    try {
      const texto = doc.contenido;

      if (!texto || texto.length < 200) continue;

      // 🔥 divide y CAPTURA número real
      const regex = /Artículo\s+(\d+)[\s\S]*?(?=Artículo\s+\d+|$)/gi;

      let match;
      let count = 0;

      while ((match = regex.exec(texto)) !== null) {
        const numero = match[1];
        const contenido = match[0];

        if (contenido.length < 50) continue;

        await collection.insertOne({
          codigo: doc.codigo || "",
          nombre: doc.nombre,
          articulo: numero, // 👈 número REAL
          titulo: `Artículo ${numero}`,
          contenido: contenido
        });

        count++;
      }

      console.log(`📘 ${doc.nombre} → ${count} artículos`);

    } catch (err) {
      console.log("❌ Error:", doc._id);
    }
  }

  await mongoose.connection.close();
  console.log("🚀 División completa");
}

main();