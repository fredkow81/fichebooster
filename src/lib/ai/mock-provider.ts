import { slugify, countWords } from "@/lib/utils";
import type { AiProvider } from "./provider";
import type { PromptContext } from "./prompt";
import type { AiOptimizationResult } from "./schema";

/**
 * Deterministic fixture provider used when AI_MOCK_MODE=true. Produces
 * plausible, internally-consistent output derived from real product data
 * (title, variants, niche) so the full UI/flow can be exercised locally
 * without an Anthropic API key.
 */
export class MockAiProvider implements AiProvider {
  async generateOptimization(ctx: PromptContext): Promise<AiOptimizationResult> {
    const { product, orientation, collections, similarProducts, existingKeywords } = ctx;

    const baseType = product.productType || orientation.niche;
    const firstVariantColor = product.variants[0]?.selectedOptions.find((o) =>
      /couleur|color/i.test(o.name),
    )?.value;
    const color = translateColor(firstVariantColor) ?? "";

    let primaryKeyword = [baseType, color].filter(Boolean).join(" ").toLowerCase().trim();
    if (!primaryKeyword) primaryKeyword = orientation.niche.toLowerCase();

    const usedHandles = new Set(existingKeywords.map((k) => k.handle));
    let candidateHandle = slugify(primaryKeyword);
    let cannibalizationRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (usedHandles.has(candidateHandle)) {
      cannibalizationRisk = "HIGH";
      primaryKeyword = `${primaryKeyword} ${orientation.targetMarket}`.toLowerCase();
      candidateHandle = slugify(primaryKeyword);
    }

    const titleBase = capitalize(`${baseType} ${color}`.trim());
    const seoTitle = truncate(`${titleBase} - ${orientation.niche}`, 70);
    const shoppingTitle = truncate(titleBase, 70);
    const balancedTitle = truncate(`${titleBase} | ${product.vendor}`, 70);

    const metaTitle = truncate(`${titleBase} - Achat en ligne`, 70);
    const metaDescription = truncate(
      `Découvrez ${primaryKeyword} chez ${product.vendor}. Qualité, style et livraison rapide en ${orientation.targetMarket}.`,
      160,
    );

    const chosenCollection = collections.find((c) =>
      orientation.collectionHint
        ? c.title.toLowerCase().includes(orientation.collectionHint.toLowerCase())
        : product.collections.some((pc) => pc.id === c.id),
    ) ?? collections[0];

    const chosenSimilar = similarProducts[0];

    const descriptionHtml = buildDescriptionHtml({
      titleBase,
      primaryKeyword,
      niche: orientation.niche,
      vendor: product.vendor,
      collection: chosenCollection,
      similar: chosenSimilar,
    });

    const recommendedVariants = product.variants.map((v) => ({
      id: v.id,
      original_name: v.title,
      recommended_name: translateVariantName(v.title),
    }));

    return {
      image_analysis: {
        product_type: baseType || "Produit",
        visible_materials: [],
        colors: color ? [color] : [],
        style: orientation.tone === "PREMIUM" ? "élégant" : "moderne",
        target_user: "Non déterminé (mode démonstration, images non analysées)",
        important_visual_details: [
          "Analyse visuelle simulée — connectez OPENAI_API_KEY et désactivez AI_MOCK_MODE pour une analyse réelle des images.",
        ],
      },
      keyword: {
        primary_keyword: primaryKeyword,
        transactional_intent_score: 72,
        relevance_score: 80,
        cannibalization_risk: cannibalizationRisk,
        justification: `Mot-clé généré à partir du type de produit (${baseType || "n/a"}), de la couleur détectée (${color || "n/a"}) et de la niche renseignée (${orientation.niche}).`,
      },
      handle: {
        current_handle: product.handle,
        recommended_handle: candidateHandle,
      },
      titles: {
        seo_title: seoTitle,
        google_shopping_title: shoppingTitle,
        balanced_title: balancedTitle,
      },
      meta: {
        meta_title: metaTitle,
        meta_description: metaDescription,
      },
      variants: {
        current_variants: product.variants.map((v) => ({
          id: v.id,
          original_name: v.title,
          recommended_name: v.title,
        })),
        recommended_variants: recommendedVariants,
      },
      description_html: descriptionHtml,
      internal_links: {
        collection_link: {
          url: chosenCollection ? `/collections/${chosenCollection.handle}` : "",
          anchor: chosenCollection ? `notre collection ${chosenCollection.title.toLowerCase()}` : "",
          justification: chosenCollection
            ? `Collection "${chosenCollection.title}" cohérente avec la niche "${orientation.niche}".`
            : "Aucune collection disponible dans la boutique.",
        },
        similar_product_link: {
          url: chosenSimilar ? `/products/${chosenSimilar.handle}` : "",
          anchor: chosenSimilar ? `un modèle similaire, ${chosenSimilar.title.toLowerCase()}` : "",
          justification: chosenSimilar
            ? `Produit "${chosenSimilar.title}" partageant la même collection et un usage proche.`
            : "Aucun produit similaire disponible dans la même collection.",
        },
      },
      seo_score: {
        before: 35,
        after: 84,
        improvements: [
          "Mot-clé principal unique défini",
          "Titre réécrit avec mot-clé naturel",
          "Meta title et meta description optimisés",
          "Description enrichie et structurée (H2/H3)",
          "Maillage interne ajouté (collection + produit similaire)",
        ],
      },
    };
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

const COLOR_MAP: Record<string, string> = {
  black: "Noir",
  brown: "Marron",
  "dark brown": "Marron foncé",
  "light brown": "Marron clair",
  silver: "Argenté",
  gold: "Doré",
  white: "Blanc",
  red: "Rouge",
  blue: "Bleu",
  green: "Vert",
  grey: "Gris",
  gray: "Gris",
  beige: "Beige",
  navy: "Bleu marine",
};

function translateColor(value?: string): string | undefined {
  if (!value) return undefined;
  return COLOR_MAP[value.toLowerCase()] ?? value;
}

function translateVariantName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  if (lower === "default title") return "Standard";
  return name;
}

function buildDescriptionHtml(args: {
  titleBase: string;
  primaryKeyword: string;
  niche: string;
  vendor: string;
  collection?: { handle: string; title: string };
  similar?: { handle: string; title: string };
}): string {
  const { titleBase, primaryKeyword, niche, vendor, collection, similar } = args;

  const collectionLink = collection
    ? `<a href="/collections/${collection.handle}">notre collection ${collection.title.toLowerCase()}</a>`
    : "notre sélection de produits";
  const similarLink = similar
    ? `<a href="/products/${similar.handle}">un modèle similaire, ${similar.title.toLowerCase()}</a>`
    : "un autre modèle de notre boutique";

  const html = `
<p>Vous recherchez ${primaryKeyword} fiable et adapté à votre quotidien ? Ce ${titleBase.toLowerCase()} signé ${vendor} a été pensé pour répondre aux attentes des amateurs de la niche ${niche}, en conjuguant praticité et style.</p>
<h2>Pourquoi choisir ce produit ?</h2>
<p>Ce produit se distingue par sa conception soignée et son usage polyvalent au quotidien. Il s'intègre naturellement dans ${collectionLink}, pensée pour les personnes exigeantes sur la qualité comme sur le style.</p>
<ul>
<li>Un design pensé pour un usage quotidien</li>
<li>Une fabrication soignée</li>
<li>Un style qui s'accorde avec de nombreuses tenues</li>
</ul>
<h2>Un produit adapté à votre besoin</h2>
<p>Que vous soyez à la recherche d'un article pour un usage régulier ou pour une occasion particulière, ce produit s'adapte à vos besoins grâce à sa polyvalence. Il complète parfaitement ${similarLink}, si vous souhaitez comparer plusieurs styles avant de faire votre choix.</p>
<h3>Conseils d'utilisation</h3>
<p>Pour profiter pleinement de votre achat, utilisez-le dans le cadre pour lequel il a été conçu et évitez les expositions prolongées à des conditions susceptibles de l'endommager.</p>
<h3>Conseils d'entretien</h3>
<p>Un entretien régulier et adapté permet de préserver l'aspect et la durabilité du produit dans le temps.</p>
<h2>Questions fréquentes</h2>
<p><strong>Ce produit convient-il à un usage quotidien ?</strong><br/>Oui, il a été conçu pour un usage régulier tout en conservant son aspect dans le temps.</p>
<p><strong>Puis-je le combiner avec d'autres articles de la boutique ?</strong><br/>Tout à fait, il s'associe facilement avec les autres pièces de ${collectionLink}.</p>
<p><strong>Quel entretien est recommandé ?</strong><br/>Un entretien doux et régulier est recommandé pour préserver la qualité du produit.</p>
`.trim();

  // Mock output is intentionally shorter than the 600-word production
  // requirement enforced by src/lib/seo/validators.ts — pad with a closing
  // paragraph so the mock is representative without hardcoding filler noise.
  if (countWords(html) < 600) {
    return `${html}\n<p>Chez ${vendor}, chaque produit de la niche ${niche} est sélectionné avec attention pour garantir un rapport qualité/usage cohérent avec les attentes de notre clientèle. N'hésitez pas à consulter ${collectionLink} pour découvrir l'ensemble de nos modèles, ou à comparer avec ${similarLink} avant de valider votre choix. Notre objectif est de vous accompagner vers l'article qui correspond le mieux à votre usage, votre style et votre budget, avec une transparence totale sur les caractéristiques réelles de chaque produit.</p>`;
  }
  return html;
}
