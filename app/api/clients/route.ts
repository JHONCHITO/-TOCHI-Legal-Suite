import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Client from "@/lib/models/Client"
import User from "@/lib/models/User"

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
    const search = searchParams.get("search")
    const tipo = searchParams.get("tipo")
    const activo = searchParams.get("activo")

    // Filtrar según el rol del usuario
    let query: Record<string, unknown> = {}
    
    if (userRole === "superadmin" || userRole === "admin") {
      // SuperAdmin y Admin ven todos los clientes
      query = {}
    } else if (userRole === "cliente") {
      // Cliente solo ve su propio perfil
      query = { email: session.user.email }
    } else {
      // Abogado/Asistente ven clientes asignados a ellos
      query = { abogadoAsignado: session.user.id }
    }

    if (tipo && tipo !== "todos") {
      query.tipo = tipo
    }
    if (activo !== null && activo !== "todos") {
      query.activo = activo === "true"
    }
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { apellido: { $regex: search, $options: "i" } },
        { razonSocial: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { cedula: { $regex: search, $options: "i" } },
        { nit: { $regex: search, $options: "i" } },
      ]
    }

    const clients = await Client.find(query)
      .populate("casos", "titulo estado numeroInterno")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
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
    if (!body.tipo || !body.email || !body.telefono || !body.direccion || !body.ciudad || !body.departamento) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Validar campos segun tipo
    if (body.tipo === "persona_natural" && (!body.nombre || !body.apellido)) {
      return NextResponse.json(
        { error: "Persona natural requiere nombre y apellido" },
        { status: 400 }
      )
    }
    if (body.tipo === "persona_juridica" && !body.razonSocial) {
      return NextResponse.json(
        { error: "Persona juridica requiere razon social" },
        { status: 400 }
      )
    }

    // Verificar email unico
    const existingClient = await Client.findOne({ email: body.email.toLowerCase() })
    if (existingClient) {
      return NextResponse.json(
        { error: "Ya existe un cliente con este correo electronico" },
        { status: 400 }
      )
    }

    const newClient = new Client({
      ...body,
      email: body.email.toLowerCase(),
      abogadoAsignado: session.user.id,
      casos: [],
    })

    await newClient.save()

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 })
  }
}
