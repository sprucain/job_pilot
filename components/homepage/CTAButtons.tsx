"use client";

import Link from "next/link";
import posthog from "posthog-js";

type Props = {
  href: string;
};

export function CTAButtons({ href }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={href}
        className="flex items-center gap-1.5 rounded-md bg-overlay-dark px-4 py-2 text-sm font-medium text-accent-foreground"
        onClick={() =>
          posthog.capture("cta_clicked", { button_label: "Get Started", destination: href })
        }
      >
        Get Started
        <span aria-hidden>▸</span>
      </Link>
      <Link
        href={href}
        className="rounded-md bg-accent-light px-4 py-2 text-sm font-medium text-text-primary"
        onClick={() =>
          posthog.capture("cta_clicked", { button_label: "Find Your First Match", destination: href })
        }
      >
        Find Your First Match
      </Link>
    </div>
  );
}
