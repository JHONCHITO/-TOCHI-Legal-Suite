import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { ensureSubscriptionForUser } from "@/lib/subscription";

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "jhonrique@gmail.com";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "Rick0066@#0066";
const DEFAULT_ADMIN_NOMBRE = process.env.DEFAULT_ADMIN_NOMBRE || "Jhon Rique";
const DEFAULT_ADMIN_APELLIDO = process.env.DEFAULT_ADMIN_APELLIDO || "Chito Ruiz";

// Configura o actualiza la cuenta inicial del administrador principal.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
    const password = String(body.password || DEFAULT_ADMIN_PASSWORD);
    const nombre = String(body.nombre || DEFAULT_ADMIN_NOMBRE).trim();
    const apellido = String(body.apellido || DEFAULT_ADMIN_APELLIDO).trim();
    const rol = "superadmin";
    const secretKey = body.secretKey ? String(body.secretKey) : "";

    if (!email || !password || !nombre || !apellido) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const isDefaultBootstrap =
      email === DEFAULT_ADMIN_EMAIL.toLowerCase() && password === DEFAULT_ADMIN_PASSWORD;

    if (!isDefaultBootstrap && secretKey !== process.env.AUTH_SECRET) {
      return NextResponse.json({ error: "Clave secreta invalida" }, { status: 403 });
    }

    await dbConnect();

    const hashedPassword = await bcrypt.hash(password, 12);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.nombre = nombre;
      existingUser.apellido = apellido;
      existingUser.rol = rol;
      existingUser.activo = true;
      existingUser.emailVerified = new Date();
      await existingUser.save();

      return NextResponse.json(
        {
          success: true,
          message: "Superadmin actualizado correctamente",
          user: {
            email: existingUser.email,
            nombre: existingUser.nombre,
            apellido: existingUser.apellido,
            rol: existingUser.rol,
          },
        },
        { status: 200 }
      );
    }

    const admin = new User({
      email,
      password: hashedPassword,
      nombre,
      apellido,
      rol,
      activo: true,
      emailVerified: new Date(),
    });

    await admin.save();

    try {
      await ensureSubscriptionForUser(admin._id.toString(), {
        planId: "plan-firma",
        resetTrial: true,
        status: "active",
      });
    } catch (subscriptionError) {
      console.warn(
        "No se pudo crear la suscripcion del administrador, se devuelve la cuenta igualmente:",
        subscriptionError instanceof Error ? subscriptionError.message : subscriptionError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Superadmin creado exitosamente",
        user: {
          email: admin.email,
          nombre: admin.nombre,
          apellido: admin.apellido,
          rol: admin.rol,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json({ error: "Error al crear administrador" }, { status: 500 });
  }
}

// Verifica si existe el administrador por defecto
export async function GET() {
  try {
    await dbConnect();
    const existingAdmin = await User.findOne({
      email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
    })
      .select("email nombre apellido rol")
      .lean();

    return NextResponse.json({
      exists: !!existingAdmin,
      admin: existingAdmin
        ? {
            nombre: (existingAdmin as any).nombre,
            email: (existingAdmin as any).email,
            rol: (existingAdmin as any).rol,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ exists: false, admin: null });
  }
}
