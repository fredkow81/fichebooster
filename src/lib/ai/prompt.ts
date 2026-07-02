import type { ShopifyCollectionRef, ShopifyProduct, ShopifyProductSummary, ShopifyVariant } from "@/lib/shopify/types";

export interface ExistingKeywordUsage {
  productId: string;
  title: string;
  handle: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface OrientationContext {
  niche: string;
  collectionHint?: string;
  targetMarket: string;
  targetLanguage: string;
  tone: "NATURAL" | "PREMIUM" | "EXPERT" | "ACCESSIBLE";
  objective: "SEO" | "GOOGLE_SHOPPING" | "CONVERSION" | "BALANCED";
}

export interface PromptContext {
  product: ShopifyProduct;
  storeDomain: string;
  collections: ShopifyCollectionRef[];
  similarProducts: ShopifyProductSummary[];
  existingKeywords: ExistingKeywordUsage[];
  orientation: OrientationContext;
}

const TONE_LABEL: Record<OrientationContext["tone"], string> = {
  NATURAL: "naturel et professionnel",
  PREMIUM: "premium et valorisant",
  EXPERT: "expert et technique",
  ACCESSIBLE: "simple et accessible",
};

const OBJECTIVE_LABEL: Record<OrientationContext["objective"], string> = {
  SEO: "priorité au référencement naturel (SEO)",
  GOOGLE_SHOPPING: "priorité à la compatibilité Google Shopping / Google Ads",
  CONVERSION: "priorité à la conversion et à l'incitation à l'achat",
  BALANCED: "équilibre entre SEO et conversion",
};

export const JSON_OUTPUT_CONTRACT = `{
  "image_analysis": {
    "product_type": "",
    "visible_materials": [],
    "colors": [],
    "style": "",
    "target_user": "",
    "important_visual_details": []
  },
  "keyword": {
    "primary_keyword": "",
    "transactional_intent_score": 0,
    "relevance_score": 0,
    "cannibalization_risk": "LOW | MEDIUM | HIGH",
    "justification": ""
  },
  "handle": {
    "current_handle": "",
    "recommended_handle": ""
  },
  "titles": {
    "seo_title": "",
    "google_shopping_title": "",
    "balanced_title": ""
  },
  "meta": {
    "meta_title": "",
    "meta_description": ""
  },
  "variants": {
    "current_variants": [{ "id": "", "original_name": "", "recommended_name": "" }],
    "recommended_variants": [{ "id": "", "original_name": "", "recommended_name": "" }]
  },
  "description_html": "",
  "internal_links": {
    "collection_link": { "url": "", "anchor": "", "justification": "" },
    "similar_product_link": { "url": "", "anchor": "", "justification": "" }
  },
  "seo_score": {
    "before": 0,
    "after": 0,
    "improvements": []
  }
}`;

function formatVariants(variants: ShopifyVariant[]): string {
  return variants
    .map((v) => `- id: ${v.id} | nom actuel: "${v.title}" | options: ${v.selectedOptions.map((o) => `${o.name}=${o.value}`).join(", ")}`)
    .join("\n");
}

export function buildSystemPrompt(): string {
  return `Tu es un expert senior en SEO e-commerce Shopify, Google Shopping/Google Ads et rédaction produit. Tu analyses des images produit et des données Shopify pour produire une optimisation SEO complète, précise et honnête. Tu ne dois JAMAIS inventer une caractéristique non visible sur les images ou non fournie dans les données. Tu dois répondre UNIQUEMENT avec un objet JSON strictement valide respectant le contrat fourni, sans texte avant ou après, sans balises markdown.`;
}

export function buildUserPrompt(ctx: PromptContext): string {
  const { product, collections, similarProducts, existingKeywords, orientation } = ctx;

  const existingKeywordsBlock = existingKeywords.length
    ? existingKeywords
        .map(
          (k) =>
            `- Produit "${k.title}" (handle: ${k.handle}) | meta title: ${k.metaTitle ?? "—"} | meta description: ${k.metaDescription ?? "—"}`,
        )
        .join("\n")
    : "Aucun autre produit indexé pour le moment.";

  const collectionsBlock = collections.length
    ? collections.map((c) => `- ${c.title} (handle: ${c.handle}, id: ${c.id})`).join("\n")
    : "Aucune collection disponible.";

  const similarProductsBlock = similarProducts.length
    ? similarProducts
        .map((p) => `- ${p.title} (handle: ${p.handle}, id: ${p.id})`)
        .join("\n")
    : "Aucun produit similaire disponible dans la même collection.";

  return `# Contexte boutique
Boutique : ${ctx.storeDomain}
Marché cible : ${orientation.targetMarket}
Langue de rédaction : ${orientation.targetLanguage}
Ton souhaité : ${TONE_LABEL[orientation.tone]}
Objectif principal : ${OBJECTIVE_LABEL[orientation.objective]}
Niche renseignée : ${orientation.niche}
Collection suggérée par l'utilisateur : ${orientation.collectionHint ?? "non précisée, à déduire"}

# Produit à optimiser
Titre actuel : ${product.title}
Handle actuel : ${product.handle}
Description actuelle (HTML) : ${product.descriptionHtml || "(vide)"}
Meta title actuel : ${product.seo.title ?? "(vide)"}
Meta description actuelle : ${product.seo.description ?? "(vide)"}
Vendeur : ${product.vendor}
Type de produit Shopify : ${product.productType}

# Variantes actuelles
${formatVariants(product.variants)}

# Collections disponibles dans la boutique (choisis la plus pertinente pour le maillage interne)
${collectionsBlock}

# Produits similaires dans la/les même(s) collection(s) (choisis-en un pour le maillage interne, jamais le produit lui-même)
${similarProductsBlock}

# Mots-clés déjà utilisés par d'autres fiches produit de la boutique (à éviter pour ne pas cannibaliser)
${existingKeywordsBlock}

# Ce qui est attendu
1. Analyse les images produit fournies en pièce jointe pour identifier précisément : type de produit, matières visibles, couleurs, style, usage/cible, détails visuels importants et différenciants. Ne devine pas ce qui n'est pas visible.
2. Propose UN mot-clé principal transactionnel, précis, non générique, cohérent avec la niche et non déjà utilisé par un autre produit de la boutique (voir liste ci-dessus). Évalue son risque de cannibalisation.
3. Propose un handle optimisé basé sur ce mot-clé (slug, minuscules, tirets).
4. Propose 3 variantes de titre (SEO, Google Shopping, équilibrée), chacune ≤ 70 caractères, sans bourrage de mots-clés, sans superlatifs non justifiés, correspondant exactement au produit visible.
5. Propose un meta title (≤ 60-70 caractères) et une meta description (≤ 160 caractères), uniques, attractifs, non génériques.
6. Analyse chaque variante actuelle et propose un nom corrigé (traduction française si besoin, ex: Black -> Noir, Brown -> Marron, Dark Brown -> Marron foncé, cohérence avec l'image, suppression des doublons/anglicismes inutiles). Conserve le même id que la variante d'origine.
7. Rédige une description HTML complète d'au moins 600 mots, structurée avec <h2>/<h3>/<p>/<ul>/<li>, ton ${TONE_LABEL[orientation.tone]}, incluant : introduction, bénéfices concrets, adéquation au besoin, conseils d'utilisation, conseils d'entretien/choix, FAQ courte (2-4 questions). N'invente aucune caractéristique non confirmée. Insère naturellement DEUX liens internes dans le texte (pas dans une liste à part) :
   - un lien vers la collection mère choisie, avec une ancre naturelle (utilise <a href="/collections/{handle}">ancre naturelle</a>)
   - un lien vers un produit similaire choisi, avec une ancre naturelle (utilise <a href="/products/{handle}">ancre naturelle</a>)
8. Justifie brièvement le choix de la collection et du produit similaire dans les champs internal_links.
9. Calcule un score SEO avant/après (0-100) et liste les points améliorés.

# Format de sortie strict (JSON uniquement, aucun texte autour)
${JSON_OUTPUT_CONTRACT}`;
}
