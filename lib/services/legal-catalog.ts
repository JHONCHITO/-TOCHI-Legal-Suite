import dbConnect from "@/lib/mongodb";
import LegalCode from "@/lib/models/LegalCode";
import Article from "@/lib/models/Article";
import Articulo from "@/lib/models/Articulo";
import Ley from "@/lib/models/Ley";
import Norma from "@/lib/models/Norma";
import { CODIGOS_COLOMBIANOS, type CodigoLegalData } from "@/lib/types";
import { buildEmbeddingSourceHash } from "./legal-fingerprint";
import {
  constitucionPolitica,
  codigoCivil,
  codigoPenal,
  codigoProcedimientoPenal,
  codigoComercio,
  codigoSustantivoTrabajo,
  codigoProcesalTrabajo,
  codigoGeneralProceso,
  cpaca,
  codigoInfanciaAdolescencia,
  estatutoTributario,
  codigoPolicia,
  codigoTransito,
  estatutoConsumidor,
  codigoMinas,
  codigoRecursosNaturales,
  codigoElectoral,
  codigoDisciplinario,
  ley100SeguridadSocial,
  estatutoArbitraje,
  ley1564Insolvencia,
  ley1116InsolvenciaEmpresarial,
  ley906SistemaAcusatorio,
  codigoPenitenciario,
  ley1448Victimas,
  ley1581ProteccionDatos,
  codigoAduanero,
  ley23DerechosAutor,
} from "@/lib/data/codigos";
import { getLegalCodeContent, getOfficialLegalResources, toLegalSlug } from "@/lib/legal-library";

export interface LegalCodeArticleItem {
  number: string;
  title: string;
  content: string;
  libro?: string;
  capitulo?: string;
  seccion?: string;
}

export interface LegalCodeCardItem {
  _id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  year: number;
  articles: LegalCodeArticleItem[];
  source: "db" | "local";
}

export interface StructuredLegalCodeContent {
  codigo: string;
  descripcion: string;
  nivelContenido: "resumen_local";
  articulos: LegalCodeArticleItem[];
  temasClave: string[];
  notas?: string[];
}

export interface ExactLegalArticleResult {
  codigo: string;
  nombre: string;
  articulo: string;
  titulo: string;
  contenido: string;
  source: "local" | "structured" | "db";
  url: string;
  resources: Array<{ label: string; url: string }>;
}

export interface SyncResult {
  codesUpserted: number;
  articlesUpserted: number;
}

export interface LeySyncResult {
  leyesUpserted: number;
  leyArticlesUpserted: number;
}

interface SyncOptions {
  markEmbeddingSourceHash?: boolean;
}

type ArticleInput = {
  numero?: string;
  number?: string;
  numeroArticulo?: string;
  articulo?: string;
  titulo?: string;
  epigrafe?: string;
  tituloArticulo?: string;
  titulo_seccion?: string;
  tituloSeccion?: string;
  contenido?: string;
  resumen?: string;
  libro?: string;
  capitulo?: string;
  seccion?: string;
};

type StructuredSource = Record<string, unknown>;

