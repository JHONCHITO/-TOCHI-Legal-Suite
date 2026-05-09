import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncLegalCodeCatalog } from "@/lib/services/legal-catalog";

export const runtime = "nodejs";

const INTERNAL_ROLES = new Set(["superadmin", "admin", "abogado", "asistente"]);

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !INTERNAL_ROLES.has(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const result = await syncLegalCodeCatalog();

    return NextResponse.json({
      success: true,
      message: `Se sincronizaron ${result.codesUpserted} codigos legales y ${result.articlesUpserted} articulos`,
      count: result.codesUpserted,
      articulos: result.articlesUpserted,
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
