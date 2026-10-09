import type { DashboardStat } from "@/lib/dashboard-stats";

type Props = {
  stat: DashboardStat;
};

const trendClasses = {
  up: "bg-success-lightest text-success-darker",
  down: "bg-error/10 text-error",
  flat: "bg-surface-secondary text-text-secondary",
};

export function StatCard({ stat }: Props) {
  return (
    <div className="flex w-full flex-col gap-1 self-start rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
      <p className="text-3xl font-semibold text-text-primary">{stat.value}</p>
      {"trend" in stat ? (
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${trendClasses[stat.trendTone]}`}>
            {stat.trend}
          </span>
          <span className="text-xs text-text-secondary">{stat.trendLabel}</span>
        </div>
      ) : (
        <p className="mt-1 text-xs text-text-muted">{stat.caption}</p>
      )}
    </div>
  );
}
