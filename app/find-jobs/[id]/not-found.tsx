import { SearchX } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function JobNotFound() {
  return (
    <>
      <Navbar isAuthenticated activeRoute="/find-jobs" />
      <main className="flex flex-1 items-center justify-center bg-background px-4 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <SearchX className="h-6 w-6 text-text-muted" />
          <h1 className="text-lg font-semibold text-text-primary">Job not found</h1>
          <p className="text-sm text-text-muted">This job doesn&apos;t exist or isn&apos;t in your list.</p>
          <Link href="/find-jobs" className="mt-2 text-sm font-medium text-accent hover:text-accent-dark">
            Back to Jobs
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
