# Dev Prompt: Story 12.8 — Skills UUID Fallback Hardening

**Story:** 12.8 (~2h estimated)
**Branch:** `sprint-12/management-uis-evidence` (continue on current branch)
**Story Spec:** `sprint-12/12-8-skills-uuid-fallback-hardening.md`

---

## Objective

Harden skill name resolution across all frontend pages so that **no page ever shows raw UUIDs** to users. The `useSkillNamesMap()` hook and `filtersToChips()` utility currently fall back to raw UUID strings when skill lookups fail. Fix all fallback paths to show "Unknown Skill" with muted styling instead.

**Scope:** Primarily frontend. One minor backend check (verification endpoint — already resolved, just verify).

---

## Acceptance Criteria Summary

From the story doc — 5 ACs:

| # | AC | Summary |
|---|-----|---------|
| 1 | No UUID displayed | All pages displaying skills show skill names, never UUIDs |
| 2 | Fallback styling | If skill name cannot be resolved, show "Unknown Skill" with muted styling |
| 3 | Single source | `useSkillNamesMap()` is the single source for skill name resolution |
| 4 | Verification page | Public verify page resolves skills via backend-provided names (no auth) |
| 5 | No regression | All existing tests pass |

---

## Audit Results — Current State

The SM has audited all skill display locations. Here is the current state:

### ✅ Already Correct (NO changes needed)

| Location | File | Why |
|----------|------|-----|
| VerifyBadgePage | `src/pages/VerifyBadgePage.tsx` L312-326 | Backend resolves skills as `{id, name, categoryColor}` objects. Public endpoint, no auth needed. No UUID leak possible. |
| Badge Verification Service | `backend/src/badge-verification/badge-verification.service.ts` L140-165 | Resolves skill names via `prisma.skill.findMany()`, returns `{id, name, categoryColor}`. Already correct. |
| IssueBadgePage | `src/pages/IssueBadgePage.tsx` | No skill display at all — template/recipient selection only. |
| EmbedBadgePage | N/A | Does not exist in the codebase. |

### ⚠️ Needs Fix

| # | Location | File:Line | Current Behavior | Problem |
|---|----------|-----------|------------------|---------|
| F1 | `useSkillNamesMap()` hook | `src/hooks/useSkills.ts` L84-98 | Returns `Record<string, string>` — only includes skills found in API response | If a skill UUID is not in the fetched list (deleted skill, stale data), the key is simply absent. Consumers that use `map[id] || id` will display raw UUID. |
| F2 | `filtersToChips()` skill chip labels | `src/utils/searchFilters.ts` L208 | `options?.skillNames?.[id] || id` | Falls back to raw UUID string in filter chip label |
| F3 | `BadgeDetailModal` resolvedSkills | `src/components/BadgeDetailModal/BadgeDetailModal.tsx` L50-55 | Falls back to `skillNamesMap[id] || 'Unknown Skill'` | **Partial fix** — already shows "Unknown Skill" but lacks muted styling. Also, if `useSkills()` fetch fails entirely, ALL skills show as "Unknown Skill". This is acceptable behavior per AC #2. |
| F4 | `BadgeInfo.tsx` plain string rendering | `src/components/BadgeDetailModal/BadgeInfo.tsx` L62-68 | When `skill` is a plain string (from unresolved path), renders it with `bg-blue-600 text-white` | If a UUID string somehow reaches BadgeInfo, it renders as a bright blue pill with UUID text. Should detect UUID pattern and apply muted styling. |
| F5 | `BadgeManagementPage` skillNames map | `src/pages/admin/BadgeManagementPage.tsx` L233-295 | Builds `skillNames` from `useSkills()`, passes to `useBadgeSearch` → `filtersToChips` | Inherits F2 problem — chips show raw UUID through searchFilters |
| F6 | `TimelineView` skillNames map | `src/components/TimelineView/TimelineView.tsx` L68-98 | Same pattern as BadgeManagementPage | Inherits F2 problem |

---

## Implementation Plan

### Task 1: Fix `useSkillNamesMap()` — Add "Unknown Skill" fallback (AC #1, #2, #3)

**File:** `src/hooks/useSkills.ts` (L84-98)

**Current:**
```typescript
export function useSkillNamesMap(skillIds?: string[]) {
  const { data: skills } = useSkills({ enabled: true });
  if (!skills || !skillIds) return {};
  return skills.reduce((acc, skill) => {
    if (skillIds.includes(skill.id)) acc[skill.id] = skill.name;
    return acc;
  }, {} as Record<string, string>);
}
```

