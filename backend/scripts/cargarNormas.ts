import dbConnect from "../lib/mongodb"; // tu conexión
import Norma from "../lib/models/Norma";

async function cargar() {
  await dbConnect();

  const datos = [
    {
      codigo: "EA",
      nombre: "Estatuto Aduanero",
      articulo: "1",
      titulo: "Ámbito de aplicación",
      contenido: "Texto real del artículo...",
      libro: "Titulo I",
      capitulo: "Disposiciones Generales"
    },
    {
      codigo: "EA",
      articulo: "2",
      titulo: "Definiciones",
      contenido: "Texto real...",
      libro: "Titulo I",
      capitulo: "Disposiciones Generales"
    }
  ];

  await Norma.insertMany(datos);

  console.log("✅ Normas guardadas en MongoDB");
  process.exit();
}

cargar();