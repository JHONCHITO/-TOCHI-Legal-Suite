import { NextResponse } from "next/server";

import { refreshLegalCorpus } from "@/lib/services/legal-refresh";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorizedCronRequest(request: Request) {
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const url = new URL(request.url);
  const providedSecret = url.searchParams.get("secret") || request.headers.get("x-cron-secret") || "";
  return providedSecret === secret;
}

async function runRefresh() {
  const result = await refreshLegalCorpus();

  return {
    success: true,
    message: `Refresco legal completado: ${result.catalog.codesUpserted} codigos, ${result.catalog.articlesUpserted} articulos, ${result.legacyLey.leyesUpserted} leyes, ${result.legacyLey.leyArticlesUpserted} articulos de ley y ${result.embeddings.total} embeddings`,
    catalog: result.catalog,
    legacyLey: result.legacyLey,
    embeddings: result.embeddings,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await runRefresh();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error en cron de refresco legal:", error);
    return NextResponse.json(
      { error: "Error al ejecutar el refresco legal", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
