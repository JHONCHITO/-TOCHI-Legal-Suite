import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Subscription from "@/lib/models/Subscription";
import Case from "@/lib/models/Case";
import Client from "@/lib/models/Client";
import Document from "@/lib/models/Document";
import Invoice from "@/lib/models/Invoice";
import Appointment from "@/lib/models/Appointment";
import Communication from "@/lib/models/Communication";
import ProcessSearch from "@/lib/models/ProcessSearch";
import Verification from "@/lib/models/Verification";
import { getPlanById } from "@/lib/products";
import { isSubscriptionAccessExpired } from "@/lib/subscription";
import { formatCurrencyCop, formatDateShort, getClientDisplayName } from "@/lib/utils/format";

export const runtime = "nodejs";

type AdminActivityTone = "neutral" | "success" | "warning" | "danger";
type AdminActivityType =
  | "usuario"
  | "cliente"
  | "caso"
  | "documento"
  | "factura"
  | "cita"
  | "comunicacion"
  | "busqueda"
  | "verificacion"
  | "suscripcion";

type AdminActivity = {
  _id: string;
  type: AdminActivityType;
  title: string;
  description: string;
  date: string;
  href?: string;
  tone: AdminActivityTone;
};

type AdminUserRow = {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  subscription: {
    status: string;
    planId: string;
    planName: string;
    trialEnd?: string | null;
    currentPeriodEnd?: string | null;
    accessUntil?: string | null;
    daysLeft?: number | null;
    notes?: string;
  } | null;
};

function parseDate(value: unknown) {
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function getAccessEnd(subscription: {
  status?: string;
  trialEnd?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
}) {
  const trialEnd = parseDate(subscription.trialEnd);
  const currentPeriodEnd = parseDate(subscription.currentPeriodEnd);

  if (subscription.status === "trialing" && trialEnd) {
    return trialEnd;
  }

  return currentPeriodEnd || trialEnd;
}

function normalizeActivity(activity: Omit<AdminActivity, "_id"> & { _id?: string }) {
  return {
    _id: activity._id || `${activity.type}-${activity.date}`,
    ...activity,
  };
}

function clip(value: string, limit = 120) {
  const text = value.trim();
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

async function checkSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { allowed: false, error: "No autorizado", status: 401 };
  }

  await dbConnect();
  const currentUser = await User.findById(session.user.id).select("rol").lean();
  if ((currentUser as { rol?: string } | null)?.rol !== "superadmin") {
    return { allowed: false, error: "Acceso denegado", status: 403 };
  }

  return { allowed: true, userId: session.user.id };
}

