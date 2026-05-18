import mongoose, { Schema, Document, Model } from "mongoose";

export type CaseStatus =
  | "consulta"
  | "activo"
  | "en_tramite"
  | "audiencia_pendiente"
  | "sentencia"
  | "apelacion"
  | "cerrado"
  | "archivado";

export type CaseType =
  | "civil"
  | "penal"
  | "laboral"
  | "familia"
  | "comercial"
  | "administrativo"
  | "constitucional"
  | "tributario"
  | "otro";

export interface IActuacion {
  fecha: Date;
  tipo: string;
  descripcion: string;
  documentos?: string[];
  responsable: mongoose.Types.ObjectId;
}

interface ICaseSequence {
  _id: string;
  seq: number;
}

export interface ICase extends Document {
  _id: mongoose.Types.ObjectId;
  // Identificacion
  numeroRadicado?: string;
  numeroProceso?: string;
  numeroInterno: string;
  // Clasificacion
  tipo: CaseType;
  subtipo?: string;
  estado: CaseStatus;
  // Descripcion
  titulo: string;
  descripcion: string;
  hechos?: string;
  pretensiones?: string;
  // Partes
  clienteId: mongoose.Types.ObjectId;
  calidadCliente: "demandante" | "demandado" | "tercero" | "victima" | "otro";
  contraparte?: string;
  contraparteAbogado?: string;
  // Juzgado
  despacho?: string;
  ciudad?: string;
  juez?: string;
  // Fechas
  fechaInicio: Date;
  fechaRadicacion?: Date;
  fechaProximaActuacion?: Date;
  fechaCierre?: Date;
  // Equipo
  abogadoPrincipal: mongoose.Types.ObjectId;
  abogadosAsociados?: mongoose.Types.ObjectId[];
  // Valores
  cuantia?: number;
  honorarios?: number;
  honorariosPagados?: number;
  // Actuaciones
  actuaciones: IActuacion[];
  // Documentos
  documentos: mongoose.Types.ObjectId[];
  // Notas
  notas?: string;
  // Etiquetas
  etiquetas?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ActuacionSchema = new Schema<IActuacion>({
  fecha: { type: Date, required: true },
  tipo: { type: String, required: true },
  descripcion: { type: String, required: true },
  documentos: [String],
  responsable: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const CaseSequenceSchema = new Schema<ICaseSequence>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  {
    collection: "case_sequences",
    versionKey: false,
  }
);

const CaseSequence: Model<ICaseSequence> =
  mongoose.models.CaseSequence || mongoose.model<ICaseSequence>("CaseSequence", CaseSequenceSchema);

async function getInitialCaseSequence(year: number) {
  const CaseModel = (mongoose.models.Case as Model<ICase>) || mongoose.model<ICase>("Case");
  const latestCase = await CaseModel.findOne({
    numeroInterno: { $regex: `^TOCHI-${year}-` },
  })
    .sort({ numeroInterno: -1 })
    .select("numeroInterno")
    .lean();

  const currentSequence = Number(String(latestCase?.numeroInterno || "").split("-").pop()) || 0;
  return currentSequence;
}

const CaseSchema = new Schema<ICase>(
  {
    numeroRadicado: { type: String, trim: true },
    numeroProceso: { type: String, trim: true },
    numeroInterno: { type: String, required: true, unique: true },
    tipo: {
      type: String,
      enum: [
        "civil",
        "penal",
        "laboral",
        "familia",
        "comercial",
        "administrativo",
        "constitucional",
        "tributario",
        "otro",
      ],
      required: true,
    },
    subtipo: String,
    estado: {
      type: String,
      enum: [
        "consulta",
        "activo",
        "en_tramite",
        "audiencia_pendiente",
        "sentencia",
        "apelacion",
        "cerrado",
        "archivado",
      ],
      default: "consulta",
    },
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true },
    hechos: String,
    pretensiones: String,
    clienteId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    calidadCliente: {
      type: String,
      enum: ["demandante", "demandado", "tercero", "victima", "otro"],
      required: true,
    },
    contraparte: String,
    contraparteAbogado: String,
    despacho: String,
    ciudad: String,
    juez: String,
    fechaInicio: { type: Date, default: Date.now },
    fechaRadicacion: Date,
    fechaProximaActuacion: Date,
    fechaCierre: Date,
    abogadoPrincipal: { type: Schema.Types.ObjectId, ref: "User", required: true },
    abogadosAsociados: [{ type: Schema.Types.ObjectId, ref: "User" }],
    cuantia: Number,
    honorarios: Number,
    honorariosPagados: { type: Number, default: 0 },
    actuaciones: [ActuacionSchema],
    documentos: [{ type: Schema.Types.ObjectId, ref: "Document" }],
    notas: String,
    etiquetas: [String],
  },
  {
    timestamps: true,
  }
);

// Generar numero interno automatico
CaseSchema.pre("save", async function () {
  if (!this.numeroInterno) {
    const year = new Date().getFullYear();
    const counterId = `case-${year}`;
    const initialSequence = await getInitialCaseSequence(year);

    // Secuencia atómica por año para evitar duplicados y recuperar el contador si quedó atrasado.
    const counter = await CaseSequence.findOneAndUpdate(
      { _id: counterId },
      [
        {
          $set: {
            seq: {
              $add: [
                {
                  $max: [
                    { $ifNull: ["$seq", 0] },
                    initialSequence,
                  ],
                },
                1,
              ],
            },
          },
        },
      ],
      {
        returnDocument: "after",
        upsert: true,
        updatePipeline: true,
      }
    );

    const sequence = counter?.seq || initialSequence + 1;
    this.numeroInterno = `TOCHI-${year}-${String(sequence).padStart(5, "0")}`;
  }
});

const Case: Model<ICase> =
  mongoose.models.Case || mongoose.model<ICase>("Case", CaseSchema);

export default Case;
