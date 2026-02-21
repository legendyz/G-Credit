# Dev Prompt: Story 12.4 — Milestone Admin UI & Engine Upgrade

**Story:** 12.4 (20h estimated)
**Branch:** `sprint-12/management-uis-evidence` (continue on current branch)
**Depends On:** Story 12.3 ACCEPTED (commit `054c709`)
**Base Commit:** `5ba9754` (latest)
**Design Notes:** `sprint-12/milestone-engine-design-notes-20260221.md`

---

## Objective

Replace the rigid 4-enum milestone system with a unified `metric + scope + threshold` evaluation engine, wire up existing but disconnected frontend components (CelebrationModal, MilestoneTimelineCard), replace hardcoded Dashboard milestone logic, and build admin UI for milestone CRUD at `/admin/milestones`.

---

## Acceptance Criteria Summary

From the story doc — 40 ACs across 7 groups:

| Group | ACs | Summary |
|-------|-----|---------|
| Engine Upgrade | #1–#10 | Unified evaluator, category query fix, Prisma migration |
| Trigger DTO | #11–#13 | Zod-style discriminated validation |
| Dashboard Integration | #14–#16 | Replace hardcoded every-5 with MilestoneConfig |
| Achievement Notification | #17–#19 | checkMilestones returns list, CelebrationModal wired |
| Milestone Timeline | #20 | MilestoneTimelineCard in wallet TimelineView |
| Admin UI Card Grid | #21–#25 | Card grid, scope grouping, toggle, empty state |
| Admin UI Form | #26–#34 | Unified create/edit form, metric/scope dynamic fields |
| Tests | #35–#40 | Engine, dashboard, form, migration tests |

---

## Current Codebase State

### Backend — What Exists

**`backend/src/milestones/milestones.service.ts`** (309 lines):
- `createMilestone(dto, adminId)` — maps DTO type string → Prisma enum via manual `typeMapping` record. Only maps `badge_count`, `skill_track`, `anniversary` (no `CUSTOM`).
- `getAllMilestones()` — returns all configs ordered by `createdAt desc`. No `_count` of achievements.
- `updateMilestone(id, dto)` — partial update, throws `NotFoundException`.
- `deleteMilestone(id)` — soft delete (`isActive=false`).
- `getUserAchievements(userId)` — returns achievements with milestone details.
- `checkMilestones(userId)` — **returns `void`**, fires-and-forgets. Evaluates all active configs via `evaluateTrigger()`. 5-min cache. Logs if >500ms.
- `evaluateTrigger(userId, trigger)` — switch on `trigger.type`:
  - `BADGE_COUNT`: counts CLAIMED badges globally.
  - `SKILL_TRACK`: counts CLAIMED badges where `template.category === categoryId` — **BROKEN** (category is freeform string, not UUID FK).
  - `ANNIVERSARY`: checks `user.createdAt` vs `requiredMonths`.
- **Cache:** `milestoneConfigsCache` with 5-min TTL.

**`backend/src/milestones/milestones.controller.ts`** (125 lines):
| Method | Route | Roles |
|--------|-------|-------|
| `POST` | `/api/admin/milestones` | ADMIN |
| `GET` | `/api/admin/milestones` | ADMIN |
| `PATCH` | `/api/admin/milestones/:id` | ADMIN |
| `DELETE` | `/api/admin/milestones/:id` | ADMIN |
| `GET` | `/api/milestones/achievements` | Any auth |

**`backend/src/milestones/dto/milestone.dto.ts`** (181 lines):
- `MilestoneTriggerType` enum: `BADGE_COUNT`, `SKILL_TRACK`, `ANNIVERSARY`
- `MilestoneTriggerDto`: `type`, `value?`, `categoryId?`, `requiredBadgeCount?`, `months?`
- `CreateMilestoneDto`: `type` (freeform string!), `title`, `description`, `trigger`, `icon`, `isActive?`
- `UpdateMilestoneDto`: all optional versions

**`backend/src/milestones/milestones.module.ts`** (13 lines): imports `PrismaModule`, provides/exports service + controller.

**`backend/src/dashboard/dashboard.service.ts`** (469 lines) — lines 136–153:
```typescript
// Hardcoded milestone logic — MUST be replaced
const milestoneProgress = totalBadges % 5 || (totalBadges > 0 ? 5 : 0);
const milestonePercentage = Math.round((milestoneProgress / 5) * 100);
return {
  currentMilestone: {
    title: `Badge Collector Level ${Math.ceil(totalBadges / 5) || 1}`,
    progress: milestoneProgress,
    target: 5,
    percentage: milestonePercentage,
    icon: '🏆',
  },
};
```

**`backend/src/badge-issuance/badge-issuance.service.ts`** (1592 lines):
- Line 210: `this.milestonesService.checkMilestones(dto.recipientId).catch(...)` — after badge issuance
- Line 371: `this.milestonesService.checkMilestones(claimedBadge.recipientId).catch(...)` — after badge claim
- Both are fire-and-forget `.catch()` — **no return value used**.

