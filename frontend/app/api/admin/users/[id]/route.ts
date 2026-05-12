import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { assertPlanLimit, shouldEnforcePlanLimits } from "@/lib/subscription"

// Solo superadmin y admin pueden acceder
async function checkAdminAccess() {
  const session = await auth()
  if (!session?.user?.id) {
    return { allowed: false, error: "No autorizado", status: 401 }
  }

  await dbConnect()
  const user = await User.findById(session.user.id).select("rol").lean()
  const role = (user as any)?.rol

  if (role !== "superadmin" && role !== "admin") {
    return { allowed: false, error: "Acceso denegado", status: 403 }
  }

  return { allowed: true, role, userId: session.user.id }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkAdminAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const user = await User.findById(id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean()

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkAdminAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const body = await request.json()

    // Verificar que el usuario existe
    const existingUser = await User.findById(id)
    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // No permitir modificar superadmin excepto por si mismo
    if (existingUser.rol === "superadmin" && access.userId !== id) {
      return NextResponse.json(
        { error: "No puedes modificar al Super Admin" },
        { status: 403 }
      )
    }

    // Solo superadmin puede cambiar roles a admin
    if (body.rol === "admin" && access.role !== "superadmin") {
      return NextResponse.json(
        { error: "Solo Super Admin puede asignar rol de Administrador" },
        { status: 403 }
      )
    }

    if (body.rol && body.rol !== "cliente") {
      const currentSeats = await User.countDocuments({
        rol: { $in: ["admin", "abogado", "asistente"] },
        activo: true,
        _id: { $ne: id },
      })

      if (shouldEnforcePlanLimits()) {
        try {
          await assertPlanLimit(access.userId as string, "users", currentSeats)
        } catch (limitError) {
          return NextResponse.json(
            { error: limitError instanceof Error ? limitError.message : "Limite de usuarios alcanzado" },
            { status: 403 }
          )
        }
      }
    }

    // No permitir cambiar rol a superadmin
    if (body.rol === "superadmin") {
      return NextResponse.json(
        { error: "No se puede asignar rol de Super Admin" },
        { status: 403 }
      )
    }

    // Campos permitidos para actualizar
    const allowedFields = ["nombre", "apellido", "telefono", "rol", "activo"]
    const updateData: Record<string, unknown> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires")

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkAdminAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params

    // Verificar que el usuario existe
    const existingUser = await User.findById(id)
    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // No permitir eliminar superadmin
    if (existingUser.rol === "superadmin") {
      return NextResponse.json(
        { error: "No se puede eliminar al Super Admin" },
        { status: 403 }
      )
    }

    // No permitir eliminarse a si mismo
    if (access.userId === id) {
      return NextResponse.json(
        { error: "No puedes eliminarte a ti mismo" },
        { status: 403 }
      )
    }

    await User.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: "Usuario eliminado" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}
