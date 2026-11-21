import { route, searchParams } from "@/lib/api";
import { compareQuerySchema } from "@/lib/schemas";
import { compareModels } from "@/lib/services/models";

export const GET = route(async (req) => {
  const { models } = compareQuerySchema.parse(searchParams(req));
  return compareModels(models);
});
