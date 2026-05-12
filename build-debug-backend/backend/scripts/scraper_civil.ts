import "dotenv/config";

// ⚠️ solo desarrollo
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import axios from "axios";
import * as cheerio from "cheerio";

import dbConnect from "../lib/mongodb";
import Norma from "../lib/models/Norma";

async function scrapeCivil() {
  try {
    console.log("🚀 Scraping Código Civil...");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const base = "https://leyes.co/codigo_civil/";
    const resultados: any[] = [];

    // 🔥 civil es grande → hasta 2600 aprox
    for (let i = 1; i <= 2600; i++) {
      try {
        const url = `${base}${i}.htm`;

        console.log(`🔎 Revisando artículo ${i}...`);

        const res = await axios.get(url);
        const $ = cheerio.load(res.data);

        const texto = $("body").text().replace(/\s+/g, " ").trim();

        // ❌ filtros
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
          codigo: "CC",
          nombre: "Código Civil Colombiano",
          articulo: numero,
          titulo: `Artículo ${numero}`,
          contenido,
        });

        console.log(`✅ Artículo ${numero} guardado`);

        await new Promise((r) => setTimeout(r, 120));

      } catch (err) {
        console.log(`⚠️ Error en ${i}`);
      }
    }

    console.log(`📊 Artículos detectados: ${resultados.length}`);

    // 🔥 quitar duplicados
    const map = new Map<string, any>();
    resultados.forEach((item) => {
      if (!map.has(item.articulo)) {
        map.set(item.articulo, item);
      }
    });

    const limpios = Array.from(map.values());

    console.log(`✅ Artículos únicos: ${limpios.length}`);

    // 🗑 limpiar anteriores
    await Norma.deleteMany({ codigo: "CC" });

    // 💾 guardar
    await Norma.insertMany(limpios);

    console.log("🔥 Código Civil cargado correctamente");

    process.exit(0);

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

scrapeCivil();