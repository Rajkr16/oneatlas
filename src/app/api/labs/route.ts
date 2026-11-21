import { route } from "@/lib/api";
import { listLabs } from "@/lib/services/directory";

export const GET = route(async () => listLabs());
