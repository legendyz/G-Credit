/*
  Warnings:

  - The values [DRAFT,ACTIVE,ARCHIVED] on the enum `BadgeStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `badge_templates` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- Step 1: Change badge_templates.status to TEXT temporarily
ALTER TABLE "badge_templates" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

-- Step 2: Rename old BadgeStatus enum
ALTER TYPE "BadgeStatus" RENAME TO "BadgeStatus_old";

-- Step 3: Create new BadgeStatus enum for badges
CREATE TYPE "BadgeStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED', 'REVOKED');

-- Step 4: Convert badge_templates.status to TemplateStatus
ALTER TABLE "badge_templates" 
  ALTER COLUMN "status" TYPE "TemplateStatus" USING "status"::TEXT::"TemplateStatus",
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Step 5: Drop old enum
DROP TYPE "BadgeStatus_old";

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" "BadgeStatus" NOT NULL DEFAULT 'PENDING',
    "claimToken" TEXT,
    "claimedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "assertionJson" JSONB NOT NULL,
    "recipientHash" TEXT NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "badges_claimToken_key" ON "badges"("claimToken");

-- CreateIndex
CREATE INDEX "badges_recipientId_status_idx" ON "badges"("recipientId", "status");

-- CreateIndex
CREATE INDEX "badges_templateId_issuedAt_idx" ON "badges"("templateId", "issuedAt");

-- CreateIndex
CREATE INDEX "badges_claimToken_idx" ON "badges"("claimToken");

-- CreateIndex
CREATE INDEX "badges_status_expiresAt_idx" ON "badges"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "badges_issuerId_idx" ON "badges"("issuerId");

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "badge_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
