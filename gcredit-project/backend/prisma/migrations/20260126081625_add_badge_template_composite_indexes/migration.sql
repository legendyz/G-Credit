-- CreateIndex
CREATE INDEX "badge_templates_category_status_idx" ON "badge_templates"("category", "status");

-- CreateIndex
CREATE INDEX "badge_templates_status_createdAt_idx" ON "badge_templates"("status", "createdAt");
