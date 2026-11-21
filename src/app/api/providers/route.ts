import { route } from "@/lib/api";
import { listProviders } from "@/lib/services/directory";

export const GET = route(async () => listProviders());
