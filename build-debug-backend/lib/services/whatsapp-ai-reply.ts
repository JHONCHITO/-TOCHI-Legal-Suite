import { buildLegalAssistantFallback } from "@/lib/services/legal-assistant-fallback";

export interface WhatsAppAiReplyInput {
  requestUrl: string;
  message: string;
  clientName?: string;
  caseLabel?: string;
  sourcePhone?: string;
}

export interface WhatsAppAiReplyResult {
  reply: string;
  sources: Array<{ title: string; url: string }>;
  mode: "ai" | "fallback";
}

const MAX_WHATSAPP_REPLY_LENGTH = 3500;

function normalizeReplyLength(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= MAX_WHATSAPP_REPLY_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, MAX_WHATSAPP_REPLY_LENGTH).trimEnd()}\n\nSi quieres, te amplío la respuesta por aquí o en tu expediente.`;
}

function buildPrompt(input: WhatsAppAiReplyInput) {
  const sections = [
    input.clientName ? `Cliente: ${input.clientName}` : null,
    input.caseLabel ? `Caso: ${input.caseLabel}` : null,
    input.sourcePhone ? `Telefono origen: ${input.sourcePhone}` : null,
    "",
    "Responde a esta consulta recibida por WhatsApp de forma clara, profesional y en espanol.",
    "Si faltan datos, pide solo la informacion que realmente necesitas.",
    "Si la pregunta es juridica, usa el contexto legal colombiano disponible en TOCHI.",
    "",
    input.message.trim(),
  ];

  return sections.filter(Boolean).join("\n");
}

export async function generateWhatsAppLegalReply(
  input: WhatsAppAiReplyInput
): Promise<WhatsAppAiReplyResult> {
  const prompt = buildPrompt(input);

  try {
    const response = await fetch(new URL("/api/chat", input.requestUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const payload = await response.json().catch(() => ({}));
    const reply =
      typeof payload?.message === "string" && payload.message.trim()
        ? payload.message.trim()
        : typeof payload?.respuesta === "string" && payload.respuesta.trim()
          ? payload.respuesta.trim()
          : "";
    const sources: Array<{ title?: unknown; url?: unknown }> = Array.isArray(payload?.sources)
      ? payload.sources
      : Array.isArray(payload?.fuentes)
        ? payload.fuentes
        : [];

    if (reply) {
      return {
        reply: normalizeReplyLength(reply),
        sources: sources
          .filter((source) => source?.title && source?.url)
          .map((source) => ({
            title: String(source.title),
            url: String(source.url),
          })),
        mode: payload?.fallback ? "fallback" : "ai",
      };
    }
  } catch (error) {
    console.warn("No se pudo generar respuesta IA de WhatsApp con /api/chat:", error);
  }

  const fallback = await buildLegalAssistantFallback(prompt, { limit: 6 });
  return {
    reply: normalizeReplyLength(fallback.message),
    sources: fallback.references.map((reference) => ({
      title: reference.title,
      url: reference.url,
    })),
    mode: "fallback",
  };
}
