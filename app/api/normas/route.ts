import dbConnect from "@/lib/mongodb";
import Norma from "@/lib/models/Norma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const articulo = searchParams.get("articulo");
    const q = searchParams.get("q");

    // 🔍 BUSCAR POR TEXTO (INTELIGENTE + BALANCEADO)
    if (q) {
      // 🔥 permite múltiples palabras
      const regex = new RegExp(q.split(" ").join("|"), "i");

      const [cc, cp, cn, ea] = await Promise.all([
        Norma.find({
          codigo: "CC",
          contenido: regex
        })
          .limit(20)
          .select("codigo nombre articulo contenido"),

        Norma.find({
          codigo: "CP",
          contenido: regex
        })
          .limit(20)
          .select("codigo nombre articulo contenido"),

        Norma.find({
          codigo: "CN",
          contenido: regex
        })
          .limit(20)
          .select("codigo nombre articulo contenido"),

        Norma.find({
          codigo: "EA",
          contenido: regex
        })
          .limit(20)
          .select("codigo nombre articulo contenido"),
      ]);

      const resultados = [...cc, ...cp, ...cn, ...ea];

      // 🔥 SIEMPRE devolver array (evita error frontend)
      return Response.json(resultados);
    }

    // 📄 BUSCAR POR ARTÍCULO
    if (articulo) {
      const data = await Norma.findOne({ articulo: String(articulo) });

      if (!data) {
        return Response.json({ error: "Artículo no encontrado" });
      }

      return Response.json(data);
    }

    // 🟢 SIN PARÁMETROS
    const data = await Norma.find()
      .limit(50)
      .select("codigo nombre articulo contenido");

    return Response.json(data);

  } catch (error) {
    console.error("💣 ERROR API:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}