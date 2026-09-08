import Image from "next/image";

export function Testimonial() {
  return (
    <section className="bg-surface">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-8 py-20 text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-accent">
          Success Stories
        </span>
        <p className="text-xl font-medium leading-relaxed text-text-dark sm:text-2xl">
          &ldquo;I used to spend my evenings copy-pasting resumes. Now I open
          my dashboard to see interviews waiting. It feels like cheating. Had
          3 offers on the table simultaneously.&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <Image
            src="/images/user-icon.png"
            alt="Tom Wilson"
            width={192}
            height={192}
            className="h-10 w-10 rounded-xl object-cover"
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">
              Tom Wilson
            </p>
            <p className="text-xs text-text-secondary">Junior Developer</p>
          </div>
        </div>
      </div>
    </section>
  );
}
