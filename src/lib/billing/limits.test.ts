import { describe, it, expect } from "vitest";
import { isOverLimit } from "./limits";

describe("isOverLimit", () => {
  it("is never over limit when max is null (unlimited)", () => {
    expect(isOverLimit(0, null)).toBe(false);
    expect(isOverLimit(1_000_000, null)).toBe(false);
  });

  it("is over limit once current reaches max", () => {
    expect(isOverLimit(3, 3)).toBe(true);
    expect(isOverLimit(4, 3)).toBe(true);
  });

  it("is not over limit while current is below max", () => {
    expect(isOverLimit(2, 3)).toBe(false);
    expect(isOverLimit(0, 1)).toBe(false);
  });

  it("treats max=0 as immediately blocking", () => {
    expect(isOverLimit(0, 0)).toBe(true);
  });
});
