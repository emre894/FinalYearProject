"use client";

import { useEffect, useState } from "react";

interface Transaction {
  _id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  source: "csv" | "manual";
}

interface CategoryRow {
  name: string;
  amount: number;
  percent: number;
}

// Format money values
const fmt = (n: number) => `£${Math.abs(n).toFixed(2)}`;

// Convert YYYY-MM into a readable month label
const formatMonth = (ym: string): string => {
  const [year, month] = ym.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);

  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

// Format dates for the exported CSV file
const formatDate = (dateString: string): string => {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
};

// Escape CSV values that contain commas, quotes, or new lines
const escapeCSV = (value: string | number): string => {
  const str = String(value);

  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

// Build the CSV file and trigger a download in the browser
const downloadCSV = (transactions: Transaction[], month: string) => {
  const header = ["Date", "Description", "Amount", "Category", "Source"];

  const rows = transactions.map((tx) => [
    escapeCSV(formatDate(tx.date)),
    escapeCSV(tx.description),
    escapeCSV(tx.amount),
    escapeCSV(tx.category),
    escapeCSV(tx.source),
  ]);

  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `monthly-report-${month}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Build a category summary using expense transactions only
const getCategoryBreakdown = (transactions: Transaction[]): CategoryRow[] => {
  const expenses = transactions.filter((tx) => tx.amount < 0);
  const totalSpent = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const byCategory: Record<string, number> = {};

  for (const tx of expenses) {
    const cat = tx.category || "Unknown";
    byCategory[cat] = (byCategory[cat] ?? 0) + Math.abs(tx.amount);
  }

  return Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
      percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }));
};

export default function ReportsClient() {
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthsLoading, setMonthsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the months that exist in the user's data
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const res = await fetch("/api/analytics/months");
        const data = await res.json();

        if (data.ok && data.months.length > 0) {
          setAvailableMonths(data.months);

          // Select the most recent month by default
          setSelectedMonth(data.months[0]);
        }
      } catch {
        setError("Could not load available months.");
      } finally {
        setMonthsLoading(false);
      }
    };

    fetchMonths();
  }, []);

  // Load that month's transactions whenever the month changes
  useEffect(() => {
    if (!selectedMonth) return;

    const fetchTransactions = async () => {
      setLoading(true);
      setError("");
      setTransactions([]);

      try {
        const res = await fetch(
          `/api/transactions?month=${selectedMonth}&limit=500`
        );
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.message ?? "Could not load transactions.");
          return;
        }

        setTransactions(data.transactions);
      } catch {
        setError("Could not load transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedMonth]);

  // Work out the summary values for the selected month
  const income = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const spent = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const net = income - spent;
  const categoryBreakdown = getCategoryBreakdown(transactions);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Monthly Reports
        </h1>
        <p className="text-gray-500 text-sm max-w-2xl">
          Select a month to view a summary of your transactions. You can also
          download a CSV file of that month&apos;s transactions.
        </p>
      </div>

      {/* Show this if the user has no months at all */}
      {!monthsLoading && availableMonths.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
          No transaction data found. Upload some transactions to get started.
        </div>
      )}

      {/* Month selector */}
      {!monthsLoading && availableMonths.length > 0 && (
        <section className="mb-8">
          <label
            htmlFor="month-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Month
          </label>

          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </section>
      )}

      {/* Loading state */}
      {loading && (
        <p className="text-sm text-gray-500">Loading transactions...</p>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
          {error}
        </div>
      )}

      {/* Main report view */}
      {!loading && !error && transactions.length > 0 && (
        <>
          {/* Summary cards */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {formatMonth(selectedMonth)} Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {fmt(income)}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Total Spent
                </p>
                <p className="text-2xl font-bold text-red-700">{fmt(spent)}</p>
              </div>

              <div
                className={`border rounded-lg p-4 ${
                  net >= 0
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Net Balance
                </p>
                <p
                  className={`text-2xl font-bold ${
                    net >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {fmt(net)}
                </p>
              </div>
            </div>
          </section>

          {/* Expense breakdown by category */}
          {categoryBreakdown.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Spending by Category
              </h2>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Category", "Amount", "Share"].map((heading) => (
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
                    {categoryBreakdown.map((cat) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* CSV export */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Export Transactions
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Download all transactions for {formatMonth(selectedMonth)} as a
              CSV file. Includes date, description, amount, category, and
              source.
            </p>

            <button
              onClick={() => downloadCSV(transactions, selectedMonth)}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Download CSV — {formatMonth(selectedMonth)}
            </button>
          </section>
        </>
      )}

      {/* No transactions for the chosen month */}
      {!loading && !error && transactions.length === 0 && selectedMonth && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
          No transactions found for {formatMonth(selectedMonth)}.
        </div>
      )}
    </div>
  );
}