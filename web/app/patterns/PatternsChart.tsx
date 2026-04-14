"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface ChartCluster {
  shortLabel: string;
  average_amount: number;
  colour: string;
}

interface Props {
  data: ChartCluster[];
}

const fmt = (n: number) => `£${Number(n).toFixed(2)}`;

export default function PatternsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f3f4f6"
          vertical={false}
        />

        <XAxis
          dataKey="shortLabel"
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

        <Bar dataKey="average_amount" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.colour} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}