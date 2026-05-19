import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
import User from "@/lib/models/User"
import { ensureClientProfileForSession } from "@/lib/services/client-profile"
import { notifyClientByClientId } from "@/lib/services/client-notifications"

async function getCaseAccessFilter(session: { user?: { id?: string; email?: string; name?: string } }): Promise<Record<string, unknown> | null> {
  if (!session.user?.id) {
    return null
  }

  const user = await User.findById(session.user.id).select("rol").lean()
  const userRole = (user as { rol?: string } | null)?.rol || "abogado"

  if (userRole === "superadmin" || userRole === "admin") {
    return {}
  }

  if (userRole === "cliente") {
    const clientRecord = await ensureClientProfileForSession({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    })
    if (!clientRecord) {
      return null
    }

    return { clienteId: String((clientRecord as { _id: unknown })._id) }
  }

  return { abogadoPrincipal: session.user.id }
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
    const accessFilter = await getCaseAccessFilter(session)

    if (!accessFilter) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    const caseData = await Case.findOne({
      _id: id,
      ...accessFilter,
    })
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono direccion ciudad")
      .populate("abogadosAsociados", "nombre apellido email")
      .populate("documentos")
      .lean()

    if (!caseData) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    return NextResponse.json(caseData)
  } catch (error) {
    console.error("Error fetching case:", error)
    return NextResponse.json({ error: "Error al obtener caso" }, { status: 500 })
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
    const accessFilter = await getCaseAccessFilter(session)

    if (!accessFilter) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    const updatedCase = await Case.findOneAndUpdate(
      { _id: id, ...accessFilter },
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono userId")
      .lean()

    if (!updatedCase) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    const caseClientId = (updatedCase as { clienteId?: { _id?: unknown } | unknown }).clienteId
    const notificationClientId =
      caseClientId && typeof caseClientId === "object" && "_id" in caseClientId
        ? (caseClientId as { _id?: unknown })._id
        : caseClientId

    if (notificationClientId) {
      const updatedCaseId = (updatedCase as { _id?: unknown })._id
      const caseLabel =
        (updatedCase as { numeroInterno?: string; titulo?: string }).numeroInterno ||
        (updatedCase as { numeroInterno?: string; titulo?: string }).titulo ||
        "tu caso"

      await notifyClientByClientId({
        clientId: notificationClientId,
        tipo: "caso_actualizado",
        prioridad: "media",
        titulo: `Caso actualizado: ${caseLabel}`,
        mensaje:
          body.actuacion
            ? `Se registró una nueva actuación en ${caseLabel}.`
            : `Se actualizaron los datos del expediente ${caseLabel}.`,
        enlace: `/dashboard/casos/${updatedCaseId}`,
        casoId: updatedCaseId,
      })
    }

    return NextResponse.json(updatedCase)
  } catch (error) {
    console.error("Error updating case:", error)
    return NextResponse.json({ error: "Error al actualizar caso" }, { status: 500 })
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
    const accessFilter = await getCaseAccessFilter(session)

    if (!accessFilter) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    const deletedCase = await Case.findOneAndDelete({
      _id: id,
      ...accessFilter,
    })

    if (!deletedCase) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Caso eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting case:", error)
    return NextResponse.json({ error: "Error al eliminar caso" }, { status: 500 })
  }
}

// Agregar actuacion al caso
export async function PATCH(
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
    const accessFilter = await getCaseAccessFilter(session)

    if (!accessFilter) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    }

    if (body.actuacion) {
      const updatedCase = await Case.findOneAndUpdate(
        { _id: id, ...accessFilter },
        {
          $push: {
            actuaciones: {
              ...body.actuacion,
              fecha: new Date(body.actuacion.fecha),
              responsable: session.user.id,
            },
          },
        },
        { new: true }
      )
        .populate("clienteId", "nombre apellido razonSocial tipo email telefono userId")
        .lean()

      if (!updatedCase) {
        return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
      }

      const caseClientId = (updatedCase as { clienteId?: { _id?: unknown } | unknown }).clienteId
      const notificationClientId =
        caseClientId && typeof caseClientId === "object" && "_id" in caseClientId
          ? (caseClientId as { _id?: unknown })._id
          : caseClientId

      if (notificationClientId) {
        const updatedCaseId = (updatedCase as { _id?: unknown })._id
        const caseLabel =
          (updatedCase as { numeroInterno?: string; titulo?: string }).numeroInterno ||
          (updatedCase as { numeroInterno?: string; titulo?: string }).titulo ||
          "tu caso"

        await notifyClientByClientId({
          clientId: notificationClientId,
          tipo: "caso_actualizado",
          prioridad: "media",
          titulo: `Nueva actuación en ${caseLabel}`,
          mensaje: body.actuacion?.descripcion
            ? `${body.actuacion.tipo || "Actuación"}: ${body.actuacion.descripcion}`
            : `Se registró una nueva actuación en ${caseLabel}.`,
          enlace: `/dashboard/casos/${updatedCaseId}`,
          casoId: updatedCaseId,
        })
      }

      return NextResponse.json(updatedCase)
    }

    return NextResponse.json({ error: "Accion no soportada" }, { status: 400 })
  } catch (error) {
    console.error("Error patching case:", error)
    return NextResponse.json({ error: "Error al actualizar caso" }, { status: 500 })
  }
}
