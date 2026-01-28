-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('BADGE_COUNT', 'SKILL_TRACK', 'ANNIVERSARY', 'CUSTOM');

-- CreateTable
CREATE TABLE "milestone_configs" (
    "id" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "icon" VARCHAR(10) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_achievements" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_files" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "milestone_configs_isActive_idx" ON "milestone_configs"("isActive");

-- CreateIndex
CREATE INDEX "milestone_achievements_userId_achievedAt_idx" ON "milestone_achievements"("userId", "achievedAt");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_achievements_milestoneId_userId_key" ON "milestone_achievements"("milestoneId", "userId");

-- CreateIndex
CREATE INDEX "evidence_files_badgeId_idx" ON "evidence_files"("badgeId");

-- CreateIndex
CREATE INDEX "idx_badges_timeline" ON "badges"("recipientId", "status", "issuedAt" DESC);

-- AddForeignKey
ALTER TABLE "milestone_configs" ADD CONSTRAINT "milestone_configs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_achievements" ADD CONSTRAINT "milestone_achievements_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestone_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_achievements" ADD CONSTRAINT "milestone_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
