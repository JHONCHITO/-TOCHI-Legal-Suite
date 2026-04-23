import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  throw new Error("Falta la variable de entorno MONGODB_URI");
}

const mongoUri = MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

function getSafeConnectionLabel(uri: string) {
  try {
    const sanitized = uri.replace("mongodb+srv://", "").replace("mongodb://", "");
    const hostAndDb = sanitized.split("@").pop() ?? "mongodb";
    return hostAndDb.split("?")[0];
  } catch {
    return "mongodb";
  }
}

function formatMongoError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("No se pudo conectar a MongoDB");
  }

  if (error.message.includes("querySrv")) {
    return new Error(
      "No se pudo resolver el DNS del cluster MongoDB. Usa una URI directa del replicaset o revisa tu red/DNS."
    );
  }

  return error;
}

const cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      family: 4,
      serverSelectionTimeoutMS: 10000,
    };

    console.log(`Conectando a MongoDB: ${getSafeConnectionLabel(mongoUri)}`);

    cached.promise = mongoose.connect(mongoUri, opts).catch((error) => {
      const formattedError = formatMongoError(error);
      console.error("Error conectando a MongoDB:", formattedError.message);
      throw formattedError;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
