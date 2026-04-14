import { connectMongo } from "@/lib/mongoose";
import { Insight } from "@/models/Insight";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Returns the user's last 10 saved insights, newest first.
// Used to show insight history on the Insights page.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const insights = await Insight.find({ userId: session.user.id })
      .sort({ createdAt: -1 }) // newest first
      .limit(10)
      .lean();

    return Response.json({ ok: true, insights });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}