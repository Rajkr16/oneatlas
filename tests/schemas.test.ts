import { describe, expect, it } from "vitest";
import { compareQuerySchema, modelQuerySchema, rankingQuerySchema, searchQuerySchema } from "@/lib/schemas";

describe("modelQuerySchema", () => {
  it("applies defaults", () => {
    const q = modelQuerySchema.parse({});
    expect(q).toMatchObject({ sort: "release", order: "desc", page: 1, pageSize: 24, lab: [], capability: [] });
  });
  it("parses comma-separated filters and coerces numbers", () => {
    const q = modelQuerySchema.parse({ lab: "openai, anthropic", capability: "vision", page: "3", pageSize: "50" });
    expect(q.lab).toEqual(["openai", "anthropic"]);
    expect(q.capability).toEqual(["vision"]);
    expect(q.page).toBe(3);
    expect(q.pageSize).toBe(50);
  });
  it("rejects bad sort, page and pageSize", () => {
    expect(() => modelQuerySchema.parse({ sort: "price; DROP TABLE" })).toThrow();
    expect(() => modelQuerySchema.parse({ page: "0" })).toThrow();
    expect(() => modelQuerySchema.parse({ pageSize: "1000" })).toThrow();
  });
});

describe("compareQuerySchema", () => {
  it("accepts 1-4 models and rejects 5", () => {
    expect(compareQuerySchema.parse({ models: "a/b,c/d" }).models).toEqual(["a/b", "c/d"]);
    expect(() => compareQuerySchema.parse({ models: "a,b,c,d,e" })).toThrow();
    expect(() => compareQuerySchema.parse({ models: "" })).toThrow();
  });
});

describe("rankingQuerySchema / searchQuerySchema", () => {
  it("validates ranking type and limit", () => {
    expect(rankingQuerySchema.parse({ type: "text" }).limit).toBe(25);
    expect(() => rankingQuerySchema.parse({ type: "video" })).toThrow();
  });
  it("requires a non-empty search query", () => {
    expect(() => searchQuerySchema.parse({ q: "  " })).toThrow();
    expect(searchQuerySchema.parse({ q: " gpt " }).q).toBe("gpt");
  });
});
