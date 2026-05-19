import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Document from "@/lib/models/Document"
import User from "@/lib/models/User"
import { ensureClientProfileForSession } from "@/lib/services/client-profile"
import { notifyClientByClientId } from "@/lib/services/client-notifications"
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
      const clientRecord = await ensureClientProfileForSession({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      })
      if (clientRecord) {
        query = { clienteId: String((clientRecord as { _id: unknown })._id), portalCompartido: true }
      } else {
        return NextResponse.json([])
      }
    } else {
      // Abogado/Asistente ven documentos creados por ellos
      query = { creadorId: session.user.id }
    }

    if (casoId) query.casoId = casoId
    if (clienteId && userRole !== "cliente") query.clienteId = clienteId
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

    const portalCompartido = Boolean(body.portalCompartido || body.requiereAprobacion)

    const newDocument = new Document({
      ...body,
      creadorId: session.user.id,
      version: 1,
      portalCompartido,
      ...(portalCompartido ? { portalCompartidoEn: new Date() } : {}),
    })

    await newDocument.save()

    const populatedDocument = await Document.findById(newDocument._id)
      .populate("clienteId", "nombre apellido razonSocial tipo")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    const clientId = body.clienteId || (populatedDocument as { clienteId?: { _id?: unknown } | unknown } | null)?.clienteId
    const sharedToPortal = portalCompartido

    if (clientId && sharedToPortal) {
      const caseLabel =
        (populatedDocument as { casoId?: { numeroInterno?: string; titulo?: string } } | null)?.casoId &&
        typeof (populatedDocument as { casoId?: unknown }).casoId === "object"
          ? `${(populatedDocument as { casoId?: { numeroInterno?: string; titulo?: string } }).casoId?.numeroInterno || (populatedDocument as { casoId?: { numeroInterno?: string; titulo?: string } }).casoId?.titulo || "tu caso"}`
          : "tu caso"

      await notifyClientByClientId({
        clientId,
        tipo: body.requiereAprobacion ? "documento_nuevo" : "sistema",
        prioridad: body.requiereAprobacion ? "media" : "baja",
        titulo: body.requiereAprobacion
          ? `Nuevo documento pendiente de revision`
          : `Nuevo documento compartido`,
        mensaje: body.requiereAprobacion
          ? `Se compartió el documento ${body.nombre} para revisión en ${caseLabel}.`
          : `Se compartió el documento ${body.nombre} en ${caseLabel}.`,
        enlace: "/portal#documentos",
        casoId: body.casoId,
        documentoId: (populatedDocument as { _id?: unknown } | null)?._id || newDocument._id,
      })
    }

    return NextResponse.json(populatedDocument, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Error al crear documento" }, { status: 500 })
  }
}
