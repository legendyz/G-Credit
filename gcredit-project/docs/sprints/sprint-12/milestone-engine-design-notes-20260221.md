# Milestone Engine Design Discussion — 2026-02-21

## 1. Background

Story 12.4 originally scoped as "Milestone Admin UI" (frontend-only, 8h) to resolve TD-009. During PO review, deeper analysis revealed the existing milestone engine has significant architectural gaps that would make the Admin UI ineffective without engine fixes.

**Decision:** Upgrade Story 12.4 to include both Admin UI and Engine refactoring.

## 2. Current Engine Limitations Identified

| # | Issue | Severity |
|---|---|---|
| 1 | Dashboard milestone is **hardcoded** (`every 5 badges`) — not driven by `MilestoneConfig` | High |
| 2 | `SKILL_TRACK` trigger compares `template.category` (freeform string) vs `trigger.categoryId` (UUID) — **type mismatch**, effectively broken | High |
| 3 | No FK between `BadgeTemplate.category` and `SkillCategory` — data integrity gap | Medium |
| 4 | `CUSTOM` type exists in Prisma enum but has **no evaluator implementation** | Medium |
| 5 | `CelebrationModal` is coded but **never triggered** on milestone achievement | Medium |
| 6 | `MilestoneTimelineCard` is coded but **not wired** into TimelineView | Medium |
| 7 | `CreateMilestoneDto.type` is freeform string with manual enum mapping, no validation | Low |
| 8 | `ANNIVERSARY` type only evaluated on badge events (no cron), effectively useless | Low |

## 3. Design Evolution

### Round 1: Multi-Type Taxonomy

Initial proposal categorized milestones into separate types:
- `BADGE_COUNT` (global), `SKILL_TRACK` (category), `CATEGORY_DIVERSITY` (global), `BADGE_COMBO`, `ANNIVERSARY`, `CUSTOM`

**PO Feedback:** If the engine is flexible enough, we shouldn't need to distinguish between "global" and "category-specific" at the type level.

### Round 2: Unified `metric + scope + threshold` Model (Final)

**Key Insight:** All milestones are fundamentally a **metric** (what to count) + **scope** (where to count) + **threshold** (how many to trigger). This eliminates type proliferation.

```
metric    → "badge_count" | "category_count"     (what to measure)
scope     → "global" | "category"                 (where to measure)
threshold → number                                (when to trigger)
```

This single model covers all required scenarios through combination rather than enumeration.

## 4. Final Trigger JSON Schema

```typescript
interface MilestoneTrigger {
  metric: 'badge_count' | 'category_count';
  scope: 'global' | 'category';
  threshold: number;                    // min 1
  categoryId?: string;                  // required when scope='category'
  includeSubCategories?: boolean;       // default true
}
```

### Combination Matrix

| Metric | Scope | Example | Valid? |
|---|---|---|---|
| `badge_count` | `global` | "Earn 5 badges" | ✅ |
| `badge_count` | `category` | "Earn 3 badges in Software Development" | ✅ |
| `category_count` | `global` | "Earn badges across 3 different categories" | ✅ |
| `category_count` | `category` | — | ❌ Invalid (semantically meaningless) |

### Validation (Zod)

```typescript
const MilestoneTriggerSchema = z.discriminatedUnion('scope', [
  z.object({
    metric: z.enum(['badge_count', 'category_count']),
    scope: z.literal('global'),
    threshold: z.number().int().min(1),
  }),
  z.object({
    metric: z.literal('badge_count'),  // category_count not allowed with category scope
    scope: z.literal('category'),
    threshold: z.number().int().min(1),
    categoryId: z.string().uuid(),
    includeSubCategories: z.boolean().default(true),
  }),
]);
```

## 5. Architect Review (Winston) — Round 2

### Evaluator Architecture

```typescript
class MilestoneEvaluator {
  async evaluate(userId: string, trigger: MilestoneTrigger): Promise<boolean> {
    const whereClause = await this.buildScopeFilter(trigger);
    switch (trigger.metric) {
      case 'badge_count':
        return this.countBadges(userId, whereClause) >= trigger.threshold;
      case 'category_count':
        return this.countDistinctCategories(userId, whereClause) >= trigger.threshold;
    }
  }

  private async buildScopeFilter(trigger: MilestoneTrigger) {
    if (trigger.scope === 'global') return {};
    const categoryIds = trigger.includeSubCategories
      ? await this.getDescendantCategoryIds(trigger.categoryId)
      : [trigger.categoryId];
    const skillIds = await this.getSkillIdsByCategories(categoryIds);
    return { template: { skillIds: { hasSome: skillIds } } };
  }
}
```

### SKILL_TRACK Query Fix

Current broken chain: `template.category` (string) → direct match → fails

Fixed chain:
```
scope.categoryId → SkillCategory (+ descendants) → Skill[] → Skill.id
                                                                 ↓
Badge(CLAIMED) → BadgeTemplate.skillIds[] ←── hasSome ──→ Skill.id
```

### Prisma Enum Migration

- Change `MilestoneType` enum: `BADGE_COUNT | SKILL_TRACK | ANNIVERSARY | CUSTOM` → `BADGE_COUNT | CATEGORY_COUNT`
- `type` field retained for UI display/grouping only; evaluation driven by `trigger` JSON
- Requires migration + data check for existing records

