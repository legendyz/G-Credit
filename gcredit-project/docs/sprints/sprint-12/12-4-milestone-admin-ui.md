# Story 12.4: Milestone Admin UI & Engine Upgrade

Status: backlog

## Story

As an **Admin**,
I want to manage milestone configurations through a UI powered by a flexible milestone engine,
So that I can define achievement milestones using a composable `metric + scope + threshold` model without requiring Swagger or code changes.

## Context

- Resolves **TD-009** (Milestone Admin UI — missing frontend)
- Replaces the rigid `MilestoneType` enum system (BADGE_COUNT/SKILL_TRACK/ANNIVERSARY/CUSTOM) with a unified **`metric + scope + threshold`** model
- Fixes broken `SKILL_TRACK` evaluator — currently compares `template.category` (freeform string) against `trigger.categoryId` (UUID), effectively non-functional
- Replaces hardcoded Dashboard milestone logic (every-5-badges formula) with dynamic `MilestoneConfig`-driven progress
- Wires up existing but disconnected frontend components: `CelebrationModal`, `MilestoneTimelineCard`
- Prisma model: `MilestoneConfig { id, type, title, description, trigger(Json), icon, isActive, createdBy }`
- Design discussion: `sprint-12/milestone-engine-design-notes-20260221.md`

### Unified Milestone Model

```
┌─────────────────────────────────────────────┐
│  metric     What to measure                 │
│  ├── badge_count    Count claimed badges    │
│  └── category_count Count distinct categories│
│                                             │
│  scope      Where to measure                │
│  ├── global     All badges, no filter       │
│  └── category   Specific SkillCategory      │
│                                             │
│  threshold  How many to trigger (min 1)     │
│                                             │
│  Extensibility:                             │
│  New metric → add 1 evaluator case          │
│  New scope  → add 1 buildScopeFilter branch │
└─────────────────────────────────────────────┘
```

### Combination Matrix

| Metric | Scope | Example | Valid? |
|---|---|---|---|
| `badge_count` | `global` | "Earn 5 badges" | ✅ |
| `badge_count` | `category` | "Earn 3 badges in Software Development" | ✅ |
| `category_count` | `global` | "Earn badges across 3 different categories" | ✅ |
| `category_count` | `category` | — | ❌ Invalid |

### Category Scope Query Chain (Fixing Broken SKILL_TRACK)

```
trigger.categoryId
    → SkillCategory (+ descendants via parentId tree)
        → Skill[] (where categoryId IN descendant IDs)
            → Skill.id
                ↓
Badge (status='CLAIMED', recipientId=userId)
    → BadgeTemplate.skillIds[]  ← hasSome → Skill.id
```

`template.category` (freeform string) is **no longer used** by the engine. The correct chain traverses `SkillCategory → Skill → BadgeTemplate.skillIds`.

## Acceptance Criteria

### Milestone Engine Upgrade (Backend)
1. [ ] Milestone evaluation driven by `trigger` JSON (`metric + scope + threshold`), not by `MilestoneType` enum
2. [ ] `badge_count` metric: counts claimed badges matching scope filter; triggers when `count >= threshold`
3. [ ] `category_count` metric: counts distinct skill categories across claimed badges; triggers when `count >= threshold`
4. [ ] `scope = global`: no filter applied — counts all user's claimed badges
5. [ ] `scope = category`: filters by `categoryId` (and optionally all descendant sub-categories); query chain: `SkillCategory → Skill → BadgeTemplate.skillIds hasSome`
6. [ ] `category_count + scope=category` rejected at validation (400 Bad Request)
7. [ ] `includeSubCategories` flag (default `true`): when true, resolves all descendant category IDs via recursive `parentId` tree traversal
8. [ ] `MilestoneType` Prisma enum migrated: `BADGE_COUNT | SKILL_TRACK | ANNIVERSARY | CUSTOM` → `BADGE_COUNT | CATEGORY_COUNT`
9. [ ] Existing milestone data migrated: `SKILL_TRACK` → `BADGE_COUNT` (with category scope), `ANNIVERSARY`/`CUSTOM` → deactivated
10. [ ] Active config cache retained (5-min TTL, existing behavior)

### Milestone Trigger DTO & Validation (Backend)
11. [ ] `MilestoneTriggerDto` validates: `metric` (enum), `scope` (enum), `threshold` (int ≥ 1), `categoryId` (UUID, required when scope=category), `includeSubCategories` (boolean, optional)
12. [ ] Zod-style discriminated validation: `scope=category` requires `categoryId`; `metric=category_count` requires `scope=global`
13. [ ] `CreateMilestoneDto` uses `@ValidateNested()` for trigger, `@IsEnum(MilestoneType)` for type

### Dashboard Integration (Backend + Frontend)
14. [ ] Dashboard `GET /api/dashboard/employee` returns next un-achieved milestone with real progress from `MilestoneConfig` (replaces hardcoded every-5-badges formula)
15. [ ] If all milestones achieved: returns `{ title: "All milestones achieved!", progress: 0, target: 0, percentage: 100 }`
16. [ ] If no active milestones configured: returns `null` for `currentMilestone`

