import mongoose, { Schema, models, model } from "mongoose";

export type TransactionSource = "csv" | "manual";

export interface TransactionDoc {
  userId: string;
  date: Date;
  description: string;
  amount: number;
  category?: string;      // can start as "Unknown"
  source: TransactionSource;
  batchId: string;        // groups one upload/manual session
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema = new Schema<TransactionDoc>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },

    category: { type: String, default: "Unknown" },

    source: { type: String, enum: ["csv", "manual"], required: true },
    batchId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const Transaction =
  models.Transaction || model<TransactionDoc>("Transaction", TransactionSchema);