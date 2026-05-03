import { NextResponse } from "next/server";
import { LEGAL_CODE_LIBRARY } from "@/lib/legal-library";
import connectDB from "@/lib/mongodb";
import Ley from "@/lib/models/Ley";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";

  if (!q) return NextResponse.json([]);

  let resultados: any[] = [];

  // 🟢 1. BUSQUEDA LOCAL (rápida)
  Object.values(LEGAL_CODE_LIBRARY).forEach((codigo: any) => {
    codigo.articulos.forEach((art: any) => {
      if (
        art.numero.toLowerCase().includes(q) ||
        art.epigrafe.toLowerCase().includes(q) ||
        art.resumen.toLowerCase().includes(q)
      ) {
        resultados.push({
          tipo: "local",
          codigo: codigo.codigo,
          articulo: art.numero,
          titulo: art.epigrafe,
          resumen: art.resumen,
        });
      }
    });
  });

  // 🔴 2. BUSQUEDA EN MONGODB (PRO)
  try {
    await connectDB();

    const leyesDB = await Ley.find({
      $text: { $search: q },
    }).limit(20);

    leyesDB.forEach((ley: any) => {
      ley.articulos.forEach((art: any) => {
        if (
          art.numero?.toLowerCase().includes(q) ||
          art.titulo?.toLowerCase().includes(q) ||
          art.contenido?.toLowerCase().includes(q)
        ) {
          resultados.push({
            tipo: "db",
            codigo: ley.codigo,
            articulo: art.numero,
            titulo: art.titulo,
            resumen: art.contenido.substring(0, 120) + "...",
          });
        }
      });
    });
  } catch (error) {
    console.log("Mongo no conectado aún");
  }

  return NextResponse.json(resultados);
}