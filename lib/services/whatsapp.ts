import { loadWhatsAppIntegrationConfig, type WhatsAppIntegrationConfig } from "@/lib/services/whatsapp-config";

export type WhatsAppMode = "cloud_api" | "wa_me" | "disabled";

export interface WhatsAppStatus {
  configured: boolean;
  mode: WhatsAppMode;
  phoneNumberId?: string;
  graphVersion?: string;
  hasWebhookToken: boolean;
}

export interface WhatsAppSendInput {
  phone: string;
  message: string;
  previewUrl?: boolean;
}

export interface WhatsAppSendResult {
  sent: boolean;
  mode: WhatsAppMode;
  destination: string;
  messageId?: string;
  fallbackUrl?: string;
  error?: string;
  provider?: "meta";
}

export function normalizeWhatsAppPhone(value: string, countryCode = "57") {
  const digits = String(value || "")
    .replace(/[^\d]/g, "")
    .trim();

  if (!digits) {
    return "";
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith(countryCode)) {
    return digits;
  }

  if (digits.length === 10 && digits.startsWith("3")) {
    return `${countryCode}${digits}`;
  }

  if (digits.length === 10 && countryCode === "57") {
    return `57${digits}`;
  }

  return digits;
}

export function buildWhatsAppTextMessage(params: {
  clientName?: string;
  caseLabel?: string;
  message: string;
}) {
  const parts = [
    params.clientName ? `Hola ${params.clientName},` : "Hola,",
    params.message.trim(),
    params.caseLabel ? `Caso: ${params.caseLabel}` : "",
    "Mensaje enviado desde TOCHI Legal Suite.",
  ].filter(Boolean);

  return parts.join("\n\n");
}

export function buildWhatsAppWaMeUrl(phone: string, message: string, countryCode = "57") {
  const normalizedPhone = normalizeWhatsAppPhone(phone, countryCode);
  const encoded = new URLSearchParams({ text: message }).toString();
  return `https://wa.me/${normalizedPhone}?${encoded}`;
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatus & {
  source?: "database" | "env" | "fallback";
  enabled?: boolean;
  hasAccessToken?: boolean;
  publicAppUrl?: string;
}> {
  const config = await loadWhatsAppIntegrationConfig();

  return {
    configured: config.configured,
    mode: config.mode,
    phoneNumberId: config.phoneNumberId,
    graphVersion: config.graphVersion,
    hasWebhookToken: config.hasWebhookToken,
    source: config.source,
    enabled: config.enabled,
    hasAccessToken: config.hasAccessToken,
    publicAppUrl: config.publicAppUrl,
  };
}

async function sendViaMetaCloudApi(
  input: WhatsAppSendInput,
  config: WhatsAppIntegrationConfig
): Promise<WhatsAppSendResult> {
  const token = config.accessToken || "";
  const phoneNumberId = config.phoneNumberId || "";
  const graphVersion = config.graphVersion || "v21.0";
  const destination = normalizeWhatsAppPhone(input.phone, config.defaultCountryCode);

  if (!token || !phoneNumberId || config.enabled === false) {
    const fallbackUrl = buildWhatsAppWaMeUrl(destination, input.message, config.defaultCountryCode);
    return {
      sent: false,
      mode: "wa_me",
      destination,
      fallbackUrl,
      error: config.enabled === false ? "WhatsApp desactivado en configuracion" : "WhatsApp Cloud API no configurada",
    };
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: destination,
      type: "text",
      text: {
        preview_url: Boolean(input.previewUrl ?? true),
        body: input.message,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallbackUrl = buildWhatsAppWaMeUrl(destination, input.message, config.defaultCountryCode);
    return {
      sent: false,
      mode: "wa_me",
      destination,
      fallbackUrl,
      error: payload?.error?.message || "No se pudo enviar por la API oficial de WhatsApp",
      provider: "meta",
    };
  }

  return {
    sent: true,
    mode: "cloud_api",
    destination,
    messageId: payload?.messages?.[0]?.id,
    provider: "meta",
  };
}

export async function sendWhatsAppMessage(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const config = await loadWhatsAppIntegrationConfig();
  const destination = normalizeWhatsAppPhone(input.phone, config.defaultCountryCode);
  if (!destination || !input.message.trim()) {
    return {
      sent: false,
      mode: "disabled",
      destination,
      error: "Telefono o mensaje invalido",
    };
  }

  if (!config.configured) {
    return {
      sent: false,
      mode: "wa_me",
      destination,
      fallbackUrl: buildWhatsAppWaMeUrl(destination, input.message, config.defaultCountryCode),
      error: config.enabled === false ? "WhatsApp desactivado en configuracion" : "WhatsApp Cloud API no configurada",
    };
  }

  return sendViaMetaCloudApi(
    {
      ...input,
      phone: destination,
    },
    config
  );
}
