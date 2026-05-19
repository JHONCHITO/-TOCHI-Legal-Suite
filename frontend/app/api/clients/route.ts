import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Client from "@/lib/models/Client"
import User from "@/lib/models/User"
import { assertPlanLimit, shouldEnforcePlanLimits } from "@/lib/subscription"

function canWriteClient(existingClient: { abogadoAsignado?: unknown }, userRole: string, userId: string) {
  if (userRole === "superadmin" || userRole === "admin") {
    return true
  }

  return String(existingClient.abogadoAsignado || "") === String(userId)
}

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
      return NextResponse.json({ error: "Acceso restringido" }, { status: 403 })
    } else if (userRole === "cliente") {
      // Cliente solo ve su propio perfil
      query = {
        $or: [{ userId: session.user.id }, { email: session.user.email }],
      }
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
    const user = await User.findById(session.user.id).select("rol").lean()
    const userRole = (user as any)?.rol || "abogado"
    if (userRole === "superadmin" || userRole === "admin") {
      return NextResponse.json({ error: "Acceso restringido" }, { status: 403 })
    }
    const normalizedEmail = String(body.email || "").toLowerCase().trim()
    const linkedUser = await User.findOne({
      email: normalizedEmail,
      rol: "cliente",
    })
      .select("_id")
      .lean()

    // Validar campos requeridos
    if (!body.tipo || !normalizedEmail || !body.telefono || !body.direccion || !body.ciudad || !body.departamento) {
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

    const existingClient = await Client.findOne({ email: normalizedEmail })

    if (existingClient) {
      if (canWriteClient(existingClient, userRole, session.user.id)) {
        const updatedClient = await Client.findByIdAndUpdate(
          existingClient._id,
          {
            $set: {
              ...body,
              email: normalizedEmail,
            },
          },
          { new: true, runValidators: true }
        )
          .populate("casos", "titulo estado numeroInterno")
          .lean()

        if (!updatedClient) {
          return NextResponse.json(
            { error: "No se pudo actualizar el cliente existente" },
            { status: 500 }
          )
        }

        return NextResponse.json(
          {
            ...updatedClient,
            message: "Cliente existente actualizado correctamente",
            updated: true,
            reused: false,
          },
          { status: 200 }
        )
      }

      const reusableClient = await Client.findById(existingClient._id)
        .populate("casos", "titulo estado numeroInterno")
        .lean()

      return NextResponse.json(
        {
          ...reusableClient,
          message: "Cliente ya existia y se reutilizo en el expediente",
          updated: true,
          reused: true,
        },
        { status: 200 }
      )
    }

    const activeClients = await Client.countDocuments({
      abogadoAsignado: session.user.id,
      activo: true,
    })

    if (shouldEnforcePlanLimits()) {
      try {
        await assertPlanLimit(session.user.id, "clients", activeClients)
      } catch (limitError) {
        return NextResponse.json(
          { error: limitError instanceof Error ? limitError.message : "Limite de clientes alcanzado" },
          { status: 403 }
        )
      }
    }

    const newClient = new Client({
      ...body,
      email: normalizedEmail,
      abogadoAsignado: session.user.id,
      casos: [],
      ...(linkedUser
        ? {
            userId: (linkedUser as { _id: unknown })._id,
            tieneAccesoPortal: true,
          }
        : {}),
    })

    await newClient.save()

    const populatedClient = await Client.findById(newClient._id)
      .populate("casos", "titulo estado numeroInterno")
      .lean()

    return NextResponse.json(
      {
        ...populatedClient,
        message: "Cliente creado correctamente",
        updated: false,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 })
  }
}
