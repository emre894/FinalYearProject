import { connectMongo } from "@/lib/mongoose";
import { Transaction } from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

const TransactionInputSchema = z.object({
  date: z.string(), // we'll convert to Date
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
    const month = searchParams.get("month"); // optional — format: "YYYY-MM"

    await connectMongo();

    const query: any = { userId: session.user.id };

    // Apply batchId filter if provided
    if (batchId) query.batchId = batchId;

    // Apply month filter if provided and valid
    // We check it matches "YYYY-MM" format before using it
    if (month) {
      const isValid = /^\d{4}-\d{2}$/.test(month);
      if (!isValid) {
        return Response.json(
          { ok: false, message: "Invalid month format. Use YYYY-MM." },
          { status: 400 }
        );
      }

      // Build a date range for the first and last day of that month
      const [year, monthNum] = month.split("-").map(Number);
      const start = new Date(year, monthNum - 1, 1);  // first day
      const end = new Date(year, monthNum, 1);          // first day of next month

      // $gte means "greater than or equal", $lt means "less than"
      // Together they select everything within the month
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

    // attach userId from session so it cannot be spoofed from client
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

// ── DELETE — remove all transactions for the authenticated user ───────────────
// User ID comes from session only — never from the request body
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Delete every transaction belonging to this user
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