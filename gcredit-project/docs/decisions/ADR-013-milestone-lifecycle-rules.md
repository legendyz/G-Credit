# ADR-013: Milestone Lifecycle Rules — Achievement-Aware Delete & Edit

**ADR Number:** 013
**Status:** ✅ Accepted
**Date:** 2026-02-23
**Author:** Bob (SM)
**Deciders:** LegendZhu (PO/Project Lead), Bob (SM)
**Context:** Sprint 12 UAT — milestone management business rules discussion

---

## Context and Problem Statement

During Sprint 12 UAT, we identified two UX/data-integrity issues with milestone management:

1. **Delete behavior:** All milestone deletions were soft-deletes (`isActive=false`), even for milestones nobody had achieved. This cluttered the database with deactivated records that could have been safely removed.

2. **Metric/Scope locking:** The edit form always locked the Metric and Scope fields after creation, preventing admins from correcting configuration mistakes on milestones that had no achievements yet. The original hint text ("Cannot change after creation") was too subtle and lacked explanation.

**Key Question:** When should milestone configuration be mutable, and when should deletion be permanent vs. reversible?

---

## Decision

### Delete Strategy: Achievement-Aware

| Condition | Action | Rationale |
|-----------|--------|-----------|
| `achievementCount === 0` | **Hard delete** (permanent removal) | No user data depends on this milestone; safe to remove entirely |
| `achievementCount > 0` | **Soft delete** (`isActive = false`) | Achievement records reference this milestone; preserve for history and audit |

### Edit Mutability: Achievement-Gated

| Condition | Metric & Scope | Other Fields |
|-----------|---------------|--------------|
| `achievementCount === 0` | ✅ Fully editable | ✅ Fully editable |
| `achievementCount > 0` | 🔒 Locked (with info banner) | ✅ Editable (title, description, threshold, icon) |

### UX Adaptations

- **Info banner** (edit form): Only shown when achievements exist. Displays: "Metric and Scope cannot be changed because N user(s) have already achieved this milestone."
- **Lock icons**: Appear on Metric/Scope labels only when locked.
- **Delete dialog**: Adapts title, description, and confirm button text:
  - 0 achievements → "Delete Milestone" / "permanently delete" / [Delete]
  - \>0 achievements → "Deactivate Milestone" / "will be deactivated (hidden) but achievement records are preserved" / [Deactivate]
- **Card delete button tooltip**: Shows "Delete" or "Deactivate (has achievements)" accordingly.

---

## Rationale

1. **Data integrity**: Changing a milestone's measurement criteria (metric/scope) after users have achieved it would retroactively invalidate those achievements. A "Badge Collector (5 badges globally)" milestone that gets changed to "Category Coverage" would make existing achievements semantically incorrect.

2. **Admin flexibility**: Before anyone achieves a milestone, it's effectively a draft. Admins should be free to iterate on its configuration without having to delete and recreate.

3. **Clean data**: Hard-deleting unused milestones prevents database clutter from abandoned configurations, while soft-deleting achieved milestones preserves the audit trail.

4. **Clear communication**: Adapting dialog text and showing achievement counts in the lock banner helps admins understand *why* a restriction exists, reducing confusion.

---

## Implementation

### Backend (`milestones.service.ts`)

```typescript
async deleteMilestone(id: string) {
  const milestone = await prisma.milestoneConfig.findUnique({
    where: { id },
    include: { _count: { select: { achievements: true } } },
  });

  if (milestone._count.achievements === 0) {
    // Hard delete — no dependencies
    return prisma.milestoneConfig.delete({ where: { id } });
  } else {
    // Soft delete — preserve achievement history
    return prisma.milestoneConfig.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
```

### Frontend (`MilestoneFormSheet.tsx`)

```typescript
const achievementCount = milestone?._count?.achievements ?? 0;
const isMetricLocked = mode === 'edit' && achievementCount > 0;
// Lock metric/scope inputs only when isMetricLocked is true
```

### Tests

- Backend: 4 delete test cases (hard delete, soft delete, not-found, cache invalidation)
- Frontend: 702 tests pass (no regressions)

---

## Consequences

### Positive
- Admins can freely configure milestones until first achievement (draft-like flexibility)
- Achievement history is never lost for milestones users have earned
- Clear, context-aware UX messaging reduces admin confusion
- Cleaner database — no orphaned deactivated milestones nobody ever achieved

### Negative
- Slightly more complex delete logic (branching on achievement count)
- Frontend must check `_count.achievements` for both edit form and delete dialog

### Risks
- If `_count.achievements` is ever not included in the API response, the frontend would default to 0 (unlocked). Mitigated by the backend `getAllMilestones()` always including `_count`.

---

## Related

- ADR-012: Admin Global Settings — association-based protection for skill categories (same pattern: protection based on data dependencies, not static flags)
- Sprint 12 commit: `feat: smart milestone delete + conditional metric/scope locking`
