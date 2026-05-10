import { NextResponse } from "next/server";

import dbConnect from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import Client from "@/lib/models/Client";
import Communication from "@/lib/models/Communication";
import { getWhatsAppWebhookVerifyToken } from "@/lib/services/whatsapp-config";
import { generateWhatsAppLegalReply } from "@/lib/services/whatsapp-ai-reply";
import { normalizeWhatsAppPhone, sendWhatsAppMessage } from "@/lib/services/whatsapp";

export const runtime = "nodejs";

async function verifyWebhook(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = await getWhatsAppWebhookVerifyToken();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return challenge;
  }

  return null;
}

function extractStatusUpdates(payload: any) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  return entries.flatMap((entry: any) =>
    Array.isArray(entry?.changes)
      ? entry.changes.flatMap((change: any) =>
          Array.isArray(change?.value?.statuses) ? change.value.statuses : []
        )
      : []
  );
}

function extractIncomingMessages(payload: any) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  return entries.flatMap((entry: any) =>
    Array.isArray(entry?.changes)
      ? entry.changes.flatMap((change: any) => {
          const value = change?.value || {};
          const messages = Array.isArray(value?.messages) ? value.messages : [];
          const contacts = Array.isArray(value?.contacts) ? value.contacts : [];

          return messages.map((message: any) => {
            const contact = contacts.find((item: any) => item?.wa_id === message?.from) || contacts[0] || {};

            return {
              messageId: message?.id || "",
              from: String(message?.from || ""),
              type: String(message?.type || ""),
              timestamp: String(message?.timestamp || ""),
              text: String(message?.text?.body || message?.button?.text || message?.interactive?.button_reply?.title || ""),
              contactName: String(contact?.profile?.name || ""),
              waId: String(contact?.wa_id || message?.from || ""),
            };
          });
        })
      : []
  );
}

async function findClientByWhatsAppPhone(phone: string) {
  if (!phone) {
    return null;
  }

  const clients = await Client.find({})
    .select("tipo nombre apellido razonSocial telefono celular casos")
    .lean();

  return (
    clients.find((client: any) => {
      const numbers = [client?.telefono, client?.celular]
        .map((value) => normalizeWhatsAppPhone(String(value || "")))
        .filter(Boolean);
      return numbers.includes(phone);
    }) || null
  );
}

async function resolveCaseLabel(client: any) {
  if (!client?._id) {
    return undefined;
  }

  const activeCase = await Case.findOne({
    clienteId: client._id,
    estado: { $in: ["activo", "en_tramite", "audiencia_pendiente", "sentencia", "apelacion", "consulta"] },
  })
    .sort({ updatedAt: -1 })
    .select("numeroInterno titulo")
    .lean();

  if (activeCase) {
    return `${activeCase.numeroInterno || ""} ${activeCase.titulo || ""}`.trim();
  }

  if (Array.isArray(client?.casos) && client.casos.length > 0) {
    const latestCase = await Case.findOne({ _id: { $in: client.casos } })
      .sort({ updatedAt: -1 })
      .select("numeroInterno titulo")
      .lean();

    if (latestCase) {
      return `${latestCase.numeroInterno || ""} ${latestCase.titulo || ""}`.trim();
    }
  }

  return undefined;
}

export async function GET(request: Request) {
  const challenge = await verifyWebhook(request);
  if (challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const statuses = extractStatusUpdates(payload);
    const incomingMessages = extractIncomingMessages(payload);

    if (!statuses.length && !incomingMessages.length) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    await dbConnect();

    let processedStatuses = 0;

    for (const status of statuses) {
      const messageId = status?.id;
      const whatsappStatus = status?.status;
      if (!messageId || !whatsappStatus) {
        continue;
      }

      const mapStatus =
        whatsappStatus === "sent"
          ? "sent"
          : whatsappStatus === "delivered"
            ? "delivered"
            : whatsappStatus === "read"
              ? "read"
              : whatsappStatus === "failed"
                ? "failed"
                : "queued";

      await Communication.updateOne(
        { whatsappMessageId: messageId },
        {
          $set: {
            whatsappStatus: mapStatus,
            estado: mapStatus === "failed" ? "sin_respuesta" : "completado",
          },
        }
      );

      processedStatuses += 1;
    }

    let processedMessages = 0;

    for (const incoming of incomingMessages) {
      const normalizedPhone = normalizeWhatsAppPhone(incoming.from);
      const inboundText = incoming.text.trim();

      if (!normalizedPhone || !inboundText) {
        continue;
      }

      const client = await findClientByWhatsAppPhone(normalizedPhone);
      const clientName =
        client?.tipo === "persona_juridica"
          ? client?.razonSocial || "Cliente"
          : `${client?.nombre || ""} ${client?.apellido || ""}`.trim() || "Cliente";

      const caseLabel = client ? await resolveCaseLabel(client) : undefined;
      const reply = await generateWhatsAppLegalReply({
        requestUrl: request.url,
        message: inboundText,
        clientName,
        caseLabel,
        sourcePhone: normalizedPhone,
      });

      const whatsappReply = await sendWhatsAppMessage({
        phone: normalizedPhone,
        message: reply.reply,
        previewUrl: true,
      });

      if (client?._id) {
        const inboundCommunication = new Communication({
          clienteId: client._id,
          casoId: undefined,
          canal: "whatsapp",
          tipo: "entrada",
          asunto: `WhatsApp entrante${caseLabel ? ` - ${caseLabel}` : ""}`,
          mensaje: inboundText,
          estado: "respondido",
          prioridad: "media",
          fecha: incoming.timestamp ? new Date(Number(incoming.timestamp) * 1000) : new Date(),
          whatsappPhone: normalizedPhone,
          whatsappMessageId: incoming.messageId,
          whatsappStatus: "received",
          notas: reply.mode === "fallback" ? "Respuesta generada con respaldo local" : "Respuesta generada por IA",
        });

        await inboundCommunication.save();

        const outboundCommunication = new Communication({
          clienteId: client._id,
          casoId: undefined,
          canal: "whatsapp",
          tipo: "salida",
          asunto: `Respuesta WhatsApp${caseLabel ? ` - ${caseLabel}` : ""}`,
          mensaje: reply.reply,
          estado: whatsappReply.sent ? "completado" : "pendiente",
          prioridad: "media",
          fecha: new Date(),
          whatsappPhone: normalizedPhone,
          whatsappMessageId: whatsappReply.messageId || "",
          whatsappStatus: whatsappReply.sent ? "sent" : whatsappReply.mode === "wa_me" ? "fallback" : "not_configured",
          whatsappFallbackUrl: whatsappReply.fallbackUrl || "",
          whatsappError: whatsappReply.error || "",
          notas: reply.mode === "fallback" ? "Generada con respaldo local" : "Generada por IA",
        });

        await outboundCommunication.save();
      } else {
        console.warn("WhatsApp entrante sin cliente asociado:", {
          phone: normalizedPhone,
          messageId: incoming.messageId,
        });
      }

      processedMessages += 1;
    }

    return NextResponse.json({ ok: true, processed: processedStatuses + processedMessages, processedStatuses, processedMessages });
  } catch (error) {
    console.error("Error en webhook de WhatsApp:", error);
    return NextResponse.json(
      { error: "Error procesando webhook", details: String(error) },
      { status: 500 }
    );
  }
}
