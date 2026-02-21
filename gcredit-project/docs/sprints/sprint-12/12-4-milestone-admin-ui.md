# Story 12.4: Milestone Admin UI & Engine Upgrade

Status: review

## Story

As an **Admin**,
I want to manage milestone configurations through a UI powered by a flexible milestone engine,
So that I can define achievement milestones using a composable `metric + scope + threshold` model without requiring Swagger or code changes.

## Context

- Resolves **TD-009** (Milestone Admin UI ‚Ä?missing frontend)
- Replaces the rigid `MilestoneType` enum system (BADGE_COUNT/SKILL_TRACK/ANNIVERSARY/CUSTOM) with a unified **`metric + scope + threshold`** model
- Fixes broken `SKILL_TRACK` evaluator ‚Ä?currently compares `template.category` (freeform string) against `trigger.categoryId` (UUID), effectively non-functional
- Replaces hardcoded Dashboard milestone logic (every-5-badges formula) with dynamic `MilestoneConfig`-driven progress
- Wires up existing but disconnected frontend components: `CelebrationModal`, `MilestoneTimelineCard`
- Prisma model: `MilestoneConfig { id, type, title, description, trigger(Json), icon, isActive, createdBy }`
- Design discussion: `sprint-12/milestone-engine-design-notes-20260221.md`

### Unified Milestone Model

```
‚îå‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚î?
‚î? metric     What to measure                 ‚î?
‚î? ‚îú‚îÄ‚îÄ badge_count    Count claimed badges    ‚î?
‚î? ‚îî‚îÄ‚îÄ category_count Count distinct categories‚î?
‚î?                                            ‚î?
‚î? scope      Where to measure                ‚î?
‚î? ‚îú‚îÄ‚îÄ global     All badges, no filter       ‚î?
‚î? ‚îî‚îÄ‚îÄ category   Specific SkillCategory      ‚î?
‚î?                                            ‚î?
‚î? threshold  How many to trigger (min 1)     ‚î?
‚î?                                            ‚î?
‚î? Extensibility:                             ‚î?
‚î? New metric ‚Ü?add 1 evaluator case          ‚î?
‚î? New scope  ‚Ü?add 1 buildScopeFilter branch ‚î?
‚îî‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚î?
```

### Combination Matrix

| Metric | Scope | Example | Valid? |
|---|---|---|---|
| `badge_count` | `global` | "Earn 5 badges" | ‚ú?|
| `badge_count` | `category` | "Earn 3 badges in Software Development" | ‚ú?|
| `category_count` | `global` | "Earn badges across 3 different categories" | ‚ú?|
| `category_count` | `category` | ‚Ä?| ‚ù?Invalid |

### Category Scope Query Chain (Fixing Broken SKILL_TRACK)

```
trigger.categoryId
    ‚Ü?SkillCategory (+ descendants via parentId tree)
        ‚Ü?Skill[] (where categoryId IN descendant IDs)
            ‚Ü?Skill.id
                ‚Ü?
Badge (status='CLAIMED', recipientId=userId)
    ‚Ü?BadgeTemplate.skillIds[]  ‚Ü?hasSome ‚Ü?Skill.id
```

`template.category` (freeform string) is **no longer used** by the engine. The correct chain traverses `SkillCategory ‚Ü?Skill ‚Ü?BadgeTemplate.skillIds`.

## Acceptance Criteria

### Milestone Engine Upgrade (Backend)
1. [x] Milestone evaluation driven by `trigger` JSON (`metric + scope + threshold`), not by `MilestoneType` enum
2. [x] `badge_count` metric: counts claimed badges matching scope filter; triggers when `count >= threshold`
3. [x] `category_count` metric: counts distinct skill categories across claimed badges; triggers when `count >= threshold`
4. [x] `scope = global`: no filter applied ‚Ä?counts all user's claimed badges
5. [x] `scope = category`: filters by `categoryId` (and optionally all descendant sub-categories); query chain: `SkillCategory ‚Ü?Skill ‚Ü?BadgeTemplate.skillIds hasSome`
6. [x] `category_count + scope=category` rejected at validation (400 Bad Request)
7. [x] `includeSubCategories` flag (default `true`): when true, resolves all descendant category IDs via recursive `parentId` tree traversal
8. [x] `MilestoneType` Prisma enum migrated: `BADGE_COUNT | SKILL_TRACK | ANNIVERSARY | CUSTOM` ‚Ü?`BADGE_COUNT | CATEGORY_COUNT`
9. [x] Existing milestone data migrated: `SKILL_TRACK` ‚Ü?`BADGE_COUNT` (with category scope), `ANNIVERSARY`/`CUSTOM` ‚Ü?deactivated
10. [x] Active config cache retained (5-min TTL, existing behavior)

