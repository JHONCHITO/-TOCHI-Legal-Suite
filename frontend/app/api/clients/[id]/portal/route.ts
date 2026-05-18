import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import Case from "@/lib/models/Case";
import Document from "@/lib/models/Document";
import Invoice from "@/lib/models/Invoice";
import Appointment from "@/lib/models/Appointment";
import Communication from "@/lib/models/Communication";
import { notifyClientByClientId } from "@/lib/services/client-notifications";

type SessionLike = {
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
};

function normalizeEmail(email?: string | null) {
  return String(email || "").toLowerCase().trim();
}

async function canManageClient(session: SessionLike, clientId: string) {
  if (!session.user?.id) {
    return false;
  }

  const user = await User.findById(session.user.id).select("rol").lean();
  const userRole = (user as { rol?: string } | null)?.rol || "abogado";

  if (userRole === "superadmin" || userRole === "admin") {
    return true;
  }

  const client = await Client.findById(clientId).select("abogadoAsignado").lean();
  if (!client) {
    return false;
  }

  return String((client as { abogadoAsignado?: unknown }).abogadoAsignado || "") === String(session.user.id);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth()) as SessionLike;
    if (!session.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const allowed = await canManageClient(session, id);
    if (!allowed) {
      return NextResponse.json({ error: "No tienes permisos para sincronizar este cliente" }, { status: 403 });
    }

    const client = await Client.findById(id).lean();
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const normalizedEmail = normalizeEmail((client as { email?: string }).email);
    const linkedUser =
      (client as { userId?: unknown }).userId
        ? await User.findById((client as { userId?: unknown }).userId)
            .select("_id email nombre apellido rol activo")
            .lean()
        : null;

    const portalUser =
      linkedUser ||
      (normalizedEmail
        ? await User.findOne({
            email: normalizedEmail,
            rol: "cliente",
          })
            .select("_id email nombre apellido rol activo")
            .lean()
        : null);

    if (!portalUser) {
      return NextResponse.json(
        {
          error:
            "No existe una cuenta de cliente vinculada a este correo. Crea o corrige la cuenta del portal antes de sincronizar.",
        },
        { status: 404 }
      );
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        $set: {
          userId: (portalUser as { _id: unknown })._id,
          tieneAccesoPortal: true,
          portalUltimaSincronizacion: new Date(),
        },
      },
      { new: true, runValidators: true }
    )
      .populate("userId", "nombre apellido email rol activo")
      .populate("casos", "titulo estado numeroInterno fechaProximaActuacion")
      .lean();

    if (!updatedClient) {
      return NextResponse.json({ error: "No se pudo actualizar el cliente" }, { status: 500 });
    }

    const [casesCount, documentsCount, invoicesCount, appointmentsCount, communicationsCount] = await Promise.all([
      Case.countDocuments({ clienteId: id }),
      Document.countDocuments({ clienteId: id }),
      Invoice.countDocuments({ clienteId: id }),
      Appointment.countDocuments({ clienteId: id }),
      Communication.countDocuments({ clienteId: id }),
    ]);

    await notifyClientByClientId({
      clientId: id,
      tipo: "sistema",
      prioridad: "media",
      titulo: "Portal actualizado por tu abogado",
      mensaje: `Tu abogado sincronizó tu portal. Ahora puedes revisar ${casesCount} casos, ${documentsCount} documentos, ${appointmentsCount} citas, ${invoicesCount} facturas y ${communicationsCount} comunicaciones.`,
      enlace: "/portal",
    });

    return NextResponse.json({
      client: updatedClient,
      counts: {
        cases: casesCount,
        documents: documentsCount,
        invoices: invoicesCount,
        appointments: appointmentsCount,
        communications: communicationsCount,
      },
      message: "Portal del cliente sincronizado correctamente",
    });
  } catch (error) {
    console.error("Error syncing client portal:", error);
    return NextResponse.json({ error: "No se pudo sincronizar el portal del cliente" }, { status: 500 });
  }
}
