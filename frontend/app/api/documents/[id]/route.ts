import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Document from "@/lib/models/Document"
import User from "@/lib/models/User"
import Client from "@/lib/models/Client"

type SessionLike = { user?: { id?: string; email?: string } } | null

async function getDocumentAccessFilter(session: SessionLike) {
  const user = await User.findById(session?.user?.id).select("rol").lean()
  const userRole = (user as { rol?: string } | null)?.rol || "abogado"

  if (userRole === "superadmin" || userRole === "admin") {
    return {}
  }

  if (userRole === "cliente") {
    const clientRecord = await Client.findOne({ email: session?.user?.email }).select("_id").lean()
    if (!clientRecord) return null
    return { clienteId: clientRecord._id }
  }

  return { creadorId: session?.user?.id }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    await dbConnect()
    const accessFilter = await getDocumentAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    const document = await Document.findOne({
      _id: id,
      ...accessFilter,
    })
      .populate("clienteId", "nombre apellido razonSocial tipo email")
      .populate("casoId", "titulo numeroInterno tipo estado")
      .lean()

    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Error al obtener documento" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    await dbConnect()
    const accessFilter = await getDocumentAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    // Incrementar version si se actualiza el contenido
    const updateData: Record<string, unknown> = { ...body }
    if (body.contenido) {
      updateData.ultimoEditorId = session.user.id
      updateData.$inc = { version: 1 }
    }

    const updatedDocument = await Document.findOneAndUpdate(
      { _id: id, ...accessFilter },
      updateData,
      { new: true, runValidators: true }
    )
      .populate("clienteId", "nombre apellido razonSocial tipo")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    if (!updatedDocument) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Error al actualizar documento" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    await dbConnect()
    const accessFilter = await getDocumentAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    const deletedDocument = await Document.findOneAndDelete({
      _id: id,
      ...accessFilter,
    })

    if (!deletedDocument) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Documento eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Error al eliminar documento" }, { status: 500 })
  }
}
