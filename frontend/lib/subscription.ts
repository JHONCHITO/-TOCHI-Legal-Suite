import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Subscription, {
  type ISubscription,
  type SubscriptionResource,
  type SubscriptionStatus,
} from "@/lib/models/Subscription";
import { getPlanById, TRIAL_BUSINESS_DAYS, type PlanLimits } from "@/lib/products";

export const DEFAULT_PLAN_ID = "plan-esencial";

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
    subscription.status = "active";
    subscription.currentPeriodStart = new Date(subscription.trialEnd);
    subscription.currentPeriodEnd = addMonths(subscription.currentPeriodStart, 1);
    subscription.usage = createEmptyUsage();
    changed = true;
  }

  if (subscription.status === "active" && subscription.currentPeriodEnd && now >= subscription.currentPeriodEnd) {
    while (subscription.currentPeriodEnd && now >= subscription.currentPeriodEnd) {
      subscription.currentPeriodStart = new Date(subscription.currentPeriodEnd);
      subscription.currentPeriodEnd = addMonths(subscription.currentPeriodStart, 1);
      subscription.usage = createEmptyUsage();
      changed = true;
    }
  }

  if (changed) {
    subscription.lastSyncedAt = now;
  }

  return changed;
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
    subscription = new Subscription({
      userId,
      planId: selectedPlanId,
      status: options?.status || "trialing",
      trialStart: new Date(),
      trialEnd: addBusinessDays(new Date(), TRIAL_BUSINESS_DAYS),
      currentPeriodStart: new Date(),
      currentPeriodEnd: addBusinessDays(new Date(), TRIAL_BUSINESS_DAYS),
      limits: selectedLimits,
      usage: createEmptyUsage(),
      lastSyncedAt: new Date(),
    });

    await subscription.save();
    return subscription;
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
    await subscription.save();
    return subscription;
  }

  const changed = applyLifecycle(subscription);
  if (changed) {
    await subscription.save();
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

  const subscription = await ensureSubscriptionForUser(userId);
  if (!subscription) {
    return null;
  }

  const plan = getPlanById(subscription.planId) || getPlanById(DEFAULT_PLAN_ID);

  return {
    user,
    subscription,
    plan,
    limits: subscription.limits || plan?.limits || getPlanLimits(DEFAULT_PLAN_ID),
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

export async function consumeAiQuery(userId: string, amount = 1) {
  const effective = await getEffectiveSubscription(userId);
  if (!effective) {
    throw new Error("Usuario no encontrado");
  }

  if (effective.isUnlimited || !effective.subscription) {
    return effective;
  }

  const subscription = effective.subscription;
  const limit = subscription.limits?.aiQueries ?? getPlanLimits(subscription.planId).aiQueries;

  if ((subscription.usage.aiQueries || 0) + amount > limit) {
    throw new Error(`Tu plan actual solo permite ${limit} consultas de IA.`);
  }

  subscription.usage.aiQueries = (subscription.usage.aiQueries || 0) + amount;
  subscription.lastSyncedAt = new Date();
  await subscription.save();

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

  if (effective.isUnlimited || !effective.subscription) {
    return effective;
  }

  const subscription = effective.subscription;
  const limit = subscription.limits?.[resource] ?? getPlanLimits(subscription.planId)[resource];

  if (currentCount + increment > limit) {
    const label = RESOURCE_LABELS[resource];
    throw new Error(`Tu plan actual permite hasta ${limit} ${label}.`);
  }

  return effective;
}
