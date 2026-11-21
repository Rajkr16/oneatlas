import { route, decodeSlug } from "@/lib/api";
import { getModel } from "@/lib/services/models";

export const GET = route(async (_req, ctx) => {
  const { slug } = (await ctx.params) as { slug: string[] };
  return getModel(decodeSlug(slug));
});
