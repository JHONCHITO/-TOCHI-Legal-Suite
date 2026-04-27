import "dotenv/config";

import fs from "fs";
const pdfModule = require("pdf-parse");
const pdfParse = pdfModule.default || pdfModule;

import dbConnect from "../lib/mongodb";
import Norma from "../lib/models/Norma";

async function extraer() {
  try {
    console.log("🚀 Iniciando extracción...");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const ruta = "lib/data/aduanero.pdf";
    console.log("📂 Leyendo archivo:", ruta);

    const dataBuffer = fs.readFileSync(ruta);

    const data = await pdfParse(dataBuffer);
    const texto: string = data.text || "";

    console.log("🧠 Texto extraído (primeros 300 chars):");
    console.log(texto.slice(0, 300));

    if (!texto || texto.length < 50) {
      console.log("❌ El PDF no tiene texto útil (probablemente escaneado)");
      process.exit(0);
    }

    const articulos = texto.split(/Artículo\s+\d+/i);

    const resultados = articulos
      .map((bloque: string, index: number) => {
        if (index === 0) return null;

        const contenido = bloque.trim();
        if (contenido.length < 20) return null;

        return {
          codigo: "EA",
          nombre: "Estatuto Aduanero",
          articulo: String(index),
          titulo: `Artículo ${index}`,
          contenido,
        };
      })
      .filter(Boolean);

    console.log(`📊 Artículos detectados: ${resultados.length}`);

    if (resultados.length === 0) {
      console.log("❌ No se detectaron artículos. PDF mal estructurado.");
      process.exit(0);
    }

    await Norma.deleteMany({ codigo: "EA" });
    await Norma.insertMany(resultados);

    console.log("🔥 Artículos cargados correctamente en MongoDB");
    process.exit(0);

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

extraer();