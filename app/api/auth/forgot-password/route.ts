import crypto from "crypto";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import {
  buildPasswordResetEmailDraft,
  sendPasswordResetEmail,
} from "@/lib/services/password-reset-email";

export const runtime = "nodejs";

function normalizeEmail(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);

    if (!email) {
      return NextResponse.json({ error: "El correo electronico es requerido" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email }).select("_id email nombre apellido").lean();
    if (!user) {
      return NextResponse.json({
        message: "Si existe una cuenta con este correo, recibirás instrucciones para restablecer tu contraseña.",
        success: true,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const baseUrl =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      "http://localhost:3000";
    const resetPasswordUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const emailDraft = buildPasswordResetEmailDraft({
      to: email,
      resetPasswordUrl,
      userName: [String(user.nombre || "").trim(), String(user.apellido || "").trim()].filter(Boolean).join(" "),
    });

    const delivery = await sendPasswordResetEmail({
      to: email,
      resetPasswordUrl,
      userName: [String(user.nombre || "").trim(), String(user.apellido || "").trim()].filter(Boolean).join(" "),
    });

    if (!delivery.sent) {
      const errorMessage =
        delivery.reason === "missing_resend"
          ? "El envio de correo no esta configurado en el servidor."
          : "No se pudo enviar el correo de recuperacion.";

      return NextResponse.json(
        {
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? delivery.error || emailDraft.subject : undefined,
        },
        { status: delivery.reason === "missing_resend" ? 503 : 500 }
      );
    }

    return NextResponse.json({
      message: "Si existe una cuenta con este correo, recibirás instrucciones para restablecer tu contraseña.",
      success: true,
      ...(process.env.NODE_ENV === "development" && {
        devToken: resetToken,
        resetPasswordUrl,
      }),
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
