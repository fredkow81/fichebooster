import { z } from "zod";

export const checkoutSchema = z.object({
  planKey: z.string().min(1),
});

export const planInputSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[A-Z0-9_]+$/, "La clé doit être en majuscules, chiffres et underscores uniquement"),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().default("eur"),
  interval: z.enum(["month", "year"]).default("month"),
  maxStores: z.number().int().min(0).nullable(),
  maxOptimizationsPerMonth: z.number().int().min(0).nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const planUpdateSchema = planInputSchema.partial().extend({
  key: planInputSchema.shape.key.optional(),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  planId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "INCOMPLETE", "UNPAID"]).optional(),
});
