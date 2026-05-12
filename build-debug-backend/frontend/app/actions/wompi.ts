"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getPlanById } from "@/lib/products";
import { markWompiCheckoutPending } from "@/lib/subscription";
import { buildWompiCheckoutConfig } from "@/lib/wompi";
import type { PaymentMethodPreference } from "@/lib/models/Subscription";

function buildReference(planId: string, userId: string, method: PaymentMethodPreference) {
  const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-10);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `TOCHI-${planId}-${method}-${safeUserId}-${suffix}`.slice(0, 80);
}

export async function createWompiCheckoutSession(planId: string, paymentMethodPreference: PaymentMethodPreference) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Debes iniciar sesion para comprar una suscripcion");
  }

  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error("Plan no encontrado");
  }

  await dbConnect();

  const user = await User.findById(session.user.id).select("email nombre apellido telefono").lean();
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const reference = buildReference(plan.id, session.user.id, paymentMethodPreference);

  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const checkoutConfig = buildWompiCheckoutConfig({
    amountInCents: plan.priceInCents,
    reference,
    redirectUrl: `${origin}/checkout/success?reference=${encodeURIComponent(reference)}&planId=${encodeURIComponent(plan.id)}`,
    paymentMethodPreference,
    customerData: {
      email: String(user.email || session.user.email || ""),
      fullName: `${String(user.nombre || "").trim()} ${String(user.apellido || "").trim()}`.trim() || undefined,
      phoneNumber: String(user.telefono || "").trim() || undefined,
      phoneNumberPrefix: "+57",
    },
  });

  await markWompiCheckoutPending(session.user.id, {
    planId: plan.id,
    reference,
    paymentMethodPreference,
  });

  return checkoutConfig;
}
