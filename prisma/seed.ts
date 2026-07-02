import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@shopify-seo-optimizer.local";
const DEMO_PASSWORD = "demo12345";
const DEMO_SHOP_DOMAIN = "demo-shop.myshopify.com";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const freePlan = await prisma.plan.upsert({
    where: { key: "FREE" },
    update: {},
    create: {
      key: "FREE",
      name: "Gratuit",
      description: "Pour découvrir l'outil.",
      priceCents: 0,
      currency: "eur",
      interval: "month",
      maxStores: 1,
      maxOptimizationsPerMonth: 3,
      isDefault: true,
      isActive: true,
      sortOrder: 0,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      name: "Utilisateur démo",
    },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      planId: freePlan.id,
      status: "ACTIVE",
    },
  });

  await prisma.store.upsert({
    where: { shopDomain: DEMO_SHOP_DOMAIN },
    update: {},
    create: {
      userId: user.id,
      shopDomain: DEMO_SHOP_DOMAIN,
      // No Shopify credentials needed — irrelevant while SHOPIFY_MOCK_MODE=true,
      // since the Shopify service layer returns fixture data instead of
      // calling the real Admin API.
      defaultMarket: "France",
      defaultLanguage: "fr",
      lastSyncedAt: new Date(),
    },
  });

  // Backfill: any user created before the billing system existed has no
  // Subscription row. Every user must have exactly one (see limits.ts /
  // register route), so attach them to the default plan.
  const usersWithoutSubscription = await prisma.user.findMany({
    where: { subscription: null },
    select: { id: true, email: true },
  });
  for (const orphan of usersWithoutSubscription) {
    await prisma.subscription.create({
      data: { userId: orphan.id, planId: freePlan.id, status: "ACTIVE" },
    });
    console.log(`Backfill : abonnement gratuit attribué à ${orphan.email}`);
  }

  console.log("Seed terminé.");
  console.log(`Compte démo : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Boutique démo : ${DEMO_SHOP_DOMAIN}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