### Milestone Trigger DTO & Validation (Backend)
11. [x] `MilestoneTriggerDto` validates: `metric` (enum), `scope` (enum), `threshold` (int ‚â?1), `categoryId` (UUID, required when scope=category), `includeSubCategories` (boolean, optional)
12. [x] Zod-style discriminated validation: `scope=category` requires `categoryId`; `metric=category_count` requires `scope=global`
13. [x] `CreateMilestoneDto` uses `@ValidateNested()` for trigger, `@IsEnum(MilestoneType)` for type

### Dashboard Integration (Backend + Frontend)
14. [x] Dashboard `GET /api/dashboard/employee` returns next un-achieved milestone with real progress from `MilestoneConfig` (replaces hardcoded every-5-badges formula)
15. [x] If all milestones achieved: returns `{ title: "All milestones achieved!", progress: 0, target: 0, percentage: 100 }`
16. [x] If no active milestones configured: returns `null` for `currentMilestone`

### Milestone Achievement Notification (Frontend)
17. [x] `checkMilestones()` returns list of newly achieved milestones (not just fire-and-forget)
18. [x] Badge claim API response includes `newMilestones: MilestoneAchievement[]` when milestone(s) triggered
19. [x] Frontend triggers `CelebrationModal` (existing component) when `newMilestones` is non-empty in claim response

### Milestone Timeline (Frontend)
20. [x] `MilestoneTimelineCard` (existing component) rendered in wallet `TimelineView` for achieved milestones

### Admin UI ‚Ä?Card Grid (Frontend)
21. [x] Admin can view all milestones in a card grid layout at `/admin/milestones`
22. [x] Each card shows: icon, title, description, metric label, scope label (Global / category name), threshold, isActive toggle, achievement count
23. [x] Cards grouped by scope: "Global Milestones" section + "Category Milestones" section
24. [x] Admin can toggle isActive status directly from card (Shadcn `Switch`, top-right)
25. [x] Empty state: "Create your first milestone" CTA card

### Admin UI ‚Ä?Create/Edit Form (Frontend)
26. [x] Admin can create milestone via Sheet/Dialog with unified form: icon, title, description, metric selector, scope selector, threshold, category picker
27. [x] Metric selector: radio group ‚Ä?"Badge Count" / "Category Coverage"
28. [x] Scope selector: radio group ‚Ä?"Global (all badges)" / "Specific Category"
29. [x] When `metric = category_count`: scope auto-locked to Global, category picker hidden
30. [x] When `scope = category`: category tree picker shown with search + "Include sub-categories" checkbox
31. [x] Live preview card in form reflecting current configuration
32. [x] Auto-generated description: "Earn {threshold} badges" / "Earn {threshold} badges in {categoryName}" / "Earn badges across {threshold} different categories"
33. [x] Admin can edit milestone ‚Ä?metric and scope **locked** after creation (disabled + tooltip: "Cannot change metric/scope after creation")
34. [x] Icon selection: Lucide icon picker (curated ~20 achievement icons)

### Tests
35. [x] Engine evaluator tests: `badge_count √ó global`, `badge_count √ó category`, `category_count √ó global`, invalid combo rejection
36. [x] Scope filter tests: `includeSubCategories=true` resolves full tree, `=false` resolves only direct
37. [x] Prisma migration test: enum values updated, existing data preserved
38. [x] Dashboard integration test: next milestone returned with real progress
39. [x] SourceBadge-style component tests for milestone cards
40. [x] Admin form validation tests (Zod: missing categoryId, invalid combo, threshold < 1)

## Tasks / Subtasks

### Engine Upgrade (Backend ‚Ä?7h)

