import mongoose, { Schema, Document, Model } from "mongoose";

export interface IArticulo extends Document {
  _id: mongoose.Types.ObjectId;
  codigoLegalId: mongoose.Types.ObjectId;
  codigoRef: string;
  libro: string;
  titulo: string;
  capitulo: string;
  seccion?: string;
  numeroArticulo: string;
  tituloArticulo: string;
  contenido: string;
  paragrafos?: string[];
  notas?: string;
  vigente: boolean;
  fechaModificacion?: Date;
  normaModificatoria?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArticuloSchema = new Schema<IArticulo>(
  {
    codigoLegalId: { type: Schema.Types.ObjectId, ref: "LegalCode", required: true },
    codigoRef: { type: String, required: true, index: true },
    libro: { type: String, default: "" },
    titulo: { type: String, default: "" },
    capitulo: { type: String, default: "" },
    seccion: String,
    numeroArticulo: { type: String, required: true },
    tituloArticulo: { type: String, default: "" },
    contenido: { type: String, required: true },
    paragrafos: [String],
    notas: String,
    vigente: { type: Boolean, default: true },
    fechaModificacion: Date,
    normaModificatoria: String,
  },
  { timestamps: true }
);

ArticuloSchema.index({ codigoRef: 1, numeroArticulo: 1 });
ArticuloSchema.index({ contenido: "text", tituloArticulo: "text" });

const Articulo: Model<IArticulo> =
  mongoose.models.Articulo || mongoose.model<IArticulo>("Articulo", ArticuloSchema);

export default Articulo;
