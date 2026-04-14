// web/models/Export.ts
import mongoose, { Schema, Model } from "mongoose";

// Define the Export interface (minimal TypeScript)
interface IExport {
  userId: string;
  batchId: string;
  type: "manual";
  filename: string;
  csvContent: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the Export schema
const exportSchema = new Schema<IExport>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Indexed for faster queries by user
    },
    batchId: {
      type: String,
      required: true,
      index: true, // Indexed for faster queries by batch
    },
    type: {
      type: String,
      required: true,
      enum: ["manual"], // Only manual for now
    },
    filename: {
      type: String,
      required: true,
    },
    csvContent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Prevent model overwrite on hot reload (Next.js development)
// If the model already exists, use it; otherwise create a new one
const Export: Model<IExport> =
  mongoose.models.Export || mongoose.model<IExport>("Export", exportSchema);

export default Export;
