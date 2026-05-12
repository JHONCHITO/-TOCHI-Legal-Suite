import "dotenv/config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import axios from "axios";
import * as cheerio from "cheerio";

import dbConnect from "../lib/mongodb";
import Norma from "../lib/models/Norma";

async function scrapeCGP() {
  try {
    console.log("🚀 Scraping Código General del Proceso...");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const base = "https://leyes.co/codigo_general_del_proceso/";

    const resultados: any[] = [];

    // 🔥 CGP ~600 artículos
    for (let i = 1; i <= 700; i++) {
      try {
        const url = `${base}${i}.htm`;

        console.log(`🔎 Revisando artículo ${i}...`);

        const res = await axios.get(url);
        const $ = cheerio.load(res.data);

        const texto = $("body").text().replace(/\s+/g, " ").trim();

        if (!texto || texto.length < 50) continue;
        if (!texto.includes("Artículo")) continue;

        const match = texto.match(/Artículo\s+(\d+)/i);
        if (!match) continue;

        const numero = match[1];

        const contenidoMatch = texto.match(
          new RegExp(`Artículo\\s+${numero}[\\s\\S]*?(?=Artículo\\s+\\d+|$)`, "i")
        );

        let contenido = (contenidoMatch?.[0] || texto).trim();

        if (contenido.length < 80) continue;

        contenido = contenido
          .replace(/LEYENDAS|Mostrar|Ocultar/gi, "")
          .trim();

        resultados.push({
          codigo: "CGP",
          nombre: "Código General del Proceso",
          articulo: numero,
          titulo: `Artículo ${numero}`,
          contenido,
        });

        console.log(`✅ Artículo ${numero} guardado`);

        await new Promise((r) => setTimeout(r, 100));

      } catch {
        console.log(`⚠️ Error en ${i}`);
      }
    }

    console.log(`📊 Artículos detectados: ${resultados.length}`);

    // eliminar duplicados
    const map = new Map();
    resultados.forEach((r) => {
      if (!map.has(r.articulo)) map.set(r.articulo, r);
    });

    const limpios = Array.from(map.values());

    console.log(`✅ Artículos únicos: ${limpios.length}`);

    await Norma.deleteMany({ codigo: "CGP" });
    await Norma.insertMany(limpios);

    console.log("🔥 CGP cargado correctamente");

    process.exit();

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

scrapeCGP();