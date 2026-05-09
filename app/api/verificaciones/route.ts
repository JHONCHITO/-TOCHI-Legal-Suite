import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import Case from "@/lib/models/Case";
import User from "@/lib/models/User";
import Verification, { type VerificationState, type VerificationType } from "@/lib/models/Verification";

export const runtime = "nodejs";

type VerificationPayload = {
  tipoDocumento?: VerificationType;
  numeroDocumento?: string;
};

type VerificationResult = {
  tipo: VerificationType;
  numero: string;
  estado: VerificationState;
  mensaje: string;
  fuente: string;
  detalles?: Record<string, string>;
};

type RecentVerification = {
  _id: string;
  tipoDocumento: VerificationType;
  numeroDocumento: string;
  estado: VerificationState;
  mensaje: string;
  fuente: string;
  createdAt: string;
};

const NIT_WEIGHTS = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCcedula(value: string) {
  const digits = normalizeDigits(value);
  return /^\d{6,10}$/.test(digits);
}

function calculateNitDv(value: string) {
  const digits = normalizeDigits(value);
  const base = digits.slice(0, -1);
  let sum = 0;
  const reversed = base.split("").reverse();
  for (let index = 0; index < reversed.length && index < NIT_WEIGHTS.length; index += 1) {
    sum += Number(reversed[index] || 0) * NIT_WEIGHTS[index];
  }
  const remainder = sum % 11;
  const dv = remainder > 1 ? 11 - remainder : remainder;
  return dv;
}

function isValidNit(value: string) {
  const digits = normalizeDigits(value);
  if (digits.length < 8) {
    return false;
  }

  if (digits.length > 8) {
    const providedDv = Number(digits.slice(-1));
    const calculatedDv = calculateNitDv(digits);
    return providedDv === calculatedDv;
  }

  return true;
}

function isValidTarjeta(value: string) {
  const digits = normalizeDigits(value);
  return /^\d{4,10}$/.test(digits);
}

function isValidRadicado(value: string) {
  const digits = normalizeDigits(value);
  return /^\d{23}$/.test(digits);
}

function isPlausibleReference(value: string) {
  return /^[A-Z0-9\-\/]{4,}$/i.test(value.trim());
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
  };
}

async function getRecentVerifications(userId: string): Promise<RecentVerification[]> {
  const recent = await Verification.find({ userId }).sort({ createdAt: -1 }).limit(8).lean();
  return recent.map(buildRecent);
}

