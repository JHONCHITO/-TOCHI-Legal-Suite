import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

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

    // En producción, aquí enviarías un email real con un token
    // Por ahora, solo simulamos el proceso
    
    // Generar token de recuperación (en producción, guardar en DB)
    const resetToken = Math.random().toString(36).substring(2, 15);
    
    // TODO: Implementar envío de email real con servicio como:
    // - Resend
    // - SendGrid
    // - AWS SES
    
    console.log(`[v0] Reset token for ${email}: ${resetToken}`);
    
    // Actualizar usuario con token de reset (expira en 1 hora)
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hora
    });

    return NextResponse.json({
      message: "Si existe una cuenta con este correo, recibirás instrucciones para restablecer tu contraseña",
      success: true,
      // En desarrollo, mostramos el token para testing
      ...(process.env.NODE_ENV === "development" && { devToken: resetToken }),
    });
  } catch (error) {
    console.error("[v0] Error en forgot-password:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
