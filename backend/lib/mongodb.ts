import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

const envPaths = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env.local"),
  path.resolve(process.cwd(), "..", ".env"),
  path.resolve(process.cwd(), "..", "..", ".env"),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: false });
}

const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  throw new Error("❌ Falta la variable de entorno MONGODB_URI");
}

// 🔥 Tipado global
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// 🔥 Cache
const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// 🔥 Conexión principal
async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    console.log("🔌 Conectando a MongoDB...");

    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB conectado");
  } catch (error: any) {
    cached.promise = null;
    console.error("💣 Error MongoDB:", error.message);
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
