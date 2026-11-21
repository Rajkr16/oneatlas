import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { HttpError, decodeSlug, route, searchParams } from "@/lib/api";

describe("route() wrapper", () => {
  it("returns JSON with cache headers on success", async () => {
    const res = await route(async () => ({ ok: true }))(new Request("http://x/api"), {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
  });
  it("maps validation errors to 400 with field details", async () => {
    const res = await route(async () => z.object({ n: z.number() }).parse({ n: "x" }))(new Request("http://x/api"), {});
    expect(res.status).toBe(400);
    expect((await res.json()).issues.n).toBeDefined();
  });
  it("maps HttpError to its status", async () => {
    const res = await route(async () => { throw new HttpError(404, "Model not found"); })(new Request("http://x/api"), {});
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Model not found" });
  });
  it("hides unexpected errors behind a 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await route(async () => { throw new Error("db password leaked"); })(new Request("http://x/api"), {});
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("password");
  });
});

describe("helpers", () => {
  it("reads query params", () => {
    expect(searchParams(new Request("http://x/api?q=gpt&page=2"))).toEqual({ q: "gpt", page: "2" });
  });
  it("rebuilds slugs with slashes and colons", () => {
    expect(decodeSlug(["meta-llama", "llama-3.3-70b-instruct%3Afree"])).toBe("meta-llama/llama-3.3-70b-instruct:free");
  });
});
