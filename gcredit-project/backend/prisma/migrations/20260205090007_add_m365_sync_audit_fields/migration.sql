-- AlterTable
ALTER TABLE "m365_sync_logs" ADD COLUMN     "failedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "syncedBy" VARCHAR(100);
