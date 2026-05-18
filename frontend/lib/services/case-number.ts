import mongoose, { Schema, Model } from "mongoose";
import Case from "@/lib/models/Case";

interface ICaseSequence {
  _id: string;
  seq: number;
}

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
  const latestCase = await Case.findOne({
    numeroInterno: { $regex: `^TOCHI-${year}-` },
  })
    .sort({ numeroInterno: -1 })
    .select("numeroInterno")
    .lean();

  return Number(String(latestCase?.numeroInterno || "").split("-").pop()) || 0;
}

export async function reserveNextCaseNumber() {
  const year = new Date().getFullYear();
  const counterId = `case-${year}`;
  const initialSequence = await getInitialCaseSequence(year);

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
  return `TOCHI-${year}-${String(sequence).padStart(5, "0")}`;
}
