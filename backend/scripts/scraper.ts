import "dotenv/config";

// ⚠️ SOLO PARA DESARROLLO
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import axios from "axios";
import * as cheerio from "cheerio";

import dbConnect from "../lib/mongodb";
import Norma from "../lib/models/Norma";

async function scrape() {
  try {
    console.log("🚀 Iniciando scraping...");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const url = "https://www.suin-juriscol.gov.co/viewDocument.asp?id=30036618";

    console.log("🌐 Cargando página...");
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    const texto: string = $("body").text();

    console.log("🧠 Texto capturado (primeros 300 chars):");
    console.log(texto.slice(0, 300));

    // 🔥 LIMPIEZA BASE
    const textoLimpio: string = texto
      .replace(/\s+/g, " ")
      .replace(/(\r\n|\n|\r)/gm, " ");

    // 🔥 REGEX CORREGIDO (detecta Artículo 1 y Artículo [1])
    const regex: RegExp = /Artículo\s+\[?(\d+)\]?[\s\S]*?(?=Artículo\s+\[?\d+\]?|$)/gi;

    const resultados: any[] = [];

    let match: RegExpExecArray | null;

    while ((match = regex.exec(textoLimpio)) !== null) {
      const numero: string = match[1];
      let contenido: string = match[0].trim();

      // 🚫 FILTRO: evitar bloques gigantes con muchos artículos dentro
      const cantidadArticulosInternos = (contenido.match(/Artículo\s+\[?\d+\]?/g) || []).length;
      if (cantidadArticulosInternos > 3) continue;

      // 🚫 FILTROS BÁSICOS
      if (contenido.length < 100) continue;
      if (!contenido.includes("Artículo")) continue;

      // 🧹 LIMPIAR BASURA COMÚN
      contenido = contenido
        .replace(/LEYENDAS|Mostrar|Ocultar|RESUMEN DE MODIFICACIONES/gi, "")
        .replace(/\[\]/g, "")
        .trim();

      resultados.push({
        codigo: "EA",
        nombre: "Estatuto Aduanero",
        articulo: numero,
        titulo: `Artículo ${numero}`,
        contenido
      });
    }

    console.log(`📊 Artículos detectados (antes de limpiar): ${resultados.length}`);

    if (resultados.length === 0) {
      console.log("❌ No se detectaron artículos");
      process.exit(0);
    }

    // 🔥 ELIMINAR DUPLICADOS
    const articulosUnicos = new Map<string, any>();

    resultados.forEach((item) => {
      if (!articulosUnicos.has(item.articulo)) {
        articulosUnicos.set(item.articulo, item);
      }
    });

    const resultadosLimpios = Array.from(articulosUnicos.values());

    console.log(`✅ Artículos únicos: ${resultadosLimpios.length}`);

    // 🗑 limpiar datos anteriores
    await Norma.deleteMany({ codigo: "EA" });

    // 💾 guardar en Mongo
    await Norma.insertMany(resultadosLimpios);

    console.log("🔥 Artículos LIMPIOS cargados correctamente en MongoDB");

    process.exit(0);

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

scrape();