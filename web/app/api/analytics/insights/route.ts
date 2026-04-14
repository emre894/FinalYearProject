import { connectMongo } from "@/lib/mongoose";
import { Transaction } from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Insight } from "@/models/Insight";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helper: group transactions by month ─────────────────────────────────────
// Takes all transactions and returns an object like:
// { "2026-01": 450.20, "2026-02": 380.00 }
function groupByMonth(transactions: any[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue; // skip income
    const month = new Date(tx.date).toISOString().slice(0, 7);
    result[month] = (result[month] ?? 0) + Math.abs(tx.amount);
  }
  return result;
}

// ─── Helper: group transactions by category ───────────────────────────────────
// Returns an object like: { "Groceries": 234.50, "Transport": 45.00 }
function groupByCategory(transactions: any[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue; // skip income
    const cat = tx.category ?? "Unknown";
    result[cat] = (result[cat] ?? 0) + Math.abs(tx.amount);
  }
  return result;
}

// ─── Helper: compute all deterministic facts ──────────────────────────────────
// This is the core of the insights system. It takes all transactions and
// returns a structured object of facts that both the frontend cards and
// the OpenAI prompt will use.
function computeFacts(transactions: any[]) {
  const expenses = transactions.filter((tx) => tx.amount < 0);
  const income = transactions.filter((tx) => tx.amount >= 0);

  const totalSpent = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalIncome = income.reduce((sum, tx) => sum + tx.amount, 0);
  const netBalance = totalIncome - totalSpent;

  // Category breakdown
  const byCategory = groupByCategory(transactions);
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const topCategory = categoryEntries[0] ?? ["None", 0];
  const categoryCount = categoryEntries.length;

  // Monthly breakdown
  const byMonth = groupByMonth(transactions);
  const sortedMonths = Object.keys(byMonth).sort();
  const monthCount = sortedMonths.length;

  // Month-on-month change (only meaningful if we have at least 2 months)
  let monthOnMonthChange: number | null = null;
  let lastMonth = "";
  let previousMonth = "";
  if (sortedMonths.length >= 2) {
    lastMonth = sortedMonths[sortedMonths.length - 1];
    previousMonth = sortedMonths[sortedMonths.length - 2];
    const last = byMonth[lastMonth];
    const prev = byMonth[previousMonth];
    monthOnMonthChange = Math.round(((last - prev) / prev) * 100);
  }

  // Biggest single expense
  const biggestExpense = expenses.reduce(
    (max, tx) => (Math.abs(tx.amount) > Math.abs(max.amount) ? tx : max),
    expenses[0] ?? null
  );

  // Spending spike: any transaction more than 2x the average expense
  const avgExpense = totalSpent / (expenses.length || 1);
  const spikes = expenses.filter((tx) => Math.abs(tx.amount) > avgExpense * 2);

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    topCategory: topCategory[0],
    topCategoryAmount: Math.round((topCategory[1] as number) * 100) / 100,
    topCategoryPercent: Math.round(((topCategory[1] as number) / totalSpent) * 100),
    categoryCount,
    categoryBreakdown: categoryEntries.map(([name, amount]) => ({
      name,
      amount: Math.round((amount as number) * 100) / 100,
      percent: Math.round(((amount as number) / totalSpent) * 100),
    })),
    monthCount,
    monthOnMonthChange,
    lastMonth,
    previousMonth,
    biggestExpenseDescription: biggestExpense?.description ?? "N/A",
    biggestExpenseAmount: biggestExpense
      ? Math.round(Math.abs(biggestExpense.amount) * 100) / 100
      : 0,
    biggestExpenseCategory: biggestExpense?.category ?? "Unknown",
    spikeCount: spikes.length,
    transactionCount: transactions.length,
    expenseCount: expenses.length,
  };
}

// ─── GET — return deterministic facts only ────────────────────────────────────
// Called when the page loads. No OpenAI involved.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const transactions = await Transaction.find({ userId: session.user.id })
      .sort({ date: -1 })
      .limit(500)
      .lean();

    if (transactions.length === 0) {
      return Response.json({ ok: true, facts: null, message: "No transactions found" });
    }

    const facts = computeFacts(transactions);
    return Response.json({ ok: true, facts });
  } catch (err: any) {
    return Response.json({ ok: false, message: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// ─── POST — generate an AI insight for a specific question ───────────────────
// Called when the user clicks a question button.
// Body: { question: string }
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const { question } = await request.json();
    if (!question) {
      return Response.json({ ok: false, message: "No question provided" }, { status: 400 });
    }

    await connectMongo();

    const transactions = await Transaction.find({ userId: session.user.id })
      .sort({ date: -1 })
      .limit(500)
      .lean();

    if (transactions.length === 0) {
      return Response.json({ ok: false, message: "No transactions to analyse" }, { status: 400 });
    }

    const facts = computeFacts(transactions);

    // Build the prompt — I give OpenAI the facts as context, then ask the question.
    // I tell it to only use the numbers we provide, not invent anything.
    const prompt = `
You are a helpful financial assistant analysing a user's personal spending data.
Use ONLY the facts below to answer the question. Do not invent numbers or assumptions.
Keep your response to 3-4 sentences, friendly and easy to understand for someone with no finance background.

FACTS:
- Total spent: £${facts.totalSpent}
- Total income: £${facts.totalIncome}
- Net balance: £${facts.netBalance}
- Top spending category: ${facts.topCategory} (£${facts.topCategoryAmount}, ${facts.topCategoryPercent}% of spending)
- Number of spending categories: ${facts.categoryCount}
- Category breakdown: ${facts.categoryBreakdown.map((c) => `${c.name}: £${c.amount} (${c.percent}%)`).join(", ")}
- Months of data: ${facts.monthCount}
- Month-on-month spending change: ${facts.monthOnMonthChange !== null ? `${facts.monthOnMonthChange}%` : "only one month of data"}
- Biggest single expense: ${facts.biggestExpenseDescription} (£${facts.biggestExpenseAmount}, category: ${facts.biggestExpenseCategory})
- Number of spending spikes (2x above average): ${facts.spikeCount}
- Total transactions: ${facts.transactionCount}

QUESTION: ${question}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.5,
    });

    const answer = completion.choices[0]?.message?.content ?? "Could not generate insight.";

    // Save this Q&A insight to the database so the user can see their history
    // We don't await this — if it fails, the user still gets their answer
    // This is called "fire and forget" — non-critical side effect
    Insight.create({
      userId: session.user.id,
      type: "qa",
      question,
      answer,
    }).catch((err) => console.error("Failed to save insight:", err));

    return Response.json({ ok: true, question, answer });
  } catch (err: any) {
    return Response.json({ ok: false, message: err?.message ?? "Unknown error" }, { status: 500 });
  }
}