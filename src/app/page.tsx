import Link from "next/link";
import { homeStats } from "@/lib/services/directory";
import { getRankings } from "@/lib/services/rankings";
import { ModelRow, ModelRowHeader } from "@/components/ModelRow";
import { fmtPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stats, top] = await Promise.all([
    homeStats(),
    getRankings({ benchmark: "arena-elo", limit: 5 }),
  ]);

  return (
    <div className="space-y-12">
      <section className="max-w-3xl pt-6">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Find the right model, then see who sells it cheapest.
        </h1>
        <p className="mt-4 text-lg text-muted">
          {stats.models} models from {stats.labs} labs, served by {stats.providers} providers. Filter by
          capability, sort by price or context, and compare up to four side by side.
        </p>
        <form action="/models" className="mt-6 flex max-w-xl gap-2">
          <input
            name="q"
            placeholder="Try “claude”, “llama 70b” or “vision”"
            aria-label="Search models"
            className="min-w-0 flex-1 rounded-md border border-line bg-card px-3 py-2"
          />
          <button className="rounded-md bg-accent px-4 py-2 font-medium text-white dark:text-black">Search</button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Newest models</h2>
          <Link href="/models" className="text-sm text-accent hover:underline">
            Browse all models
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          <ModelRowHeader />
          {stats.newest.map((m) => (
            <ModelRow key={m.id} m={m} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Top by Arena Elo</h2>
            <Link href="/rankings" className="text-sm text-accent hover:underline">
              All rankings
            </Link>
          </div>
          <ol className="divide-y divide-line rounded-lg border border-line bg-card">
            {top.rows.map((r) => (
              <li key={r.model.slug} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="num w-5 text-muted">{r.rank}</span>
                <Link href={`/models/${r.model.slug}`} className="min-w-0 flex-1 truncate font-medium hover:text-accent">
                  {r.model.name}
                </Link>
                <span className="text-muted">{r.model.lab.name}</span>
                <span className="num w-12 text-right">{r.score}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Explore</h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Link href="/models?free=true" className="rounded-lg border border-line bg-card p-4 hover:border-accent">
              <p className="font-medium">Free models</p>
              <p className="mt-1 text-muted">Models you can call at {fmtPrice(0)}.</p>
            </Link>
            <Link href="/models?capability=reasoning" className="rounded-lg border border-line bg-card p-4 hover:border-accent">
              <p className="font-medium">Reasoning models</p>
              <p className="mt-1 text-muted">Built for multi-step problems.</p>
            </Link>
            <Link href="/models?sort=context&order=desc" className="rounded-lg border border-line bg-card p-4 hover:border-accent">
              <p className="font-medium">Longest context</p>
              <p className="mt-1 text-muted">For large documents and codebases.</p>
            </Link>
            <Link href="/labs" className="rounded-lg border border-line bg-card p-4 hover:border-accent">
              <p className="font-medium">AI labs</p>
              <p className="mt-1 text-muted">See every release by company.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
