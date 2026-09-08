import Image from "next/image";

import { CTAButtons } from "@/components/homepage/CTAButtons";

type Props = {
  ctaHref: string;
};

export function Hero({ ctaHref }: Props) {
  return (
    <section className="bg-hero-glow">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-8 px-8 pb-20 pt-20 text-center">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
          Job hunting is hard.
          <br />
          Your tools shouldn&apos;t be.
        </h1>
        <p className="max-w-xl text-base text-text-secondary">
          Stop applying blind. JobPilot finds the jobs, researches the
          companies, and gives you everything you need to stand out.
        </p>

        <CTAButtons href={ctaHref} />

        <div className="mt-6 w-full max-w-4xl">
          <Image
            src="/images/dashboard-demo.png"
            alt="JobPilot dashboard preview"
            width={4788}
            height={2416}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 896px, 100vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}
