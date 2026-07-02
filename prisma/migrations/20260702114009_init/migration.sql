-- CreateEnum
CREATE TYPE "OptimizationStatus" AS ENUM ('DRAFT', 'ANALYZING', 'READY_FOR_REVIEW', 'PUBLISHED', 'ERROR');

-- CreateEnum
CREATE TYPE "ObjectiveGoal" AS ENUM ('SEO', 'GOOGLE_SHOPPING', 'CONVERSION', 'BALANCED');

-- CreateEnum
CREATE TYPE "WritingTone" AS ENUM ('NATURAL', 'PREMIUM', 'EXPERT', 'ACCESSIBLE');

-- CreateEnum
CREATE TYPE "CannibalizationRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "scope" TEXT,
    "defaultMarket" TEXT NOT NULL DEFAULT 'France',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'fr',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_snapshots" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "descriptionHtml" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "images" JSONB NOT NULL,
    "variants" JSONB NOT NULL,
    "collections" JSONB NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_optimizations" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "status" "OptimizationStatus" NOT NULL DEFAULT 'DRAFT',
    "niche" TEXT NOT NULL,
    "collectionHint" TEXT,
    "targetMarket" TEXT NOT NULL DEFAULT 'France',
    "targetLanguage" TEXT NOT NULL DEFAULT 'fr',
    "tone" "WritingTone" NOT NULL DEFAULT 'NATURAL',
    "objective" "ObjectiveGoal" NOT NULL DEFAULT 'BALANCED',
    "imageAnalysis" JSONB,
    "recommendedHandle" TEXT,
    "recommendedTitleSeo" TEXT,
    "recommendedTitleShopping" TEXT,
    "recommendedTitleBalanced" TEXT,
    "recommendedMetaTitle" TEXT,
    "recommendedMetaDescription" TEXT,
    "recommendedVariants" JSONB,
    "recommendedDescriptionHtml" TEXT,
    "finalHandle" TEXT,
    "finalTitle" TEXT,
    "finalMetaTitle" TEXT,
    "finalMetaDescription" TEXT,
    "finalVariants" JSONB,
    "finalDescriptionHtml" TEXT,
    "seoScoreBefore" INTEGER,
    "seoScoreAfter" INTEGER,
    "seoImprovements" JSONB,
    "seoRisks" JSONB,
    "publishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_recommendations" (
    "id" TEXT NOT NULL,
    "optimizationId" TEXT NOT NULL,
    "primaryKeyword" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "transactionalIntentScore" INTEGER NOT NULL,
    "cannibalizationRisk" "CannibalizationRisk" NOT NULL DEFAULT 'LOW',
    "conflictingProductIds" JSONB,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_link_recommendations" (
    "id" TEXT NOT NULL,
    "optimizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "targetHandle" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_link_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_history" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "optimizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "keyword" TEXT,
    "oldTitle" TEXT,
    "newTitle" TEXT,
    "oldHandle" TEXT,
    "newHandle" TEXT,
    "oldMetaDescription" TEXT,
    "newMetaDescription" TEXT,
    "status" "OptimizationStatus" NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "optimization_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stores_shopDomain_key" ON "stores"("shopDomain");

-- CreateIndex
CREATE INDEX "stores_userId_idx" ON "stores"("userId");

-- CreateIndex
CREATE INDEX "product_snapshots_storeId_shopifyProductId_idx" ON "product_snapshots"("storeId", "shopifyProductId");

-- CreateIndex
CREATE INDEX "product_optimizations_storeId_shopifyProductId_idx" ON "product_optimizations"("storeId", "shopifyProductId");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_recommendations_optimizationId_key" ON "keyword_recommendations"("optimizationId");

-- CreateIndex
CREATE INDEX "internal_link_recommendations_optimizationId_idx" ON "internal_link_recommendations"("optimizationId");

-- CreateIndex
CREATE INDEX "optimization_history_storeId_idx" ON "optimization_history"("storeId");

-- CreateIndex
CREATE INDEX "optimization_history_optimizationId_idx" ON "optimization_history"("optimizationId");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_snapshots" ADD CONSTRAINT "product_snapshots_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_optimizations" ADD CONSTRAINT "product_optimizations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_optimizations" ADD CONSTRAINT "product_optimizations_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "product_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_recommendations" ADD CONSTRAINT "keyword_recommendations_optimizationId_fkey" FOREIGN KEY ("optimizationId") REFERENCES "product_optimizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_link_recommendations" ADD CONSTRAINT "internal_link_recommendations_optimizationId_fkey" FOREIGN KEY ("optimizationId") REFERENCES "product_optimizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_history" ADD CONSTRAINT "optimization_history_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_history" ADD CONSTRAINT "optimization_history_optimizationId_fkey" FOREIGN KEY ("optimizationId") REFERENCES "product_optimizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_history" ADD CONSTRAINT "optimization_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