**Prisma Schema** (`backend/prisma/schema.prisma`):
```prisma
enum MilestoneType {
  BADGE_COUNT
  SKILL_TRACK
  ANNIVERSARY
  CUSTOM
}

model MilestoneConfig {
  id           String        @id @default(uuid())
  type         MilestoneType
  title        String        @db.VarChar(200)
  description  String        @db.Text
  trigger      Json
  icon         String        @db.VarChar(10)
  isActive     Boolean       @default(true)
  createdBy    String
  creator      User          @relation("MilestoneCreator", fields: [createdBy], references: [id])
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  achievements MilestoneAchievement[]
  @@index([isActive])
  @@map("milestone_configs")
}

model MilestoneAchievement {
  id          String          @id @default(uuid())
  milestoneId String
  userId      String
  achievedAt  DateTime        @default(now())
  milestone   MilestoneConfig @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
  user        User            @relation("MilestoneAchievements", fields: [userId], references: [id], onDelete: Cascade)
  @@unique([milestoneId, userId])
  @@index([userId, achievedAt])
  @@map("milestone_achievements")
}
```

**BadgeTemplate model** (relevant fields):
```prisma
model BadgeTemplate {
  category    String    @db.VarChar(50)    // freeform string, NOT a FK to SkillCategory!
  skillIds    String[]                      // Array of Skill.id UUIDs
}
```

**SkillCategory model** (for query chain):
```prisma
model SkillCategory {
  id        String           @id @default(uuid())
  parentId  String?
  parent    SkillCategory?   @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children  SkillCategory[]  @relation("CategoryHierarchy")
  skills    Skill[]
}
model Skill {
  id         String        @id @default(uuid())
  categoryId String
  category   SkillCategory @relation(fields: [categoryId], references: [id])
}
```

### Frontend — What Exists

**`frontend/src/components/common/CelebrationModal.tsx`** (204 lines):
- `CelebrationModal` — general purpose. Props: `isOpen`, `onClose`, `title`, `description?`, `icon?`, `type?: 'badge' | 'milestone' | 'achievement'`
- `MilestoneReachedCelebration` — preset. Props: `isOpen`, `onClose`, `milestoneName`, `description?`
- Has confetti animation, auto-cleans after 3s.
- **Currently never triggered for milestones.** No code path calls `MilestoneReachedCelebration`.

**`frontend/src/components/TimelineView/MilestoneTimelineCard.tsx`** (50 lines):
```typescript
interface MilestoneTimelineCardProps {
  milestone: {
    milestoneId: string;
    title: string;
    description: string;
    achievedAt: string;
  };
}
```
- Renders amber accent timeline card. **Exists but is not rendered** by `TimelineView`.

**`frontend/src/types/dashboard.ts`** (129 lines):
```typescript
export interface MilestoneProgress {
  title: string;
  progress: number;
  target: number;
  percentage: number;
  icon?: string;
}
```

**`frontend/src/hooks/useWallet.ts`**:
```typescript
export interface Milestone {
  type: 'milestone';
  milestoneId: string;
  title: string;
  description: string;
  achievedAt: string;
}
export type WalletItem = (Badge & { type: 'badge' }) | Milestone;
```

**Admin route structure** (`frontend/src/App.tsx`):
- **No `/admin/milestones` route exists.** Needs to be added following existing pattern (lazy import + `ProtectedRoute`).

**Navigation** (`frontend/src/components/Navbar.tsx` + `MobileNav.tsx`):
- Admin-only nav items at lines 136–180: Users, Skill Categories, Skills
- **No Milestones nav item.**

**Shadcn components available:** `dialog.tsx`, `sheet.tsx`, `select.tsx`, `input.tsx`, `label.tsx`, `button.tsx`, `badge.tsx`, `table.tsx`, `card.tsx`, `skeleton.tsx`, `textarea.tsx`

**No milestone-related API functions** exist in `frontend/src/lib/`. No `milestonesApi.ts`.

**`AdminPageShell`** (`frontend/src/components/admin/AdminPageShell.tsx`, 96 lines):
- Handles 4 states: loading, error, empty, normal.
- Props: `title`, `description?`, `actions?`, `children`, `isLoading`, `isError`, `isEmpty`, `emptyTitle`, `emptyDescription`, `emptyAction`, `onRetry`.
- All Sprint 12 admin pages use this pattern.

---

## Tasks (1–14)

### Task 1: Prisma Migration — MilestoneType Enum (AC: #8, #9)

**Goal:** Migrate `MilestoneType` enum from 4 values to 2 values, with data migration for existing records.

**File:** `backend/prisma/schema.prisma`

**1a. Update enum:**
```prisma
enum MilestoneType {
  BADGE_COUNT
  CATEGORY_COUNT
}
```

**1b. Create migration:**

```bash
npx prisma migrate dev --name milestone-type-enum-update
```

**⚠️ CRITICAL:** Prisma cannot directly remove enum values if rows reference them. Follow this migration strategy:

**Step 1:** Create a manual SQL migration file. In the generated migration SQL:
```sql
-- Step 1: Deactivate ANNIVERSARY and CUSTOM milestones
UPDATE "milestone_configs" SET "isActive" = false WHERE "type" IN ('ANNIVERSARY', 'CUSTOM');

-- Step 2: Convert SKILL_TRACK → BADGE_COUNT (with category scope in trigger JSON)
UPDATE "milestone_configs"
SET "type" = 'BADGE_COUNT'
WHERE "type" = 'SKILL_TRACK';

-- Step 3: Add new enum value
ALTER TYPE "MilestoneType" ADD VALUE IF NOT EXISTS 'CATEGORY_COUNT';

-- Step 4: Remove old enum values (requires recreating the enum)
-- Create new temp enum
CREATE TYPE "MilestoneType_new" AS ENUM ('BADGE_COUNT', 'CATEGORY_COUNT');

-- Update column to use new enum
ALTER TABLE "milestone_configs" ALTER COLUMN "type" TYPE "MilestoneType_new" USING "type"::text::"MilestoneType_new";

-- Drop old and rename
DROP TYPE "MilestoneType";
ALTER TYPE "MilestoneType_new" RENAME TO "MilestoneType";
```

