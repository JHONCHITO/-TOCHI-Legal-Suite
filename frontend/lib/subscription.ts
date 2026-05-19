import mongoose from "mongoose";
import { addDays } from "date-fns";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Subscription, {
  type ISubscription,
  type PaymentMethodPreference,
  type SubscriptionResource,
  type SubscriptionStatus,
} from "@/lib/models/Subscription";
import { getPlanById, TRIAL_BUSINESS_DAYS, type PlanLimits } from "@/lib/products";

export const DEFAULT_PLAN_ID = "plan-esencial";

export function shouldEnforcePlanLimits() {
  return process.env.NODE_ENV === "production" && process.env.DISABLE_PLAN_LIMITS !== "true";
}

const RESOURCE_LABELS: Record<SubscriptionResource, string> = {
  cases: "casos activos",
  clients: "clientes activos",
  appointments: "citas activas",
  documents: "documentos",
  invoices: "facturas",
  communications: "comunicaciones",
  aiQueries: "consultas de IA",
  users: "usuarios",
};

export function createEmptyUsage() {
  return {
    cases: 0,
    clients: 0,
    appointments: 0,
    documents: 0,
    invoices: 0,
    communications: 0,
    aiQueries: 0,
    users: 0,
  };
}

function buildVirtualSubscription(userId: string, planId: string, status: SubscriptionStatus = "trialing") {
  const now = new Date();
  const normalizedPlanId = getPlanById(planId)?.id || DEFAULT_PLAN_ID;

  return {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userId),
    planId: normalizedPlanId,
    status,
    trialStart: now,
    trialEnd: addBusinessDays(now, TRIAL_BUSINESS_DAYS),
    currentPeriodStart: now,
    currentPeriodEnd: addBusinessDays(now, TRIAL_BUSINESS_DAYS),
    limits: getPlanLimits(normalizedPlanId),
    usage: createEmptyUsage(),
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  } as ISubscription;
}

export function addBusinessDays(start: Date, businessDays: number) {
  const date = new Date(start);
  let added = 0;

  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }

  return date;
}

export function addMonths(start: Date, months = 1) {
  const date = new Date(start);
  date.setMonth(date.getMonth() + months);
  return date;
}

export function getPlanLimits(planId: string): PlanLimits {
  return (
    getPlanById(planId)?.limits ||
    getPlanById(DEFAULT_PLAN_ID)?.limits || {
      cases: 10,
      clients: 25,
      appointments: 15,
      documents: 20,
      invoices: 15,
      communications: 50,
      aiQueries: 25,
      users: 1,
    }
  );
}

function applyLifecycle(subscription: ISubscription) {
  const now = new Date();
  let changed = false;

  if (!subscription.trialStart) {
    subscription.trialStart = new Date(subscription.currentPeriodStart || now);
    changed = true;
  }

  if (!subscription.trialEnd) {
    subscription.trialEnd = addBusinessDays(subscription.trialStart, TRIAL_BUSINESS_DAYS);
    changed = true;
  }

  if (!subscription.currentPeriodStart) {
    subscription.currentPeriodStart = new Date(subscription.trialStart || now);
    changed = true;
  }

  if (!subscription.currentPeriodEnd) {
    subscription.currentPeriodEnd = new Date(subscription.trialEnd || addBusinessDays(now, TRIAL_BUSINESS_DAYS));
    changed = true;
  }

  if (!subscription.limits) {
    subscription.limits = getPlanLimits(subscription.planId);
    changed = true;
  }

  if (!subscription.usage) {
    subscription.usage = createEmptyUsage();
    changed = true;
  }

  if (subscription.status === "trialing" && subscription.trialEnd && now >= subscription.trialEnd) {
    subscription.status = "past_due";
    subscription.lastSyncedAt = now;
    changed = true;
  }

  if (subscription.status === "active" && subscription.currentPeriodEnd && now >= subscription.currentPeriodEnd) {
    subscription.status = "past_due";
    subscription.lastSyncedAt = now;
    changed = true;
  }

  if (changed) {
    subscription.lastSyncedAt = now;
  }

  return changed;
}

