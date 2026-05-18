import dbConnect from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type ClientSourceUser = {
  _id: string;
  email: string;
  nombre?: string | null;
  apellido?: string | null;
  telefono?: string | null;
};

function normalizeEmail(email?: string | null) {
  return String(email || "").toLowerCase().trim();
}

async function getDefaultAdvisorId() {
  const advisor = await User.findOne({
    rol: { $in: ["superadmin", "admin", "abogado"] },
    activo: true,
  })
    .select("_id")
    .sort({ createdAt: 1 })
    .lean();

  return advisor ? String((advisor as { _id: unknown })._id) : null;
}

export async function findOrCreateClientForUser(user: ClientSourceUser) {
  await dbConnect();

  const email = normalizeEmail(user.email);
  if (!email) {
    return null;
  }

  const existingClient = await Client.findOne({
    $or: [{ userId: user._id }, { email }],
  }).lean();

  if (existingClient) {
    const updates: Record<string, unknown> = {};

    if (!existingClient.userId) {
      updates.userId = user._id;
    }
    if (existingClient.email !== email) {
      updates.email = email;
    }
    if (!existingClient.tieneAccesoPortal) {
      updates.tieneAccesoPortal = true;
    }
    if (!existingClient.nombre && user.nombre) {
      updates.nombre = user.nombre;
    }
    if (!existingClient.apellido && user.apellido) {
      updates.apellido = user.apellido;
    }
    if (!existingClient.telefono && user.telefono) {
      updates.telefono = user.telefono;
    }

    if (Object.keys(updates).length > 0) {
      const updatedClient = await Client.findByIdAndUpdate(
        (existingClient as { _id: unknown })._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      return updatedClient || existingClient;
    }

    return existingClient;
  }

  const abogadoAsignado = await getDefaultAdvisorId();

  const createdClient = await Client.create({
    tipo: "persona_natural",
    nombre: user.nombre || "",
    apellido: user.apellido || "",
    email,
    telefono: user.telefono || "",
    celular: user.telefono || "",
    direccion: "",
    ciudad: "",
    departamento: "",
    casos: [],
    activo: true,
    notas: "Perfil creado automaticamente desde el portal de cliente.",
    tieneAccesoPortal: true,
    userId: user._id,
    ...(abogadoAsignado ? { abogadoAsignado } : {}),
  });

  return createdClient.toObject();
}

export async function ensureClientProfileForSession(sessionUser: SessionUser) {
  if (!sessionUser?.id) {
    return null;
  }

  const user = await User.findById(sessionUser.id)
    .select("email nombre apellido telefono")
    .lean();

  if (!user) {
    return null;
  }

  return findOrCreateClientForUser({
    _id: String((user as { _id: unknown })._id),
    email: normalizeEmail((user as { email?: string }).email || sessionUser.email),
    nombre: (user as { nombre?: string }).nombre,
    apellido: (user as { apellido?: string }).apellido,
    telefono: (user as { telefono?: string }).telefono,
  });
}