**Step 2:** After migration, run `npx prisma generate` to update the client.

**Verification:** `npx prisma db pull` should show only `BADGE_COUNT | CATEGORY_COUNT`. Existing SKILL_TRACK records should now be BADGE_COUNT. ANNIVERSARY/CUSTOM records should have `isActive=false`.

---

### Task 2: Backend — DTO Rewrite (AC: #6, #11–#13)

**Goal:** Replace the old `MilestoneTriggerDto` with the unified `metric + scope + threshold` model.

**File:** `backend/src/milestones/dto/milestone.dto.ts` — **rewrite completely**.

**New DTO structure:**

```typescript
import {
  IsString, IsEnum, IsBoolean, IsOptional, ValidateNested,
  IsInt, Min, IsUUID, IsIn, ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '../../common/decorators/sanitize-html.decorator';
import { MilestoneType } from '@prisma/client';

// --- Enums ---
export enum MilestoneMetric {
  BADGE_COUNT = 'badge_count',
  CATEGORY_COUNT = 'category_count',
}

export enum MilestoneScope {
  GLOBAL = 'global',
  CATEGORY = 'category',
}

// --- Trigger DTO ---
export class MilestoneTriggerDto {
  @ApiProperty({ enum: MilestoneMetric })
  @IsEnum(MilestoneMetric)
  metric: MilestoneMetric;

  @ApiProperty({ enum: MilestoneScope })
  @IsEnum(MilestoneScope)
  scope: MilestoneScope;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  threshold: number;

  @ApiPropertyOptional({ description: 'Required when scope=category' })
  @ValidateIf((o) => o.scope === MilestoneScope.CATEGORY)
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeSubCategories?: boolean;
}

// --- Create DTO ---
export class CreateMilestoneDto {
  @ApiProperty({ enum: MilestoneType })
  @IsEnum(MilestoneType)
  type: MilestoneType;

  @ApiProperty()
  @IsString()
  @SanitizeHtml()
  title: string;

  @ApiProperty()
  @IsString()
  @SanitizeHtml()
  description: string;

  @ApiProperty({ type: MilestoneTriggerDto })
  @ValidateNested()
  @Type(() => MilestoneTriggerDto)
  trigger: MilestoneTriggerDto;

  @ApiProperty()
  @IsString()
  @SanitizeHtml()
  icon: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- Update DTO ---
export class UpdateMilestoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description?: string;

  @ApiPropertyOptional({ type: MilestoneTriggerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MilestoneTriggerDto)
  trigger?: MilestoneTriggerDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
// NOTE: UpdateMilestoneDto intentionally does NOT include `type` — metric/scope
// are locked after creation (cannot change the fundamental measurement).

// --- Response DTOs ---
export class MilestoneConfigResponseDto {
  id: string;
  type: string;
  title: string;
  description: string;
  trigger: {
    metric: string;
    scope: string;
    threshold: number;
    categoryId?: string;
    includeSubCategories?: boolean;
  };
  icon: string;
  isActive: boolean;
  achievementCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class MilestoneAchievementResponseDto {
  id: string;
  milestone: {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
  };
  achievedAt: Date;
}
```

**Custom validation in controller or pipe:** Add a `BadRequest` guard in `createMilestone()`:
```typescript
// Cross-field validation: category_count + category scope is invalid
if (dto.trigger.metric === MilestoneMetric.CATEGORY_COUNT
    && dto.trigger.scope === MilestoneScope.CATEGORY) {
  throw new BadRequestException(
    'category_count metric only supports global scope'
  );
}
// Require categoryId when scope=category
if (dto.trigger.scope === MilestoneScope.CATEGORY && !dto.trigger.categoryId) {
  throw new BadRequestException(
    'categoryId is required when scope is category'
  );
}
```

---

### Task 3: Backend — Evaluator Refactor (AC: #1–#5, #7, #10)

**Goal:** Replace the old switch-on-type evaluator with metric + scope orthogonal evaluation.

**File:** `backend/src/milestones/milestones.service.ts` — major refactor of `evaluateTrigger()` and related methods.

**3a. Replace `evaluateTrigger()`:**

```typescript
private async evaluateTrigger(
  userId: string,
  trigger: { metric: string; scope: string; threshold: number; categoryId?: string; includeSubCategories?: boolean },
): Promise<boolean> {
  const scopeFilter = await this.buildScopeFilter(trigger);

  switch (trigger.metric) {
    case 'badge_count':
      return this.evaluateBadgeCount(userId, scopeFilter, trigger.threshold);
    case 'category_count':
      return this.evaluateCategoryCount(userId, scopeFilter, trigger.threshold);
    default:
      this.logger.warn(`Unknown metric: ${trigger.metric}`);
      return false;
  }
}
```

**3b. Implement `buildScopeFilter()`:**

