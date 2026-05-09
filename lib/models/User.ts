import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: "superadmin" | "admin" | "abogado" | "asistente" | "cliente";
  avatar?: string;
  firma?: string;
  tarjetaProfesional?: string;
  especialidades?: string[];
  notificationPreferences?: {
    recordatoriosJudiciales?: boolean;
    cambiosNormativos?: boolean;
    resumenDiario?: boolean;
    carteraVencida?: boolean;
    email?: boolean;
    push?: boolean;
  };
  activo: boolean;
  emailVerified?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellido: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    rol: {
      type: String,
      enum: ["superadmin", "admin", "abogado", "asistente", "cliente"],
      default: "abogado",
    },
    avatar: String,
    firma: String,
    tarjetaProfesional: String,
    especialidades: [String],
    notificationPreferences: {
      recordatoriosJudiciales: { type: Boolean, default: true },
      cambiosNormativos: { type: Boolean, default: true },
      resumenDiario: { type: Boolean, default: true },
      carteraVencida: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
    },
    activo: {
      type: Boolean,
      default: true,
    },
    emailVerified: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
