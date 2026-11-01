"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  points: { day: string; weight_kg: number }[];
};

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function WeightChart({ points }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="day"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#bfb2c3", fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            tickFormatter={(v: number) => v.toFixed(0)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#bfb2c3", fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number) => [`${v} kg`, "Weight"]}
            labelFormatter={shortDate}
            contentStyle={{
              background: "#211a2a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff7f1",
            }}
          />
          <Line
            type="monotone"
            dataKey="weight_kg"
            stroke="#ffb48f"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ffb48f", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
