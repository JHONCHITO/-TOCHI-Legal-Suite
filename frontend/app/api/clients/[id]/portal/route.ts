import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import Case from "@/lib/models/Case";
import Document from "@/lib/models/Document";
import Invoice from "@/lib/models/Invoice";
import Appointment from "@/lib/models/Appointment";
import Communication from "@/lib/models/Communication";
import {
  buildClientPortalShareEmailDraft,
  sendClientPortalShareEmail,
} from "@/lib/services/client-portal-email";
import { notifyClientByClientId } from "@/lib/services/client-notifications";

type SessionLike = {
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
};

type PortalShareScope = "all" | "cases" | "documents" | "invoices" | "appointments";

function normalizeEmail(email?: string | null) {
  return String(email || "").toLowerCase().trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeScope(scope: unknown): PortalShareScope {
  const value = String(scope || "all").toLowerCase().trim();
  if (value === "cases" || value === "documents" || value === "invoices" || value === "appointments") {
    return value;
  }
  return "all";
}

function scopeConfig(scope: PortalShareScope) {
  switch (scope) {
    case "cases":
      return {
        title: "Casos enviados por correo",
        label: "casos",
        link: "/dashboard#casos",
        tipo: "caso_actualizado" as const,
      };
    case "documents":
      return {
        title: "Documentos enviados por correo",
        label: "documentos",
        link: "/dashboard#documentos",
        tipo: "documento_nuevo" as const,
      };
    case "invoices":
      return {
        title: "Facturas enviadas por correo",
        label: "facturas",
        link: "/dashboard#facturas",
        tipo: "sistema" as const,
      };
    case "appointments":
      return {
        title: "Citas enviadas por correo",
        label: "citas",
        link: "/dashboard#agenda",
        tipo: "cita_proxima" as const,
      };
    case "all":
    default:
      return {
        title: "Actualizacion enviada por tu abogado",
        label: "contenido enviado",
        link: "/dashboard",
        tipo: "sistema" as const,
      };
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function buildHighlights(
  scope: PortalShareScope,
  payload: {
    cases: Array<Record<string, unknown>>;
    documents: Array<Record<string, unknown>>;
    invoices: Array<Record<string, unknown>>;
    appointments: Array<Record<string, unknown>>;
  }
) {
  const caseLines = payload.cases.map((item) => {
    const numero = String(item.numeroInterno || item.numeroRadicado || "").trim();
    const titulo = String(item.titulo || "Caso sin titulo").trim();
    const estado = String(item.estado || "").trim();
    return `Caso ${numero ? `${numero} - ` : ""}${titulo}${estado ? ` (${estado})` : ""}`.trim();
  });

  const documentLines = payload.documents.map((item) => {
    const nombre = String(item.nombre || "Documento sin titulo").trim();
    const tipo = String(item.tipo || "").trim();
    const estado = String(item.estado || "").trim();
    return `Documento ${nombre}${tipo ? ` - ${tipo}` : ""}${estado ? ` (${estado})` : ""}`.trim();
  });

  const invoiceLines = payload.invoices.map((item) => {
    const numero = String(item.numero || "Factura sin numero").trim();
    const total = Number(item.total || 0);
    const estado = String(item.estado || "").trim();
    return `Factura ${numero} - ${formatCurrency(total)}${estado ? ` (${estado})` : ""}`.trim();
  });

  const appointmentLines = payload.appointments.map((item) => {
    const titulo = String(item.titulo || "Cita sin titulo").trim();
    const fechaInicio = item.fechaInicio ? new Date(String(item.fechaInicio)) : null;
    const fecha = fechaInicio && !Number.isNaN(fechaInicio.getTime())
      ? fechaInicio.toLocaleDateString("es-CO")
      : "";
    const estado = String(item.estado || "").trim();
    return `Cita ${titulo}${fecha ? ` - ${fecha}` : ""}${estado ? ` (${estado})` : ""}`.trim();
  });

  if (scope === "cases") {
    return caseLines.slice(0, 5);
  }
  if (scope === "documents") {
    return documentLines.slice(0, 5);
  }
  if (scope === "invoices") {
    return invoiceLines.slice(0, 5);
  }
  if (scope === "appointments") {
    return appointmentLines.slice(0, 5);
  }

  return [
    ...caseLines.slice(0, 2),
    ...documentLines.slice(0, 2),
    ...invoiceLines.slice(0, 2),
    ...appointmentLines.slice(0, 2),
  ];
}

async function publishPortalScope(clientId: string, scope: PortalShareScope, publishedAt: Date) {
  const sharedCounts = {
    cases: 0,
    documents: 0,
    invoices: 0,
    appointments: 0,
  };

  if (scope === "all" || scope === "cases") {
    const result = await Case.updateMany(
      { clienteId: clientId },
      {
        $set: {
          portalCompartido: true,
          portalCompartidoEn: publishedAt,
        },
      }
    );
    sharedCounts.cases = Number(result.matchedCount || result.modifiedCount || 0);
  }

  if (scope === "all" || scope === "documents") {
    const result = await Document.updateMany(
      { clienteId: clientId },
      {
        $set: {
          portalCompartido: true,
          portalCompartidoEn: publishedAt,
        },
      }
    );
    sharedCounts.documents = Number(result.matchedCount || result.modifiedCount || 0);
  }

  if (scope === "all" || scope === "invoices") {
    const result = await Invoice.updateMany(
      { clienteId: clientId },
      {
        $set: {
          portalCompartido: true,
          portalCompartidoEn: publishedAt,
        },
      }
    );
    sharedCounts.invoices = Number(result.matchedCount || result.modifiedCount || 0);
  }

  if (scope === "all" || scope === "appointments") {
    const result = await Appointment.updateMany(
      { clienteId: clientId },
      {
        $set: {
          portalCompartido: true,
          portalCompartidoEn: publishedAt,
        },
      }
    );
    sharedCounts.appointments = Number(result.matchedCount || result.modifiedCount || 0);
  }

  return sharedCounts;
}

async function canManageClient(session: SessionLike, clientId: string) {
  if (!session.user?.id) {
    return false;
  }

  const user = await User.findById(session.user.id).select("rol").lean();
  const userRole = (user as { rol?: string } | null)?.rol || "abogado";

  if (userRole === "superadmin" || userRole === "admin") {
    return true;
  }

  const client = await Client.findById(clientId).select("abogadoAsignado").lean();
  if (!client) {
    return false;
  }

  return String((client as { abogadoAsignado?: unknown }).abogadoAsignado || "") === String(session.user.id);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth()) as SessionLike;
    if (!session.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    let body: { scope?: unknown; portalEmail?: unknown } = {};
    try {
      body = (await request.json()) as { scope?: unknown; portalEmail?: unknown };
    } catch {
      body = {};
    }

    await dbConnect();

    const allowed = await canManageClient(session, id);
    if (!allowed) {
      return NextResponse.json({ error: "No tienes permisos para sincronizar este cliente" }, { status: 403 });
    }

    const client = await Client.findById(id).lean();
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const normalizedEmail = normalizeEmail((client as { email?: string }).email);
    const requestedPortalEmail =
      typeof body.portalEmail === "string" ? normalizeEmail(body.portalEmail) : "";
    if (requestedPortalEmail && !isValidEmail(requestedPortalEmail)) {
      return NextResponse.json(
        { error: "El correo no es valido" },
        { status: 400 }
      );
    }
    const linkedUser =
      (client as { userId?: unknown }).userId
        ? await User.findById((client as { userId?: unknown }).userId)
            .select("_id email nombre apellido rol activo")
            .lean()
        : null;

    let portalUser: { _id: unknown } | null = null;

    if (requestedPortalEmail) {
      portalUser = await User.findOne({
        email: requestedPortalEmail,
        rol: "cliente",
      })
        .select("_id email nombre apellido rol activo")
        .lean();
    } else {
      const userByClientEmail =
        normalizedEmail
          ? await User.findOne({
              email: normalizedEmail,
              rol: "cliente",
            })
              .select("_id email nombre apellido rol activo")
              .lean()
          : null;

      portalUser = linkedUser || userByClientEmail;
    }

    const portalRecipientEmail =
      requestedPortalEmail ||
      normalizeEmail((portalUser as { email?: string } | null)?.email) ||
      normalizedEmail;

    if (!portalRecipientEmail) {
      return NextResponse.json(
        {
          error: "No encontramos un correo valido para enviar la actualizacion.",
        },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      portalUltimaSincronizacion: new Date(),
    };
    if (portalUser) {
      updatePayload.userId = (portalUser as { _id: unknown })._id;
      updatePayload.tieneAccesoPortal = true;
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        $set: updatePayload,
      },
      { new: true, runValidators: true }
    )
      .populate("userId", "nombre apellido email rol activo")
      .populate("casos", "titulo estado numeroInterno fechaProximaActuacion")
      .lean();

    if (!updatedClient) {
      return NextResponse.json({ error: "No se pudo actualizar el cliente" }, { status: 500 });
    }

    const scope = normalizeScope(body.scope);
    const publishedAt = new Date();
    const [casesCount, documentsCount, invoicesCount, appointmentsCount, communicationsCount, sharedCounts] = await Promise.all([
      Case.countDocuments({ clienteId: id }),
      Document.countDocuments({ clienteId: id }),
      Invoice.countDocuments({ clienteId: id }),
      Appointment.countDocuments({ clienteId: id }),
      Communication.countDocuments({ clienteId: id }),
      publishPortalScope(id, scope, publishedAt),
    ]);

    const [
      recentCases,
      recentDocuments,
      recentInvoices,
      recentAppointments,
    ] = await Promise.all([
      scope === "all" || scope === "cases"
        ? Case.find({ clienteId: id }).sort({ updatedAt: -1 }).limit(3).select("titulo numeroInterno numeroRadicado estado").lean()
        : Promise.resolve([]),
      scope === "all" || scope === "documents"
        ? Document.find({ clienteId: id }).sort({ updatedAt: -1 }).limit(3).select("nombre tipo estado").lean()
        : Promise.resolve([]),
      scope === "all" || scope === "invoices"
        ? Invoice.find({ clienteId: id }).sort({ updatedAt: -1 }).limit(3).select("numero total estado").lean()
        : Promise.resolve([]),
      scope === "all" || scope === "appointments"
        ? Appointment.find({ clienteId: id }).sort({ updatedAt: -1 }).limit(3).select("titulo fechaInicio estado").lean()
        : Promise.resolve([]),
    ]);

    const highlights = buildHighlights(scope, {
      cases: recentCases as Array<Record<string, unknown>>,
      documents: recentDocuments as Array<Record<string, unknown>>,
      invoices: recentInvoices as Array<Record<string, unknown>>,
      appointments: recentAppointments as Array<Record<string, unknown>>,
    });

    const clientName =
      (client as { nombre?: string; apellido?: string; razonSocial?: string }).razonSocial ||
      [String((client as { nombre?: string }).nombre || "").trim(), String((client as { apellido?: string }).apellido || "").trim()]
        .filter(Boolean)
        .join(" ") ||
      "cliente";

    const emailDraft = buildClientPortalShareEmailDraft({
      to: portalRecipientEmail,
      clientName,
      scope,
      counts: {
        cases: casesCount,
        documents: documentsCount,
        invoices: invoicesCount,
        appointments: appointmentsCount,
        communications: communicationsCount,
      },
      portalLinked: Boolean(portalUser),
      highlights,
    });
    const emailDelivery = await sendClientPortalShareEmail({
      to: portalRecipientEmail,
      clientName,
      scope,
      counts: {
        cases: casesCount,
        documents: documentsCount,
        invoices: invoicesCount,
        appointments: appointmentsCount,
        communications: communicationsCount,
      },
      portalLinked: Boolean(portalUser),
      highlights,
    });

    const config = scopeConfig(scope);
    const countByScope = {
      all: casesCount + documentsCount + invoicesCount + appointmentsCount + communicationsCount,
      cases: casesCount,
      documents: documentsCount,
      invoices: invoicesCount,
      appointments: appointmentsCount,
    } as const;
    const selectedCount = countByScope[scope];
    const singularLabel =
      scope === "cases"
        ? "caso"
        : scope === "documents"
          ? "documento"
          : scope === "invoices"
            ? "factura"
            : scope === "appointments"
              ? "cita"
              : "elemento";
    const pluralLabel =
      scope === "cases"
        ? "casos"
        : scope === "documents"
          ? "documentos"
          : scope === "invoices"
            ? "facturas"
            : scope === "appointments"
              ? "citas"
              : "elementos";

    await notifyClientByClientId({
      clientId: id,
      tipo: config.tipo,
      prioridad: "media",
      titulo: config.title,
      mensaje:
        scope === "all"
          ? `Tu abogado envio una actualizacion con ${casesCount} casos, ${documentsCount} documentos, ${appointmentsCount} citas, ${invoicesCount} facturas y ${communicationsCount} comunicaciones.`
          : selectedCount > 0
            ? `Tu abogado compartio ${selectedCount} ${selectedCount === 1 ? singularLabel : pluralLabel} por correo.`
            : `El correo quedo listo para ${pluralLabel}, pero todavia no hay ${pluralLabel} para mostrar.`,
      enlace: config.link,
    });

    return NextResponse.json({
      client: updatedClient,
      scope,
      publishedAt,
      sharedCounts,
      counts: {
        cases: casesCount,
        documents: documentsCount,
        invoices: invoicesCount,
        appointments: appointmentsCount,
        communications: communicationsCount,
      },
      portalLinked: Boolean(portalUser),
      emailDelivery,
      emailDraft,
      recipientEmail: portalRecipientEmail,
      message: "Actualizacion enviada correctamente",
    });
  } catch (error) {
    console.error("Error sending client update:", error);
    return NextResponse.json({ error: "No se pudo enviar la actualizacion" }, { status: 500 });
  }
}

