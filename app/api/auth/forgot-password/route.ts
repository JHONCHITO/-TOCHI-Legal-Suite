import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "El correo electrónico es requerido" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verificar si el usuario existe
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    // Siempre devolvemos éxito por seguridad
    // (no revelamos si el email existe o no)
    if (!user) {
      // Por seguridad, no indicamos que el usuario no existe
      return NextResponse.json({
        message: "Si existe una cuenta con este correo, recibirás instrucciones para restablecer tu contraseña",
        success: true,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordUrlBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const resetPasswordUrl = `${resetPasswordUrlBase.replace(/\/$/, "")}/reset-password?token=${resetToken}&email=${encodeURIComponent(email.toLowerCase().trim())}`;

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hora
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: process.env.MAIL_FROM || "TOCHI Legal Suite <no-reply@tochi.legal>",
        to: email.toLowerCase().trim(),
        subject: "Restablece tu contrasena en TOCHI Legal Suite",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
            <h2>Restablecer contrasena</h2>
            <p>Recibimos una solicitud para restablecer tu contrasena en TOCHI Legal Suite.</p>
            <p><a href="${resetPasswordUrl}">Haz clic aqui para crear una nueva contrasena</a></p>
            <p>Este enlace expira en 1 hora.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      message: "Si existe una cuenta con este correo, recibirás instrucciones para restablecer tu contraseña",
      success: true,
      ...(process.env.NODE_ENV === "development" && { devToken: resetToken, resetPasswordUrl }),
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
