import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Client from "@/lib/models/Client"
import User from "@/lib/models/User"
import { ensureClientProfileForSession } from "@/lib/services/client-profile"

async function getClientAccessFilter(session: { user?: { id?: string; email?: string; name?: string } }): Promise<Record<string, unknown> | null> {
  if (!session.user?.id) {
    return null
  }

  const user = await User.findById(session.user.id).select("rol").lean()
  const userRole = (user as { rol?: string } | null)?.rol || "abogado"

  if (userRole === "superadmin" || userRole === "admin") {
    return null
  }

  if (userRole === "cliente") {
    const clientRecord = await ensureClientProfileForSession({
      id: session.user.id || "",
      email: session.user.email,
      name: session.user.name,
    })

    if (!clientRecord) {
      return null
    }

    return {
      $or: [
        { userId: session.user.id },
        { _id: String((clientRecord as { _id: unknown })._id) },
        { email: session.user.email },
      ],
    }
  }

  return { abogadoAsignado: session.user.id }
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
    const accessFilter = await getClientAccessFilter(session)

    if (!accessFilter) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const client = await Client.findOne({
      _id: id,
      ...accessFilter,
    })
      .populate("casos", "titulo estado numeroInterno tipo fechaInicio cuantia")
      .populate("userId", "nombre apellido email rol activo")
      .lean()

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Error al obtener cliente" }, { status: 500 })
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
    const accessFilter = await getClientAccessFilter(session)

    if (!accessFilter) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Si se esta actualizando el email, verificar que no exista
    if (body.email) {
      const existingClient = await Client.findOne({
        email: body.email.toLowerCase(),
        _id: { $ne: id },
      })
      if (existingClient) {
        return NextResponse.json(
          { error: "Ya existe un cliente con este correo electronico" },
          { status: 400 }
        )
      }
      body.email = body.email.toLowerCase()
    }

    const updatedClient = await Client.findOneAndUpdate(
      { _id: id, ...accessFilter },
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate("casos", "titulo estado numeroInterno")
      .populate("userId", "nombre apellido email rol activo")
      .lean()

    if (!updatedClient) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 })
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
    const accessFilter = await getClientAccessFilter(session)

    if (!accessFilter) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Verificar si tiene casos activos
    const client = await Client.findOne({
      _id: id,
      ...accessFilter,
    }).populate("casos")

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    if (client.casos && client.casos.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un cliente con casos asociados. Primero elimine o reasigne los casos." },
        { status: 400 }
      )
    }

    await Client.findByIdAndDelete(id)

    return NextResponse.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 })
  }
}
