"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { WeightPoint } from "@/lib/api-vita";

import { formatDate, formatNumber, useAppT } from "./i18n";

const BRAND = "rgb(20 153 111)";

export default function WeightChart({ points, goal }: { points: WeightPoint[]; goal?: number | null }) {
  const { t, locale } = useAppT();
  const values = points.map((p) => p.weight_kg).concat(goal ? [goal] : []);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);

  return (
    <div className="h-64 w-full" role="img" aria-label={`${t.progress.weight}: ${points.map((p) => `${p.day} ${p.weight_kg}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.22} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(230 225 214)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={(d: string) => formatDate(d, locale, { day: "numeric", month: "short" })}
            tick={{ fontSize: 12, fill: "rgb(138 148 142)" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis domain={[min, max]} tick={{ fontSize: 12, fill: "rgb(138 148 142)" }} axisLine={false} tickLine={false} width={44} />
          {goal != null && (
            <ReferenceLine
              y={goal}
              stroke="rgb(242 112 79)"
              strokeDasharray="5 5"
              label={{ value: `${t.bmi.goal} ${formatNumber(goal, locale, 1)}`, position: "insideTopRight", fontSize: 12, fill: "rgb(196 71 42)" }}
            />
          )}
          <Tooltip
            formatter={(v: number) => [`${formatNumber(v, locale, 1)} ${t.common.kg}`, t.progress.weight]}
            labelFormatter={(d: string) => formatDate(d, locale)}
            contentStyle={{ borderRadius: 14, border: "1px solid rgb(230 225 214)", boxShadow: "0 8px 24px -12px rgb(28 40 34 / 0.18)", fontSize: 13 }}
          />
          <Area type="monotone" dataKey="weight_kg" stroke={BRAND} strokeWidth={2.5} fill="url(#weightFill)" dot={{ r: 3, fill: BRAND, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
