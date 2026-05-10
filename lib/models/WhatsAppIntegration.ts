import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWhatsAppIntegration extends Document {
  provider: "whatsapp";
  businessAccountId?: string;
  phoneNumberId?: string;
  accessToken?: string;
  webhookVerifyToken?: string;
  graphVersion: string;
  defaultCountryCode: string;
  publicAppUrl?: string;
  enabled: boolean;
  notes?: string;
  updatedBy?: mongoose.Types.ObjectId;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppIntegrationSchema = new Schema<IWhatsAppIntegration>(
  {
    provider: {
      type: String,
      enum: ["whatsapp"],
      default: "whatsapp",
      unique: true,
      index: true,
    },
    businessAccountId: { type: String, trim: true },
    phoneNumberId: { type: String, trim: true },
    accessToken: { type: String, trim: true, select: false },
    webhookVerifyToken: { type: String, trim: true, select: false },
    graphVersion: { type: String, default: "v21.0", trim: true },
    defaultCountryCode: { type: String, default: "57", trim: true },
    publicAppUrl: { type: String, trim: true },
    enabled: { type: Boolean, default: true },
    notes: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

WhatsAppIntegrationSchema.index({ provider: 1 }, { unique: true });

const WhatsAppIntegration: Model<IWhatsAppIntegration> =
  mongoose.models.WhatsAppIntegration ||
  mongoose.model<IWhatsAppIntegration>("WhatsAppIntegration", WhatsAppIntegrationSchema);

export default WhatsAppIntegration;
