import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProvider } from "@/lib/services/directory";
import { HttpError } from "@/lib/api";
import { fmtContext, fmtPrice } from "@/lib/format";
import { CompareButton } from "@/components/CompareProvider";
import { PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    return await getProvider(decodeURIComponent(slug));
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await load((await params).slug)).name };
}

export default async function ProviderPage({ params }: Props) {
  const p = await load((await params).slug);
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-muted"><Link href="/providers" className="hover:underline">Providers</Link></p>
        <PageHeading title={p.name} sub={`Serves ${p.models.length} models. Prices are what this provider charges.`} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-2 font-normal">Model</th>
              <th className="px-4 py-2 text-right font-normal">Input / 1M</th>
              <th className="px-4 py-2 text-right font-normal">Output / 1M</th>
              <th className="px-4 py-2 text-right font-normal">Context</th>
              <th className="px-4 py-2 font-normal">Quantization</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {p.models.map((mp) => (
              <tr key={mp.modelId} className="border-b border-line last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/models/${mp.model.slug}`} className="font-medium hover:text-accent">{mp.model.name}</Link>
                  <span className="ml-2 text-xs text-muted">{mp.model.lab.name}</span>
                </td>
                <td className="num px-4 py-2 text-right">{fmtPrice(mp.inputPrice)}</td>
                <td className="num px-4 py-2 text-right">{fmtPrice(mp.outputPrice)}</td>
                <td className="num px-4 py-2 text-right">{fmtContext(mp.contextLength ?? mp.model.contextLength)}</td>
                <td className="px-4 py-2 text-muted">{mp.quantization ?? "–"}</td>
                <td className="px-4 py-2 text-right"><CompareButton slug={mp.model.slug} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
