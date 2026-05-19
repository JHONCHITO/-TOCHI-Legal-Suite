import { NextResponse } from "next/server";
import { LEGAL_CODE_LIBRARY, toLegalSlug } from "@/lib/legal-library";
import connectDB from "@/lib/mongodb";
import Articulo from "@/lib/models/Articulo";
import Ley from "@/lib/models/Ley";
import Norma from "@/lib/models/Norma";
import { CODIGOS_COLOMBIANOS } from "@/lib/types";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function snippet(value: unknown, length = 160) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function detectCode(question: string) {
  const normalized = normalizeText(question);
  let bestMatch: (typeof CODIGOS_COLOMBIANOS)[number] | null = null;
  let bestScore = 0;

  for (const code of CODIGOS_COLOMBIANOS) {
    const aliases = [code.codigo, code.nombre, code.nombreCorto, code.numeroNorma, ...code.areasDelDerecho]
      .map(normalizeText)
      .filter(Boolean);

    let score = 0;
    for (const alias of aliases) {
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

function extractArticleNumber(question: string) {
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const focusCode = detectCode(q);
  const articleNumber = extractArticleNumber(q);
  const normalizedFocusCode = focusCode ? String(focusCode.codigo).trim().toLowerCase() : "";
  const normalizedFocusArticle = articleNumber ? String(articleNumber).trim().toLowerCase() : "";

  if (!q) {
    return NextResponse.json([]);
  }

  const resultados: any[] = [];
  const seen = new Set<string>();
  const palabras = q
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(escapeRegExp);
  const regex = new RegExp(palabras.join("|"), "i");

  const addResult = (item: any) => {
    const key = [item.tipo || item.source || "resultado", item.codigo || "", item.articulo || "", item.titulo || ""]
      .join("|")
      .toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    resultados.push(item);
  };

  const matchesFocus = (item: any) => {
    if (!normalizedFocusCode) {
      return true;
    }

    const itemCode = String(item.codigo || item.codigoRef || "").trim().toLowerCase();
    if (!itemCode || itemCode !== normalizedFocusCode) {
      return false;
    }

    if (!normalizedFocusArticle) {
      return true;
    }

    const itemArticle = String(item.articulo || item.numeroArticulo || item.numero || "").trim().toLowerCase();
    return itemArticle === normalizedFocusArticle;
  };

  Object.values(LEGAL_CODE_LIBRARY).forEach((codigo: any) => {
    if (!matchesFocus({ codigo: codigo.codigo })) {
      return;
    }

    codigo.articulos.forEach((art: any) => {
      if (
        regex.test(String(art.numero || "")) ||
        regex.test(String(art.epigrafe || "")) ||
        regex.test(String(art.resumen || "")) ||
        regex.test(String(codigo.nombre || "")) ||
        regex.test(String(codigo.codigo || "")) ||
        regex.test(String(codigo.descripcion || ""))
      ) {
        if (matchesFocus({ codigo: codigo.codigo, articulo: art.numero })) {
          addResult({
            tipo: "local",
            codigo: codigo.codigo,
            articulo: art.numero,
            titulo: art.epigrafe,
            resumen: snippet(art.resumen, 180),
            enlace: `/dashboard/leyes/${toLegalSlug(codigo.codigo)}`,
          });
        }
      }
    });
  });

  try {
    await connectDB();

    const leyesDB = await Ley.find({
      $or: [
        { codigo: regex },
        { nombre: regex },
        { descripcion: regex },
        { "articulos.numero": regex },
        { "articulos.titulo": regex },
        { "articulos.contenido": regex },
      ],
    })
      .limit(20)
      .lean();

    leyesDB.forEach((ley: any) => {
      if (!matchesFocus({ codigo: ley.codigo })) {
        return;
      }

      if (
        regex.test(String(ley.codigo || "")) ||
        regex.test(String(ley.nombre || "")) ||
        regex.test(String(ley.descripcion || ""))
      ) {
        addResult({
          tipo: "ley",
          codigo: ley.codigo,
          titulo: ley.nombre,
          resumen: snippet(ley.descripcion || ley.nombre, 180),
          enlace: `/dashboard/leyes/${toLegalSlug(ley.codigo)}`,
        });
      }

      ley.articulos?.forEach((art: any) => {
        if (
          regex.test(String(art.numero || "")) ||
          regex.test(String(art.titulo || "")) ||
          regex.test(String(art.contenido || "")) ||
          regex.test(String(ley.codigo || "")) ||
          regex.test(String(ley.nombre || "")) ||
          regex.test(String(ley.descripcion || ""))
        ) {
          if (matchesFocus({ codigo: ley.codigo, articulo: art.numero })) {
            addResult({
              tipo: "db",
              codigo: ley.codigo,
              articulo: art.numero,
              titulo: art.titulo,
              resumen: snippet(art.contenido, 180),
              enlace: `/dashboard/leyes/${toLegalSlug(ley.codigo)}`,
            });
          }
        }
      });
    });

    const normasDB = await Norma.find({
      $or: [
        { codigo: regex },
        { nombre: regex },
        { articulo: regex },
        { titulo: regex },
        { contenido: regex },
      ],
    })
      .limit(50)
      .lean();

    normasDB.forEach((norma: any) => {
      if (matchesFocus({ codigo: norma.codigo, articulo: norma.articulo })) {
        addResult({
          tipo: "norma",
          codigo: norma.codigo,
          articulo: norma.articulo,
          titulo: norma.titulo || norma.nombre || "",
          resumen: snippet(norma.contenido, 180),
          enlace: `/dashboard/leyes/${toLegalSlug(norma.codigo)}`,
        });
      }
    });

    const articulosDB = await Articulo.find({
      $or: [
        { codigoRef: regex },
        { numeroArticulo: regex },
        { tituloArticulo: regex },
        { contenido: regex },
        { libro: regex },
        { titulo: regex },
        { capitulo: regex },
      ],
    })
      .limit(60)
      .lean();

    articulosDB.forEach((articulo: any) => {
      if (matchesFocus({ codigo: articulo.codigoRef, articulo: articulo.numeroArticulo })) {
        addResult({
          tipo: "articulo",
          codigo: articulo.codigoRef,
          articulo: articulo.numeroArticulo,
          titulo: articulo.tituloArticulo || articulo.titulo || "",
          resumen: snippet(articulo.contenido, 180),
          enlace: `/dashboard/leyes/${toLegalSlug(articulo.codigoRef)}`,
        });
      }
    });
  } catch (error) {
    console.log("Mongo no conectado aun");
  }

  return NextResponse.json(resultados);
}
