import { describe, it, expect } from "vitest";
import { computeSeoScore } from "./scoring";

describe("computeSeoScore", () => {
  it("scores a poorly optimized product low", () => {
    const { score } = computeSeoScore({
      hasUniquePrimaryKeyword: false,
      title: "",
      metaTitle: "",
      metaDescription: "",
      descriptionHtml: "<p>Trop court.</p>",
      hasInternalLinks: false,
      variantsConsistent: false,
      cannibalizationRisk: "HIGH",
    });
    expect(score).toBeLessThan(20);
  });

  it("scores a fully optimized product near 100", () => {
    const words = Array.from({ length: 650 }, () => "mot").join(" ");
    const { score, toImprove } = computeSeoScore({
      hasUniquePrimaryKeyword: true,
      title: "Sacoche homme cuir marron",
      metaTitle: "Sacoche homme cuir marron - Achat en ligne",
      metaDescription: "Découvrez notre sacoche homme en cuir marron, pratique et élégante au quotidien.",
      descriptionHtml: `<h2>Titre</h2><h3>Sous-titre</h3><p>${words}</p>`,
      hasInternalLinks: true,
      variantsConsistent: true,
      cannibalizationRisk: "LOW",
    });
    expect(score).toBe(100);
    expect(toImprove).toHaveLength(0);
  });
});
