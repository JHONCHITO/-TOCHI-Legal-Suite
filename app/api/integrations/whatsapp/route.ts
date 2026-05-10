import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { loadWhatsAppIntegrationConfig, saveWhatsAppIntegrationConfig } from "@/lib/services/whatsapp-config";

const INTERNAL_ROLES = new Set(["superadmin", "admin"]);

function maskSecret(value?: string) {
  if (!value) {
    return "";
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}***`;
  }

  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const config = await loadWhatsAppIntegrationConfig();
  return NextResponse.json({
    configured: config.configured,
    mode: config.mode,
    source: config.source,
    enabled: config.enabled,
    hasAccessToken: config.hasAccessToken,
    hasWebhookToken: config.hasWebhookToken,
    phoneNumberId: config.phoneNumberId || "",
    graphVersion: config.graphVersion || "",
    defaultCountryCode: config.defaultCountryCode || "",
    publicAppUrl: config.publicAppUrl || "",
    businessAccountId: config.businessAccountId || "",
    accessTokenPreview: maskSecret(config.accessToken),
    webhookVerifyTokenPreview: maskSecret(config.webhookVerifyToken),
  });
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !INTERNAL_ROLES.has(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const config = await saveWhatsAppIntegrationConfig({
      accessToken: typeof body?.accessToken === "string" ? body.accessToken : undefined,
      phoneNumberId: typeof body?.phoneNumberId === "string" ? body.phoneNumberId : undefined,
      webhookVerifyToken: typeof body?.webhookVerifyToken === "string" ? body.webhookVerifyToken : undefined,
      graphVersion: typeof body?.graphVersion === "string" ? body.graphVersion : undefined,
      defaultCountryCode: typeof body?.defaultCountryCode === "string" ? body.defaultCountryCode : undefined,
      publicAppUrl: typeof body?.publicAppUrl === "string" ? body.publicAppUrl : undefined,
      businessAccountId: typeof body?.businessAccountId === "string" ? body.businessAccountId : undefined,
      enabled: typeof body?.enabled === "boolean" ? body.enabled : undefined,
      updatedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      config: {
        configured: config.configured,
        mode: config.mode,
        source: config.source,
        enabled: config.enabled,
        hasAccessToken: config.hasAccessToken,
        hasWebhookToken: config.hasWebhookToken,
        phoneNumberId: config.phoneNumberId || "",
        graphVersion: config.graphVersion || "",
        defaultCountryCode: config.defaultCountryCode || "",
        publicAppUrl: config.publicAppUrl || "",
        businessAccountId: config.businessAccountId || "",
        accessTokenPreview: maskSecret(config.accessToken),
        webhookVerifyTokenPreview: maskSecret(config.webhookVerifyToken),
      },
    });
  } catch (error) {
    console.error("Error guardando configuracion WhatsApp:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la configuracion de WhatsApp" },
      { status: 500 }
    );
  }
}
