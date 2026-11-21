import Link from "next/link";
import type { Metadata } from "next";
import { listProviders } from "@/lib/services/directory";
import { Empty, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Providers" };

export default async function ProvidersPage() {
  const providers = await listProviders();
  return (
    <>
      <PageHeading title="Providers" sub="Companies that host and serve models through an API." />
      {providers.length === 0 ? (
        <Empty title="No providers yet" hint="Run npm run db:seed to ingest provider data." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map((p) => (
            <li key={p.slug}>
              <Link href={`/providers/${p.slug}`} className="block rounded-lg border border-line bg-card p-4 hover:border-accent">
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 text-sm text-muted">{p._count.models} models</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
