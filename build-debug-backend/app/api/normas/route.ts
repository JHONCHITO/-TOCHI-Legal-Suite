import dbConnect from "@/lib/mongodb";
import Norma from "@/lib/models/Norma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const articulo = searchParams.get("articulo");
    const q = searchParams.get("q");
    const codigo = searchParams.get("codigo");

    const query: Record<string, unknown> = {};

    if (codigo && codigo !== "ALL") {
      query.codigo = codigo;
    }

    // 🔍 BUSCAR POR TEXTO
    if (q) {
      const palabras = q
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);

      const regex = new RegExp(palabras.join("|"), "i");

      query.$or = [
        { codigo: regex },
        { nombre: regex },
        { articulo: regex },
        { titulo: regex },
        { contenido: regex },
      ];

      const resultados = await Norma.find(query)
        .limit(50)
        .select("codigo nombre articulo titulo contenido")
        .sort({ codigo: 1, articulo: 1 })
        .lean();

      return Response.json(resultados);
    }

    // 📄 BUSCAR POR ARTÍCULO
    if (articulo) {
      const data = await Norma.findOne({
        ...query,
        articulo: String(articulo),
      }).lean();

      if (!data) {
        return Response.json({ error: "Artículo no encontrado" });
      }

      return Response.json(data);
    }

    // 🟢 SIN PARÁMETROS
    const data = await Norma.find(query)
      .limit(50)
      .select("codigo nombre articulo titulo contenido")
      .sort({ codigo: 1, articulo: 1 })
      .lean();

    return Response.json(data);

  } catch (error) {
    console.error("💣 ERROR API:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
