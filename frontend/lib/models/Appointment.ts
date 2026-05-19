import mongoose, { Schema, Document, Model } from "mongoose";

export type AppointmentType =
  | "consulta"
  | "audiencia"
  | "reunion"
  | "diligencia"
  | "conciliacion"
  | "visita"
  | "otro";

export type AppointmentStatus =
  | "programada"
  | "confirmada"
  | "en_curso"
  | "completada"
  | "cancelada"
  | "reprogramada"
  | "no_asistio";

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  titulo: string;
  tipo: AppointmentType;
  estado: AppointmentStatus;
  // Tiempo
  fechaInicio: Date;
  fechaFin: Date;
  todoElDia: boolean;
  // Ubicacion
  ubicacion?: string;
  esVirtual: boolean;
  linkVirtual?: string;
  // Relaciones
  clienteId?: mongoose.Types.ObjectId;
  casoId?: mongoose.Types.ObjectId;
  abogadoId: mongoose.Types.ObjectId;
  // Portal cliente
  portalCompartido?: boolean;
  portalCompartidoEn?: Date;
  // Detalles
  descripcion?: string;
  notas?: string;
  // Recordatorios
  recordatorioEnviado: boolean;
  recordatorioFecha?: Date;
  // Recurrencia
  esRecurrente: boolean;
  recurrencia?: {
    frecuencia: "diaria" | "semanal" | "mensual";
    intervalo: number;
    finRecurrencia?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    titulo: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: [
        "consulta",
        "audiencia",
        "reunion",
        "diligencia",
        "conciliacion",
        "visita",
        "otro",
      ],
      required: true,
    },
    estado: {
      type: String,
      enum: [
        "programada",
        "confirmada",
        "en_curso",
        "completada",
        "cancelada",
        "reprogramada",
        "no_asistio",
      ],
      default: "programada",
    },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    todoElDia: { type: Boolean, default: false },
    ubicacion: String,
    esVirtual: { type: Boolean, default: false },
    linkVirtual: String,
    clienteId: { type: Schema.Types.ObjectId, ref: "Client" },
    casoId: { type: Schema.Types.ObjectId, ref: "Case" },
    abogadoId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    portalCompartido: { type: Boolean, default: false },
    portalCompartidoEn: Date,
    descripcion: String,
    notas: String,
    recordatorioEnviado: { type: Boolean, default: false },
    recordatorioFecha: Date,
    esRecurrente: { type: Boolean, default: false },
    recurrencia: {
      frecuencia: { type: String, enum: ["diaria", "semanal", "mensual"] },
      intervalo: Number,
      finRecurrencia: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index para busquedas por fecha
AppointmentSchema.index({ fechaInicio: 1, abogadoId: 1 });

const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;
