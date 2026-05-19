import type { WhatsAppMode } from "./whatsapp";

export interface WhatsAppIntegrationConfig {
  configured: boolean;
  mode: WhatsAppMode;
  source: "env" | "fallback";
  enabled: boolean;
  accessToken?: string;
  phoneNumberId?: string;
  webhookVerifyToken?: string;
  graphVersion?: string;
  defaultCountryCode: string;
  publicAppUrl?: string;
  businessAccountId?: string;
  hasAccessToken: boolean;
  hasWebhookToken: boolean;
}

function normalizeEnv(value: string | undefined) {
  return String(value || "").trim();
}

function isTruthy(value: string | undefined) {
  const normalized = normalizeEnv(value).toLowerCase();
  return Boolean(normalized) && !["false", "0", "no", "off"].includes(normalized);
}

export async function loadWhatsAppIntegrationConfig(): Promise<WhatsAppIntegrationConfig> {
  const accessToken =
    normalizeEnv(process.env.WHATSAPP_CLOUD_API_TOKEN) ||
    normalizeEnv(process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = normalizeEnv(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const webhookVerifyToken = normalizeEnv(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
  const graphVersion = normalizeEnv(process.env.WHATSAPP_GRAPH_VERSION) || "v21.0";
  const defaultCountryCode = normalizeEnv(process.env.WHATSAPP_DEFAULT_COUNTRY_CODE) || "57";
  const publicAppUrl =
    normalizeEnv(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeEnv(process.env.NEXTAUTH_URL) ||
    normalizeEnv(process.env.AUTH_URL);
  const enabled = isTruthy(process.env.WHATSAPP_ENABLED) || process.env.WHATSAPP_ENABLED === undefined;
  const configured = Boolean(enabled && accessToken && phoneNumberId);

  return {
    configured,
    mode: configured ? "cloud_api" : "wa_me",
    source: "env",
    enabled,
    accessToken,
    phoneNumberId,
    webhookVerifyToken,
    graphVersion,
    defaultCountryCode,
    publicAppUrl: publicAppUrl || undefined,
    businessAccountId: normalizeEnv(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) || undefined,
    hasAccessToken: Boolean(accessToken),
    hasWebhookToken: Boolean(webhookVerifyToken),
  };
}
