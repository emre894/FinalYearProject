import mongoose, { Schema, Model } from "mongoose";

// Define the Export interface
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
      index: true,
    },
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["manual"],
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
    timestamps: true,
  }
);

// Reuse the model during hot reload in development
const Export: Model<IExport> =
  mongoose.models.Export || mongoose.model<IExport>("Export", exportSchema);

export default Export;