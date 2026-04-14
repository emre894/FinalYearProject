"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryBreakdownItem {
  name: string;
  amount: number;
  percent: number;
}

interface Facts {
  totalSpent: number;
  totalIncome: number;
  netBalance: number;
  topCategory: string;
  topCategoryAmount: number;
  topCategoryPercent: number;
  categoryCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
  monthCount: number;
  monthOnMonthChange: number | null;
  lastMonth: string;
  previousMonth: string;
  biggestExpenseDescription: string;
  biggestExpenseAmount: number;
  biggestExpenseCategory: string;
  spikeCount: number;
  transactionCount: number;
  expenseCount: number;
}

interface ActionStep {
  step: number;
  text: string;
}

// ─── Question buttons ─────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    label: "Why did my spending change?",
    question:
      "Based on my spending data, explain why my spending may have changed and what the main drivers are.",
  },
  {
    label: "What is my biggest financial risk?",
    question:
      "Based on my spending data, what is my biggest financial risk and why?",
  },
  {
    label: "How can I improve my budget?",
    question:
      "Based on my spending data, give me 2-3 practical suggestions to improve my budgeting.",
  },
  {
    label: "Am I spending too much on one category?",
    question:
      "Based on my spending data, am I over-spending in any particular category compared to a balanced budget?",
  },
  {
    label: "Explain my spending spikes",
    question:
      "Based on my spending data, explain any unusual spending spikes and whether I should be concerned.",
  },
  {
    label: "What are my healthy financial habits?",
    question:
      "Based on my spending data, identify any positive financial habits and areas I am doing well in.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `£${Math.abs(n).toFixed(2)}`;

const changeColour = (change: number | null) => {
  if (change === null) return "bg-gray-100 text-gray-600";
  if (change > 0) return "bg-red-100 text-red-700";
  return "bg-green-100 text-green-700";
};

const categoryColour = (name: string): string => {
  const colours = [
    "#8b5cf6",
    "#3b82f6",
    "#10b981",
    "#f97316",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#eab308",
  ];
  return colours[name.charCodeAt(0) % colours.length];
};

const parseSteps = (text: string): ActionStep[] => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+\./.test(l));

  return lines.map((line, i) => ({
    step: i + 1,
    text: line.replace(/^\d+\.\s*/, ""),
  }));
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InsightsClient() {
  const [facts, setFacts] = useState<Facts | null>(null);
  const [factsLoading, setFactsLoading] = useState(true);
  const [factsError, setFactsError] = useState("");

  const [actionSteps, setActionSteps] = useState<ActionStep[]>([]);
  const [actionSummary, setActionSummary] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const fetchFacts = async () => {
      try {
        const res = await fetch("/api/analytics/insights");
        const data = await res.json();

        if (!res.ok || !data.ok || !data.facts) {
          setFactsError(
            data.message ?? "Upload some transactions to see your insights."
          );
          return;
        }

        setFacts(data.facts);
      } catch {
        setFactsError("Could not reach the server.");
      } finally {
        setFactsLoading(false);
      }
    };

    fetchFacts();
  }, []);

  const handleGenerateActionPlan = async () => {
    if (actionLoading) return;
    setActionSteps([]);
    setActionSummary("");
    setActionError("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/analytics/advice");
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setActionError(data.message ?? "Could not generate action plan.");
        return;
      }

      setActionSummary(data.summary);
      setActionSteps(parseSteps(data.steps));
    } catch {
      setActionError("Could not reach the AI service.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuestion = async (label: string, question: string) => {
    if (activeQuestion === label && aiAnswer) {
      setActiveQuestion(null);
      setAiAnswer(null);
      return;
    }

    setActiveQuestion(label);
    setAiAnswer(null);
    setAiError("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/analytics/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setAiError(data.message ?? "Could not generate insight");
        return;
      }

      setAiAnswer(data.answer);
    } catch {
      setAiError("Could not reach the AI service.");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (factsLoading) {
    return (
      <p className="text-gray-500 text-sm mt-8">
        Analysing your transactions...
      </p>
    );
  }

  if (factsError) {
    return (
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
        {factsError}
      </div>
    );
  }

  if (!facts) return null;

  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Insights</h1>
        <p className="text-gray-500 text-sm max-w-2xl">
          Your financial data has been analysed by our system. Facts below are
          calculated directly from your transactions. The AI assistant explains
          and advises based only on those facts — it never invents numbers.
        </p>
      </div>

      {/* ── 1. Financial Summary cards ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Your Financial Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div
            className={`border rounded-lg p-4 ${
              facts.netBalance >= 0
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p className="text-xs text-gray-500 uppercase mb-1">Net Balance</p>
            <p
              className={`text-2xl font-bold ${
                facts.netBalance >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {fmt(facts.netBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {facts.netBalance >= 0
                ? "You are spending within your income"
                : "You are spending more than your income"}
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">
              Top Spending Category
            </p>
            <p className="text-2xl font-bold text-purple-700">
              {facts.topCategory}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {fmt(facts.topCategoryAmount)} —{" "}
              {facts.topCategoryPercent}% of all spending
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">
              Month-on-Month Change
            </p>
            {facts.monthOnMonthChange !== null ? (
              <>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-lg font-bold ${changeColour(
                    facts.monthOnMonthChange
                  )}`}
                >
                  {facts.monthOnMonthChange > 0 ? "+" : ""}
                  {facts.monthOnMonthChange}%
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  {facts.previousMonth} → {facts.lastMonth}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Need at least 2 months of data
              </p>
            )}
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">
              Biggest Single Expense
            </p>
            <p className="text-2xl font-bold text-orange-700">
              {fmt(facts.biggestExpenseAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {facts.biggestExpenseDescription} · {facts.biggestExpenseCategory}
            </p>
          </div>

          <div
            className={`border rounded-lg p-4 ${
              facts.spikeCount > 0
                ? "bg-yellow-50 border-yellow-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-xs text-gray-500 uppercase mb-1">
              Spending Spikes Detected
            </p>
            <p
              className={`text-2xl font-bold ${
                facts.spikeCount > 0 ? "text-yellow-700" : "text-gray-600"
              }`}
            >
              {facts.spikeCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Transactions more than 2× your average expense
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">
              Spending Categories
            </p>
            <p className="text-2xl font-bold text-blue-700">
              {facts.categoryCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Across {facts.expenseCount} expense transactions
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Ask the AI Assistant ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Ask the AI Assistant
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Select a question below. The AI will explain your spending using your
          transaction facts. Click the same button again to dismiss the answer.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {QUESTIONS.map(({ label, question }) => (
            <button
              key={label}
              onClick={() => handleQuestion(label, question)}
              disabled={aiLoading}
              className={`cursor-pointer text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors
                ${
                  activeQuestion === label
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300"
                }
                ${aiLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {(aiLoading || aiAnswer || aiError) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-indigo-500 uppercase">
                AI Response — {activeQuestion}
              </p>
              {!aiLoading && aiAnswer && (
                <button
                  onClick={() => {
                    setActiveQuestion(null);
                    setAiAnswer(null);
                  }}
                  className="cursor-pointer text-xs text-indigo-400 hover:text-indigo-600 underline"
                >
                  Ask another question
                </button>
              )}
            </div>

            {aiLoading && (
              <p className="text-sm text-gray-500">
                Generating insight, please wait...
              </p>
            )}
            {aiError && <p className="text-sm text-red-600">{aiError}</p>}
            {!aiLoading && aiAnswer && (
              <p className="text-sm text-gray-800 leading-relaxed">{aiAnswer}</p>
            )}

            <p className="text-xs text-gray-400 mt-4">
              This insight is generated by AI based on your transaction data. It
              is for informational purposes only and does not constitute
              financial advice.
            </p>
          </div>
        )}
      </section>

      {/* ── 3. Personal Action Plan ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-800">
            Your Personal Action Plan
          </h2>
          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
            AI Generated
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Click the button below to generate a personalised financial action
          plan based on your transaction data.
        </p>

        {!actionSummary && !actionLoading && (
          <button
            onClick={handleGenerateActionPlan}
            className="cursor-pointer px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ✦ Generate My Action Plan
          </button>
        )}

        {actionLoading && (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">
              Generating your action plan...
            </p>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {actionError}
          </div>
        )}

        {!actionLoading && actionSummary && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {/* Summary pill */}
            <div className="flex items-start gap-3 mb-5 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <span className="text-indigo-500 mt-0.5">✦</span>
              <p className="text-sm font-medium text-indigo-800 leading-relaxed">
                {actionSummary}
              </p>
            </div>

            {/* Step cards */}
            <div className="space-y-3">
              {actionSteps.map((s) => (
                <div
                  key={s.step}
                  className="flex items-start gap-4 rounded-lg p-4 border border-gray-100 bg-gray-50"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                    {s.step}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {s.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                AI-generated advice based on your transaction data. Not
                professional financial advice.
              </p>
              <button
                onClick={handleGenerateActionPlan}
                className="cursor-pointer text-xs text-indigo-500 hover:text-indigo-700 underline ml-4"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 4. Spending by Category ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Spending by Category
        </h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Category", "Amount", "Share", "Visual"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facts.categoryBreakdown.map((cat) => (
                <tr key={cat.name}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {fmt(cat.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {cat.percent}%
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: categoryColour(cat.name),
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}