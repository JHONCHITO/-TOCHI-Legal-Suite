import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "cita_proxima"
  | "cita_cancelada"
  | "caso_actualizado"
  | "documento_nuevo"
  | "vencimiento"
  | "actualizacion_ley"
  | "mensaje"
  | "sistema";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tipo: NotificationType;
  prioridad?: "alta" | "media" | "baja";
  titulo: string;
  mensaje: string;
  enlace?: string;
  leida: boolean;
  fechaLeida?: Date;
  // Referencias opcionales
  casoId?: mongoose.Types.ObjectId;
  citaId?: mongoose.Types.ObjectId;
  documentoId?: mongoose.Types.ObjectId;
  // Envio
  enviadaEmail: boolean;
  enviadaPush: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tipo: {
      type: String,
      enum: [
        "cita_proxima",
        "cita_cancelada",
        "caso_actualizado",
        "documento_nuevo",
        "vencimiento",
        "actualizacion_ley",
        "mensaje",
        "sistema",
      ],
      required: true,
    },
    prioridad: {
      type: String,
      enum: ["alta", "media", "baja"],
      default: "media",
    },
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    enlace: String,
    leida: { type: Boolean, default: false },
    fechaLeida: Date,
    casoId: { type: Schema.Types.ObjectId, ref: "Case" },
    citaId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    documentoId: { type: Schema.Types.ObjectId, ref: "Document" },
    enviadaEmail: { type: Boolean, default: false },
    enviadaPush: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Index para busquedas por usuario
NotificationSchema.index({ userId: 1, leida: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
