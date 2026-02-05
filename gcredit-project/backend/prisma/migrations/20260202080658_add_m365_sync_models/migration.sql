/*
  Warnings:

  - A unique constraint covering the columns `[azureId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "azureId" TEXT,
ADD COLUMN     "department" TEXT;

-- CreateTable
CREATE TABLE "m365_sync_logs" (
    "id" TEXT NOT NULL,
    "syncDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncType" VARCHAR(20) NOT NULL DEFAULT 'FULL',
    "userCount" INTEGER NOT NULL,
    "syncedCount" INTEGER NOT NULL,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m365_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "changes" JSONB,
    "source" VARCHAR(20) NOT NULL,
    "actorId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "m365_sync_logs_syncDate_idx" ON "m365_sync_logs"("syncDate");

-- CreateIndex
CREATE INDEX "m365_sync_logs_status_idx" ON "m365_sync_logs"("status");

-- CreateIndex
CREATE INDEX "user_audit_logs_userId_idx" ON "user_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "user_audit_logs_timestamp_idx" ON "user_audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "user_audit_logs_action_idx" ON "user_audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "users_azureId_key" ON "users"("azureId");

-- CreateIndex
CREATE INDEX "users_azureId_idx" ON "users"("azureId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");