```typescript
private async buildScopeFilter(
  trigger: { scope: string; categoryId?: string; includeSubCategories?: boolean },
): Promise<Record<string, unknown>> {
  if (trigger.scope === 'global') {
    return {};
  }

  // Category scope: resolve skill IDs through category → skill chain
  const categoryIds = trigger.includeSubCategories !== false
    ? await this.getDescendantCategoryIds(trigger.categoryId!)
    : [trigger.categoryId!];

  const skillIds = await this.getSkillIdsByCategories(categoryIds);

  if (skillIds.length === 0) {
    return { id: 'no-match' }; // No skills in category → no badges can match
  }

  return {
    template: {
      skillIds: { hasSome: skillIds },
    },
  };
}
```

**3c. Implement `getDescendantCategoryIds()`:**

```typescript
private async getDescendantCategoryIds(rootId: string): Promise<string[]> {
  const allIds: string[] = [rootId];
  let currentLevel = [rootId];

  while (currentLevel.length > 0) {
    const children = await this.prisma.skillCategory.findMany({
      where: { parentId: { in: currentLevel } },
      select: { id: true },
    });

    const childIds = children.map(c => c.id);
    allIds.push(...childIds);
    currentLevel = childIds;
  }

  return allIds;
}
```

**3d. Implement `getSkillIdsByCategories()`:**

```typescript
private async getSkillIdsByCategories(categoryIds: string[]): Promise<string[]> {
  const skills = await this.prisma.skill.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true },
  });
  return skills.map(s => s.id);
}
```

**3e. Implement `evaluateBadgeCount()`:**

```typescript
private async evaluateBadgeCount(
  userId: string,
  scopeFilter: Record<string, unknown>,
  threshold: number,
): Promise<boolean> {
  const count = await this.prisma.badge.count({
    where: {
      recipientId: userId,
      status: 'CLAIMED',
      ...scopeFilter,
    },
  });
  return count >= threshold;
}
```

**3f. Implement `evaluateCategoryCount()`:**

```typescript
private async evaluateCategoryCount(
  userId: string,
  scopeFilter: Record<string, unknown>,
  threshold: number,
): Promise<boolean> {
  // Count distinct categories across user's claimed badges
  const badges = await this.prisma.badge.findMany({
    where: {
      recipientId: userId,
      status: 'CLAIMED',
      ...scopeFilter,
    },
    select: {
      template: {
        select: { skillIds: true },
      },
    },
  });

  // Collect all skill IDs from badges
  const allSkillIds = new Set<string>();
  for (const badge of badges) {
    for (const skillId of badge.template.skillIds) {
      allSkillIds.add(skillId);
    }
  }

  if (allSkillIds.size === 0) return false;

  // Find distinct categories for those skills
  const categories = await this.prisma.skill.findMany({
    where: { id: { in: Array.from(allSkillIds) } },
    select: { categoryId: true },
    distinct: ['categoryId'],
  });

  return categories.length >= threshold;
}
```

**3g. Remove old methods:** Delete `evaluateBadgeCountTrigger()`, `evaluateSkillTrackTrigger()`, `evaluateAnniversaryTrigger()`. They are replaced by the unified evaluator.

**3h. Update `createMilestone()`:** Remove the manual `typeMapping` record. DTO now sends `MilestoneType` enum directly:
```typescript
async createMilestone(dto: CreateMilestoneDto, adminId: string) {
  return this.prisma.milestoneConfig.create({
    data: {
      type: dto.type,
      title: dto.title,
      description: dto.description,
      trigger: dto.trigger as unknown as Prisma.InputJsonValue,
      icon: dto.icon,
      isActive: dto.isActive ?? true,
      createdBy: adminId,
    },
  });
}
```

**3i. Update `getAllMilestones()`:** Include achievement count:
```typescript
async getAllMilestones() {
  return this.prisma.milestoneConfig.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { achievements: true },
      },
    },
  });
}
```

**Cache:** Keep the existing 5-min TTL cache mechanism (`milestoneConfigsCache`, `lastCacheRefresh`). Invalidate cache on create/update/delete by setting `lastCacheRefresh = 0`.

---

### Task 4: Backend — checkMilestones Returns Achievements (AC: #17, #18)

**Goal:** Change `checkMilestones()` from `void` to returning `MilestoneAchievement[]` so callers can pass newly achieved milestones to the frontend.

**File:** `backend/src/milestones/milestones.service.ts`

**4a. Change return type:**
```typescript
async checkMilestones(userId: string): Promise<Array<{ id: string; title: string; description: string; icon: string }>> {
  const newAchievements: Array<{ id: string; title: string; description: string; icon: string }> = [];
  // ...existing evaluation loop...
  if (triggerMet) {
    await this.prisma.milestoneAchievement.create({ ... });
    newAchievements.push({
      id: config.id,
      title: config.title,
      description: config.description,
      icon: config.icon,
    });
  }
  // ...
  return newAchievements;
}
```

**4b. Update badge-issuance.service.ts** (2 call sites):

At **line 210** (after badge issuance):
```typescript
// 11. Check milestones — capture result for response
const newMilestones = await this.milestonesService
  .checkMilestones(dto.recipientId)
  .catch((err: Error) => {
    this.logger.warn(`Milestone check failed after badge issuance: ${err.message}`);
    return [];
  });
```

At **line 371** (after badge claim):
```typescript
// 6b. Check milestones — capture result for response
const newMilestones = await this.milestonesService
  .checkMilestones(claimedBadge.recipientId)
  .catch((err: Error) => {
    this.logger.warn(`Milestone check failed after badge claim: ${err.message}`);
    return [];
  });
```

