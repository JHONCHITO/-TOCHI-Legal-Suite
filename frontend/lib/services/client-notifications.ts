import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import { createNotificationForUsers } from "@/lib/services/automation";
import type { NotificationType } from "@/lib/models/Notification";

type ClientNotificationPayload = {
  clientId: unknown;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  enlace?: string;
  prioridad?: "alta" | "media" | "baja";
  casoId?: unknown;
  citaId?: unknown;
  documentoId?: unknown;
};

function normalizeEmail(email?: string | null) {
  return String(email || "").toLowerCase().trim();
}

export async function resolveClientNotificationRecipients(clientId: unknown) {
  if (!clientId) {
    return [];
  }

  await dbConnect();

  const client = await Client.findById(clientId)
    .select("_id userId email")
    .lean();

  if (!client) {
    return [];
  }

  const recipients = new Set<string>();

  if ((client as { userId?: unknown }).userId) {
    recipients.add(String((client as { userId?: unknown }).userId));
  }

  if (!recipients.size) {
    const email = normalizeEmail((client as { email?: string }).email);
    if (email) {
      const linkedUser = await User.findOne({
        email,
        rol: "cliente",
      })
        .select("_id")
        .lean();

      if (linkedUser) {
        recipients.add(String((linkedUser as { _id: unknown })._id));
      }
    }
  }

  return Array.from(recipients);
}

export async function notifyClientByClientId(payload: ClientNotificationPayload) {
  const userIds = await resolveClientNotificationRecipients(payload.clientId);

  if (!userIds.length) {
    return [];
  }

  return createNotificationForUsers({
    userIds,
    tipo: payload.tipo,
    titulo: payload.titulo,
    mensaje: payload.mensaje,
    enlace: payload.enlace,
    prioridad: payload.prioridad,
    casoId: payload.casoId,
    citaId: payload.citaId,
    documentoId: payload.documentoId,
  });
}
