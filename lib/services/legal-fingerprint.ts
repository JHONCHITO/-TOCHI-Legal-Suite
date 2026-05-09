import { createHash } from "crypto";

export function normalizeLegalText(value: unknown) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildEmbeddingSourceText(parts: Array<string | undefined | null>, maxLength = 1800) {
  return parts
    .map((part) => normalizeLegalText(part))
    .filter(Boolean)
    .join("\n")
    .trim()
    .slice(0, maxLength);
}

export function buildEmbeddingSourceHash(parts: Array<string | undefined | null>, maxLength = 1800) {
  const text = buildEmbeddingSourceText(parts, maxLength);
  if (!text) {
    return "";
  }

  return createHash("sha256").update(text).digest("hex");
}