**4c. Include `newMilestones` in both response objects:**
Add `newMilestones` field to the return objects of both `issueBadge()` and `claimBadge()` methods.

**⚠️ Important:** Change `.catch()` fire-and-forget to `await ... .catch()` so the response can include milestone data. Performance impact is minimal since milestone check is already <500ms (cached configs).

---

### Task 5: Backend — Dashboard Integration (AC: #14–#16)

**Goal:** Replace hardcoded `milestoneProgress = totalBadges % 5` with dynamic MilestoneConfig-driven progress.

**File:** `backend/src/dashboard/dashboard.service.ts` — lines 136–153.

**5a. Inject `MilestonesService` into `DashboardService`:**
```typescript
constructor(
  private prisma: PrismaService,
  private milestonesService: MilestonesService,
) {}
```

**5b. Update `dashboard.module.ts`:** Import `MilestonesModule`.

**5c. Replace hardcoded logic:**

```typescript
// Replace lines 136-153 with:
const currentMilestone = await this.getNextMilestone(userId, totalBadges);
```

**5d. Implement `getNextMilestone()`:**

```typescript
private async getNextMilestone(userId: string, totalBadges: number) {
  // Get all active milestone configs
  const configs = await this.prisma.milestoneConfig.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  if (configs.length === 0) {
    return null; // AC #16: no active milestones
  }

  // Get user's achieved milestones
  const achievements = await this.prisma.milestoneAchievement.findMany({
    where: { userId },
    select: { milestoneId: true },
  });
  const achievedIds = new Set(achievements.map(a => a.milestoneId));

  // Find first un-achieved milestone (sorted by threshold ascending for badge_count)
  const unachieved = configs
    .filter(c => !achievedIds.has(c.id))
    .sort((a, b) => {
      const trigA = a.trigger as { threshold?: number };
      const trigB = b.trigger as { threshold?: number };
      return (trigA.threshold ?? 0) - (trigB.threshold ?? 0);
    });

  if (unachieved.length === 0) {
    return { // AC #15: all milestones achieved
      title: 'All milestones achieved!',
      progress: 0,
      target: 0,
      percentage: 100,
      icon: '🏆',
    };
  }

  const next = unachieved[0];
  const trigger = next.trigger as { metric: string; threshold: number };

  // Compute progress based on metric
  let progress = 0;
  if (trigger.metric === 'badge_count') {
    progress = totalBadges; // simplified — for category scope needs filtering
  } else if (trigger.metric === 'category_count') {
    // Count distinct categories
    const badges = await this.prisma.badge.findMany({
      where: { recipientId: userId, status: 'CLAIMED' },
      select: { template: { select: { skillIds: true } } },
    });
    const allSkillIds = new Set<string>();
    badges.forEach(b => b.template.skillIds.forEach(s => allSkillIds.add(s)));
    if (allSkillIds.size > 0) {
      const cats = await this.prisma.skill.findMany({
        where: { id: { in: Array.from(allSkillIds) } },
        select: { categoryId: true },
        distinct: ['categoryId'],
      });
      progress = cats.length;
    }
  }

  return {
    title: next.title,
    progress: Math.min(progress, trigger.threshold),
    target: trigger.threshold,
    percentage: Math.min(Math.round((progress / trigger.threshold) * 100), 100),
    icon: next.icon,
  };
}
```

**Verification:** `GET /api/dashboard/employee` → `currentMilestone` should be driven by MilestoneConfig, not hardcoded. If no configs → `null`. If all achieved → special message.

---

### Task 6: Frontend — Milestone API Layer (AC: #21–34 prerequisite)

**Goal:** Create the API functions and React Query hooks for milestone CRUD.

**Files to create:**

**6a. `frontend/src/lib/milestonesApi.ts`:**

```typescript
import { apiClient } from './apiClient';

// Types
export interface MilestoneTrigger {
  metric: 'badge_count' | 'category_count';
  scope: 'global' | 'category';
  threshold: number;
  categoryId?: string;
  includeSubCategories?: boolean;
}

export interface MilestoneConfig {
  id: string;
  type: 'BADGE_COUNT' | 'CATEGORY_COUNT';
  title: string;
  description: string;
  trigger: MilestoneTrigger;
  icon: string;
  isActive: boolean;
  _count?: { achievements: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneInput {
  type: 'BADGE_COUNT' | 'CATEGORY_COUNT';
  title: string;
  description: string;
  trigger: MilestoneTrigger;
  icon: string;
  isActive?: boolean;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  trigger?: MilestoneTrigger;
  icon?: string;
  isActive?: boolean;
}

// API functions
export async function fetchMilestones(): Promise<MilestoneConfig[]> {
  const response = await apiClient.get('/api/admin/milestones');
  return response.data;
}

export async function createMilestone(input: CreateMilestoneInput): Promise<MilestoneConfig> {
  const response = await apiClient.post('/api/admin/milestones', input);
  return response.data;
}

export async function updateMilestone(id: string, input: UpdateMilestoneInput): Promise<MilestoneConfig> {
  const response = await apiClient.patch(`/api/admin/milestones/${id}`, input);
  return response.data;
}

export async function deleteMilestone(id: string): Promise<MilestoneConfig> {
  const response = await apiClient.delete(`/api/admin/milestones/${id}`);
  return response.data;
}
```

**6b. `frontend/src/hooks/useMilestones.ts`:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMilestones, createMilestone, updateMilestone, deleteMilestone } from '@/lib/milestonesApi';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@/lib/milestonesApi';

