import type { CodigoLegalData } from "@/lib/types";
import { CODIGOS_COLOMBIANOS } from "@/lib/types";
import { getFallbackLegalUpdates, type LegalAreaKey } from "@/lib/legal-updates";
import { getLegalCodeContent, getOfficialLegalResources, toLegalSlug } from "@/lib/legal-library";
import { searchSemanticLegalContent, type VectorHit } from "@/lib/services/legal-vector-search";

export interface LegalAssistantReference {
  title: string;
  url: string;
  source?: string;
  codigo?: string;
  nombre?: string;
  articulo?: string;
  titulo?: string;
  score?: number;
  snippet?: string;
}

export interface LegalAssistantFallbackResult {
  message: string;
  references: LegalAssistantReference[];
  fallback: true;
  model: "local-fallback";
}

const RECENT_CONTEXT_REGEX =
  /hoy|actual|actualizado|actualizada|actualizacion|actualizaci[oó]n|reciente|recientes|nueva|nuevo|ultim|[uú]ltim|jurisprudencia|sentencia|sentencias|leyes|modificaciones|modificacion|diario|diaria/i;

const STOP_WORDS = new Set([
  "que",
  "cual",
  "cuales",
  "como",
  "cuando",
  "donde",
  "porque",
  "para",
  "por",
  "del",
  "de",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "segun",
  "sobre",
  "con",
  "sin",
  "al",
  "en",
  "articulo",
  "art",
  "codigo",
  "dice",
]);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function extractNumbers(value: string) {
  return [...new Set(value.match(/\b\d{1,4}\b/g) ?? [])];
}

function isRecentQuery(question: string) {
  return RECENT_CONTEXT_REGEX.test(question);
}

function inferArea(question: string): LegalAreaKey {
  const normalized = normalizeText(question);
  if (/(penal|delito|fiscal|homicidio|captura|prision)/i.test(normalized)) return "penal";
  if (/(familia|alimentos|custodia|menor|menores|adopcion|sucesion)/i.test(normalized)) return "familia";
  if (/(laboral|trabajo|despido|salario|pension|seguridad social)/i.test(normalized)) return "laboral";
  if (/(administrativo|cpaca|estado|acto administrativo|peticion|contencioso)/i.test(normalized)) return "administrativo";
  if (/(disciplinario|abogado|sancion|etica|comision nacional de disciplina)/i.test(normalized)) return "disciplinario";
  if (/(civil|contrato|obligacion|bienes|responsabilidad)/i.test(normalized)) return "civil";
  return "todas";
}

function scoreText(tokens: string[], haystack: string) {
  const normalizedHaystack = normalizeText(haystack);
  let score = 0;

  for (const token of tokens) {
    if (normalizedHaystack.includes(token)) {
      score += token.length >= 7 ? 1.5 : 1;
    }
  }

  return score;
}

function dedupeReferences(references: LegalAssistantReference[]) {
  const seen = new Set<string>();
  const ordered: LegalAssistantReference[] = [];

  for (const reference of references) {
    const key = normalizeText(reference.url || reference.title);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    ordered.push(reference);
  }

  return ordered;
}

function buildSemanticReferences(semanticHits: VectorHit[]) {
  return semanticHits.map<LegalAssistantReference>((hit) => {
    const code = CODIGOS_COLOMBIANOS.find((item) => item.codigo === hit.codigo);

    return {
      title: hit.articulo ? `${hit.titulo} - Art. ${hit.articulo}` : hit.titulo,
      url: hit.enlace,
      source: hit.source,
      codigo: hit.codigo,
      nombre: code?.nombre || hit.codigo,
      articulo: hit.articulo,
      titulo: hit.titulo,
      score: hit.score,
      snippet: hit.resumen || hit.contenido,
    };
  });
}

function buildLocalReferences(question: string) {
  const normalizedQuestion = normalizeText(question);
  const tokens = tokenize(question);
  const numbers = extractNumbers(question);
  const references: LegalAssistantReference[] = [];

  for (const code of CODIGOS_COLOMBIANOS) {
    const content = getLegalCodeContent(code.codigo);
    const codeText = [
      code.codigo,
      code.nombre,
      code.nombreCorto,
      code.numeroNorma,
      code.entidadEmisora,
      code.areasDelDerecho.join(" "),
      content.descripcion,
      content.temasClave.join(" "),
    ]
      .filter(Boolean)
      .join(" ");

    let codeScore = scoreText(tokens, codeText);
    if (normalizedQuestion.includes(normalizeText(code.nombre))) {
      codeScore += 4;
    }
    if (normalizedQuestion.includes(normalizeText(code.nombreCorto))) {
      codeScore += 3;
    }
    if (normalizedQuestion.includes(normalizeText(code.numeroNorma))) {
      codeScore += 2;
    }

    if (codeScore > 0) {
      references.push({
        title: code.nombre,
        url: `/dashboard/leyes/${toLegalSlug(code.codigo)}`,
        source: "codigo",
        codigo: code.codigo,
        nombre: code.nombre,
        titulo: code.nombre,
        score: codeScore,
        snippet: content.descripcion || code.numeroNorma || code.nombre,
      });
    }

    for (const article of content.articulos) {
      const articleText = [
        article.numero,
        article.epigrafe,
        article.resumen,
        article.contenido,
        article.titulo,
        article.palabrasClave?.join(" "),
      ]
        .filter(Boolean)
        .join(" ");

      let articleScore = scoreText(tokens, articleText);

      if (numbers.includes(article.numero)) {
        articleScore += 5;
      }

      if (normalizedQuestion.includes(normalizeText(article.epigrafe))) {
        articleScore += 2;
      }

      if (articleScore > 0) {
        references.push({
          title: `${code.nombre} - Art. ${article.numero}`,
          url: `/dashboard/busqueda?q=${encodeURIComponent(
            `${code.nombre} ${article.numero} ${article.epigrafe}`.trim()
          )}`,
          source: "articulo",
          codigo: code.codigo,
          nombre: code.nombre,
          articulo: article.numero,
          titulo: article.epigrafe || article.titulo || code.nombre,
          score: articleScore,
          snippet: article.contenido || article.resumen || article.epigrafe,
        });
      }
    }
  }

  return references.sort((a, b) => (b.score || 0) - (a.score || 0));
}

