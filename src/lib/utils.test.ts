import { describe, it, expect } from "vitest";
import { slugify, countWords, truncate, extractGid } from "./utils";

describe("slugify", () => {
  it("converts a French product name into a valid Shopify handle", () => {
    expect(slugify("Sacoche Homme Cuir Marron Été")).toBe("sacoche-homme-cuir-marron-ete");
  });

  it("collapses repeated separators", () => {
    expect(slugify("Sac  --  Homme")).toBe("sac-homme");
  });
});

describe("countWords", () => {
  it("strips HTML tags before counting", () => {
    expect(countWords("<p>Un <strong>petit</strong> texte</p>")).toBe(3);
  });

  it("returns 0 for empty content", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("<p></p>")).toBe(0);
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("court", 20)).toBe("court");
  });

  it("truncates long strings and adds an ellipsis", () => {
    const result = truncate("a".repeat(30), 10);
    expect(result.length).toBe(10);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("extractGid", () => {
  it("extracts the numeric id from a Shopify GID", () => {
    expect(extractGid("gid://shopify/Product/123456789")).toBe("123456789");
  });
});
