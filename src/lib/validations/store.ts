import { z } from "zod";

export const connectStoreSchema = z.object({
  shopDomain: z
    .string()
    .min(1, "L'adresse de la boutique est requise")
    .regex(
      /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i,
      "Format attendu : nom-boutique.myshopify.com",
    ),
  accessToken: z.string().min(1, "Le token d'accès Admin API est requis"),
  defaultMarket: z.string().default("France"),
  defaultLanguage: z.string().default("fr"),
});

export type ConnectStoreInput = z.infer<typeof connectStoreSchema>;
