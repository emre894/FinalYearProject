// web/app/upload/manual/ManualEntryClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface ManualEntryClientProps {
  userEmail: string;
}

// Transaction type for API
interface Transaction {
  date: string; // ISO string
  description: string;
  amount: number;
  source: "manual";
  batchId: string;
  category: string;
}

interface BillItem {
  id: string;
  name: string;
  enabled: boolean;
  amount: number;
  category: string;
}

export default function ManualEntryClient({ userEmail }: ManualEntryClientProps) {
  // Wizard step state (0-4)
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5;

  // Helper function to validate month format (YYYY-MM)
  const isValidMonth = (value: string): boolean => {
    return /^\d{4}-\d{2}$/.test(value);
  };

  // Step 0: Month/Year selection
  const [selectedMonth, setSelectedMonth] = useState("");

  // Step 1: Monthly Income
  const [monthlyIncome, setMonthlyIncome] = useState(2000);

  // Step 2: Fixed Bills (toggle + amount)
  const fixedBills: BillItem[] = [
    { id: "rent", name: "Rent", enabled: false, amount: 800, category: "Housing" },
    {
      id: "council_tax",
      name: "Council Tax",
      enabled: false,
      amount: 150,
      category: "Utilities & Bills",
    },
    {
      id: "electricity",
      name: "Electricity",
      enabled: false,
      amount: 80,
      category: "Utilities & Bills",
    },
    {
      id: "internet",
      name: "Internet",
      enabled: false,
      amount: 30,
      category: "Utilities & Bills",
    },
    {
      id: "netflix",
      name: "Netflix",
      enabled: false,
      amount: 10,
      category: "Subscriptions",
    },
    {
      id: "spotify",
      name: "Spotify",
      enabled: false,
      amount: 10,
      category: "Subscriptions",
    },
    {
      id: "gym",
      name: "Gym",
      enabled: false,
      amount: 40,
      category: "Subscriptions",
    },
  ];
  const [bills, setBills] = useState(fixedBills);

  // Step 3: Variable Spending
  const [groceries, setGroceries] = useState(300);
  const [transport, setTransport] = useState(100);
  const [foodDining, setFoodDining] = useState(150);
  const [shoppingRetail, setShoppingRetail] = useState(200);

  // Loading and success states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Update bill enabled state
  const toggleBill = (id: string) => {
    setBills(
      bills.map((bill) =>
        bill.id === id ? { ...bill, enabled: !bill.enabled } : bill
      )
    );
  };

  // Update bill amount
  const updateBillAmount = (id: string, amount: number) => {
    setBills(
      bills.map((bill) => (bill.id === id ? { ...bill, amount } : bill))
    );
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Generate transactions from wizard data
  const generateTransactions = (): Transaction[] => {
    const batchId = `manual-${Date.now()}`;
    const transactions: Transaction[] = [];

    if (!isValidMonth(selectedMonth)) {
      throw new Error("Invalid month format. Please select a valid month.");
    }

    // Parse selected month (YYYY-MM format)
    const [year, month] = selectedMonth.split("-").map(Number);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error("Invalid month values. Please select a valid month.");
    }

    // Income transaction (first day of month)
    transactions.push({
      date: new Date(year, month - 1, 1).toISOString(),
      description: "Monthly Income",
      amount: monthlyIncome,
      source: "manual",
      batchId,
      category: "Income",
    });

    // Fixed bills (5th of month)
    bills.forEach((bill) => {
      if (bill.enabled) {
        transactions.push({
          date: new Date(year, month - 1, 5).toISOString(),
          description: bill.name,
          amount: -bill.amount,
          source: "manual",
          batchId,
          category: bill.category,
        });
      }
    });

    // Variable spending (15th of month)
    if (groceries > 0) {
      transactions.push({
        date: new Date(year, month - 1, 15).toISOString(),
        description: "Groceries",
        amount: -groceries,
        source: "manual",
        batchId,
        category: "Groceries",
      });
    }

    if (transport > 0) {
      transactions.push({
        date: new Date(year, month - 1, 15).toISOString(),
        description: "Transportation",
        amount: -transport,
        source: "manual",
        batchId,
        category: "Transportation",
      });
    }

    if (foodDining > 0) {
      transactions.push({
        date: new Date(year, month - 1, 15).toISOString(),
        description: "Food & Dining",
        amount: -foodDining,
        source: "manual",
        batchId,
        category: "Food & Dining",
      });
    }

    if (shoppingRetail > 0) {
      transactions.push({
        date: new Date(year, month - 1, 15).toISOString(),
        description: "Shopping & Retail",
        amount: -shoppingRetail,
        source: "manual",
        batchId,
        category: "Shopping & Retail",
      });
    }

    return transactions;
  };

  // Generate CSV string from transactions
  const generateCSV = (transactions: Transaction[]): string => {
    const headers = ["date", "description", "amount", "category", "source", "batchId"];

    const escapeCSV = (field: string | number): string => {
      const str = String(field);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = transactions.map((tx) => {
      const date = new Date(tx.date);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      return [
        escapeCSV(dateStr),
        escapeCSV(tx.description),
        escapeCSV(tx.amount),
        escapeCSV(tx.category),
        escapeCSV(tx.source),
        escapeCSV(tx.batchId),
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  };

  // Handle confirm and save
  const handleConfirm = async () => {
    if (!selectedMonth || !isValidMonth(selectedMonth)) {
      setError("Please select a valid month (Format: YYYY-MM)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const transactions = generateTransactions();

      if (transactions.length === 0) {
        setError("No transactions to save. Please add at least one transaction.");
        setLoading(false);
        return;
      }

      const batchId = transactions[0].batchId;

      // POST to /api/transactions
      const txResponse = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions }),
      });

      const txData = await txResponse.json();

      if (!txResponse.ok) {
        setError(txData.message || "Failed to save transactions");
        setLoading(false);
        return;
      }

      // Generate CSV
      const csvContent = generateCSV(transactions);
      const filename = `manual-entry-${selectedMonth}.csv`;

      // POST to /api/exports
      const exportResponse = await fetch("/api/exports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId,
          type: "manual",
          filename,
          csvContent,
        }),
      });

      const exportData = await exportResponse.json();

      if (!exportResponse.ok) {
        setError(exportData.message || "Failed to save export");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "An error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Reset state for another entry
  const handleReset = () => {
    setCurrentStep(0);
    setSelectedMonth("");
    setMonthlyIncome(2000);
    setBills(fixedBills);
    setGroceries(300);
    setTransport(100);
    setFoodDining(150);
    setShoppingRetail(200);
    setSuccess(false);
    setError("");
    setLoading(false);
  };

  // Calculate totals for review step
  const calculateTotals = () => {
    const income = monthlyIncome;
    const billsTotal = bills
      .filter((b) => b.enabled)
      .reduce((sum, b) => sum + b.amount, 0);
    const variableTotal = groceries + transport + foodDining + shoppingRetail;
    const spent = billsTotal + variableTotal;
    const net = income - spent;

    return { income, spent, net, billsTotal, variableTotal };
  };

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Select Month
            </h2>
            <p className="text-gray-600">
              Choose the month for which you want to enter transactions
            </p>
            <div>
              <label
                htmlFor="month"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Month
              </label>
              <input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Format: YYYY-MM (e.g., 2026-01)
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Monthly Income
            </h2>
            <p className="text-gray-600">
              Set your monthly income for {selectedMonth || "the selected month"}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Income: £{monthlyIncome.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£0</span>
                <span>£10,000</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Fixed Bills
            </h2>
            <p className="text-gray-600">
              Toggle bills you pay and set their amounts
            </p>
            <div className="space-y-4">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bill.enabled}
                        onChange={() => toggleBill(bill.id)}
                        className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900">
                        {bill.name}
                      </span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {bill.category}
                    </span>
                  </div>
                  {bill.enabled && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Amount: £{bill.amount}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="10"
                        value={bill.amount}
                        onChange={(e) =>
                          updateBillAmount(bill.id, Number(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Variable Spending
            </h2>
            <p className="text-gray-600">
              Set your estimated spending in different categories
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Groceries: £{groceries}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={groceries}
                  onChange={(e) => setGroceries(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transportation: £{transport}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={transport}
                  onChange={(e) => setTransport(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food & Dining: £{foodDining}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={foodDining}
                  onChange={(e) => setFoodDining(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shopping & Retail: £{shoppingRetail}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={shoppingRetail}
                  onChange={(e) => setShoppingRetail(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        const totals = calculateTotals();
        const previewTransactions = generateTransactions();

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Review</h2>
            <p className="text-gray-600">
              Review your entries before saving. You can go back to make changes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-700">
                  £{totals.income.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-red-700">
                  £{totals.spent.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-4 border rounded-lg ${
                  totals.net >= 0
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className="text-sm text-gray-600 mb-1">Net</p>
                <p
                  className={`text-2xl font-bold ${
                    totals.net >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  £{totals.net.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Transactions to be created ({previewTransactions.length})
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewTransactions.map((tx, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tx.description}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium ${
                            tx.amount < 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {tx.amount < 0 ? "-" : "+"}£
                          {Math.abs(tx.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tx.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Success state
  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <p className="font-medium text-lg mb-2">
              Manual entry saved successfully!
            </p>
            <p className="text-sm">
              Transactions have been saved and exported to CSV.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              View Dashboard
            </Link>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-white text-green-600 font-medium rounded-lg border-2 border-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Start another manual entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main wizard UI
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-600">{userEmail}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-8 min-h-[400px]">{renderStep()}</div>

        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !isValidMonth(selectedMonth)) ||
                currentStep === totalSteps - 1
              }
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving..." : "Confirm & Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}