import "dotenv/config";

// ⚠️ SOLO DESARROLLO
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import axios from "axios";
import * as cheerio from "cheerio";

import dbConnect from "../lib/mongodb";
import Norma from "../lib/models/Norma";

async function scrapePenal() {
  try {
    console.log("🚀 Scraping Código Penal (modo debug)...");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const base = "https://leyes.co/codigo_penal/";

    const resultados: any[] = [];

    // 🔥 recorrer artículos
    for (let i = 1; i <= 700; i++) {
      try {
        const url = `${base}${i}.htm`;

        console.log(`🔎 Revisando artículo ${i}...`);

        const res = await axios.get(url);
        const $ = cheerio.load(res.data);

        const texto = $("body").text().replace(/\s+/g, " ").trim();

        if (!texto || texto.length < 50) {
          console.log(`❌ ${i} vacío`);
          continue;
        }

        if (!texto.includes("Artículo")) {
          console.log(`❌ ${i} no válido`);
          continue;
        }

        const match = texto.match(/Artículo\s+(\d+)/i);
        if (!match) {
          console.log(`❌ ${i} sin match`);
          continue;
        }

        const numero = match[1];

        const contenidoMatch = texto.match(
          new RegExp(`Artículo\\s+${numero}[\\s\\S]*?(?=Artículo\\s+\\d+|$)`, "i")
        );

        let contenido = (contenidoMatch?.[0] || texto).trim();

        if (contenido.length < 80) {
          console.log(`❌ ${numero} muy corto`);
          continue;
        }

        // 🧹 limpieza
        contenido = contenido
          .replace(/LEYENDAS|Mostrar|Ocultar/gi, "")
          .replace(/\[\]/g, "")
          .trim();

        resultados.push({
          codigo: "CP",
          nombre: "Código Penal Colombiano",
          articulo: numero,
          titulo: `Artículo ${numero}`,
          contenido,
        });

        console.log(`✅ Artículo ${numero} guardado`);

        // ⏱ evitar bloqueo
        await new Promise((r) => setTimeout(r, 120));

      } catch (err) {
        console.log(`⚠️ Error en ${i}`);
      }
    }

    console.log(`📊 Artículos detectados: ${resultados.length}`);

    // 🔥 eliminar duplicados
    const map = new Map<string, any>();

    resultados.forEach((item) => {
      if (!map.has(item.articulo)) {
        map.set(item.articulo, item);
      }
    });

    const limpios = Array.from(map.values());

    console.log(`✅ Artículos únicos: ${limpios.length}`);

    // 🗑 limpiar colección
    await Norma.deleteMany({ codigo: "CP" });

    // 💾 guardar en Mongo
    await Norma.insertMany(limpios);

    console.log("🔥 Código Penal cargado correctamente");

    process.exit(0);

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

scrapePenal();