import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()
    const cases = await Case.find({ abogadoId: session.user.id })
      .populate("clienteId", "nombre apellido email")
      .sort({ createdAt: -1 })

    return NextResponse.json(cases)
  } catch (error) {
    console.error("Error fetching cases:", error)
    return NextResponse.json({ error: "Error al obtener casos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    await dbConnect()

    const newCase = new Case({
      ...body,
      abogadoId: session.user.id,
      numeroRadicado: `RAD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    })

    await newCase.save()
    return NextResponse.json(newCase, { status: 201 })
  } catch (error) {
    console.error("Error creating case:", error)
    return NextResponse.json({ error: "Error al crear caso" }, { status: 500 })
  }
}
