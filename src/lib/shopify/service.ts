import { env } from "@/lib/env";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { shopifyGraphQL, assertNoUserErrors, ShopifyApiError, fetchClientCredentialsToken } from "./client";
import {
  PRODUCT_LIST_QUERY,
  PRODUCT_DETAIL_QUERY,
  COLLECTIONS_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  SHOP_QUERY,
} from "./queries";
import { PRODUCT_UPDATE_MUTATION, PRODUCT_VARIANT_UPDATE_MUTATION } from "./mutations";
import { mockCollections, mockProductSummaries, mockProducts } from "./fixtures";
import type {
  ShopifyCollection,
  ShopifyProduct,
  ShopifyProductSummary,
  ProductUpdatePayload,
} from "./types";

export interface StoreCredentials {
  shopDomain: string;
  shopifyClientId: string | null;
  encryptedClientSecret: string | null;
  encryptedAccessToken: string | null;
  accessTokenExpiresAt: Date | null;
}

// Refresh this long before actual expiry so a slow-running request never
// gets caught mid-flight by a token that just expired.
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** Returns a valid access token, transparently refreshing (and persisting) it if expired or missing. */
async function resolveToken(store: StoreCredentials): Promise<string> {
  const isCachedTokenValid =
    store.encryptedAccessToken &&
    store.accessTokenExpiresAt &&
    store.accessTokenExpiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS > Date.now();

  if (isCachedTokenValid) {
    return decryptSecret(store.encryptedAccessToken!);
  }

  if (!store.shopifyClientId || !store.encryptedClientSecret) {
    throw new ShopifyApiError(
      "Identifiants Shopify manquants pour cette boutique. Reconnectez-la depuis la page Boutiques.",
    );
  }

  const clientSecret = decryptSecret(store.encryptedClientSecret);
  const { accessToken, expiresAt } = await fetchClientCredentialsToken(
    store.shopDomain,
    store.shopifyClientId,
    clientSecret,
  );

  await prisma.store.update({
    where: { shopDomain: store.shopDomain },
    data: { encryptedAccessToken: encryptSecret(accessToken), accessTokenExpiresAt: expiresAt },
  });

  return accessToken;
}

/** Pure connection test — exchanges the credentials and runs a lightweight query, without persisting anything. */
export async function verifyStoreConnection(
  shopDomain: string,
  clientId: string,
  clientSecret: string,
): Promise<{ ok: true; shopName: string } | { ok: false; error: string }> {
  if (env.SHOPIFY_MOCK_MODE) {
    return { ok: true, shopName: shopDomain.replace(".myshopify.com", "") };
  }
  try {
    const { accessToken } = await fetchClientCredentialsToken(shopDomain, clientId, clientSecret);
    const data = await shopifyGraphQL<{ shop: { name: string } }>(shopDomain, accessToken, SHOP_QUERY);
    return { ok: true, shopName: data.shop.name };
  } catch (err) {
    const message = err instanceof ShopifyApiError ? err.message : "Connexion à Shopify impossible.";
    return { ok: false, error: message };
  }
}

export async function listProducts(
  store: StoreCredentials,
  opts: { search?: string; first?: number } = {},
): Promise<ShopifyProductSummary[]> {
  if (env.SHOPIFY_MOCK_MODE) {
    const all = mockProductSummaries();
    if (!opts.search) return all;
    const q = opts.search.toLowerCase();
    return all.filter((p) => p.title.toLowerCase().includes(q));
  }

  const token = await resolveToken(store);
  const data = await shopifyGraphQL<{
    products: { nodes: RawProductSummary[] };
  }>(store.shopDomain, token, PRODUCT_LIST_QUERY, {
    first: opts.first ?? 50,
    query: opts.search ? `title:*${opts.search}*` : undefined,
  });

  return data.products.nodes.map(mapProductSummary);
}

export async function getProduct(
  store: StoreCredentials,
  productId: string,
): Promise<ShopifyProduct | null> {
  if (env.SHOPIFY_MOCK_MODE) {
    return mockProducts.find((p) => p.id === productId) ?? null;
  }

  const token = await resolveToken(store);
  const data = await shopifyGraphQL<{ product: RawProduct | null }>(
    store.shopDomain,
    token,
    PRODUCT_DETAIL_QUERY,
    { id: productId },
  );
  if (!data.product) return null;
  return mapProduct(data.product);
}