export function useMilestones() {
  return useQuery({
    queryKey: ['admin-milestones'],
    queryFn: fetchMilestones,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMilestoneInput) => createMilestone(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-milestones'] }),
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMilestoneInput }) => updateMilestone(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-milestones'] }),
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-milestones'] }),
  });
}
```

---

### Task 7: Frontend — Milestone Admin Page (AC: #21–#25)

**Goal:** Create the admin milestone management page with card grid layout.

**File:** `frontend/src/pages/admin/MilestoneManagementPage.tsx`

**Pattern:** Follow `SkillCategoryManagementPage.tsx` structure — use `AdminPageShell`, data hooks, state management for create/edit/delete dialogs.

**Layout:**
- `AdminPageShell` wrapper with title "Milestone Management", description "Configure achievement milestones"
- Header action: `<Button>` with Plus icon → "Create Milestone"
- Card grid: 3 columns, responsive (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
- Group cards by scope: "Global Milestones" section heading + "Category Milestones" section heading
- Each card shows:
  - Top-left: icon (large, e.g., `text-3xl`)
  - Top-right: `Switch` (Shadcn) for isActive toggle
  - Title, description
  - Chips: metric label + scope label (e.g., `BADGE_COUNT · Global`)
  - Threshold value
  - Achievement count: `👥 {count} achieved`
- Empty state: "Create Your First Milestone" CTA card with Plus icon
- Click card → open edit sheet

**Nav updates required:**
- `Navbar.tsx` — add Milestones link after Skills (inside admin-only block)
- `MobileNav.tsx` — add `{ to: '/admin/milestones', label: 'Milestones', roles: ['ADMIN'] }`

**Route:**
- `App.tsx` — add lazy import + `ProtectedRoute` for `/admin/milestones` (ADMIN only)

---

### Task 8: Frontend — Create Milestone Form (AC: #26–#32, #34)

**Goal:** Build the unified create milestone form in a Sheet/Dialog.

**File:** `frontend/src/components/admin/MilestoneFormSheet.tsx`

**Form fields (dynamic based on metric):**

```
Icon picker → title → description → metric radio → scope radio →
  [if scope=category] category tree picker + include sub-categories checkbox →
  threshold number input →
  auto-generated description preview →
  live preview card
```

**Key behaviors:**
- Metric radio: `Badge Count` / `Category Coverage`
- Scope radio: `Global (all badges)` / `Specific Category`
- When `metric = category_count`: scope auto-locked to `Global`, category picker hidden
- When `scope = category`: show category picker (use existing `useSkillCategoryTree()` hook from Story 12.1) + "Include sub-categories" checkbox
- Threshold: number input, min 1
- Icon picker: curated list of ~20 Lucide-compatible emoji icons (🏆🏅🌟⭐💪🎯🔥💎🌍🗣️💻📚🎨✨🚀👑🌱💡🎓)
- Auto-generated description:
  - `badge_count + global` → "Earn {threshold} badges"
  - `badge_count + category` → "Earn {threshold} badges in {categoryName}"
  - `category_count + global` → "Earn badges across {threshold} different categories"
- Live preview card mirrors the grid card layout
- Admin can override auto-description with manual text
- `type` field derived from `metric`: `badge_count` → `BADGE_COUNT`, `category_count` → `CATEGORY_COUNT`

**Zod validation (frontend):**

```typescript
import { z } from 'zod';

const milestoneTriggerSchema = z.discriminatedUnion('scope', [
  z.object({
    metric: z.enum(['badge_count', 'category_count']),
    scope: z.literal('global'),
    threshold: z.number().int().min(1),
  }),
  z.object({
    metric: z.literal('badge_count'),
    scope: z.literal('category'),
    threshold: z.number().int().min(1),
    categoryId: z.string().uuid(),
    includeSubCategories: z.boolean().default(true),
  }),
]);

const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  icon: z.string().min(1),
  trigger: milestoneTriggerSchema,
});
```

---

### Task 9: Frontend — Edit Milestone Form (AC: #33)

**Goal:** Edit form reuses `MilestoneFormSheet` in edit mode.

**Key difference from create:**
- Pre-populate all fields from existing milestone
- **Metric and scope are disabled** (locked after creation)
- Tooltip on disabled metric/scope: "Cannot change metric/scope after creation"
- Threshold, title, description, icon remain editable
- If milestone has achievements (`_count.achievements > 0`), show info: "This milestone has been achieved by {count} users"

---

### Task 10: Frontend — Toggle isActive (AC: #24)

**Goal:** Inline `Switch` toggle on each card to activate/deactivate milestones.

- Uses `useUpdateMilestone` mutation: `PATCH /api/admin/milestones/:id` with `{ isActive: !current }`
- Sonner toast on success: "Milestone {activated/deactivated}"
- Optimistic update for instant feedback

---

### Task 11: Frontend — CelebrationModal + Timeline Integration (AC: #19, #20)

**Goal:** Wire the existing CelebrationModal and MilestoneTimelineCard components.

**11a. CelebrationModal (badge claim response):**

In the badge claim page/wallet component, after a successful claim:
```typescript
// After claim API response
if (response.newMilestones?.length > 0) {
  // Show celebration for first milestone
  setMilestoneCelebration({
    isOpen: true,
    name: response.newMilestones[0].title,
    description: response.newMilestones[0].description,
  });
}
```

Use `MilestoneReachedCelebration` preset from `CelebrationModal.tsx`.

**11b. MilestoneTimelineCard:**

In `frontend/src/components/TimelineView/TimelineView.tsx` (or wherever the timeline renders), conditionally render `MilestoneTimelineCard` for milestone-type items:
```tsx
{item.type === 'milestone' && (
  <MilestoneTimelineCard milestone={item} />
)}
```

This should already be partially set up in `useWallet.ts` (the `WalletItem = Badge | Milestone` union). Ensure the wallet endpoint includes milestone achievements in the timeline data.

---

### Task 12: Frontend — Route + Navigation (AC: #21 prerequisite)

**File updates:**

**12a. `App.tsx`:**
```typescript
const MilestoneManagementPage = lazy(() => import('@/pages/admin/MilestoneManagementPage'));

