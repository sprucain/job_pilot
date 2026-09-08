import Image from "next/image";

type FeatureItemProps = {
  title: string;
  description: string;
  highlighted?: boolean;
};

function FeatureItem({ title, description, highlighted }: FeatureItemProps) {
  return (
    <div
      className={`border-t border-border py-6 first:border-t-0 first:pt-0 ${
        highlighted ? "border-l-2 border-l-accent pl-4" : ""
      }`}
    >
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </div>
  );
}

export function Features() {
  return (
    <section className="bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-24 px-8 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="mb-8 text-3xl font-bold leading-tight text-text-primary">
              Manage Your Job Search With Ease
            </h2>
            <FeatureItem
              highlighted
              title="Find jobs that actually fit"
              description="Search by title and location or paste a job link. Get matched roles you can quickly scan."
            />
            <FeatureItem
              title="Know the Company Before You Apply"
              description="Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence."
            />
            <FeatureItem
              title="Keep track of every application"
              description="Keep a clear view of every job you've found, tailored. Your activity and progress all stay in one simple place."
            />
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-surface-secondary p-8">
            <Image
              src="/images/jobs-lists.png"
              alt="Jobs matched with scores and salary estimates"
              width={2364}
              height={1778}
              className="h-auto w-full"
              sizes="(min-width: 768px) 560px, 100vw"
            />
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="order-2 flex items-center justify-center rounded-2xl bg-surface-secondary p-8 md:order-1">
            <Image
              src="/images/agnet-log.png"
              alt="JobPilot agent activity log"
              width={2144}
              height={1656}
              className="h-auto w-full"
              sizes="(min-width: 768px) 560px, 100vw"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="mb-8 text-3xl font-bold leading-tight text-text-primary">
              Apply With More Confidence, Every Time
            </h2>
            <FeatureItem
              title="Understand your match score"
              description="See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what's missing."
            />
            <FeatureItem
              highlighted
              title="AI-Powered Job Matching"
              description="Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter."
            />
            <FeatureItem
              title="Focus on the right roles"
              description="Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
