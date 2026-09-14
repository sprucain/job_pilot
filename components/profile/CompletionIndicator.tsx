import { AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
  percentage: number;
  missingFields: { key: string; label: string }[];
};

const RADIUS = 52;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CompletionIndicator({ percentage, missingFields }: Props) {
  const offset = CIRCUMFERENCE * (1 - percentage / 100);
  const isComplete = missingFields.length === 0;
  const ringColorClass = isComplete ? "text-success" : "text-error";
  const ringTrackColorClass = isComplete ? "text-success/15" : "text-error/15";

  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
          ) : (
            <AlertCircle className="h-5 w-5 text-error" aria-hidden />
          )}
          <h2 className="text-base font-semibold text-text-primary">
            {isComplete ? "Profile complete" : "Profile needs attention"}
          </h2>
        </div>
        <p className="text-sm text-text-secondary">
          {isComplete
            ? "Your profile has everything needed for tailored matches and quality resumes."
            : "Complete the missing fields to improve your chance of getting tailored matches and generating quality resumes."}
        </p>
        {missingFields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <span
                key={field.key}
                className="rounded-full bg-error/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-error"
              >
                {field.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <svg
        width={128}
        height={128}
        viewBox="0 0 128 128"
        className="shrink-0 -rotate-90"
        role="img"
        aria-label={`Profile ${percentage}% complete`}
      >
        <circle
          cx={64}
          cy={64}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          className={ringTrackColorClass}
        />
        <circle
          cx={64}
          cy={64}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={ringColorClass}
        />
        <text
          x={64}
          y={64}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 fill-text-primary text-2xl font-bold"
          style={{ transformOrigin: "64px 64px" }}
        >
          {percentage}%
        </text>
      </svg>
    </div>
  );
}