// After skills route:
<Route
  path="/admin/milestones"
  element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><MilestoneManagementPage /></ProtectedRoute>}
/>
```

**12b. `Navbar.tsx`** — after the Skills `<li>` block (line ~180):
```tsx
<li>
  <Link
    to="/admin/milestones"
    className={`px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
               flex items-center ${
                 isActive('/admin/milestones')
                   ? 'text-brand-600 bg-brand-50'
                   : 'text-neutral-700 hover:text-brand-600 hover:bg-neutral-100 active:bg-neutral-200'
               }`}
    aria-current={isActive('/admin/milestones') ? 'page' : undefined}
  >
    Milestones
  </Link>
</li>
```

**12c. `MobileNav.tsx`** — add to nav items:
```typescript
{ to: '/admin/milestones', label: 'Milestones', roles: ['ADMIN'] },
```

---

### Task 13: Tests (AC: #35–#40)

**13a. Backend — Engine evaluator tests** (`milestones.service.spec.ts`):
- `badge_count × global`: count CLAIMED badges, return true if ≥ threshold
- `badge_count × category`: resolve skill IDs via category chain, filter badges
- `category_count × global`: count distinct categories across user's badges
- Invalid combo rejection: `category_count × category` → 400
- `includeSubCategories=true`: resolves children + grandchildren
- `includeSubCategories=false`: resolves only direct category

**13b. Backend — Dashboard milestone test** (`dashboard.service.spec.ts` or integration):
- With active milestones: returns next un-achieved with real progress
- With all achieved: returns "All milestones achieved!" message
- With no active milestones: returns `null`

**13c. Backend — Prisma migration test:**
- After migration: enum has only `BADGE_COUNT | CATEGORY_COUNT`
- Existing SKILL_TRACK records converted to BADGE_COUNT
- Existing ANNIVERSARY/CUSTOM records deactivated

**13d. Frontend — Form validation tests:**
- Missing `categoryId` when scope=category → validation error
- `category_count + category` → validation error
- `threshold < 1` → validation error
- Valid `badge_count + global + threshold=5` → passes

**13e. Frontend — Card rendering tests:**
- Milestone card shows icon, title, description, metric/scope chips
- Toggle switch changes isActive state
- Empty state shows CTA card

---

### Task 14: seed-uat.ts Updates (Supplementary — Post-12.4 Migration)

After the Prisma migration and evaluator rewrite, the seed data must be updated to match the new schema.

**14a. Milestone trigger JSON format migration** — Update the 2 existing milestones to use the new `metric + scope + threshold` format:

```typescript
// BEFORE (old format):
trigger: { type: 'badge_count', value: 1 }
trigger: { type: 'badge_count', value: 5 }

// AFTER (new unified format):
trigger: { metric: 'badge_count', scope: 'global', threshold: 1 }
trigger: { metric: 'badge_count', scope: 'global', threshold: 5 }
```

**14b. Add a CATEGORY_COUNT milestone** — Add a 3rd milestone to exercise the new metric type:

```typescript
// Add to IDS:
milestone3: '00000000-0000-4000-a000-000500000003',

// Add after milestone2 create:
await prisma.milestoneConfig.create({
  data: {
    id: IDS.milestone3,
    type: MilestoneType.CATEGORY_COUNT,
    title: 'Well-Rounded Learner',
    description: 'Earned badges across 3 different skill categories.',
    trigger: { metric: 'category_count', scope: 'global', threshold: 3 },
    icon: '🌟',
    isActive: true,
    createdBy: admin.id,
  },
});

// Update deleteMany to include milestone3:
in: [IDS.milestone1, IDS.milestone2, IDS.milestone3, ...]

// Update console.log:
console.log('✅ 3 milestone configs created');

// Update summary:
console.log('   3 milestone configs, 3 audit logs');
```

**14c. Add `color` to all 9 skill categories** — Story 12.2 added the `color` field but seed never sets it:

```typescript
// Level 1 categories — add color field to each create data:
{ id: IDS.scatTech,         ..., color: 'blue'    }
{ id: IDS.scatSoft,         ..., color: 'amber'   }
{ id: IDS.scatDomain,       ..., color: 'emerald' }
{ id: IDS.scatCompany,      ..., color: 'violet'  }
{ id: IDS.scatProfessional, ..., color: 'cyan'    }

