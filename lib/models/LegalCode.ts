import mongoose, { Schema, Document, Model } from "mongoose";

export type LegalCodeType =
  | "constitucion"
  | "codigo"
  | "ley"
  | "decreto"
  | "resolucion"
  | "sentencia";

export interface ILegalCode extends Document {
  _id: mongoose.Types.ObjectId;
  codigo: string;
  nombre: string;
  nombreCorto: string;
  tipo: LegalCodeType;
  numeroNorma: string;
  fechaExpedicion?: Date;
  fechaVigencia?: Date;
  entidadEmisora: string;
  urlOficial: string;
  urlSUIN?: string;
  urlSenado?: string;
  vigente: boolean;
  ultimaActualizacion: Date;
  versionActual: string;
  tags: string[];
  areasDelDerecho: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LegalCodeSchema = new Schema<ILegalCode>(
  {
    codigo: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    nombreCorto: { type: String, required: true },
    tipo: {
      type: String,
      enum: ["constitucion", "codigo", "ley", "decreto", "resolucion", "sentencia"],
      required: true,
    },
    numeroNorma: { type: String, required: true },
    fechaExpedicion: Date,
    fechaVigencia: Date,
    entidadEmisora: { type: String, required: true },
    urlOficial: { type: String, required: true },
    urlSUIN: String,
    urlSenado: String,
    vigente: { type: Boolean, default: true },
    ultimaActualizacion: { type: Date, default: Date.now },
    versionActual: { type: String, default: "1.0" },
    tags: [String],
    areasDelDerecho: [String],
  },
  {
    timestamps: true,
  }
);

const LegalCode: Model<ILegalCode> =
  mongoose.models.LegalCode ||
  mongoose.model<ILegalCode>("LegalCode", LegalCodeSchema);

export default LegalCode;