function buildOfficialReferences(question: string, topCodes: CodigoLegalData[]) {
  const area = inferArea(question);
  const monitoring = getFallbackLegalUpdates(area).monitoringLinks;
  const references: LegalAssistantReference[] = [];

  for (const code of topCodes.slice(0, 3)) {
    for (const resource of getOfficialLegalResources(code)) {
      references.push({
        title: `${code.nombreCorto} - ${resource.label}`,
        url: resource.url,
        source: "oficial",
        codigo: code.codigo,
        nombre: code.nombre,
        titulo: resource.label,
        score: 0.4,
        snippet: resource.label,
      });
    }
  }

  if (isRecentQuery(question)) {
    for (const item of monitoring.slice(0, 4)) {
      references.push({
        title: item.name,
        url: item.url,
        source: "monitoreo",
        nombre: item.name,
        titulo: item.name,
        score: 0.35,
        snippet: item.type === "jurisprudencia" ? "Fuente oficial de jurisprudencia" : "Fuente oficial normativa",
      });
    }
  }

  return references;
}

function buildMessage(question: string, references: LegalAssistantReference[]) {
  const area = inferArea(question);
  const monitoring = getFallbackLegalUpdates(area);

  if (!references.length) {
    const officialBlock = buildOfficialReferences(question, []);
    const lines = officialBlock
      .slice(0, 4)
      .map((reference) => `- ${reference.title}\n  ${reference.url}`)
      .join("\n");

    return [
      "No pude conectar con OpenAI, pero sigo con la base local de TOCHI.",
      "",
      monitoring.summary,
      "",
      "No encontré una coincidencia exacta en la base local.",
      lines ? `\nFuentes oficiales:\n${lines}` : "",
      "",
      "Esta información es orientativa. Para casos específicos, consulte con un abogado.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const lines = references.slice(0, 5).map((reference, index) => {
    const parts = [`${index + 1}. ${reference.title}`];
    if (reference.snippet) {
      parts.push(`   ${reference.snippet}`);
    }
    parts.push(`   Abrir: ${reference.url}`);
    return parts.join("\n");
  });

  const recentNote = isRecentQuery(question)
    ? `\n\nPara actualidad reciente, revisa tambien el resumen de seguimiento:\n${monitoring.summary}`
    : "";

  return [
    "No pude conectar con OpenAI, pero sigo con la base local de TOCHI.",
    "",
    `Encontré ${references.length} referencia${references.length === 1 ? "" : "s"} relevante${references.length === 1 ? "" : "s"}:`,
    "",
    lines.join("\n\n"),
    recentNote,
    "",
    "Esta información es orientativa. Para casos específicos, consulte con un abogado.",
  ]
    .filter(Boolean)
    .join("\n");
}

function collectTopCodes(references: LegalAssistantReference[]) {
  const codes = new Map<string, CodigoLegalData>();

  for (const reference of references) {
    if (!reference.codigo) {
      continue;
    }

    const code = CODIGOS_COLOMBIANOS.find((item) => item.codigo === reference.codigo);
    if (code) {
      codes.set(code.codigo, code);
    }
  }

  return [...codes.values()];
}

function combineReferences(question: string, semanticHits: VectorHit[]) {
  const semanticReferences = buildSemanticReferences(semanticHits);
  const localReferences = buildLocalReferences(question);
  const topCodes = collectTopCodes([...semanticReferences, ...localReferences]);
  const officialReferences = buildOfficialReferences(question, topCodes);

  return dedupeReferences(
    [...semanticReferences, ...localReferences, ...officialReferences].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    )
  );
}

export async function buildLegalAssistantFallback(
  question: string,
  options: { semanticHits?: VectorHit[]; limit?: number } = {}
): Promise<LegalAssistantFallbackResult> {
  const semanticHits =
    options.semanticHits ?? (await searchSemanticLegalContent(question, options.limit ?? 6).catch(() => []));

  const references = combineReferences(question, semanticHits).slice(0, options.limit ?? 6);

  return {
    message: buildMessage(question, references),
    references,
    fallback: true,
    model: "local-fallback",
  };
}
