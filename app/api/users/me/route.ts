import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { getEffectiveSubscription } from "@/lib/subscription"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()
    
    const user = await User.findById(session.user.id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean()

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const subscriptionInfo = await getEffectiveSubscription(session.user.id)

    return NextResponse.json({
      ...user,
      subscription: subscriptionInfo?.subscription
        ? {
            planId: subscriptionInfo.subscription.planId,
            status: subscriptionInfo.subscription.status,
            trialStart: subscriptionInfo.subscription.trialStart,
            trialEnd: subscriptionInfo.subscription.trialEnd,
            currentPeriodStart: subscriptionInfo.subscription.currentPeriodStart,
            currentPeriodEnd: subscriptionInfo.subscription.currentPeriodEnd,
            limits: subscriptionInfo.subscription.limits,
            usage: subscriptionInfo.subscription.usage,
          }
        : null,
      plan: subscriptionInfo?.plan || null,
      isUnlimited: subscriptionInfo?.isUnlimited || false,
    })
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    await dbConnect()

    // Campos que el usuario puede actualizar de si mismo
    const allowedFields = [
      "nombre",
      "apellido",
      "telefono",
      "avatar",
      "firma",
      "tarjetaProfesional",
      "especialidades",
      "notificationPreferences",
      "securityPreferences",
    ]
    const updateData: Record<string, unknown> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "especialidades" && !Array.isArray(body[field])) {
          updateData[field] = typeof body[field] === "string"
            ? String(body[field])
                .split(",")
                .map((item: string) => item.trim())
                .filter(Boolean)
            : []
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires")

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
  }
}
