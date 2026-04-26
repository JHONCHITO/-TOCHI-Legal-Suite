import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, apellido, email, password, telefono, tarjetaProfesional, especialidades } = body;

    // Validaciones
    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, apellido, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El formato del email no es válido" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario
    const user = await User.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      telefono: telefono?.trim() || "",
      tarjetaProfesional: tarjetaProfesional?.trim() || "",
      especialidades: especialidades || [],
      rol: "abogado",
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // No devolver la contraseña
    const userResponse = {
      id: user._id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
    };

    return NextResponse.json(
      { 
        message: "Usuario registrado exitosamente", 
        user: userResponse 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[v0] Error en registro:", error);
    
    // Error de duplicado de MongoDB
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la cuenta. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
