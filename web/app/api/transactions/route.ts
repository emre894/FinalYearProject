import { connectMongo } from "@/lib/mongoose";
import { Transaction } from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

const TransactionInputSchema = z.object({
  date: z.string(), // Convert to Date before saving
  description: z.string().min(1),
  amount: z.number(),
  category: z.string().optional(),
  source: z.enum(["csv", "manual"]),
  batchId: z.string().min(1),
});

const PostBodySchema = z.object({
  transactions: z.array(TransactionInputSchema).min(1),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
    const batchId = searchParams.get("batchId");
    const month = searchParams.get("month"); // Format: YYYY-MM

    await connectMongo();

    const query: any = { userId: session.user.id };

    if (batchId) {
      query.batchId = batchId;
    }

    if (month) {
      const isValid = /^\d{4}-\d{2}$/.test(month);

      if (!isValid) {
        return Response.json(
          { ok: false, message: "Invalid month format. Use YYYY-MM." },
          { status: 400 }
        );
      }

      // Build the date range for the selected month
      const [year, monthNum] = month.split("-").map(Number);
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 1);

      query.date = { $gte: start, $lt: end };
    }

    const docs = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return Response.json({ ok: true, count: docs.length, transactions: docs });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = PostBodySchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { ok: false, message: "Invalid request body", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectMongo();

    // Always take userId from the session
    const docsToInsert = parsed.data.transactions.map((t) => ({
      userId: session.user.id,
      date: new Date(t.date),
      description: t.description,
      amount: t.amount,
      category: t.category ?? "Unknown",
      source: t.source,
      batchId: t.batchId,
    }));

    const inserted = await Transaction.insertMany(docsToInsert, { ordered: false });

    return Response.json({ ok: true, insertedCount: inserted.length });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Delete all transactions for this user
    const result = await Transaction.deleteMany({ userId: session.user.id });

    return Response.json({
      ok: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} transactions deleted`,
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}