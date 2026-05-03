const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const pdfParse = require("pdf-parse");

require("dotenv").config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Mongo conectado");

  const db = mongoose.connection.db;
  const collection = db.collection("normas");

  const carpeta = path.join(process.cwd(), "lib/data");

  const archivos = fs.readdirSync(carpeta).filter(f => f.endsWith(".pdf"));

  console.log("📄 PDFs encontrados:", archivos.length);

  for (const archivo of archivos) {
    try {
      const ruta = path.join(carpeta, archivo);
      console.log("📘 Procesando:", archivo);

      const dataBuffer = fs.readFileSync(ruta);
      const pdfData = await pdfParse(dataBuffer);

      const texto = pdfData.text;

      if (!texto || texto.length < 100) {
        console.log("⚠️ PDF vacío:", archivo);
        continue;
      }

      // 🔥 dividir artículos
      const partes = texto.split(/Artículo\s+\d+/gi);

      console.log(`📑 ${archivo} → ${partes.length} artículos`);

      for (let i = 1; i < partes.length; i++) {
        const contenido = partes[i].trim();

        if (contenido.length < 50) continue;

        await collection.insertOne({
          nombre: archivo.replace(".pdf", ""),
          articulo: i,
          titulo: `Artículo ${i}`,
          contenido,
        });
      }

      console.log("✅ Insertado:", archivo);

    } catch (error) {
      console.log("❌ Error en:", archivo);
      console.log(error.message);
    }
  }

  mongoose.connection.close();
  console.log("🚀 TODOS LOS PDFs PROCESADOS");
}

main();