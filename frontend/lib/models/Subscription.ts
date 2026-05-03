import mongoose, { Schema, Document, Model } from "mongoose";
import type { PlanLimits } from "../products";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type SubscriptionResource =
  | "cases"
  | "clients"
  | "appointments"
  | "documents"
  | "invoices"
  | "communications"
  | "aiQueries"
  | "users";

export interface ISubscriptionUsage {
  cases: number;
  clients: number;
  appointments: number;
  documents: number;
  invoices: number;
  communications: number;
  aiQueries: number;
  users: number;
}

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  planId: string;
  status: SubscriptionStatus;
  trialStart?: Date;
  trialEnd?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  limits: PlanLimits;
  usage: ISubscriptionUsage;
  lastSyncedAt?: Date;
  canceledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const limitsSchema = new Schema<PlanLimits>(
  {
    cases: { type: Number, required: true, default: 0 },
    clients: { type: Number, required: true, default: 0 },
    appointments: { type: Number, required: true, default: 0 },
    documents: { type: Number, required: true, default: 0 },
    invoices: { type: Number, required: true, default: 0 },
    communications: { type: Number, required: true, default: 0 },
    aiQueries: { type: Number, required: true, default: 0 },
    users: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const usageSchema = new Schema<ISubscriptionUsage>(
  {
    cases: { type: Number, default: 0 },
    clients: { type: Number, default: 0 },
    appointments: { type: Number, default: 0 },
    documents: { type: Number, default: 0 },
    invoices: { type: Number, default: 0 },
    communications: { type: Number, default: 0 },
    aiQueries: { type: Number, default: 0 },
    users: { type: Number, default: 0 },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    planId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled"],
      default: "trialing",
    },
    trialStart: Date,
    trialEnd: Date,
    currentPeriodStart: { type: Date, required: true, default: Date.now },
    currentPeriodEnd: { type: Date, required: true, default: Date.now },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    limits: { type: limitsSchema, required: true },
    usage: { type: usageSchema, default: () => ({}) },
    lastSyncedAt: Date,
    canceledAt: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

SubscriptionSchema.index({ userId: 1 }, { unique: true });
SubscriptionSchema.index({ planId: 1, status: 1 });

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
