import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import { ensureClientProfileForSession } from "@/lib/services/client-profile";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select("rol").lean();
    if ((user as { rol?: string } | null)?.rol !== "cliente") {
      return NextResponse.json({ error: "Acceso restringido a clientes" }, { status: 403 });
    }

    const client = await ensureClientProfileForSession({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    if (!client) {
      return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 });
    }

    const hydratedClient = await Client.findById((client as { _id: unknown })._id)
      .populate("casos", "titulo estado numeroInterno fechaProximaActuacion")
      .lean();

    return NextResponse.json(hydratedClient);
  } catch (error) {
    console.error("Error fetching current client:", error);
    return NextResponse.json({ error: "Error al obtener el cliente" }, { status: 500 });
  }
}
