"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHART_AXIS_TICK, CHART_GRID_STROKE, CHART_TOOLTIP_STYLE } from "@/lib/chart-theme";
import type { ChartPoint } from "@/lib/dashboard-mock";

type Props = {
  data: ChartPoint[];
};

export function ResearchActivityChart({ data }: Props) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold text-text-primary">Company Research Activity</h2>
        <span className="text-xs text-text-muted">Sample data</span>
      </div>
      <div className="min-h-[300px] flex-1" role="img" aria-label="Bar chart of companies researched per day (sample data)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} tickMargin={12} />
            <YAxis
              domain={[0, 12]}
              ticks={[0, 3, 6, 9, 12]}
              tickLine={false}
              axisLine={false}
              tick={CHART_AXIS_TICK}
              width={40}
            />
            <Tooltip cursor={false} contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="value" name="Companies" fill="var(--color-info)" barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