### Milestone Achievement Notification (Frontend)
17. [ ] `checkMilestones()` returns list of newly achieved milestones (not just fire-and-forget)
18. [ ] Badge claim API response includes `newMilestones: MilestoneAchievement[]` when milestone(s) triggered
19. [ ] Frontend triggers `CelebrationModal` (existing component) when `newMilestones` is non-empty in claim response

### Milestone Timeline (Frontend)
20. [ ] `MilestoneTimelineCard` (existing component) rendered in wallet `TimelineView` for achieved milestones

### Admin UI — Card Grid (Frontend)
21. [ ] Admin can view all milestones in a card grid layout at `/admin/milestones`
22. [ ] Each card shows: icon, title, description, metric label, scope label (Global / category name), threshold, isActive toggle, achievement count
23. [ ] Cards grouped by scope: "Global Milestones" section + "Category Milestones" section
24. [ ] Admin can toggle isActive status directly from card (Shadcn `Switch`, top-right)
25. [ ] Empty state: "Create your first milestone" CTA card

### Admin UI — Create/Edit Form (Frontend)
26. [ ] Admin can create milestone via Sheet/Dialog with unified form: icon, title, description, metric selector, scope selector, threshold, category picker
27. [ ] Metric selector: radio group — "Badge Count" / "Category Coverage"
28. [ ] Scope selector: radio group — "Global (all badges)" / "Specific Category"
29. [ ] When `metric = category_count`: scope auto-locked to Global, category picker hidden
30. [ ] When `scope = category`: category tree picker shown with search + "Include sub-categories" checkbox
31. [ ] Live preview card in form reflecting current configuration
32. [ ] Auto-generated description: "Earn {threshold} badges" / "Earn {threshold} badges in {categoryName}" / "Earn badges across {threshold} different categories"
33. [ ] Admin can edit milestone — metric and scope **locked** after creation (disabled + tooltip: "Cannot change metric/scope after creation")
34. [ ] Icon selection: Lucide icon picker (curated ~20 achievement icons)

### Tests
35. [ ] Engine evaluator tests: `badge_count × global`, `badge_count × category`, `category_count × global`, invalid combo rejection
36. [ ] Scope filter tests: `includeSubCategories=true` resolves full tree, `=false` resolves only direct
37. [ ] Prisma migration test: enum values updated, existing data preserved
38. [ ] Dashboard integration test: next milestone returned with real progress
39. [ ] SourceBadge-style component tests for milestone cards
40. [ ] Admin form validation tests (Zod: missing categoryId, invalid combo, threshold < 1)

## Tasks / Subtasks

### Engine Upgrade (Backend — 7h)

