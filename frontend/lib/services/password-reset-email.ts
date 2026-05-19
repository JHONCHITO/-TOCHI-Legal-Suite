import { Resend } from "resend";

export type PasswordResetEmailInput = {
  to: string;
  resetPasswordUrl: string;
  userName?: string;
};

export type PasswordResetEmailDraft = {
  recipientEmail: string;
  subject: string;
  text: string;
  html: string;
};

type PasswordResetEmailResult =
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

function normalizeEmail(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

export function buildPasswordResetEmailDraft(input: PasswordResetEmailInput): PasswordResetEmailDraft {
  const recipientEmail = normalizeEmail(input.to);
  const subject = "TOCHI Legal Suite: restablece tu contrasena";
  const userLabel = input.userName || "cliente";
  const text = [
    `Hola ${userLabel},`,
    "",
    "Recibimos una solicitud para restablecer tu contrasena en TOCHI Legal Suite.",
    `Abre este enlace para crear una nueva contrasena: ${input.resetPasswordUrl}`,
    "",
    "Este enlace expira en 1 hora.",
    "Si no solicitaste este cambio, puedes ignorar este correo.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px 0">Restablecer contrasena</h2>
      <p style="margin:0 0 12px 0">Hola ${userLabel},</p>
      <p style="margin:0 0 12px 0">Recibimos una solicitud para restablecer tu contrasena en TOCHI Legal Suite.</p>
      <p style="margin:0 0 16px 0">
        <a href="${input.resetPasswordUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0057b8;color:#fff;text-decoration:none;font-weight:600">
          Crear nueva contrasena
        </a>
      </p>
      <p style="margin:0 0 12px 0">Este enlace expira en 1 hora.</p>
      <p style="margin:0;color:#6b7280;font-size:12px">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    </div>
  `;

  return {
    recipientEmail,
    subject,
    text,
    html,
  };
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<PasswordResetEmailResult> {
  const recipientEmail = normalizeEmail(input.to);
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
    const draft = buildPasswordResetEmailDraft(input);
    await resend.emails.send({
      from: process.env.MAIL_FROM || "TOCHI Legal Suite <no-reply@tochi.legal>",
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
    console.error("Error sending password reset email:", error);
    return {
      sent: false,
      skipped: true,
      recipientEmail,
      reason: "send_failed",
      error: error instanceof Error ? error.message : "No se pudo enviar el correo de recuperacion",
    };
  }
}
