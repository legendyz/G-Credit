# Code Review Prompt — Story 12.4: Milestone Admin UI & Engine Upgrade

## Review Context

**Story:** `gcredit-project/docs/sprints/sprint-12/12-4-milestone-admin-ui.md` (ACs #1–40)
**Dev Prompt:** `gcredit-project/docs/sprints/sprint-12/12-4-dev-prompt.md` (Tasks 1–14)
**Branch:** `sprint-12/management-uis-evidence`
**Commits:** `e1c1e79` (main feat), `31541ed` (seed Task 14), `df34c04` (legacy trigger fix)
**Base:** `c777a1d` (dev prompt commit)

### Story Summary

Story 12.4 is a full-stack milestone engine upgrade with admin UI. It replaces:

1. **Rigid 4-enum MilestoneType** (`BADGE_COUNT | SKILL_TRACK | ANNIVERSARY | CUSTOM`) with a composable **`metric + scope + threshold`** model backed by the 2-value enum (`BADGE_COUNT | CATEGORY_COUNT`)
2. **Broken SKILL_TRACK evaluator** — was comparing `template.category` (freeform string) against `trigger.categoryId` (UUID), now uses correct `SkillCategory → Skill → BadgeTemplate.skillIds` chain
3. **Hardcoded dashboard milestone** (`totalBadges % 5`) — now dynamic via `MilestonesService.getNextMilestone()`
4. **Fire-and-forget `checkMilestones()`** — now `await`ed, returns `Array` of new achievements
5. **Disconnected frontend components** — `CelebrationModal` and `MilestoneTimelineCard` now wired in
6. **Missing admin UI** — new milestone management page at `/admin/milestones`

---

## Scope of Changes

**27 files changed, +2,557 / −655 lines** (20 code files: +2,199 / −476)

### New Backend Files (1 file)

| File | Lines | Purpose |
|------|-------|---------|
| `prisma/migrations/20260221232113_milestone_type_enum_upgrade/migration.sql` | 24 | PostgreSQL enum migration: rename old → create new 2-value enum → alter column → drop old. Data migration: SKILL_TRACK → BADGE_COUNT, ANNIVERSARY/CUSTOM → deactivated |

### Modified Backend Files (9 files)

| File | Change | LOC |
|------|--------|-----|
| `prisma/schema.prisma` | `MilestoneType` enum: remove `SKILL_TRACK`, `ANNIVERSARY`, `CUSTOM`; add `CATEGORY_COUNT` | +1/−3 |
| `prisma/seed-uat.ts` | Task 14: trigger JSON format update, milestone3 (CATEGORY_COUNT), skill category colors, employee2 email | +30/−16 |
| `src/milestones/milestones.service.ts` | Full evaluator rewrite: `evaluateTrigger()`, `buildScopeFilter()`, `getDescendantCategoryIds()`, `evaluateBadgeCount()`, `evaluateCategoryCount()`, `getNextMilestone()`. Return type `void → Array`. Legacy trigger normalization. | +270/−100 |
| `src/milestones/milestones.service.spec.ts` | Complete rewrite: 36 tests covering CRUD, evaluator (all metric × scope combos), cache, BFS traversal, dashboard getNextMilestone, private helpers | +800/−220 |
| `src/milestones/dto/milestone.dto.ts` | New enums `MilestoneMetric`, `MilestoneScope`; new `MilestoneTriggerDto`; `@ValidateNested()` + `@Type()` on trigger; response DTOs | +90/−44 |
| `src/milestones/milestones.controller.ts` | Cross-field validation in `createMilestone()`: `category_count + category` → 400; `scope=category` requires `categoryId` | +16/−10 |
| `src/badge-issuance/badge-issuance.service.ts` | `checkMilestones()` call: fire-and-forget → `await` + `.catch(() => [])`. `newMilestones` added to issuance + claim response. | +8/−4 |
| `src/badge-issuance/badge-issuance-teams.integration.spec.ts` | Mock: `checkMilestones.mockResolvedValue(undefined)` → `mockResolvedValue([])` | +1/−1 |
| `src/dashboard/dashboard.service.ts` | `MilestonesService` injected; `getNextMilestone()` replaces hardcoded formula. Fallback: "All milestones achieved!" | +10/−17 |
| `src/dashboard/dashboard.module.ts` | `MilestonesModule` added to imports | +2/−1 |
| `src/dashboard/dashboard.service.spec.ts` | `MilestonesService` mocked; `getNextMilestone` test updated; all-achieved fallback test added | +25/−14 |

### New Frontend Files (5 files)

| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/admin/MilestoneManagementPage.tsx` | 271 | Admin page: card grid grouped by scope (Global / Category), CRUD handlers, delete confirmation via `ConfirmDialog`, `MilestoneFormSheet` integration |
| `src/components/admin/MilestoneFormSheet.tsx` | 478 | Unified create/edit sheet: icon picker, metric/scope radio groups, category tree picker, threshold, auto-generated description, live preview card |
| `src/lib/milestonesApi.ts` | 76 | API functions + TypeScript types: `fetchMilestones()`, `createMilestone()`, `updateMilestone()`, `deleteMilestone()` |
| `src/hooks/useMilestones.ts` | 64 | React Query hooks: `useMilestones()`, `useCreateMilestone()`, `useUpdateMilestone()`, `useDeleteMilestone()` with cache invalidation |
| `src/components/ui/switch.tsx` | 44 | Shadcn Switch component (manual creation — CLI failed) |

### Modified Frontend Files (5 files)

| File | Change | LOC |
|------|--------|-----|
| `src/App.tsx` | Lazy import + route: `/admin/milestones` with `ProtectedRoute requiredRoles=['ADMIN']` | +11 |
| `src/components/Navbar.tsx` | "Milestones" nav link in admin dropdown | +14 |
| `src/components/layout/MobileNav.tsx` | "Milestones" entry in mobile admin nav | +1 |
| `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | Parse claim response → trigger `MilestoneReachedCelebration` after 1.5s delay when `newMilestones.length > 0` | +30 |
| `src/components/TimelineView/TimelineView.tsx` | `MilestoneTimelineCard` import prepared (commented); type guard comment updated | +4/−8 |

---

## Review Checklist

### 1. Architecture & Patterns Compliance

- [ ] **Evaluator design:** Orthogonal `metric × scope` dispatch in `evaluateTrigger()` → `buildScopeFilter()` + `evaluateBadgeCount()`/`evaluateCategoryCount()`. Clean separation of "what" (metric) and "where" (scope). Verify extensibility — adding a new metric requires only one new case in `evaluateTrigger()`.
- [ ] **DI pattern:** `DashboardModule` now imports `MilestonesModule` to access `MilestonesService`. Verify no circular dependency.
- [ ] **React Query patterns:** `useMilestones()` hooks use `['admin-milestones']` query key with automatic invalidation on mutations. Consistent with existing `useAdminUsers()` pattern.
- [ ] **AdminPageShell usage:** `MilestoneManagementPage` wraps in `AdminPageShell` with `isLoading`, `isError`, `isEmpty`, `emptyAction` — consistent with `SkillCategoryManagementPage` pattern.
- [ ] **Sheet pattern:** `MilestoneFormSheet` uses Shadcn `Sheet` with `SheetContent` — consistent with existing admin form patterns (detail panels in 12.3b).
- [ ] **apiFetchJson usage:** New API functions use `apiFetchJson<T>()` helper — consistent with project pattern.

### 2. Backend — Prisma Migration (AC: #8, #9)

#### migration.sql (24 lines)

```sql
-- Step 1: Deactivate ANNIVERSARY/CUSTOM milestones
UPDATE "milestone_configs" SET "isActive" = false WHERE "type" IN ('ANNIVERSARY', 'CUSTOM');

-- Step 2: Convert SKILL_TRACK → BADGE_COUNT
UPDATE "milestone_configs" SET "type" = 'BADGE_COUNT' WHERE "type" = 'SKILL_TRACK';

-- Step 3: Recreate enum with 2 values
ALTER TYPE "MilestoneType" RENAME TO "MilestoneType_old";
CREATE TYPE "MilestoneType" AS ENUM ('BADGE_COUNT', 'CATEGORY_COUNT');
ALTER TABLE "milestone_configs" ALTER COLUMN "type" TYPE "MilestoneType" USING ("type"::text::"MilestoneType");
DROP TYPE "MilestoneType_old";
```

- [ ] **Data preservation (AC #9):** SKILL_TRACK → BADGE_COUNT preserves data. ANNIVERSARY/CUSTOM deactivated (not deleted). ✓
- [ ] **Rollback strategy:** This migration is **not reversible** via standard `prisma migrate down` — the old enum values are gone. If rollback needed, manual SQL required. Is this acceptable? **Document rollback steps.**
- [ ] **Production safety:** Migration modifies live data (UPDATE before schema change). In production, this should run within a transaction. **Verify Prisma runs migrations in a transaction by default.**
- [ ] **Enum rename strategy:** PostgreSQL doesn't support `ALTER TYPE ... DROP VALUE`. The rename-create-alter-drop approach is correct and standard. ✓
- [ ] **Missing `updatedAt` on deactivation:** Step 1 sets `updatedAt = NOW()` for ANNIVERSARY/CUSTOM. ✓

### 3. Backend — Milestone Evaluator (AC: #1–5, #7, #10)

#### milestones.service.ts — `checkMilestones()` (lines 129–220)

```typescript
async checkMilestones(userId: string): Promise<Array<{ id, title, description, icon }>> {
  // Legacy trigger normalization
  const trigger = {
    metric: rawTrigger.metric ?? rawTrigger.type ?? 'badge_count',
    scope: rawTrigger.scope ?? 'global',
    threshold: rawTrigger.threshold ?? rawTrigger.value ?? 1,
    ...
  };
  const triggerMet = await this.evaluateTrigger(userId, trigger);
  ...
}
```

- [ ] **Return type change (AC #17):** `void → Array<{ id, title, description, icon }>`. Callers updated to `await` + `.catch(() => [])`. ✓
- [ ] **Legacy trigger normalization:** `rawTrigger.metric ?? rawTrigger.type ?? 'badge_count'` and `rawTrigger.threshold ?? rawTrigger.value ?? 1`. This provides backward compatibility with old `{ type, value }` trigger format. ✓
- [ ] **Defensive coding concern:** The normalization is duplicated in both `checkMilestones()` (line ~160) and `getNextMilestone()` (line ~268). **Consider extracting to a `normalizeTrigger()` private method** to avoid drift.
- [ ] **Performance timing:** Logs warning if detection takes > 500ms. Reasonable threshold. ✓
- [ ] **Error handling:** Catches all errors, logs, returns empty array. Non-critical path — graceful degradation. ✓
- [ ] **Duplicate achievement guard:** Fetches `existingAchievements` and builds `achievedMilestoneIds` Set. `@@unique([milestoneId, userId])` in schema is a second safety net. ✓
- [ ] **Race condition:** If two badge issuances trigger concurrently for the same user, both could pass the Set check and attempt `milestoneAchievement.create()`. The `@@unique` constraint will reject the second one. **But the error is not caught per-milestone** — it would be caught by the outer try/catch and stop evaluation of remaining milestones. **Consider wrapping individual `create()` calls in try/catch** or using `createMany` with `skipDuplicates`.

#### milestones.service.ts — `evaluateTrigger()` (lines ~380–400)

```typescript
private async evaluateTrigger(userId, trigger): Promise<boolean> {
  const scopeFilter = await this.buildScopeFilter(trigger);
  switch (trigger.metric) {
    case 'badge_count': return this.evaluateBadgeCount(userId, scopeFilter, trigger.threshold);
    case 'category_count': return this.evaluateCategoryCount(userId, scopeFilter, trigger.threshold);
    default: this.logger.warn(`Unknown metric: ${trigger.metric}`); return false;
  }
}
```

- [ ] **Unknown metric handling:** Returns `false` (not throw). Correct for non-critical milestone evaluation. ✓
- [ ] **Type safety:** `trigger.metric` is typed as `string` (not enum), because it comes from JSON. Runtime validation relies on the DTO. ✓

#### milestones.service.ts — `buildScopeFilter()` (lines ~405–430)

```typescript
private async buildScopeFilter(trigger): Promise<Record<string, unknown>> {
  if (!trigger.scope || trigger.scope === 'global') return {};
  const categoryIds = trigger.includeSubCategories !== false
    ? await this.getDescendantCategoryIds(trigger.categoryId!)
    : [trigger.categoryId!];
  const skillIds = await this.getSkillIdsByCategories(categoryIds);
  if (skillIds.length === 0) return { id: 'no-match' };
  return { template: { skillIds: { hasSome: skillIds } } };
}
```

- [ ] **`includeSubCategories` default to `true`:** `!== false` means undefined/null → treated as true. Matches spec. ✓
- [ ] **No-match sentinel:** `{ id: 'no-match' }` — when category has no skills, returns a filter that matches no badges. Clever but non-obvious. **Consider adding a comment** explaining this is an intentional impossible-match filter.
- [ ] **Non-null assertion:** `trigger.categoryId!` — safe because controller validates presence when scope=category. But if called from `checkMilestones()` with a corrupted trigger, this would crash. **The outer try/catch covers it**, but consider defensive check.
- [ ] **N+1 concern:** Each category-scoped milestone triggers 2 DB queries (`getDescendantCategoryIds` + `getSkillIdsByCategories`). For multiple category milestones, this could be expensive. Currently acceptable with low milestone counts. If milestone count grows, consider batching.

#### milestones.service.ts — `getDescendantCategoryIds()` (lines ~435–450) — BFS

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

- [ ] **BFS correctness:** Expands level-by-level using `parentId: { in: currentLevel }`. Terminates when no more children found. ✓
- [ ] **Cycle protection:** If a cycle exists in the category tree (parentId point back up), this becomes infinite. Category tree depth is max 3 levels (schema constraint), so practical risk is low. **Consider adding max depth guard** (e.g., `while (currentLevel.length > 0 && allIds.length < 100)`).
- [ ] **DB round trips:** One query per tree level. Max 3 levels → max 3 queries. Acceptable. ✓

#### milestones.service.ts — `evaluateCategoryCount()` (lines ~470–500)

```typescript
private async evaluateCategoryCount(userId, scopeFilter, threshold): Promise<boolean> {
  const badges = await this.prisma.badge.findMany({
    where: { recipientId: userId, status: 'CLAIMED', ...scopeFilter },
    select: { template: { select: { skillIds: true } } },
  });
  // Collect all skill IDs, then find distinct categories
  const categories = await this.prisma.skill.findMany({
    where: { id: { in: Array.from(allSkillIds) } },
    select: { categoryId: true },
    distinct: ['categoryId'],
  });
  return categories.length >= threshold;
}
```

- [ ] **Prisma `distinct` usage:** `distinct: ['categoryId']` returns one row per distinct `categoryId`. Efficient — avoids client-side dedup. ✓
- [ ] **`scopeFilter` for category_count:** design spec says `category_count + category` is invalid (rejected at controller). So `scopeFilter` should always be `{}` here. **The `...scopeFilter` spread is harmless but redundant for category_count.** Not a bug.
- [ ] **Empty badges:** If user has no claimed badges, `allSkillIds.size === 0` → returns `false` immediately. ✓
- [ ] **Badge skill resolution:** Badges with empty `skillIds` (e.g., templates not linked to skills) contribute nothing to category count. This is correct behavior.

### 4. Backend — `getNextMilestone()` for Dashboard (AC: #14–16)

#### milestones.service.ts — `getNextMilestone()` (lines ~225–325)

```typescript
async getNextMilestone(userId: string): Promise<{ title, progress, target, percentage, icon } | null> {
  const configs = await this.getActiveMilestoneConfigs();
  if (configs.length === 0) return null;
  // ... sort by threshold ascending, pick first unachieved
  const percentage = Math.min(100, Math.round((progress / trigger.threshold) * 100));
  return { title, progress, target: trigger.threshold, percentage, icon };
}
```

- [ ] **Null return (AC #16):** When no active configs → `null`. ✓
- [ ] **All achieved fallback (AC #15):** When all milestones achieved → `null` (caller adds "All milestones achieved!" fallback). ✓
- [ ] **Sorting strategy:** Sorts all unachieved by threshold ascending → picks lowest threshold. This picks the "easiest" next milestone. **Is this the desired UX?** Alternative: pick the closest to completion (highest progress%). Current behavior is acceptable — shows the next achievable milestone.
- [ ] **Mixed metric sorting:** If there are both `badge_count` and `category_count` milestones, they're compared by threshold regardless of metric type. `badge_count threshold=5` vs `category_count threshold=3` → category wins. **This may not be semantically meaningful** — comparing badge count vs category count by threshold is apples-to-oranges. Consider separating by metric type or using percentage-to-completion as secondary sort.
- [ ] **Progress calculation for category_count:** Duplicates logic from `evaluateCategoryCount()` — fetches badges, collects skill IDs, counts distinct categories. **Consider extracting a `getCategoryCountProgress()` method** shared between `evaluateCategoryCount()` and `getNextMilestone()`.
- [ ] **Legacy trigger normalization duplicated:** Same `rawTrigger.metric ?? rawTrigger.type ?? 'badge_count'` pattern as in `checkMilestones()`. Same refactoring suggestion applies.
- [ ] **Percentage cap:** `Math.min(100, ...)` — correct, prevents > 100%. ✓

### 5. Backend — Dashboard Integration

#### dashboard.service.ts (lines 140–153)

```typescript
const milestoneData = await this.milestonesService.getNextMilestone(userId);
const currentMilestone = milestoneData ?? {
  title: 'All milestones achieved!',
  progress: 0, target: 0, percentage: 100, icon: '🏆',
};
```

- [ ] **Replaces hardcoded formula:** Previous `totalBadges % 5` logic removed. ✓
- [ ] **Null fallback:** When `getNextMilestone()` returns `null` → "All milestones achieved!" with 100%. ✓
- [ ] **Error handling concern:** If `getNextMilestone()` throws (DB error), the entire `getEmployeeDashboard()` fails. **No try/catch around milestone call.** Should it be wrapped to prevent dashboard failure from milestone issues?
- [ ] **DI wiring:** `DashboardModule` imports `MilestonesModule`. ✓. `MilestonesModule` must export `MilestonesService`. **Verify `MilestonesModule.exports` includes `MilestonesService`.**

#### dashboard.service.spec.ts — Updated tests

- [ ] **Mock setup:** `mockMilestonesService.getNextMilestone` returns fixed data. ✓
- [ ] **All-achieved test:** New test for `getNextMilestone → null` → fallback object. ✓
- [ ] **Test coverage:** Business logic well-covered. No test for `getNextMilestone` throwing. See error handling concern above.

### 6. Backend — Badge Issuance Integration (AC: #17, #18)

#### badge-issuance.service.ts (2 call sites: issuance + claim)

```typescript
// Issuance (line ~210)
const newMilestones = await this.milestonesService
  .checkMilestones(dto.recipientId)
  .catch((err: Error) => { ...; return []; });
// Added to response: newMilestones

// Claim (line ~375)
const newMilestones = await this.milestonesService
  .checkMilestones(claimedBadge.recipientId)
  .catch((err: Error) => { ...; return []; });
// Added to response: newMilestones
```

- [ ] **Pattern change:** Fire-and-forget → `await` + `.catch(() => [])`. Graceful degradation preserved. ✓
- [ ] **Latency impact:** `checkMilestones()` is now in the critical path of badge issuance/claim. If it takes > 500ms (logged warning), users experience slower badge operations. Acceptable trade-off for returning milestone data in response. ✓
- [ ] **Response DTO update:** `newMilestones` field added. **Verify existing frontend consumers handle the new field gracefully** (unknown fields in JSON are ignored, so no breaking change). ✓
- [ ] **Type safety:** `newMilestones` is `Array<{ id, title, description, icon }> | never[]`. Frontend checks `.length > 0`. ✓

#### badge-issuance-teams.integration.spec.ts

- [ ] **Mock update:** `checkMilestones.mockResolvedValue(undefined)` → `mockResolvedValue([])`. Matches new return type. ✓

### 7. Backend — DTO & Validation (AC: #6, #11–13)

#### dto/milestone.dto.ts

```typescript
export enum MilestoneMetric { BADGE_COUNT = 'badge_count', CATEGORY_COUNT = 'category_count' }
export enum MilestoneScope { GLOBAL = 'global', CATEGORY = 'category' }

export class MilestoneTriggerDto {
  @IsEnum(MilestoneMetric) metric: MilestoneMetric;
  @IsEnum(MilestoneScope) scope: MilestoneScope;
  @IsInt() @Min(1) threshold: number;
  @ValidateIf(o => o.scope === MilestoneScope.CATEGORY) @IsUUID() categoryId?: string;
  @IsOptional() @IsBoolean() includeSubCategories?: boolean;
}
```

- [ ] **`@ValidateIf` pattern (AC #12):** `categoryId` validated only when `scope=category`. When `scope=global`, `categoryId` is ignored even if present. ✓
- [ ] **Cross-field validation placement:** `category_count + category` rejection is in the **controller** (not DTO). This means the DTO itself allows this combination — only the controller blocks it. **This is a valid layered pattern** (DTO = type/format validation, controller = business logic validation), but it means programmatic callers (tests, internal services) bypass the restriction. Consider adding a custom validator decorator to the DTO for defense-in-depth.
- [ ] **`@Type(() => MilestoneTriggerDto)` on trigger:** Required for `class-transformer` to deserialize nested objects. ✓
- [ ] **`@SanitizeHtml()` on title, description, icon:** XSS prevention on user-facing text. ✓. Note: **icon field is sanitized** — emoji characters pass through fine. ✓
- [ ] **`UpdateMilestoneDto` excludes `type`:** Cannot change the fundamental measurement after creation (AC #33). ✓

#### Response DTOs

```typescript
export class MilestoneConfigResponseDto { ... }
export class MilestoneAchievementResponseDto { ... }
```

- [ ] **Not actually used:** These response DTOs are defined but the controller returns raw Prisma objects (via service layer). The DTOs serve as documentation only. **Consider applying `@ApiOkResponse({ type: MilestoneConfigResponseDto })` to controller methods for accurate Swagger docs**, or use `class-transformer` to strip non-DTO fields.

### 8. Backend — Controller Validation (AC: #6)

#### milestones.controller.ts — `createMilestone()`

```typescript
async createMilestone(@Body() dto: CreateMilestoneDto, @Request() req) {
  if (dto.trigger.metric === MilestoneMetric.CATEGORY_COUNT
      && dto.trigger.scope === MilestoneScope.CATEGORY) {
    throw new BadRequestException('category_count metric only supports global scope');
  }
  if (dto.trigger.scope === MilestoneScope.CATEGORY && !dto.trigger.categoryId) {
    throw new BadRequestException('categoryId is required when scope is category');
  }
  return this.milestonesService.createMilestone(dto, req.user.userId);
}
```

- [ ] **Validation in controller vs DTO:** Manual `if` checks in controller. The first check (`category_count + category`) can't easily be expressed as a decorator. The second check (`scope=category` needs `categoryId`) is already handled by `@ValidateIf` in the DTO. **The second check is redundant** — `@ValidateIf(o => o.scope === 'category') @IsUUID() categoryId` already rejects. Harmless defense-in-depth.
- [ ] **Missing in `updateMilestone()`:** The same cross-field validation is NOT applied to `PATCH /admin/milestones/:id`. If a `trigger` update is sent with `category_count + category`, it would be accepted. **Bug: add the same validation to `updateMilestone()` if trigger is included in the update.**
- [ ] **Param validation:** `@Param('id') id: string` — no `ParseUUIDPipe`. Consider adding for consistent UUID validation.
- [ ] **No `@HttpCode` override:** POST defaults to 201. Other methods default to 200. Standard behavior. ✓

### 9. Backend — Tests (AC: #35–40)

#### milestones.service.spec.ts (36 tests, ~1000 lines)

**CRUD Tests (8 tests):**
- [ ] `createMilestone` — BADGE_COUNT + trigger JSON, CATEGORY_COUNT, cache invalidation. ✓
- [ ] `getAllMilestones` — returns with `_count.achievements`. ✓
- [ ] `updateMilestone` — title/description update, NotFoundException, cache invalidation. ✓
- [ ] `deleteMilestone` — soft delete (isActive=false), NotFoundException, cache invalidation. ✓

**checkMilestones Evaluator Tests (8 tests):**
- [ ] `badge_count × global` — count CLAIMED, no template filter. ✓
- [ ] `badge_count × category` — resolves skillIds via `skill.findMany`. ✓
- [ ] `badge_count × category + includeSubCategories` — BFS traversal. ✓
- [ ] `category_count × global` — distinct categories via badge→skill chain. ✓
- [ ] No duplicate achievements — skips already-achieved. ✓
- [ ] Below threshold → empty array. ✓
- [ ] DB error → graceful empty array. ✓
- [ ] Cache TTL — second call within TTL uses cache. ✓
- [ ] Empty skills in category → graceful (no crash). ✓

**getNextMilestone Tests (6 tests):**
- [ ] Returns next un-achieved with progress. ✓
- [ ] category_count progress calculation. ✓
- [ ] All achieved → null. ✓
- [ ] No configs → null. ✓
- [ ] Picks lowest threshold. ✓
- [ ] Percentage capped at 100. ✓

**Private Helper Tests (4 tests):**
- [ ] `evaluateBadgeCount` — true/false, scope filter. ✓
- [ ] `evaluateCategoryCount` — true, false (no badges). ✓
- [ ] `buildScopeFilter` — global → `{}`, category → `hasSome`, empty → `{ id: 'no-match' }`. ✓
- [ ] `getDescendantCategoryIds` — BFS multi-level, leaf only. ✓

**Private method access pattern:** Tests access private methods via `service['methodName']()` bracket notation (bypasses TypeScript visibility). This is a common testing pattern but breaks encapsulation. Acceptable for white-box unit tests. ✓

**Missing test coverage:**
- [ ] **`updateMilestone` with trigger update** — no test for the scenario where a trigger is updated via PATCH. Should verify cache invalidation and data correctness.
- [ ] **Concurrent milestone evaluation** — no test for the race condition described in section 3.

### 10. Frontend — MilestoneManagementPage.tsx (AC: #21–25)

- [ ] **Card grid layout:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`. Responsive. ✓
- [ ] **Grouped by scope (AC #23):** Global section + Category section, each with header. ✓
- [ ] **Empty state (AC #25):** `AdminPageShell` shows "Create Your First Milestone" CTA. ✓
- [ ] **Delete confirmation:** Uses `ConfirmDialog` — title says "Deactivate" (not "Delete"), description mentions `isActive=false`. Semantically correct — it's a soft delete. ✓
- [ ] **Key concern in MilestoneCard:** `onClick` on card opens edit. `Switch` inside card uses `e.stopPropagation()` to prevent card click. ✓
- [ ] **Accessibility:** Card has `role="button"`, `tabIndex={0}`, keyboard handler (`Enter`/`Space`). ✓
- [ ] **MilestoneCard `onDelete` prop unused:** `MilestoneCard` receives `onDelete` but destructures it as `{ milestone, onEdit, onToggle }` — **`onDelete` is destructured away but never used.** This means there's no delete button on the card. The only way to delete is through the card grid — but actually the delete logic lives in the parent page. **Verify: where does the delete action trigger come from?** Looking at the code, `handleDeleteRequest` exists but is only passed to `ConfirmDialog`. **There's no UI element to initiate a delete.** Bug: should add a delete button to the card or a context menu.

### 11. Frontend — MilestoneFormSheet.tsx (AC: #26–34)

- [ ] **Icon picker (AC #34):** 19 curated emoji icons. Grid layout, selected state highlighted. ✓. Dev prompt said "Lucide icon picker" — implementation uses emoji instead. **Design deviation** but functionally fine (emojis render universally, no additional imports).
- [ ] **Metric radio (AC #27):** Radio group with visual cards. Disabled in edit mode. ✓
- [ ] **Scope radio (AC #28):** Only shown when `metric=badge_count`. Hidden for `category_count` since scope is auto-locked to global. ✓
- [ ] **Auto-lock (AC #29):** `useEffect` forces `scope='global'` and clears `categoryId` when metric changes to `category_count`. ✓
- [ ] **Category picker (AC #30):** `<select>` dropdown with indented sub-categories via `'  '.repeat(cat.level)`. **Not a tree picker with search** as spec'd — it's a flat dropdown. Functionally works but UX differs from spec. Uses `useSkillCategoryTree()` hook.
- [ ] **Live preview (AC #31):** Card preview at bottom of form mirrors final card appearance. ✓
- [ ] **Auto-generated description (AC #32):** 3 templates. `descriptionManual` flag tracks user override. "Reset to auto-generated" link appears when manually edited. ✓
- [ ] **Edit mode locks (AC #33):** Metric + scope radios disabled with "Cannot change after creation" note. ✓
- [ ] **Validation:** Client-side: `isValid` checks `icon`, `title`, `description`, `threshold ≥ 1`, and `categoryId` presence when `scope=category`. No Zod schema — simple imperative validation. **Dev prompt specified Zod schemas for frontend validation (AC #40).** Not implemented. Minor deviation.
- [ ] **Form reset:** `useEffect` on `open` change resets all fields. ✓
- [ ] **Achievement count warning:** Amber notice when milestone has achievers in edit mode. ✓
- [ ] **`sr-only` on radio inputs:** Screen-reader accessible — radio inputs visually hidden, labels styled as clickable cards. ✓

### 12. Frontend — API & Hooks

#### milestonesApi.ts (76 lines)

- [ ] **Type definitions:** `MilestoneTrigger`, `MilestoneConfig`, `CreateMilestoneInput`, `UpdateMilestoneInput`. Well-typed. ✓
- [ ] **`_count` in MilestoneConfig:** `_count?: { achievements: number }` — optional because it may not be returned in all API contexts. ✓
- [ ] **API prefix:** Functions use `/admin/milestones` — will be prefixed by `apiFetchJson` base URL. ✓

#### useMilestones.ts (64 lines)

- [ ] **Query key:** `['admin-milestones']` — unique, no conflicts. ✓
- [ ] **Cache invalidation:** All 3 mutations invalidate `['admin-milestones']` on success. ✓
- [ ] **Toast notifications:** Create → "Milestone created", Delete → "Milestone deactivated". Update has NO auto toast — the page adds toast in `handleFormSubmitUpdate` callback. **Inconsistent toast pattern** — create/delete toast in hook, update toast in page. Consider unifying.
- [ ] **Error toasts:** All mutations show `error.message` in toast on failure. ✓

### 13. Frontend — CelebrationModal Wiring (AC: #19)

#### BadgeDetailModal.tsx

```typescript
const claimData = await response.json();
if (claimData.newMilestones?.length > 0) {
  setTimeout(() => {
    setMilestoneCelebration({
      isOpen: true,
      name: claimData.newMilestones[0].title,
      description: claimData.newMilestones[0].description,
    });
  }, 1500);
}
```

- [ ] **Optional chaining:** `claimData.newMilestones?.length > 0` — safe if `newMilestones` is undefined. ✓
- [ ] **Only first milestone shown:** `newMilestones[0]` — if multiple milestones triggered simultaneously, only the first celebration is shown. **Acceptable for MVP** — multiple simultaneous milestone achievements would be rare.
- [ ] **1.5s delay:** Allows claim celebration to show first, then milestone celebration. **UX: verify the two modals don't overlap** — `ClaimSuccessModal` should close before `MilestoneReachedCelebration` opens. Timing-dependent behavior.
- [ ] **Response parsing change:** Previously `await response.json()` was discarded (`_`). Now parsed and used. ✓
- [ ] **State management:** `milestoneCelebration` state with `{ isOpen, name, description }`. `onClose` resets state. ✓

### 14. Frontend — TimelineView Wiring (AC: #20)

#### TimelineView.tsx

```typescript
// import { MilestoneTimelineCard } from './MilestoneTimelineCard';
```

- [ ] **Import is commented out.** The MilestoneTimelineCard is NOT actively rendering. The type guard comment was updated but the actual rendering code is unchanged. **AC #20 says "rendered in wallet TimelineView"** — this AC is only partially met. The component exists and the import is prepared, but milestones won't actually render in the timeline until the import is uncommented and rendering logic is added.

### 15. Frontend — Routing & Navigation

#### App.tsx

- [ ] **Route:** `/admin/milestones` wrapped in `ProtectedRoute requiredRoles={['ADMIN']}`. ✓
- [ ] **Lazy loading:** `lazy(() => import('@/pages/admin/MilestoneManagementPage'))`. ✓
- [ ] **Route placement:** After skills routes, before profile route. Order doesn't matter for React Router but logical grouping is fine. ✓

#### Navbar.tsx

- [ ] **"Milestones" link:** In admin-only dropdown, after "Skills" link. Same styling pattern (`isActive` check). ✓

#### MobileNav.tsx

- [ ] **"Milestones" entry:** Added to `adminNavItems` array with `roles: ['ADMIN']`. ✓

### 16. Frontend — Switch Component

#### switch.tsx (44 lines)

- [ ] **Manual creation note:** Comment says "Shadcn CLI failed". This is a hand-written Radix Switch wrapper. ✓
- [ ] **Implementation:** Uses `@radix-ui/react-switch` (verified in package.json +1 dependency). ✓
- [ ] **Styling:** `data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-neutral-200`. Uses brand color. ✓
- [ ] **Size:** `h-5 w-9` (smaller than default Shadcn `h-6 w-11`). **Verify visual consistency** with other toggle components.
- [ ] **`forwardRef` + `displayName`:** Standard React pattern. ✓

### 17. Seed Data Updates (Task 14)

#### seed-uat.ts

- [ ] **14a: Trigger JSON format:** `{ type, value }` → `{ metric, scope, threshold }`. ✓
- [ ] **14b: CATEGORY_COUNT milestone:** `milestone3` added with `Well-Rounded Learner`, threshold 3. ✓
- [ ] **14c: Skill category colors:** All 9 categories have `color` field. ✓
- [ ] **14d: employee2 email:** `employee2@gcredit.com` (was M365 email). ✓
- [ ] **14e: Import:** `MilestoneType` import covers `CATEGORY_COUNT` (auto via Prisma generate). ✓
- [ ] **Milestone3 in deleteMany:** Verify `IDS.milestone3` is included in the cleanup `deleteMany` where clause.

---

## Summary of Issues

### Must Fix (Blocking)

| # | Issue | Severity | File |
|---|-------|----------|------|
| **B1** | `updateMilestone()` controller missing cross-field validation (`category_count + category` allowed via PATCH) | Medium | `milestones.controller.ts` |
| **B2** | MilestoneCard `onDelete` prop destructured but never used — no UI to trigger delete | Medium | `MilestoneManagementPage.tsx` |

### Should Fix (Non-Blocking)

| # | Issue | Severity | File |
|---|-------|----------|------|
| **S1** | Legacy trigger normalization duplicated in `checkMilestones()` and `getNextMilestone()` — extract `normalizeTrigger()` | Low | `milestones.service.ts` |
| **S2** | `getNextMilestone()` progress logic for `category_count` duplicated from `evaluateCategoryCount()` — extract shared method | Low | `milestones.service.ts` |
| **S3** | Race condition: concurrent milestone create could bypass Set check; individual `create()` not wrapped in try/catch | Low | `milestones.service.ts` |
| **S4** | No `ParseUUIDPipe` on `@Param('id')` in update/delete endpoints | Low | `milestones.controller.ts` |
| **S5** | `MilestoneTimelineCard` import commented out — AC #20 only partially met | Low | `TimelineView.tsx` |
| **S6** | Response DTOs defined but not used (controller returns raw Prisma objects) | Low | `milestone.dto.ts` |
| **S7** | Dashboard doesn't wrap `getNextMilestone()` in try/catch — milestone error crashes dashboard | Low | `dashboard.service.ts` |
| **S8** | Mixed metric sorting in `getNextMilestone()` compares badge_count vs category_count thresholds (apples-to-oranges) | Low | `milestones.service.ts` |

### Design Deviations (Informational)

| # | Deviation | Impact |
|---|-----------|--------|
| **D1** | Icon picker uses emoji instead of Lucide icons (spec'd in AC #34) | None — emojis render universally |
| **D2** | Category picker is flat `<select>` dropdown, not tree picker with search (spec'd in AC #30) | Minor UX — works for typically < 20 categories |
| **D3** | No Zod schemas for frontend validation (AC #40) — uses imperative `isValid` checks | Minor — validation logic is equivalent |
| **D4** | Toast pattern inconsistent: create/delete in hook, update in page component | Minor UX |

---

## Checklist Before Approval

- [ ] B1 fixed: cross-field validation in `updateMilestone()` controller
- [ ] B2 fixed: delete action accessible from card UI (e.g., context menu or button)
- [ ] All 40 ACs verified against implementation
- [ ] `tsc --noEmit` clean (both BE + FE)
- [ ] `eslint --max-warnings=0` clean (both BE + FE)
- [ ] Backend tests pass (`npx jest --testPathPatterns="milestones"`)
- [ ] Dashboard tests pass (`npx jest --testPathPatterns="dashboard"`)
- [ ] Badge issuance tests pass (`npx jest --testPathPatterns="badge-issuance"`)
- [ ] Seed data runs without error (`npx prisma db seed`)
- [ ] `/admin/milestones` page loads and renders
- [ ] Create milestone → card appears in grid
- [ ] Toggle switch → isActive changes
- [ ] Edit milestone → metric/scope locked
- [ ] Badge claim → CelebrationModal fires (if milestone triggered)
- [ ] Dashboard → milestone progress shows real data (not hardcoded)
