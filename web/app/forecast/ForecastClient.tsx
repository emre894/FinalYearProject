"use client";

import { useState, useEffect } from "react";
import ForecastChart from "./ForecastChart";

interface ForecastResult {
  category: string;
  months: string[];
  historical_amounts: number[];
  wma_prediction: number;
  linear_regression_prediction: number;
}

interface ChartPoint {
  name: string;
  actual: number | null;
  wma: number | null;
  lr: number | null;
  connector: number | null;
}

const fmt = (n: number) => `£${Math.abs(n).toFixed(2)}`;

const shortMonth = (ym: string): string => {
  const [year, month] = ym.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
  });
};

const longMonth = (ym: string): string => {
  const [year, month] = ym.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

const getNextMonth = (lastMonth: string): string => {
  const [year, month] = lastMonth.split("-").map(Number);
  const next = new Date(year, month, 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const buildChartData = (result: ForecastResult): ChartPoint[] => {
  const historical: ChartPoint[] = result.months.map((month, index) => ({
    name: shortMonth(month),
    actual: result.historical_amounts[index],
    wma: null,
    lr: null,
    connector: result.historical_amounts[index],
  }));

  const nextMonth = getNextMonth(result.months[result.months.length - 1]);
  const midpoint =
    (result.wma_prediction + result.linear_regression_prediction) / 2;

  const forecastPoint: ChartPoint = {
    name: shortMonth(nextMonth),
    actual: null,
    wma: result.wma_prediction,
    lr: result.linear_regression_prediction,
    connector: midpoint,
  };

  return [...historical, forecastPoint];
};

export default function ForecastClient() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/analytics/categories");
        const data = await res.json();
        if (data.ok) {
          setCategories(data.categories);
        }
      } catch {
        // Keep dropdown usable even if categories fail to load
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchForecast = async () => {
      setForecastLoading(true);
      setForecastError("");
      setForecast(null);

      try {
        const res = await fetch(
          `/api/analytics/forecast?category=${encodeURIComponent(selectedCategory)}`
        );
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setForecastError(data.message ?? "Could not load forecast.");
          return;
        }

        if (!data.months || data.months.length < 3) {
          setForecastError(
            "Not enough history yet to produce a reliable forecast. At least 3 months of data is needed."
          );
          return;
        }

        setForecast(data);
      } catch {
        setForecastError("Could not reach the forecasting service.");
      } finally {
        setForecastLoading(false);
      }
    };

    fetchForecast();
  }, [selectedCategory]);

  const chartData = forecast ? buildChartData(forecast) : [];

  const forecastMonthLabel = forecast
    ? longMonth(getNextMonth(forecast.months[forecast.months.length - 1]))
    : "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Spending Forecast
        </h1>
        <p className="text-gray-500 text-sm max-w-2xl leading-6">
          Select a spending category to see a forecast for next month based on
          your transaction history. All expenses are used when no category is
          selected.
        </p>
      </div>

      <section className="mb-8">
        <label
          htmlFor="category-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Category
        </label>

        <div className="relative w-full md:max-w-md">
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={categoriesLoading}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="All">All Expenses Combined</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </section>

      {forecastLoading && (
        <p className="text-sm text-gray-500">Calculating forecast...</p>
      )}

      {!forecastLoading && forecastError && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          {forecastError}
        </div>
      )}

      {!forecastLoading && !forecastError && forecast && (
        <>
          <section className="mb-8">
            <h2 className="mb-1 text-lg font-semibold text-gray-800">
              Historical Spending &amp; Forecast
            </h2>
            <p className="mb-4 text-sm text-gray-400">
              Blue line shows actual monthly spending. Purple and orange points
              show next month estimates. The dashed grey line connects the last
              recorded month to the predictions.
            </p>

            <div className="rounded-xl border border-gray-100 bg-white p-3 sm:p-4">
              <ForecastChart data={chartData} />
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Next Month Predictions
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-xs uppercase text-gray-500">
                  Forecasting for
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {forecastMonthLabel}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Based on {forecast.months.length} months of data
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-xs uppercase text-gray-500">
                  Data range
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {shortMonth(forecast.months[0])} →{" "}
                  {shortMonth(forecast.months[forecast.months.length - 1])}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Monthly expense totals used
                </p>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="mb-1 text-xs uppercase text-gray-500">
                  Weighted Average
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  {fmt(forecast.wma_prediction)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Recent months weighted more
                </p>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="mb-1 text-xs uppercase text-gray-500">
                  Trend Forecast
                </p>
                <p className="text-2xl font-bold text-orange-700">
                  {fmt(forecast.linear_regression_prediction)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Based on overall spending trend
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Forecasts are estimates based on past monthly spending and may
              change as more data is added.
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              How do these predictions work?
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              The{" "}
              <span className="font-medium text-purple-700">
                Weighted Moving Average
              </span>{" "}
              focuses more on recent months, giving them a higher weight than
              older ones. The{" "}
              <span className="font-medium text-orange-600">
                Trend Forecast
              </span>{" "}
              fits a straight line through all your historical data and extends
              it forward. Showing both gives you a smoothed estimate and a
              trend-based estimate side by side.
            </p>
          </section>
        </>
      )}
    </div>
  );
}