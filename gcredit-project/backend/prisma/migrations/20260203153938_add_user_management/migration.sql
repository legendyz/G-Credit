-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "roleSetManually" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roleUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "roleUpdatedBy" TEXT,
ADD COLUMN     "roleVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_role_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "oldValue" VARCHAR(50),
    "newValue" VARCHAR(50) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_role_audit_logs_userId_idx" ON "user_role_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "user_role_audit_logs_performedBy_idx" ON "user_role_audit_logs"("performedBy");

-- CreateIndex
CREATE INDEX "user_role_audit_logs_createdAt_idx" ON "user_role_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "users_roleUpdatedAt_idx" ON "users"("roleUpdatedAt");

-- AddForeignKey
ALTER TABLE "user_role_audit_logs" ADD CONSTRAINT "user_role_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_audit_logs" ADD CONSTRAINT "user_role_audit_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
