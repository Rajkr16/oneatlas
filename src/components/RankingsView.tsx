"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import type { RankingsResponse } from "@/lib/types";
import { fmtContext, fmtPrice } from "./../lib/format";
import { CompareButton } from "./CompareProvider";
import { Empty, ErrorBox, Skeleton, SyntheticNote } from "./ui";

export default function RankingsView() {
  const sp = useSearchParams();
  const router = useRouter();
  const qs = new URLSearchParams();
  for (const k of ["benchmark", "category", "type"]) if (sp.get(k)) qs.set(k, sp.get(k)!);
  qs.set("limit", "50");
  const { data, error, loading } = useApi<RankingsResponse>(`/api/rankings?${qs}`);

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    router.replace(`/rankings?${next}`, { scroll: false });
  };

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Skeleton className="h-96" />;

  const { benchmark, benchmarks, categories, rows } = data;
  const top = rows[0]?.score ?? 1;
  const low = rows[rows.length - 1]?.score ?? 0;
  // Elo bars start from the lowest shown score so differences are visible
  const width = (s: number) =>
    benchmark.unit === "Elo" ? 8 + ((s - low) / Math.max(1, top - low)) * 92 : Math.max(2, s);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Category">
        {["All", ...categories].map((c) => {
          const active = (sp.get("category") ?? "All") === c;
          return (
            <button
              key={c}
              role="tab"
              aria-selected={active}
              onClick={() => go({ category: c === "All" ? null : c, benchmark: null })}
              className={`rounded-full border px-3 py-1 text-sm ${active ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-ink"}`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={benchmark.slug}
          onChange={(e) => go({ benchmark: e.target.value })}
          aria-label="Benchmark"
          className="rounded-md border border-line bg-card px-3 py-2 text-sm"
        >
          {benchmarks.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
        <select
          value={sp.get("type") ?? ""}
          onChange={(e) => go({ type: e.target.value || null })}
          aria-label="Model type"
          className="rounded-md border border-line bg-card px-3 py-2 text-sm"
        >
          <option value="">All model types</option>
          <option value="text">Text</option>
          <option value="multimodal">Multimodal</option>
          <option value="image">Image generation</option>
        </select>
        <p className="text-sm text-muted">{benchmark.description}</p>
      </div>

      {rows.length === 0 ? (
        <Empty title="No scores match these filters" hint="Try another model type or benchmark." />
      ) : (
        <div className={`overflow-x-auto rounded-lg border border-line bg-card transition-opacity ${loading ? "opacity-60" : ""}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-line">
                <th className="w-12 px-4 py-2 font-normal">Rank</th>
                <th className="px-4 py-2 font-normal">Model</th>
                <th className="w-1/4 px-4 py-2 font-normal">{benchmark.name}</th>
                <th className="px-4 py-2 text-right font-normal">Context</th>
                <th className="px-4 py-2 text-right font-normal">Output / 1M</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.model.slug} className="border-b border-line last:border-0">
                  <td className="num px-4 py-2 text-muted">{r.rank}</td>
                  <td className="px-4 py-2">
                    <Link href={`/models/${r.model.slug}`} className="font-medium hover:text-accent">{r.model.name}</Link>
                    <span className="ml-2 text-xs text-muted">{r.model.lab.name}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="num w-12 shrink-0 font-medium">{r.score}{benchmark.unit === "%" && "%"}</span>
                      <div className="h-1.5 flex-1 rounded bg-line">
                        <div className="h-1.5 rounded bg-accent" style={{ width: `${width(r.score)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="num px-4 py-2 text-right">{fmtContext(r.model.contextLength)}</td>
                  <td className="num px-4 py-2 text-right">{fmtPrice(r.model.outputPrice)}</td>
                  <td className="px-4 py-2 text-right"><CompareButton slug={r.model.slug} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <SyntheticNote />
    </div>
  );
}
