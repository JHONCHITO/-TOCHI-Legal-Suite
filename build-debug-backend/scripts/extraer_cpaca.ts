require("dotenv").config();

const fs = require("fs");
const pdf = require("pdf-parse-fixed");

const dbConnect = require("../lib/mongodb").default;
const Norma = require("../lib/models/Norma").default;

async function extraerCPACA() {
  try {
    console.log("🚀 Extrayendo CPACA desde PDF...");

    await dbConnect();
    console.log("✅ Conectado a MongoDB");

    const ruta = "lib/data/cpaca.pdf";

    if (!fs.existsSync(ruta)) {
      console.log("❌ No existe cpaca.pdf en lib/data");
      process.exit(1);
    }

    const dataBuffer = fs.readFileSync(ruta);
    const data = await pdf(dataBuffer);

    let texto = data.text;

    console.log("🧠 Texto detectado:", texto.slice(0, 200));

    if (!texto || texto.length < 100) {
      console.log("❌ PDF sin texto válido");
      process.exit(1);
    }

    texto = texto
      .replace(/\s+/g, " ")
      .replace(/(\r\n|\n|\r)/gm, " ");

    const regex = /Artículo\s+(\d+)[\s\S]*?(?=Artículo\s+\d+|$)/gi;

    const resultados = [];

    let match;

    while ((match = regex.exec(texto)) !== null) {
      const numero = match[1];
      let contenido = match[0].trim();

      if (contenido.length < 80) continue;

      contenido = contenido.replace(
        /LEYENDAS|Mostrar|Ocultar|RESUMEN DE MODIFICACIONES/gi,
        ""
      );

      resultados.push({
        codigo: "CPACA",
        nombre: "Código de Procedimiento Administrativo",
        articulo: numero,
        titulo: `Artículo ${numero}`,
        contenido,
      });
    }

    console.log(`📊 Artículos detectados: ${resultados.length}`);

    const map = new Map();
    resultados.forEach((r) => {
      if (!map.has(r.articulo)) map.set(r.articulo, r);
    });

    const limpios = Array.from(map.values());

    console.log(`✅ Artículos únicos: ${limpios.length}`);

    await Norma.deleteMany({ codigo: "CPACA" });
    await Norma.insertMany(limpios);

    console.log("🔥 CPACA cargado correctamente");

    process.exit();

  } catch (error) {
    console.error("💣 ERROR:", error);
    process.exit(1);
  }
}

extraerCPACA();