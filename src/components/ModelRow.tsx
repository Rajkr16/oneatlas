import Link from "next/link";
import type { ModelListItem } from "@/lib/types";
import { fmtContext, fmtDate, fmtPrice, modelHref } from "@/lib/format";
import { CompareButton } from "./CompareProvider";
import { CapChips, Chip, LabLink } from "./ui";

export function ModelRowHeader() {
  return (
    <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_80px_90px_90px_100px_84px] gap-4 border-b border-line px-4 py-2 text-xs text-muted md:grid">
      <span>Model</span>
      <span>Capabilities</span>
      <span className="text-right">Context</span>
      <span className="text-right">Input / 1M</span>
      <span className="text-right">Output / 1M</span>
      <span className="text-right">Released</span>
      <span />
    </div>
  );
}

export function ModelRow({ m }: { m: ModelListItem }) {
  return (
    <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-0 md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_80px_90px_90px_100px_84px]">
      <div className="col-span-2 min-w-0 md:col-span-1">
        <Link href={modelHref(m.slug)} className="block truncate font-medium hover:text-accent">
          {m.name}
        </Link>
        <p className="truncate text-xs text-muted">
          <LabLink lab={m.lab} />
          {m._count.providers > 0 && ` · ${m._count.providers} provider${m._count.providers > 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-1 md:col-span-1">
        {m.type !== "TEXT" && <Chip tone="accent">{m.type === "IMAGE" ? "Image gen" : "Multimodal"}</Chip>}
        <CapChips caps={m.capabilities} max={2} />
      </div>
      <Cell title="Context" className="md:text-right">{fmtContext(m.contextLength)}</Cell>
      <Cell title="Input / 1M" className="md:text-right">{fmtPrice(m.inputPrice)}</Cell>
      <Cell title="Output / 1M" className="md:text-right">{fmtPrice(m.outputPrice)}</Cell>
      <Cell title="Released" className="md:text-right">{fmtDate(m.releasedAt)}</Cell>
      <div className="md:text-right">
        <CompareButton slug={m.slug} />
      </div>
    </div>
  );
}

function Cell({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`num text-sm ${className}`}>
      <span className="mr-2 text-xs text-muted md:hidden">{title}</span>
      {children}
    </div>
  );
}
