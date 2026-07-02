import type {
  ShopifyCollection,
  ShopifyProduct,
  ShopifyProductSummary,
} from "./types";

// Fixture data used when SHOPIFY_MOCK_MODE=true, so the app is fully
// explorable without live Shopify credentials.

export const mockCollections: ShopifyCollection[] = [
  { id: "gid://shopify/Collection/1", title: "Sacoches Homme", handle: "sacoches-homme", productsCount: 3 },
  { id: "gid://shopify/Collection/2", title: "Portefeuilles Cuir", handle: "portefeuilles-cuir", productsCount: 2 },
  { id: "gid://shopify/Collection/3", title: "Ceintures", handle: "ceintures", productsCount: 2 },
];

export const mockProducts: ShopifyProduct[] = [
  {
    id: "gid://shopify/Product/1001",
    title: "Sac homme tendance",
    handle: "sac-homme-tendance",
    descriptionHtml: "<p>Un sac pratique pour homme.</p>",
    vendor: "Maison Kowal",
    productType: "Sacoche",
    status: "ACTIVE",
    seo: { title: null, description: null },
    images: [
      {
        id: "gid://shopify/ProductImage/1",
        url: "https://cdn.shopify.com/s/files/1/mock/sacoche-marron-1.jpg",
        altText: null,
      },
      {
        id: "gid://shopify/ProductImage/2",
        url: "https://cdn.shopify.com/s/files/1/mock/sacoche-marron-2.jpg",
        altText: null,
      },
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/1",
        title: "Brown",
        price: "59.90",
        sku: "SAC-001-BR",
        selectedOptions: [{ name: "Couleur", value: "Brown" }],
        image: null,
      },
      {
        id: "gid://shopify/ProductVariant/2",
        title: "Black",
        price: "59.90",
        sku: "SAC-001-BK",
        selectedOptions: [{ name: "Couleur", value: "Black" }],
        image: null,
      },
    ],
    collections: [{ id: "gid://shopify/Collection/1", title: "Sacoches Homme", handle: "sacoches-homme" }],
    onlineStoreUrl: "https://demo-shop.myshopify.com/products/sac-homme-tendance",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "gid://shopify/Product/1002",
    title: "Sacoche bandoulière compacte",
    handle: "sacoche-bandouliere-compacte",
    descriptionHtml: "<p>Petite sacoche compacte.</p>",
    vendor: "Maison Kowal",
    productType: "Sacoche",
    status: "ACTIVE",
    seo: { title: null, description: null },
    images: [
      {
        id: "gid://shopify/ProductImage/3",
        url: "https://cdn.shopify.com/s/files/1/mock/sacoche-noire-1.jpg",
        altText: null,
      },
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/3",
        title: "Default",
        price: "44.90",
        sku: "SAC-002",
        selectedOptions: [{ name: "Title", value: "Default Title" }],
        image: null,
      },
    ],
    collections: [{ id: "gid://shopify/Collection/1", title: "Sacoches Homme", handle: "sacoches-homme" }],
    onlineStoreUrl: "https://demo-shop.myshopify.com/products/sacoche-bandouliere-compacte",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "gid://shopify/Product/1003",
    title: "Portefeuille en cuir",
    handle: "portefeuille-en-cuir",
    descriptionHtml: "<p>Portefeuille classique.</p>",
    vendor: "Maison Kowal",
    productType: "Portefeuille",
    status: "ACTIVE",
    seo: { title: null, description: null },
    images: [
      {
        id: "gid://shopify/ProductImage/4",
        url: "https://cdn.shopify.com/s/files/1/mock/portefeuille-1.jpg",
        altText: null,
      },
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/4",
        title: "Dark Brown",
        price: "39.90",
        sku: "PF-001",
        selectedOptions: [{ name: "Couleur", value: "Dark Brown" }],
        image: null,
      },
    ],
    collections: [{ id: "gid://shopify/Collection/2", title: "Portefeuilles Cuir", handle: "portefeuilles-cuir" }],
    onlineStoreUrl: "https://demo-shop.myshopify.com/products/portefeuille-en-cuir",
    updatedAt: new Date().toISOString(),
  },
];

export function mockProductSummaries(): ShopifyProductSummary[] {
  return mockProducts.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    status: p.status,
    featuredImage: p.images[0] ?? null,
    collections: p.collections,
    updatedAt: p.updatedAt,
  }));
}
