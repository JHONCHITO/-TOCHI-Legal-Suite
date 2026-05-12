import mongoose, { Schema, Document, Types } from "mongoose"

export interface ICommunication extends Document {
  clienteId: Types.ObjectId
  casoId?: Types.ObjectId
  canal: "whatsapp" | "correo" | "llamada" | "reunion" | "sms" | "otro"
  tipo: "entrada" | "salida"
  asunto?: string
  mensaje: string
  estado: "pendiente" | "respondido" | "sin_respuesta" | "completado"
  prioridad: "baja" | "media" | "alta"
  fecha: Date
  fechaRespuesta?: Date
  responsable?: string
  notas?: string
  createdAt: Date
  updatedAt: Date
}

const CommunicationSchema = new Schema(
  {
    clienteId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    casoId: { type: Schema.Types.ObjectId, ref: "Case" },
    canal: {
      type: String,
      enum: ["whatsapp", "correo", "llamada", "reunion", "sms", "otro"],
      required: true,
    },
    tipo: {
      type: String,
      enum: ["entrada", "salida"],
      default: "salida",
    },
    asunto: String,
    mensaje: { type: String, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "respondido", "sin_respuesta", "completado"],
      default: "pendiente",
    },
    prioridad: {
      type: String,
      enum: ["baja", "media", "alta"],
      default: "media",
    },
    fecha: { type: Date, default: Date.now },
    fechaRespuesta: Date,
    responsable: String,
    notas: String,
  },
  { timestamps: true }
)

CommunicationSchema.index({ clienteId: 1 })
CommunicationSchema.index({ casoId: 1 })
CommunicationSchema.index({ fecha: -1 })
CommunicationSchema.index({ estado: 1 })

export default mongoose.models.Communication || mongoose.model<ICommunication>("Communication", CommunicationSchema)
