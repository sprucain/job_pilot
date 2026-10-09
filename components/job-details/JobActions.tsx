type Props = {
  company: string;
  applyUrl: string | null;
};

export function JobActions({ company, applyUrl }: Props) {
  if (!applyUrl) return null;

  return (
    <a
      href={applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center rounded-xl bg-accent px-6 py-4 text-sm font-medium text-accent-foreground hover:bg-accent-dark"
    >
      Apply Now at {company}
    </a>
  );
}
