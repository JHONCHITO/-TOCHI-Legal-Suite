import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import Client from "@/lib/models/Client";
import Document from "@/lib/models/Document";
import User from "@/lib/models/User";
import { createNotificationForUsers } from "@/lib/services/automation";
import type { DocumentType } from "@/lib/models/Document";

export const runtime = "nodejs";

const ALLOWED_DOCUMENT_TYPES = new Set([
  "demanda",
  "contestacion",
  "tutela",
  "derecho_peticion",
  "contrato",
  "poder",
  "memorial",
  "recurso",
  "concepto",
  "acta",
  "otro",
]);

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
  clienteId?: unknown;
  abogadoPrincipal?: unknown;
  abogadosAsociados?: unknown[];
  numeroInterno?: string;
  titulo?: string;
};

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDocumentType(value: FormDataEntryValue | null): DocumentType {
  const type = typeof value === "string" ? value.trim() : "";
  return (ALLOWED_DOCUMENT_TYPES.has(type) ? type : "otro") as DocumentType;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await dbConnect();

    const userRole = await getUserRole(session.user.id);
    const formData = await request.formData();
    const file = formData.get("file");
    const caseId = getStringFormValue(formData, "casoId");
    const requestedClientId = getStringFormValue(formData, "clienteId");
    const nombre = getStringFormValue(formData, "nombre");
    const descripcion = getStringFormValue(formData, "descripcion");
    const tipo = normalizeDocumentType(formData.get("tipo"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes adjuntar un archivo" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "El archivo no puede estar vacio" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera el limite de 10 MB" }, { status: 400 });
    }

    const clientRecord =
      userRole === "cliente"
        ? await Client.findOne({ email: session.user.email }).select("_id tipo nombre apellido razonSocial cedula nit abogadoAsignado").lean()
        : requestedClientId
          ? await Client.findById(requestedClientId).select("_id tipo nombre apellido razonSocial cedula nit abogadoAsignado").lean()
          : null;

    if (!clientRecord) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const linkedCase = caseId
      ? await Case.findById(caseId).select("_id clienteId abogadoPrincipal abogadosAsociados numeroInterno titulo").lean()
      : null;
    if (caseId && !linkedCase) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    if (userRole === "cliente" && linkedCase && String(linkedCase.clienteId) !== String(clientRecord._id)) {
      return NextResponse.json({ error: "No puedes subir archivos a un caso que no es tuyo" }, { status: 403 });
    }

    const clientId = String((clientRecord as PortalClientRecord)._id);
    const linkedCaseId = linkedCase ? String((linkedCase as PortalCaseRecord)._id) : null;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type || "application/octet-stream";
    const fileUrl = `data:${fileType};base64,${fileBuffer.toString("base64")}`;
    const documentName = nombre || file.name || "Archivo del portal";

    const newDocument = (await Document.create({
      nombre: documentName,
      tipo,
      estado: "revision",
      descripcion: descripcion || `Archivo cargado desde el portal cliente: ${file.name}`,
      clienteId: clientId,
      casoId: linkedCaseId || (caseId || undefined),
      archivoUrl: fileUrl,
      archivoNombre: file.name,
      archivoTipo: fileType,
      archivoTamano: file.size,
      requiereAprobacion: true,
      portalCompartido: true,
      creadorId: session.user.id,
      etiquetas: ["portal", "cliente", "archivo"],
      version: 1,
    })) as { _id: unknown; nombre: string };

    if (linkedCaseId) {
      await Case.findByIdAndUpdate(linkedCaseId, {
        $addToSet: { documentos: newDocument._id },
      });
    }

    const recipients = linkedCase
      ? Array.from(
          new Set(
            [linkedCase.abogadoPrincipal, ...(linkedCase.abogadosAsociados || [])]
              .filter(Boolean)
              .map((value) => String(value))
          )
        )
      : (clientRecord as PortalClientRecord).abogadoAsignado
        ? [String((clientRecord as PortalClientRecord).abogadoAsignado)]
        : [];

    if (recipients.length) {
      await createNotificationForUsers({
        userIds: recipients,
        tipo: "documento_nuevo",
        prioridad: "media",
        titulo: `Nuevo archivo subido: ${documentName}`,
        mensaje: linkedCase
          ? `El cliente subio un archivo para el expediente ${(linkedCase as PortalCaseRecord).numeroInterno || (linkedCase as PortalCaseRecord).titulo}.`
          : "El cliente subio un archivo desde el portal.",
        enlace: linkedCaseId ? `/dashboard/casos/${linkedCaseId}` : "/dashboard/portal",
        casoId: linkedCaseId || undefined,
        documentoId: newDocument._id,
      });
    }

    const populatedDocument = await Document.findById(newDocument._id)
      .populate("clienteId", "nombre apellido razonSocial tipo email")
      .populate("casoId", "titulo numeroInterno")
      .lean();

    return NextResponse.json(populatedDocument, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Error al cargar documento" }, { status: 500 });
  }
}
