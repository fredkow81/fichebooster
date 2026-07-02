import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encryptSecret } from "../src/lib/crypto";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@shopify-seo-optimizer.local";
const DEMO_PASSWORD = "demo12345";
const DEMO_SHOP_DOMAIN = "demo-shop.myshopify.com";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      name: "Utilisateur démo",
    },
  });

  await prisma.store.upsert({
    where: { shopDomain: DEMO_SHOP_DOMAIN },
    update: {},
    create: {
      userId: user.id,
      shopDomain: DEMO_SHOP_DOMAIN,
      // Placeholder token — irrelevant while SHOPIFY_MOCK_MODE=true, since
      // the Shopify service layer returns fixture data instead of calling
      // the real Admin API.
      encryptedAccessToken: encryptSecret("mock-access-token"),
      defaultMarket: "France",
      defaultLanguage: "fr",
      lastSyncedAt: new Date(),
    },
  });

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
