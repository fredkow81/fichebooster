import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)"),
  SHOPIFY_API_VERSION: z.string().default("2024-10"),
  SHOPIFY_MOCK_MODE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("claude-sonnet-4-5"),
  AI_MOCK_MODE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  UPLOAD_DIR: z.string().default("tmp-uploads"),
  UPLOAD_TTL_MINUTES: z
    .string()
    .default("60")
    .transform((v) => Number.parseInt(v, 10)),
  MAX_UPLOAD_SIZE_MB: z
    .string()
    .default("10")
    .transform((v) => Number.parseInt(v, 10)),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_MOCK_MODE: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
  // Comma-separated list of emails auto-promoted to ADMIN on login/registration.
  // See src/lib/auth.ts — avoids needing direct DB access to bootstrap the first admin.
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${message}`);
  }
  return parsed.data;
}

export const env = loadEnv();