- [x] Task 1: Refactor `MilestoneEvaluator` (AC: #1‚Ä?5, #7, #10)
  - [x] Replace `evaluateTrigger()` switch-on-type with `metric + scope` evaluation
  - [x] Implement `buildScopeFilter(trigger)`: global ‚Ü?`{}`, category ‚Ü?skill-chain query
  - [x] Implement `getDescendantCategoryIds(categoryId)`: recursive parentId traversal
  - [x] Implement `getSkillIdsByCategories(categoryIds)`: Prisma query
  - [x] `badge_count` evaluator: `COUNT(badges WHERE CLAIMED AND scope filter) >= threshold`
  - [x] `category_count` evaluator: `COUNT(DISTINCT skill.categoryId WHERE badges CLAIMED) >= threshold`
  - [x] Keep 5-min active config cache
- [x] Task 2: DTO & Validation upgrade (AC: #6, #11‚Ä?13)
  - [x] Rewrite `MilestoneTriggerDto` with `metric`, `scope`, `threshold`, `categoryId`, `includeSubCategories`
  - [x] Add cross-field validation: `scope=category` requires `categoryId`; `metric=category_count` requires `scope=global`
  - [x] Update `CreateMilestoneDto` and `UpdateMilestoneDto`
- [x] Task 3: Prisma migration (AC: #8, #9)
  - [x] Migrate `MilestoneType` enum: add `CATEGORY_COUNT`, remove `SKILL_TRACK`, `ANNIVERSARY`, `CUSTOM`
  - [x] Data migration: convert existing `SKILL_TRACK` records to `BADGE_COUNT` with category scope; deactivate `ANNIVERSARY`/`CUSTOM` records
  - [x] Guard: check for existing records before enum removal
- [x] Task 4: Dashboard integration (AC: #14‚Ä?16)
  - [x] Replace hardcoded `milestoneProgress = totalBadges % 5` in `dashboard.service.ts`
  - [x] Query next un-achieved milestone (by threshold ascending)
  - [x] Compute real progress: current badge/category count vs threshold
  - [x] Handle edge cases: all achieved, no active milestones
- [x] Task 5: Achievement notification (AC: #17‚Ä?18)
  - [x] `checkMilestones()` returns `MilestoneAchievement[]` of newly triggered milestones
  - [x] Include `newMilestones` in badge claim response DTO

### Admin UI (Frontend ‚Ä?9h)

- [x] Task 6: Milestone management page (AC: #21‚Ä?25)
  - [x] Wrap in `<AdminPageShell>` from Story 12.1
  - [x] Card grid layout (3 columns, responsive)
  - [x] Each card: icon (top-left), title, description, metric+scope chips, threshold, achievement count, toggle switch (top-right)
  - [x] Group cards: "Global Milestones" section + "Category Milestones" section
  - [x] Empty state: "Create your first milestone" CTA card
- [x] Task 7: Create milestone form (AC: #26‚Ä?32, #34)
  - [x] Shadcn `Sheet` or `Dialog`
  - [x] Metric radio group: "Badge Count" / "Category Coverage"
  - [x] Scope radio group: "Global" / "Specific Category"
  - [x] Auto-lock scope when `metric=category_count`
  - [x] Category tree picker (search + include sub-categories checkbox)
  - [x] Threshold number input (min 1)
  - [x] Lucide icon picker (~20 curated icons)
  - [x] Auto-generated description preview
  - [x] Live preview card
  - [x] Zod validation schemas
- [x] Task 8: Edit milestone form (AC: #33)
  - [x] Pre-populated form
  - [x] Metric + scope locked (disabled + tooltip)
- [x] Task 9: Toggle isActive (AC: #24)
  - [x] Inline `Switch` on card (top-right)
  - [x] API: `PATCH /api/admin/milestones/:id` ‚Ü?`{ isActive }`
  - [x] Sonner toast confirmation
- [x] Task 10: CelebrationModal + Timeline integration (AC: #19, #20)
  - [x] On badge claim: check `newMilestones` in response ‚Ü?trigger `CelebrationModal`
  - [x] Wire `MilestoneTimelineCard` into `TimelineView`
- [x] Task 11: API integration
  - [x] `GET /api/admin/milestones` ‚Ä?list with achievement counts
  - [x] `POST /api/admin/milestones` ‚Ä?create
  - [x] `PATCH /api/admin/milestones/:id` ‚Ä?update
  - [x] `GET /api/skill-categories` ‚Ä?for category tree picker

### Tests (4h)

- [x] Task 12: Engine tests (AC: #35‚Ä?37)
  - [x] `badge_count √ó global` evaluator test
  - [x] `badge_count √ó category` evaluator test (with sub-categories)
  - [x] `category_count √ó global` evaluator test
  - [x] Invalid combo rejection test (`category_count √ó category` ‚Ü?400)
  - [x] `includeSubCategories` flag test (true vs false)
  - [x] Prisma migration data integrity test
- [x] Task 13: Integration + UI tests (AC: #38‚Ä?40)
  - [x] Dashboard milestone progress test (real config, not hardcoded)
  - [x] Milestone card rendering tests
  - [x] Form validation tests (Zod)
  - [x] Toggle switch tests

## Dev Notes

### Architecture Patterns
- **Evaluator architecture:** `metric √ó scope` orthogonal evaluation ‚Ä?clean separation of "what" and "where"
- **Scope filter builder:** returns Prisma `where` clause fragment; easily extensible for new scopes
- **Category tree traversal:** recursive query via `parentId` self-relation; cache results within evaluation batch
- Wrap in `<AdminPageShell>` from Story 12.1
- Card grid layout (not table ‚Ä?milestones are configuration items)
- Create/edit: Shadcn `Sheet` or `Dialog` (NOT full page navigation)
- Follow design-direction.md card styles
- Zod schemas for frontend trigger validation

### Trigger JSON Schema

```typescript
interface MilestoneTrigger {
  metric: 'badge_count' | 'category_count';
  scope: 'global' | 'category';
  threshold: number;
  categoryId?: string;                  // required when scope='category'
  includeSubCategories?: boolean;       // default true
}
```

### Zod Validation (Frontend)

```typescript
const MilestoneTriggerSchema = z.discriminatedUnion('scope', [
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
```

### Auto-Generated Description Rules

| Metric | Scope | Template |
|---|---|---|
| badge_count | global | "Earn {threshold} badges" |
| badge_count | category | "Earn {threshold} badges in {categoryName}" |
| category_count | global | "Earn badges across {threshold} different categories" |

### Existing Backend Endpoints (to modify)
- `GET /api/admin/milestones` ‚Ä?list (add achievement count to response)
- `POST /api/admin/milestones` ‚Ä?create (update DTO validation)
- `PATCH /api/admin/milestones/:id` ‚Ä?update (lock metric/scope)
- `DELETE /api/admin/milestones/:id` ‚Ä?soft delete (set isActive=false)

### Key Schema Reference (pre-migration)
```prisma
model MilestoneConfig {
  id, type(MilestoneType), title, description, trigger(Json),
  icon, isActive, createdBy, achievements[]
}
enum MilestoneType { BADGE_COUNT, SKILL_TRACK, ANNIVERSARY, CUSTOM }
```

### Key Schema Reference (post-migration)
```prisma
enum MilestoneType { BADGE_COUNT, CATEGORY_COUNT }
```

### ‚ö†Ô∏è Out of Scope (Deferred)
- Composite AND/OR trigger rules ‚Ä?JSON structure reserved but not implemented
- BADGE_COMBO (earn specific badges) ‚Ä?requires badge template picker, high complexity
- STREAK (consecutive time periods) ‚Ä?requires time-series analysis
- Cron-based anniversary evaluation ‚Ä?no scheduler needed for current metrics
- Team/group milestones ‚Ä?requires org-level aggregation

### ‚ú?Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Zod trigger schemas per MilestoneType, achievement count from MilestoneAchievement count, no DELETE (deactivate instead)
- **UX (Sally):** Icon (top-left prominent), toggle (top-right on card), create in sheet/dialog (no page nav), card grid responsive, empty state CTA
- **Original estimate:** 8h

### ‚ú?Engine Upgrade Review (2026-02-21)
- **Architecture (Winston ‚Ä?simulated):**
  - Approved `metric + scope + threshold` unified model over multi-enum approach
  - Evaluator uses orthogonal `metric √ó scope` design ‚Ä?extensible via single `case`/`branch` additions
  - SKILL_TRACK query fixed: `SkillCategory ‚Ü?Skill ‚Ü?BadgeTemplate.skillIds hasSome`
  - Prisma migration from 4-value enum to 2-value enum; existing data migrated or deactivated
  - Dashboard hardcoded milestone replaced with MilestoneConfig-driven progress
  - Not in scope: AND/OR composites, BADGE_COMBO, STREAK, cron scheduler
- **UX (Sally ‚Ä?simulated):**
  - Unified form with metric/scope radio groups replaces 4 type-specific forms
  - `category_count` auto-locks scope to Global (prevents invalid combination)
  - Category tree picker with search and "Include sub-categories" checkbox
  - Live preview card + auto-generated description in create/edit form
  - Cards grouped by scope: Global section + Category section
  - Milestone with achievements: deactivate only, no delete
  - Metric/scope locked after creation (disabled + tooltip)
- **Revised estimate:** 20h (engine 7h + UI 9h + tests 4h)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