export async function listCollections(store: StoreCredentials): Promise<ShopifyCollection[]> {
  if (env.SHOPIFY_MOCK_MODE) {
    return mockCollections;
  }

  const token = await resolveToken(store);
  const data = await shopifyGraphQL<{
    collections: { nodes: { id: string; title: string; handle: string; productsCount: { count: number } }[] };
  }>(store.shopDomain, token, COLLECTIONS_QUERY, { first: 100 });

  return data.collections.nodes.map((c) => ({
    id: c.id,
    title: c.title,
    handle: c.handle,
    productsCount: c.productsCount.count,
  }));
}

export async function getSimilarProducts(
  store: StoreCredentials,
  collectionId: string,
  excludeProductId: string,
): Promise<ShopifyProductSummary[]> {
  if (env.SHOPIFY_MOCK_MODE) {
    return mockProductSummaries().filter(
      (p) => p.id !== excludeProductId && p.collections.some((c) => c.id === collectionId),
    );
  }

  const token = await resolveToken(store);
  const data = await shopifyGraphQL<{
    collection: { products: { nodes: RawProductSummary[] } } | null;
  }>(store.shopDomain, token, COLLECTION_PRODUCTS_QUERY, { id: collectionId, first: 20 });

  const nodes = data.collection?.products.nodes ?? [];
  return nodes.filter((p) => p.id !== excludeProductId).map(mapProductSummary);
}

export async function updateProduct(
  store: StoreCredentials,
  productId: string,
  payload: ProductUpdatePayload,
): Promise<void> {
  if (env.SHOPIFY_MOCK_MODE) {
    // No-op in mock mode: nothing to persist against a real store.
    return;
  }

  const token = await resolveToken(store);

  const input: Record<string, unknown> = { id: productId };
  if (payload.title !== undefined) input.title = payload.title;
  if (payload.handle !== undefined) input.handle = payload.handle;
  if (payload.descriptionHtml !== undefined) input.descriptionHtml = payload.descriptionHtml;
  if (payload.seo !== undefined) input.seo = payload.seo;

  const data = await shopifyGraphQL<{
    productUpdate: { userErrors: { field?: string[] | null; message: string }[] };
  }>(store.shopDomain, token, PRODUCT_UPDATE_MUTATION, { input });

  assertNoUserErrors(data.productUpdate.userErrors, "Échec de la mise à jour du produit Shopify");

  if (payload.variants?.length) {
    for (const variant of payload.variants) {
      const variantData = await shopifyGraphQL<{
        productVariantUpdate: { userErrors: { field?: string[] | null; message: string }[] };
      }>(store.shopDomain, token, PRODUCT_VARIANT_UPDATE_MUTATION, {
        input: { id: variant.id, title: variant.title },
      });
      assertNoUserErrors(
        variantData.productVariantUpdate.userErrors,
        `Échec de la mise à jour de la variante ${variant.id}`,
      );
    }
  }
}

// --- raw GraphQL shape -> internal types ---

interface RawImage {
  id: string;
  url: string;
  altText: string | null;
}

interface RawProductSummary {
  id: string;
  title: string;
  handle: string;
  status: string;
  updatedAt: string;
  featuredImage: RawImage | null;
  collections: { nodes: { id: string; title: string; handle: string }[] };
}

interface RawProduct extends Omit<RawProductSummary, "featuredImage"> {
  descriptionHtml: string;
  vendor: string;
  productType: string;
  onlineStoreUrl: string | null;
  seo: { title: string | null; description: string | null };
  images: { nodes: RawImage[] };
  variants: {
    nodes: {
      id: string;
      title: string;
      price: string;
      sku: string | null;
      selectedOptions: { name: string; value: string }[];
      image: RawImage | null;
    }[];
  };
}

function mapProductSummary(node: RawProductSummary): ShopifyProductSummary {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    status: node.status,
    featuredImage: node.featuredImage,
    collections: node.collections.nodes,
    updatedAt: node.updatedAt,
  };
}

function mapProduct(node: RawProduct): ShopifyProduct {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    descriptionHtml: node.descriptionHtml,
    vendor: node.vendor,
    productType: node.productType,
    status: node.status,
    seo: node.seo,
    images: node.images.nodes,
    variants: node.variants.nodes,
    collections: node.collections.nodes,
    onlineStoreUrl: node.onlineStoreUrl,
    updatedAt: node.updatedAt,
  };
}