async function verifyByType(tipoDocumento: VerificationType, numeroDocumento: string) {
  const fuente = "Base interna TOCHI y validación de formato";

  if (tipoDocumento === "cedula") {
    const normalized = normalizeDigits(numeroDocumento);
    if (!isValidCcedula(normalized)) {
      return {
        estado: "invalido" as const,
        mensaje: "La cédula no tiene un formato válido.",
        fuente,
        detalles: { formato: "Se esperan entre 6 y 10 dígitos", numero: normalized },
      };
    }

    const client = await Client.findOne({
      cedula: normalized,
    })
      .select("nombre apellido razonSocial tipo email")
      .lean();

    if (!client) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "La cédula tiene formato válido, pero no aparece en la base interna.",
        fuente,
        detalles: { formato: normalized, estado: "No encontrado" },
      };
    }

    return {
      estado: "valido" as const,
      mensaje: "La cédula coincide con un cliente registrado.",
      fuente,
      detalles: {
        cliente: client.tipo === "persona_juridica" ? String(client.razonSocial || "") : `${client.nombre || ""} ${client.apellido || ""}`.trim(),
        correo: String(client.email || ""),
      },
    };
  }

  if (tipoDocumento === "nit") {
    const normalized = normalizeDigits(numeroDocumento);
    if (!isValidNit(numeroDocumento)) {
      return {
        estado: "invalido" as const,
        mensaje: "El NIT no supera la validación básica del dígito/verificación.",
        fuente,
        detalles: { numero: normalized },
      };
    }

    const client = await Client.findOne({ nit: normalized })
      .select("razonSocial nombre apellido tipo email")
      .lean();

    if (!client) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "El NIT es formalmente válido, pero no aparece en la base interna.",
        fuente,
        detalles: { numero: normalized, estado: "No encontrado" },
      };
    }

    return {
      estado: "valido" as const,
      mensaje: "El NIT coincide con un cliente jurídico registrado.",
      fuente,
      detalles: {
        cliente: String(client.razonSocial || ""),
        correo: String(client.email || ""),
      },
    };
  }

  if (tipoDocumento === "tarjeta_profesional") {
    const normalized = normalizeDigits(numeroDocumento);
    if (!isValidTarjeta(normalized)) {
      return {
        estado: "invalido" as const,
        mensaje: "La tarjeta profesional no tiene un formato válido.",
        fuente,
        detalles: { numero: normalized },
      };
    }

    const user = await User.findOne({ tarjetaProfesional: normalized })
      .select("nombre apellido email rol activo")
      .lean();

    if (!user) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "La tarjeta profesional parece correcta, pero no aparece en la base interna.",
        fuente,
        detalles: { numero: normalized, estado: "No encontrado" },
      };
    }

    return {
      estado: "valido" as const,
      mensaje: "La tarjeta profesional coincide con un usuario de la firma.",
      fuente,
      detalles: {
        abogado: `${user.nombre || ""} ${user.apellido || ""}`.trim(),
        correo: String(user.email || ""),
        rol: String(user.rol || ""),
      },
    };
  }

  if (tipoDocumento === "radicado") {
    const normalized = normalizeDigits(numeroDocumento);
    if (!isValidRadicado(normalized)) {
      return {
        estado: "invalido" as const,
        mensaje: "El radicado no cumple el formato de 23 dígitos.",
        fuente,
        detalles: { numero: normalized },
      };
    }

    const caseRecord = await Case.findOne({
      $or: [
        { numeroRadicado: normalized },
        { numeroProceso: normalized },
        { numeroInterno: numeroDocumento.trim() },
      ],
    })
      .populate("clienteId", "nombre apellido razonSocial tipo")
      .lean();

    if (!caseRecord) {
      return {
        estado: "no_encontrado" as const,
        mensaje: "El radicado es formalmente válido, pero no aparece en la base interna.",
        fuente,
        detalles: { numero: normalized, estado: "No encontrado" },
      };
    }

    return {
      estado: "valido" as const,
      mensaje: "El radicado coincide con un expediente interno.",
      fuente,
      detalles: {
        expediente: String(caseRecord.numeroInterno || ""),
        titulo: String(caseRecord.titulo || ""),
      },
    };
  }

  if (!isPlausibleReference(numeroDocumento)) {
    return {
      estado: "invalido" as const,
      mensaje: "El identificador no tiene un formato útil para verificación de referencia.",
      fuente,
    };
  }

  return {
    estado: "valido" as const,
    mensaje: "La referencia tiene un formato razonable para revisión manual.",
    fuente,
    detalles: {
      observacion: "Usa las fuentes oficiales para certificación definitiva.",
    },
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await dbConnect();
    return NextResponse.json({
      recentVerifications: await getRecentVerifications(session.user.id),
    });
  } catch (error) {
    console.error("Error obteniendo verificaciones:", error);
    return NextResponse.json({ error: "No se pudieron cargar las verificaciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as VerificationPayload;
    const tipoDocumento = body.tipoDocumento || "cedula";
    const numeroDocumento = String(body.numeroDocumento || "").trim();

    if (!numeroDocumento) {
      return NextResponse.json({ error: "Ingresa un número para verificar" }, { status: 400 });
    }

    await dbConnect();

    const verification = await verifyByType(tipoDocumento, numeroDocumento);
    const saved = await Verification.create({
      userId: session.user.id,
      tipoDocumento,
      numeroDocumento,
      estado: verification.estado,
      mensaje: verification.mensaje,
      fuente: verification.fuente,
      detalles: verification.detalles,
    });

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
    });
  } catch (error) {
    console.error("Error verificando documento:", error);
    return NextResponse.json({ error: "No se pudo verificar el documento" }, { status: 500 });
  }
}
