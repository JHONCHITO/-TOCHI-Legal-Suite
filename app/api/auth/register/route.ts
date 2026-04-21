import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      tarjetaProfesional,
      especialidades,
    } = body;

    // Validación básica
    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, apellido, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verificar si ya existe
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await User.create({
      nombre,
      apellido,
      email: email.toLowerCase(),
      password: hashedPassword,
      telefono: telefono || "",
      tarjetaProfesional: tarjetaProfesional || "",
      especialidades: especialidades || [], // 👈 IMPORTANTE
      rol: "abogado",
      activo: true,
    });

    return NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user: {
          id: user._id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("🔥 ERROR REGISTER REAL:", error);

    return NextResponse.json(
      {
        error: error.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}