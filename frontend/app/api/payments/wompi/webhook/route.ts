import { NextResponse } from "next/server";
import { buildWompiEventChecksum } from "@/lib/wompi";
import { syncWompiPaymentByReference } from "@/lib/subscription";

type WompiEventPayload = {
  event?: string;
  data?: {
    transaction?: {
      id?: string;
      reference?: string;
      status?: string;
      payment_method_type?: string;
      failureReason?: { message?: string } | null;
      amountInCents?: number;
      currency?: string;
    };
  };
  signature?: {
    properties?: string[];
    checksum?: string;
  };
  timestamp?: number;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WompiEventPayload;
    const headerChecksum = request.headers.get("X-Event-Checksum") || "";
    const bodyChecksum = payload.signature?.checksum || "";
    const expectedChecksum = buildWompiEventChecksum(payload);

    if (expectedChecksum !== headerChecksum && expectedChecksum !== bodyChecksum) {
      return NextResponse.json({ error: "Firma de evento invalida" }, { status: 401 });
    }

    if (payload.event !== "transaction.updated") {
      return NextResponse.json({ ok: true });
    }

    const transaction = payload.data?.transaction;
    const reference = transaction?.reference?.trim();

    if (!reference) {
      return NextResponse.json({ error: "La transaccion no trae referencia" }, { status: 400 });
    }

    await syncWompiPaymentByReference(reference, {
      id: transaction?.id,
      status: transaction?.status,
      payment_method_type: transaction?.payment_method_type,
      failureReason: transaction?.failureReason || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando webhook de Wompi:", error);
    return NextResponse.json({ error: "No se pudo procesar el webhook" }, { status: 500 });
  }
}

