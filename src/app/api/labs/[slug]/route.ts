import { route } from "@/lib/api";
import { getLab } from "@/lib/services/directory";

export const GET = route(async (_req, ctx) => getLab((await ctx.params).slug));
