"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const MAX = 4;
const KEY = "oneatlas:compare";

type Ctx = {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  clear: () => void;
};
const CompareCtx = createContext<Ctx | null>(null);

export function useCompare() {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(saved)) setSlugs(saved.slice(0, MAX));
    } catch {}
  }, []);

  const persist = (next: string[]) => {
    setSlugs(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const toggle = useCallback(
    (slug: string) =>
      persist(
        slugs.includes(slug)
          ? slugs.filter((s) => s !== slug)
          : slugs.length >= MAX
            ? slugs
            : [...slugs, slug],
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slugs],
  );
  const value = useMemo<Ctx>(
    () => ({ slugs, has: (s) => slugs.includes(s), toggle, clear: () => persist([]) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slugs, toggle],
  );

  return (
    <CompareCtx.Provider value={value}>
      {children}
      {slugs.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[92vw] items-center gap-3 rounded-full border border-line bg-card px-4 py-2 text-sm shadow-lg">
          <span>
            {slugs.length} of {MAX} selected
          </span>
          <Link
            href={`/compare?models=${encodeURIComponent(slugs.join(","))}`}
            className="rounded-full bg-accent px-3 py-1 font-medium text-white dark:text-black"
          >
            Compare
          </Link>
          <button onClick={value.clear} className="text-muted hover:text-ink">
            Clear
          </button>
        </div>
      )}
    </CompareCtx.Provider>
  );
}

export function CompareButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { has, toggle, slugs } = useCompare();
  const on = has(slug);
  const full = !on && slugs.length >= MAX;
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={full}
      aria-pressed={on}
      title={full ? `You can compare up to ${MAX} models` : undefined}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        on ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-ink"
      } ${className}`}
    >
      {on ? "Added" : "Compare"}
    </button>
  );
}
