import { countWords, slugify } from "@/lib/utils";

export const TITLE_MAX_LENGTH = 70;
export const META_DESCRIPTION_MAX_LENGTH = 160;
export const META_TITLE_MAX_LENGTH = 70;
export const DESCRIPTION_MIN_WORDS = 600;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function result(errors: string[]): ValidationResult {
  return { valid: errors.length === 0, errors };
}

export function validateTitleLength(title: string): ValidationResult {
  const errors: string[] = [];
  if (!title.trim()) errors.push("Le titre ne peut pas être vide.");
  if (title.length > TITLE_MAX_LENGTH) {
    errors.push(`Le titre dépasse ${TITLE_MAX_LENGTH} caractères (${title.length}).`);
  }
  return result(errors);
}

export function validateMetaTitleLength(metaTitle: string): ValidationResult {
  const errors: string[] = [];
  if (!metaTitle.trim()) errors.push("Le meta title ne peut pas être vide.");
  if (metaTitle.length > META_TITLE_MAX_LENGTH) {
    errors.push(`Le meta title dépasse ${META_TITLE_MAX_LENGTH} caractères (${metaTitle.length}).`);
  }
  return result(errors);
}

export function validateMetaDescriptionLength(metaDescription: string): ValidationResult {
  const errors: string[] = [];
  if (!metaDescription.trim()) errors.push("La meta description ne peut pas être vide.");
  if (metaDescription.length > META_DESCRIPTION_MAX_LENGTH) {
    errors.push(
      `La meta description dépasse ${META_DESCRIPTION_MAX_LENGTH} caractères (${metaDescription.length}).`,
    );
  }
  return result(errors);
}

export function validateDescriptionWordCount(descriptionHtml: string): ValidationResult {
  const words = countWords(descriptionHtml);
  const errors: string[] = [];
  if (words < DESCRIPTION_MIN_WORDS) {
    errors.push(`La description contient ${words} mots (minimum ${DESCRIPTION_MIN_WORDS} requis).`);
  }
  return result(errors);
}

export function validateHandle(handle: string): ValidationResult {
  const errors: string[] = [];
  const slug = slugify(handle);
  if (!handle.trim()) {
    errors.push("Le handle ne peut pas être vide.");
  } else if (handle !== slug) {
    errors.push("Le handle doit être en minuscules, sans accents ni caractères spéciaux (ex: sacoche-homme-cuir).");
  }
  return result(errors);
}

export function validateInternalLinksPresent(descriptionHtml: string): ValidationResult {
  const errors: string[] = [];
  const hasCollectionLink = /<a\s+href=["']\/collections\//i.test(descriptionHtml);
  const hasProductLink = /<a\s+href=["']\/products\//i.test(descriptionHtml);
  if (!hasCollectionLink) errors.push("Aucun lien interne vers une collection n'a été trouvé dans la description.");
  if (!hasProductLink) errors.push("Aucun lien interne vers un produit similaire n'a été trouvé dans la description.");
  return result(errors);
}

const ENGLISH_COLOR_TERMS = [
  "black",
  "brown",
  "white",
  "silver",
  "gold",
  "red",
  "blue",
  "green",
  "grey",
  "gray",
  "beige",
  "navy",
];

export interface VariantPair {
  originalName: string;
  recommendedName: string;
}

export function validateVariantsTranslated(variants: VariantPair[]): ValidationResult {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const variant of variants) {
    const recommendedLower = variant.recommendedName.toLowerCase().trim();
    if (ENGLISH_COLOR_TERMS.some((term) => recommendedLower === term)) {
      errors.push(`La variante "${variant.originalName}" n'a pas été traduite en français.`);
    }
    if (seen.has(recommendedLower)) {
      errors.push(`Doublon détecté dans les variantes recommandées : "${variant.recommendedName}".`);
    }
    seen.add(recommendedLower);
  }

  return result(errors);
}

export function validateAll(input: {
  title: string;
  metaTitle: string;
  metaDescription: string;
  descriptionHtml: string;
  handle: string;
  variants: VariantPair[];
}): ValidationResult {
  const checks = [
    validateTitleLength(input.title),
    validateMetaTitleLength(input.metaTitle),
    validateMetaDescriptionLength(input.metaDescription),
    validateDescriptionWordCount(input.descriptionHtml),
    validateHandle(input.handle),
    validateInternalLinksPresent(input.descriptionHtml),
    validateVariantsTranslated(input.variants),
  ];
  const errors = checks.flatMap((c) => c.errors);
  return result(errors);
}
