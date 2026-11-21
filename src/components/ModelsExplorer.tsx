"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import type { Facets, ModelListItem, Paged } from "@/lib/types";
import { label } from "@/lib/format";
import { ModelRow, ModelRowHeader } from "./ModelRow";
import { Empty, ErrorBox, Skeleton } from "./ui";

const SORTS = [
  { v: "release:desc", t: "Newest first" },
  { v: "release:asc", t: "Oldest first" },
  { v: "input_price:asc", t: "Input price: low to high" },
  { v: "output_price:asc", t: "Output price: low to high" },
  { v: "output_price:desc", t: "Output price: high to low" },
  { v: "context:desc", t: "Longest context" },
];

export default function ModelsExplorer() {
  const sp = useSearchParams();
  const router = useRouter();
  const qs = sp.toString();

  const facets = useApi<Facets>("/api/filters");
  const list = useApi<Paged<ModelListItem>>(`/api/models?${qs}`);

  const [search, setSearch] = useState(sp.get("q") ?? "");

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
      if (!("page" in patch)) next.delete("page");
      router.replace(`/models${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [sp, router],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get("q") ?? "") !== search) update({ q: search || null });
    }, 300);
    return () => clearTimeout(t);
  }, [search, sp, update]);

  const selected = (key: string) => (sp.get(key) ?? "").split(",").filter(Boolean);
  const toggle = (key: string, value: string) => {
    const cur = selected(key);
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ [key]: next.join(",") || null });
  };

  const sortValue = `${sp.get("sort") ?? "release"}:${sp.get("order") ?? "desc"}`;
  const activeCount = ["lab", "provider", "capability", "type", "free", "q"].filter((k) => sp.get(k)).length;
  const data = list.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside>
        <details className="rounded-lg border border-line bg-card lg:!block" open>
          <summary className="cursor-pointer px-4 py-3 font-medium lg:pointer-events-none">
            Filters{activeCount > 0 && ` (${activeCount})`}
          </summary>
          <div className="space-y-5 border-t border-line p-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sp.get("free") === "true"}
                onChange={(e) => update({ free: e.target.checked ? "true" : null })}
              />
              Free models only
            </label>
            {!facets.data ? (
              <Skeleton className="h-40" />
            ) : (
              <>
                <Group title="Type" items={facets.data.types.map((t) => ({ slug: t.slug, name: t.name }))} selected={selected("type")} onToggle={(v) => toggle("type", v)} />
                <Group title="Capabilities" items={facets.data.capabilities.map((c) => ({ slug: c.slug, name: label(c.slug), count: c.count }))} selected={selected("capability")} onToggle={(v) => toggle("capability", v)} />
                <Group scroll title="Lab" items={facets.data.labs.map((l) => ({ slug: l.slug, name: l.name, count: l._count.models }))} selected={selected("lab")} onToggle={(v) => toggle("lab", v)} />
                <Group scroll title="Provider" items={facets.data.providers.map((p) => ({ slug: p.slug, name: p.name, count: p._count.models }))} selected={selected("provider")} onToggle={(v) => toggle("provider", v)} />
              </>
            )}
            {activeCount > 0 && (
              <button onClick={() => { setSearch(""); router.replace("/models"); }} className="text-accent hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        </details>
      </aside>

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model or lab name"
            aria-label="Search models"
            className="min-w-0 flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm"
          />
          <select
            value={sortValue}
            onChange={(e) => {
              const [sort, order] = e.target.value.split(":");
              update({ sort, order });
            }}
            aria-label="Sort models"
            className="rounded-md border border-line bg-card px-3 py-2 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>{s.t}</option>
            ))}
          </select>
        </div>

        <p className="mb-2 text-sm text-muted" aria-live="polite">
          {data ? `${data.total} model${data.total === 1 ? "" : "s"}` : "Loading…"}
        </p>

        {list.error ? (
          <ErrorBox message={list.error} />
        ) : !data ? (
          <div className="space-y-2">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : data.items.length === 0 ? (
          <Empty title="No models match these filters" hint="Remove a filter or try a different search." />
        ) : (
          <div className={`overflow-hidden rounded-lg border border-line bg-card transition-opacity ${list.loading ? "opacity-60" : ""}`}>
            <ModelRowHeader />
            {data.items.map((m) => <ModelRow key={m.id} m={m} />)}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
            <button
              disabled={data.page <= 1}
              onClick={() => update({ page: String(data.page - 1) })}
              className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="num text-muted">Page {data.page} of {data.totalPages}</span>
            <button
              disabled={data.page >= data.totalPages}
              onClick={() => update({ page: String(data.page + 1) })}
              className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

function Group({ title, items, selected, onToggle, scroll }: {
  title: string;
  items: { slug: string; name: string; count?: number }[];
  selected: string[];
  onToggle: (slug: string) => void;
  scroll?: boolean;
}) {
  if (!items.length) return null;
  return (
    <fieldset>
      <legend className="mb-1.5 font-medium">{title}</legend>
      <div className={`space-y-1 ${scroll ? "max-h-48 overflow-y-auto pr-1" : ""}`}>
        {items.map((i) => (
          <label key={i.slug} className="flex items-center gap-2">
            <input type="checkbox" checked={selected.includes(i.slug)} onChange={() => onToggle(i.slug)} />
            <span className="min-w-0 flex-1 truncate">{i.name}</span>
            {i.count !== undefined && <span className="num text-xs text-muted">{i.count}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
