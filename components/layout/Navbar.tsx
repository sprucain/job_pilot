import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/components/layout/SignOutButton";

type Props = {
  isAuthenticated: boolean;
  activeRoute?: string;
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/find-jobs", label: "Find Jobs" },
  { href: "/profile", label: "Profile" },
];

export function Navbar({ isAuthenticated, activeRoute }: Props) {
  return (
    <header className="h-16 w-full border-b border-border bg-surface">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="JobPilot"
            width={496}
            height={168}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const isActive = isAuthenticated && link.href === activeRoute;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "text-sm font-medium text-accent"
                    : "text-sm font-medium text-text-dark hover:text-accent"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {!isAuthenticated && (
          <Link
            href="/login"
            className="rounded-md bg-overlay-dark px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Start for free
          </Link>
        )}

        {isAuthenticated && <SignOutButton />}
      </div>
    </header>
  );
}
