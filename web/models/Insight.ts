import mongoose, { Schema, models, model } from "mongoose";

export type InsightType = "qa" | "action_plan";
export type FinancialSituation = "deficit" | "cautious" | "healthy";

export interface InsightDoc {
  userId: string;
  type: InsightType;

  // Used for question/answer insights
  question?: string;
  answer?: string;

  // Used for action plans
  summary?: string;
  steps?: string[];
  situation?: FinancialSituation;

  createdAt?: Date;
  updatedAt?: Date;
}

const InsightSchema = new Schema<InsightDoc>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["qa", "action_plan"],
      required: true,
    },
    question: {
      type: String,
      required: false,
      trim: true,
    },
    answer: {
      type: String,
      required: false,
    },
    summary: {
      type: String,
      required: false,
    },
    steps: {
      type: [String],
      required: false,
      default: undefined,
    },
    situation: {
      type: String,
      enum: ["deficit", "cautious", "healthy"],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Reuse the model during hot reload in development
export const Insight =
  models.Insight || model<InsightDoc>("Insight", InsightSchema);