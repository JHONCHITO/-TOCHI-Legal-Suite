const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

// 🔥 IMPORT CORRECTO
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

async function extraerTextoPDF(ruta) {
  const data = new Uint8Array(fs.readFileSync(ruta));

  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let texto = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const strings = content.items.map(item => item.str);
    texto += strings.join(" ") + "\n";
  }

  return texto;
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Mongo conectado");

    const db = mongoose.connection.db;
    const collection = db.collection("normas");

    const archivos = [
      { ruta: "lib/data/aduanero.pdf", nombre: "Código Aduanero" },
      { ruta: "lib/data/cpaca.pdf", nombre: "CPACA" },
    ];

    for (const archivo of archivos) {
      try {
        const rutaCompleta = path.join(__dirname, "..", archivo.ruta);

        console.log("📄 Procesando:", rutaCompleta);

        if (!fs.existsSync(rutaCompleta)) {
          console.log("❌ No existe:", rutaCompleta);
          continue;
        }

        const texto = await extraerTextoPDF(rutaCompleta);

        if (!texto || texto.length < 50) {
          console.log("⚠️ PDF sin texto:", archivo.nombre);
          continue;
        }

        await collection.insertOne({
          nombre: archivo.nombre,
          contenido: texto,
        });

        console.log("✅ Guardado:", archivo.nombre);
      } catch (err) {
        console.error("❌ Error en:", archivo.ruta);
        console.error(err.message);
      }
    }

    mongoose.connection.close();
    console.log("🔌 Conexión cerrada");
  } catch (error) {
    console.error("💣 Error general:", error.message);
  }
}

main();