// Level 2 sub-categories — inherit or distinguish:
{ id: IDS.scatProgramming,  ..., color: 'blue'    }  // inherits from Tech
{ id: IDS.scatCloud,        ..., color: 'cyan'    }  // distinct within Tech
{ id: IDS.scatCommunication,..., color: 'amber'    }  // inherits from Soft
{ id: IDS.scatLeadership,   ..., color: 'orange'  }  // distinct within Soft
```

Valid colors (from `frontend/src/lib/categoryColors.ts`):
`slate | blue | emerald | amber | rose | violet | cyan | orange | pink | lime`

**14d. employee2 email update** (already applied in working tree):

```typescript
// BEFORE:
where: { email: 'M365DevAdmin@2wjh85.onmicrosoft.com' }
// AFTER:
where: { email: 'employee2@gcredit.com' }
// Also update: firstName → 'Demo', lastName → 'Employee2'
// Also update: audit log recipientEmail + actorEmail references
```

**14e. Update import** — After enum migration, `MilestoneType` import still works but seed must also import/use `CATEGORY_COUNT`:

```typescript
// Verify import covers new enum value:
import { ..., MilestoneType, ... } from '@prisma/client';
// MilestoneType.CATEGORY_COUNT should be available after prisma generate
```

---

## Dev Notes

### Architecture Patterns

- **Evaluator: metric × scope** orthogonal evaluation — clean separation of "what" and "where"
- **Scope filter builder:** returns Prisma `where` clause fragment; easily extensible for new scopes
- **Category tree traversal:** recursive query via `parentId` self-relation; runs only for `scope=category`
- **Cache invalidation:** Reset `lastCacheRefresh = 0` on any milestone create/update/delete
- **Non-blocking → awaited:** `checkMilestones()` changes from fire-and-forget to `await`ed with `.catch()` fallback returning `[]`

### Project Structure Notes

Follow existing Sprint 12 patterns:
- Admin pages in `frontend/src/pages/admin/`
- Admin components in `frontend/src/components/admin/`
- API lib in `frontend/src/lib/`
- Hooks in `frontend/src/hooks/`
- Backend DTO in `backend/src/milestones/dto/`
- Use `AdminPageShell` for the page wrapper
- Use Shadcn `Sheet` for create/edit form (not full page navigation)
- Use Sonner for toast notifications
- Follow `design-direction.md` card styles
- Zod schemas for frontend validation

### Key Query Chain Diagram

```
Admin creates milestone:
  trigger = { metric: 'badge_count', scope: 'category', threshold: 3, categoryId: 'uuid-abc' }

Engine evaluates:
  categoryId('uuid-abc')
    → getDescendantCategoryIds(['uuid-abc'])
      → ['uuid-abc', 'uuid-def', 'uuid-ghi']  // children + grandchildren
    → getSkillIdsByCategories(['uuid-abc', 'uuid-def', 'uuid-ghi'])
      → ['skill-1', 'skill-2', 'skill-3', 'skill-4']
    → Badge.count(WHERE recipientId=userId AND status='CLAIMED' AND template.skillIds hasSome ['skill-1',...])
      → 3  →  3 >= 3  →  TRUE → MILESTONE ACHIEVED!
```

### Auto-Generated Description Templates

| Metric | Scope | Template |
|---|---|---|
| `badge_count` | `global` | `Earn {threshold} badges` |
| `badge_count` | `category` | `Earn {threshold} badges in {categoryName}` |
| `category_count` | `global` | `Earn badges across {threshold} different categories` |

### References

- [Source: sprint-12/12-4-milestone-admin-ui.md] — Story specification with 40 ACs
- [Source: sprint-12/milestone-engine-design-notes-20260221.md] — Design discussion record
- [Source: backend/src/milestones/milestones.service.ts] — Current evaluator (309 lines)
- [Source: backend/src/milestones/dto/milestone.dto.ts] — Current DTOs (181 lines)
- [Source: backend/src/dashboard/dashboard.service.ts#L136-153] — Hardcoded milestone
- [Source: backend/src/badge-issuance/badge-issuance.service.ts#L210,L371] — checkMilestones call sites
- [Source: frontend/src/components/common/CelebrationModal.tsx] — Existing celebration UI
- [Source: frontend/src/components/TimelineView/MilestoneTimelineCard.tsx] — Existing timeline card
- [Source: frontend/src/components/admin/AdminPageShell.tsx] — Page shell pattern
- [Source: frontend/src/pages/admin/SkillCategoryManagementPage.tsx] — Admin page reference pattern

### Checklist Before Marking Done

- [ ] All 40 ACs verified
- [ ] Prisma migration applied and reversible
- [ ] Existing seed data / test data migrated (Task 14 — see below)
- [ ] seed-uat.ts: milestone triggers updated to `{ metric, scope, threshold }` format
- [ ] seed-uat.ts: CATEGORY_COUNT milestone added (milestone3)
- [ ] seed-uat.ts: skill categories have `color` field set
- [ ] seed-uat.ts: employee2 email = `employee2@gcredit.com`
- [ ] Backend tests pass (engine evaluator + dashboard + DTO validation)
- [ ] Frontend tests pass (form + card + toggle)
- [ ] No ESLint errors (both BE + FE, `--max-warnings=0`)
- [ ] No tsc errors
- [ ] CelebrationModal fires on real milestone achievement
- [ ] MilestoneTimelineCard renders in wallet timeline
- [ ] Dashboard shows real milestone progress (not hardcoded)
- [ ] `/admin/milestones` accessible, nav link works
- [ ] `sprint-status.yaml` updated: `12-4: review`

## Dev Agent Record

### Agent Model Used

### Completion Notes

### File List
