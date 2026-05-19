import { NextResponse } from "next/server";
import { LEGAL_CODE_LIBRARY, toLegalSlug } from "@/lib/legal-library";
import connectDB from "@/lib/mongodb";
import Article from "@/lib/models/Article";
import Articulo from "@/lib/models/Articulo";
import Ley from "@/lib/models/Ley";
import Norma from "@/lib/models/Norma";
import { detectCode, extractArticleNumber, findExactLegalArticle } from "@/lib/services/legal-catalog";
import { searchSemanticLegalContent } from "@/lib/services/legal-vector-search";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function snippet(value: unknown, length = 160) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
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

  const exactArticle = await findExactLegalArticle(q);
  if (exactArticle) {
    if (matchesFocus(exactArticle)) {
      addResult({
        tipo: "exacto",
        codigo: exactArticle.codigo,
        articulo: exactArticle.articulo,
        titulo: exactArticle.titulo,
        resumen: snippet(exactArticle.contenido, 240),
        enlace: exactArticle.url,
      });
    }
  }

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

    const semanticResults = await searchSemanticLegalContent(q, 8);
    semanticResults.forEach((item) => {
      if (matchesFocus(item)) {
        addResult({
          tipo: item.tipo,
          source: item.source,
          codigo: item.codigo,
          articulo: item.articulo,
          titulo: item.titulo,
          resumen: item.resumen,
          enlace: item.enlace,
          score: item.score,
        });
      }
    });

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

    const articlesDB = await Article.find({
      $or: [
        { codigoRef: regex },
        { numero: regex },
        { epigrafe: regex },
        { titulo: regex },
        { contenido: regex },
        { libro: regex },
        { capitulo: regex },
        { seccion: regex },
      ],
    })
      .limit(60)
      .lean();

    articlesDB.forEach((article: any) => {
      if (matchesFocus({ codigo: article.codigoRef, articulo: article.numero })) {
        addResult({
          tipo: "article",
          codigo: article.codigoRef,
          articulo: article.numero,
          titulo: article.epigrafe || article.titulo || "",
          resumen: snippet(article.contenido, 180),
          enlace: `/dashboard/leyes/${toLegalSlug(article.codigoRef)}`,
        });
      }
    });
  } catch (error) {
    console.log("Mongo no conectado aun");
  }

  return NextResponse.json(resultados);
}
