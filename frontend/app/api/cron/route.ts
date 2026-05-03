import { NextResponse } from "next/server";
import { syncAllAutomations } from "@/lib/services/automation";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    return true;
  }

  const { searchParams } = new URL(request.url);
  const received = request.headers.get("x-cron-secret") || searchParams.get("secret") || "";
  return received === expected;
}

async function handleCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const result = await syncAllAutomations(origin);

  return NextResponse.json({
    ok: true,
    ...result,
  });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
