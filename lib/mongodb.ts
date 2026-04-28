import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  throw new Error("❌ Falta la variable de entorno MONGODB_URI");
}

// 🔥 Cache global para evitar múltiples conexiones
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// 🔥 Inicializar cache
const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// 🔍 Solo para log bonito
function getSafeConnectionLabel(uri: string) {
  try {
    const sanitized = uri.replace("mongodb+srv://", "").replace("mongodb://", "");
    const hostAndDb = sanitized.split("@").pop() ?? "mongodb";
    return hostAndDb.split("?")[0];
  } catch {
    return "mongodb";
  }
}

// 🔥 Conexión principal
async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log(`🔌 Conectando a MongoDB: ${getSafeConnectionLabel(MONGODB_URI!)}`);

    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      family: 4, // evita problemas DNS en algunos sistemas
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB conectado");
  } catch (error: any) {
    cached.promise = null;

    console.error("💣 Error conectando a MongoDB:", error.message);

    // 🔥 errores comunes mejor explicados
    if (error.message.includes("querySrv")) {
      throw new Error(
        "❌ Error DNS MongoDB. Revisa tu conexión o usa URI directa (no SRV)"
      );
    }

    throw error;
  }

  return cached.conn;
}

export default dbConnect;