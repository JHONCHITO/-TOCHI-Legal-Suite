import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncAllAutomations } from "@/lib/services/automation";

export const runtime = "nodejs";
export const maxDuration = 60;

const INTERNAL_ROLES = new Set(["superadmin", "admin", "abogado", "asistente"]);

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !INTERNAL_ROLES.has(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const origin = new URL(request.url).origin;
    const result = await syncAllAutomations(origin);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Error sincronizando notificaciones:", error);
    return NextResponse.json({ error: "Error al sincronizar notificaciones" }, { status: 500 });
  }
}
