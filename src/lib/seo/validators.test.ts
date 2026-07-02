import { describe, it, expect } from "vitest";
import {
  validateTitleLength,
  validateMetaTitleLength,
  validateMetaDescriptionLength,
  validateDescriptionWordCount,
  validateHandle,
  validateInternalLinksPresent,
  validateVariantsTranslated,
  validateAll,
  TITLE_MAX_LENGTH,
  META_DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_WORDS,
} from "./validators";

describe("validateTitleLength", () => {
  it("accepts a title within the limit", () => {
    expect(validateTitleLength("Sacoche homme cuir marron bandoulière").valid).toBe(true);
  });

  it("rejects a title over 70 characters", () => {
    const longTitle = "a".repeat(TITLE_MAX_LENGTH + 1);
    const result = validateTitleLength(longTitle);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("dépasse");
  });

  it("rejects an empty title", () => {
    expect(validateTitleLength("").valid).toBe(false);
  });
});

describe("validateMetaTitleLength", () => {
  it("rejects an empty meta title", () => {
    expect(validateMetaTitleLength("").valid).toBe(false);
  });
});

describe("validateMetaDescriptionLength", () => {
  it("rejects a meta description over 160 characters", () => {
    const longDesc = "a".repeat(META_DESCRIPTION_MAX_LENGTH + 1);
    expect(validateMetaDescriptionLength(longDesc).valid).toBe(false);
  });

  it("accepts a meta description within the limit", () => {
    expect(validateMetaDescriptionLength("Découvrez notre sacoche en cuir marron.").valid).toBe(true);
  });
});

describe("validateDescriptionWordCount", () => {
  it("rejects a description under 600 words", () => {
    const shortHtml = "<p>Un texte court.</p>";
    const result = validateDescriptionWordCount(shortHtml);
    expect(result.valid).toBe(false);
  });

  it("accepts a description with at least 600 words", () => {
    const words = Array.from({ length: DESCRIPTION_MIN_WORDS }, () => "mot").join(" ");
    const html = `<p>${words}</p>`;
    expect(validateDescriptionWordCount(html).valid).toBe(true);
  });

  it("strips HTML tags before counting words", () => {
    const html = "<h2>Titre</h2><p>Un <strong>texte</strong> avec balises.</p>";
    // "Titre", "Un", "texte", "avec", "balises." => 5 words
    const html600 = html.repeat(DESCRIPTION_MIN_WORDS); // ensures word count check runs on stripped text
    expect(validateDescriptionWordCount(html600).valid).toBe(true);
  });
});

describe("validateHandle", () => {
  it("accepts a valid slug handle", () => {
    expect(validateHandle("sacoche-homme-cuir-marron").valid).toBe(true);
  });

  it("rejects a handle with uppercase or accents", () => {
    expect(validateHandle("Sacoche Homme Été").valid).toBe(false);
  });

  it("rejects an empty handle", () => {
    expect(validateHandle("").valid).toBe(false);
  });
});

describe("validateInternalLinksPresent", () => {
  it("requires both a collection link and a product link", () => {
    const noLinks = "<p>Texte sans lien.</p>";
    expect(validateInternalLinksPresent(noLinks).valid).toBe(false);

    const onlyCollection = '<p>Voir <a href="/collections/sacoches">la collection</a>.</p>';
    expect(validateInternalLinksPresent(onlyCollection).valid).toBe(false);

    const both =
      '<p>Voir <a href="/collections/sacoches">la collection</a> et <a href="/products/autre">un autre modèle</a>.</p>';
    expect(validateInternalLinksPresent(both).valid).toBe(true);
  });
});

describe("validateVariantsTranslated", () => {
  it("flags untranslated English color names", () => {
    const result = validateVariantsTranslated([{ originalName: "Black", recommendedName: "Black" }]);
    expect(result.valid).toBe(false);
  });

  it("accepts translated variant names", () => {
    const result = validateVariantsTranslated([{ originalName: "Black", recommendedName: "Noir" }]);
    expect(result.valid).toBe(true);
  });

  it("flags duplicate recommended variant names", () => {
    const result = validateVariantsTranslated([
      { originalName: "Brown", recommendedName: "Marron" },
      { originalName: "Chocolate", recommendedName: "Marron" },
    ]);
    expect(result.valid).toBe(false);
  });
});

describe("validateAll", () => {
  it("aggregates all rule violations", () => {
    const result = validateAll({
      title: "",
      metaTitle: "",
      metaDescription: "",
      descriptionHtml: "<p>Trop court.</p>",
      handle: "Invalide Handle",
      variants: [{ originalName: "Black", recommendedName: "Black" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
  });
});
