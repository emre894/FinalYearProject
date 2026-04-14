// web/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongo();

    // Parse request body
    const body = await request.json();
    const { email, password, name } = body;

    // Validate email is present
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate password length >= 8
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs (10 rounds is a good default)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || undefined, // Only include name if provided
    });

    // Save to MongoDB
    await user.save();

    // Return success (no user data for security)
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Log error but don't expose sensitive details
    console.error("Registration error:", error.message);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
