import { NextResponse } from "next/server";
import { buildLegalCodeDetail } from "@/lib/services/legal-catalog";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const detail = await buildLegalCodeDetail(codigo);

    if (!detail) {
      return NextResponse.json({ error: "Codigo legal no encontrado" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching legal code detail:", error);
    return NextResponse.json({ error: "Error al obtener el codigo legal" }, { status: 500 });
  }
}
