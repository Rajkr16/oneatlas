import { route, searchParams } from "@/lib/api";
import { modelQuerySchema } from "@/lib/schemas";
import { listModels } from "@/lib/services/models";

export const GET = route(async (req) => listModels(modelQuerySchema.parse(searchParams(req))));
