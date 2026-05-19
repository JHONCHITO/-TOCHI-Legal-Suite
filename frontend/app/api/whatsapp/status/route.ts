import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getWhatsAppStatus } from "@/lib/services/whatsapp";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const status = await getWhatsAppStatus();
  return NextResponse.json(status);
}
