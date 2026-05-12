import crypto from "crypto";
import type { PaymentMethodPreference } from "@/lib/models/Subscription";

export type WompiCheckoutConfig = {
  publicKey: string;
  currency: "COP";
  amountInCents: number;
  reference: string;
  signature: string;
  redirectUrl: string;
  paymentMethodPreference: PaymentMethodPreference;
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
  };
};

type BuildCheckoutInput = {
  amountInCents: number;
  reference: string;
  redirectUrl: string;
  paymentMethodPreference: PaymentMethodPreference;
  customerData?: WompiCheckoutConfig["customerData"];
};

function getEnvValue(name: string) {
  return process.env[name]?.trim() || "";
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function buildWompiCheckoutConfig(input: BuildCheckoutInput): WompiCheckoutConfig {
  const publicKey = getEnvValue("WOMPI_PUBLIC_KEY") || getEnvValue("NEXT_PUBLIC_WOMPI_PUBLIC_KEY");
  const integritySecret = getEnvValue("WOMPI_INTEGRITY_SECRET");

  if (!publicKey) {
    throw new Error("Falta WOMPI_PUBLIC_KEY para activar el pago con Wompi");
  }

  if (!integritySecret) {
    throw new Error("Falta WOMPI_INTEGRITY_SECRET para generar la firma de pago");
  }

  const currency = "COP" as const;
  const signature = sha256(`${input.reference}${input.amountInCents}${currency}${integritySecret}`);

  return {
    publicKey,
    currency,
    amountInCents: input.amountInCents,
    reference: input.reference,
    signature,
    redirectUrl: input.redirectUrl,
    paymentMethodPreference: input.paymentMethodPreference,
    customerData: input.customerData,
  };
}

export function buildWompiEventChecksum(event: unknown) {
  const eventSecret = getEnvValue("WOMPI_EVENT_SECRET");
  if (!eventSecret) {
    throw new Error("Falta WOMPI_EVENT_SECRET para validar eventos");
  }

  const payload = event as {
    signature?: { properties?: string[]; checksum?: string };
    timestamp?: number | string;
    [key: string]: unknown;
  };

  const properties = Array.isArray(payload?.signature?.properties) ? payload.signature.properties : [];

  const resolvePath = (source: unknown, path: string) => {
    return path.split(".").reduce<unknown>((current, key) => {
      if (current === null || current === undefined) {
        return "";
      }

      if (typeof current !== "object") {
        return "";
      }

      return (current as Record<string, unknown>)[key];
    }, source);
  };

  const concatenatedProperties = properties
    .map((path) => {
      const value = resolvePath(payload, path);
      return value === undefined || value === null ? "" : String(value);
    })
    .join("");

  return sha256(`${concatenatedProperties}${String(payload?.timestamp ?? "")}${eventSecret}`);
}

export function getWompiCheckoutUrl() {
  return "https://checkout.wompi.co/widget.js";
}