export function isSubscriptionAccessExpired(
  subscription:
    | {
        status?: string;
        trialEnd?: Date | string | null;
        currentPeriodEnd?: Date | string | null;
      }
    | null
    | undefined
) {
  if (!subscription) {
    return false;
  }

  const now = new Date();

  if (subscription.status === "canceled" || subscription.status === "past_due") {
    return true;
  }

  if (subscription.status === "trialing") {
    return !!subscription.trialEnd && now >= new Date(subscription.trialEnd);
  }

  if (subscription.status === "active") {
    return !!subscription.currentPeriodEnd && now >= new Date(subscription.currentPeriodEnd);
  }

  return false;
}

export async function ensureSubscriptionForUser(
  userId: string,
  options?: {
    planId?: string;
    resetTrial?: boolean;
    status?: SubscriptionStatus;
  }
) {
  await dbConnect();

  const user = await User.findById(userId).select("rol").lean();
  if (!user) {
    return null;
  }

  let subscription = await Subscription.findOne({ userId });
  const selectedPlanId = getPlanById(options?.planId || subscription?.planId || DEFAULT_PLAN_ID)?.id || DEFAULT_PLAN_ID;
  const selectedPlan = getPlanById(selectedPlanId) || getPlanById(DEFAULT_PLAN_ID);
  const selectedLimits = selectedPlan?.limits || getPlanLimits(DEFAULT_PLAN_ID);

  if (!subscription) {
    const virtualSubscription = buildVirtualSubscription(userId, selectedPlanId, options?.status || "trialing");

    try {
      subscription = new Subscription({
        userId,
        planId: selectedPlanId,
        status: options?.status || "trialing",
        trialStart: virtualSubscription.trialStart,
        trialEnd: virtualSubscription.trialEnd,
        currentPeriodStart: virtualSubscription.currentPeriodStart,
        currentPeriodEnd: virtualSubscription.currentPeriodEnd,
        limits: selectedLimits,
        usage: createEmptyUsage(),
        lastSyncedAt: virtualSubscription.lastSyncedAt,
      });

      await subscription.save();
      return subscription;
    } catch (error) {
      console.warn("No se pudo persistir la suscripcion inicial, usando version virtual:", error instanceof Error ? error.message : error);
      return virtualSubscription;
    }
  }

  if (options?.resetTrial || (options?.planId && subscription.planId !== selectedPlanId)) {
    subscription.planId = selectedPlanId;
    subscription.status = options?.status || "trialing";
    subscription.trialStart = new Date();
    subscription.trialEnd = addBusinessDays(subscription.trialStart, TRIAL_BUSINESS_DAYS);
    subscription.currentPeriodStart = new Date(subscription.trialStart);
    subscription.currentPeriodEnd = addBusinessDays(subscription.trialStart, TRIAL_BUSINESS_DAYS);
    subscription.limits = selectedLimits;
    subscription.usage = createEmptyUsage();
    subscription.lastSyncedAt = new Date();
    try {
      await subscription.save();
    } catch (error) {
      console.warn("No se pudo guardar la suscripcion actualizada:", error instanceof Error ? error.message : error);
    }
    return subscription;
  }

  const changed = applyLifecycle(subscription);
  if (changed) {
    try {
      await subscription.save();
    } catch (error) {
      console.warn("No se pudo guardar la suscripcion sincronizada:", error instanceof Error ? error.message : error);
    }
  }

  return subscription;
}

