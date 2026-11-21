import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getModel } from "@/lib/services/models";
import { decodeSlug, HttpError } from "@/lib/api";
import { fmtContext, fmtDate, fmtPrice, label } from "@/lib/format";
import { CompareButton } from "@/components/CompareProvider";
import { CapChips, Chip, Empty, SyntheticNote } from "@/components/ui";
import { ModelRow, ModelRowHeader } from "@/components/ModelRow";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string[] }> };

async function load(slug: string[]) {
  try {
    return await getModel(decodeSlug(slug));
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await load((await params).slug);
  return { title: `${m.name} by ${m.lab.name}`, description: m.description.slice(0, 160) };
}

export default async function ModelPage({ params }: Props) {
  const m = await load((await params).slug);
  const rankOf = new Map(m.ranks.map((r) => [r.benchmarkId, r]));

  const specs = [
    ["Context window", `${fmtContext(m.contextLength)} tokens`],
    ["Max output", m.maxOutputTokens ? `${fmtContext(m.maxOutputTokens)} tokens` : "–"],
    ["Input price", `${fmtPrice(m.inputPrice)} / 1M tokens`],
    ["Output price", `${fmtPrice(m.outputPrice)} / 1M tokens`],
    ["Input modalities", m.inputModalities.map(label).join(", ")],
    ["Output modalities", m.outputModalities.map(label).join(", ")],
    ["Released", fmtDate(m.releasedAt)],
    ["Model ID", m.slug],
  ];

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-muted">
          <Link href="/models" className="hover:underline">Models</Link> /{" "}
          <Link href={`/labs/${m.lab.slug}`} className="hover:underline">{m.lab.name}</Link>
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{m.name}</h1>
          <CompareButton slug={m.slug} className="!px-4 !py-1.5 !text-sm" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {m.type !== "TEXT" && <Chip tone="accent">{label(m.type.toLowerCase())}</Chip>}
          {m.isFree && <Chip tone="accent">Free</Chip>}
          <CapChips caps={m.capabilities} max={10} />
        </div>
        {m.description && <p className="mt-4 max-w-3xl whitespace-pre-line text-muted">{m.description}</p>}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Specifications</h2>
        <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {specs.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 bg-card px-4 py-2.5 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="num min-w-0 truncate text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Providers</h2>
        {m.providers.length === 0 ? (
          <Empty title="No provider data for this model yet" hint="Provider listings are ingested for the most recent models." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-2 font-normal">Provider</th>
                  <th className="px-4 py-2 text-right font-normal">Input / 1M</th>
                  <th className="px-4 py-2 text-right font-normal">Output / 1M</th>
                  <th className="px-4 py-2 text-right font-normal">Context</th>
                  <th className="px-4 py-2 font-normal">Quantization</th>
                  <th className="px-4 py-2 text-right font-normal">Uptime</th>
                </tr>
              </thead>
              <tbody>
                {m.providers.map((p, i) => (
                  <tr key={p.providerId} className="border-b border-line last:border-0">
                    <td className="px-4 py-2 font-medium">
                      <Link href={`/providers/${p.provider.slug}`} className="hover:text-accent">{p.provider.name}</Link>
                      {i === 0 && <span className="ml-2 text-xs text-good">Lowest output price</span>}
                    </td>
                    <td className="num px-4 py-2 text-right">{fmtPrice(p.inputPrice)}</td>
                    <td className="num px-4 py-2 text-right">{fmtPrice(p.outputPrice)}</td>
                    <td className="num px-4 py-2 text-right">{fmtContext(p.contextLength ?? m.contextLength)}</td>
                    <td className="px-4 py-2 text-muted">{p.quantization ?? "–"}</td>
                    <td className="num px-4 py-2 text-right">{p.uptime != null ? `${p.uptime.toFixed(1)}%` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Benchmarks</h2>
        {m.scores.length === 0 ? (
          <Empty title="No benchmark scores for this model" />
        ) : (
          <div className="space-y-3 rounded-lg border border-line bg-card p-4">
            {m.scores.map((s) => {
              const r = rankOf.get(s.benchmarkId);
              const pct = s.benchmark.unit === "Elo" ? ((s.score - 1000) / 500) * 100 : s.score;
              return (
                <div key={s.benchmarkId} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
                  <Link href={`/rankings?benchmark=${s.benchmark.slug}&category=${encodeURIComponent(s.benchmark.category)}`} className="truncate hover:text-accent">
                    {s.benchmark.name}
                  </Link>
                  <div className="h-2 rounded bg-line" role="img" aria-label={`${s.benchmark.name}: ${s.score}`}>
                    <div className="h-2 rounded bg-accent" style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
                  </div>
                  <span className="num whitespace-nowrap text-right">
                    <strong>{s.score}</strong>
                    {s.benchmark.unit === "%" && "%"}
                    {r && <span className="ml-2 text-xs text-muted">#{r.rank} of {r.total}</span>}
                  </span>
                </div>
              );
            })}
            <SyntheticNote />
          </div>
        )}
      </section>

      {m.related.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">More from {m.lab.name}</h2>
          <div className="overflow-hidden rounded-lg border border-line bg-card">
            <ModelRowHeader />
            {m.related.map((r) => <ModelRow key={r.id} m={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
