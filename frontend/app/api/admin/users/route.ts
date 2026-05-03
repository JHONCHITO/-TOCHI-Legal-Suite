import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { assertPlanLimit } from "@/lib/subscription"

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
    return { allowed: false, error: "Acceso denegado. Solo administradores.", status: 403 }
  }

  return { allowed: true, role, userId: session.user.id }
}

export async function GET() {
  try {
    const access = await checkAdminAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const users = await User.find({})
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const access = await checkAdminAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()

    if (!body.nombre || !body.apellido || !body.email || !body.password || !body.rol) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Solo superadmin puede crear otros admins
    if (body.rol === "superadmin") {
      return NextResponse.json(
        { error: "No se puede crear otro Super Admin" },
        { status: 403 }
      )
    }

    if (body.rol === "admin" && access.role !== "superadmin") {
      return NextResponse.json(
        { error: "Solo Super Admin puede crear Administradores" },
        { status: 403 }
      )
    }

    if (body.rol !== "cliente") {
      const currentSeats = await User.countDocuments({
        rol: { $in: ["admin", "abogado", "asistente"] },
        activo: true,
      })

      try {
        await assertPlanLimit(access.userId as string, "users", currentSeats)
      } catch (limitError) {
        return NextResponse.json(
          { error: limitError instanceof Error ? limitError.message : "Limite de usuarios alcanzado" },
          { status: 403 }
        )
      }
    }

    // Verificar email unico
    const existingUser = await User.findOne({ email: body.email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo" },
        { status: 400 }
      )
    }

    // Encriptar contrasena
    const hashedPassword = await bcrypt.hash(body.password, 12)

    const newUser = new User({
      nombre: body.nombre,
      apellido: body.apellido,
      email: body.email.toLowerCase(),
      password: hashedPassword,
      rol: body.rol,
      telefono: body.telefono,
      activo: true,
    })

    await newUser.save()

    const userResponse = newUser.toObject()
    const { password, ...safeUserResponse } = userResponse as typeof userResponse & {
      password?: string
    }

    return NextResponse.json(safeUserResponse, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