export async function GET() {
  try {
    const access = await checkSuperAdmin();
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const now = new Date();

    const [
      users,
      subscriptions,
      totalCases,
      totalClients,
      totalDocuments,
      totalInvoices,
      totalAppointments,
      totalCommunications,
      totalSearches,
      totalVerifications,
      recentCases,
      recentClients,
      recentDocuments,
      recentInvoices,
      recentAppointments,
      recentCommunications,
      recentSearches,
      recentVerifications,
    ] = await Promise.all([
      User.find({})
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .sort({ createdAt: -1 })
        .lean(),
      Subscription.find({})
        .populate("userId", "nombre apellido email rol")
        .sort({ updatedAt: -1 })
        .lean(),
      Case.countDocuments({}),
      Client.countDocuments({}),
      Document.countDocuments({}),
      Invoice.countDocuments({}),
      Appointment.countDocuments({}),
      Communication.countDocuments({}),
      ProcessSearch.countDocuments({}),
      Verification.countDocuments({}),
      Case.find({})
        .populate("clienteId", "nombre apellido razonSocial tipo")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Client.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Document.find({})
        .populate("clienteId", "nombre apellido razonSocial tipo")
        .populate("casoId", "titulo numeroInterno")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Invoice.find({})
        .populate("clienteId", "nombre apellido razonSocial tipo")
        .populate("casoId", "titulo numeroInterno")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Appointment.find({})
        .populate("clienteId", "nombre apellido razonSocial tipo")
        .populate("casoId", "titulo numeroInterno")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Communication.find({})
        .populate("clienteId", "nombre apellido razonSocial tipo")
        .populate("casoId", "titulo numeroInterno")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      ProcessSearch.find({})
        .populate("userId", "nombre apellido email rol")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Verification.find({})
        .populate("userId", "nombre apellido email rol")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const subscriptionMap = new Map<string, Record<string, any>>();
    subscriptions.forEach((subscription: Record<string, any>) => {
      const key = String(subscription.userId?._id || subscription.userId || "");
      if (key) {
        subscriptionMap.set(key, subscription);
      }
    });

    const userRows: AdminUserRow[] = users.map((user: Record<string, any>) => {
      const subscription = subscriptionMap.get(String(user._id));
      const accessEnd = subscription ? getAccessEnd(subscription) : null;
      const planId = String(subscription?.planId || "");
      const plan = planId ? getPlanById(planId) : undefined;
      const daysLeft = accessEnd ? daysBetween(now, accessEnd) : null;
      const effectiveStatus = subscription
        ? isSubscriptionAccessExpired(subscription)
          ? "past_due"
          : String(subscription.status || "trialing")
        : null;

      return {
        _id: String(user._id),
        nombre: String(user.nombre || ""),
        apellido: String(user.apellido || ""),
        email: String(user.email || ""),
        telefono: user.telefono ? String(user.telefono) : undefined,
        rol: String(user.rol || "abogado"),
        activo: Boolean(user.activo),
        createdAt: new Date(user.createdAt).toISOString(),
        subscription: subscription
          ? {
              status: effectiveStatus || String(subscription.status || "trialing"),
              planId,
              planName: plan?.name || planId || "Plan",
              trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd).toISOString() : null,
              currentPeriodEnd: subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toISOString()
                : null,
              accessUntil: accessEnd ? accessEnd.toISOString() : null,
              daysLeft,
              notes: subscription.notes ? String(subscription.notes) : undefined,
            }
          : null,
      };
    });

    const activeSubscriptions = subscriptions.filter((subscription: Record<string, any>) =>
      !isSubscriptionAccessExpired(subscription) && subscription.status === "active"
    ).length;
    const trialingSubscriptions = subscriptions.filter((subscription: Record<string, any>) =>
      !isSubscriptionAccessExpired(subscription) && subscription.status === "trialing"
    ).length;
    const pastDueSubscriptions = subscriptions.filter((subscription: Record<string, any>) =>
      isSubscriptionAccessExpired(subscription) || subscription.status === "past_due"
    ).length;
    const canceledSubscriptions = subscriptions.filter((subscription: Record<string, any>) => subscription.status === "canceled").length;
    const expiringSoonSubscriptions = subscriptions.filter((subscription: Record<string, any>) => {
      const accessEnd = getAccessEnd(subscription);
      if (!accessEnd) {
        return false;
      }

      const remaining = daysBetween(now, accessEnd);
      return remaining >= 0 && remaining <= 7;
    }).length;

    const combinedActivities: AdminActivity[] = [];

    users.slice(0, 6).forEach((user: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "usuario",
          title: `${user.nombre || "Usuario"} ${user.apellido || ""}`.trim(),
          description: `Se registró como ${String(user.rol || "abogado")}.`,
          date: new Date(user.createdAt).toISOString(),
          href: "/dashboard/admin",
          tone: "neutral",
        })
      );
    });

    recentClients.forEach((client: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "cliente",
          title: getClientDisplayName({
            tipo: client.tipo || "persona_natural",
            nombre: client.nombre,
            apellido: client.apellido,
            razonSocial: client.razonSocial,
          }),
          description: `Cliente creado con correo ${String(client.email || "")}.`,
          date: new Date(client.createdAt).toISOString(),
          href: "/dashboard/clientes",
          tone: client.activo ? "success" : "warning",
        })
      );
    });

    recentCases.forEach((caseRecord: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "caso",
          title: String(caseRecord.titulo || "Caso"),
          description: `${String(caseRecord.numeroInterno || "")} · ${String(caseRecord.estado || "consulta")}`,
          date: new Date(caseRecord.createdAt).toISOString(),
          href: `/dashboard/casos/${caseRecord._id}`,
          tone: "neutral",
        })
      );
    });

    recentDocuments.forEach((document: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "documento",
          title: String(document.nombre || "Documento"),
          description: `${String(document.tipo || "otro")} · ${String(document.estado || "borrador")}`,
          date: new Date(document.createdAt).toISOString(),
          href: "/dashboard/documentos",
          tone: document.portalCompartido ? "success" : "neutral",
        })
      );
    });

    recentInvoices.forEach((invoice: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "factura",
          title: `Factura ${String(invoice.numero || "")}`,
          description: `${formatCurrencyCop(Number(invoice.total || 0))} · ${String(invoice.estado || "pendiente")}`,
          date: new Date(invoice.createdAt).toISOString(),
          href: "/dashboard/facturacion",
          tone: invoice.estado === "pagada" ? "success" : invoice.estado === "vencida" ? "danger" : "warning",
        })
      );
    });

    recentAppointments.forEach((appointment: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "cita",
          title: String(appointment.titulo || "Cita"),
          description: `${String(appointment.tipo || "otro")} · ${formatDateShort(appointment.fechaInicio)}`,
          date: new Date(appointment.createdAt).toISOString(),
          href: "/dashboard/citas",
          tone: appointment.estado === "cancelada" ? "warning" : "neutral",
        })
      );
    });

    recentCommunications.forEach((communication: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "comunicacion",
          title: `${String(communication.canal || "nota").toUpperCase()} · ${String(communication.estado || "pendiente")}`,
          description: clip(String(communication.mensaje || "Sin mensaje"), 120),
          date: new Date(communication.createdAt).toISOString(),
          href: "/dashboard/comunicacion",
          tone: communication.whatsappStatus === "failed" ? "danger" : "neutral",
        })
      );
    });

    recentSearches.forEach((search: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "busqueda",
          title: `Busqueda de ${String(search.searchType || "radicado")}`,
          description: `${String(search.searchValue || "")} · ${Number(search.resultsCount || 0)} resultados`,
          date: new Date(search.createdAt).toISOString(),
          href: "/dashboard/herramientas/consulta-procesos",
          tone: Number(search.resultsCount || 0) > 0 ? "success" : "warning",
        })
      );
    });

    recentVerifications.forEach((verification: Record<string, any>) => {
      combinedActivities.push(
        normalizeActivity({
          type: "verificacion",
          title: `Verificacion ${String(verification.tipoDocumento || "")}`,
          description: `${String(verification.numeroDocumento || "")} · ${String(verification.estado || "")}`,
          date: new Date(verification.createdAt).toISOString(),
          href: "/dashboard/herramientas/verificador",
          tone: verification.estado === "valido" ? "success" : verification.estado === "invalido" ? "danger" : "warning",
        })
      );
    });

    subscriptions.slice(0, 6).forEach((subscription: Record<string, any>) => {
      const accessEnd = getAccessEnd(subscription);
      const plan = getPlanById(String(subscription.planId || ""));
      const effectiveStatus = isSubscriptionAccessExpired(subscription)
        ? "past_due"
        : String(subscription.status || "trialing");
      combinedActivities.push(
        normalizeActivity({
          type: "suscripcion",
          title: `${String(subscription.userId?.nombre || "Cuenta")} ${String(subscription.userId?.apellido || "")}`.trim(),
          description: `${plan?.name || subscription.planId || "Plan"} · ${effectiveStatus === "past_due" ? "vencida" : "vigente"}${accessEnd ? ` hasta ${formatDateShort(accessEnd)}` : ""}`,
          date: new Date(subscription.updatedAt || subscription.createdAt).toISOString(),
          href: "/dashboard/admin",
          tone: effectiveStatus === "past_due" ? "danger" : effectiveStatus === "trialing" ? "warning" : "success",
        })
      );
    });

    const activities = combinedActivities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    return NextResponse.json({
      summary: {
        users: {
          total: users.length,
          active: users.filter((user: Record<string, any>) => user.activo).length,
          superadmins: users.filter((user: Record<string, any>) => user.rol === "superadmin").length,
          admins: users.filter((user: Record<string, any>) => user.rol === "admin").length,
          abogados: users.filter((user: Record<string, any>) => user.rol === "abogado").length,
          asistentes: users.filter((user: Record<string, any>) => user.rol === "asistente").length,
          clientes: users.filter((user: Record<string, any>) => user.rol === "cliente").length,
        },
        subscriptions: {
          total: subscriptions.length,
          active: activeSubscriptions,
          trialing: trialingSubscriptions,
          pastDue: pastDueSubscriptions,
          canceled: canceledSubscriptions,
          expiringSoon: expiringSoonSubscriptions,
        },
        operations: {
          cases: totalCases,
          clients: totalClients,
          documents: totalDocuments,
          invoices: totalInvoices,
          appointments: totalAppointments,
          communications: totalCommunications,
          searches: totalSearches,
          verifications: totalVerifications,
        },
      },
      users: userRows,
      activities,
    });
  } catch (error) {
    console.error("Error fetching admin overview:", error);
    return NextResponse.json({ error: "No se pudo obtener el resumen administrativo" }, { status: 500 });
  }
}
