import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").toLowerCase().trim();
    const token = String(body.token || "").trim();
    const password = String(body.password || "");

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Email, token y contrasena son requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contrasena debe tener al menos 6 caracteres" }, { status: 400 });
    }

    await dbConnect();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "El enlace de recuperacion no es valido o ha expirado" }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Contrasena actualizada correctamente" });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json({ error: "No se pudo restablecer la contrasena" }, { status: 500 });
  }
}
