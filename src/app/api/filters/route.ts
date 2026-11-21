import { route } from "@/lib/api";
import { getFacets } from "@/lib/services/models";

export const GET = route(async () => getFacets(), "public, s-maxage=300, stale-while-revalidate=600");
