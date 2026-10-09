import { StatCard } from "@/components/dashboard/StatCard";
import type { DashboardStat } from "@/lib/dashboard-stats";

type Props = {
  stats: DashboardStat[];
};

export function StatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
