/**
 * Ingests the public OpenRouter catalogue (https://openrouter.ai/api/v1/models)
 * and normalises it into Lab / Model / Provider / ModelProvider.
 * Benchmarks are NOT available from OpenRouter, so scores are synthetic
 * (deterministic, derived from price/recency/capabilities) and flagged
 * source = "synthetic". Swap them for real data when you have a source.
 */
import { PrismaClient, ModelType } from "@prisma/client";

const prisma = new PrismaClient();
const OR = "https://openrouter.ai/api/v1";
const ENDPOINT_LIMIT = Number(process.env.ENDPOINT_LIMIT ?? 150);

type ORModel = {
  id: string;
  name: string;
  created: number;
  description?: string;
  context_length?: number;
  architecture?: { modality?: string; input_modalities?: string[]; output_modalities?: string[] };
  pricing?: Record<string, string>;
  top_provider?: { context_length?: number; max_completion_tokens?: number | null };
  supported_parameters?: string[];
};
type OREndpoint = {
  provider_name: string;
  context_length?: number;
  quantization?: string | null;
  uptime_last_30m?: number | null;
  uptime_last_1d?: number | null;
  pricing?: Record<string, string>;
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const titleCase = (s: string) => s.split(/[-_]/).map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
const perMillion = (v: string | undefined) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) && n >= 0 ? +(n * 1_000_000).toFixed(6) : NaN;
};

