import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Appointment from "@/lib/models/Appointment"
import User from "@/lib/models/User"
import { ensureClientProfileForSession } from "@/lib/services/client-profile"
import { notifyClientByClientId } from "@/lib/services/client-notifications"

type SessionLike = { user?: { id?: string; email?: string; name?: string } } | null

async function getAppointmentAccessFilter(session: SessionLike): Promise<Record<string, unknown> | null> {
  const user = await User.findById(session?.user?.id).select("rol").lean()
  const userRole = (user as { rol?: string } | null)?.rol || "abogado"

  if (userRole === "superadmin" || userRole === "admin") {
    return {}
  }

  if (userRole === "cliente") {
    const clientRecord = await ensureClientProfileForSession({
      id: session?.user?.id || "",
      email: session?.user?.email,
      name: session?.user?.name,
    })
    if (!clientRecord) return null
    return { clienteId: String((clientRecord as { _id: unknown })._id) }
  }

  return { abogadoId: session?.user?.id || "" }
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
    const accessFilter = await getAppointmentAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    const appointment = await Appointment.findOne({
      _id: id,
      ...accessFilter,
    })
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error fetching appointment:", error)
    return NextResponse.json({ error: "Error al obtener cita" }, { status: 500 })
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
    const accessFilter = await getAppointmentAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Convertir fechas si se envian
    if (body.fechaInicio) body.fechaInicio = new Date(body.fechaInicio)
    if (body.fechaFin) body.fechaFin = new Date(body.fechaFin)
    if (body.fechaInicio || body.fechaFin) {
      body.recordatorioEnviado = false
      body.recordatorioFecha = body.fechaInicio
        ? new Date(new Date(body.fechaInicio).getTime() - 24 * 60 * 60 * 1000)
        : undefined
    }

    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: id, ...accessFilter },
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    if (!updatedAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    const appointmentClientId = (updatedAppointment as { clienteId?: { _id?: unknown } | unknown }).clienteId
    const notificationClientId =
      appointmentClientId && typeof appointmentClientId === "object" && "_id" in appointmentClientId
        ? (appointmentClientId as { _id?: unknown })._id
        : appointmentClientId

    if (notificationClientId) {
      const appointmentLabel =
        (updatedAppointment as { titulo?: string }).titulo || "tu cita"

      await notifyClientByClientId({
        clientId: notificationClientId,
        tipo: "cita_proxima",
        prioridad: "media",
        titulo: `Cita actualizada: ${appointmentLabel}`,
        mensaje: `La cita ${appointmentLabel} fue actualizada por el despacho.`,
        enlace: "/dashboard/citas",
        casoId: (updatedAppointment as { casoId?: unknown }).casoId,
        citaId: (updatedAppointment as { _id?: unknown })._id,
      })
    }

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "Error al actualizar cita" }, { status: 500 })
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
    const accessFilter = await getAppointmentAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    const deletedAppointment = await Appointment.findOneAndDelete({
      _id: id,
      ...accessFilter,
    })

    if (!deletedAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ message: "Cita eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json({ error: "Error al eliminar cita" }, { status: 500 })
  }
}
