import { describe, it, expect } from "vitest";
import { parseAiOptimizationResult } from "./schema";

function validPayload() {
  return {
    image_analysis: {
      product_type: "Sacoche",
      visible_materials: ["cuir"],
      colors: ["marron"],
      style: "casual",
      target_user: "homme",
      important_visual_details: ["bandoulière ajustable"],
    },
    keyword: {
      primary_keyword: "sacoche homme cuir marron",
      transactional_intent_score: 80,
      relevance_score: 85,
      cannibalization_risk: "LOW",
      justification: "Cohérent avec la niche et non utilisé ailleurs.",
    },
    handle: {
      current_handle: "sac-homme-tendance",
      recommended_handle: "sacoche-homme-cuir-marron",
    },
    titles: {
      seo_title: "Sacoche homme cuir marron bandoulière",
      google_shopping_title: "Sacoche homme cuir marron",
      balanced_title: "Sacoche homme cuir marron - Maison Kowal",
    },
    meta: {
      meta_title: "Sacoche homme cuir marron - Achat en ligne",
      meta_description: "Découvrez notre sacoche homme en cuir marron, idéale au quotidien.",
    },
    variants: {
      current_variants: [{ id: "1", original_name: "Brown", recommended_name: "Brown" }],
      recommended_variants: [{ id: "1", original_name: "Brown", recommended_name: "Marron" }],
    },
    description_html: "<h2>Présentation</h2><p>Texte...</p>",
    internal_links: {
      collection_link: {
        url: "/collections/sacoches-homme",
        anchor: "notre collection de sacoches homme",
        justification: "Collection la plus pertinente.",
      },
      similar_product_link: {
        url: "/products/sacoche-bandouliere-compacte",
        anchor: "un modèle similaire",
        justification: "Même collection, style proche.",
      },
    },
    seo_score: {
      before: 35,
      after: 85,
      improvements: ["Mot-clé unique défini"],
    },
  };
}

describe("parseAiOptimizationResult", () => {
  it("accepts a well-formed AI JSON payload", () => {
    expect(() => parseAiOptimizationResult(validPayload())).not.toThrow();
  });

  it("rejects a payload missing required fields", () => {
    const payload = validPayload() as Record<string, unknown>;
    delete (payload.keyword as Record<string, unknown>).primary_keyword;
    expect(() => parseAiOptimizationResult(payload)).toThrow();
  });

  it("rejects a payload with an invalid cannibalization risk enum value", () => {
    const payload = validPayload();
    (payload.keyword as Record<string, unknown>).cannibalization_risk = "UNKNOWN";
    expect(() => parseAiOptimizationResult(payload)).toThrow();
  });

  it("rejects a title over 70 characters", () => {
    const payload = validPayload();
    payload.titles.seo_title = "a".repeat(80);
    expect(() => parseAiOptimizationResult(payload)).toThrow();
  });
});
