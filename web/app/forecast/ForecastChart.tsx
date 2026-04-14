"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartPoint {
  name: string;
  actual: number | null;
  wma: number | null;
  lr: number | null;
  connector: number | null;
}

interface Props {
  data: ChartPoint[];
}

const fmt = (n: number) => `£${Number(n).toFixed(2)}`;

export default function ForecastChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 20, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickFormatter={(v) => `£${v}`}
          axisLine={false}
          tickLine={false}
          width={70}
        />

        <Tooltip
          formatter={(value) => fmt(Number(value))}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        />

        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{
            fontSize: 12,
            paddingTop: 8,
            color: "#6b7280",
          }}
        />

        <Line
          type="monotone"
          dataKey="connector"
          name="Projection"
          stroke="#d1d5db"
          strokeWidth={1}
          strokeDasharray="4 4"
          dot={false}
          connectNulls={true}
          legendType="none"
        />

        <Line
          type="monotone"
          dataKey="actual"
          name="Actual Spending"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          connectNulls={false}
        />

        <Line
          type="monotone"
          dataKey="lr"
          name="Trend Forecast"
          stroke="#f97316"
          strokeWidth={0}
          dot={{ r: 7, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 8 }}
          connectNulls={false}
        />

        <Line
          type="monotone"
          dataKey="wma"
          name="WMA Forecast"
          stroke="#8b5cf6"
          strokeWidth={0}
          dot={{ r: 7, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 8 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}