import type { ActivityEntry, ActivityTone } from "@/lib/recent-activity";

type Props = {
  entries: ActivityEntry[] | null;
};

const dotClasses: Record<ActivityTone, { ring: string; dot: string }> = {
  info: { ring: "bg-info-light", dot: "bg-info" },
  success: { ring: "bg-success-light", dot: "bg-success-alt" },
};

export function RecentActivity({ entries }: Props) {
  return (
    <section className="flex flex-col rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="border-b border-border px-6 py-5 text-base font-semibold text-text-primary">
        Recent Activity
      </h2>

      {entries === null ? (
        <p role="alert" className="p-6 text-sm text-error">
          Couldn&apos;t load your recent activity. Please refresh and try again.
        </p>
      ) : entries.length === 0 ? (
        <p className="p-6 text-sm text-text-muted">
          No activity yet. Run a job search to get started.
        </p>
      ) : (
        <ul className="flex flex-col p-6">
          {entries.map((entry, index) => {
            const isLast = index === entries.length - 1;
            const classes = dotClasses[entry.tone];
            return (
              <li key={entry.id} className={`relative pl-9 ${isLast ? "" : "pb-6"}`}>
                <span
                  aria-hidden
                  className={`absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${classes.ring}`}
                >
                  <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
                </span>
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-[7px] top-[26px] w-0.5 bg-border"
                  />
                )}
                <p className="text-sm font-medium text-text-primary">{entry.message}</p>
                <p className="mt-1 text-xs text-text-muted">{entry.timeAgo}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
