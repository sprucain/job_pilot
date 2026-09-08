import { CTAButtons } from "@/components/homepage/CTAButtons";

type Props = {
  ctaHref: string;
};

export function CTASection({ ctaHref }: Props) {
  return (
    <section className="bg-hero-glow">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-6 px-8 py-20 text-center">
        <h2 className="max-w-2xl text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          Your next job search can feel a lot less overwhelming
        </h2>
        <p className="max-w-lg text-base text-text-secondary">
          Set up your profile, upload your resume, and start finding matches
          in minutes.
        </p>
        <CTAButtons href={ctaHref} />
      </div>
    </section>
  );
}
