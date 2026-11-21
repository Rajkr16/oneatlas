import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const DEFAULT_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

/** Wraps a route handler: JSON response, cache headers, uniform error shape. */
export function route<T>(
  fn: (req: Request, ctx: any) => Promise<T>, // eslint-disable-line @typescript-eslint/no-explicit-any
  cache = DEFAULT_CACHE,
) {
  return async (req: Request, ctx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      const data = await fn(req, ctx);
      return NextResponse.json(data, { headers: { "Cache-Control": cache } });
    } catch (e) {
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: "Invalid request", issues: e.flatten().fieldErrors },
          { status: 400 },
        );
      }
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      console.error(e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export const searchParams = (req: Request) =>
  Object.fromEntries(new URL(req.url).searchParams);

export const decodeSlug = (parts: string[]) =>
  parts.map((p) => decodeURIComponent(p)).join("/");
