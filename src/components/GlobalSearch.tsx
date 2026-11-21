"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApi } from "@/lib/useApi";
import type { SearchResults } from "@/lib/types";

export function GlobalSearch() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 200);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const { data } = useApi<SearchResults>(q.length >= 2 ? `/api/search?q=${encodeURIComponent(q)}` : null);
  const hasAny = data && (data.models.length || data.labs.length || data.providers.length);
  const done = () => {
    setOpen(false);
    setText("");
  };

  return (
    <div ref={box} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            router.push(`/models?q=${encodeURIComponent(text.trim())}`);
            done();
          }
        }}
      >
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search models, labs, providers"
          aria-label="Search models, labs and providers"
          className="w-full rounded-md border border-line bg-card px-3 py-1.5 text-sm placeholder:text-muted"
        />
      </form>
      {open && q.length >= 2 && (
        <div className="absolute right-0 mt-1 w-[min(92vw,22rem)] rounded-lg border border-line bg-card p-1 text-sm shadow-lg">
          {!data ? (
            <p className="p-3 text-muted">Searching…</p>
          ) : !hasAny ? (
            <p className="p-3 text-muted">No matches for “{q}”. Try a shorter name.</p>
          ) : (
            <>
              <Group title="Models" onPick={done} items={data.models.map((m) => ({ href: `/models/${m.slug}`, text: m.name, sub: m.lab.name }))} />
              <Group title="Labs" onPick={done} items={data.labs.map((l) => ({ href: `/labs/${l.slug}`, text: l.name }))} />
              <Group title="Providers" onPick={done} items={data.providers.map((p) => ({ href: `/providers/${p.slug}`, text: p.name }))} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ title, items, onPick }: { title: string; items: { href: string; text: string; sub?: string }[]; onPick: () => void }) {
  if (!items.length) return null;
  return (
    <div className="py-1">
      <p className="px-3 py-1 text-xs text-muted">{title}</p>
      {items.map((i) => (
        <Link key={i.href} href={i.href} onClick={onPick} className="flex justify-between gap-3 rounded px-3 py-1.5 hover:bg-accent-soft">
          <span className="truncate">{i.text}</span>
          {i.sub && <span className="shrink-0 text-muted">{i.sub}</span>}
        </Link>
      ))}
    </div>
  );
}
