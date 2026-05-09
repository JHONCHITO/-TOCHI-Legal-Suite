import OpenAI from "openai";

import dbConnect from "@/lib/mongodb";
import Article from "@/lib/models/Article";
import Articulo from "@/lib/models/Articulo";
import Ley from "@/lib/models/Ley";
import Norma from "@/lib/models/Norma";
import { buildEmbeddingSourceHash, buildEmbeddingSourceText } from "./legal-fingerprint";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const BATCH_SIZE = 60;

export interface LegalEmbeddingRefreshResult {
  normas: number;
  articulos: number;
  articles: number;
  leySubdocuments: number;
  total: number;
}

type RefreshableDocument = {
  embedding?: number[];
  embeddingHash?: string;
  embeddingSourceHash?: string;
  embeddingUpdatedAt?: Date;
  save: () => Promise<unknown>;
};

async function createEmbedding(input: string) {
  if (!openai) {
    return null;
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  return response.data[0]?.embedding || null;
}

function hasEmbedding(embedding: unknown) {
  return Array.isArray(embedding) && embedding.length > 0;
}

function needsRefresh(doc: { embedding?: number[]; embeddingHash?: string; embeddingSourceHash?: string }) {
  if (!hasEmbedding(doc.embedding)) {
    return true;
  }

  if (!doc.embeddingSourceHash) {
    return true;
  }

  return doc.embeddingHash !== doc.embeddingSourceHash;
}

async function processNormas() {
  let processed = 0;

  while (true) {
    const normas = await Norma.find({
      contenido: { $exists: true, $ne: "" },
      $or: [
        { embedding: { $exists: false } },
        { embeddingHash: { $exists: false } },
        { embeddingSourceHash: { $exists: false } },
        { $expr: { $ne: ["$embeddingHash", "$embeddingSourceHash"] } },
      ],
    })
      .limit(BATCH_SIZE)
      .select("codigo nombre articulo titulo contenido embedding embeddingHash embeddingSourceHash");

    if (!normas.length) {
      break;
    }

    for (const norma of normas as Array<
      RefreshableDocument & { codigo: string; nombre: string; articulo: string; titulo?: string; contenido: string }
    >) {
      const sourceHash = buildEmbeddingSourceHash([norma.titulo, norma.contenido, norma.articulo, norma.nombre, norma.codigo], 1200);
      if (!sourceHash) {
        continue;
      }

      norma.embeddingSourceHash = sourceHash;

      if (!needsRefresh(norma)) {
        if (!norma.embeddingHash) {
          norma.embeddingHash = sourceHash;
          await norma.save();
        }
        continue;
      }

      const texto = buildEmbeddingSourceText([norma.titulo, norma.contenido, norma.articulo, norma.nombre, norma.codigo], 1200);
      if (!texto || texto.length < 30) {
        continue;
      }

      const embedding = await createEmbedding(texto);
      if (!embedding) {
        continue;
      }

      norma.embedding = embedding;
      norma.embeddingHash = sourceHash;
      norma.embeddingUpdatedAt = new Date();
      await norma.save();

      processed += 1;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  return processed;
}

async function processArticulos() {
  let processed = 0;

  while (true) {
    const articulos = await Articulo.find({
      contenido: { $exists: true, $ne: "" },
      $or: [
        { embedding: { $exists: false } },
        { embeddingHash: { $exists: false } },
        { embeddingSourceHash: { $exists: false } },
        { $expr: { $ne: ["$embeddingHash", "$embeddingSourceHash"] } },
      ],
    })
      .limit(BATCH_SIZE)
      .select("codigoRef numeroArticulo tituloArticulo contenido libro capitulo seccion embedding embeddingHash embeddingSourceHash");

    if (!articulos.length) {
      break;
    }

    for (const articulo of articulos as Array<
      RefreshableDocument & {
        codigoRef: string;
        numeroArticulo: string;
        tituloArticulo: string;
        contenido: string;
        titulo?: string;
        libro?: string;
        capitulo?: string;
        seccion?: string;
      }
    >) {
      const sourceHash = buildEmbeddingSourceHash(
        [articulo.tituloArticulo, articulo.titulo, articulo.seccion, articulo.capitulo, articulo.libro, articulo.contenido, articulo.codigoRef, articulo.numeroArticulo],
        1500
      );
      if (!sourceHash) {
        continue;
      }

      articulo.embeddingSourceHash = sourceHash;

      if (!needsRefresh(articulo)) {
        if (!articulo.embeddingHash) {
          articulo.embeddingHash = sourceHash;
          await articulo.save();
        }
        continue;
      }

      const texto = buildEmbeddingSourceText(
        [articulo.tituloArticulo, articulo.titulo, articulo.seccion, articulo.capitulo, articulo.libro, articulo.contenido, articulo.codigoRef, articulo.numeroArticulo],
        1500
      );

      if (!texto || texto.length < 30) {
        continue;
      }

      const embedding = await createEmbedding(texto);
      if (!embedding) {
        continue;
      }

      articulo.embedding = embedding;
      articulo.embeddingHash = sourceHash;
      articulo.embeddingUpdatedAt = new Date();
      await articulo.save();

      processed += 1;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  return processed;
}

async function processArticles() {
  let processed = 0;

  while (true) {
    const articles = await Article.find({
      contenido: { $exists: true, $ne: "" },
      $or: [
        { embedding: { $exists: false } },
        { embeddingHash: { $exists: false } },
        { embeddingSourceHash: { $exists: false } },
        { $expr: { $ne: ["$embeddingHash", "$embeddingSourceHash"] } },
      ],
    })
      .limit(BATCH_SIZE)
      .select("codigoRef numero epigrafe titulo contenido libro capitulo seccion embedding embeddingHash embeddingSourceHash");

    if (!articles.length) {
      break;
    }

    for (const article of articles as Array<
      RefreshableDocument & {
        codigoRef?: string;
        numero: string;
        epigrafe?: string;
        titulo?: string;
        contenido: string;
        libro?: string;
        capitulo?: string;
        seccion?: string;
      }
    >) {
      const sourceHash = buildEmbeddingSourceHash(
        [article.epigrafe, article.titulo, article.seccion, article.capitulo, article.libro, article.contenido, article.codigoRef, article.numero],
        1500
      );
      if (!sourceHash) {
        continue;
      }

      article.embeddingSourceHash = sourceHash;

      if (!needsRefresh(article)) {
        if (!article.embeddingHash) {
          article.embeddingHash = sourceHash;
          await article.save();
        }
        continue;
      }

      const texto = buildEmbeddingSourceText(
        [article.epigrafe, article.titulo, article.seccion, article.capitulo, article.libro, article.contenido, article.codigoRef, article.numero],
        1500
      );

      if (!texto || texto.length < 30) {
        continue;
      }

      const embedding = await createEmbedding(texto);
      if (!embedding) {
        continue;
      }

      article.embedding = embedding;
      article.embeddingHash = sourceHash;
      article.embeddingUpdatedAt = new Date();
      await article.save();

      processed += 1;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  return processed;
}

async function processLeyes() {
  let processed = 0;
  let subdocuments = 0;

  while (true) {
    const leyes = await Ley.find({
      articulos: { $exists: true, $ne: [] },
    })
      .limit(BATCH_SIZE)
      .select("codigo nombre descripcion articulos");

    if (!leyes.length) {
      break;
    }

    for (const ley of leyes as Array<{
      codigo: string;
      nombre: string;
      descripcion?: string;
      articulos?: Array<{
        numero?: string;
        titulo?: string;
        contenido?: string;
        libro?: string;
        capitulo?: string;
        seccion?: string;
        embedding?: number[];
        embeddingHash?: string;
        embeddingSourceHash?: string;
        embeddingUpdatedAt?: Date;
      }>;
      save: () => Promise<unknown>;
    }>) {
      let changed = false;

      for (const articulo of ley.articulos || []) {
        const sourceHash = buildEmbeddingSourceHash(
          [ley.codigo, ley.nombre, ley.descripcion, articulo.titulo, articulo.numero, articulo.libro, articulo.capitulo, articulo.seccion, articulo.contenido],
          1500
        );

        if (!sourceHash) {
          continue;
        }

        articulo.embeddingSourceHash = sourceHash;

        const subdocumentNeedsRefresh =
          !hasEmbedding(articulo.embedding) ||
          !articulo.embeddingHash ||
          articulo.embeddingHash !== articulo.embeddingSourceHash;

        if (!subdocumentNeedsRefresh) {
          continue;
        }

        const texto = buildEmbeddingSourceText(
          [ley.nombre, ley.descripcion, articulo.titulo, articulo.numero, articulo.libro, articulo.capitulo, articulo.seccion, articulo.contenido, ley.codigo],
          1500
        );

        if (!texto || texto.length < 30) {
          continue;
        }

        const embedding = await createEmbedding(texto);
        if (!embedding) {
          continue;
        }

        articulo.embedding = embedding;
        articulo.embeddingHash = sourceHash;
        articulo.embeddingUpdatedAt = new Date();
        changed = true;
        subdocuments += 1;
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      if (changed) {
        await ley.save();
        processed += 1;
      }
    }
  }

  return { processed, subdocuments };
}

export async function refreshLegalEmbeddings(): Promise<LegalEmbeddingRefreshResult> {
  if (!openai) {
    return {
      normas: 0,
      articulos: 0,
      articles: 0,
      leySubdocuments: 0,
      total: 0,
    };
  }

  await dbConnect();

  const normas = await processNormas();
  const articulos = await processArticulos();
  const articles = await processArticles();
  const leyResult = await processLeyes();

  return {
    normas,
    articulos,
    articles,
    leySubdocuments: leyResult.subdocuments,
    total: normas + articulos + articles + leyResult.subdocuments,
  };
}
