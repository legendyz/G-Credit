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
| Condition | All Fields | Allowed Action |
|-----------|-----------|----------------|
| `achievementCount === 0` | ✅ Fully editable | Edit, Delete (hard) |
| `achievementCount > 0` | 🔒 All locked (read-only view) | Only activate/deactivate toggle |

### UX Adaptations

- **Lock banner** (edit form → becomes "View Milestone"): Amber banner with Lock icon: "This milestone has been achieved by N user(s). All fields are locked to preserve achievement integrity. You can only activate/deactivate it via the toggle switch."
- **Form behavior**: When locked, title reads "View Milestone", all inputs disabled, submit button hidden, only "Close" button shown.
- **Delete dialog**: Adapts title, description, and confirm button text:
  - 0 achievements → "Delete Milestone" / "permanently delete" / [Delete]
  - \>0 achievements → "Deactivate Milestone" / "will be deactivated (hidden) but achievement records are preserved" / [Deactivate]
- **Card delete button tooltip**: Shows "Delete" or "Deactivate (has achievements)" accordingly.
- **Backend enforcement**: `updateMilestone()` rejects any field change (title, description, trigger, icon) with 400 Bad Request when achievements > 0. Only `isActive` toggle passes through.

---

## Rationale

1. **Data integrity**: Once users have achieved a milestone, its entire definition (metric, scope, threshold, title) becomes part of the achievement record's meaning. Changing *any* field would alter the semantics of what users earned. For example:
   - Changing threshold from 5 → 10: users who earned it at 5 see "10" and feel cheated
   - Changing title: achievement history becomes confusing
   - Changing metric/scope: completely invalidates what was measured

2. **Admin flexibility**: Before anyone achieves a milestone, it's effectively a draft. Admins should be free to iterate on its entire configuration — including deleting and recreating.

3. **Simplicity**: A single rule ("achieved = frozen") is easier to understand than partial locking ("these fields are editable but those aren't").

4. **Clean data**: Hard-deleting unused milestones prevents database clutter from abandoned configurations, while soft-deleting achieved milestones preserves the audit trail.

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
const isFullyLocked = mode === 'edit' && achievementCount > 0;
// ALL inputs disabled when isFullyLocked
// Title: "View Milestone", no submit button, only "Close"
```

### Backend (`milestones.service.ts` — update guard)

```typescript
if (milestone._count.achievements > 0) {
  const hasFieldChanges =
    dto.title !== undefined ||
    dto.description !== undefined ||
    dto.trigger !== undefined ||
    dto.icon !== undefined;
  if (hasFieldChanges) {
    throw new BadRequestException(
      `Cannot modify — achieved by ${milestone._count.achievements} user(s)`,
    );
  }
}
// Only isActive toggle passes through
```

### Tests

- Backend: 6 update tests (no-achievement edit, achievement-locked reject ×3, isActive toggle allowed, not-found, cache)
- Backend: 4 delete tests (hard delete, soft delete, not-found, cache)
- Frontend: 702 tests pass (no regressions)

---

## Consequences

### Positive
- Simple mental model: "earned = frozen" — no ambiguity about which fields are editable
- Admins can freely configure milestones until first achievement (draft-like flexibility)
- Achievement history is immutable — what was earned is exactly what's displayed
- Backend enforces the rule even if frontend is bypassed
- Cleaner database — no orphaned deactivated milestones nobody ever achieved

### Negative
- Admins cannot fix typos in achieved milestone titles (must deactivate and create new)
- Slightly more complex update/delete logic (branching on achievement count)
- Frontend must check `_count.achievements` for edit form, delete dialog, and card behavior

### Risks
- If `_count.achievements` is ever not included in the API response, the frontend would default to 0 (unlocked). Mitigated by the backend `getAllMilestones()` always including `_count`.

---

## Related

- ADR-012: Admin Global Settings — association-based protection for skill categories (same pattern: protection based on data dependencies, not static flags)
- Sprint 12 commit: `feat: smart milestone delete + conditional metric/scope locking`
