import { route, searchParams } from "@/lib/api";
import { rankingQuerySchema } from "@/lib/schemas";
import { getRankings } from "@/lib/services/rankings";

export const GET = route(async (req) => getRankings(rankingQuerySchema.parse(searchParams(req))));
