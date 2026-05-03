import Appointment from "@/lib/models/Appointment";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import {
  LEGAL_AREAS,
  getAreaDefinition,
  type LegalAreaKey,
  type LegalUpdatesPayload,
} from "@/lib/legal-updates";

const ALERT_ROLES = ["superadmin", "admin", "abogado", "asistente"] as const;
const APPOINTMENT_REMINDER_WINDOW_HOURS = 24;
const APPOINTMENT_DUPLICATE_WINDOW_HOURS = 12;
const LEGAL_DUPLICATE_WINDOW_HOURS = 24;

type LeanAppointment = {
  _id: unknown;
  titulo: string;
  tipo: string;
  fechaInicio: string | Date;
  ubicacion?: string;
  esVirtual?: boolean;
  linkVirtual?: string;
  abogadoId?: unknown;
  clienteId?: {
    nombre?: string;
    apellido?: string;
    razonSocial?: string;
    tipo?: string;
    email?: string;
  } | null;
};

type Recipient = {
  _id: unknown;
  rol: string;
};

function hoursAgo(now: Date, hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

function hoursFromNow(now: Date, hours: number) {
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

function formatDateTime(value: string | Date) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatClient(appointment: LeanAppointment) {
  const client = appointment.clienteId;
  if (!client) return "sin cliente asociado";

  if (client.tipo === "persona_juridica") {
    return client.razonSocial || "cliente juridico";
  }

  const name = [client.nombre, client.apellido].filter(Boolean).join(" ").trim();
  return name || client.email || "cliente";
}

async function getAlertRecipients() {
  return User.find({
    activo: true,
    rol: { $in: [...ALERT_ROLES] },
  })
    .select("_id rol")
    .lean<Recipient[]>();
}

async function createNotificationForUsers(params: {
  userIds: unknown[];
  tipo: "cita_proxima" | "actualizacion_ley";
  titulo: string;
  mensaje: string;
  enlace?: string;
  citaId?: unknown;
}) {
  const createdUserIds: string[] = [];
  const cutoff = hoursAgo(new Date(), params.tipo === "cita_proxima" ? APPOINTMENT_DUPLICATE_WINDOW_HOURS : LEGAL_DUPLICATE_WINDOW_HOURS);

  for (const userId of params.userIds) {
    const normalizedUserId = String(userId);
    const duplicateQuery: Record<string, unknown> = {
      userId: normalizedUserId,
      tipo: params.tipo,
      titulo: params.titulo,
      createdAt: { $gte: cutoff },
    };

    if (params.citaId) {
      duplicateQuery.citaId = String(params.citaId);
    }

    const alreadyExists = await Notification.findOne(duplicateQuery).select("_id").lean();
    if (alreadyExists) {
      continue;
    }

    await Notification.create({
      userId: normalizedUserId,
      tipo: params.tipo,
      titulo: params.titulo,
      mensaje: params.mensaje,
      enlace: params.enlace,
      citaId: params.citaId ? String(params.citaId) : undefined,
    });

    createdUserIds.push(String(userId));
  }

  return createdUserIds;
}

export async function syncAppointmentReminders(now = new Date()) {
  const cutoff = hoursFromNow(now, APPOINTMENT_REMINDER_WINDOW_HOURS);

  const appointments = (await Appointment.find({
    estado: { $in: ["programada", "confirmada", "reprogramada"] },
    $or: [
      { recordatorioEnviado: { $ne: true }, recordatorioFecha: { $lte: now } },
      { recordatorioEnviado: { $ne: true }, fechaInicio: { $gte: now, $lte: cutoff } },
    ],
  })
    .populate("clienteId", "nombre apellido razonSocial tipo email")
    .lean()) as LeanAppointment[];

  let created = 0;

  for (const appointment of appointments) {
    if (!appointment.abogadoId) {
      continue;
    }

    const appointmentId = String(appointment._id);

    const titulo = `Recordatorio de cita: ${appointment.titulo}`;
    const mensaje = [
      `Tienes una ${appointment.tipo} programada para ${formatDateTime(appointment.fechaInicio)}.`,
      `Cliente: ${formatClient(appointment)}.`,
      appointment.esVirtual
        ? `Modalidad virtual${appointment.linkVirtual ? `: ${appointment.linkVirtual}` : ""}.`
        : appointment.ubicacion
          ? `Ubicacion: ${appointment.ubicacion}.`
          : "",
    ]
      .filter(Boolean)
      .join(" ");

    const createdUsers = await createNotificationForUsers({
      userIds: [appointment.abogadoId],
      tipo: "cita_proxima",
      titulo,
      mensaje,
      enlace: "/dashboard/citas",
      citaId: appointmentId,
    });

    if (createdUsers.length) {
      created += createdUsers.length;
      await Appointment.updateOne(
        { _id: appointmentId },
        {
          $set: {
            recordatorioEnviado: true,
            recordatorioFecha: now,
          },
        }
      );
    }
  }

  return { created, checked: appointments.length };
}

async function fetchLegalDigest(origin: string, area: LegalAreaKey) {
  const response = await fetch(`${origin}/api/legal-updates?area=${area}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as LegalUpdatesPayload;
}

function buildLegalMessage(payload: LegalUpdatesPayload) {
  const topItems = [...payload.legalUpdates, ...payload.jurisprudenceUpdates].slice(0, 4);
  const fragments = topItems.map((item) => `${item.title} (${item.source})`).join(" | ");
  return [payload.summary, fragments].filter(Boolean).join(" ");
}

export async function syncLegalUpdates(origin: string, now = new Date()) {
  const recipients = await getAlertRecipients();
  const areaKeys = LEGAL_AREAS.filter((item) => item.key !== "todas").map((item) => item.key as LegalAreaKey);
  const results: Array<{ area: LegalAreaKey; created: number; usedFallback: boolean }> = [];

  for (const area of areaKeys) {
    const payload = await fetchLegalDigest(origin, area);
    if (!payload || payload.usedFallback) {
      results.push({ area, created: 0, usedFallback: true });
      continue;
    }

    const areaDefinition = getAreaDefinition(area);
    const titulo = `Novedades ${areaDefinition.label}`;
    const mensaje = buildLegalMessage(payload);
    const enlace = `/dashboard/actualizaciones?area=${area}`;

    const createdUsers = await createNotificationForUsers({
      userIds: recipients.map((recipient) => recipient._id),
      tipo: "actualizacion_ley",
      titulo,
      mensaje,
      enlace,
    });

    results.push({
      area,
      created: createdUsers.length,
      usedFallback: false,
    });
  }

  return {
    created: results.reduce((total, item) => total + item.created, 0),
    areas: results,
    recipients: recipients.length,
  };
}

export async function syncAllAutomations(origin: string, now = new Date()) {
  const appointments = await syncAppointmentReminders(now);
  const legal = await syncLegalUpdates(origin, now);

  return {
    appointments,
    legal,
    ranAt: now.toISOString(),
  };
}
