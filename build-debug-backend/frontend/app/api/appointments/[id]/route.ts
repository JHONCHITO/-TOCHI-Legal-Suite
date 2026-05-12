import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Appointment from "@/lib/models/Appointment"
import User from "@/lib/models/User"
import Client from "@/lib/models/Client"

type SessionLike = { user?: { id?: string; email?: string } } | null

async function getAppointmentAccessFilter(session: SessionLike) {
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

  return { abogadoId: session?.user?.id }
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
