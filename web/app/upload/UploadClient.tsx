// web/app/upload/UploadClient.tsx
"use client";

import { useState } from "react";
import Papa from "papaparse";
import Link from "next/link";

// Type for a parsed transaction row
interface ParsedTransaction {
  date: string; // ISO string
  description: string;
  amount: number;
  source: "csv";
  batchId: string;
  category?: string;
}

// Type for validation result
interface ValidationResult {
  valid: ParsedTransaction[];
  rejected: Array<{ row: number; reason: string }>;
}

interface UploadClientProps {
  userEmail: string;
  userId: string;
}

export default function UploadClient({ userEmail }: UploadClientProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validTransactions, setValidTransactions] = useState<ParsedTransaction[]>([]);
  const [rejectedRows, setRejectedRows] = useState<Array<{ row: number; reason: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Map flexible CSV headers to our required fields
  const findColumnIndex = (headers: string[], variants: string[]): number => {
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
    for (const variant of variants) {
      const index = lowerHeaders.indexOf(variant.toLowerCase());
      if (index !== -1) return index;
    }
    return -1;
  };

  const hasWord = (text: string, word: string): boolean => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  };

  // Baseline categorisation (rule-based)
  const categorize = (description: string): string | null => {
    const d = description.toLowerCase();

    // Groceries
    if (
      d.includes("tesco") ||
      d.includes("sainsbury") ||
      d.includes("asda") ||
      d.includes("lidl") ||
      d.includes("aldi") ||
      d.includes("waitrose") ||
      d.includes("morrisons") ||
      d.includes("co op") ||
      d.includes("coop")
    ) {
      return "Groceries";
    }

    // Transportation
    if (
      hasWord(d, "tfl") ||
      hasWord(d, "uber") ||
      hasWord(d, "bolt") ||
      hasWord(d, "train") ||
      hasWord(d, "rail") ||
      hasWord(d, "bus") ||
      hasWord(d, "oyster") ||
      hasWord(d, "petrol") ||
      hasWord(d, "shell") ||
      hasWord(d, "esso") ||
      hasWord(d, "bp")
    ) {
      return "Transportation";
    }

    // Food & Dining
    if (
      d.includes("pret") ||
      d.includes("starbucks") ||
      d.includes("costa") ||
      d.includes("mcdonald") ||
      d.includes("kfc") ||
      d.includes("restaurant") ||
      d.includes("cafe") ||
      d.includes("deliveroo") ||
      d.includes("ubereats") ||
      d.includes("just eat") ||
      d.includes("takeaway")
    ) {
      return "Food & Dining";
    }

    // Subscriptions
    if (
      d.includes("netflix") ||
      d.includes("spotify") ||
      d.includes("amazon prime") ||
      d.includes("prime video") ||
      d.includes("disney") ||
      d.includes("apple.com/bill") ||
      d.includes("google") ||
      d.includes("youtube premium")
    ) {
      return "Subscriptions";
    }

    // Shopping & Retail
    if (
      d.includes("amazon") ||
      d.includes("ebay") ||
      d.includes("asos") ||
      d.includes("zara") ||
      d.includes("hm") ||
      d.includes("h&m") ||
      d.includes("nike") ||
      d.includes("adidas")
    ) {
      return "Shopping & Retail";
    }

    // Housing
    if (
      d.includes("rent") ||
      d.includes("landlord") ||
      d.includes("mortgage")
    ) {
      return "Housing";
    }

    // Utilities & Bills
    if (
      d.includes("council tax") ||
      d.includes("electric") ||
      d.includes("electricity") ||
      d.includes("gas") ||
      d.includes("water") ||
      d.includes("internet") ||
      d.includes("wifi") ||
      d.includes("broadband") ||
      d.includes("phone bill") ||
      d.includes("mobile bill")
    ) {
      return "Utilities & Bills";
    }

    // Income
    if (
      d.includes("salary") ||
      d.includes("payroll") ||
      d.includes("wage") ||
      d.includes("refund") ||
      d.includes("payout") ||
      d.includes("cash dep") ||
      d.includes("dividend")
    ) {
      return "Income";
    }

    // Transfers
    if (
      d.includes("bank transfer") ||
      d.includes("payment to friend") ||
      d.includes("send money") ||
      d.includes("transfer to") ||
      d.includes("monzo payment to") ||
      d.includes("revolut send") ||
      d.includes("splitwise")
    ) {
      return "Transfers";
    }

    // Savings & Investments
    if (
      d.includes("savings account") ||
      d.includes("isa deposit") ||
      d.includes("investment contribution") ||
      d.includes("vanguard") ||
      d.includes("trading212") ||
      d.includes("freetrade")
    ) {
      return "Savings & Investments";
    }

    return null;
  };

  const categorizeWithML = async (description: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/analytics/categorise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
  
      if (!response.ok) return null;
  
      const data = await response.json();
      return data.category ?? null;
    } catch {
      return null;
    }
  };

  // Parse and validate CSV data
  const parseCSV = async (csvText: string): Promise<ValidationResult> => {
    const valid: ParsedTransaction[] = [];
    const rejected: Array<{ row: number; reason: string }> = [];
    const batchId = `csv-${Date.now()}`;

    const result = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors.length > 0 && result.data.length === 0) {
      rejected.push({ row: 0, reason: "CSV parsing failed" });
      return { valid, rejected };
    }

    const rows = result.data ?? [];
    if (rows.length === 0) {
      rejected.push({ row: 0, reason: "CSV file is empty" });
      return { valid, rejected };
    }

    const headers = Object.keys(rows[0] || {});
    if (headers.length === 0) {
      rejected.push({ row: 0, reason: "CSV headers could not be read" });
      return { valid, rejected };
    }

    // Find column indices using flexible mapping
    const dateIndex = findColumnIndex(headers, [
      "date",
      "transaction date",
      "posted date",
    ]);
    const descIndex = findColumnIndex(headers, [
      "description",
      "merchant",
      "name",
      "details",
    ]);
    const amountIndex = findColumnIndex(headers, [
      "amount",
      "value",
      "transaction amount",
    ]);

    // Check if required columns exist
    if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
      rejected.push({
        row: 0,
        reason: "Missing required columns (date, description, amount)",
      });
      return { valid, rejected };
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2; // header is row 1

      const dateHeader = headers[dateIndex];
      const descHeader = headers[descIndex];
      const amountHeader = headers[amountIndex];

      const dateValue = String(row?.[dateHeader] ?? "").trim();
      const descValue = String(row?.[descHeader] ?? "").trim();
      const amountValue = String(row?.[amountHeader] ?? "").trim();

      if (!dateValue || !descValue || !amountValue) {
        rejected.push({ row: rowNum, reason: "Missing required fields" });
        continue;
      }

      let dateISO: string;
      try {
        let dateObj: Date | null = null;

        // Try DD/MM/YYYY or DD-MM-YYYY (common UK bank export format)
        const dmyMatch = dateValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmyMatch) {
          const day = parseInt(dmyMatch[1], 10);
          const month = parseInt(dmyMatch[2], 10);
          const year = parseInt(dmyMatch[3], 10);
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            dateObj = new Date(Date.UTC(year, month - 1, day));
          }
        }

        // Try YYYY-MM-DD or YYYY/MM/DD (ISO-like)
        if (!dateObj) {
          const isoMatch = dateValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
          if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10);
            const day = parseInt(isoMatch[3], 10);
            dateObj = new Date(Date.UTC(year, month - 1, day));
          }
        }

        // Last resort: native Date (handles formats like "Jan 01 2026")
        if (!dateObj) {
          dateObj = new Date(dateValue);
        }

        if (!dateObj || isNaN(dateObj.getTime())) {
          rejected.push({ row: rowNum, reason: "Invalid date" });
          continue;
        }
        dateISO = dateObj.toISOString();
      } catch {
        rejected.push({ row: rowNum, reason: "Invalid date" });
        continue;
      }

      let amountNum: number;
      try {
        const cleaned = amountValue.replace(/[£$,\s]/g, "");
        amountNum = parseFloat(cleaned);
        if (isNaN(amountNum)) {
          rejected.push({ row: rowNum, reason: "Invalid amount" });
          continue;
        }
      } catch {
        rejected.push({ row: rowNum, reason: "Invalid amount" });
        continue;
      }

      let finalCategory = categorize(descValue);
      if (!finalCategory) {
        finalCategory = await categorizeWithML(descValue);
      }

      valid.push({
        date: dateISO,
        description: descValue,
        amount: amountNum,
        source: "csv",
        batchId,
        category: finalCategory ?? "Other / Unknown",
      });
    }

    return { valid, rejected };
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setSuccess(false);
    setError("");
    setValidTransactions([]);
    setRejectedRows([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setError("Could not read file contents.");
          return;
        }

        const result = await parseCSV(text);
        setValidTransactions(result.valid);
        setRejectedRows(result.rejected);
      } catch (err) {
        console.error("File parse error:", err);
        setError("Failed to parse CSV file.");
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
    };

    reader.readAsText(selectedFile);
  };

  // Handle import
  const handleImport = async () => {
    if (validTransactions.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: validTransactions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to import transactions");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Reset component state for uploading another file
  const handleReset = () => {
    setFile(null);
    setValidTransactions([]);
    setRejectedRows([]);
    setSuccess(false);
    setError("");
    setLoading(false);

    const fileInput = document.getElementById("csv-file") as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload</h1>

      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">Logged in as:</p>
        <p className="font-medium text-gray-900">{userEmail}</p>
      </div>

      <div className="mb-6">
        <label
          htmlFor="csv-file"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select CSV File
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-2 text-sm text-gray-500">
          Required columns: date, description, amount (case-insensitive)
        </p>
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected file: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <p className="font-medium mb-4">Transactions imported successfully!</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-center"
            >
              View Dashboard
            </Link>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-white text-green-600 font-medium rounded-lg border-2 border-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Upload another file
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {validTransactions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Preview (first 10 rows)
          </h2>
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
                {validTransactions.slice(0, 10).map((tx, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {tx.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {tx.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {tx.category ?? "Other / Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(validTransactions.length > 0 || rejectedRows.length > 0) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium text-green-600">
              Valid rows: {validTransactions.length}
            </span>
          </p>
          {rejectedRows.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-600 mb-1">
                Rejected rows: {rejectedRows.length}
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {rejectedRows.slice(0, 5).map((rejected, idx) => (
                  <li key={idx}>
                    Row {rejected.row}: {rejected.reason}
                  </li>
                ))}
                {rejectedRows.length > 5 && (
                  <li>... and {rejectedRows.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleImport}
          disabled={validTransactions.length === 0 || loading}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Importing..." : "Import transactions"}
        </button>
      </div>
    </div>
  );
}