export async function extendSubscriptionAccess(
  userId: string,
  options: {
    days: number;
    planId?: string;
    note?: string;
    status?: SubscriptionStatus;
  }
) {
  await dbConnect();

  const user = await User.findById(userId).select("rol").lean();
  if (!user) {
    return null;
  }

  const normalizedDays = Math.max(1, Math.floor(Number(options.days) || 0));
  const now = new Date();
  const selectedPlanId = getPlanById(options.planId || DEFAULT_PLAN_ID)?.id || DEFAULT_PLAN_ID;
  const selectedLimits = getPlanLimits(selectedPlanId);
  let subscription = await Subscription.findOne({ userId });

  if (!subscription) {
    subscription = new Subscription({
      userId,
      planId: selectedPlanId,
      status: options.status || "active",
      trialStart: now,
      trialEnd: addBusinessDays(now, TRIAL_BUSINESS_DAYS),
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, normalizedDays),
      limits: selectedLimits,
      usage: createEmptyUsage(),
      lastSyncedAt: now,
      notes: options.note?.trim() || undefined,
    });
  } else {
    subscription.planId = selectedPlanId;
    subscription.status = options.status || "active";
    subscription.limits = selectedLimits;
    subscription.currentPeriodStart = subscription.currentPeriodStart || now;

    if (subscription.status === "trialing") {
      const trialBase = subscription.trialEnd && new Date(subscription.trialEnd) > now
        ? new Date(subscription.trialEnd)
        : now;
      subscription.trialEnd = addDays(trialBase, normalizedDays);
      subscription.currentPeriodEnd = new Date(subscription.trialEnd);
    } else {
      const accessBase = subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now
        ? new Date(subscription.currentPeriodEnd)
        : now;
      subscription.currentPeriodEnd = addDays(accessBase, normalizedDays);
    }

    subscription.lastSyncedAt = now;
    if (options.note?.trim()) {
      subscription.notes = options.note.trim();
    }
  }

  try {
    await subscription.save();
  } catch (error) {
    console.warn(
      "No se pudo extender el acceso de la suscripcion:",
      error instanceof Error ? error.message : error
    );
  }

  return subscription;
}

