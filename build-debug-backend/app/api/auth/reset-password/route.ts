import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token, password } = body;

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Email, token y contrasena son requeridos" }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: "La contrasena debe tener al menos 6 caracteres" }, { status: 400 });
    }

    await dbConnect();

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "El enlace de recuperacion no es valido o ha expirado" }, { status: 400 });
    }

    user.password = await bcrypt.hash(String(password), 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Contrasena actualizada correctamente" });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json({ error: "No se pudo restablecer la contrasena" }, { status: 500 });
  }
}