const STRUCTURED_CODE_SOURCES: Record<string, StructuredSource | null> = {
  CONSTITUCION_1991: constitucionPolitica as StructuredSource,
  CODIGO_CIVIL: codigoCivil as StructuredSource,
  CODIGO_COMERCIO: codigoComercio as StructuredSource,
  CODIGO_PENAL: codigoPenal as StructuredSource,
  CODIGO_PROCEDIMIENTO_PENAL: codigoProcedimientoPenal as StructuredSource,
  CODIGO_SUSTANTIVO_TRABAJO: codigoSustantivoTrabajo as StructuredSource,
  CODIGO_PROCESAL_TRABAJO: codigoProcesalTrabajo as StructuredSource,
  CODIGO_GENERAL_PROCESO: codigoGeneralProceso as StructuredSource,
  CPACA: cpaca as StructuredSource,
  CODIGO_INFANCIA_ADOLESCENCIA: codigoInfanciaAdolescencia as StructuredSource,
  ESTATUTO_TRIBUTARIO: estatutoTributario as StructuredSource,
  CODIGO_NACIONAL_POLICIA: codigoPolicia as StructuredSource,
  CODIGO_TRANSITO: codigoTransito as StructuredSource,
  ESTATUTO_CONSUMIDOR: estatutoConsumidor as StructuredSource,
  CODIGO_MINAS: codigoMinas as StructuredSource,
  CODIGO_RECURSOS_NATURALES: codigoRecursosNaturales as StructuredSource,
  CODIGO_ELECTORAL: codigoElectoral as StructuredSource,
  CODIGO_DISCIPLINARIO_UNICO: codigoDisciplinario as StructuredSource,
  LEY100_SEGSOCIAL: ley100SeguridadSocial as StructuredSource,
  ESTATUTO_ARBITRAJE: estatutoArbitraje as StructuredSource,
  LEY1564_INSOLVENCIA: ley1564Insolvencia as StructuredSource,
  LEY1116_INSOLVENCIA_EMPRESARIAL: ley1116InsolvenciaEmpresarial as StructuredSource,
  LEY906_SISTEMA_ACUSATORIO: ley906SistemaAcusatorio as StructuredSource,
  CODIGO_PENITENCIARIO: codigoPenitenciario as StructuredSource,
  LEY1448_VICTIMAS: ley1448Victimas as StructuredSource,
  LEY1581_PROTECCION_DATOS: ley1581ProteccionDatos as StructuredSource,
  CODIGO_ADUANERO: codigoAduanero as StructuredSource,
  LEY23_DERECHOS_AUTOR: ley23DerechosAutor as StructuredSource,
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractYear(value: string, fallback = new Date().getFullYear()) {
  const match = value.match(/\b(18|19|20)\d{2}\b/);
  return match ? Number(match[0]) : fallback;
}

function toLabel(value: unknown) {
  return String(value || "").trim();
}

function getOfficialResources(codeData: CodigoLegalData) {
  return getOfficialLegalResources(codeData).map((item) => ({
    label: item.label,
    url: item.url,
  }));
}

function buildCodeCard(codeData: CodigoLegalData, articles: LegalCodeArticleItem[], source: "db" | "local"): LegalCodeCardItem {
  const localContent = getLegalCodeContent(codeData.codigo);
  const description = localContent.descripcion || codeData.numeroNorma || codeData.nombre;
  const category = codeData.areasDelDerecho[0] || codeData.tipo;

  return {
    _id: codeData.codigo,
    code: codeData.codigo,
    name: codeData.nombre,
    description,
    category,
    tags: Array.from(
      new Set(
        [
          codeData.nombreCorto,
          codeData.numeroNorma,
          codeData.tipo,
          ...codeData.areasDelDerecho,
          ...localContent.temasClave,
        ].filter(Boolean)
      )
    ),
    year: extractYear(codeData.numeroNorma),
    articles,
    source,
  };
}

function buildArticleItem(article: {
  numero?: string;
  number?: string;
  numeroArticulo?: string;
  articulo?: string;
  titulo?: string;
  epigrafe?: string;
  tituloArticulo?: string;
  titulo_seccion?: string;
  tituloSeccion?: string;
  contenido?: string;
  resumen?: string;
  libro?: string;
  capitulo?: string;
  seccion?: string;
}): LegalCodeArticleItem {
  const number = toLabel(article.numero || article.number || article.numeroArticulo || article.articulo);
  const section = article.seccion || article.titulo_seccion || article.tituloSeccion;
  return {
    number,
    title: toLabel(article.epigrafe || article.tituloArticulo || article.titulo || `Articulo ${number}`),
    content: toLabel(article.contenido || article.resumen || "Contenido no disponible."),
    libro: article.libro ? toLabel(article.libro) : undefined,
    capitulo: article.capitulo ? toLabel(article.capitulo) : undefined,
    seccion: section ? toLabel(section) : undefined,
  };
}

function buildArticleSourceHash(codeData: CodigoLegalData, article: LegalCodeArticleItem) {
  return buildEmbeddingSourceHash(
    [
      codeData.codigo,
      codeData.nombre,
      article.number,
      article.title,
      article.content,
      article.libro,
      article.capitulo,
      article.seccion,
    ],
    1500
  );
}

function toArticleInput(value: unknown): ArticleInput {
  if (!isPlainObject(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  const pick = (key: string) => (typeof source[key] === "string" ? (source[key] as string) : undefined);

  return {
    numero: pick("numero"),
    number: pick("number"),
    numeroArticulo: pick("numeroArticulo"),
    articulo: pick("articulo"),
    titulo: pick("titulo"),
    epigrafe: pick("epigrafe"),
    tituloArticulo: pick("tituloArticulo"),
    titulo_seccion: pick("titulo_seccion"),
    tituloSeccion: pick("tituloSeccion"),
    contenido: pick("contenido"),
    resumen: pick("resumen"),
    libro: pick("libro"),
    capitulo: pick("capitulo"),
    seccion: pick("seccion"),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isArticleLike(node: Record<string, unknown>) {
  const number = node.numero ?? node.number ?? node.numeroArticulo ?? node.articulo;
  const content = node.contenido ?? node.resumen;
  const hasNestedCollections =
    Array.isArray(node.articulos) || Array.isArray(node.capitulos) || Array.isArray(node.titulos);

  return Boolean(number && content && !hasNestedCollections);
}

function flattenStructuredNode(
  node: unknown,
  inherited: { libro?: string; titulo?: string; capitulo?: string; seccion?: string } = {}
): LegalCodeArticleItem[] {
  if (Array.isArray(node)) {
    return node.flatMap((item) => flattenStructuredNode(item, inherited));
  }

  if (!isPlainObject(node)) {
    return [];
  }

  const currentContext = {
    libro: toLabel(node.libro || inherited.libro),
    titulo: toLabel(node.titulo || node.nombre || inherited.titulo),
    capitulo: toLabel(node.capitulo || inherited.capitulo),
    seccion: toLabel(node.seccion || inherited.seccion),
  };

  const results: LegalCodeArticleItem[] = [];

  if (isArticleLike(node)) {
    results.push({
      ...buildArticleItem({
        numero: toLabel(node.numero || node.number || node.numeroArticulo || node.articulo),
        titulo: toLabel(node.titulo || node.tituloArticulo || node.epigrafe || currentContext.titulo),
        epigrafe: toLabel(node.epigrafe || node.tituloArticulo || node.titulo || currentContext.titulo),
        contenido: toLabel(node.contenido || node.resumen),
        libro: currentContext.libro,
        capitulo: currentContext.capitulo,
        seccion: currentContext.seccion,
      }),
    });
  }

  for (const key of ["libros", "titulos", "capitulos", "secciones", "articulos"] as const) {
    const collection = node[key];
    if (Array.isArray(collection)) {
      results.push(...flattenStructuredNode(collection, currentContext));
    }
  }

  return results;
}

function getStructuredSource(code: string) {
  return STRUCTURED_CODE_SOURCES[code] ?? null;
}

function getMergedArticlesForCode(codeData: CodigoLegalData) {
  const structuredSource = getStructuredSource(codeData.codigo);
  const structuredArticles = structuredSource ? flattenStructuredNode(structuredSource) : [];
  const localArticles = getLegalCodeContent(codeData.codigo).articulos.map((article) =>
    buildArticleItem({
      numero: article.numero,
      titulo: article.titulo,
      epigrafe: article.epigrafe,
      contenido: article.contenido || article.resumen,
      libro: article.libro,
      capitulo: article.capitulo,
    })
  );

  const merged = new Map<string, LegalCodeArticleItem>();

  for (const article of [...structuredArticles, ...localArticles]) {
    if (!article.number) {
      continue;
    }

    const existing = merged.get(article.number);
    if (!existing || (article.content.length > existing.content.length)) {
      merged.set(article.number, article);
    }
  }

  return [...merged.values()].sort((a, b) => a.number.localeCompare(b.number, "es", { numeric: true }));
}

export function detectCode(question: string) {
  const normalized = normalizeText(question);
  let bestMatch: CodigoLegalData | null = null;
  let bestScore = 0;

  for (const code of CODIGOS_COLOMBIANOS) {
    const aliases = [
      code.codigo,
      code.nombre,
      code.nombreCorto,
      code.numeroNorma,
      ...code.areasDelDerecho,
    ]
      .map(normalizeText)
      .filter(Boolean);

    let score = 0;

    for (const alias of aliases) {
      if (!alias) continue;
      if (normalized.includes(alias)) {
        score += alias.length > 6 ? 3 : 2;
      }
    }

    if (normalized.includes(normalizeText(code.codigo))) {
      score += 6;
    }
    if (normalized.includes(normalizeText(code.nombreCorto))) {
      score += 5;
    }
    if (normalized.includes(normalizeText(code.nombre))) {
      score += 4;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = code;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

export function extractArticleNumber(question: string) {
  const normalized = normalizeText(question);
  const hasHint =
    /articulo|art\.|art |numeral|numero|nro/.test(normalized) || /\bart\b/.test(normalized);

  if (!hasHint) {
    return null;
  }

  const patterns = [
    /articulo\s+(\d+[a-z]?)/i,
    /art\.?\s+(\d+[a-z]?)/i,
    /numeral\s+(\d+[a-z]?)/i,
    /numero\s+(\d+[a-z]?)/i,
    /\b(\d+[a-z]?)\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

async function getDbPresence() {
  await dbConnect();
  const dbCodes = await LegalCode.find({}).select("codigo").lean();
  return new Set(dbCodes.map((item: any) => String(item.codigo)));
}

async function getDbArticlesForCode(codeData: CodigoLegalData) {
  await dbConnect();

  const legalCode = await LegalCode.findOne({ codigo: codeData.codigo }).select("_id codigo").lean();
  const legalCodeId = legalCode?._id;

  const [articleDocs, articuloDocs, normaDocs, leyDocs] = await Promise.all([
    legalCodeId
      ? Article.find({
          $or: [{ codigoId: legalCodeId }, { codigoRef: codeData.codigo }],
        })
          .select("codigoRef numero epigrafe titulo contenido libro capitulo seccion")
          .sort({ numero: 1 })
          .lean()
      : Article.find({ codigoRef: codeData.codigo })
          .select("codigoRef numero epigrafe titulo contenido libro capitulo seccion")
          .sort({ numero: 1 })
          .lean(),
    Articulo.find({ codigoRef: codeData.codigo })
      .select("numeroArticulo tituloArticulo contenido libro capitulo seccion")
      .sort({ numeroArticulo: 1 })
      .lean(),
    Norma.find({ codigo: codeData.codigo })
      .select("articulo titulo contenido")
      .sort({ articulo: 1 })
      .lean(),
    Ley.find({ codigo: codeData.codigo })
      .select("codigo nombre descripcion articulos")
      .lean(),
  ]);

  const merged = new Map<string, LegalCodeArticleItem>();

  for (const article of getMergedArticlesForCode(codeData)) {
    if (article.number) {
      merged.set(article.number, article);
    }
  }

  for (const article of articleDocs) {
    const built = buildArticleItem(toArticleInput(article));
    if (built.number) {
      merged.set(built.number, built);
    }
  }

  for (const article of articuloDocs) {
    const built = buildArticleItem(toArticleInput(article));
    if (built.number) {
      merged.set(built.number, built);
    }
  }

  for (const article of normaDocs) {
    const built = buildArticleItem(toArticleInput(article));
    if (built.number) {
      merged.set(built.number, built);
    }
  }

  for (const ley of leyDocs as Array<{ codigo?: string; nombre?: string; descripcion?: string; articulos?: ArticleInput[] }>) {
    for (const article of ley.articulos || []) {
      const built = buildArticleItem(toArticleInput(article));
      if (built.number) {
        merged.set(built.number, built);
      }
    }
  }

  return [...merged.values()].sort((a, b) => a.number.localeCompare(b.number, "es", { numeric: true }));
}

export function buildStructuredLegalCodeContent(codigo: string): StructuredLegalCodeContent | null {
  const codeData = CODIGOS_COLOMBIANOS.find((item) => normalizeText(item.codigo) === normalizeText(codigo));
  if (!codeData) {
    return null;
  }

  const source = getStructuredSource(codeData.codigo);
  const articles = source ? flattenStructuredNode(source) : [];
  const localContent = getLegalCodeContent(codeData.codigo);

  const mergedArticles = articles.length ? articles : localContent.articulos.map((article) =>
    buildArticleItem({
      numero: article.numero,
      titulo: article.titulo,
      epigrafe: article.epigrafe,
      contenido: article.contenido || article.resumen,
      libro: article.libro,
      capitulo: article.capitulo,
    })
  );

  if (!mergedArticles.length && !localContent.descripcion) {
    return null;
  }

  return {
    codigo: codeData.codigo,
    descripcion: localContent.descripcion || codeData.numeroNorma || codeData.nombre,
    nivelContenido: "resumen_local",
    articulos: mergedArticles.sort((a, b) => a.number.localeCompare(b.number, "es", { numeric: true })),
    temasClave: Array.from(
      new Set([
        codeData.nombreCorto,
        codeData.numeroNorma,
        ...codeData.areasDelDerecho.slice(0, 4),
        ...localContent.temasClave,
      ].filter(Boolean))
    ),
    notas: localContent.notas,
  };
}

export async function buildLegalCodeCatalog(): Promise<LegalCodeCardItem[]> {
  const dbPresence = await getDbPresence().catch(() => new Set<string>());

  return CODIGOS_COLOMBIANOS.map((codeData) => {
    const content = buildStructuredLegalCodeContent(codeData.codigo);
    const mergedArticles = content?.articulos ?? getMergedArticlesForCode(codeData);
    return buildCodeCard(codeData, mergedArticles, dbPresence.has(codeData.codigo) ? "db" : "local");
  });
}

export async function buildLegalCodeDetail(codigo: string) {
  const codeData = CODIGOS_COLOMBIANOS.find(
    (item) => normalizeText(item.codigo) === normalizeText(codigo) || normalizeText(item.nombre) === normalizeText(codigo)
  );

  if (!codeData) {
    return null;
  }

  const articles = await getDbArticlesForCode(codeData).catch(() => getMergedArticlesForCode(codeData));
  const content = buildStructuredLegalCodeContent(codeData.codigo);
  const card = buildCodeCard(codeData, articles, "db");

  return {
    ...card,
    description: content?.descripcion || card.description,
    articles,
    resources: getOfficialResources(codeData),
  };
}

export async function findExactLegalArticle(question: string): Promise<ExactLegalArticleResult | null> {
  const codeData = detectCode(question);
  const articleNumber = extractArticleNumber(question);

  if (!codeData || !articleNumber) {
    return null;
  }

  const structuredArticles = getMergedArticlesForCode(codeData);
  const exactArticle =
    structuredArticles.find((item) => normalizeText(item.number) === normalizeText(articleNumber)) || null;

  if (exactArticle) {
    return {
      codigo: codeData.codigo,
      nombre: codeData.nombre,
      articulo: exactArticle.number,
      titulo: exactArticle.title,
      contenido: exactArticle.content,
      source: getStructuredSource(codeData.codigo) ? "structured" : "local",
      url: `/dashboard/leyes/${toLegalSlug(codeData.codigo)}`,
      resources: getOfficialResources(codeData),
    };
  }

  await dbConnect();

  const legalCode = await LegalCode.findOne({ codigo: codeData.codigo }).select("_id").lean();
  const codeId = legalCode?._id;

  const [articleDoc, articuloDoc, normaDoc, leyDoc] = await Promise.all([
    codeId
      ? Article.findOne({
          $or: [{ codigoId: codeId }, { codigoRef: codeData.codigo }],
          numero: articleNumber,
        })
          .select("codigoRef numero epigrafe titulo contenido libro capitulo seccion")
          .lean()
      : Article.findOne({ codigoRef: codeData.codigo, numero: articleNumber })
          .select("codigoRef numero epigrafe titulo contenido libro capitulo seccion")
          .lean(),
    Articulo.findOne({ codigoRef: codeData.codigo, numeroArticulo: articleNumber })
      .select("numeroArticulo tituloArticulo contenido libro capitulo seccion")
      .lean(),
    Norma.findOne({ codigo: codeData.codigo, articulo: articleNumber })
      .select("articulo titulo contenido")
      .lean(),
    Ley.findOne({ codigo: codeData.codigo, "articulos.numero": articleNumber })
      .select("codigo nombre descripcion articulos")
      .lean(),
  ]);

  const fallbackArticle =
    articleDoc ||
    articuloDoc ||
    normaDoc ||
    null;

  const leyFallback = leyDoc as { codigo?: string; nombre?: string; descripcion?: string; articulos?: ArticleInput[] } | null;
  const leyArticle =
    leyFallback?.articulos?.find((item) => normalizeText(String(item.numero || item.number || item.numeroArticulo || item.articulo || "")) === normalizeText(articleNumber)) ||
    null;

  if (!fallbackArticle && !leyArticle) {
    return null;
  }

  const built = buildArticleItem(toArticleInput(fallbackArticle || leyArticle));

  return {
    codigo: codeData.codigo,
    nombre: codeData.nombre,
    articulo: built.number || articleNumber,
    titulo: built.title || `Articulo ${articleNumber}`,
    contenido: built.content,
    source: "db",
    url: `/dashboard/leyes/${toLegalSlug(codeData.codigo)}`,
    resources: getOfficialResources(codeData),
  };
}

function buildKeywords(codeData: CodigoLegalData, content: StructuredLegalCodeContent | null) {
  return Array.from(
    new Set(
      [
        codeData.nombreCorto,
        codeData.numeroNorma,
        codeData.tipo,
        ...codeData.areasDelDerecho,
        ...(content?.temasClave || []),
      ].filter(Boolean)
    )
  );
}

export async function syncLegalCodeCatalog(options: SyncOptions = {}): Promise<SyncResult> {
  await dbConnect();

  let codesUpserted = 0;
  let articlesUpserted = 0;

  for (const codeData of CODIGOS_COLOMBIANOS) {
    const structuredContent = buildStructuredLegalCodeContent(codeData.codigo);
    const articles = structuredContent?.articulos.length
      ? structuredContent.articulos
      : getMergedArticlesForCode(codeData);

    await LegalCode.updateOne(
      { codigo: codeData.codigo },
      {
        $set: {
          codigo: codeData.codigo,
          nombre: codeData.nombre,
          nombreCorto: codeData.nombreCorto,
          tipo: codeData.tipo,
          numeroNorma: codeData.numeroNorma,
          entidadEmisora: codeData.entidadEmisora,
          urlOficial: codeData.urlOficial,
          urlSUIN: codeData.urlSUIN,
          urlSenado: codeData.urlSenado,
          vigente: true,
          ultimaActualizacion: new Date(),
          versionActual: "1.0",
          tags: buildKeywords(codeData, structuredContent),
          areasDelDerecho: codeData.areasDelDerecho,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    codesUpserted += 1;

    const legalCodeDoc = await LegalCode.findOne({ codigo: codeData.codigo }).select("_id").lean();
    if (!legalCodeDoc?._id) {
      continue;
    }

    for (const article of articles) {
      const numero = article.number.trim();
      if (!numero) {
        continue;
      }

      const contenido = article.content.trim();
      const embeddingSourceHash = options.markEmbeddingSourceHash
        ? buildArticleSourceHash(codeData, article)
        : undefined;

      await Article.updateOne(
        { codigoId: legalCodeDoc._id, codigoRef: codeData.codigo, numero },
        {
          $set: {
            codigoId: legalCodeDoc._id,
            codigoRef: codeData.codigo,
            numero,
            numeroCompleto: numero,
            libro: article.libro || "",
            titulo: codeData.nombre,
            capitulo: article.capitulo || "",
            seccion: article.seccion || "",
            epigrafe: article.title,
            contenido,
            contenidoHTML: contenido,
            ...(embeddingSourceHash ? { embeddingSourceHash } : {}),
            vigente: true,
            palabrasClave: Array.from(
              new Set(
                [
                  numero,
                  article.title,
                  codeData.nombre,
                  codeData.nombreCorto,
                  codeData.numeroNorma,
                  ...codeData.areasDelDerecho,
                ]
                  .join(" ")
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((item) => normalizeText(item))
              )
            ),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      await Articulo.updateOne(
        { codigoRef: codeData.codigo, numeroArticulo: numero },
        {
          $set: {
            codigoLegalId: legalCodeDoc._id,
            codigoRef: codeData.codigo,
            libro: article.libro || "",
            titulo: codeData.nombre,
            capitulo: article.capitulo || "",
            seccion: article.seccion || "",
            numeroArticulo: numero,
            tituloArticulo: article.title,
            contenido,
            ...(embeddingSourceHash ? { embeddingSourceHash } : {}),
            vigente: true,
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      await Norma.updateOne(
        { codigo: codeData.codigo, articulo: numero },
        {
          $set: {
            codigo: codeData.codigo,
            nombre: codeData.nombre,
            articulo: numero,
            titulo: article.title,
            contenido,
            ...(embeddingSourceHash ? { embeddingSourceHash } : {}),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      articlesUpserted += 1;
    }
  }

  return { codesUpserted, articlesUpserted };
}

export async function syncLegacyLeyCatalog(options: SyncOptions = {}): Promise<LeySyncResult> {
  await dbConnect();

  let leyesUpserted = 0;
  let leyArticlesUpserted = 0;

  for (const codeData of CODIGOS_COLOMBIANOS) {
    const structuredContent = buildStructuredLegalCodeContent(codeData.codigo);
    const articles = structuredContent?.articulos.length
      ? structuredContent.articulos
      : getMergedArticlesForCode(codeData);

    const leyArticles = articles.map((article) => ({
      numero: article.number,
      titulo: article.title,
      libro: article.libro || "",
      capitulo: article.capitulo || "",
      seccion: article.seccion || "",
      contenido: article.content,
      ...(options.markEmbeddingSourceHash
        ? { embeddingSourceHash: buildArticleSourceHash(codeData, article) }
        : {}),
      palabrasClave: Array.from(
        new Set(
          [
            article.number,
            article.title,
            codeData.codigo,
            codeData.nombre,
            codeData.nombreCorto,
            codeData.numeroNorma,
            ...codeData.areasDelDerecho,
          ]
            .join(" ")
            .split(/\s+/)
            .filter(Boolean)
            .map((item) => normalizeText(item))
        )
      ),
    }));

    await Ley.updateOne(
      { codigo: codeData.codigo },
      {
        $set: {
          nombre: codeData.nombre,
          codigo: codeData.codigo,
          descripcion: structuredContent?.descripcion || codeData.numeroNorma || codeData.nombre,
          fuente: "catalogo_legal",
          actualizado: new Date(),
          articulos: leyArticles,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    leyesUpserted += 1;
    leyArticlesUpserted += leyArticles.length;
  }

  return { leyesUpserted, leyArticlesUpserted };
}
