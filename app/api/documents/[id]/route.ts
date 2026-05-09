import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
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

async function syncDocumentCaseLinks(
  documentId: string,
  previousCaseId: unknown,
  nextCaseId: unknown
) {
  const previousCase = previousCaseId ? String(previousCaseId) : null
  const targetCase = nextCaseId ? String(nextCaseId) : null

  if (previousCase && previousCase !== targetCase) {
    await Case.findByIdAndUpdate(previousCase, {
      $pull: { documentos: documentId },
    })
  }

  if (targetCase && previousCase !== targetCase) {
    await Case.findByIdAndUpdate(targetCase, {
      $addToSet: { documentos: documentId },
    })
  }
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
    await dbConnect()
    const user = await User.findById(session.user.id).select("rol").lean()
    if ((user as { rol?: string } | null)?.rol === "cliente") {
      return NextResponse.json({ error: "Los clientes no pueden editar documentos desde la ruta general" }, { status: 403 })
    }
    const body = await request.json()
    const accessFilter = await getDocumentAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    const existingDocument = await Document.findOne({
      _id: id,
      ...accessFilter,
    })
      .select("casoId")
      .lean()

    if (!existingDocument) {
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

    const hasCaseField = Object.prototype.hasOwnProperty.call(body, "casoId")
    const nextCaseId = hasCaseField
      ? (typeof body.casoId === "string" && body.casoId.trim() ? body.casoId : null)
      : (existingDocument as { casoId?: unknown }).casoId

    await syncDocumentCaseLinks(id, (existingDocument as { casoId?: unknown }).casoId, nextCaseId)

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
    const user = await User.findById(session.user.id).select("rol").lean()
    if ((user as { rol?: string } | null)?.rol === "cliente") {
      return NextResponse.json({ error: "Los clientes no pueden eliminar documentos desde la ruta general" }, { status: 403 })
    }
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

    if (deletedDocument.casoId) {
      await Case.findByIdAndUpdate(deletedDocument.casoId, {
        $pull: { documentos: deletedDocument._id },
      })
    }

    return NextResponse.json({ message: "Documento eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Error al eliminar documento" }, { status: 500 })
  }
}
