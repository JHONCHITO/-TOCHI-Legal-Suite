import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ley from "@/lib/models/Ley";

// 🔎 GET → obtener leyes (con filtro opcional)
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const codigo = searchParams.get("codigo");

    let query = {};

    if (codigo) {
      query = { codigo };
    }

    const leyes = await Ley.find(query);

    return NextResponse.json(leyes);
  } catch (error) {
    console.error("❌ Error GET leyes:", error);
    return NextResponse.json(
      { error: "Error obteniendo leyes" },
      { status: 500 }
    );
  }
}

// ➕ POST → crear nueva ley
export async function POST(req: Request) {
  try {
    await connectDB();

    const data = await req.json();

    const nueva = await Ley.create({
      nombre: data.nombre,
      codigo: data.codigo,
      descripcion: data.descripcion || "",
      fuente: data.fuente || "manual",
      articulos: data.articulos || [],
    });

    return NextResponse.json(nueva);
  } catch (error) {
    console.error("❌ Error POST leyes:", error);
    return NextResponse.json(
      { error: "Error creando ley" },
      { status: 500 }
    );
  }
}