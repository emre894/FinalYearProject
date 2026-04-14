import mongoose, { Schema, models, model } from "mongoose";

// Two types of insight the system can store:
// "qa"          — a user asked a question and got an AI answer
// "action_plan" — the user generated their personal action plan
export type InsightType = "qa" | "action_plan";

// The financial situation at the time the action plan was generated.
// Matches the three states computed in the advice route.
export type FinancialSituation = "deficit" | "cautious" | "healthy";

export interface InsightDoc {
  userId: string;

  type: InsightType;

  // ── Q&A fields (used when type === "qa") ──────────────────────────────
  question?: string;  // the question the user clicked
  answer?: string;    // the AI-generated paragraph response

  // ── Action plan fields (used when type === "action_plan") ─────────────
  summary?: string;           // one-sentence situation summary
  steps?: string[];           // array of numbered step texts
  situation?: FinancialSituation; // which financial state triggered this plan

  createdAt?: Date;
  updatedAt?: Date;
}

const InsightSchema = new Schema<InsightDoc>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // indexed so we can quickly fetch all insights for a user
    },

    type: {
      type: String,
      enum: ["qa", "action_plan"],
      required: true,
    },

    // Q&A fields — optional because action_plan rows won't have them
    question: {
      type: String,
      required: false,
      trim: true,
    },
    answer: {
      type: String,
      required: false,
    },

    // Action plan fields — optional because qa rows won't have them
    summary: {
      type: String,
      required: false,
    },
    steps: {
      type: [String], // array of strings, one per action step
      required: false,
      default: undefined, // don't default to [] on qa rows
    },
    situation: {
      type: String,
      enum: ["deficit", "cautious", "healthy"],
      required: false,
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt, same as Transaction and User
  }
);

// Prevent model overwrite on Next.js hot reload — same pattern as all other models
export const Insight =
  models.Insight || model<InsightDoc>("Insight", InsightSchema);