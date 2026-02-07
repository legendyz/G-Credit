-- CreateTable
CREATE TABLE "bulk_issuance_sessions" (
    "id" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "validRows" JSONB NOT NULL DEFAULT '[]',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "rows" JSONB NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_issuance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bulk_issuance_sessions_issuerId_idx" ON "bulk_issuance_sessions"("issuerId");

-- CreateIndex
CREATE INDEX "bulk_issuance_sessions_expiresAt_idx" ON "bulk_issuance_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "bulk_issuance_sessions_status_idx" ON "bulk_issuance_sessions"("status");

-- AddForeignKey
ALTER TABLE "bulk_issuance_sessions" ADD CONSTRAINT "bulk_issuance_sessions_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
