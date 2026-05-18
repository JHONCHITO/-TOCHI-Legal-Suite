import mongoose, { Schema, Document as MongoDocument, Model } from "mongoose";

export type DocumentType =
  | "demanda"
  | "contestacion"
  | "tutela"
  | "derecho_peticion"
  | "contrato"
  | "poder"
  | "memorial"
  | "recurso"
  | "concepto"
  | "acta"
  | "otro";

export type DocumentStatus = "borrador" | "revision" | "aprobado" | "finalizado" | "archivado";

export interface IDocument extends MongoDocument {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  tipo: DocumentType;
  estado: DocumentStatus;
  descripcion?: string;
  // Relaciones
  clienteId?: mongoose.Types.ObjectId;
  casoId?: mongoose.Types.ObjectId;
  plantillaId?: string;
  // Archivo
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamano?: number;
  // Portal cliente
  portalCompartido?: boolean;
  requiereAprobacion?: boolean;
  aprobadoPorClienteId?: mongoose.Types.ObjectId;
  aprobadoPorClienteAt?: Date;
  firmaClienteNombre?: string;
  firmaClienteDocumento?: string;
  firmaClienteTexto?: string;
  // Contenido (para documentos generados)
  contenido?: string;
  // Metadata
  version: number;
  creadorId: mongoose.Types.ObjectId;
  ultimoEditorId?: mongoose.Types.ObjectId;
  fechaAprobacion?: Date;
  aprobadorId?: mongoose.Types.ObjectId;
  // Etiquetas
  etiquetas?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    nombre: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: [
        "demanda",
        "contestacion",
        "tutela",
        "derecho_peticion",
        "contrato",
        "poder",
        "memorial",
        "recurso",
        "concepto",
        "acta",
        "otro",
      ],
      required: true,
    },
    estado: {
      type: String,
      enum: ["borrador", "revision", "aprobado", "finalizado", "archivado"],
      default: "borrador",
    },
    descripcion: String,
    clienteId: { type: Schema.Types.ObjectId, ref: "Client" },
    casoId: { type: Schema.Types.ObjectId, ref: "Case" },
    plantillaId: String,
    archivoUrl: String,
    archivoNombre: String,
    archivoTipo: String,
    archivoTamano: Number,
    portalCompartido: { type: Boolean, default: false },
    requiereAprobacion: { type: Boolean, default: false },
    aprobadoPorClienteId: { type: Schema.Types.ObjectId, ref: "Client" },
    aprobadoPorClienteAt: Date,
    firmaClienteNombre: String,
    firmaClienteDocumento: String,
    firmaClienteTexto: String,
    contenido: String,
    version: { type: Number, default: 1 },
    creadorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ultimoEditorId: { type: Schema.Types.ObjectId, ref: "User" },
    fechaAprobacion: Date,
    aprobadorId: { type: Schema.Types.ObjectId, ref: "User" },
    etiquetas: [String],
  },
  {
    timestamps: true,
  }
);

// Index para busquedas
DocumentSchema.index({ nombre: "text", descripcion: "text" });
DocumentSchema.index({ casoId: 1, creadorId: 1 });

const Document: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);

export default Document;
