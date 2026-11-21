import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLab } from "@/lib/services/directory";
import { HttpError } from "@/lib/api";
import { ModelRow, ModelRowHeader } from "@/components/ModelRow";
import { PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    return await getLab(decodeURIComponent(slug));
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await load((await params).slug)).name };
}

export default async function LabPage({ params }: Props) {
  const lab = await load((await params).slug);
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm text-muted"><Link href="/labs" className="hover:underline">Labs</Link></p>
        <PageHeading title={lab.name} sub={`${lab.models.length} models, newest first.`} />
      </div>
      {lab.providers.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Available through</h2>
          <div className="flex flex-wrap gap-2">
            {lab.providers.map((p) => (
              <Link key={p.slug} href={`/providers/${p.slug}`} className="rounded-full border border-line bg-card px-3 py-1 text-sm hover:border-accent">
                {p.name}
              </Link>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Models and releases</h2>
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          <ModelRowHeader />
          {lab.models.map((m) => <ModelRow key={m.id} m={m} />)}
        </div>
      </section>
    </div>
  );
}
