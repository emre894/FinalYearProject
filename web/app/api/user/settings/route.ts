import { connectMongo } from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return Response.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    return Response.json({
      ok: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name ?? "",
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    await connectMongo();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    // Update display name
    if (type === "name") {
      const { name } = body;

      if (!name || name.trim().length === 0) {
        return Response.json(
          { ok: false, message: "Name cannot be empty" },
          { status: 400 }
        );
      }

      user.name = name.trim();
      await user.save();

      return Response.json({ ok: true, message: "Name updated successfully" });
    }

    // Update password
    if (type === "password") {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return Response.json(
          { ok: false, message: "Both current and new password are required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return Response.json(
          { ok: false, message: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return Response.json(
          { ok: false, message: "Current password is incorrect" },
          { status: 400 }
        );
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();

      return Response.json({ ok: true, message: "Password updated successfully" });
    }

    return Response.json({ ok: false, message: "Invalid update type" }, { status: 400 });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}