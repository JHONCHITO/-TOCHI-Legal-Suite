import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Notification from "@/lib/models/Notification"
import { emitNotificationEvent } from "@/lib/services/notification-stream"

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
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      leida: false,
    })
    emitNotificationEvent(session.user.id, {
      kind: "created",
      notificationId: notification._id.toString(),
      title: notification.titulo,
      message: notification.mensaje,
      url: notification.enlace || "/dashboard/notificaciones",
      priority: notification.prioridad,
      type: notification.tipo,
      unreadCount,
    })

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

    const body = await request.json().catch(() => ({}))
    const notificationId = typeof body?.id === "string" ? body.id : null

    if (notificationId) {
      const updated = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: session.user.id },
        { $set: { leida: true, fechaLeida: new Date() } },
        { new: true }
      )

      if (!updated) {
        return NextResponse.json({ error: "Notificacion no encontrada" }, { status: 404 })
      }

      emitNotificationEvent(session.user.id, {
        kind: "updated",
        notificationId: updated._id.toString(),
        unreadCount: await Notification.countDocuments({
          userId: session.user.id,
          leida: false,
        }),
      })

      return NextResponse.json({ message: "Notificacion marcada como leida", notification: updated })
    }

    await Notification.updateMany(
      { userId: session.user.id, leida: false },
      { $set: { leida: true, fechaLeida: new Date() } }
    )
    emitNotificationEvent(session.user.id, {
      kind: "updated",
      unreadCount: 0,
    })

    return NextResponse.json({ message: "Notificaciones marcadas como leidas" })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Error al actualizar notificaciones" }, { status: 500 })
  }
}
