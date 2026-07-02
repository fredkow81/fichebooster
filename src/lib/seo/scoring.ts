import { countWords } from "@/lib/utils";
import {
  DESCRIPTION_MIN_WORDS,
  META_DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from "./validators";
import type { CannibalizationRisk } from "./keyword";

export interface SeoScoreInput {
  hasUniquePrimaryKeyword: boolean;
  title: string;
  metaTitle: string;
  metaDescription: string;
  descriptionHtml: string;
  hasInternalLinks: boolean;
  variantsConsistent: boolean;
  cannibalizationRisk: CannibalizationRisk;
}

export interface SeoScoreBreakdown {
  score: number;
  passed: string[];
  toImprove: string[];
}

interface Criterion {
  label: string;
  weight: number;
  check: (input: SeoScoreInput) => boolean;
}

// Weights sum to 100. Each criterion maps directly to a rule from the
// product spec so the score stays explainable in the UI.
const CRITERIA: Criterion[] = [
  {
    label: "Mot-clé principal unique et non dupliqué",
    weight: 15,
    check: (i) => i.hasUniquePrimaryKeyword,
  },
  {
    label: "Risque de cannibalisation faible",
    weight: 10,
    check: (i) => i.cannibalizationRisk === "LOW",
  },
  {
    label: "Titre présent et ≤ 70 caractères",
    weight: 15,
    check: (i) => i.title.trim().length > 0 && i.title.length <= TITLE_MAX_LENGTH,
  },
  {
    label: "Meta title renseigné",
    weight: 10,
    check: (i) => i.metaTitle.trim().length > 0,
  },
  {
    label: "Meta description ≤ 160 caractères",
    weight: 10,
    check: (i) =>
      i.metaDescription.trim().length > 0 && i.metaDescription.length <= META_DESCRIPTION_MAX_LENGTH,
  },
  {
    label: `Description ≥ ${DESCRIPTION_MIN_WORDS} mots`,
    weight: 15,
    check: (i) => countWords(i.descriptionHtml) >= DESCRIPTION_MIN_WORDS,
  },
  {
    label: "Structure H2/H3 présente",
    weight: 10,
    check: (i) => /<h2/i.test(i.descriptionHtml) && /<h3/i.test(i.descriptionHtml),
  },
  {
    label: "Maillage interne (collection + produit similaire)",
    weight: 10,
    check: (i) => i.hasInternalLinks,
  },
  {
    label: "Variantes cohérentes et traduites",
    weight: 5,
    check: (i) => i.variantsConsistent,
  },
];

export function computeSeoScore(input: SeoScoreInput): SeoScoreBreakdown {
  const passed: string[] = [];
  const toImprove: string[] = [];
  let score = 0;

  for (const criterion of CRITERIA) {
    if (criterion.check(input)) {
      score += criterion.weight;
      passed.push(criterion.label);
    } else {
      toImprove.push(criterion.label);
    }
  }

  return { score, passed, toImprove };
}
