import { connectMongo } from "@/lib/mongoose";
import { Transaction } from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Get all unique transaction dates for this user
    const dates = await Transaction.distinct("date", {
      userId: session.user.id,
    });

    // Convert each date into a "YYYY-MM" string and remove duplicates
    // e.g. 2026-01-15 becomes "2026-01"
    const monthSet = new Set<string>();
    for (const date of dates) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      monthSet.add(`${year}-${month}`);
    }

    // Sort most recent first
    const months = Array.from(monthSet).sort().reverse();

    return Response.json({ ok: true, months });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}