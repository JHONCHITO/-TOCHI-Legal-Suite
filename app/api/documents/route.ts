import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Document from "@/lib/models/Document"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const casoId = searchParams.get("casoId")
    const clienteId = searchParams.get("clienteId")
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")
    const search = searchParams.get("search")

    const query: Record<string, unknown> = { creadorId: session.user.id }

    if (casoId) query.casoId = casoId
    if (clienteId) query.clienteId = clienteId
    if (tipo && tipo !== "todos") query.tipo = tipo
    if (estado && estado !== "todos") query.estado = estado
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { descripcion: { $regex: search, $options: "i" } },
      ]
    }

    const documents = await Document.find(query)
      .populate("clienteId", "nombre apellido razonSocial tipo")
      .populate("casoId", "titulo numeroInterno")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Error al obtener documentos" }, { status: 500 })
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

    if (!body.nombre || !body.tipo) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: nombre, tipo" },
        { status: 400 }
      )
    }

    const newDocument = new Document({
      ...body,
      creadorId: session.user.id,
      version: 1,
    })

    await newDocument.save()

    const populatedDocument = await Document.findById(newDocument._id)
      .populate("clienteId", "nombre apellido razonSocial tipo")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    return NextResponse.json(populatedDocument, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Error al crear documento" }, { status: 500 })
  }
}
