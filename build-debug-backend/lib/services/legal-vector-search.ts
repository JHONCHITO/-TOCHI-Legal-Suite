import OpenAI from "openai";
import dbConnect from "@/lib/mongodb";
import Norma from "@/lib/models/Norma";
import Article from "@/lib/models/Article";
import Articulo from "@/lib/models/Articulo";
import Ley from "@/lib/models/Ley";
import { toLegalSlug } from "@/lib/legal-library";

export type VectorHit = {
  tipo: "vector";
  source: "norma" | "articulo" | "article" | "ley";
  codigo: string;
  articulo?: string;
  titulo: string;
  resumen: string;
  contenido: string;
  enlace: string;
  score: number;
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const embeddingCache = new Map<string, number[]>();

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i += 1) {
    const valueA = a[i] || 0;
    const valueB = b[i] || 0;
    dot += valueA * valueB;
    magA += valueA * valueA;
    magB += valueB * valueB;
  }

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function getQueryEmbedding(query: string) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return null;
  }

  const cached = embeddingCache.get(normalized);
  if (cached) {
    return cached;
  }

  if (!openai) {
    return null;
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: normalized,
  });

  const vector = response.data[0]?.embedding || null;
  if (vector) {
    embeddingCache.set(normalized, vector);
  }

  return vector;
}

function formatSnippet(value: unknown, length = 220) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function isCurrentEmbedding(
  embedding: unknown,
  embeddingHash?: string,
  embeddingSourceHash?: string
) {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return false;
  }

  if (embeddingSourceHash && !embeddingHash) {
    return false;
  }

  if (embeddingSourceHash && embeddingHash) {
    return embeddingHash === embeddingSourceHash;
  }

  return true;
}

export async function searchSemanticLegalContent(query: string, limit = 8): Promise<VectorHit[]> {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < 3) {
    return [];
  }

  const queryVector = await getQueryEmbedding(normalized);
  if (!queryVector) {
    return [];
  }

  await dbConnect();

  const [normas, articulos, articles, leyes] = await Promise.all([
    Norma.find({
      embedding: { $exists: true },
      contenido: { $exists: true, $ne: "" },
    })
      .select("codigo nombre articulo titulo contenido embedding embeddingHash embeddingSourceHash")
      .limit(250)
      .lean(),
    Articulo.find({
      embedding: { $exists: true },
      contenido: { $exists: true, $ne: "" },
    })
      .select("codigoRef numeroArticulo tituloArticulo contenido embedding embeddingHash embeddingSourceHash")
      .limit(350)
      .lean(),
    Article.find({
      embedding: { $exists: true },
      contenido: { $exists: true, $ne: "" },
    })
      .select("codigoRef numero epigrafe titulo contenido libro capitulo seccion embedding embeddingHash embeddingSourceHash")
      .limit(350)
      .lean(),
    Ley.find({
      articulos: { $exists: true, $ne: [] },
    })
      .select("codigo nombre descripcion articulos")
      .limit(150)
      .lean(),
  ]);

  const rankedNormas = normas
    .filter((norma: any) =>
      isCurrentEmbedding(norma.embedding, norma.embeddingHash, norma.embeddingSourceHash)
    )
    .map((norma: any) => ({
      tipo: "vector" as const,
      source: "norma" as const,
      codigo: norma.codigo,
      articulo: norma.articulo,
      titulo: norma.titulo || norma.nombre || "Norma",
      resumen: formatSnippet(norma.contenido),
      contenido: formatSnippet(norma.contenido, 1200),
      enlace: `/dashboard/leyes/${toLegalSlug(norma.codigo)}`,
      score: cosineSimilarity(queryVector, norma.embedding),
    }));

  const rankedArticulos = articulos
    .filter((articulo: any) =>
      isCurrentEmbedding(articulo.embedding, articulo.embeddingHash, articulo.embeddingSourceHash)
    )
    .map((articulo: any) => ({
      tipo: "vector" as const,
      source: "articulo" as const,
      codigo: articulo.codigoRef,
      articulo: articulo.numeroArticulo,
      titulo: articulo.tituloArticulo || articulo.titulo || "Articulo",
      resumen: formatSnippet(articulo.contenido),
      contenido: formatSnippet(articulo.contenido, 1200),
      enlace: `/dashboard/leyes/${toLegalSlug(articulo.codigoRef)}`,
      score: cosineSimilarity(queryVector, articulo.embedding),
    }));

  const rankedArticles = articles
    .filter((article: any) =>
      isCurrentEmbedding(article.embedding, article.embeddingHash, article.embeddingSourceHash)
    )
    .map((article: any) => ({
      tipo: "vector" as const,
      source: "article" as const,
      codigo: article.codigoRef,
      articulo: article.numero,
      titulo: article.epigrafe || article.titulo || "Articulo",
      resumen: formatSnippet(article.contenido),
      contenido: formatSnippet(article.contenido, 1200),
      enlace: `/dashboard/leyes/${toLegalSlug(article.codigoRef)}`,
      score: cosineSimilarity(queryVector, article.embedding),
    }));

  const rankedLeyes = leyes.flatMap((ley: any) =>
    (ley.articulos || [])
      .filter((articulo: any) =>
        isCurrentEmbedding(articulo.embedding, articulo.embeddingHash, articulo.embeddingSourceHash)
      )
      .map((articulo: any) => ({
        tipo: "vector" as const,
        source: "ley" as const,
        codigo: ley.codigo,
        articulo: articulo.numero,
        titulo: articulo.titulo || ley.nombre || "Ley",
        resumen: formatSnippet(articulo.contenido),
        contenido: formatSnippet(articulo.contenido, 1200),
        enlace: `/dashboard/leyes/${toLegalSlug(ley.codigo)}`,
        score: cosineSimilarity(queryVector, articulo.embedding),
      }))
  );

  return [...rankedNormas, ...rankedArticulos, ...rankedArticles, ...rankedLeyes]
    .filter((item) => item.score > 0.18)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
