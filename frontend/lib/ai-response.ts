const GENERIC_LEGAL_CLOSINGS = [
  /(?:\s|^)(?:esta informaci[oó]n es orientativa\.?\s*)?(?:para casos espec[ií]ficos,?\s*)?(?:consulte|consulta)\s+con\s+un\s+abogad[oa]\.?\s*/gi,
  /(?:\s|^)(?:esta respuesta no sustituye|esto no sustituye|no constituye)\s+asesor[ií]a legal\.?\s*/gi,
  /(?:\s|^)(?:si necesitas|si necesita|si quieres|si quiere)[^.\n]{0,120}(?:consulte|consulta)\s+con\s+un\s+abogad[oa]\.?\s*/gi,
  /(?:\s|^)(?:esta respuesta|este analisis|este an[aá]lisis|este criterio)[^.\n]{0,80}(?:no sustituye|no reemplaza)\s+asesor[ií]a legal\.?\s*/gi,
];

export function sanitizeLegalAiResponse(text: string) {
  let cleaned = String(text || "");

  for (const pattern of GENERIC_LEGAL_CLOSINGS) {
    cleaned = cleaned.replace(pattern, "");
  }

  cleaned = cleaned
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();

  return cleaned;
}
