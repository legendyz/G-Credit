-- CreateEnum
CREATE TYPE "BadgeVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "badges" ADD COLUMN     "visibility" "BadgeVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "badges_visibility_status_idx" ON "badges"("visibility", "status");

-- CreateIndex
CREATE INDEX "badges_recipientId_visibility_idx" ON "badges"("recipientId", "visibility");
