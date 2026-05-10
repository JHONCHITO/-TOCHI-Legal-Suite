import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Communication from "@/lib/models/Communication";
import { sendWhatsAppMessage, buildWhatsAppTextMessage, normalizeWhatsAppPhone } from "@/lib/services/whatsapp";

const INTERNAL_ROLES = new Set(["superadmin", "admin", "abogado", "asistente"]);

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !INTERNAL_ROLES.has(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const clienteId = typeof body?.clienteId === "string" ? body.clienteId : "";
    const casoId = typeof body?.casoId === "string" ? body.casoId : undefined;
    const mensaje = typeof body?.mensaje === "string" ? body.mensaje.trim() : "";
    const asunto = typeof body?.asunto === "string" ? body.asunto.trim() : "WhatsApp";
    const prioridad = typeof body?.prioridad === "string" ? body.prioridad : "media";

    if (!clienteId || !mensaje) {
      return NextResponse.json({ error: "Cliente y mensaje son requeridos" }, { status: 400 });
    }

    await dbConnect();

    const client = await Client.findById(clienteId)
      .select("tipo nombre apellido razonSocial telefono celular")
      .lean();

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const phoneSource = String((client as any).celular || (client as any).telefono || "").trim();
    const phone = normalizeWhatsAppPhone(phoneSource);

    if (!phone) {
      return NextResponse.json({ error: "El cliente no tiene telefono valido para WhatsApp" }, { status: 400 });
    }

    const clientName =
      (client as any).tipo === "persona_juridica"
        ? (client as any).razonSocial || "Cliente"
        : `${(client as any).nombre || ""} ${(client as any).apellido || ""}`.trim() || "Cliente";

    const caseLabel = typeof body?.caseLabel === "string" ? body.caseLabel : undefined;
    const fullMessage = buildWhatsAppTextMessage({
      clientName,
      caseLabel,
      message: mensaje,
    });

    const sendResult = await sendWhatsAppMessage({
      phone,
      message: fullMessage,
      previewUrl: true,
    });

    const communication = new Communication({
      creadorId: session.user.id,
      clienteId,
      casoId,
      canal: "whatsapp",
      tipo: "salida",
      asunto,
      mensaje: fullMessage,
      estado: sendResult.sent ? "completado" : "pendiente",
      prioridad,
      fecha: new Date(),
      whatsappPhone: phone,
      whatsappMessageId: sendResult.messageId || "",
      whatsappStatus: sendResult.sent ? "sent" : sendResult.mode === "wa_me" ? "fallback" : "not_configured",
      whatsappFallbackUrl: sendResult.fallbackUrl || "",
      whatsappError: sendResult.error || "",
    });

    await communication.save();

    return NextResponse.json({
      success: true,
      communication,
      whatsapp: sendResult,
    });
  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    return NextResponse.json(
      { error: "Error al enviar WhatsApp", details: String(error) },
      { status: 500 }
    );
  }
}
