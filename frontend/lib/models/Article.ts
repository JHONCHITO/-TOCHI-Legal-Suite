import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModificacion {
  norma: string;
  fecha: Date;
  tipo: "modifica" | "adiciona" | "deroga" | "suspende";
  descripcion: string;
}

export interface INotaUsuario {
  userId: mongoose.Types.ObjectId;
  nota: string;
  fecha: Date;
  publica: boolean;
}

export interface IArticle extends Document {
  _id: mongoose.Types.ObjectId;
  codigoId: mongoose.Types.ObjectId;
  numero: string;
  numeroCompleto: string;
  libro?: string;
  titulo?: string;
  capitulo?: string;
  seccion?: string;
  epigrafe?: string;
  contenido: string;
  contenidoHTML?: string;
  incisos?: Array<{ numero: string; contenido: string }>;
  paragrafos?: Array<{ numero: string; contenido: string }>;
  vigente: boolean;
  modificadoPor: IModificacion[];
  sentenciasRelacionadas?: Array<{
    corte: string;
    numero: string;
    fecha: Date;
    tipo: string;
    resumen: string;
    url?: string;
  }>;
  concordancias?: Array<{
    codigoId: mongoose.Types.ObjectId;
    articuloNumero: string;
    descripcion: string;
  }>;
  palabrasClave: string[];
  notasUsuarios: INotaUsuario[];
  favoritos: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    codigoId: { type: Schema.Types.ObjectId, ref: "LegalCode", required: true },
    numero: { type: String, required: true },
    numeroCompleto: { type: String, required: true },
    libro: String,
    titulo: String,
    capitulo: String,
    seccion: String,
    epigrafe: String,
    contenido: { type: String, required: true },
    contenidoHTML: String,
    incisos: [
      {
        numero: String,
        contenido: String,
      },
    ],
    paragrafos: [
      {
        numero: String,
        contenido: String,
      },
    ],
    vigente: { type: Boolean, default: true },
    modificadoPor: [
      {
        norma: String,
        fecha: Date,
        tipo: { type: String, enum: ["modifica", "adiciona", "deroga", "suspende"] },
        descripcion: String,
      },
    ],
    sentenciasRelacionadas: [
      {
        corte: String,
        numero: String,
        fecha: Date,
        tipo: String,
        resumen: String,
        url: String,
      },
    ],
    concordancias: [
      {
        codigoId: { type: Schema.Types.ObjectId, ref: "LegalCode" },
        articuloNumero: String,
        descripcion: String,
      },
    ],
    palabrasClave: [String],
    notasUsuarios: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        nota: String,
        fecha: { type: Date, default: Date.now },
        publica: { type: Boolean, default: false },
      },
    ],
    favoritos: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

// Indices para busqueda rapida
ArticleSchema.index({ codigoId: 1, numero: 1 });
ArticleSchema.index({ contenido: "text", epigrafe: "text", palabrasClave: "text" });

const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>("Article", ArticleSchema);

export default Article;
