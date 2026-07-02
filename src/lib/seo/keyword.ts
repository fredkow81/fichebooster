import { tokenize, jaccardSimilarity as similarity } from "@/lib/text-similarity";

export interface KeywordUsage {
  productId: string;
  keyword: string;
}

export type CannibalizationRisk = "LOW" | "MEDIUM" | "HIGH";

export interface CannibalizationCheck {
  risk: CannibalizationRisk;
  conflictingProductIds: string[];
  isExactDuplicate: boolean;
}

const HIGH_RISK_THRESHOLD = 0.75;
const MEDIUM_RISK_THRESHOLD = 0.4;

/**
 * Checks a candidate keyword against keywords already used by other products
 * in the same store. This is the fallback scoring used when no external
 * keyword-research API (Search Console, Ads Keyword Planner, Semrush,
 * Ahrefs, DataForSEO) is connected — see AiProvider for where such an
 * integration would plug in.
 */
export function checkCannibalization(
  candidateKeyword: string,
  existingUsages: KeywordUsage[],
  excludeProductId?: string,
): CannibalizationCheck {
  const relevant = existingUsages.filter((u) => u.productId !== excludeProductId);

  let maxSimilarity = 0;
  let isExactDuplicate = false;
  const conflicting: string[] = [];

  for (const usage of relevant) {
    const sim = similarity(candidateKeyword, usage.keyword);
    if (sim >= MEDIUM_RISK_THRESHOLD) {
      conflicting.push(usage.productId);
    }
    if (sim > maxSimilarity) maxSimilarity = sim;
    if (usage.keyword.trim().toLowerCase() === candidateKeyword.trim().toLowerCase()) {
      isExactDuplicate = true;
    }
  }

  let risk: CannibalizationRisk = "LOW";
  if (isExactDuplicate || maxSimilarity >= HIGH_RISK_THRESHOLD) risk = "HIGH";
  else if (maxSimilarity >= MEDIUM_RISK_THRESHOLD) risk = "MEDIUM";

  return { risk, conflictingProductIds: conflicting, isExactDuplicate };
}

/**
 * Transactional-intent heuristic score (0-100), used when no external
 * search-volume API is connected. Rewards specificity and product-relevant
 * terms; penalizes overly generic single-word keywords.
 */
export function scoreTransactionalIntent(keyword: string, productType: string): number {
  const tokens = tokenize(keyword);
  let score = 40;

  if (tokens.length >= 2) score += 20;
  if (tokens.length >= 3) score += 10;
  if (productType && tokens.some((t) => tokenize(productType).includes(t))) score += 15;
  if (tokens.length === 1) score -= 15;

  return Math.max(0, Math.min(100, score));
}
