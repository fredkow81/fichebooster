const STOPWORDS = new Set([
  "de",
  "du",
  "des",
  "le",
  "la",
  "les",
  "un",
  "une",
  "et",
  "en",
  "pour",
  "avec",
  "à",
  "au",
  "aux",
]);

// Crude French plural stripping (bracelets -> bracelet, pierres -> pierre)
// so a collection named "Bracelets" matches a product titled "Bracelet ..."
// and near-duplicate keywords/titles aren't missed purely over singular vs
// plural. Deliberately not attempting gender agreement (doré/dorée) —
// higher risk of false merges for comparatively little gain here.
function stripPlural(token: string): string {
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stripPlural);
}

/** Jaccard similarity over token sets — simple, explainable, no external API required. */
export function jaccardSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}
