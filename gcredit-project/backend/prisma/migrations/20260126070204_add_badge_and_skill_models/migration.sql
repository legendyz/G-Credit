-- CreateEnum
CREATE TYPE "BadgeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateTable
CREATE TABLE "badge_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "skillIds" TEXT[],
    "issuanceCriteria" JSONB NOT NULL,
    "validityPeriod" INTEGER,
    "status" "BadgeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100),
    "description" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "level" "SkillLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "badge_templates_category_idx" ON "badge_templates"("category");

-- CreateIndex
CREATE INDEX "badge_templates_status_idx" ON "badge_templates"("status");

-- CreateIndex
CREATE INDEX "badge_templates_createdAt_idx" ON "badge_templates"("createdAt");

-- CreateIndex
CREATE INDEX "badge_templates_createdBy_idx" ON "badge_templates"("createdBy");

-- CreateIndex
CREATE INDEX "skill_categories_parentId_idx" ON "skill_categories"("parentId");

-- CreateIndex
CREATE INDEX "skill_categories_isSystemDefined_idx" ON "skill_categories"("isSystemDefined");

-- CreateIndex
CREATE INDEX "skill_categories_level_idx" ON "skill_categories"("level");

-- CreateIndex
CREATE INDEX "skills_categoryId_idx" ON "skills"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_categoryId_key" ON "skills"("name", "categoryId");

-- AddForeignKey
ALTER TABLE "badge_templates" ADD CONSTRAINT "badge_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "skill_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "skill_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
