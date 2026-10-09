"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHART_AXIS_TICK, CHART_GRID_STROKE, CHART_TOOLTIP_STYLE } from "@/lib/chart-theme";
import type { ChartPoint } from "@/lib/dashboard-mock";

type Props = {
  data: ChartPoint[];
};

export function JobsOverTimeChart({ data }: Props) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] lg:col-span-2">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold text-text-primary">Jobs Found Over Time</h2>
        <span className="text-xs text-text-muted">Sample data</span>
      </div>
      <div className="h-[300px]" role="img" aria-label="Area chart of jobs found per day (sample data)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="jobs-over-time-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={CHART_AXIS_TICK}
              tickMargin={12}
              padding={{ left: 0, right: 0 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              tick={CHART_AXIS_TICK}
              width={40}
            />
            <Tooltip cursor={false} contentStyle={CHART_TOOLTIP_STYLE} />
            <Area
              type="monotone"
              dataKey="value"
              name="Jobs found"
              stroke="var(--color-accent)"
              strokeWidth={3}
              fill="url(#jobs-over-time-fill)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-accent)", stroke: "var(--color-surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
