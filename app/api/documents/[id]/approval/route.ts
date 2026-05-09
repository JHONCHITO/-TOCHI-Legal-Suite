import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import Client from "@/lib/models/Client";
import Document from "@/lib/models/Document";
import User from "@/lib/models/User";
import { createNotificationForUsers } from "@/lib/services/automation";

export const runtime = "nodejs";

async function getUserRole(userId: string) {
  const user = await User.findById(userId).select("rol").lean();
  return (user as { rol?: string } | null)?.rol || "abogado";
}

type PortalClientRecord = {
  _id: unknown;
  tipo?: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  cedula?: string;
  nit?: string;
  abogadoAsignado?: unknown;
};

type PortalCaseRecord = {
  _id: unknown;
  numeroInterno?: string;
  titulo?: string;
  abogadoPrincipal?: unknown;
  abogadosAsociados?: unknown[];
};

async function getClientRecord(email?: string | null): Promise<PortalClientRecord | null> {
  if (!email) return null;
  return Client.findOne({ email }).select("_id tipo nombre apellido razonSocial cedula nit abogadoAsignado").lean();
}

function getClientDisplayName(client: {
  tipo?: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
}) {
  if (client.tipo === "persona_juridica") {
    return client.razonSocial || "Cliente juridico";
  }

  return [client.nombre, client.apellido].filter(Boolean).join(" ").trim() || "Cliente";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await dbConnect();

    const userRole = await getUserRole(session.user.id);
    if (userRole !== "cliente") {
      return NextResponse.json({ error: "Solo el portal del cliente puede aprobar documentos" }, { status: 403 });
    }

    const clientRecord = await getClientRecord(session.user.email);
    if (!clientRecord) {
      return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 });
    }
    const clientId = String(clientRecord._id);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const firmaNombre =
      typeof body?.firmaNombre === "string" && body.firmaNombre.trim()
        ? body.firmaNombre.trim()
        : getClientDisplayName(clientRecord as { tipo?: string; nombre?: string; apellido?: string; razonSocial?: string });

    const document = await Document.findOne({
      _id: id,
      clienteId: clientId,
      portalCompartido: true,
    }).populate("casoId", "titulo numeroInterno abogadoPrincipal abogadosAsociados").lean();

    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    const updatedDocument = await Document.findOneAndUpdate(
      { _id: id, clienteId: clientId, portalCompartido: true },
      {
        $set: {
          estado: "aprobado",
          requiereAprobacion: false,
          aprobadoPorClienteId: clientId,
          aprobadoPorClienteAt: new Date(),
          fechaAprobacion: new Date(),
          firmaClienteNombre: firmaNombre,
          firmaClienteDocumento:
            clientRecord.razonSocial || clientRecord.nit || clientRecord.cedula || "",
          firmaClienteTexto: firmaNombre,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("clienteId", "nombre apellido razonSocial tipo email")
      .populate("casoId", "titulo numeroInterno")
      .lean();

    if (!updatedDocument) {
      return NextResponse.json({ error: "No se pudo aprobar el documento" }, { status: 500 });
    }

    const documentCase = (document as { casoId?: { _id?: unknown } | unknown }).casoId;
    const caseId =
      typeof documentCase === "object" && documentCase && "_id" in documentCase
        ? String((documentCase as { _id?: unknown })._id || "")
        : documentCase;

    const caseRecord: PortalCaseRecord | null = caseId
      ? ((await Case.findById(String(caseId))
          .select("titulo numeroInterno abogadoPrincipal abogadosAsociados")
          .lean()) as PortalCaseRecord)
      : null;

    const recipients = caseRecord
      ? Array.from(
          new Set(
            [caseRecord.abogadoPrincipal, ...(caseRecord.abogadosAsociados || [])]
              .filter(Boolean)
              .map((value) => String(value))
          )
        )
      : clientRecord.abogadoAsignado
        ? [String(clientRecord.abogadoAsignado)]
        : [];

    if (recipients.length) {
      await createNotificationForUsers({
        userIds: recipients,
        tipo: "caso_actualizado",
        prioridad: "media",
        titulo: `Documento aprobado por el cliente: ${updatedDocument.nombre}`,
        mensaje: caseRecord
          ? `El cliente aprobo el documento ${updatedDocument.nombre} del expediente ${caseRecord.numeroInterno || caseRecord.titulo}.`
          : `El cliente aprobo el documento ${updatedDocument.nombre}.`,
        enlace: caseRecord ? `/dashboard/casos/${String(caseRecord._id)}` : "/dashboard/documentos",
        casoId: caseRecord?._id || undefined,
        documentoId: updatedDocument._id,
      });
    }

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error approving document:", error);
    return NextResponse.json({ error: "Error al aprobar documento" }, { status: 500 });
  }
}
