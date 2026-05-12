import dbConnect from "@/lib/mongodb";
import Norma from "@/lib/models/Norma";

export const runtime = "nodejs";

export async function GET() {
  await dbConnect();

  await Norma.create({
    codigo: "EA",
    nombre: "Estatuto Aduanero",
    articulo: "1",
    titulo: "Ámbito de aplicación",
    contenido: "Las normas contenidas en este decreto regulan el régimen aduanero..."
  });

  return Response.json({ ok: true });
}