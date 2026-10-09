import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CompanyResearch } from "@/components/job-details/CompanyResearch";
import { JobActions } from "@/components/job-details/JobActions";
import { JobDescription } from "@/components/job-details/JobDescription";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchScore } from "@/components/job-details/MatchScore";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";
import { JOB_DETAIL_COLUMNS, mapJobRowToDetail, type JobDetailRow } from "@/lib/job-mapping";

type Props = {
  params: Promise<{ id: string }>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function JobDetailsPage({ params }: Props) {
  const { id } = await params;

  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) redirect("/login");

  // A non-UUID id would make Postgres error on the uuid column instead of returning no rows.
  if (!UUID_PATTERN.test(id)) notFound();

  const { data: row, error } = await insforge.database
    .from("jobs")
    .select(JOB_DETAIL_COLUMNS)
    .eq("id", id)
    .eq("user_id", data.user.id)
    .maybeSingle<JobDetailRow>();

  if (error) throw new Error(`Failed to load job: ${error.message}`);
  if (!row) notFound();

  const job = mapJobRowToDetail(row);

  return (
    <>
      <Navbar isAuthenticated activeRoute="/find-jobs" />
      <main className="flex-1 bg-background">
        <div className="mx-auto flex max-w-[844px] flex-col gap-6 px-4 py-8 sm:px-8">
          <Link
            href="/find-jobs"
            className="flex w-fit items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          <JobInfo job={job} />
          <MatchScore job={job} />
          <JobDescription description={job.description} jobPostUrl={job.jobPostUrl} />
          <CompanyResearch company={job.company} />
          <JobActions company={job.company} applyUrl={job.applyUrl} />
        </div>
      </main>
      <Footer />
    </>
  );
}
