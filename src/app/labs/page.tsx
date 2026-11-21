import Link from "next/link";
import type { Metadata } from "next";
import { listLabs } from "@/lib/services/directory";
import { PageHeading } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI labs" };

export default async function LabsPage() {
  const labs = await listLabs();
  return (
    <>
      <PageHeading title="AI labs" sub={`${labs.length} companies and research labs, ordered by number of models.`} />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((l) => (
          <li key={l.slug}>
            <Link href={`/labs/${l.slug}`} className="block rounded-lg border border-line bg-card p-4 hover:border-accent">
              <p className="font-medium">{l.name}</p>
              <p className="mt-1 text-sm text-muted">
                {l._count.models} model{l._count.models === 1 ? "" : "s"}
                {l.latestRelease && `, latest ${fmtDate(l.latestRelease)}`}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
