import { NextResponse } from "next/server";
import { loadAdminOverview } from "@/lib/services/admin-overview";

export const runtime = "nodejs";

export async function GET() {
  try {
    const overview = await loadAdminOverview();
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar el panel admin";
    const status = message === "No autorizado" ? 401 : message === "Acceso denegado" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
