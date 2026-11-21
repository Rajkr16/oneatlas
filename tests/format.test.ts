import { describe, expect, it } from "vitest";
import { fmtContext, fmtDate, fmtPrice, label } from "@/lib/format";

describe("format helpers", () => {
  it("formats prices", () => {
    expect(fmtPrice(0)).toBe("Free");
    expect(fmtPrice(0.3)).toBe("$0.30");
    expect(fmtPrice(15)).toBe("$15.00");
    expect(fmtPrice(0.0125)).toBe("$0.0125");
  });
  it("formats context windows", () => {
    expect(fmtContext(8192)).toBe("8K");
    expect(fmtContext(128000)).toBe("128K");
    expect(fmtContext(1_000_000)).toBe("1M");
    expect(fmtContext(null)).toBe("–");
  });
  it("formats dates in UTC", () => {
    expect(fmtDate("2025-01-15T00:00:00Z")).toBe("Jan 15, 2025");
  });
  it("labels slugs", () => {
    expect(label("tool-calling")).toBe("Tool calling");
  });
});
