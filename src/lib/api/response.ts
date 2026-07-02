import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ShopifyApiError } from "@/lib/shopify/client";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError(err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), 422);
  }
  if (err instanceof ShopifyApiError) {
    return jsonError(err.message, err.status && err.status < 500 ? err.status : 502);
  }
  if (err instanceof ApiAuthError) {
    return jsonError(err.message, err.status);
  }
  // Unexpected errors (DB connectivity, bugs, etc.) are logged server-side
  // only — their raw message may contain internal details (connection
  // strings, stack traces) that must never reach the client.
  console.error(err);
  return jsonError("Une erreur interne est survenue. Veuillez réessayer plus tard.", 500);
}

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public status: number = 401,
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}