### Frontend Component Integration

| Component | Current State | 12.4 Action |
|---|---|---|
| Dashboard milestone card | Hardcoded (every 5 badges) | Read from MilestoneConfig, show next target |
| MilestoneTimelineCard | Coded but not wired | Conditionally render in TimelineView |
| CelebrationModal | Coded but never triggered | Trigger on milestone achievement |

### Architect Decisions

- **Not in scope for 12.4:** Composite AND/OR rules (JSON structure reserved), BADGE_COMBO, STREAK, cron scheduler
- **`template.category` field:** Not removed (backward compat), but not used by milestone engine
- **Extensibility:** New metric → add one `case` in evaluator; new scope → add one `buildScopeFilter` branch

## 6. UX Review (Sally) — Round 2

### Unified Creation Form

The `metric + scope` model simplifies Admin UI from 4 type-specific forms to **one dynamic form**:

```
┌───────────────────────────────────────────────┐
│  Create Milestone                        [×]  │
├───────────────────────────────────────────────┤
│  Icon:  [🏆 ▼]     Title: [______________]   │
│  Description: [_____________________________] │
│                                               │
│  ┌─ What to measure ───────────────────────┐  │
│  │  Metric:  ◉ Badge Count                │  │
│  │           ○ Category Coverage           │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─ Where to measure ─────────────────────┐  │
│  │  Scope:   ◉ Global (all badges)        │  │
│  │           ○ Specific Category           │  │
│  │  [hidden when Global / category_count]  │  │
│  │  Category: [技术技能 ▼] (tree picker)   │  │
│  │  ☑ Include sub-categories               │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  Threshold: [___5___]                         │
│  "User earns this after claiming 5 badges"    │  ← auto-generated
│                                               │
│  ┌─ Preview Card ──────────────────────────┐  │
│  │  🏆  Badge Collector             🟢    │  │
│  │  Earn 5 badges                          │  │
│  │  BADGE_COUNT · Global                   │  │
│  └─────────────────────────────────────────┘  │
│              [Cancel]  [Create Milestone]      │
└───────────────────────────────────────────────┘
```

### Dynamic Description Rules

| Metric | Scope | Auto-Generated Description |
|---|---|---|
| badge_count | global | "Earn {threshold} badges" |
| badge_count | category | "Earn {threshold} badges in {categoryName}" |
| category_count | global | "Earn badges across {threshold} different categories" |

### Constraint

When `metric = category_count`, scope is **auto-locked to `global`** (category picker hidden). This prevents the semantically invalid `category_count + category` combination.

### Card Grid Design

```
┌──────────────────────┬──────────────────────┬────────────────────────┐
│  🏅 First Badge      │  🏆 Badge Collector  │  🌍 Well-Rounded      │
│  BADGE_COUNT · Global│  BADGE_COUNT · Global│  CATEGORY_COUNT·Global │
│  Earn 1 badge        │  Earn 5 badges       │  3 different categories│
│  👥 45 achieved  🟢  │  👥 12 achieved  🟢  │  👥 5 achieved    🟢  │
├──────────────────────┼──────────────────────┼────────────────────────┤
│  💻 Tech Starter     │  🗣️ Communicator     │                        │
│  BADGE_COUNT·Category│  BADGE_COUNT·Category│   [+ Create Milestone] │
│  1 badge in 技术技能 │  3 badges in 软技能  │                        │
│  👥 20 achieved  🟢  │  👥 3 achieved   🔴  │                        │
└──────────────────────┴──────────────────────┴────────────────────────┘
```

### UX Decisions

- Cards grouped by scope: **Global Milestones** section + **Category Milestones** section
- Live preview card in create/edit form
- Empty state: "Create your first milestone" CTA card
- Milestones with achievements can only be deactivated, not deleted
- Metric/scope locked after creation (disabled + tooltip)
- Category tree picker with search, shows badge template count per category

## 7. Final Decision Summary

| Dimension | Original Plan | Final Plan |
|---|---|---|
| **Title** | Milestone Admin UI | Milestone Admin UI & Engine Upgrade |
| **Engine model** | 4 MilestoneType enums | `metric + scope + threshold` unified model |
| **Metrics** | — | `badge_count`, `category_count` (2) |
| **Scopes** | — | `global`, `category` (2) |
| **Combination constraint** | — | `category_count` only allows `global` scope |
| **SKILL_TRACK query** | template.category (broken) | Via `skillIds → Skill.categoryId` chain |
| **Dashboard** | Hardcoded every-5 | Connected to MilestoneConfig |
| **CelebrationModal** | Not wired | Triggered on achievement |
| **MilestoneTimelineCard** | Not wired | Rendered in Timeline |
| **Admin UI** | 4 type-specific forms | Unified form with metric/scope dynamic fields |
| **Composite rules (AND/OR)** | — | JSON structure reserved, not implemented |
| **Estimate** | 8h | **20h** |

---

Recorded by: Bob (SM Agent)
Date: 2026-02-21
Participants: LegendZhu (PO), Winston (Architect — simulated), Sally (UX — simulated)
