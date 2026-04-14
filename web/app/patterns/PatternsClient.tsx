"use client";

import { useEffect, useState } from "react";
import PatternsChart from "./PatternsChart";

interface Cluster {
  cluster_id: number;
  transaction_count: number;
  average_amount: number;
  common_day: string;
  common_month: string;
  common_category: string;
  week_pattern: string;
  pattern_label: string;
}

interface ChartCluster {
  shortLabel: string;
  average_amount: number;
  colour: string;
}

const fmt = (n: number) => `£${Math.abs(n).toFixed(2)}`;

const cardColour = (label: string): string => {
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

const barColour = (label: string): string => {
  if (label.includes("Weekend") && label.includes("High")) return "#f87171";
  if (label.includes("Weekend")) return "#fb923c";
  if (label.includes("High")) return "#facc15";
  return "#60a5fa";
};

const shortLabel = (label: string): string => {
  const day = label.includes("Weekend") ? "Weekend" : "Weekday";

  if (label.includes("High")) return `${day} / High`;
  if (label.includes("Medium")) return `${day} / Medium`;
  if (label.includes("Small")) return `${day} / Small`;

  return day;
};

export default function PatternsClient() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const res = await fetch("/api/analytics/patterns");
        const data = await res.json();

        if (!res.ok) {
          setError(data?.message ?? "Could not load patterns.");
          return;
        }

        if (!Array.isArray(data?.clusters) || data.clusters.length === 0) {
          setError(
            "Not enough transaction history yet to detect meaningful patterns."
          );
          return;
        }

        setClusters(data.clusters);
      } catch {
        setError("Could not reach the pattern detection service.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  const chartData: ChartCluster[] = clusters.map((cluster) => ({
    shortLabel: shortLabel(cluster.pattern_label),
    average_amount: cluster.average_amount,
    colour: barColour(cluster.pattern_label),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Spending Patterns
        </h1>
        <p className="max-w-2xl text-sm text-gray-500 leading-6">
          Your transactions have been grouped into behavioural clusters using a
          machine learning model. Each cluster represents a distinct pattern in
          how and when you spend.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Detecting spending patterns...</p>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          {error}
        </div>
      )}

      {!loading && !error && clusters.length > 0 && (
        <>
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Detected Patterns
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {clusters.map((cluster) => (
                <div
                  key={cluster.cluster_id}
                  className={`rounded-lg border p-5 ${cardColour(cluster.pattern_label)}`}
                >
                  <p className="mb-4 text-sm font-semibold text-gray-800">
                    {cluster.pattern_label}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between gap-3">
                      <span>Transactions</span>
                      <span className="font-medium text-gray-800">
                        {cluster.transaction_count}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Avg amount</span>
                      <span className="font-medium text-gray-800">
                        {fmt(cluster.average_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Top category</span>
                      <span className="text-right font-medium text-gray-800">
                        {cluster.common_category}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Common day</span>
                      <span className="font-medium text-gray-800">
                        {cluster.common_day}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Common month</span>
                      <span className="font-medium text-gray-800">
                        {cluster.common_month}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-1 text-lg font-semibold text-gray-800">
              Average Spend by Cluster
            </h2>
            <p className="mb-4 text-xs text-gray-400">
              Each bar represents the average transaction amount within that
              spending pattern.
            </p>

            <div className="rounded-xl border border-gray-100 bg-white p-3 sm:p-4">
              <PatternsChart data={chartData} />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              How does pattern detection work?
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              K-Means clustering groups similar transactions together based on
              shared characteristics such as spending amount, day of the week,
              and month. This helps the system identify common spending
              behaviours in your data without you having to label them manually.
              The three groups shown above represent the most distinct patterns
              found in your transaction history.
            </p>
          </section>
        </>
      )}
    </div>
  );
}