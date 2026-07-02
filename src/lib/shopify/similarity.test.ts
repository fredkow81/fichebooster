import { describe, it, expect } from "vitest";
import { pickMostRelevantCollection, rankSimilarProducts } from "./similarity";
import type { ShopifyCollectionRef, ShopifyProductSummary } from "./types";

function collection(id: string, title: string): ShopifyCollectionRef {
  return { id, title, handle: title.toLowerCase() };
}

function product(id: string, title: string): ShopifyProductSummary {
  return { id, title, handle: title.toLowerCase(), status: "ACTIVE", featuredImage: null, collections: [], updatedAt: "" };
}

describe("pickMostRelevantCollection", () => {
  it("returns the only collection when there is just one", () => {
    const result = pickMostRelevantCollection("Bracelet pierre naturelle", [collection("1", "Bracelets")]);
    expect(result?.id).toBe("1");
  });

  it("returns null when there are no collections", () => {
    expect(pickMostRelevantCollection("Bracelet pierre naturelle", [])).toBeNull();
  });

  it("picks the collection whose name best matches the product title", () => {
    const result = pickMostRelevantCollection("Bracelet pierre naturelle oeil de tigre", [
      collection("1", "Nouveautés"),
      collection("2", "Bracelets cuir"),
      collection("3", "Pierres naturelles"),
    ]);
    expect(result?.id).toBe("3");
  });
});

describe("rankSimilarProducts", () => {
  const currentTitle = "Bracelet pierre naturelle oeil de tigre";

  it("excludes products that only share a generic category word", () => {
    const candidates = [product("1", "Bracelet cuir tressé mixte fermoir doré")];
    const result = rankSimilarProducts(currentTitle, candidates, 10);
    expect(result).toHaveLength(0);
  });

  it("includes products sharing multiple descriptive tokens", () => {
    const candidates = [product("1", "Bracelet pierre naturelle améthyste")];
    const result = rankSimilarProducts(currentTitle, candidates, 10);
    expect(result.map((p) => p.id)).toContain("1");
  });

  it("ranks the closest match first", () => {
    const candidates = [
      product("loose", "Bracelet pierre naturelle jaspe rouge"),
      product("tight", "Bracelet pierre naturelle oeil de tigre homme"),
    ];
    const result = rankSimilarProducts(currentTitle, candidates, 10);
    expect(result[0]?.id).toBe("tight");
  });

  it("respects the limit", () => {
    const candidates = Array.from({ length: 5 }, (_, i) =>
      product(`p${i}`, "Bracelet pierre naturelle oeil de tigre variante"),
    );
    const result = rankSimilarProducts(currentTitle, candidates, 2);
    expect(result).toHaveLength(2);
  });
});
