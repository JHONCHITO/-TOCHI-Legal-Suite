import type { CodigoLegalData } from "@/lib/types";
import { CODIGOS_COLOMBIANOS } from "@/lib/types";
import { getFallbackLegalUpdates, type LegalAreaKey } from "@/lib/legal-updates";
import { getLegalCodeContent, getOfficialLegalResources, toLegalSlug } from "@/lib/legal-library";
import { detectCode, extractArticleNumber } from "@/lib/services/legal-catalog";
import { searchSemanticLegalContent, type VectorHit } from "@/lib/services/legal-vector-search";
import { sanitizeLegalAiResponse } from "@/lib/ai-response";

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

interface QueryFocus {
  code: CodigoLegalData | null;
  articleNumber: string | null;
  specific: boolean;
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

function getQueryFocus(question: string): QueryFocus {
  const code = detectCode(question);
  const articleNumber = extractArticleNumber(question);

  return {
    code,
    articleNumber,
    specific: Boolean(code || articleNumber),
  };
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

function getDominantCode(references: LegalAssistantReference[]) {
  const stats = new Map<
    string,
    {
      code: CodigoLegalData;
      count: number;
      totalScore: number;
      maxScore: number;
    }
  >();

  for (const reference of references) {
    if (!reference.codigo) {
      continue;
    }

    const code = CODIGOS_COLOMBIANOS.find((item) => item.codigo === reference.codigo);
    if (!code) {
      continue;
    }

    const current = stats.get(code.codigo) || {
      code,
      count: 0,
      totalScore: 0,
      maxScore: 0,
    };

    const score = reference.score || 0;
    current.count += 1;
    current.totalScore += score;
    current.maxScore = Math.max(current.maxScore, score);
    stats.set(code.codigo, current);
  }

  const ranked = [...stats.values()].sort((a, b) => {
    if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore;
    if (b.count !== a.count) return b.count - a.count;
    return b.totalScore - a.totalScore;
  });

  const winner = ranked[0];
  if (!winner) {
    return null;
  }

  if (winner.maxScore >= 2 || winner.count >= 2 || winner.totalScore >= 3) {
    return winner.code;
  }

  return null;
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
          url: `/dashboard/leyes/${toLegalSlug(code.codigo)}`,
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

function buildOfficialReferences(question: string, topCodes: CodigoLegalData[], specific = false) {
  const area = inferArea(question);
  const monitoring = getFallbackLegalUpdates(area).monitoringLinks;
  const references: LegalAssistantReference[] = [];

  for (const code of topCodes.slice(0, specific ? 1 : 3)) {
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

function formatReferenceSummary(reference: LegalAssistantReference, index: number) {
  const parts = [`${index + 1}. ${reference.title}`];

  if (reference.snippet) {
    parts.push(`   ${reference.snippet}`);
  }

  const contextParts: string[] = [];

  if (reference.source === "codigo") {
    contextParts.push("Ficha interna");
  } else if (reference.source === "articulo") {
    contextParts.push(reference.articulo ? `Articulo ${reference.articulo}` : "Articulo relacionado");
  } else if (reference.source === "oficial") {
    contextParts.push("Fuente oficial");
  } else if (reference.source === "monitoreo") {
    contextParts.push("Seguimiento reciente");
  }

  if (contextParts.length) {
    parts.push(`   ${contextParts.join(" - ")}`);
  }

  return parts.join("\n");
}

function buildMessage(question: string, references: LegalAssistantReference[]) {
  const area = inferArea(question);
  const focus = getQueryFocus(question);
  const monitoring = getFallbackLegalUpdates(area);

  if (!references.length) {
    const officialBlock = buildOfficialReferences(question, focus.code ? [focus.code] : [], focus.specific);
    const lines = officialBlock
      .slice(0, focus.specific ? 2 : 4)
      .map((reference, index) => formatReferenceSummary(reference, index))
      .join("\n");

    return sanitizeLegalAiResponse([
      focus.specific
        ? "Referencia principal no encontrada en la base local."
        : "Respuesta generada con base en la base juridica local.",
      "",
      monitoring.summary,
      "",
      "No encontré una coincidencia exacta en la base local.",
      lines ? `\nFuentes oficiales sugeridas:\n${lines}` : "",
      "",
      "Siguiente paso sugerido: contrastar la referencia oficial elegida con la fuente primaria y, si aplica, convertirla en estrategia procesal, matriz de pruebas o escrito.",
    ]
      .filter(Boolean)
      .join("\n")
    );
  }

  const lines = references.slice(0, focus.specific ? 3 : 5).map((reference, index) => {
    return formatReferenceSummary(reference, index);
  });

  const recentNote = isRecentQuery(question)
    ? `\n\nPara actualidad reciente, revisa tambien el resumen de seguimiento:\n${monitoring.summary}`
    : "";

  const leadSentence = focus.specific
    ? references.length === 1
      ? "Referencia principal para la consulta:"
      : "Referencias principales para la consulta:"
    : "Referencias sugeridas:";

  return sanitizeLegalAiResponse([
    focus.specific
      ? "Respuesta enfocada en la norma detectada."
      : "Respuesta generada con base en la base juridica local.",
    "",
    leadSentence,
    "",
    lines.join("\n\n"),
    recentNote,
    "",
    focus.specific
      ? "Siguiente paso sugerido: trabajar el texto completo de la norma seleccionada, verificar el articulo exacto y convertirlo en fundamento, prueba o escrito."
      : "Siguiente paso sugerido: contrastar estas referencias con la fuente oficial y estructurar el argumento, la prueba o el escrito correspondiente.",
  ]
    .filter(Boolean)
    .join("\n")
  );
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
  const focus = getQueryFocus(question);
  const semanticReferences = buildSemanticReferences(semanticHits);
  const localReferences = buildLocalReferences(question);
  const dominantCode = focus.code || getDominantCode([...semanticReferences, ...localReferences]);
  const filteredSemantic = dominantCode
    ? semanticReferences.filter((reference) => reference.codigo === dominantCode.codigo)
    : semanticReferences;
  const filteredLocal = dominantCode
    ? localReferences.filter((reference) => reference.codigo === dominantCode.codigo)
    : localReferences;

  const articleNumber = focus.articleNumber ? normalizeText(focus.articleNumber) : "";
  const narrowedSemantic = articleNumber
    ? filteredSemantic.filter(
        (reference) =>
          normalizeText(reference.articulo || "") === articleNumber ||
          normalizeText(reference.title).includes(`art ${articleNumber}`) ||
          normalizeText(reference.title).includes(`articulo ${articleNumber}`)
      )
    : filteredSemantic;
  const narrowedLocal = articleNumber
    ? filteredLocal.filter(
        (reference) =>
          normalizeText(reference.articulo || "") === articleNumber ||
          normalizeText(reference.title).includes(`art ${articleNumber}`) ||
          normalizeText(reference.title).includes(`articulo ${articleNumber}`)
      )
    : filteredLocal;

  const focusedReferences = [...narrowedSemantic, ...narrowedLocal];
  const topCodes = collectTopCodes(focusedReferences);
  const officialReferences = buildOfficialReferences(
    question,
    topCodes.length ? topCodes : dominantCode ? [dominantCode] : [],
    focus.specific
  );

  const merged = dedupeReferences(
    [...focusedReferences, ...officialReferences].sort((a, b) => (b.score || 0) - (a.score || 0))
  );

  if (focus.specific) {
    if (dominantCode) {
      const sameCode = merged.filter((reference) => reference.codigo === dominantCode.codigo);
      if (sameCode.length) {
        return sameCode;
      }
    }

    if (articleNumber) {
      const sameArticle = merged.filter(
        (reference) => normalizeText(reference.articulo || "") === articleNumber
      );
      if (sameArticle.length) {
        return sameArticle;
      }
    }
  }

  return merged;
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
