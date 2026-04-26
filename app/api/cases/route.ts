import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
import Client from "@/lib/models/Client"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const tipo = searchParams.get("tipo")
    const search = searchParams.get("search")

    const query: Record<string, unknown> = { abogadoPrincipal: session.user.id }

    if (estado && estado !== "todos") {
      query.estado = estado
    }
    if (tipo && tipo !== "todos") {
      query.tipo = tipo
    }
    if (search) {
      query.$or = [
        { titulo: { $regex: search, $options: "i" } },
        { numeroInterno: { $regex: search, $options: "i" } },
        { numeroProceso: { $regex: search, $options: "i" } },
        { despacho: { $regex: search, $options: "i" } },
      ]
    }

    const cases = await Case.find(query)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(cases)
  } catch (error) {
    console.error("Error fetching cases:", error)
    return NextResponse.json({ error: "Error al obtener casos" }, { status: 500 })
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
    if (!body.titulo || !body.tipo || !body.clienteId || !body.calidadCliente) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: titulo, tipo, clienteId, calidadCliente" },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const clientExists = await Client.findById(body.clienteId)
    if (!clientExists) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const newCase = new Case({
      ...body,
      abogadoPrincipal: session.user.id,
      fechaInicio: body.fechaInicio || new Date(),
      actuaciones: [],
      documentos: [],
    })

    await newCase.save()

    // Actualizar el cliente con el nuevo caso
    await Client.findByIdAndUpdate(body.clienteId, {
      $push: { casos: newCase._id }
    })

    const populatedCase = await Case.findById(newCase._id)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .lean()

    return NextResponse.json(populatedCase, { status: 201 })
  } catch (error) {
    console.error("Error creating case:", error)
    return NextResponse.json({ error: "Error al crear caso" }, { status: 500 })
  }
}