export async function getEffectiveSubscription(userId: string) {
  await dbConnect();

  const user = await User.findById(userId).select("rol email nombre apellido").lean();
  if (!user) {
    return null;
  }

  const role = String((user as { rol?: string }).rol || "abogado");
  if (role === "superadmin") {
    return {
      user,
      subscription: null,
      plan: null,
      limits: null,
      isUnlimited: true,
    };
  }

  const subscription = await Subscription.findOne({ userId });
  const plan = subscription
    ? getPlanById(subscription.planId) || getPlanById(DEFAULT_PLAN_ID)
    : getPlanById(DEFAULT_PLAN_ID);
  const virtualSubscription = subscription || buildVirtualSubscription(userId, plan?.id || DEFAULT_PLAN_ID);

  if (subscription) {
    const changed = applyLifecycle(subscription);
    if (changed) {
      try {
        await subscription.save();
      } catch (error) {
        console.warn(
          "No se pudo sincronizar la suscripcion efectiva:",
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  return {
    user,
    subscription: virtualSubscription,
    plan,
    limits: virtualSubscription.limits || plan?.limits || getPlanLimits(DEFAULT_PLAN_ID),
    isUnlimited: false,
  };
}

export async function setCheckoutSubscriptionPlan(userId: string, planId: string) {
  return ensureSubscriptionForUser(userId, {
    planId,
    resetTrial: true,
    status: "trialing",
  });
}

export async function markWompiCheckoutPending(
  userId: string,
  options: {
    planId: string;
    reference: string;
    paymentMethodPreference: PaymentMethodPreference;
  }
) {
  const subscription = await setCheckoutSubscriptionPlan(userId, options.planId);
  if (!subscription) {
    return null;
  }

  subscription.paymentProvider = "wompi";
  subscription.paymentReference = options.reference;
  subscription.paymentMethodPreference = options.paymentMethodPreference;
  subscription.paymentStatus = "pending";
  subscription.paymentTransactionId = undefined;
  subscription.paymentApprovedAt = undefined;
  subscription.paymentFailureReason = undefined;
  subscription.lastSyncedAt = new Date();

  try {
    await subscription.save();
  } catch (error) {
    console.warn("No se pudo guardar el pago pendiente de Wompi:", error instanceof Error ? error.message : error);
  }

  return subscription;
}

export async function syncWompiPaymentByReference(
  reference: string,
  transaction: {
    id?: string;
    status?: string;
    payment_method_type?: string;
    failureReason?: { message?: string } | null;
  }
) {
  await dbConnect();

  const subscription = await Subscription.findOne({ paymentReference: reference });
  if (!subscription) {
    return null;
  }

  const status = String(transaction.status || "").toUpperCase();
  const paymentMethodType = String(transaction.payment_method_type || "").toUpperCase();

  subscription.paymentProvider = "wompi";
  subscription.paymentTransactionId = transaction.id || subscription.paymentTransactionId;
  subscription.paymentStatus =
    status === "APPROVED"
      ? "approved"
      : status === "DECLINED" || status === "VOIDED"
        ? "declined"
        : status === "ERROR"
          ? "error"
          : "pending";
  subscription.paymentMethodPreference =
    paymentMethodType === "NEQUI"
      ? "nequi"
      : paymentMethodType === "CARD"
        ? "card"
        : subscription.paymentMethodPreference;
  subscription.lastSyncedAt = new Date();

  if (status === "APPROVED") {
    const now = new Date();
    subscription.status = "active";
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = addMonths(now, 1);
    subscription.paymentApprovedAt = now;
    subscription.paymentFailureReason = undefined;
  } else if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
    subscription.paymentFailureReason = transaction.failureReason?.message || subscription.paymentFailureReason;
  }

  try {
    await subscription.save();
  } catch (error) {
    console.warn("No se pudo sincronizar el pago de Wompi:", error instanceof Error ? error.message : error);
  }

  return subscription;
}

export async function consumeAiQuery(userId: string, amount = 1) {
  const effective = await getEffectiveSubscription(userId);
  if (!effective) {
    throw new Error("Usuario no encontrado");
  }

  if (!shouldEnforcePlanLimits() || effective.isUnlimited || !effective.subscription) {
    return effective;
  }

  const subscription = effective.subscription;
  if (isSubscriptionAccessExpired(subscription)) {
    throw new Error("Tu suscripcion ha vencido. Renueva tu plan para continuar.");
  }

  const limit = subscription.limits?.aiQueries ?? getPlanLimits(subscription.planId).aiQueries;

  if ((subscription.usage.aiQueries || 0) + amount > limit) {
    throw new Error(`Tu plan actual solo permite ${limit} consultas de IA.`);
  }

  subscription.usage.aiQueries = (subscription.usage.aiQueries || 0) + amount;
  subscription.lastSyncedAt = new Date();
  if (typeof (subscription as { save?: () => Promise<unknown> }).save === "function") {
    try {
      await (subscription as { save: () => Promise<unknown> }).save();
    } catch (error) {
      console.warn("No se pudo guardar el consumo de IA:", error instanceof Error ? error.message : error);
    }
  }

  return effective;
}

export async function assertPlanLimit(
  userId: string,
  resource: SubscriptionResource,
  currentCount: number,
  increment = 1
) {
  const effective = await getEffectiveSubscription(userId);
  if (!effective) {
    throw new Error("Usuario no encontrado");
  }

  if (!shouldEnforcePlanLimits() || effective.isUnlimited || !effective.subscription) {
    const limit = effective.limits?.[resource] ?? getPlanLimits(DEFAULT_PLAN_ID)[resource];

    if (currentCount + increment > limit) {
      const label = RESOURCE_LABELS[resource];
      throw new Error(`Tu plan actual permite hasta ${limit} ${label}.`);
    }

    return effective;
  }

  const subscription = effective.subscription;
  if (isSubscriptionAccessExpired(subscription)) {
    throw new Error("Tu suscripcion ha vencido. Renueva tu plan para continuar.");
  }

  const limit = subscription.limits?.[resource] ?? effective.limits?.[resource] ?? getPlanLimits(subscription.planId)[resource];

  if (currentCount + increment > limit) {
    const label = RESOURCE_LABELS[resource];
    throw new Error(`Tu plan actual permite hasta ${limit} ${label}.`);
  }

  return effective;
}
