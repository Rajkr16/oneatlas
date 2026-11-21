import { Prisma, ModelType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api";
import type { ModelQuery } from "@/lib/schemas";

const TYPE_MAP: Record<string, ModelType> = {
  text: "TEXT",
  multimodal: "MULTIMODAL",
  image: "IMAGE",
};

export const modelListSelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  capabilities: true,
  inputModalities: true,
  outputModalities: true,
  contextLength: true,
  inputPrice: true,
  outputPrice: true,
  isFree: true,
  releasedAt: true,
  lab: { select: { slug: true, name: true } },
  _count: { select: { providers: true } },
} satisfies Prisma.ModelSelect;

function buildWhere(q: ModelQuery): Prisma.ModelWhereInput {
  const and: Prisma.ModelWhereInput[] = [];
  if (q.q) {
    const c = { contains: q.q, mode: "insensitive" as const };
    and.push({ OR: [{ name: c }, { slug: c }, { lab: { name: c } }] });
  }
  if (q.lab.length) and.push({ lab: { slug: { in: q.lab } } });
  if (q.provider.length)
    and.push({ providers: { some: { provider: { slug: { in: q.provider } } } } });
  if (q.capability.length) and.push({ capabilities: { hasEvery: q.capability } });
  const types = q.type.map((t) => TYPE_MAP[t]).filter(Boolean);
  if (types.length) and.push({ type: { in: types } });
  if (q.free === "true") and.push({ isFree: true });
  if (q.free === "false") and.push({ isFree: false });
  return and.length ? { AND: and } : {};
}

const SORT_COLUMN = {
  release: "releasedAt",
  input_price: "inputPrice",
  output_price: "outputPrice",
  context: "contextLength",
} as const;

export async function listModels(q: ModelQuery) {
  const where = buildWhere(q);
  const orderBy = [
    { [SORT_COLUMN[q.sort]]: q.order },
    { id: "asc" },
  ] as Prisma.ModelOrderByWithRelationInput[];

  const [total, items] = await prisma.$transaction([
    prisma.model.count({ where }),
    prisma.model.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: modelListSelect,
    }),
  ]);

  return {
    items,
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export async function getModel(slug: string) {
  const model = await prisma.model.findUnique({
    where: { slug },
    include: {
      lab: true,
      providers: { include: { provider: true }, orderBy: { outputPrice: "asc" } },
      scores: { include: { benchmark: true } },
    },
  });
  if (!model) throw new HttpError(404, "Model not found");

  const ranks = await Promise.all(
    model.scores.map(async (s) => {
      const [ahead, total] = await Promise.all([
        prisma.benchmarkScore.count({
          where: { benchmarkId: s.benchmarkId, score: { gt: s.score } },
        }),
        prisma.benchmarkScore.count({ where: { benchmarkId: s.benchmarkId } }),
      ]);
      return { benchmarkId: s.benchmarkId, rank: ahead + 1, total };
    }),
  );

  const related = await prisma.model.findMany({
    where: { labId: model.labId, id: { not: model.id } },
    orderBy: { releasedAt: "desc" },
    take: 6,
    select: modelListSelect,
  });

  model.scores.sort(
    (a, b) =>
      a.benchmark.category.localeCompare(b.benchmark.category) ||
      a.benchmark.name.localeCompare(b.benchmark.name),
  );

  return { ...model, ranks, related };
}

export async function compareModels(slugs: string[]) {
  const rows = await prisma.model.findMany({
    where: { slug: { in: slugs } },
    include: { lab: true, scores: { include: { benchmark: true } }, _count: { select: { providers: true } } },
  });
  if (!rows.length) throw new HttpError(404, "No matching models");
  const order = new Map(slugs.map((s, i) => [s, i]));
  rows.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  const benchmarks = await prisma.benchmark.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return { models: rows, benchmarks };
}

export async function getFacets() {
  const [labs, providers, caps] = await Promise.all([
    prisma.lab.findMany({
      select: { slug: true, name: true, _count: { select: { models: true } } },
      orderBy: { models: { _count: "desc" } },
      take: 60,
    }),
    prisma.provider.findMany({
      select: { slug: true, name: true, _count: { select: { models: true } } },
      orderBy: { models: { _count: "desc" } },
      take: 60,
    }),
    prisma.$queryRaw<{ cap: string; n: bigint }[]>`
      SELECT unnest("capabilities") AS cap, COUNT(*) AS n
      FROM "Model" GROUP BY cap ORDER BY n DESC`,
  ]);
  return {
    labs,
    providers,
    capabilities: caps.map((c) => ({ slug: c.cap, count: Number(c.n) })),
    types: [
      { slug: "text", name: "Text" },
      { slug: "multimodal", name: "Multimodal" },
      { slug: "image", name: "Image generation" },
    ],
  };
}
