import { MongoClient } from "mongodb";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI!;

async function main() {
  const client = new MongoClient(uri);
  await client.connect();

  console.log("✅ Mongo conectado");

  const db = client.db();
  const collection = db.collection("normas");

  const carpeta = path.join(process.cwd(), "lib/data/codigos");

  const archivos = fs
    .readdirSync(carpeta)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts");

  for (const archivo of archivos) {
    try {
      console.log("📄 Procesando:", archivo);

      const ruta = path.join(carpeta, archivo);

      // 🔥 IMPORT DINÁMICO
      const mod = await import(`file://${ruta}`);
      const data = mod.default || mod;

      let textos: string[] = [];

      // 🔥 EXTRAER TEXTO REAL
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item?.contenido) textos.push(item.contenido);
          else if (typeof item === "string") textos.push(item);
        }
      } else if (typeof data === "object") {
        for (const key in data) {
          const item = data[key];
          if (item?.contenido) textos.push(item.contenido);
        }
      } else if (typeof data === "string") {
        textos.push(data);
      }

      const texto = textos.join("\n\n");

      if (!texto || texto.length < 50) {
        console.log("⚠️ Vacío:", archivo);
        continue;
      }

      // 🔥 DIVIDIR POR ARTÍCULOS
      const partes = texto.split(/Artículo\s+\d+/gi);

      console.log(`📘 ${archivo} → ${partes.length} partes`);

      for (let i = 1; i < partes.length; i++) {
        const contenido = partes[i].trim();

        if (contenido.length < 50) continue;

        await collection.insertOne({
          nombre: archivo.replace(".ts", ""),
          articulo: i,
          titulo: `Artículo ${i}`,
          contenido,
        });
      }

      console.log("✅ Insertado:", archivo);

    } catch (error: any) {
      console.log("❌ Error:", archivo);
      console.log(error.message);
    }
  }

  await client.close();
  console.log("🚀 TODOS LOS CÓDIGOS PROCESADOS");
}

main();