**Change to:**
```typescript
export function useSkillNamesMap(skillIds?: string[]): Record<string, string> {
  const { data: skills } = useSkills({ enabled: true });
  if (!skillIds) return {};
  if (!skills) {
    // Skills not yet loaded — return "Unknown Skill" for all IDs
    return skillIds.reduce((acc, id) => {
      acc[id] = 'Unknown Skill';
      return acc;
    }, {} as Record<string, string>);
  }
  // Map all requested IDs — fallback to "Unknown Skill" for unresolved ones
  return skillIds.reduce((acc, id) => {
    const found = skills.find((s) => s.id === id);
    acc[id] = found ? found.name : 'Unknown Skill';
    return acc;
  }, {} as Record<string, string>);
}
```

**Key behavior change:** Every requested skill ID now always has an entry in the map. No consumer will ever see a missing key. Unresolved IDs get `"Unknown Skill"`.

---

### Task 2: Fix `filtersToChips()` — Replace UUID fallback (AC #1, #2)

**File:** `src/utils/searchFilters.ts` (L208)

**Current:**
```typescript
const skillLabels = filters.skills.map((id) => options?.skillNames?.[id] || id);
```

**Change to:**
```typescript
const skillLabels = filters.skills.map((id) => options?.skillNames?.[id] || 'Unknown Skill');
```

This fixes F2, F5, and F6 simultaneously — `BadgeManagementPage` and `TimelineView` both flow through this function.

---

### Task 3: Add muted styling for "Unknown Skill" in `BadgeInfo.tsx` (AC #2)

**File:** `src/components/BadgeDetailModal/BadgeInfo.tsx` (L58-68)

The component accepts `SkillItem = string | { name: string; categoryColor? }`. When the name is `"Unknown Skill"`, apply muted italic styling per UX spec.

**Current:**
```tsx
{skills.map((skill, index) => {
  const isObject = typeof skill === 'object';
  const name = isObject ? skill.name : skill;
  const color = isObject ? getCategoryColorClasses(skill.categoryColor) : null;
  return (
    <span
      key={index}
      className={`px-3 py-1.5 text-sm font-medium rounded-full ${
        color ? `${color.bg} ${color.text}` : 'bg-blue-600 text-white'
      }`}
    >
      {name}
    </span>
  );
})}
```

**Change to:** Add an `isUnknown` check — when `name === 'Unknown Skill'`, use `text-muted-foreground italic bg-muted` classes instead of the bright blue default:

```tsx
{skills.map((skill, index) => {
  const isObject = typeof skill === 'object';
  const name = isObject ? skill.name : skill;
  const color = isObject ? getCategoryColorClasses(skill.categoryColor) : null;
  const isUnknown = name === 'Unknown Skill';
  return (
    <span
      key={index}
      className={`px-3 py-1.5 text-sm rounded-full ${
        isUnknown
          ? 'text-muted-foreground italic bg-muted'
          : color
            ? `${color.bg} ${color.text} font-medium`
            : 'bg-blue-600 text-white font-medium'
      }`}
    >
      {name}
    </span>
  );
})}
```

---

### Task 4: Verify `BadgeDetailModal` fallback (AC #2)

**File:** `src/components/BadgeDetailModal/BadgeDetailModal.tsx` (L46-55)

**Current:**
```tsx
const resolvedSkills = (badge?.template?.skillIds || []).map((id) => {
  const found = allSkills.find((s) => s.id === id);
  return found
    ? { name: found.name, categoryColor: found.categoryColor }
    : { name: skillNamesMap[id] || 'Unknown Skill', categoryColor: null };
});
```

This already falls back to `'Unknown Skill'`. With Task 1's fix, `skillNamesMap[id]` will always return a value (either the real name or "Unknown Skill"), so the `|| 'Unknown Skill'` is now redundant but harmless. **No change needed** — the muted styling will be handled by `BadgeInfo` (Task 3) because `categoryColor: null` → no color match → BadgeInfo renders with default. With the Task 3 fix, `name === 'Unknown Skill'` will trigger muted styling.

---

### Task 5: Tests (AC #5)

#### 5a. `useSkillNamesMap` tests — `src/hooks/useSkills.test.tsx`

Add tests to the existing test file:

