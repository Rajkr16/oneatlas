import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api";
import { modelListSelect } from "./models";

export async function listLabs() {
  const labs = await prisma.lab.findMany({
    select: {
      slug: true,
      name: true,
      _count: { select: { models: true } },
      models: { select: { releasedAt: true }, orderBy: { releasedAt: "desc" }, take: 1 },
    },
    orderBy: { models: { _count: "desc" } },
  });
  return labs.map(({ models, ...l }) => ({ ...l, latestRelease: models[0]?.releasedAt ?? null }));
}

export async function getLab(slug: string) {
  const lab = await prisma.lab.findUnique({
    where: { slug },
    include: { models: { orderBy: { releasedAt: "desc" }, select: modelListSelect } },
  });
  if (!lab) throw new HttpError(404, "Lab not found");
  const providers = await prisma.provider.findMany({
    where: { models: { some: { model: { labId: lab.id } } } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
  return { ...lab, providers };
}

export async function listProviders() {
  return prisma.provider.findMany({
    select: { slug: true, name: true, _count: { select: { models: true } } },
    orderBy: [{ models: { _count: "desc" } }, { name: "asc" }],
  });
}

export async function getProvider(slug: string) {
  const provider = await prisma.provider.findUnique({
    where: { slug },
    include: {
      models: {
        orderBy: { model: { releasedAt: "desc" } },
        include: { model: { select: modelListSelect } },
      },
    },
  });
  if (!provider) throw new HttpError(404, "Provider not found");
  return provider;
}

export async function globalSearch(q: string) {
  const c = { contains: q, mode: "insensitive" as const };
  const [models, labs, providers] = await Promise.all([
    prisma.model.findMany({
      where: { OR: [{ name: c }, { slug: c }] },
      select: { slug: true, name: true, lab: { select: { name: true } } },
      orderBy: { releasedAt: "desc" },
      take: 6,
    }),
    prisma.lab.findMany({ where: { name: c }, select: { slug: true, name: true }, take: 3 }),
    prisma.provider.findMany({ where: { name: c }, select: { slug: true, name: true }, take: 3 }),
  ]);
  return { models, labs, providers };
}

export async function homeStats() {
  const [models, labs, providers, newest] = await Promise.all([
    prisma.model.count(),
    prisma.lab.count(),
    prisma.provider.count(),
    prisma.model.findMany({ orderBy: { releasedAt: "desc" }, take: 8, select: modelListSelect }),
  ]);
  return { models, labs, providers, newest };
}
