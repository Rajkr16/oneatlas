import { ModelType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api";
import type { RankingQuery } from "@/lib/schemas";

const TYPE_MAP: Record<string, ModelType> = { text: "TEXT", multimodal: "MULTIMODAL", image: "IMAGE" };

export async function getRankings({ benchmark, category, type, limit }: RankingQuery) {
  const all = await prisma.benchmark.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const categories = Array.from(new Set(all.map((b) => b.category)));
  const pool = category ? all.filter((b) => b.category === category) : all;
  if (!pool.length) throw new HttpError(404, "Unknown category");
  const active = pool.find((b) => b.slug === benchmark) ?? pool[0];

  const rows = await prisma.benchmarkScore.findMany({
    where: { benchmarkId: active.id, ...(type ? { model: { type: TYPE_MAP[type] } } : {}) },
    orderBy: [{ score: "desc" }, { modelId: "asc" }],
    take: limit,
    include: {
      model: {
        select: {
          slug: true,
          name: true,
          inputPrice: true,
          outputPrice: true,
          contextLength: true,
          lab: { select: { slug: true, name: true } },
        },
      },
    },
  });

  return {
    benchmark: active,
    benchmarks: pool,
    categories,
    rows: rows.map((r, i) => ({ rank: i + 1, score: r.score, model: r.model })),
  };
}
