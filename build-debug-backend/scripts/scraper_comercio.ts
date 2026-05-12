import "dotenv/config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import axios from "axios";
import * as cheerio from "cheerio";

import dbConnect from "../lib/mongodb";
import Norma from "../lib/models/Norma";

async function scrapeComercio() {
  try {
    console.log("🚀 Scraping Código de Comercio...");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const base = "https://leyes.co/codigo_de_comercio/";

    const resultados: any[] = [];

    // 🔥 comercio tiene ~2000 artículos
    for (let i = 1; i <= 2000; i++) {
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
          codigo: "CO",
          nombre: "Código de Comercio",
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

    await Norma.deleteMany({ codigo: "CO" });
    await Norma.insertMany(limpios);

    console.log("🔥 Código de Comercio cargado");

    process.exit();

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

scrapeComercio();