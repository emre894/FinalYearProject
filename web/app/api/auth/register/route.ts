import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const body = await request.json();
    const { email, password, name } = body;

    // Check email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check password
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Stop duplicate accounts
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      email: cleanEmail,
      passwordHash,
      name: name || undefined,
    });

    await user.save();

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Registration error:", error.message);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}