async function getJson<T>(url: string, tries = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as T;
    } catch (e) {
      if (i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
}

async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const BENCHMARKS = [
  { slug: "arena-elo", name: "Arena Elo", category: "General", unit: "Elo", min: 1000, max: 1500, description: "Head-to-head preference rating (illustrative)." },
  { slug: "mmlu-pro", name: "MMLU-Pro", category: "Knowledge", unit: "%", min: 40, max: 90, description: "Multi-task language understanding, harder variant." },
  { slug: "gpqa-diamond", name: "GPQA Diamond", category: "Reasoning", unit: "%", min: 20, max: 85, description: "Graduate-level science questions." },
  { slug: "humaneval", name: "HumanEval", category: "Coding", unit: "%", min: 40, max: 98, description: "Function-level code generation." },
  { slug: "swe-bench-verified", name: "SWE-bench Verified", category: "Coding", unit: "%", min: 5, max: 75, description: "Resolving real GitHub issues." },
  { slug: "math-500", name: "MATH-500", category: "Math", unit: "%", min: 30, max: 99, description: "Competition-style maths problems." },
  { slug: "mmmu", name: "MMMU", category: "Vision", unit: "%", min: 30, max: 80, description: "Multimodal understanding (vision models only)." },
];

function capabilitiesOf(m: ORModel, inputs: string[]) {
  const p = new Set(m.supported_parameters ?? []);
  const caps: string[] = [];
  if (p.has("tools") || p.has("tool_choice")) caps.push("tool-calling");
  if (p.has("reasoning") || p.has("include_reasoning")) caps.push("reasoning");
  if (p.has("structured_outputs") || p.has("response_format")) caps.push("structured-output");
  if (p.has("web_search_options")) caps.push("web-search");
  if (inputs.includes("image")) caps.push("vision");
  if (inputs.includes("file")) caps.push("file-input");
  if (inputs.includes("audio")) caps.push("audio-input");
  return caps;
}

async function main() {
  console.log("Fetching OpenRouter model catalogue…");
  const { data } = await getJson<{ data: ORModel[] }>(`${OR}/models`);

  const labNames = new Map<string, string>();
  const rows: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

  for (const m of data) {
    if (m.id.startsWith("~")) continue;
    const [labSlug] = m.id.split("/");
    if (!labSlug || !m.id.includes("/")) continue;
    const input = perMillion(m.pricing?.prompt);
    const output = perMillion(m.pricing?.completion);
    if (Number.isNaN(input) || Number.isNaN(output)) continue; // router/auto models have negative prices

    const sep = m.name.indexOf(": ");
    const labName = sep > 0 ? m.name.slice(0, sep) : titleCase(labSlug);
    if (!labNames.has(labSlug)) labNames.set(labSlug, labName);

    const inputs = m.architecture?.input_modalities ?? (m.architecture?.modality?.split("->")[0]?.split("+") ?? ["text"]);
    const outputs = m.architecture?.output_modalities ?? (m.architecture?.modality?.split("->")[1]?.split("+") ?? ["text"]);
    const type: ModelType = outputs.includes("image")
      ? "IMAGE"
      : inputs.some((i) => i !== "text")
        ? "MULTIMODAL"
        : "TEXT";

    rows.push({
      slug: m.id,
      name: sep > 0 ? m.name.slice(sep + 2) : m.name,
      description: (m.description ?? "").slice(0, 2000),
      labSlug,
      type,
      inputModalities: inputs,
      outputModalities: outputs,
      capabilities: capabilitiesOf(m, inputs),
      contextLength: m.context_length ?? m.top_provider?.context_length ?? 0,
      maxOutputTokens: m.top_provider?.max_completion_tokens ?? null,
      inputPrice: input,
      outputPrice: output,
      isFree: input === 0 && output === 0,
      releasedAt: new Date((m.created || 0) * 1000),
      created: m.created,
    });
  }
  console.log(`Normalised ${rows.length} models from ${labNames.size} labs`);

  // Labs
  await prisma.lab.deleteMany({ where: { slug: { startsWith: "~" } } });
  const labId = new Map<string, string>();
  for (const [slug, name] of labNames) {
    const lab = await prisma.lab.upsert({ where: { slug }, update: { name }, create: { slug, name } });
    labId.set(slug, lab.id);
  }

  // Models
  const modelId = new Map<string, string>();
  for (const r of rows) {
    const { labSlug, created: _c, ...fields } = r;
    const model = await prisma.model.upsert({
      where: { slug: r.slug },
      update: { ...fields, labId: labId.get(labSlug)! },
      create: { ...fields, labId: labId.get(labSlug)! },
    });
    modelId.set(r.slug, model.id);
  }
  console.log("Models upserted");

  // Providers (per-model endpoints)
  await prisma.modelProvider.deleteMany();
  const targets = rows
    .filter((r) => !r.isFree)
    .sort((a, b) => b.created - a.created)
    .slice(0, ENDPOINT_LIMIT);
  const providerId = new Map<string, string>();
  let withProviders = 0;

  await pool(targets, 5, async (r) => {
    try {
      const res = await getJson<{ data: { endpoints?: OREndpoint[] } }>(`${OR}/models/${r.slug}/endpoints`, 2);
      const seen = new Set<string>();
      const links: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const e of res.data.endpoints ?? []) {
        const pslug = slugify(e.provider_name);
        if (!pslug || seen.has(pslug)) continue;
        seen.add(pslug);
        if (!providerId.has(pslug)) {
          const p = await prisma.provider.upsert({
            where: { slug: pslug },
            update: { name: e.provider_name },
            create: { slug: pslug, name: e.provider_name },
          });
          providerId.set(pslug, p.id);
        }
        const inP = perMillion(e.pricing?.prompt);
        const outP = perMillion(e.pricing?.completion);
        links.push({
          modelId: modelId.get(r.slug)!,
          providerId: providerId.get(pslug)!,
          inputPrice: Number.isNaN(inP) ? r.inputPrice : inP,
          outputPrice: Number.isNaN(outP) ? r.outputPrice : outP,
          contextLength: e.context_length ?? null,
          quantization: e.quantization && e.quantization !== "unknown" ? e.quantization : null,
          uptime: e.uptime_last_30m ?? e.uptime_last_1d ?? null,
        });
      }
      if (links.length) {
        await prisma.modelProvider.createMany({ data: links, skipDuplicates: true });
        withProviders++;
      }
    } catch (e) {
      console.warn(`  skip endpoints for ${r.slug}: ${(e as Error).message}`);
    }
  });
  console.log(`Providers linked for ${withProviders} models (${providerId.size} providers)`);

  // Benchmarks (synthetic, deterministic)
  await prisma.benchmarkScore.deleteMany();
  const benchId = new Map<string, string>();
  for (const b of BENCHMARKS) {
    const { min: _min, max: _max, ...fields } = b;
    const row = await prisma.benchmark.upsert({ where: { slug: b.slug }, update: fields, create: fields });
    benchId.set(b.slug, row.id);
  }

  const now = Date.now() / 1000;
  const scores: { modelId: string; benchmarkId: string; score: number; source: string }[] = [];
  for (const r of rows) {
    if (r.type === "IMAGE" || r.slug.endsWith(":free")) continue;
    const rand = rng(hash(r.slug));
    const ageYears = (now - r.created) / 31_557_600;
    const recency = Math.max(0, 1 - ageYears / 2) * 0.12;
    const reasoning = r.capabilities.includes("reasoning") ? 0.1 : 0;
    const base = clamp(0.3 + 0.17 * Math.log10(1 + r.outputPrice) + reasoning + recency + (rand() - 0.5) * 0.12, 0.08, 0.98);
    for (const b of BENCHMARKS) {
      if (b.slug === "mmmu" && !r.capabilities.includes("vision")) continue;
      const q = clamp(base + (rand() - 0.5) * 0.1, 0.02, 1);
      scores.push({
        modelId: modelId.get(r.slug)!,
        benchmarkId: benchId.get(b.slug)!,
        score: +(b.min + q * (b.max - b.min)).toFixed(b.unit === "Elo" ? 0 : 1),
        source: "synthetic",
      });
    }
  }
  for (let i = 0; i < scores.length; i += 2000) {
    await prisma.benchmarkScore.createMany({ data: scores.slice(i, i + 2000), skipDuplicates: true });
  }
  console.log(`Benchmark scores written: ${scores.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
