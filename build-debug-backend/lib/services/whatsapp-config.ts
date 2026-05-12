import dbConnect from "@/lib/mongodb";
import WhatsAppIntegration, { type IWhatsAppIntegration } from "@/lib/models/WhatsAppIntegration";

import type { WhatsAppMode } from "./whatsapp";

export interface WhatsAppIntegrationConfig {
  configured: boolean;
  mode: WhatsAppMode;
  source: "database" | "env" | "fallback";
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

type RawConfigRecord = Record<string, unknown>;

const CONFIG_COLLECTIONS = [
  "whatsappintegrations",
  "whatsapp_integrations",
  "integrations",
  "settings",
  "configurations",
  "app_settings",
  "system_settings",
  "config",
];

const TOKEN_KEYS = ["WHATSAPP_CLOUD_API_TOKEN", "WHATSAPP_ACCESS_TOKEN", "accessToken", "token", "secret"];
const PHONE_ID_KEYS = ["WHATSAPP_PHONE_NUMBER_ID", "phoneNumberId", "phone_number_id"];
const VERIFY_TOKEN_KEYS = ["WHATSAPP_WEBHOOK_VERIFY_TOKEN", "webhookVerifyToken", "verifyToken"];
const GRAPH_KEYS = ["WHATSAPP_GRAPH_VERSION", "graphVersion"];
const COUNTRY_KEYS = ["WHATSAPP_DEFAULT_COUNTRY_CODE", "defaultCountryCode"];
const APP_URL_KEYS = ["NEXT_PUBLIC_APP_URL", "publicAppUrl", "appUrl", "url"];
const BUSINESS_ACCOUNT_KEYS = ["businessAccountId", "wabaId", "whatsappBusinessAccountId"];

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function firstBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "si", "yes", "on"].includes(normalized)) return true;
      if (["false", "0", "no", "off"].includes(normalized)) return false;
    }
  }

  return undefined;
}

function collectValue(doc: RawConfigRecord, keys: string[]) {
  for (const key of keys) {
    const value = doc[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return value;
    }
  }

  return undefined;
}

function readStructuredConfig(raw: RawConfigRecord): Partial<WhatsAppIntegrationConfig> {
  const source = (raw.config as RawConfigRecord) ||
    (raw.credentials as RawConfigRecord) ||
    (raw.whatsapp as RawConfigRecord) ||
    (raw.settings as RawConfigRecord) ||
    (raw.data as RawConfigRecord) ||
    (raw.value as RawConfigRecord) ||
    raw;

  return {
    accessToken: firstString(
      collectValue(source, TOKEN_KEYS),
      collectValue(raw, TOKEN_KEYS),
      raw.accessToken,
      raw.token,
      raw.secret
    ),
    phoneNumberId: firstString(
      collectValue(source, PHONE_ID_KEYS),
      collectValue(raw, PHONE_ID_KEYS),
      raw.phoneNumberId,
      raw.phone_number_id
    ),
    webhookVerifyToken: firstString(
      collectValue(source, VERIFY_TOKEN_KEYS),
      collectValue(raw, VERIFY_TOKEN_KEYS),
      raw.webhookVerifyToken,
      raw.verifyToken
    ),
    graphVersion: firstString(
      collectValue(source, GRAPH_KEYS),
      collectValue(raw, GRAPH_KEYS),
      raw.graphVersion
    ),
    defaultCountryCode: firstString(
      collectValue(source, COUNTRY_KEYS),
      collectValue(raw, COUNTRY_KEYS),
      raw.defaultCountryCode
    ),
    publicAppUrl: firstString(
      collectValue(source, APP_URL_KEYS),
      collectValue(raw, APP_URL_KEYS),
      raw.publicAppUrl,
      raw.appUrl
    ),
    businessAccountId: firstString(
      collectValue(source, BUSINESS_ACCOUNT_KEYS),
      collectValue(raw, BUSINESS_ACCOUNT_KEYS),
      raw.businessAccountId
    ),
    enabled: firstBoolean(source.enabled, raw.enabled),
  };
}

function mergeConfig(configs: Array<Partial<WhatsAppIntegrationConfig>>) {
  return configs.reduce<Partial<WhatsAppIntegrationConfig>>((acc, current) => {
    return {
      ...acc,
      ...Object.fromEntries(
        Object.entries(current).filter(([, value]) => value !== undefined && value !== "")
      ),
    };
  }, {});
}

