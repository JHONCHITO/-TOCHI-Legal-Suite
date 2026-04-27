import "dotenv/config";

// ⚠️ solo desarrollo
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import axios from "axios";
import * as cheerio from "cheerio";

import dbConnect from "../lib/mongodb";
import Norma from "../lib/models/Norma";

async function scrapeConstitucion() {
  try {
    console.log("🚀 Scraping Constitución COMPLETA...");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const url = "https://www.suin-juriscol.gov.co/viewDocument.asp?id=1687988";

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const texto: string = $("body").text();

    console.log("🧠 Texto capturado:", texto.slice(0, 300));

    const textoLimpio = texto
      .replace(/\s+/g, " ")
      .replace(/(\r\n|\n|\r)/gm, " ");

    // 🔥 regex mejorado (igual que aduanero)
    const regex = /Artículo\s+\[?(\d+)\]?[\s\S]*?(?=Artículo\s+\[?\d+\]?|$)/gi;

    let resultados: any[] = [];
    let match;

    while ((match = regex.exec(textoLimpio)) !== null) {
      const numero = match[1];
      let contenido = match[0].trim();

      const count = (contenido.match(/Artículo\s+\[?\d+\]?/g) || []).length;
      if (count > 3) continue;

      if (contenido.length < 50) continue;

      resultados.push({
        codigo: "CN",
        nombre: "Constitución Política de Colombia",
        articulo: numero,
        titulo: `Artículo ${numero}`,
        contenido
      });
    }

    console.log(`📊 Artículos detectados: ${resultados.length}`);

    // 🔥 eliminar duplicados
    const map = new Map();
    resultados.forEach((r) => {
      if (!map.has(r.articulo)) map.set(r.articulo, r);
    });

    const limpios = Array.from(map.values());

    console.log(`✅ Artículos únicos: ${limpios.length}`);

    await Norma.deleteMany({ codigo: "CN" });
    await Norma.insertMany(limpios);

    console.log("🔥 Constitución COMPLETA cargada");

    process.exit();

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

scrapeConstitucion();