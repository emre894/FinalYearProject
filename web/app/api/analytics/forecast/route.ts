import { connectMongo } from "@/lib/mongoose";
import { Transaction } from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ML_API_URL = process.env.ML_API_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "All";

    await connectMongo();

    // Get all expense transactions for this user
    const transactions = await Transaction.find({
      userId: session.user.id,
      amount: { $lt: 0 },
    })
      .sort({ date: 1 })
      .lean();

    if (transactions.length === 0) {
      return Response.json({ ok: true, forecast: null, message: "No expense data found" });
    }

    // Group monthly totals
    const monthlyTotals: Record<string, number> = {};

    for (const tx of transactions) {
      if (category !== "All" && tx.category !== category) {
        continue;
      }

      const monthKey = tx.date.toISOString().slice(0, 7);
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] ?? 0) + Math.abs(tx.amount);
    }

    const sortedMonths = Object.keys(monthlyTotals).sort();
    const historicalAmounts = sortedMonths.map((m) => monthlyTotals[m]);

    if (historicalAmounts.length === 0) {
      return Response.json({ ok: true, forecast: null, message: "No data for this category" });
    }

    const mlResponse = await fetch(`${ML_API_URL}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, historical_amounts: historicalAmounts }),
    });

    if (!mlResponse.ok) {
      return Response.json({ ok: false, message: "ML service error" }, { status: 502 });
    }

    const mlData = await mlResponse.json();

    return Response.json({
      ok: true,
      category,
      months: sortedMonths,
      historical_amounts: historicalAmounts,
      wma_prediction: mlData.wma_prediction,
      linear_regression_prediction: mlData.linear_regression_prediction,
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}