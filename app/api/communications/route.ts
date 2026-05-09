import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Communication from "@/lib/models/Communication"
import User from "@/lib/models/User"
import Client from "@/lib/models/Client"
import { assertPlanLimit } from "@/lib/subscription"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findById(session.user.id).select("rol").lean()
    const userRole = (user as any)?.rol || "abogado"
    
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const casoId = searchParams.get("casoId")
    const canal = searchParams.get("canal")
    const estado = searchParams.get("estado")

    const query: Record<string, unknown> = {}
    
    if (userRole === "cliente") {
      const clientRecord = await Client.findOne({ email: session.user.email }).select("_id").lean()
      if (clientRecord) {
        query.$or = [
          { creadorId: session.user.id },
          { creadorId: { $exists: false } },
          { clienteId: (clientRecord as any)._id },
        ]
      } else {
        return NextResponse.json([])
      }
    } else {
      query.$or = [
        { creadorId: session.user.id },
        { creadorId: { $exists: false } },
      ]
    }

    if (userRole !== "cliente" && clienteId) query.clienteId = clienteId
    if (casoId) query.casoId = casoId
    if (canal) query.canal = canal
    if (estado) query.estado = estado

    const communications = await Communication.find(query)
      .sort({ fecha: -1 })
      .populate("clienteId", "nombre apellido razonSocial tipo")
      .limit(100)
    
    return NextResponse.json(communications)
  } catch (error) {
    console.error("Error fetching communications:", error)
    return NextResponse.json({ error: "Error al obtener comunicaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()
    const data = await request.json()
    
    if (!data.clienteId || !data.canal || !data.mensaje) {
      return NextResponse.json(
        { error: "Cliente, canal y mensaje son requeridos" },
        { status: 400 }
      )
    }

    const activeCommunications = await Communication.countDocuments({
      creadorId: session.user.id,
    })

    try {
      await assertPlanLimit(session.user.id, "communications", activeCommunications)
    } catch (limitError) {
      return NextResponse.json(
        { error: limitError instanceof Error ? limitError.message : "Limite de comunicaciones alcanzado" },
        { status: 403 }
      )
    }

    const newCommunication = new Communication({
      ...data,
      creadorId: session.user.id,
      fecha: data.fecha || new Date(),
    })
    
    await newCommunication.save()
    
    return NextResponse.json(newCommunication, { status: 201 })
  } catch (error) {
    console.error("Error creating communication:", error)
    return NextResponse.json({ error: "Error al crear comunicacion" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect()
    const { id, ...updateData } = await request.json()
    
    const updated = await Communication.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
    
    if (!updated) {
      return NextResponse.json({ error: "Comunicacion no encontrada" }, { status: 404 })
    }
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating communication:", error)
    return NextResponse.json({ error: "Error al actualizar comunicacion" }, { status: 500 })
  }
}
