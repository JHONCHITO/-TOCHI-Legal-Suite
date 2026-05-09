import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { refreshLegalCorpus } from "@/lib/services/legal-refresh";

export const runtime = "nodejs";
export const maxDuration = 300;

const INTERNAL_ROLES = new Set(["superadmin", "admin", "abogado", "asistente"]);

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !INTERNAL_ROLES.has(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const result = await refreshLegalCorpus();

    return NextResponse.json({
      success: true,
      message: `Se sincronizaron ${result.catalog.codesUpserted} codigos legales, ${result.catalog.articlesUpserted} articulos, ${result.legacyLey.leyesUpserted} leyes, ${result.legacyLey.leyArticlesUpserted} articulos de ley y ${result.embeddings.total} embeddings`,
      count: result.catalog.codesUpserted,
      articulos: result.catalog.articlesUpserted,
      leyes: result.legacyLey.leyesUpserted,
      leyArticulos: result.legacyLey.leyArticlesUpserted,
      embeddings: result.embeddings.total,
    });
  } catch (error) {
    console.error("Error al sincronizar codigos:", error);
    return NextResponse.json(
      { error: "Error al sincronizar codigos legales", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST para sincronizar los codigos legales",
  });
}
