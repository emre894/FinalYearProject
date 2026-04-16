"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Transaction {
  _id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  source: "csv" | "manual";
  batchId: string;
}

interface ForecastData {
  category: string;
  months: string[];
  historical_amounts: number[];
  wma_prediction: number;
  linear_regression_prediction: number;
}

interface PatternCluster {
  cluster_id: number;
  transaction_count: number;
  average_amount: number;
  common_day: string;
  common_month: string;
  common_category: string;
  week_pattern: string;
  pattern_label: string;
}

interface DashboardClientProps {
  userEmail: string;
}

// Format money values as pounds
const fmt = (amount: number) => `£${Math.abs(amount).toFixed(2)}`;

// Format dates as YYYY-MM-DD
const fmtDate = (dateString: string) => {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

// Give each pattern card a matching colour
const patternColour = (label: string) => {
  if (label.includes("Weekend") && label.includes("High")) {
    return "bg-red-50 border-red-200";
  }
  if (label.includes("Weekend")) {
    return "bg-orange-50 border-orange-200";
  }
  if (label.includes("High")) {
    return "bg-yellow-50 border-yellow-200";
  }
  return "bg-blue-50 border-blue-200";
};

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  // Transaction summary state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [net, setNet] = useState(0);

  // Forecast state
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");

  // Pattern state
  const [patterns, setPatterns] = useState<PatternCluster[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [patternsMessage, setPatternsMessage] = useState("");

  // Load transactions and summary values
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/transactions?limit=200");
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.message || "Failed to load transactions");
          return;
        }

        setTransactions(data.transactions);
        setTotalCount(data.count);

        let spent = 0;
        let income = 0;

        data.transactions.forEach((tx: Transaction) => {
          if (tx.amount < 0) {
            spent += Math.abs(tx.amount);
          } else {
            income += tx.amount;
          }
        });

        setTotalSpent(spent);
        setTotalIncome(income);
        setNet(income - spent);
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Load forecast preview
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setForecastLoading(true);

        const res = await fetch("/api/analytics/forecast?category=All");
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setForecastError(data.message ?? "Forecast unavailable");
          return;
        }

        // No prediction yet is not a real error
        if (!data.wma_prediction && data.message) {
          setForecastError(data.message);
          return;
        }

        setForecast(data);
      } catch {
        setForecastError("Could not reach forecasting service.");
      } finally {
        setForecastLoading(false);
      }
    };

    fetchForecast();
  }, []);

  // Load pattern preview
  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setPatternsLoading(true);

        const res = await fetch("/api/analytics/patterns");
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setPatternsMessage(data.message ?? "Patterns unavailable");
          return;
        }

        setPatterns(data.clusters ?? []);

        if (data.clusters?.length === 0) {
          setPatternsMessage(data.message ?? "No patterns found");
        }
      } catch {
        setPatternsMessage("Could not reach pattern detection service.");
      } finally {
        setPatternsLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && totalCount === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-gray-700 font-medium mb-4">No transactions yet</p>
          <p className="text-sm text-gray-500 mb-6">Upload a CSV file to get started</p>
          <Link
            href="/upload"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Transactions
          </Link>
        </div>
      )}

      {!loading && !error && totalCount > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-700">{fmt(totalIncome)}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-red-700">{fmt(totalSpent)}</p>
            </div>

            <div
              className={`border rounded-lg p-4 ${
                net >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">Net</p>
              <p
                className={`text-2xl font-bold ${
                  net >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {fmt(net)}
              </p>
            </div>
          </div>

          {/* Forecast preview */}
          <section className="mb-8">
            <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Next Month Spending Forecast
                </h2>
                <p className="text-sm text-gray-500">
                  Predicted overall spending for next month, based on your transaction
                  history.
                </p>
              </div>

              <Link
                href="/forecast"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                View full forecast
              </Link>
            </div>

            {forecastLoading && (
              <p className="text-sm text-gray-500">Calculating forecast...</p>
            )}

            {!forecastLoading && forecastError && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                {forecastError}
              </div>
            )}

            {!forecastLoading && !forecastError && forecast && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Based on</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {forecast.months.length} month{forecast.months.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {forecast.months[0]} → {forecast.months[forecast.months.length - 1]}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Weighted Average Forecast</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {fmt(forecast.wma_prediction)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Smoothed estimate, weights recent months more
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Trend-Based Forecast</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {fmt(forecast.linear_regression_prediction)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Projects your spending trend forward
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Pattern preview */}
          <section className="mb-8">
            <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Spending Patterns
                </h2>
                <p className="text-sm text-gray-500">
                  Your transactions have been grouped into behavioural clusters by our ML
                  model.
                </p>
              </div>

              <Link
                href="/patterns"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                View full patterns
              </Link>
            </div>

            {patternsLoading && (
              <p className="text-sm text-gray-500">Detecting patterns...</p>
            )}

            {!patternsLoading && patternsMessage && patterns.length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                {patternsMessage}
              </div>
            )}

            {!patternsLoading && patterns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {patterns.map((cluster) => (
                  <div
                    key={cluster.cluster_id}
                    className={`border rounded-lg p-4 ${patternColour(cluster.pattern_label)}`}
                  >
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                      {cluster.pattern_label}
                    </p>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Transactions:</span>{" "}
                        {cluster.transaction_count}
                      </p>
                      <p>
                        <span className="font-medium">Avg amount:</span>{" "}
                        {fmt(cluster.average_amount)}
                      </p>
                      <p>
                        <span className="font-medium">Top category:</span>{" "}
                        {cluster.common_category}
                      </p>
                      <p>
                        <span className="font-medium">Common day:</span>{" "}
                        {cluster.common_day}
                      </p>
                      <p>
                        <span className="font-medium">Common month:</span>{" "}
                        {cluster.common_month}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Latest transactions */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Transactions</h2>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date", "Description", "Amount", "Category", "Source"].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {fmtDate(tx.date)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tx.description}
                      </td>

                      <td
                        className={`px-4 py-3 text-sm font-medium ${
                          tx.amount < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {tx.amount < 0 ? "-" : "+"}
                        {fmt(tx.amount)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tx.category || "Unknown"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {tx.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}