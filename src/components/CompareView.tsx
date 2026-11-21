"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import type { CompareResponse, SearchResults } from "@/lib/types";
import { fmtContext, fmtDate, fmtPrice, label } from "@/lib/format";
import { Empty, ErrorBox, Skeleton, SyntheticNote } from "./ui";

const MAX = 4;

export default function CompareView() {
  const sp = useSearchParams();
  const router = useRouter();
  const slugs = (sp.get("models") ?? "").split(",").filter(Boolean);
  const { data, error } = useApi<CompareResponse>(
    slugs.length ? `/api/compare?models=${encodeURIComponent(slugs.join(","))}` : null,
  );

  const setSlugs = (next: string[]) =>
    router.replace(next.length ? `/compare?models=${encodeURIComponent(next.join(","))}` : "/compare", { scroll: false });

  return (
    <div className="space-y-6">
      {slugs.length < MAX && <Picker onPick={(s) => !slugs.includes(s) && setSlugs([...slugs, s])} />}

      {error ? (
        <ErrorBox message={error} />
      ) : slugs.length === 0 ? (
        <Empty title="No models selected" hint="Search above, or use the Compare button on any model." />
      ) : !data ? (
        <Skeleton className="h-64" />
      ) : (
        <Table data={data} onRemove={(s) => setSlugs(slugs.filter((x) => x !== s))} />
      )}
      {data && slugs.length === 1 && <p className="text-sm text-muted">Add one more model to start comparing.</p>}
    </div>
  );
}

type Row = { name: string; values: (number | null)[]; show: (v: number) => string; best: "min" | "max" | null };

function Table({ data, onRemove }: { data: CompareResponse; onRemove: (slug: string) => void }) {
  const { models, benchmarks } = data;
  const caps = Array.from(new Set(models.flatMap((m) => m.capabilities))).sort();

  const rows: Row[] = [
    { name: "Context window", values: models.map((m) => m.contextLength), show: fmtContext, best: "max" },
    { name: "Max output tokens", values: models.map((m) => m.maxOutputTokens), show: fmtContext, best: "max" },
    { name: "Input price / 1M", values: models.map((m) => m.inputPrice), show: fmtPrice, best: "min" },
    { name: "Output price / 1M", values: models.map((m) => m.outputPrice), show: fmtPrice, best: "min" },
    { name: "Providers", values: models.map((m) => m._count.providers), show: String, best: "max" },
  ];
  const benchRows: Row[] = benchmarks
    .filter((b) => models.some((m) => m.scores.some((s) => s.benchmarkId === b.id)))
    .map((b) => ({
      name: `${b.name} (${b.category})`,
      values: models.map((m) => m.scores.find((s) => s.benchmarkId === b.id)?.score ?? null),
      show: (v: number) => (b.unit === "%" ? `${v}%` : String(v)),
      best: "max" as const,
    }));

  const cols = { gridTemplateColumns: `minmax(150px,1fr) repeat(${models.length}, minmax(150px,1fr))` };

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-card">
      <div className="min-w-max text-sm" style={{ display: "grid" }}>
        <div className="grid border-b border-line" style={cols}>
          <div className="sticky left-0 bg-card p-3" />
          {models.map((m) => (
            <div key={m.id} className="p-3">
              <Link href={`/models/${m.slug}`} className="font-semibold hover:text-accent">{m.name}</Link>
              <p className="text-xs text-muted">{m.lab.name}</p>
              <button onClick={() => onRemove(m.slug)} className="mt-1 text-xs text-muted hover:text-ink" aria-label={`Remove ${m.name}`}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <Section title="Specs">
          {rows.map((r) => <DataRow key={r.name} row={r} cols={cols} />)}
          <TextRow name="Released" values={models.map((m) => fmtDate(m.releasedAt))} cols={cols} />
          <TextRow name="Type" values={models.map((m) => label(m.type.toLowerCase()))} cols={cols} />
          <TextRow name="Inputs" values={models.map((m) => m.inputModalities.map(label).join(", "))} cols={cols} />
          <TextRow name="Outputs" values={models.map((m) => m.outputModalities.map(label).join(", "))} cols={cols} />
        </Section>

        <Section title="Capabilities">
          {caps.length === 0 && <p className="p-3 text-muted">No capability data.</p>}
          {caps.map((c) => (
            <TextRow key={c} name={label(c)} values={models.map((m) => (m.capabilities.includes(c) ? "Yes" : "No"))} cols={cols} dim="No" />
          ))}
        </Section>

        <Section title="Benchmarks">
          {benchRows.length === 0 && <p className="p-3 text-muted">No benchmark data for these models.</p>}
          {benchRows.map((r) => <DataRow key={r.name} row={r} cols={cols} />)}
          <div className="p-3"><SyntheticNote /></div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="sticky left-0 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">{title}</p>
      {children}
    </div>
  );
}

function DataRow({ row, cols }: { row: Row; cols: React.CSSProperties }) {
  const nums = row.values.filter((v): v is number => v != null);
  const target = row.best && nums.length > 1 ? (row.best === "min" ? Math.min(...nums) : Math.max(...nums)) : null;
  const allSame = nums.length > 0 && nums.every((n) => n === nums[0]);
  return (
    <div className="grid border-b border-line last:border-0" style={cols}>
      <div className="sticky left-0 bg-card p-3 text-muted">{row.name}</div>
      {row.values.map((v, i) => (
        <div key={i} className={`num p-3 ${v != null && v === target && !allSame ? "font-semibold text-good" : ""}`}>
          {v == null ? "–" : row.show(v)}
        </div>
      ))}
    </div>
  );
}

function TextRow({ name, values, cols, dim }: { name: string; values: string[]; cols: React.CSSProperties; dim?: string }) {
  return (
    <div className="grid border-b border-line last:border-0" style={cols}>
      <div className="sticky left-0 bg-card p-3 text-muted">{name}</div>
      {values.map((v, i) => (
        <div key={i} className={`p-3 ${v === dim ? "text-muted" : ""}`}>{v}</div>
      ))}
    </div>
  );
}

function Picker({ onPick }: { onPick: (slug: string) => void }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 200);
    return () => clearTimeout(t);
  }, [text]);
  const { data } = useApi<SearchResults>(q.length >= 2 ? `/api/search?q=${encodeURIComponent(q)}` : null);

  return (
    <div className="relative max-w-md">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a model to compare"
        aria-label="Add a model to compare"
        className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
      />
      {q.length >= 2 && data && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-card p-1 text-sm shadow-lg">
          {data.models.length === 0 && <li className="p-3 text-muted">No models match “{q}”.</li>}
          {data.models.map((m) => (
            <li key={m.slug}>
              <button
                onClick={() => { onPick(m.slug); setText(""); setQ(""); }}
                className="flex w-full justify-between gap-3 rounded px-3 py-1.5 text-left hover:bg-accent-soft"
              >
                <span className="truncate">{m.name}</span>
                <span className="shrink-0 text-muted">{m.lab.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
