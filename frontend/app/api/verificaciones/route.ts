import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Client from "@/lib/models/Client"
import Case from "@/lib/models/Case"
import Document from "@/lib/models/Document"
import User from "@/lib/models/User"
import Verification, { type VerificationState, type VerificationType } from "@/lib/models/Verification"

export const runtime = "nodejs"

type VerificationPayload = {
  tipoDocumento?: VerificationType
  numeroDocumento?: string
}

type VerificationResult = {
  tipo: VerificationType
  numero: string
  estado: VerificationState
  mensaje: string
  fuente: string
  detalles?: Record<string, string>
}

type RecentVerification = {
  _id: string
  tipoDocumento: VerificationType
  numeroDocumento: string
  estado: VerificationState
  mensaje: string
  fuente: string
  createdAt: string
}

const NIT_WEIGHTS = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3]

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "")
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function isValidCcedula(value: string) {
  const digits = normalizeDigits(value)
  return /^\d{6,10}$/.test(digits)
}

function calculateNitDv(value: string) {
  const digits = normalizeDigits(value)
  const base = digits.slice(0, -1)
  let sum = 0
  const reversed = base.split("").reverse()
  for (let index = 0; index < reversed.length && index < NIT_WEIGHTS.length; index += 1) {
    sum += Number(reversed[index] || 0) * NIT_WEIGHTS[index]
  }
  const remainder = sum % 11
  const dv = remainder > 1 ? 11 - remainder : remainder
  return dv
}

function isValidNit(value: string) {
  const digits = normalizeDigits(value)
  if (digits.length < 8) {
    return false
  }

  if (digits.length > 8) {
    const providedDv = Number(digits.slice(-1))
    const calculatedDv = calculateNitDv(digits)
    return providedDv === calculatedDv
  }

  return true
}

function isValidTarjeta(value: string) {
  const digits = normalizeDigits(value)
  return /^\d{4,10}$/.test(digits)
}

function isValidRadicado(value: string) {
  const digits = normalizeDigits(value)
  return /^\d{23}$/.test(digits)
}

function isPlausibleReference(value: string) {
  return /^[A-Z0-9\-\/]{4,}$/i.test(value.trim())
}

function buildRecent(record: Record<string, any>): RecentVerification {
  return {
    _id: String(record._id),
    tipoDocumento: record.tipoDocumento as VerificationType,
    numeroDocumento: String(record.numeroDocumento || ""),
    estado: record.estado as VerificationState,
    mensaje: String(record.mensaje || ""),
    fuente: String(record.fuente || ""),
    createdAt: new Date(record.createdAt).toISOString(),
  }
}

async function getRecentVerifications(userId: string): Promise<RecentVerification[]> {
  const recent = await Verification.find({ userId }).sort({ createdAt: -1 }).limit(8).lean()
  return recent.map(buildRecent)
}

