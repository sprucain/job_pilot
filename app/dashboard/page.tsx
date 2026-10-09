import { redirect } from "next/navigation";

import { IncompleteProfileBanner } from "@/components/dashboard/IncompleteProfileBanner";
import { JobsOverTimeChart } from "@/components/dashboard/JobsOverTimeChart";
import { MatchDistributionChart } from "@/components/dashboard/MatchDistributionChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ResearchActivityChart } from "@/components/dashboard/ResearchActivityChart";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import {
  MOCK_JOBS_OVER_TIME,
  MOCK_RESEARCH_ACTIVITY,
  MOCK_SCORE_DISTRIBUTION,
} from "@/lib/dashboard-mock";
import { loadDashboardStats } from "@/lib/dashboard-stats";
import { loadRecentActivity } from "@/lib/recent-activity";
import { createInsforgeServer } from "@/lib/insforge-server";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { getCurrentUserProfile } from "@/lib/profile-server";

export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const { user, profile } = await getCurrentUserProfile(insforge);
  if (!user) redirect("/login");

  const completion = computeProfileCompletion(profile);
  const [stats, activity] = await Promise.all([
    loadDashboardStats(insforge, user.id),
    loadRecentActivity(insforge, user.id),
  ]);

  return (
    <>
      <Navbar isAuthenticated activeRoute="/dashboard" />
      <main className="flex-1 bg-background">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-8 py-8">
          {completion.missingFields.length > 0 && (
            <IncompleteProfileBanner percentage={completion.percentage} />
          )}

          {stats ? (
            <StatsBar stats={stats} />
          ) : (
            <p role="alert" className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
              Couldn&apos;t load your stats. Please refresh and try again.
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RecentActivity entries={activity} />
            <ResearchActivityChart data={MOCK_RESEARCH_ACTIVITY} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <JobsOverTimeChart data={MOCK_JOBS_OVER_TIME} />
            <MatchDistributionChart data={MOCK_SCORE_DISTRIBUTION} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
