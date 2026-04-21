import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Appointment from "@/lib/models/Appointment"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()
    const appointments = await Appointment.find({ abogadoId: session.user.id })
      .populate("clienteId", "nombre apellido email telefono")
      .populate("casoId", "titulo numeroRadicado")
      .sort({ fechaInicio: 1 })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Error al obtener citas" }, { status: 500 })
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

    const newAppointment = new Appointment({
      ...body,
      abogadoId: session.user.id,
    })

    await newAppointment.save()
    return NextResponse.json(newAppointment, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Error al crear cita" }, { status: 500 })
  }
}
