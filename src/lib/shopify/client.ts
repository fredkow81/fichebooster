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

export interface ClientCredentialsToken {
  accessToken: string;
  expiresAt: Date;
}

/**
 * Exchanges a custom app's Client ID + Client Secret for a short-lived
 * (~24h) Admin API access token via the client_credentials grant — the
 * only token acquisition method Shopify's Dev Dashboard custom apps
 * support today. Only works when the app and the store share the same
 * Shopify organization (fine for a merchant testing on their own store;
 * not usable for third-party merchants, who need the full OAuth
 * authorization-code flow instead).
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant
 */
export async function fetchClientCredentialsToken(
  shopDomain: string,
  clientId: string,
  clientSecret: string,
): Promise<ClientCredentialsToken> {
  const url = `https://${shopDomain}/admin/oauth/access_token`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      cache: "no-store",
    });
  } catch {
    throw new ShopifyApiError(
      `Impossible de contacter la boutique Shopify (${shopDomain}) pour obtenir un token d'accès.`,
    );
  }

  if (!response.ok) {
    throw new ShopifyApiError(
      "Échec de l'obtention du token Shopify : Client ID / Secret invalide, ou la boutique n'appartient pas à la même organisation Shopify que cette app.",
      response.status,
    );
  }

  const json = (await response.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
  };
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
