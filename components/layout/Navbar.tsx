import { LayoutDashboard, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/components/layout/SignOutButton";

type Props = {
  isAuthenticated: boolean;
  activeRoute?: string;
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/find-jobs", label: "Find Jobs", Icon: Search },
  { href: "/profile", label: "Profile", Icon: User },
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

        <nav className={`hidden items-center md:flex ${isAuthenticated ? "ml-auto mr-4 h-full gap-2" : "gap-8"}`}>
          {navLinks.map(({ href, label, Icon }) => {
            const isActive = isAuthenticated && href === activeRoute;
            if (!isAuthenticated) {
              return (
                <Link key={href} href={href} className="text-sm font-medium text-text-dark hover:text-accent">
                  {label}
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex h-full items-center gap-2 px-4 text-sm font-medium ${
                  isActive ? "text-accent" : "text-text-dark hover:text-accent"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "" : "text-text-muted"}`} aria-hidden />
                {label}
                {isActive && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
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
