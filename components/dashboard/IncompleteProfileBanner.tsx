import { AlertCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  percentage: number;
};

export function IncompleteProfileBanner({ percentage }: Props) {
  return (
    <div
      role="status"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden />
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-text-primary">Finish setting up your profile</h2>
          <p className="text-sm text-text-secondary">
            Your profile is {percentage}% complete. Complete it to get accurate job matches.
          </p>
        </div>
      </div>
      <Link
        href="/profile"
        className="rounded-md bg-accent px-4 py-2 text-center text-sm font-medium text-accent-foreground hover:bg-accent-dark"
      >
        Complete Profile
      </Link>
    </div>
  );
}
