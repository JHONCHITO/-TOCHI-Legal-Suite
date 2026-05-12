import mongoose, { Schema, Document, Model } from "mongoose";

export type VerificationType =
  | "cedula"
  | "nit"
  | "tarjeta_profesional"
  | "poder"
  | "sentencia"
  | "radicado";

export type VerificationState = "valido" | "invalido" | "no_encontrado" | "verificando";

export interface IVerification extends Document {
  userId: mongoose.Types.ObjectId;
  tipoDocumento: VerificationType;
  numeroDocumento: string;
  estado: VerificationState;
  mensaje: string;
  fuente: string;
  detalles?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationSchema = new Schema<IVerification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tipoDocumento: {
      type: String,
      enum: ["cedula", "nit", "tarjeta_profesional", "poder", "sentencia", "radicado"],
      required: true,
    },
    numeroDocumento: { type: String, required: true, trim: true },
    estado: {
      type: String,
      enum: ["valido", "invalido", "no_encontrado", "verificando"],
      required: true,
    },
    mensaje: { type: String, required: true },
    fuente: { type: String, required: true },
    detalles: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

VerificationSchema.index({ userId: 1, createdAt: -1 });

const Verification: Model<IVerification> =
  mongoose.models.Verification || mongoose.model<IVerification>("Verification", VerificationSchema);

export default Verification;
