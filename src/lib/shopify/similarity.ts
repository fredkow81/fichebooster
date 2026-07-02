import { tokenize, jaccardSimilarity } from "@/lib/text-similarity";
import type { ShopifyCollectionRef, ShopifyProductSummary } from "./types";

/**
 * Picks the collection most relevant to the product, based on title/name
 * token overlap. A product often belongs to several collections (e.g.
 * "Bracelets", "Nouveautés", "Pierres naturelles") — similar products and
 * internal-link candidates should be sourced from whichever one actually
 * matches the product, not just the first one Shopify happens to list.
 */
export function pickMostRelevantCollection(
  productTitle: string,
  collections: ShopifyCollectionRef[],
): ShopifyCollectionRef | null {
  if (collections.length === 0) return null;
  if (collections.length === 1) return collections[0]!;

  let best = collections[0]!;
  let bestScore = -1;
  for (const collection of collections) {
    const score = jaccardSimilarity(productTitle, collection.title);
    if (score > bestScore) {
      bestScore = score;
      best = collection;
    }
  }
  return best;
}

// A shared category word alone (e.g. every product in the collection being
// a "bracelet") isn't enough to call two products similar — require at
// least one more shared descriptor (material, color, style...).
const MIN_SHARED_TOKENS = 2;
const MIN_JACCARD_SCORE = 0.15;

/**
 * Filters and ranks candidate products by title similarity to the current
 * product, so "similar products" actually match in type/material/style
 * (a natural-stone bracelet won't surface a leather one just because both
 * happen to sit in the same broad "Bracelets" collection).
 */
export function rankSimilarProducts(
  productTitle: string,
  candidates: ShopifyProductSummary[],
  limit: number,
): ShopifyProductSummary[] {
  const baseTokens = new Set(tokenize(productTitle));
  if (baseTokens.size === 0) return [];

  return candidates
    .map((product) => {
      const candidateTokens = new Set(tokenize(product.title));
      const sharedCount = [...baseTokens].filter((t) => candidateTokens.has(t)).length;
      const unionSize = new Set([...baseTokens, ...candidateTokens]).size;
      const score = unionSize === 0 ? 0 : sharedCount / unionSize;
      return { product, score, sharedCount };
    })
    .filter((entry) => entry.sharedCount >= MIN_SHARED_TOKENS && entry.score >= MIN_JACCARD_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}
