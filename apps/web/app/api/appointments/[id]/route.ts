import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Appointment from "@/lib/models/Appointment"

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

    const appointment = await Appointment.findOne({
      _id: id,
      abogadoId: session.user.id,
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

    // Convertir fechas si se envian
    if (body.fechaInicio) body.fechaInicio = new Date(body.fechaInicio)
    if (body.fechaFin) body.fechaFin = new Date(body.fechaFin)

    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: id, abogadoId: session.user.id },
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

    const deletedAppointment = await Appointment.findOneAndDelete({
      _id: id,
      abogadoId: session.user.id,
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
