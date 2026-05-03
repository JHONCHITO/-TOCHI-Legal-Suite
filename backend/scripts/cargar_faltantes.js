const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

async function main() {
  try {
    // 🔌 conectar a Mongo
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Mongo conectado");

    const db = mongoose.connection.db;
    const collection = db.collection("normas");

    // 🔥 LISTA REAL (ajústala si algún nombre cambia)
  const archivos = [
  "codigo-minas",
  "codigo-penitenciario",
  "codigo-policia",
  "codigo-recursos-naturales",
  "codigo-transito",
  "estatuto-tributario",
  "estatuto-consumidor",
  "estatuto-arbitraje",

  "ley-23-derechos-autor",
  "ley-100-seguridad-social",
  "ley-906-sistema-acusatorio",
  "ley-1116-insolvencia-empresarial",
  "ley-1448-victimas",
  "ley-1564-insolvencia",
  "ley-1581-proteccion-datos"
];

    for (const nombre of archivos) {
      try {
        console.log("📄 Cargando:", nombre);

        const ruta = path.join(
          __dirname,
          "..",
          "lib/data/codigos",
          nombre
        );

        let mod;

        try {
          mod = require(ruta + ".ts");
        } catch (err) {
          console.log("❌ No existe:", nombre);
          continue;
        }

        // 🔥 soporta export default y export normal
        const datos = mod.default || mod;

        let lista = [];

        if (Array.isArray(datos)) {
          lista = datos;
        } else if (typeof datos === "object") {
          lista = Object.values(datos);
        } else {
          console.log("⚠️ Formato no válido:", nombre);
          continue;
        }

        if (lista.length === 0) {
          console.log("⚠️ Vacío:", nombre);
          continue;
        }

        // 🔥 insertar en Mongo
        for (const item of lista) {
          await collection.insertOne({
            ...item
          });
        }

        console.log(`✅ Subido: ${nombre} (${lista.length} registros)`);

      } catch (error) {
        console.log("❌ Error en:", nombre);
        console.log(error.message);
      }
    }

    await mongoose.connection.close();
    console.log("🚀 Faltantes cargados correctamente");

  } catch (error) {
    console.error("💣 Error general:", error.message);
  }
}

main();
