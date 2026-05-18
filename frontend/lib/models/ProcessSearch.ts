import mongoose, { Schema, Document, Model } from "mongoose"

export type ProcessSearchType = "radicado" | "cedula" | "nombre"

export interface IProcessSearch extends Document {
  userId: mongoose.Types.ObjectId
  searchType: ProcessSearchType
  searchValue: string
  resultsCount: number
  createdAt: Date
  updatedAt: Date
}

const ProcessSearchSchema = new Schema<IProcessSearch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    searchType: {
      type: String,
      enum: ["radicado", "cedula", "nombre"],
      required: true,
    },
    searchValue: { type: String, required: true, trim: true },
    resultsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

ProcessSearchSchema.index({ userId: 1, createdAt: -1 })

const ProcessSearch: Model<IProcessSearch> =
  mongoose.models.ProcessSearch || mongoose.model<IProcessSearch>("ProcessSearch", ProcessSearchSchema)

export default ProcessSearch
