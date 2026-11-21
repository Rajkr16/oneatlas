import Link from "next/link";
import { label } from "@/lib/format";

export function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "accent" }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs ${
        tone === "accent" ? "bg-accent-soft text-accent" : "bg-line/60 text-muted"
      }`}
    >
      {children}
    </span>
  );
}

export const CapChips = ({ caps, max = 4 }: { caps: string[]; max?: number }) => (
  <div className="flex flex-wrap gap-1">
    {caps.slice(0, max).map((c) => (
      <Chip key={c}>{label(c)}</Chip>
    ))}
    {caps.length > max && <Chip>+{caps.length - max}</Chip>}
  </div>
);

export function PageHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {sub && <p className="mt-1 max-w-2xl text-muted">{sub}</p>}
    </div>
  );
}

export const Empty = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="rounded-lg border border-dashed border-line p-10 text-center">
    <p className="font-medium">{title}</p>
    {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
  </div>
);

export const ErrorBox = ({ message }: { message: string }) => (
  <div role="alert" className="rounded-lg border border-red-400/50 bg-red-500/10 p-4 text-sm">
    {message}. Check your connection and refresh the page.
  </div>
);

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-line/70 ${className}`} />
);

export const SyntheticNote = () => (
  <p className="text-xs text-muted">
    Benchmark scores are illustrative sample data generated for this demo, not real evaluation results.
  </p>
);

export const LabLink = ({ lab }: { lab: { slug: string; name: string } }) => (
  <Link href={`/labs/${lab.slug}`} className="hover:text-accent hover:underline">
    {lab.name}
  </Link>
);
