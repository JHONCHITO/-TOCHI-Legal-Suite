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
import { formatDateShort } from "@/lib/utils/format";
import { auth } from "@/lib/auth";

export type AdminActivityTone = "neutral" | "success" | "warning" | "danger";
export type AdminActivityType = "usuario" | "suscripcion";

export type AdminActivity = {
  _id: string;
  type: AdminActivityType;
  title: string;
  description: string;
  date: string;
  href?: string;
  tone: AdminActivityTone;
};

export type AdminUserRow = {
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

export type AdminOverview = {
  summary: {
    users: {
      total: number;
      active: number;
      superadmins: number;
      admins: number;
      abogados: number;
      asistentes: number;
      clientes: number;
    };
    subscriptions: {
      total: number;
      active: number;
      trialing: number;
      pastDue: number;
      canceled: number;
      expiringSoon: number;
    };
    operations: {
      cases: number;
      clients: number;
      documents: number;
      invoices: number;
      appointments: number;
      communications: number;
      searches: number;
      verifications: number;
    };
  };
  users: AdminUserRow[];
  activities: AdminActivity[];
};

function parseDate(value: unknown) {
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeIso(value: unknown, fallback = new Date().toISOString()) {
  const date = parseDate(value);
  return date ? date.toISOString() : fallback;
}

function safeShortDate(value: unknown, fallback = "Sin fecha") {
  const date = parseDate(value);
  return date ? formatDateShort(date) : fallback;
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

  return { allowed: true };
}

export function createEmptyAdminOverview(): AdminOverview {
  return {
    summary: {
      users: {
        total: 0,
        active: 0,
        superadmins: 0,
        admins: 0,
        abogados: 0,
        asistentes: 0,
        clientes: 0,
      },
      subscriptions: {
        total: 0,
        active: 0,
        trialing: 0,
        pastDue: 0,
        canceled: 0,
        expiringSoon: 0,
      },
      operations: {
        cases: 0,
        clients: 0,
        documents: 0,
        invoices: 0,
        appointments: 0,
        communications: 0,
        searches: 0,
        verifications: 0,
      },
    },
    users: [],
    activities: [],
  };
}

export async function loadAdminOverview(): Promise<AdminOverview> {
  const access = await checkSuperAdmin();
  if (!access.allowed) {
    throw new Error(access.error);
  }

  const now = new Date();

  const [
    usersResult,
    subscriptionsResult,
    totalCasesResult,
    totalClientsResult,
    totalDocumentsResult,
    totalInvoicesResult,
    totalAppointmentsResult,
    totalCommunicationsResult,
    totalSearchesResult,
    totalVerificationsResult,
  ] = await Promise.allSettled([
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
  ]);

  const users = usersResult.status === "fulfilled" ? usersResult.value : [];
  const subscriptions = subscriptionsResult.status === "fulfilled" ? subscriptionsResult.value : [];
  const totalCases = totalCasesResult.status === "fulfilled" ? totalCasesResult.value : 0;
  const totalClients = totalClientsResult.status === "fulfilled" ? totalClientsResult.value : 0;
  const totalDocuments = totalDocumentsResult.status === "fulfilled" ? totalDocumentsResult.value : 0;
  const totalInvoices = totalInvoicesResult.status === "fulfilled" ? totalInvoicesResult.value : 0;
  const totalAppointments = totalAppointmentsResult.status === "fulfilled" ? totalAppointmentsResult.value : 0;
  const totalCommunications = totalCommunicationsResult.status === "fulfilled" ? totalCommunicationsResult.value : 0;
  const totalSearches = totalSearchesResult.status === "fulfilled" ? totalSearchesResult.value : 0;
  const totalVerifications = totalVerificationsResult.status === "fulfilled" ? totalVerificationsResult.value : 0;

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
      createdAt: safeIso(user.createdAt, now.toISOString()),
      subscription: subscription
        ? {
            status: effectiveStatus || String(subscription.status || "trialing"),
            planId,
            planName: plan?.name || planId || "Plan",
            trialEnd: subscription.trialEnd ? safeIso(subscription.trialEnd, "") : null,
            currentPeriodEnd: subscription.currentPeriodEnd ? safeIso(subscription.currentPeriodEnd, "") : null,
            accessUntil: accessEnd ? accessEnd.toISOString() : null,
            daysLeft,
            notes: subscription.notes ? String(subscription.notes) : undefined,
          }
        : null,
    };
  });

  const activeSubscriptions = subscriptions.filter(
    (subscription: Record<string, any>) => !isSubscriptionAccessExpired(subscription) && subscription.status === "active"
  ).length;
  const trialingSubscriptions = subscriptions.filter(
    (subscription: Record<string, any>) => !isSubscriptionAccessExpired(subscription) && subscription.status === "trialing"
  ).length;
  const pastDueSubscriptions = subscriptions.filter(
    (subscription: Record<string, any>) => isSubscriptionAccessExpired(subscription) || subscription.status === "past_due"
  ).length;
  const canceledSubscriptions = subscriptions.filter(
    (subscription: Record<string, any>) => subscription.status === "canceled"
  ).length;
  const expiringSoonSubscriptions = subscriptions.filter((subscription: Record<string, any>) => {
    const accessEnd = getAccessEnd(subscription);
    if (!accessEnd) {
      return false;
    }

    const remaining = daysBetween(now, accessEnd);
    return remaining >= 0 && remaining <= 7;
  }).length;

  const internalUsers = users.filter((user: Record<string, any>) => user.rol !== "cliente");

  const activities: AdminActivity[] = [
    ...internalUsers.slice(0, 6).map((user: Record<string, any>) =>
      normalizeActivity({
        type: "usuario",
        title: "Nueva cuenta registrada",
        description: `Rol: ${String(user.rol || "abogado")} · ${user.activo ? "activa" : "inactiva"}`,
        date: safeIso(user.createdAt, now.toISOString()),
        href: "/dashboard/admin/usuarios",
        tone: user.activo ? "success" : "warning",
      })
    ),
    ...subscriptions.slice(0, 6).map((subscription: Record<string, any>) => {
      const accessEnd = getAccessEnd(subscription);
      const plan = getPlanById(String(subscription.planId || ""));
      const effectiveStatus = isSubscriptionAccessExpired(subscription)
        ? "past_due"
        : String(subscription.status || "trialing");

      return normalizeActivity({
        type: "suscripcion",
        title: "Suscripcion actualizada",
        description: `${plan?.name || subscription.planId || "Plan"} · ${
          effectiveStatus === "past_due" ? "vencida" : "vigente"
        }${accessEnd ? ` hasta ${safeShortDate(accessEnd, "")}` : ""}`,
        date: safeIso(subscription.updatedAt || subscription.createdAt, now.toISOString()),
        href: "/dashboard/admin",
        tone: effectiveStatus === "past_due" ? "danger" : effectiveStatus === "trialing" ? "warning" : "success",
      });
    }),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  return {
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
    users: userRows.filter((user) => user.rol !== "cliente"),
    activities,
  };
}
