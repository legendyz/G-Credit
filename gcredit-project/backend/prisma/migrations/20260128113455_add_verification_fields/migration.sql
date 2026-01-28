/*
  Warnings:

  - A unique constraint covering the columns `[verificationId]` on the table `badges` will be added. If there are existing duplicate values, this will fail.
  - The required column `verificationId` was added to the `badges` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "badges" ADD COLUMN     "metadataHash" TEXT,
ADD COLUMN     "verificationId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "badges_verificationId_key" ON "badges"("verificationId");

-- CreateIndex
CREATE INDEX "badges_verificationId_idx" ON "badges"("verificationId");
