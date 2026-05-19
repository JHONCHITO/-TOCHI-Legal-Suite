import { Resend } from "resend";

export type PortalShareScope = "all" | "cases" | "documents" | "invoices" | "appointments";

export type PortalShareCounts = {
  cases: number;
  documents: number;
  invoices: number;
  appointments: number;
  communications?: number;
};

export type PortalShareEmailInput = {
  to: string;
  clientName: string;
  scope: PortalShareScope;
  counts: PortalShareCounts;
  portalUrl?: string;
  portalLinked?: boolean;
  highlights?: string[];
};

export type PortalShareEmailDraft = {
  subject: string;
  text: string;
  html: string;
  recipientEmail: string;
};

type PortalShareEmailResult =
  | {
      sent: true;
      skipped: false;
      recipientEmail: string;
    }
  | {
      sent: false;
      skipped: true;
      recipientEmail: string;
      reason: "missing_recipient" | "missing_resend" | "send_failed";
      error?: string;
    };

function scopeTitle(scope: PortalShareScope) {
  switch (scope) {
    case "cases":
      return "casos";
    case "documents":
      return "documentos";
    case "invoices":
      return "facturas";
    case "appointments":
      return "citas";
    case "all":
    default:
      return "actualizacion del expediente";
  }
}

function buildSummary(counts: PortalShareCounts, scope: PortalShareScope) {
  if (scope === "all") {
    const parts = [
      `${counts.cases || 0} casos`,
      `${counts.documents || 0} documentos`,
      `${counts.invoices || 0} facturas`,
      `${counts.appointments || 0} citas`,
    ];
    return `Tu abogado actualizo tu expediente con ${parts.join(", ")}.`;
  }

  const value =
    scope === "cases"
      ? counts.cases || 0
      : scope === "documents"
        ? counts.documents || 0
        : scope === "invoices"
          ? counts.invoices || 0
          : counts.appointments || 0;

  const label = scopeTitle(scope);
  return value > 0
    ? `Tu abogado compartio ${value} ${label} contigo por correo.`
    : `Tu abogado actualizo la seccion de ${label} y la envio por correo.`;
}

function buildSubject(scope: PortalShareScope) {
  return scope === "all"
    ? "TOCHI Legal Suite: actualizacion del expediente"
    : `TOCHI Legal Suite: ${scopeTitle(scope)} compartidos`;
}

function buildHighlightsBlock(highlights: string[]) {
  const trimmed = highlights.map((item) => String(item || "").trim()).filter(Boolean);
  if (!trimmed.length) {
    return {
      text: "",
      html: "",
    };
  }

  return {
    text: [
      "Elementos incluidos:",
      ...trimmed.map((item) => `- ${item}`),
    ].join("\n"),
    html: `
      <div style="margin:0 0 16px 0">
        <p style="margin:0 0 8px 0;font-weight:600">Elementos incluidos</p>
        <ul style="margin:0;padding-left:18px">
          ${trimmed.map((item) => `<li style="margin:0 0 6px 0">${item}</li>`).join("")}
        </ul>
      </div>
    `,
  };
}

export function buildClientPortalShareEmailDraft(input: PortalShareEmailInput): PortalShareEmailDraft {
  const recipientEmail = String(input.to || "").toLowerCase().trim();
  const subject = buildSubject(input.scope);
  const summary = buildSummary(input.counts, input.scope);
  const deliveryState = "Tu despacho envio esta actualizacion por correo.";
  const highlights = buildHighlightsBlock(input.highlights || []);
  const text = [
    `Hola ${input.clientName || "cliente"},`,
    "",
    summary,
    deliveryState,
    "",
    highlights.text,
    "",
    "Si necesitas ampliar detalles, responde a este correo o contacta al despacho.",
    "",
    "Este mensaje contiene un aviso operativo del despacho.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px 0">Actualizacion del expediente</h2>
      <p style="margin:0 0 12px 0">Hola ${input.clientName || "cliente"},</p>
      <p style="margin:0 0 12px 0">${summary}</p>
      <p style="margin:0 0 16px 0">${deliveryState}</p>
      ${highlights.html}
      <p style="margin:0 0 16px 0">Si necesitas ampliar detalles, responde a este correo o contacta al despacho.</p>
      <p style="margin:0;color:#6b7280;font-size:12px">
        Este mensaje contiene un aviso operativo del despacho.
      </p>
    </div>
  `;

  return {
    recipientEmail,
    subject,
    text,
    html,
  };
}

export async function sendClientPortalShareEmail(input: PortalShareEmailInput): Promise<PortalShareEmailResult> {
  const recipientEmail = String(input.to || "").toLowerCase().trim();
  if (!recipientEmail) {
    return {
      sent: false,
      skipped: true,
      recipientEmail,
      reason: "missing_recipient",
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return {
      sent: false,
      skipped: true,
      recipientEmail,
      reason: "missing_resend",
    };
  }

  try {
    const resend = new Resend(resendApiKey);
    const from = process.env.MAIL_FROM || "TOCHI Legal Suite <no-reply@tochi.legal>";
    const draft = buildClientPortalShareEmailDraft(input);

    await resend.emails.send({
      from,
      to: recipientEmail,
      subject: draft.subject,
      text: draft.text,
      html: draft.html,
    });

    return {
      sent: true,
      skipped: false,
      recipientEmail,
    };
  } catch (error) {
    console.error("Error sending client update email:", error);
    return {
      sent: false,
      skipped: true,
      recipientEmail,
      reason: "send_failed",
      error: error instanceof Error ? error.message : "No se pudo enviar el correo",
    };
  }
}
