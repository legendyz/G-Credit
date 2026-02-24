-- Story 12.4: Milestone Engine Upgrade
-- Migrate MilestoneType enum from 4 values to 2 (BADGE_COUNT, CATEGORY_COUNT)

-- Step 1: Deactivate milestones using deprecated types
UPDATE "milestone_configs"
SET "isActive" = false, "updatedAt" = NOW()
WHERE "type" IN ('ANNIVERSARY', 'CUSTOM');

-- Step 2: Convert SKILL_TRACK → BADGE_COUNT (closest semantic match)
UPDATE "milestone_configs"
SET "type" = 'BADGE_COUNT', "updatedAt" = NOW()
WHERE "type" = 'SKILL_TRACK';

-- Step 3: Recreate enum with only the two supported values
-- Postgres requires: rename old → create new → alter column → drop old
ALTER TYPE "MilestoneType" RENAME TO "MilestoneType_old";

CREATE TYPE "MilestoneType" AS ENUM ('BADGE_COUNT', 'CATEGORY_COUNT');

ALTER TABLE "milestone_configs"
  ALTER COLUMN "type" TYPE "MilestoneType"
  USING ("type"::text::"MilestoneType");

DROP TYPE "MilestoneType_old";
