import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
import Document from "@/lib/models/Document"
import User from "@/lib/models/User"
import { ensureClientProfileForSession } from "@/lib/services/client-profile"
import { createNotificationForUsers } from "@/lib/services/automation"

export const runtime = "nodejs"

function parseMaybeString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findById(session.user.id).select("rol nombre apellido email").lean()
    if ((user as { rol?: string } | null)?.rol !== "cliente") {
      return NextResponse.json({ error: "Solo los clientes pueden subir archivos al portal" }, { status: 403 })
    }

    const clientRecord = await ensureClientProfileForSession({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    })

    if (!clientRecord) {
      return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 })
    }

    const clientId = String((clientRecord as { _id: unknown })._id)

    const formData = await request.formData()
    const fileEntry = formData.get("file")
    const nombre = parseMaybeString(formData.get("nombre"))
    const tipo = parseMaybeString(formData.get("tipo")) || "otro"
    const descripcion = parseMaybeString(formData.get("descripcion"))
    const casoId = parseMaybeString(formData.get("casoId"))

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "Debes seleccionar un archivo" }, { status: 400 })
    }

    if (!nombre) {
      return NextResponse.json({ error: "El nombre del archivo es requerido" }, { status: 400 })
    }

    if (fileEntry.size <= 0) {
      return NextResponse.json({ error: "El archivo no puede estar vacío" }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024
    if (fileEntry.size > maxSize) {
      return NextResponse.json({ error: "El archivo supera el tamaño máximo de 10 MB" }, { status: 400 })
    }

    if (casoId) {
      const clientCase = await Case.findOne({
        _id: casoId,
        clienteId: clientId,
      })
        .select("_id titulo numeroInterno abogadoPrincipal abogadosAsociados")
        .lean()

      if (!clientCase) {
        return NextResponse.json({ error: "El caso seleccionado no pertenece a tu perfil" }, { status: 403 })
      }
    }

    const buffer = Buffer.from(await fileEntry.arrayBuffer())
    const mimeType = fileEntry.type || "application/octet-stream"
    const archivoUrl = `data:${mimeType};base64,${buffer.toString("base64")}`

    const document = (await Document.create({
      nombre,
      tipo,
      estado: "revision",
      descripcion,
      clienteId: clientId,
      casoId: casoId || undefined,
      archivoUrl,
      archivoNombre: fileEntry.name,
      archivoTipo: mimeType,
      archivoTamano: fileEntry.size,
      creadorId: session.user.id,
      version: 1,
      portalCompartido: false,
      requiereAprobacion: false,
      etiquetas: ["portal-cliente"],
    })) as { _id: unknown }

    const populatedDocument = (await Document.findById(document._id)
      .populate("clienteId", "nombre apellido razonSocial tipo email")
      .populate("casoId", "titulo numeroInterno abogadoPrincipal abogadosAsociados")
      .lean()) as any

    const linkedCase = casoId
      ? ((await Case.findById(casoId)
          .select("titulo numeroInterno abogadoPrincipal abogadosAsociados")
          .lean()) as any)
      : null

    const recipients = linkedCase
      ? Array.from(
          new Set(
            [linkedCase.abogadoPrincipal, ...(linkedCase.abogadosAsociados || [])]
              .filter(Boolean)
              .map((value) => String(value))
          )
        )
      : clientRecord.abogadoAsignado
        ? [String(clientRecord.abogadoAsignado)]
        : []

    if (recipients.length) {
      await createNotificationForUsers({
        userIds: recipients,
        tipo: "documento_nuevo",
        prioridad: "media",
        titulo: `Nuevo archivo enviado por el cliente: ${nombre}`,
        mensaje: linkedCase
          ? `El cliente subió ${nombre} al expediente ${linkedCase.numeroInterno || linkedCase.titulo}.`
          : `El cliente subió ${nombre} a su portal.`,
        enlace: linkedCase ? "/dashboard/documentos" : "/dashboard/documentos",
        casoId: casoId || undefined,
        documentoId: document._id,
      })
    }

    return NextResponse.json(populatedDocument, { status: 201 })
  } catch (error) {
    console.error("Error uploading client document:", error)
    return NextResponse.json({ error: "No se pudo cargar el archivo" }, { status: 500 })
  }
}
