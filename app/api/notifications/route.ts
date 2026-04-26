import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Notification from "@/lib/models/Notification"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const leida = searchParams.get("leida")
    const limit = parseInt(searchParams.get("limit") || "20")

    const query: Record<string, unknown> = { userId: session.user.id }
    if (leida !== null && leida !== "todas") {
      query.leida = leida === "true"
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      leida: false,
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
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

    const notification = new Notification({
      ...body,
      userId: session.user.id,
    })

    await notification.save()

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Error al crear notificacion" }, { status: 500 })
  }
}

// Marcar todas como leidas
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    await Notification.updateMany(
      { userId: session.user.id, leida: false },
      { $set: { leida: true, fechaLeida: new Date() } }
    )

    return NextResponse.json({ message: "Notificaciones marcadas como leidas" })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Error al actualizar notificaciones" }, { status: 500 })
  }
}
