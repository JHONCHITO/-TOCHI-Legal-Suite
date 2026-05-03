import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Communication from "@/lib/models/Communication"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const casoId = searchParams.get("casoId")
    const canal = searchParams.get("canal")
    const estado = searchParams.get("estado")

    const query: Record<string, unknown> = {}
    
    if (clienteId) query.clienteId = clienteId
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
    await dbConnect()
    const data = await request.json()
    
    if (!data.clienteId || !data.canal || !data.mensaje) {
      return NextResponse.json(
        { error: "Cliente, canal y mensaje son requeridos" },
        { status: 400 }
      )
    }

    const newCommunication = new Communication({
      ...data,
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
