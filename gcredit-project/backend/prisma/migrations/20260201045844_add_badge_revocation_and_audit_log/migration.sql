-- AlterTable
ALTER TABLE "badges" ADD COLUMN     "revocationNotes" TEXT,
ADD COLUMN     "revokedBy" TEXT;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" VARCHAR(255),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "badges_revokedAt_idx" ON "badges"("revokedAt");

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
