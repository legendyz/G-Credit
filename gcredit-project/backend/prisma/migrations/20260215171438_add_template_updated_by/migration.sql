-- AlterTable
ALTER TABLE "badge_templates" ADD COLUMN     "updatedBy" TEXT;

-- CreateIndex
CREATE INDEX "badge_templates_updatedBy_idx" ON "badge_templates"("updatedBy");

-- AddForeignKey
ALTER TABLE "badge_templates" ADD CONSTRAINT "badge_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
