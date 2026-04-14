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

    await connectMongo();

    // Fetch all transactions for pattern detection (expenses only, up to 500)
    const transactions = await Transaction.find({
      userId: session.user.id,
      amount: { $lt: 0 },
    })
      .sort({ date: -1 })
      .limit(500)
      .lean();

    if (transactions.length < 5) {
      return Response.json({
        ok: true,
        clusters: [],
        message: "Not enough transactions to detect patterns (minimum 5 needed)",
      });
    }

    // Shape the data exactly as FastAPI /patterns expects
    const payload = transactions.map((tx) => ({
      amount: tx.amount,
      date: tx.date.toISOString().slice(0, 10), // "YYYY-MM-DD"
      description: tx.description,
      category: tx.category ?? "Unknown",
    }));

    // Call FastAPI
    const mlResponse = await fetch(`${ML_API_URL}/patterns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: payload }),
    });

    if (!mlResponse.ok) {
      return Response.json({ ok: false, message: "ML service error" }, { status: 502 });
    }

    const mlData = await mlResponse.json();

    return Response.json({
      ok: true,
      clusters: mlData.clusters,
      message: mlData.message,
    });
  } catch (err: any) {
    return Response.json({ ok: false, message: err?.message ?? "Unknown error" }, { status: 500 });
  }
}