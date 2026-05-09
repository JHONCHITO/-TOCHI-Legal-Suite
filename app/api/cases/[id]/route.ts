import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
import Client from "@/lib/models/Client"
import User from "@/lib/models/User"
import { createNotificationForUsers } from "@/lib/services/automation"

async function getCaseAccessFilter(session: { user?: { id?: string; email?: string } }) {
  if (!session.user?.id) {
    return null
  }

  const user = await User.findById(session.user.id).select("rol").lean()
  const userRole = (user as { rol?: string } | null)?.rol || "abogado"

  if (userRole === "superadmin" || userRole === "admin") {
    return {}
  }

  if (userRole === "cliente") {
    const clientRecord = await Client.findOne({ email: session.user.email }).select("_id").lean()
    if (!clientRecord) {
      return null
    }

    return { clienteId: clientRecord._id }
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
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono direccion ciudad userId")
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

    const recipients = new Set<string>()
    if ((updatedCase as any).abogadoPrincipal) {
      recipients.add(String((updatedCase as any).abogadoPrincipal))
    }
    for (const lawyerId of (updatedCase as any).abogadosAsociados || []) {
      if (lawyerId) {
        recipients.add(String(lawyerId))
      }
    }
    if ((updatedCase as any).clienteId?.userId) {
      recipients.add(String((updatedCase as any).clienteId.userId))
    }

    if (recipients.size > 0) {
      await createNotificationForUsers({
        userIds: [...recipients],
        tipo: "caso_actualizado",
        prioridad: "media",
        titulo: `Caso actualizado: ${(updatedCase as any).titulo || "Expediente"}`,
        mensaje: `El expediente ${(updatedCase as any).numeroInterno || (updatedCase as any).numeroRadicado || id} fue actualizado.`,
        enlace: `/dashboard/casos/${id}`,
        casoId: id,
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
        .populate("clienteId", "nombre apellido razonSocial tipo userId")
        .lean()

      if (!updatedCase) {
        return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
      }

      const recipients = new Set<string>()
      if ((updatedCase as any).abogadoPrincipal) {
        recipients.add(String((updatedCase as any).abogadoPrincipal))
      }
      for (const lawyerId of (updatedCase as any).abogadosAsociados || []) {
        if (lawyerId) {
          recipients.add(String(lawyerId))
        }
      }
      if ((updatedCase as any).clienteId?.userId) {
        recipients.add(String((updatedCase as any).clienteId.userId))
      }

      if (recipients.size > 0) {
        await createNotificationForUsers({
          userIds: [...recipients],
          tipo: "caso_actualizado",
          prioridad: "alta",
          titulo: `Nueva actuacion: ${(updatedCase as any).titulo || "Expediente"}`,
          mensaje: body.actuacion?.descripcion
            ? String(body.actuacion.descripcion)
            : `Se registro una nueva actuacion en ${(updatedCase as any).numeroInterno || id}.`,
          enlace: `/dashboard/casos/${id}`,
          casoId: id,
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