async function verifyByType(tipoDocumento: VerificationType, numeroDocumento: string) {
  const fuenteBase = "Base interna TOCHI y fuentes oficiales"

  if (tipoDocumento === "cedula") {
    const normalized = normalizeDigits(numeroDocumento)
    if (!isValidCcedula(normalized)) {
      return {
        estado: "invalido" as const,
        mensaje: "La cedula no tiene un formato valido.",
        fuente: fuenteBase,
        detalles: { formato: "Se esperan entre 6 y 10 digitos", numero: normalized },
      }
    }

    const client = await Client.findOne({ cedula: normalized })
      .select("nombre apellido razonSocial tipo email")
      .lean()

    if (!client) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "La cedula tiene formato valido, pero no aparece en la base interna.",
        fuente: fuenteBase,
        detalles: { formato: normalized, estado: "No encontrado" },
      }
    }

    return {
      estado: "valido" as const,
      mensaje: "La cedula coincide con un cliente registrado.",
      fuente: fuenteBase,
      detalles: {
        cliente: client.tipo === "persona_juridica" ? String(client.razonSocial || "") : `${client.nombre || ""} ${client.apellido || ""}`.trim(),
        correo: String(client.email || ""),
      },
    }
  }

  if (tipoDocumento === "nit") {
    const normalized = normalizeDigits(numeroDocumento)
    if (!isValidNit(numeroDocumento)) {
      return {
        estado: "invalido" as const,
        mensaje: "El NIT no supera la validacion basica del digito de verificacion.",
        fuente: fuenteBase,
        detalles: { numero: normalized },
      }
    }

    const client = await Client.findOne({ nit: normalized })
      .select("razonSocial nombre apellido tipo email")
      .lean()

    if (!client) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "El NIT es formalmente valido, pero no aparece en la base interna.",
        fuente: fuenteBase,
        detalles: { numero: normalized, estado: "No encontrado" },
      }
    }

    return {
      estado: "valido" as const,
      mensaje: "El NIT coincide con un cliente juridico registrado.",
      fuente: fuenteBase,
      detalles: {
        cliente: String(client.razonSocial || ""),
        correo: String(client.email || ""),
      },
    }
  }

  if (tipoDocumento === "tarjeta_profesional") {
    const normalized = normalizeDigits(numeroDocumento)
    if (!isValidTarjeta(normalized)) {
      return {
        estado: "invalido" as const,
        mensaje: "La tarjeta profesional no tiene un formato valido.",
        fuente: fuenteBase,
        detalles: { numero: normalized },
      }
    }

    const user = await User.findOne({ tarjetaProfesional: normalized })
      .select("nombre apellido email rol activo")
      .lean()

    if (!user) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "La tarjeta profesional parece correcta, pero no aparece en la base interna.",
        fuente: fuenteBase,
        detalles: { numero: normalized, estado: "No encontrado" },
      }
    }

    return {
      estado: "valido" as const,
      mensaje: "La tarjeta profesional coincide con un usuario de la firma.",
      fuente: fuenteBase,
      detalles: {
        abogado: `${user.nombre || ""} ${user.apellido || ""}`.trim(),
        correo: String(user.email || ""),
        rol: String(user.rol || ""),
      },
    }
  }

  if (tipoDocumento === "radicado") {
    const normalized = normalizeDigits(numeroDocumento)
    if (!isValidRadicado(normalized)) {
      return {
        estado: "invalido" as const,
        mensaje: "El radicado no cumple el formato de 23 digitos.",
        fuente: fuenteBase,
        detalles: { numero: normalized },
      }
    }

    const caseRecord = await Case.findOne({
      $or: [
        { numeroRadicado: normalized },
        { numeroProceso: normalized },
        { numeroInterno: numeroDocumento.trim() },
      ],
    })
      .populate("clienteId", "nombre apellido razonSocial tipo")
      .lean()

    if (!caseRecord) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "El radicado es formalmente valido, pero no aparece en la base interna.",
        fuente: fuenteBase,
        detalles: { numero: normalized, estado: "No encontrado" },
      }
    }

    return {
      estado: "valido" as const,
      mensaje: "El radicado coincide con un expediente interno.",
      fuente: fuenteBase,
      detalles: {
        expediente: String(caseRecord.numeroInterno || ""),
        titulo: String(caseRecord.titulo || ""),
      },
    }
  }

  const rawValue = numeroDocumento.trim()
  const search = escapeRegex(rawValue)

  if (tipoDocumento === "poder") {
    if (!isPlausibleReference(rawValue)) {
      return {
        estado: "invalido" as const,
        mensaje: "El identificador no tiene un formato util para verificacion de poder.",
        fuente: fuenteBase,
      }
    }

    const documentRecord = await Document.findOne({
      tipo: "poder",
      $or: [
        { nombre: { $regex: search, $options: "i" } },
        { descripcion: { $regex: search, $options: "i" } },
        { archivoNombre: { $regex: search, $options: "i" } },
        { contenido: { $regex: search, $options: "i" } },
        { firmaClienteDocumento: { $regex: search, $options: "i" } },
      ],
    })
      .populate("clienteId", "nombre apellido razonSocial tipo email")
      .populate("casoId", "titulo numeroInterno numeroRadicado")
      .lean()

    if (!documentRecord) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "No existe un poder registrado internamente con ese identificador.",
        fuente: fuenteBase,
        detalles: { numero: rawValue, estado: "No encontrado" },
      }
    }

    return {
      estado: "valido" as const,
      mensaje: "El poder coincide con un documento cargado en TOCHI.",
      fuente: fuenteBase,
      detalles: {
        documento: String(documentRecord.nombre || ""),
        caso: String((documentRecord as any).casoId?.numeroInterno || ""),
        cliente: String((documentRecord as any).clienteId?.razonSocial || `${(documentRecord as any).clienteId?.nombre || ""} ${(documentRecord as any).clienteId?.apellido || ""}`.trim()),
      },
    }
  }

  if (tipoDocumento === "sentencia") {
    if (!isPlausibleReference(rawValue)) {
      return {
        estado: "invalido" as const,
        mensaje: "El identificador no tiene un formato util para verificacion de sentencia.",
        fuente: fuenteBase,
      }
    }

    const caseRecord = await Case.findOne({
      $or: [
        { numeroRadicado: { $regex: search, $options: "i" } },
        { numeroProceso: { $regex: search, $options: "i" } },
        { numeroInterno: { $regex: search, $options: "i" } },
        { titulo: { $regex: search, $options: "i" } },
        { descripcion: { $regex: search, $options: "i" } },
        { notas: { $regex: search, $options: "i" } },
        { "actuaciones.descripcion": { $regex: search, $options: "i" } },
      ],
    })
      .populate("clienteId", "nombre apellido razonSocial tipo email")
      .lean()

    if (caseRecord) {
      return {
        estado: "valido" as const,
        mensaje: "La sentencia coincide con un expediente interno relacionado.",
        fuente: fuenteBase,
        detalles: {
          expediente: String(caseRecord.numeroInterno || ""),
          titulo: String(caseRecord.titulo || ""),
        },
      }
    }

    const documentRecord = await Document.findOne({
      $or: [
        { nombre: { $regex: search, $options: "i" } },
        { descripcion: { $regex: search, $options: "i" } },
        { archivoNombre: { $regex: search, $options: "i" } },
        { contenido: { $regex: search, $options: "i" } },
      ],
    })
      .populate("clienteId", "nombre apellido razonSocial tipo email")
      .populate("casoId", "titulo numeroInterno numeroRadicado")
      .lean()

    if (documentRecord) {
      return {
        estado: "valido" as const,
        mensaje: "La sentencia coincide con un documento interno cargado en TOCHI.",
        fuente: fuenteBase,
        detalles: {
          documento: String(documentRecord.nombre || ""),
          caso: String((documentRecord as any).casoId?.numeroInterno || ""),
        },
      }
    }

    return {
      estado: "no_encontrado" as const,
      mensaje: "No existe una sentencia registrada internamente con ese identificador.",
      fuente: fuenteBase,
      detalles: { numero: rawValue, estado: "No encontrado" },
    }
  }

  if (!isPlausibleReference(rawValue)) {
    return {
      estado: "invalido" as const,
      mensaje: "El identificador no tiene un formato util para verificacion.",
      fuente: fuenteBase,
    }
  }

  return {
    estado: "no_encontrado" as const,
    mensaje: "No hay una fuente interna suficiente para certificar automaticamente este dato.",
    fuente: fuenteBase,
    detalles: {
      observacion: "Usa las fuentes oficiales para certificacion definitiva.",
    },
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()
    return NextResponse.json({
      recentVerifications: await getRecentVerifications(session.user.id),
    })
  } catch (error) {
    console.error("Error obteniendo verificaciones:", error)
    return NextResponse.json({ error: "No se pudieron cargar las verificaciones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = (await request.json()) as VerificationPayload
    const tipoDocumento = body.tipoDocumento || "cedula"
    const numeroDocumento = String(body.numeroDocumento || "").trim()

    if (!numeroDocumento) {
      return NextResponse.json({ error: "Ingresa un numero para verificar" }, { status: 400 })
    }

    await dbConnect()

    const verification = await verifyByType(tipoDocumento, numeroDocumento)
    const saved = await Verification.create({
      userId: session.user.id,
      tipoDocumento,
      numeroDocumento,
      estado: verification.estado,
      mensaje: verification.mensaje,
      fuente: verification.fuente,
      detalles: verification.detalles,
    })

    return NextResponse.json({
      result: {
        tipo: tipoDocumento,
        numero: numeroDocumento,
        estado: verification.estado,
        mensaje: verification.mensaje,
        fuente: verification.fuente,
        detalles: verification.detalles,
      },
      recentVerifications: await getRecentVerifications(session.user.id),
      record: buildRecent(saved.toObject()),
    })
  } catch (error) {
    console.error("Error verificando documento:", error)
    return NextResponse.json({ error: "No se pudo verificar el documento" }, { status: 500 })
  }
}
