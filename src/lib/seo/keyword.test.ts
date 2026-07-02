import { describe, it, expect } from "vitest";
import { checkCannibalization, scoreTransactionalIntent } from "./keyword";

describe("checkCannibalization", () => {
  it("flags an exact duplicate keyword as high risk", () => {
    const result = checkCannibalization("sacoche homme cuir marron", [
      { productId: "p1", keyword: "sacoche homme cuir marron" },
    ]);
    expect(result.isExactDuplicate).toBe(true);
    expect(result.risk).toBe("HIGH");
    expect(result.conflictingProductIds).toContain("p1");
  });

  it("flags a highly similar keyword as medium or high risk", () => {
    const result = checkCannibalization("sacoche homme cuir noir", [
      { productId: "p1", keyword: "sacoche homme cuir marron" },
    ]);
    expect(["MEDIUM", "HIGH"]).toContain(result.risk);
  });

  it("returns low risk for an unrelated keyword", () => {
    const result = checkCannibalization("bijou de nez argenté", [
      { productId: "p1", keyword: "sacoche homme cuir marron" },
    ]);
    expect(result.risk).toBe("LOW");
    expect(result.conflictingProductIds).toHaveLength(0);
  });

  it("excludes the product's own existing keyword from the comparison", () => {
    const result = checkCannibalization("sacoche homme cuir marron", [
      { productId: "self", keyword: "sacoche homme cuir marron" },
    ], "self");
    expect(result.isExactDuplicate).toBe(false);
    expect(result.risk).toBe("LOW");
  });
});

describe("scoreTransactionalIntent", () => {
  it("scores a specific multi-word keyword higher than a generic one", () => {
    const specific = scoreTransactionalIntent("sacoche homme cuir marron bandoulière", "Sacoche");
    const generic = scoreTransactionalIntent("sac", "Sacoche");
    expect(specific).toBeGreaterThan(generic);
  });

  it("stays within 0-100 bounds", () => {
    const score = scoreTransactionalIntent("sacoche homme cuir marron bandoulière premium", "Sacoche");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
