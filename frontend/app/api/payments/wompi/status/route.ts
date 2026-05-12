import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subscription from "@/lib/models/Subscription";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const reference = url.searchParams.get("reference")?.trim();

    if (!reference) {
      return NextResponse.json({ error: "Falta la referencia del pago" }, { status: 400 });
    }

    await dbConnect();
    const subscription = await Subscription.findOne({ paymentReference: reference }).lean();

    if (!subscription) {
      return NextResponse.json({ error: "No se encontro la suscripcion" }, { status: 404 });
    }

    return NextResponse.json({
      reference,
      planId: subscription.planId,
      subscriptionStatus: subscription.status,
      paymentStatus: subscription.paymentStatus || "pending",
      paymentMethodPreference: subscription.paymentMethodPreference || null,
      paymentTransactionId: subscription.paymentTransactionId || null,
      isActive: subscription.status === "active" && subscription.paymentStatus === "approved",
    });
  } catch (error) {
    console.error("Error consultando el estado del pago:", error);
    return NextResponse.json({ error: "No se pudo consultar el estado del pago" }, { status: 500 });
  }
}

