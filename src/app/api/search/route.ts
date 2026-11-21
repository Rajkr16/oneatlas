import { route, searchParams } from "@/lib/api";
import { searchQuerySchema } from "@/lib/schemas";
import { globalSearch } from "@/lib/services/directory";

export const GET = route(async (req) => globalSearch(searchQuerySchema.parse(searchParams(req)).q));
