import { route } from "@/lib/api";
import { getProvider } from "@/lib/services/directory";

export const GET = route(async (_req, ctx) => getProvider((await ctx.params).slug));
