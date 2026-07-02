-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "encryptedClientSecret" TEXT,
ADD COLUMN     "shopifyClientId" TEXT,
ALTER COLUMN "encryptedAccessToken" DROP NOT NULL;

