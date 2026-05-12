import mongoose, { Schema, Document, Model } from "mongoose";

// 🔥 interfaz (opcional pero recomendado)
export interface INorma extends Document {
  codigo: string;
  nombre: string;
  articulo: string;
  titulo: string;
  contenido: string;
  embedding?: number[];
  embeddingHash?: string;
  embeddingSourceHash?: string;
  embeddingUpdatedAt?: Date;
}

// 🔥 esquema
const NormaSchema: Schema<INorma> = new Schema({
  codigo: { type: String, required: true },
  nombre: { type: String, required: true },
  articulo: { type: String, required: true },
  titulo: { type: String },
  contenido: { type: String, required: true },

  // 🔥 VECTOR (CORREGIDO)
  embedding: {
    type: [Number],
    default: undefined, // ⚠️ importante (NO [])
  },
  embeddingHash: {
    type: String,
    default: "",
  },
  embeddingSourceHash: {
    type: String,
    default: "",
  },
  embeddingUpdatedAt: {
    type: Date,
  },
});

// 🔥 evitar duplicación en hot reload (Next.js / dev)
const Norma: Model<INorma> =
  mongoose.models.Norma || mongoose.model<INorma>("Norma", NormaSchema);

export default Norma;
