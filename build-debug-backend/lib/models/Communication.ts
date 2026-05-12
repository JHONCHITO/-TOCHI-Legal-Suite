import mongoose, { Schema, Document, Types } from "mongoose"

export interface ICommunication extends Document {
  creadorId?: Types.ObjectId
  clienteId: Types.ObjectId
  casoId?: Types.ObjectId
  canal: "whatsapp" | "correo" | "llamada" | "reunion" | "sms" | "otro" | "nota"
  tipo: "entrada" | "salida"
  asunto?: string
  mensaje: string
  estado: "pendiente" | "respondido" | "sin_respuesta" | "completado"
  prioridad: "baja" | "media" | "alta"
  fecha: Date
  fechaRespuesta?: Date
  responsable?: string
  notas?: string
  whatsappPhone?: string
  whatsappMessageId?: string
  whatsappStatus?: "draft" | "queued" | "received" | "sent" | "delivered" | "read" | "failed" | "fallback" | "not_configured"
  whatsappFallbackUrl?: string
  whatsappError?: string
  createdAt: Date
  updatedAt: Date
}

const CommunicationSchema = new Schema(
  {
    creadorId: { type: Schema.Types.ObjectId, ref: "User" },
    clienteId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    casoId: { type: Schema.Types.ObjectId, ref: "Case" },
    canal: {
      type: String,
      enum: ["whatsapp", "correo", "llamada", "reunion", "sms", "otro", "nota"],
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
    whatsappPhone: { type: String, default: "" },
    whatsappMessageId: { type: String, default: "" },
    whatsappStatus: {
      type: String,
      enum: ["draft", "queued", "received", "sent", "delivered", "read", "failed", "fallback", "not_configured"],
      default: "draft",
    },
    whatsappFallbackUrl: { type: String, default: "" },
    whatsappError: { type: String, default: "" },
  },
  { timestamps: true }
)

CommunicationSchema.index({ clienteId: 1 })
CommunicationSchema.index({ creadorId: 1 })
CommunicationSchema.index({ casoId: 1 })
CommunicationSchema.index({ fecha: -1 })
CommunicationSchema.index({ estado: 1 })

export default mongoose.models.Communication || mongoose.model<ICommunication>("Communication", CommunicationSchema)
