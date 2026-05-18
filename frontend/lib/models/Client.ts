import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClient extends Document {
  _id: mongoose.Types.ObjectId;
  tipo: "persona_natural" | "persona_juridica";
  // Persona Natural
  nombre?: string;
  apellido?: string;
  cedula?: string;
  // Persona Juridica
  razonSocial?: string;
  nit?: string;
  representanteLegal?: string;
  // Comun
  email: string;
  telefono: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  // Relaciones
  abogadoAsignado?: mongoose.Types.ObjectId;
  casos: mongoose.Types.ObjectId[];
  // Estado
  activo: boolean;
  notas?: string;
  // Portal Cliente
  tieneAccesoPortal: boolean;
  userId?: mongoose.Types.ObjectId;
  portalUltimaSincronizacion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    tipo: {
      type: String,
      enum: ["persona_natural", "persona_juridica"],
      required: true,
    },
    nombre: { type: String, trim: true },
    apellido: { type: String, trim: true },
    cedula: { type: String, trim: true },
    razonSocial: { type: String, trim: true },
    nit: { type: String, trim: true },
    representanteLegal: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    telefono: { type: String, trim: true },
    celular: { type: String, trim: true },
    direccion: { type: String, trim: true },
    ciudad: { type: String, trim: true },
    departamento: { type: String, trim: true },
    abogadoAsignado: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    casos: [{ type: Schema.Types.ObjectId, ref: "Case" }],
    activo: { type: Boolean, default: true },
    notas: String,
    tieneAccesoPortal: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    portalUltimaSincronizacion: Date,
  },
  {
    timestamps: true,
  }
);

// Nombre completo virtual
ClientSchema.virtual("nombreCompleto").get(function () {
  if (this.tipo === "persona_natural") {
    return `${this.nombre} ${this.apellido}`;
  }
  return this.razonSocial;
});

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

export default Client;
