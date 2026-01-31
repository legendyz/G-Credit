-- CreateTable
CREATE TABLE "badge_shares" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharedBy" TEXT,
    "recipientEmail" VARCHAR(255),
    "metadata" JSONB,

    CONSTRAINT "badge_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "badge_shares_badgeId_platform_idx" ON "badge_shares"("badgeId", "platform");

-- CreateIndex
CREATE INDEX "badge_shares_sharedAt_idx" ON "badge_shares"("sharedAt");

-- AddForeignKey
ALTER TABLE "badge_shares" ADD CONSTRAINT "badge_shares_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