```typescript
describe('useSkillNamesMap', () => {
  it('should return "Unknown Skill" for IDs not found in skills list', () => {
    // Mock useSkills to return a limited set
    // Call useSkillNamesMap with an ID that doesn't exist
    // Assert: map[unknownId] === 'Unknown Skill'
  });

  it('should return "Unknown Skill" for all IDs when skills not yet loaded', () => {
    // Mock useSkills to return undefined (loading state)
    // Call useSkillNamesMap with IDs
    // Assert: all values are 'Unknown Skill'
  });

  it('should return resolved names for known IDs', () => {
    // Mock useSkills with known skills
    // Assert: map[knownId] === 'Known Skill Name'
  });
});
```

#### 5b. `filtersToChips` tests — `src/utils/searchFilters.test.ts`

Add to the existing test file:

```typescript
describe('filtersToChips skill fallback', () => {
  it('should show "Unknown Skill" instead of UUID when skillNames map is empty', () => {
    const chips = filtersToChips(
      { skills: ['some-uuid-1234'] },
      { skillNames: {} }
    );
    expect(chips[0].label).toBe('Unknown Skill');
  });

  it('should show "Unknown Skill" when skillNames is undefined', () => {
    const chips = filtersToChips({ skills: ['some-uuid'] });
    expect(chips[0].label).toBe('Unknown Skill');
  });
});
```

#### 5c. `BadgeInfo` test — `src/components/BadgeDetailModal/BadgeInfo.test.tsx`

Add to the existing test file:

```typescript
it('should render "Unknown Skill" with muted italic styling', () => {
  render(<BadgeInfo description="Test" skills={['Unknown Skill']} criteria={null} />);
  const pill = screen.getByText('Unknown Skill');
  expect(pill.className).toContain('text-muted-foreground');
  expect(pill.className).toContain('italic');
  expect(pill.className).not.toContain('bg-blue-600');
});
```

#### 5d. Run all existing tests — ensure no breakage

```bash
cd frontend && npx vitest run
cd backend && npx jest --forceExit
```

---

## File Inventory

| # | File | Action | Lines Changed (est.) |
|---|------|--------|---------------------|
| 1 | `src/hooks/useSkills.ts` | Modify `useSkillNamesMap()` | ~10 |
| 2 | `src/utils/searchFilters.ts` | Change fallback from `id` to `'Unknown Skill'` | 1 |
| 3 | `src/components/BadgeDetailModal/BadgeInfo.tsx` | Add muted styling for "Unknown Skill" | ~5 |
| 4 | `src/hooks/useSkills.test.tsx` | Add `useSkillNamesMap` fallback tests | ~30 |
| 5 | `src/utils/searchFilters.test.ts` | Add chip fallback tests | ~15 |
| 6 | `src/components/BadgeDetailModal/BadgeInfo.test.tsx` | Add muted styling test | ~10 |

**Total: ~6 files, ~70 lines changed**

---

## Key Context Files (Read Before Starting)

| File | Purpose |
|------|---------|
| `src/hooks/useSkills.ts` | `useSkillNamesMap()` hook — primary fix target |
| `src/utils/searchFilters.ts` | `filtersToChips()` — UUID fallback in chips |
| `src/components/BadgeDetailModal/BadgeInfo.tsx` | Skill pill rendering — muted styling |
| `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | Caller that builds resolvedSkills array |
| `src/pages/VerifyBadgePage.tsx` L310-326 | Already correct — backend resolves skills |
| `backend/src/badge-verification/badge-verification.service.ts` L140-165 | Backend skill resolution — already correct |

---

## Tech Stack Reference

| Layer | Tech | Version |
|-------|------|---------|
| Frontend | React + TypeScript | 19.2 / 5.9 |
| Styling | Tailwind CSS | 4.1 |
| State | TanStack Query | v5 |
| Test | Vitest + Testing Library | 4.0 |
| Backend | NestJS + Prisma | 11 / 6.19 |

---

## Completion Checklist

Before marking done:

- [ ] `useSkillNamesMap()` returns "Unknown Skill" for every unresolved ID (never absent key)
- [ ] `filtersToChips()` shows "Unknown Skill" instead of raw UUID
- [ ] `BadgeInfo` renders "Unknown Skill" with `text-muted-foreground italic bg-muted`
- [ ] VerifyBadgePage confirmed unchanged (backend resolves skills)
- [ ] All new tests pass
- [ ] All existing tests pass (`npx vitest run` — 691+ tests, `npx jest --forceExit` — 845+ tests)
- [ ] TSC clean: `npx tsc --noEmit`
- [ ] Lint clean: `npx eslint . --max-warnings=0`
- [ ] Update story spec: mark ACs [x], tasks [x], fill Dev Agent Record
