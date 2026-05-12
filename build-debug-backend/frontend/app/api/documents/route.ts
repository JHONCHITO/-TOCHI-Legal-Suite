import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Document from "@/lib/models/Document"
import User from "@/lib/models/User"
import Client from "@/lib/models/Client"
import { assertPlanLimit, shouldEnforcePlanLimits } from "@/lib/subscription"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()
    
    // Obtener rol del usuario
    const user = await User.findById(session.user.id).select("rol").lean()
    const userRole = (user as any)?.rol || "abogado"

    const { searchParams } = new URL(request.url)
    const casoId = searchParams.get("casoId")
    const clienteId = searchParams.get("clienteId")
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")
    const search = searchParams.get("search")

    // Filtrar según el rol del usuario
    let query: Record<string, unknown> = {}
    
    if (userRole === "superadmin" || userRole === "admin") {
      // SuperAdmin y Admin ven todos los documentos
      query = {}
    } else if (userRole === "cliente") {
      // Cliente solo ve sus propios documentos
      const clientRecord = await Client.findOne({ email: session.user.email }).select("_id").lean()
      if (clientRecord) {
        query = { clienteId: (clientRecord as any)._id }
      } else {
        return NextResponse.json([])
      }
    } else {
      // Abogado/Asistente ven documentos creados por ellos
      query = { creadorId: session.user.id }
    }

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

    const activeDocuments = await Document.countDocuments({
      creadorId: session.user.id,
      estado: { $ne: "archivado" },
    })

    if (shouldEnforcePlanLimits()) {
      try {
        await assertPlanLimit(session.user.id, "documents", activeDocuments)
      } catch (limitError) {
        return NextResponse.json(
          { error: limitError instanceof Error ? limitError.message : "Limite de documentos alcanzado" },
          { status: 403 }
        )
      }
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
