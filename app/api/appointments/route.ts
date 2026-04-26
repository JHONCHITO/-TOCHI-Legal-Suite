import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Appointment from "@/lib/models/Appointment"
import User from "@/lib/models/User"
import Client from "@/lib/models/Client"

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
    const fecha = searchParams.get("fecha")
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")

    // Filtrar según el rol del usuario
    let query: Record<string, unknown> = {}
    
    if (userRole === "superadmin" || userRole === "admin") {
      // SuperAdmin y Admin ven todas las citas
      query = {}
    } else if (userRole === "cliente") {
      // Cliente solo ve sus propias citas
      const clientRecord = await Client.findOne({ email: session.user.email }).select("_id").lean()
      if (clientRecord) {
        query = { clienteId: (clientRecord as any)._id }
      } else {
        return NextResponse.json([])
      }
    } else {
      // Abogado/Asistente ven citas asignadas a ellos
      query = { abogadoId: session.user.id }
    }

    if (fecha) {
      const startDate = new Date(fecha)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(fecha)
      endDate.setHours(23, 59, 59, 999)
      query.fechaInicio = { $gte: startDate, $lte: endDate }
    }
    if (tipo && tipo !== "todos") {
      query.tipo = tipo
    }
    if (estado && estado !== "todos") {
      query.estado = estado
    }

    const appointments = await Appointment.find(query)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .populate("casoId", "titulo numeroInterno")
      .sort({ fechaInicio: 1 })
      .lean()

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

    // Validar campos requeridos
    if (!body.titulo || !body.tipo || !body.fechaInicio || !body.fechaFin) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: titulo, tipo, fechaInicio, fechaFin" },
        { status: 400 }
      )
    }

    // Verificar que la fecha de fin sea posterior a la de inicio
    if (new Date(body.fechaFin) <= new Date(body.fechaInicio)) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
        { status: 400 }
      )
    }

    const newAppointment = new Appointment({
      ...body,
      abogadoId: session.user.id,
      fechaInicio: new Date(body.fechaInicio),
      fechaFin: new Date(body.fechaFin),
    })

    await newAppointment.save()

    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    return NextResponse.json(populatedAppointment, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Error al crear cita" }, { status: 500 })
  }
}
