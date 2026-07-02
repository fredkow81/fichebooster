import { env } from "@/lib/env";

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly userErrors?: { field?: string[] | null; message: string }[],
  ) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/**
 * Thin wrapper around Shopify's Admin GraphQL API. Never called when
 * SHOPIFY_MOCK_MODE=true — callers should branch to fixtures before
 * reaching this module.
 */
export async function shopifyGraphQL<T>(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const url = `https://${shopDomain}/admin/api/${env.SHOPIFY_API_VERSION}/graphql.json`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch (err) {
    throw new ShopifyApiError(
      `Impossible de contacter la boutique Shopify (${shopDomain}). Vérifiez la connexion réseau.`,
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new ShopifyApiError(
        "Le token d'accès Shopify est invalide ou a expiré. Reconnectez la boutique.",
        401,
      );
    }
    if (response.status === 429) {
      throw new ShopifyApiError(
        "Limite de requêtes Shopify atteinte. Réessayez dans quelques instants.",
        429,
      );
    }
    throw new ShopifyApiError(`Erreur Shopify API (HTTP ${response.status})`, response.status);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new ShopifyApiError(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new ShopifyApiError("Réponse Shopify vide ou invalide.");
  }

  return json.data;
}

export function assertNoUserErrors(
  userErrors: { field?: string[] | null; message: string }[] | undefined,
  context: string,
) {
  if (userErrors && userErrors.length > 0) {
    throw new ShopifyApiError(
      `${context} : ${userErrors.map((e) => e.message).join("; ")}`,
      undefined,
      userErrors,
    );
  }
}
