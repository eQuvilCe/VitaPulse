"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  title: string;
  data: { day: string; value: number | null }[];
  unit: string;
  color?: string;
};

function weekday(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en", { weekday: "short" });
}

export default function WeekChart({ title, data, unit, color = "#86d9c2" }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">{title}</h2>
      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="day"
              tickFormatter={weekday}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#bfb2c3", fontSize: 11 }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#bfb2c3", fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              formatter={(v: number) => [`${v} ${unit}`, title]}
              labelFormatter={weekday}
              contentStyle={{
                background: "#211a2a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff7f1",
              }}
            />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