function finalizeConfig(
  config: Partial<WhatsAppIntegrationConfig>,
  source: WhatsAppIntegrationConfig["source"]
): WhatsAppIntegrationConfig {
  const accessToken = firstString(config.accessToken);
  const phoneNumberId = firstString(config.phoneNumberId);
  const webhookVerifyToken = firstString(config.webhookVerifyToken);
  const graphVersion = firstString(config.graphVersion) || "v21.0";
  const defaultCountryCode = firstString(config.defaultCountryCode) || "57";
  const publicAppUrl = firstString(config.publicAppUrl) || process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || process.env.AUTH_URL?.trim() || "";
  const businessAccountId = firstString(config.businessAccountId);
  const enabled = config.enabled ?? true;
  const configured = Boolean(enabled && accessToken && phoneNumberId);

  return {
    configured,
    mode: configured ? "cloud_api" : "wa_me",
    source,
    enabled,
    accessToken,
    phoneNumberId,
    webhookVerifyToken,
    graphVersion,
    defaultCountryCode,
    publicAppUrl: publicAppUrl || undefined,
    businessAccountId: businessAccountId || undefined,
    hasAccessToken: Boolean(accessToken),
    hasWebhookToken: Boolean(webhookVerifyToken),
  };
}

async function loadFromConfiguredModel() {
  const record = await WhatsAppIntegration.findOne({ provider: "whatsapp" })
    .select("+accessToken +webhookVerifyToken")
    .lean<IWhatsAppIntegration | null>();

  if (!record) {
    return null;
  }

  return finalizeConfig(
    {
      accessToken: record.accessToken,
      phoneNumberId: record.phoneNumberId,
      webhookVerifyToken: record.webhookVerifyToken,
      graphVersion: record.graphVersion,
      defaultCountryCode: record.defaultCountryCode,
      publicAppUrl: record.publicAppUrl,
      businessAccountId: record.businessAccountId,
      enabled: record.enabled,
    },
    "database"
  );
}

