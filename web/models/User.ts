// web/models/User.ts
import mongoose, { Schema, Model } from "mongoose";

// Define the User interface (minimal TypeScript)
interface IUser {
  email: string;
  passwordHash: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the User schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true, // MongoDB will enforce uniqueness
      lowercase: true, // Store emails in lowercase
      trim: true, // Remove whitespace
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Prevent model overwrite on hot reload (Next.js development)
// If the model already exists, use it; otherwise create a new one
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
