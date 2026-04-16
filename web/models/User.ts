// web/models/User.ts
import mongoose, { Schema, Model } from "mongoose";

// Define the User interface
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

// Reuse the model during hot reload in development
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
