import { connectMongo } from "@/lib/mongoose";
import { Transaction } from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Insight } from "@/models/Insight";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      return Response.json({ ok: false, message: "No transactions found" }, { status: 400 });
    }

    // Compute the facts we need for the prompt
    const expenses = transactions.filter((tx) => tx.amount < 0);
    const totalSpent = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalIncome = transactions
      .filter((tx) => tx.amount >= 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const netBalance = totalIncome - totalSpent;

    // Category breakdown
    const byCategory: Record<string, number> = {};
    for (const tx of expenses) {
      const cat = tx.category ?? "Unknown";
      byCategory[cat] = (byCategory[cat] ?? 0) + Math.abs(tx.amount);
    }
    const categoryList = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => `${name}: £${amount.toFixed(2)}`)
      .join(", ");

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const topCategoryPercent = Math.round((topCategory[1] / totalSpent) * 100);

    // Monthly totals for month-on-month context
    const byMonth: Record<string, number> = {};
    for (const tx of expenses) {
      const month = new Date(tx.date).toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + Math.abs(tx.amount);
    }
    const sortedMonths = Object.keys(byMonth).sort();
    const monthCount = sortedMonths.length;

    // Determine financial health situation for conditional prompt
    // Three situations: deficit, cautious, healthy
    const surplusRatio = netBalance / (totalIncome || 1);
    let situation = "";
    if (netBalance < 0) {
      situation = "deficit"; // spending more than income
    } else if (surplusRatio < 0.2) {
      situation = "cautious"; // saving less than 20% of income
    } else {
      situation = "healthy"; // saving 20%+ of income
    }

    // Build a conditional prompt based on situation
    // Each situation gets a different instruction so the advice is relevant
    const situationInstructions: Record<string, string> = {
      deficit: `The user is in a DEFICIT — spending more than their income. 
Focus your steps on reducing spending and identifying where cuts can be made. 
Reference the top categories specifically.`,
      cautious: `The user is in a CAUTIOUS position — they have a small surplus but not much buffer. 
Focus your steps on building an emergency fund and reducing the biggest spending categories.`,
      healthy: `The user is in a HEALTHY position — they have a good surplus. 
Acknowledge this positively, then give forward-looking advice about saving a specific monthly amount 
and considering where to put that surplus (emergency fund, savings goals). 
Do not tell them to cut spending unless one category is disproportionately high.`,
    };

    const prompt = `
You are a friendly personal finance assistant. Analyse this user's financial situation and give them a personal action plan.

FINANCIAL FACTS:
- Total income: £${totalIncome.toFixed(2)}
- Total spent: £${totalSpent.toFixed(2)}
- Net balance: £${netBalance.toFixed(2)} (${netBalance >= 0 ? "surplus" : "deficit"})
- Top spending category: ${topCategory[0]} (£${topCategory[1].toFixed(2)}, ${topCategoryPercent}% of spending)
- All categories: ${categoryList}
- Months of data: ${monthCount}
- Financial situation: ${situation}

INSTRUCTIONS:
${situationInstructions[situation]}

First, write ONE short sentence (under 20 words) summarising the user's financial situation. Label it exactly: SUMMARY: <your sentence>

Then write exactly 3 actionable steps. Each step must:
- Start with its number and a period (e.g. "1. ")
- Be one to two sentences
- Reference specific numbers from the facts above
- Be practical and easy to understand

Respond with ONLY the summary line and the 3 numbered steps. No extra text.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.4, // lower temperature = more consistent, structured output
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Parse the SUMMARY line out of the response
    const summaryMatch = raw.match(/SUMMARY:\s*(.+)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : "";

    // The rest is the numbered steps (parseSteps happens on the frontend)
    const steps = raw.replace(/SUMMARY:\s*.+/i, "").trim();

      // Parse steps into an array of strings for clean database storage
      // We reuse the same regex logic from the frontend's parseSteps function
      const stepStrings = steps
          .split("\n")
          .map((l: string) => l.trim())
          .filter((l: string) => /^\d+\./.test(l))
          .map((l: string) => l.replace(/^\d+\.\s*/, ""));

      // Save the action plan to the database
      Insight.create({
          userId: session.user.id,
          type: "action_plan",
          summary,
          steps: stepStrings,
          situation,
      }).catch((err) => console.error("Failed to save action plan:", err));

return Response.json({ ok: true, summary, steps, situation });

    return Response.json({ ok: true, summary, steps, situation });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}