- [ ] Task 1: Refactor `MilestoneEvaluator` (AC: #1–#5, #7, #10)
  - [ ] Replace `evaluateTrigger()` switch-on-type with `metric + scope` evaluation
  - [ ] Implement `buildScopeFilter(trigger)`: global → `{}`, category → skill-chain query
  - [ ] Implement `getDescendantCategoryIds(categoryId)`: recursive parentId traversal
  - [ ] Implement `getSkillIdsByCategories(categoryIds)`: Prisma query
  - [ ] `badge_count` evaluator: `COUNT(badges WHERE CLAIMED AND scope filter) >= threshold`
  - [ ] `category_count` evaluator: `COUNT(DISTINCT skill.categoryId WHERE badges CLAIMED) >= threshold`
  - [ ] Keep 5-min active config cache
- [ ] Task 2: DTO & Validation upgrade (AC: #6, #11–#13)
  - [ ] Rewrite `MilestoneTriggerDto` with `metric`, `scope`, `threshold`, `categoryId`, `includeSubCategories`
  - [ ] Add cross-field validation: `scope=category` requires `categoryId`; `metric=category_count` requires `scope=global`
  - [ ] Update `CreateMilestoneDto` and `UpdateMilestoneDto`
- [ ] Task 3: Prisma migration (AC: #8, #9)
  - [ ] Migrate `MilestoneType` enum: add `CATEGORY_COUNT`, remove `SKILL_TRACK`, `ANNIVERSARY`, `CUSTOM`
  - [ ] Data migration: convert existing `SKILL_TRACK` records to `BADGE_COUNT` with category scope; deactivate `ANNIVERSARY`/`CUSTOM` records
  - [ ] Guard: check for existing records before enum removal
- [ ] Task 4: Dashboard integration (AC: #14–#16)
  - [ ] Replace hardcoded `milestoneProgress = totalBadges % 5` in `dashboard.service.ts`
  - [ ] Query next un-achieved milestone (by threshold ascending)
  - [ ] Compute real progress: current badge/category count vs threshold
  - [ ] Handle edge cases: all achieved, no active milestones
- [ ] Task 5: Achievement notification (AC: #17–#18)
  - [ ] `checkMilestones()` returns `MilestoneAchievement[]` of newly triggered milestones
  - [ ] Include `newMilestones` in badge claim response DTO

### Admin UI (Frontend — 9h)

- [ ] Task 6: Milestone management page (AC: #21–#25)
  - [ ] Wrap in `<AdminPageShell>` from Story 12.1
  - [ ] Card grid layout (3 columns, responsive)
  - [ ] Each card: icon (top-left), title, description, metric+scope chips, threshold, achievement count, toggle switch (top-right)
  - [ ] Group cards: "Global Milestones" section + "Category Milestones" section
  - [ ] Empty state: "Create your first milestone" CTA card
- [ ] Task 7: Create milestone form (AC: #26–#32, #34)
  - [ ] Shadcn `Sheet` or `Dialog`
  - [ ] Metric radio group: "Badge Count" / "Category Coverage"
  - [ ] Scope radio group: "Global" / "Specific Category"
  - [ ] Auto-lock scope when `metric=category_count`
  - [ ] Category tree picker (search + include sub-categories checkbox)
  - [ ] Threshold number input (min 1)
  - [ ] Lucide icon picker (~20 curated icons)
  - [ ] Auto-generated description preview
  - [ ] Live preview card
  - [ ] Zod validation schemas
- [ ] Task 8: Edit milestone form (AC: #33)
  - [ ] Pre-populated form
  - [ ] Metric + scope locked (disabled + tooltip)
- [ ] Task 9: Toggle isActive (AC: #24)
  - [ ] Inline `Switch` on card (top-right)
  - [ ] API: `PATCH /api/admin/milestones/:id` → `{ isActive }`
  - [ ] Sonner toast confirmation
- [ ] Task 10: CelebrationModal + Timeline integration (AC: #19, #20)
  - [ ] On badge claim: check `newMilestones` in response → trigger `CelebrationModal`
  - [ ] Wire `MilestoneTimelineCard` into `TimelineView`
- [ ] Task 11: API integration
  - [ ] `GET /api/admin/milestones` — list with achievement counts
  - [ ] `POST /api/admin/milestones` — create
  - [ ] `PATCH /api/admin/milestones/:id` — update
  - [ ] `GET /api/skill-categories` — for category tree picker

### Tests (4h)

- [ ] Task 12: Engine tests (AC: #35–#37)
  - [ ] `badge_count × global` evaluator test
  - [ ] `badge_count × category` evaluator test (with sub-categories)
  - [ ] `category_count × global` evaluator test
  - [ ] Invalid combo rejection test (`category_count × category` → 400)
  - [ ] `includeSubCategories` flag test (true vs false)
  - [ ] Prisma migration data integrity test
- [ ] Task 13: Integration + UI tests (AC: #38–#40)
  - [ ] Dashboard milestone progress test (real config, not hardcoded)
  - [ ] Milestone card rendering tests
  - [ ] Form validation tests (Zod)
  - [ ] Toggle switch tests

## Dev Notes

### Architecture Patterns
- **Evaluator architecture:** `metric × scope` orthogonal evaluation — clean separation of "what" and "where"
- **Scope filter builder:** returns Prisma `where` clause fragment; easily extensible for new scopes
- **Category tree traversal:** recursive query via `parentId` self-relation; cache results within evaluation batch
- Wrap in `<AdminPageShell>` from Story 12.1
- Card grid layout (not table — milestones are configuration items)
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
- `GET /api/admin/milestones` — list (add achievement count to response)
- `POST /api/admin/milestones` — create (update DTO validation)
- `PATCH /api/admin/milestones/:id` — update (lock metric/scope)
- `DELETE /api/admin/milestones/:id` — soft delete (set isActive=false)

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

### ⚠️ Out of Scope (Deferred)
- Composite AND/OR trigger rules — JSON structure reserved but not implemented
- BADGE_COMBO (earn specific badges) — requires badge template picker, high complexity
- STREAK (consecutive time periods) — requires time-series analysis
- Cron-based anniversary evaluation — no scheduler needed for current metrics
- Team/group milestones — requires org-level aggregation

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Zod trigger schemas per MilestoneType, achievement count from MilestoneAchievement count, no DELETE (deactivate instead)
- **UX (Sally):** Icon (top-left prominent), toggle (top-right on card), create in sheet/dialog (no page nav), card grid responsive, empty state CTA
- **Original estimate:** 8h

### ✅ Engine Upgrade Review (2026-02-21)
- **Architecture (Winston — simulated):**
  - Approved `metric + scope + threshold` unified model over multi-enum approach
  - Evaluator uses orthogonal `metric × scope` design — extensible via single `case`/`branch` additions
  - SKILL_TRACK query fixed: `SkillCategory → Skill → BadgeTemplate.skillIds hasSome`
  - Prisma migration from 4-value enum to 2-value enum; existing data migrated or deactivated
  - Dashboard hardcoded milestone replaced with MilestoneConfig-driven progress
  - Not in scope: AND/OR composites, BADGE_COMBO, STREAK, cron scheduler
- **UX (Sally — simulated):**
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
