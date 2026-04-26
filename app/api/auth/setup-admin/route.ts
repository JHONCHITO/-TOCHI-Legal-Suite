import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

// Esta API solo funciona si no existe ningun superadmin
// Se usa para configurar la cuenta inicial del administrador
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.email || !body.password || !body.nombre || !body.apellido || !body.secretKey) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Clave secreta para crear superadmin (usa AUTH_SECRET)
    if (body.secretKey !== process.env.AUTH_SECRET) {
      return NextResponse.json(
        { error: "Clave secreta invalida" },
        { status: 403 }
      )
    }

    await dbConnect()

    // Verificar si ya existe un superadmin
    const existingSuperAdmin = await User.findOne({ rol: "superadmin" })
    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: "Ya existe un Super Admin registrado. Contacta al administrador." },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: body.email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: "Este correo ya esta registrado" },
        { status: 400 }
      )
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(body.password, 12)

    // Crear el super admin
    const superAdmin = new User({
      email: body.email.toLowerCase(),
      password: hashedPassword,
      nombre: body.nombre,
      apellido: body.apellido,
      rol: "superadmin",
      activo: true,
      emailVerified: new Date(),
    })

    await superAdmin.save()

    return NextResponse.json({
      success: true,
      message: "Super Admin creado exitosamente",
      user: {
        email: superAdmin.email,
        nombre: superAdmin.nombre,
        apellido: superAdmin.apellido,
        rol: superAdmin.rol,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating super admin:", error)
    return NextResponse.json(
      { error: "Error al crear Super Admin" },
      { status: 500 }
    )
  }
}

// Verificar si existe un superadmin
export async function GET() {
  try {
    await dbConnect()
    const existingSuperAdmin = await User.findOne({ rol: "superadmin" }).select("email nombre apellido").lean()
    
    return NextResponse.json({
      exists: !!existingSuperAdmin,
      admin: existingSuperAdmin ? {
        nombre: (existingSuperAdmin as any).nombre,
        email: (existingSuperAdmin as any).email,
      } : null
    })
  } catch (error) {
    return NextResponse.json({ exists: false, admin: null })
  }
}