async function loadFromRawCollections() {
  const db = dbConnect ? (await dbConnect()).connection.db : null;
  if (!db) {
    return null;
  }

  const structuredConfigs: Array<Partial<WhatsAppIntegrationConfig>> = [];
  const keyValueConfigs: Array<Partial<WhatsAppIntegrationConfig>> = [];

  for (const collectionName of CONFIG_COLLECTIONS) {
    const collection = db.collection(collectionName);

    const structuredDoc = await collection
      .findOne({
        $or: [
          { provider: "whatsapp" },
          { name: "whatsapp" },
          { key: "whatsapp" },
          { type: "whatsapp" },
          { slug: "whatsapp" },
        ],
      })
      .catch(() => null);

    if (structuredDoc) {
      structuredConfigs.push(readStructuredConfig(structuredDoc as RawConfigRecord));
    }

    const keyDocs = await collection
      .find({
        key: {
          $in: [...TOKEN_KEYS, ...PHONE_ID_KEYS, ...VERIFY_TOKEN_KEYS, ...GRAPH_KEYS, ...COUNTRY_KEYS, ...APP_URL_KEYS, ...BUSINESS_ACCOUNT_KEYS],
        },
      })
      .toArray()
      .catch(() => []);

    if (keyDocs.length) {
      const asMap = new Map<string, unknown>();
      for (const doc of keyDocs as RawConfigRecord[]) {
        const key = firstString(doc.key, doc.name, doc.id).toUpperCase();
        const value = doc.value ?? doc.valor ?? doc.data ?? doc.rawValue ?? doc.secret ?? doc.token;
        if (key && value !== undefined && value !== null) {
          asMap.set(key, value);
        }
      }

      if (asMap.size) {
        keyValueConfigs.push(
          finalizeConfig(
            {
              accessToken: firstString(asMap.get("WHATSAPP_CLOUD_API_TOKEN"), asMap.get("WHATSAPP_ACCESS_TOKEN")),
              phoneNumberId: firstString(asMap.get("WHATSAPP_PHONE_NUMBER_ID")),
              webhookVerifyToken: firstString(asMap.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN")),
              graphVersion: firstString(asMap.get("WHATSAPP_GRAPH_VERSION")),
              defaultCountryCode: firstString(asMap.get("WHATSAPP_DEFAULT_COUNTRY_CODE")),
              publicAppUrl: firstString(asMap.get("NEXT_PUBLIC_APP_URL")),
              businessAccountId: firstString(asMap.get("BUSINESSACCOUNTID"), asMap.get("WABAID")),
            },
            "database"
          )
        );
      }
    }
  }

  const merged = mergeConfig([
    ...structuredConfigs,
    ...keyValueConfigs,
  ]);

  if (!Object.keys(merged).length) {
    return null;
  }

  return finalizeConfig(merged, "database");
}

function loadFromEnv() {
  const accessToken = firstString(process.env.WHATSAPP_CLOUD_API_TOKEN, process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = firstString(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const webhookVerifyToken = firstString(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
  const graphVersion = firstString(process.env.WHATSAPP_GRAPH_VERSION) || "v21.0";
  const defaultCountryCode = firstString(process.env.WHATSAPP_DEFAULT_COUNTRY_CODE) || "57";
  const publicAppUrl = firstString(process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL, process.env.AUTH_URL);
  const configured = Boolean(accessToken && phoneNumberId);

  return {
    configured,
    mode: configured ? "cloud_api" : "wa_me",
    source: configured ? "env" : "fallback",
    enabled: true,
    accessToken: accessToken || undefined,
    phoneNumberId: phoneNumberId || undefined,
    webhookVerifyToken: webhookVerifyToken || undefined,
    graphVersion,
    defaultCountryCode,
    publicAppUrl: publicAppUrl || undefined,
    businessAccountId: undefined,
    hasAccessToken: Boolean(accessToken),
    hasWebhookToken: Boolean(webhookVerifyToken),
  } satisfies WhatsAppIntegrationConfig;
}

export async function loadWhatsAppIntegrationConfig(): Promise<WhatsAppIntegrationConfig> {
  await dbConnect();

  const modelConfig = await loadFromConfiguredModel();
  if (modelConfig) {
    return modelConfig;
  }

  const rawConfig = await loadFromRawCollections();
  if (rawConfig) {
    return rawConfig;
  }

  return loadFromEnv();
}

export async function getWhatsAppWebhookVerifyToken() {
  const config = await loadWhatsAppIntegrationConfig();
  return config.webhookVerifyToken || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || "";
}

export async function saveWhatsAppIntegrationConfig(
  input: Partial<WhatsAppIntegrationConfig> & { updatedBy?: string }
) {
  await dbConnect();

  const currentConfig = await loadWhatsAppIntegrationConfig();

  const payload = {
    provider: "whatsapp" as const,
    accessToken: firstString(input.accessToken) || currentConfig.accessToken || "",
    phoneNumberId: firstString(input.phoneNumberId) || currentConfig.phoneNumberId || "",
    webhookVerifyToken: firstString(input.webhookVerifyToken) || currentConfig.webhookVerifyToken || "",
    graphVersion: firstString(input.graphVersion) || currentConfig.graphVersion || "v21.0",
    defaultCountryCode: firstString(input.defaultCountryCode) || currentConfig.defaultCountryCode || "57",
    publicAppUrl: firstString(input.publicAppUrl) || currentConfig.publicAppUrl || "",
    businessAccountId: firstString(input.businessAccountId) || currentConfig.businessAccountId || "",
    enabled: input.enabled ?? currentConfig.enabled ?? true,
    lastSyncedAt: new Date(),
    updatedBy: input.updatedBy || undefined,
  };

  const updated = await WhatsAppIntegration.findOneAndUpdate(
    { provider: "whatsapp" },
    { $set: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
    .select("+accessToken +webhookVerifyToken")
    .lean<IWhatsAppIntegration>();

  return finalizeConfig(
    {
      accessToken: updated?.accessToken,
      phoneNumberId: updated?.phoneNumberId,
      webhookVerifyToken: updated?.webhookVerifyToken,
      graphVersion: updated?.graphVersion,
      defaultCountryCode: updated?.defaultCountryCode,
      publicAppUrl: updated?.publicAppUrl,
      businessAccountId: updated?.businessAccountId,
      enabled: updated?.enabled,
    },
    "database"
  );
}
