# Story 12.2 — Skill Management UI — Dev Prompt

**Sprint:** 12 · **Story:** 12.2 · **Estimate:** 10 h  
**Branch:** `sprint-12/management-uis-evidence`  
**Depends on:** Story 12.1 (merged — `AdminPageShell`, `CategoryTree`, `ConfirmDialog`, `useSkillCategories` available)

---

## Objective

Build the Skill Management page at `/admin/skills` with a split layout (category tree left, skills table right), full CRUD, a new category-color system, fix the existing `useSkills` bug, and propagate category colors to three existing pages (`BadgeTemplateFormPage`, `BadgeInfo`, `VerifyBadgePage`).

---

## Pre-Implementation Context

### Existing Backend APIs (already working — no new endpoints needed, only modifications)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/api/skills?categoryId=` | Public | Returns all skills with `include: { category: true }` |
| `GET` | `/api/skills/search?q=` | Public | Text search, limit 20 |
| `GET` | `/api/skills/:id` | Public | Includes `category.parent` |
| `POST` | `/api/skills` | Admin / Issuer | Body: `{ name, description?, categoryId, level? }` |
| `PATCH` | `/api/skills/:id` | Admin / Issuer | Body: `{ name?, description?, level? }` |
| `DELETE` | `/api/skills/:id` | Admin / Issuer | Blocked if referenced by `BadgeTemplate.skillIds` |

### Existing Frontend Components (from Story 12.1)

| Component | Exported from | Key props for this story |
|-----------|---------------|--------------------------|
| `AdminPageShell` | `@/components/admin/AdminPageShell` | `title, description, actions, isLoading, isError, isEmpty, emptyAction, onRetry, children` |
| `CategoryTree` | `@/components/admin/CategoryTree` | `categories, editable={false}, selectedId, onSelect` — read-only selector mode, highlights selected row with `bg-brand-50` |
| `ConfirmDialog` | `@/components/ui/ConfirmDialog` | `open, onOpenChange, title, description, variant="danger", loading, onConfirm` |
| `useSkillCategoryTree` | `@/hooks/useSkillCategories` | Returns `{ data: SkillCategory[], isLoading, isError }` — tree structure with children + skill counts |

### Known Bug to Fix

**File:** `frontend/src/hooks/useSkills.ts` (line 65)  
**Bug:** `useSkills()` maps `skill.category?.name` to field `category`, but the `Skill` interface in `SkillsFilter.tsx` expects `categoryName`. This causes `groupByCategory` to silently dump ALL skills into an "Other" group.

```typescript
// CURRENT (broken):
return data.map((skill) => ({
  id: skill.id,
  name: skill.name,
  category: skill.category?.name,  // ← wrong field name
}));

// FIXED:
return data.map((skill) => ({
  id: skill.id,
  name: skill.name,
  categoryName: skill.category?.name,  // ← matches Skill interface
  categoryColor: skill.category?.color, // ← new field from Task 3
  categoryId: skill.category?.id,       // ← useful for admin page
}));
```

### Prisma Schema Reference

```prisma
model SkillCategory {
  id, name, nameEn?, description?, parentId?, parent, children,
  level (1-3), isSystemDefined, isEditable, displayOrder, skills[]
  // ⚠️ NO `color` field yet — Task 3 adds this
  @@map("skill_categories")
}

model Skill {
  id, name, description?, categoryId, category, level?
  @@unique([name, categoryId])
  @@map("skills")
}

model BadgeTemplate {
  // ...
  skillIds String[]  // Array of Skill UUIDs
}
```

---

## Task Sequence (8 tasks, execute in order)

### Task 1: Add `color` field to `SkillCategory` (Backend — Prisma migration)

**Goal:** Add a `color` column so each category can have a Tailwind color name.

**Steps:**

1. **Update `schema.prisma`** — add `color` field to `SkillCategory`:
   ```prisma
   model SkillCategory {
     // ... existing fields ...
     color           String?          @db.VarChar(20) // Tailwind color name: blue, emerald, amber, etc.
     // ... rest unchanged ...
   }
   ```

2. **Generate migration:**
   ```powershell
   cd gcredit-project/backend
   npx prisma migrate dev --name add-skill-category-color
   ```

3. **Update `CreateSkillCategoryDto`** in `backend/src/skill-categories/dto/skill-category.dto.ts`:
   ```typescript
   @IsOptional()
   @IsString()
   @MaxLength(20)
   color?: string;
   ```

4. **Update `UpdateSkillCategoryDto`** — same as above.

5. **Update `SkillCategoryResponseDto`** — add `color?: string`.

6. **Auto-assign color on creation** in `skill-categories.service.ts` `create()`:
   - Import a color palette: `const CATEGORY_COLORS = ['slate','blue','emerald','amber','rose','violet','cyan','orange','pink','lime'] as const;`
   - If `dto.color` not provided, assign based on count of existing categories: `dto.color ?? CATEGORY_COLORS[existingCount % CATEGORY_COLORS.length]`

7. **Include `category.color` in skill responses** — update `skills.service.ts`:
   - `findAll()`: `include: { category: { select: { id: true, name: true, color: true } } }` (or keep `category: true` which already includes all fields)
   - `search()`: same
   - `create()`: same
   - `update()`: same

8. **Include `category.color` in verification response** — update `badge-verification.service.ts` line ~133:
   ```typescript
   // BEFORE:
   select: { id: true, name: true },
   
   // AFTER:
   select: { id: true, name: true, category: { select: { color: true } } },
   ```
   And line ~151:
   ```typescript
   // BEFORE:
   skills: skills.map((s) => ({ id: s.id, name: s.name })),
   
   // AFTER:
   skills: skills.map((s) => ({ id: s.id, name: s.name, categoryColor: s.category?.color ?? null })),
   ```

**Verification:** `npx prisma migrate status` shows no pending migrations. Backend compiles with `npx tsc --noEmit`.

---

### Task 2: Create `categoryColors.ts` shared constants (Frontend)

**File:** `frontend/src/lib/categoryColors.ts`

```typescript
/**
 * Category Color System — Story 12.2
 *
 * Maps Tailwind color names to CSS classes for skill tag pills.
 * Colors are assigned to SkillCategory (not individual skills).
 */

export const CATEGORY_COLORS = [
  'slate', 'blue', 'emerald', 'amber', 'rose',
  'violet', 'cyan', 'orange', 'pink', 'lime',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/**
 * Tailwind class map for each color: { bg, text, border }
 * Uses Tailwind v4 classes (no JIT safelist needed — classes are statically defined here).
 */
export const COLOR_MAP: Record<CategoryColor, { bg: string; text: string; border: string }> = {
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-800',   border: 'border-slate-300' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300' },
  rose:    { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-300' },
  violet:  { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-300' },
  cyan:    { bg: 'bg-cyan-100',    text: 'text-cyan-800',    border: 'border-cyan-300' },
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300' },
  pink:    { bg: 'bg-pink-100',    text: 'text-pink-800',    border: 'border-pink-300' },
  lime:    { bg: 'bg-lime-100',    text: 'text-lime-800',    border: 'border-lime-300' },
};

/** Default fallback when category has no color */
export const DEFAULT_COLOR: CategoryColor = 'slate';

/**
 * Get Tailwind classes for a category color.
 * Safely falls back to slate for null/unknown values.
 */
export function getCategoryColorClasses(color?: string | null) {
  return COLOR_MAP[(color as CategoryColor) ?? DEFAULT_COLOR] ?? COLOR_MAP[DEFAULT_COLOR];
}
```

---

### Task 3: Fix `useSkills` hook + extend Skill interface (Frontend)

**File:** `frontend/src/hooks/useSkills.ts`

**Changes:**

1. Update the `SkillApiResponse` interface to include `category.color`:
   ```typescript
   interface SkillApiResponse {
     id: string;
     name: string;
     description?: string;
     level?: string;
     category?: {
       id: string;
       name: string;
       color?: string | null;
     };
   }
   ```

2. Update the return mapping in `useSkills()` to fix the bug + add new fields:
   ```typescript
   return data.map((skill) => ({
     id: skill.id,
     name: skill.name,
     categoryName: skill.category?.name,    // FIX: was `category`
     categoryColor: skill.category?.color,   // NEW
     categoryId: skill.category?.id,         // NEW
     description: skill.description,         // NEW — needed for admin table
     level: skill.level,                     // NEW — needed for admin table
   }));
   ```

3. Update the `Skill` type import — the current import is from `SkillsFilter.tsx`:
   ```typescript
   import type { Skill } from '@/components/search/SkillsFilter';
   ```
   The `Skill` interface in `SkillsFilter` only has `{ id, name, categoryName? }`. You need to either:
   - **(a) Extend the Skill interface in SkillsFilter.tsx** to include `categoryColor?, categoryId?, description?, level?`
   - **(b) Define a broader `AdminSkill` type locally** and only cast to `Skill` when passing to `SkillsFilter`
   
   **Recommendation:** Option (a) — extend `SkillsFilter`'s `Skill` interface. It's already used across the codebase.

   Updated `Skill` interface in `SkillsFilter.tsx`:
   ```typescript
   export interface Skill {
     id: string;
     name: string;
     categoryName?: string;
     categoryColor?: string | null;
     categoryId?: string;
     description?: string;
     level?: string;
   }
   ```

4. Update `useSkillNamesMap` — no change needed (it only uses `id` and `name`).

**Verification:** After this change, `SkillsFilter groupByCategory={true}` will correctly group by `categoryName` instead of putting everything in "Other".

---

### Task 4: Create `SkillManagementPage` — split layout (Frontend)

**File:** `frontend/src/pages/admin/SkillManagementPage.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ AdminPageShell: "Skill Management"                   [+ Add] │
├───────────────┬──────────────────────────────────────────────┤
│ CategoryTree  │  Search: [____________]    Showing X skills  │
│ (read-only)   │  ┌──────────────────────────────────────────┐│
│               │  │ Name │ Category │ Level │ Badges │ Acts  ││
│ ▸ Tech (12)   │  │──────┼──────────┼───────┼────────┼───────││
│   React (5)   │  │ React│ ●Tech    │ ADV   │ 3      │ ✎ ✕  ││
│   Node (3)    │  │ Node │ ●Tech    │ INT   │ 1      │ ✎ ✕  ││
│ ▸ Leaders (8) │  │ ...  │          │       │        │       ││
│               │  └──────────────────────────────────────────┘│
│ [All] selected│  Pagination: < 1 2 3 ... >                   │
└───────────────┴──────────────────────────────────────────────┘
```

**Implementation details:**

1. **Wrap in `<AdminPageShell>`** with title "Skill Management".

2. **Left panel (≥1024px):** `<CategoryTree editable={false} categories={tree} selectedId={selectedCategoryId} onSelect={handleCategorySelect} />` from `useSkillCategoryTree()`. Add an "All Categories" option above the tree that clears the filter.

3. **Right panel:** Skills data table.
   - Fetch with `useSkills({ categoryId: selectedCategoryId })` (existing hook — already supports `categoryId` filter).
   - Columns: Name, Category (colored chip using `getCategoryColorClasses`), Level, Badge Count (from `_count.templates` or calculated), Actions (Edit, Delete icons).
   - Search input at top (debounced 300ms with `useState` + `setTimeout`).
   - Client-side pagination (reuse the pattern from `BadgeManagementPage` — `<table>` + prev/next buttons). The backend returns all skills, no server-side pagination needed for MVP.

4. **Responsive (<1024px):** Hide tree panel, show a category dropdown (`<Select>`) above the table. Use `useSkillCategoryFlat()` for the flat list in the dropdown.

5. **State management:**
   ```typescript
   const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
   const [searchTerm, setSearchTerm] = useState('');
   const [debouncedSearch, setDebouncedSearch] = useState('');
   const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
   const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
   const [isAddingInline, setIsAddingInline] = useState(false);
   ```

**File count note:** This page will be ~250–350 lines. If it gets larger, extract the data table into `<SkillsTable>` component.

---

### Task 5: Create skill CRUD hooks (Frontend)

**File:** `frontend/src/hooks/useSkillMutations.ts`

> **Important:** Do NOT modify the existing `useSkills.ts` export signature beyond what Task 3 requires. Create a separate file for mutations.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiFetch';
import { toast } from 'sonner';

interface CreateSkillInput {
  name: string;
  description?: string;
  categoryId: string;
  level?: string;
}

interface UpdateSkillInput {
  name?: string;
  description?: string;
  level?: string;
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSkillInput) =>
      apiFetchJson('/skills', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['skill-categories'] }); // Update skill counts in tree
      toast.success('Skill created');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create skill'),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSkillInput & { id: string }) =>
      apiFetchJson(`/skills/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update skill'),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetchJson(`/skills/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['skill-categories'] }); // Update skill counts
      toast.success('Skill deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete skill'),
  });
}
```

---

### Task 6: Inline add skill + edit dialog + delete guard (Frontend)

**Inline add (in `SkillManagementPage`):**

1. "+ Add Skill" button in `AdminPageShell`'s `actions` slot (disabled if no category selected).
2. Clicking opens an inline row at the top of the table:
   - Fields: `name` (auto-focus), `description`, `level` (select dropdown)
   - `categoryId` auto-filled from `selectedCategoryId`
   - **Tab from last field** → submit (call `useCreateSkill`)
   - **Escape** → cancel
   - Validation: `name` required, max 100 chars

**Edit dialog:**

1. Create `<SkillFormDialog>` component (or inline modal) — similar to `CategoryFormDialog` from 12.1.
2. Props: `open, onOpenChange, skill (null=create, Skill=edit), categories (flat list for category selector), onSubmit`.
3. Fields: `name`, `description`, `category` (select from flat categories), `level` (select: BEGINNER/INTERMEDIATE/ADVANCED/EXPERT).
4. Validation: name required, max 100 chars, category required.

**Delete guard:**

1. Click delete icon → set `deletingSkill`.
2. `<ConfirmDialog variant="danger">` with title: `Delete "${skill.name}"?`
3. Description: "This skill will be permanently removed."
4. On confirm → call `useDeleteSkill(skill.id)`.
5. If backend returns 400 ("referenced by N template(s)") → display error toast with the message.

---

### Task 7: Propagate category colors to existing pages (Frontend)

**7a. `BadgeTemplateFormPage.tsx`** (skill picker section, lines ~417–447):

Replace the flat pill list with `SkillsFilter` using `groupByCategory={true}`:

```tsx
// BEFORE: flat pill loop with hardcoded bg-brand-600
// AFTER:
import { SkillsFilter } from '@/components/search/SkillsFilter';

<SkillsFilter
  skills={availableSkills}
  selectedSkills={selectedSkills}
  onChange={setSelectedSkills}
  groupByCategory={true}
  searchable={true}
  showClearButton={true}
  disabled={isReadOnly}
  placeholder="Select related skills..."
/>
```

This works because Task 3 already fixed `useSkills()` to return `categoryName` correctly.

**7b. `BadgeInfo.tsx`** (`frontend/src/components/BadgeDetailModal/BadgeInfo.tsx`):

1. Change `skills` prop from `string[]` to `Array<string | { name: string; categoryColor?: string | null }>` for backward compat.
2. Render with category color when available:
   ```tsx
   import { getCategoryColorClasses } from '@/lib/categoryColors';
   
   {skills.map((skill, index) => {
     const isObject = typeof skill === 'object';
     const name = isObject ? skill.name : skill;
     const color = isObject ? getCategoryColorClasses(skill.categoryColor) : null;
     return (
       <span key={index} className={`px-3 py-1.5 text-sm font-medium rounded-full ${
         color ? `${color.bg} ${color.text}` : 'bg-blue-600 text-white'
       }`}>
         {name}
       </span>
     );
   })}
   ```

3. **Update caller** in `BadgeDetailModal.tsx` (line ~41–43):
   Currently `resolvedSkillNames` is `string[]` (mapped from `useSkillNamesMap`). To add color:
   ```typescript
   const { data: allSkills = [] } = useSkills();
   const resolvedSkills = (badge?.template?.skillIds || []).map((id) => {
     const found = allSkills.find((s) => s.id === id);
     return found
       ? { name: found.name, categoryColor: found.categoryColor }
       : { name: skillNamesMap[id] || 'Unknown Skill', categoryColor: null };
   });
   // Pass to BadgeInfo:
   <BadgeInfo skills={resolvedSkills} ... />
   ```

**7c. `VerifyBadgePage.tsx`** (lines ~310–317):

The verification API response will now include `categoryColor` per skill (from Task 1 backend change). Update rendering:

```tsx
import { getCategoryColorClasses } from '@/lib/categoryColors';

{badge.badge.skills.map((skill: { id: string; name: string; categoryColor?: string }) => {
  const color = getCategoryColorClasses(skill.categoryColor);
  return (
    <span key={skill.id}
      className={`px-3 py-1 rounded-full text-sm ${color.bg} ${color.text}`}>
      {skill.name}
    </span>
  );
})}
```

---

### Task 8: Route, navigation, and tests

**8a. Route setup** — `frontend/src/App.tsx`:

```tsx
const SkillManagementPage = lazy(() => import('@/pages/admin/SkillManagementPage'));

// Add route (ADMIN-only):
<Route path="/admin/skills"
  element={<ProtectedRoute requiredRoles={['ADMIN']}><Layout pageTitle="Skill Management"><SkillManagementPage /></Layout></ProtectedRoute>} />
```

**8b. Navigation** — `Navbar.tsx` and `MobileNav.tsx`:

Add "Skills" link (ADMIN-only) next to "Skill Categories":
```tsx
// Navbar.tsx:
<li><Link to="/admin/skills" ...>Skills</Link></li>

// MobileNav.tsx:
{ to: '/admin/skills', label: 'Skills', roles: ['ADMIN'] },
```

**8c. Tests to write:**

| Test file | What to test | Est. count |
|-----------|-------------|------------|
| `SkillManagementPage.test.tsx` | Page render, category filter, search, inline add, delete guard, empty state | ~10 |
| `useSkillMutations.test.tsx` | Create, update, delete mutations with mocked `apiFetchJson` | ~6 |
| `useSkills.test.tsx` *(new or update existing)* | Fix verification: `categoryName` mapped correctly, `categoryColor` present | ~3 |
| `categoryColors.test.ts` | `getCategoryColorClasses` returns correct classes, fallback works | ~3 |
| `BadgeInfo.test.tsx` *(update existing)* | Object-form skills with `categoryColor` render correct CSS classes | ~2 |
| `BadgeTemplateFormPage.test.tsx` *(update existing if exists)* | SkillsFilter rendered with `groupByCategory` | ~1 |

**Total new/updated tests: ~25**

**Test patterns to follow:**
- Import `{ render, screen, fireEvent, waitFor }` from `@testing-library/react`
- Import `{ describe, it, expect, vi }` from `vitest`
- Mock `apiFetch` / `apiFetchJson` with `vi.mock('@/lib/apiFetch')`
- Wrap components needing React Query in `<QueryClientProvider>`
- Wrap components needing Router in `<MemoryRouter>`

---

## Files Summary

### Created (Frontend)
| File | Purpose |
|------|---------|
| `src/lib/categoryColors.ts` | Color constant map + utility |
| `src/lib/categoryColors.test.ts` | Unit tests for color utility |
| `src/hooks/useSkillMutations.ts` | Create/Update/Delete mutation hooks |
| `src/hooks/useSkillMutations.test.tsx` | Mutation hook tests |
| `src/pages/admin/SkillManagementPage.tsx` | Main page — split layout |
| `src/pages/admin/SkillManagementPage.test.tsx` | Page integration tests |

### Modified (Frontend)
| File | Change |
|------|--------|
| `src/hooks/useSkills.ts` | **BUG FIX**: `category` → `categoryName`; add `categoryColor`, `categoryId`, `description`, `level` |
| `src/components/search/SkillsFilter.tsx` | Extend `Skill` interface with optional `categoryColor`, `categoryId`, `description`, `level` |
| `src/pages/admin/BadgeTemplateFormPage.tsx` | Replace flat pill list with `<SkillsFilter groupByCategory searchable>` |
| `src/components/BadgeDetailModal/BadgeInfo.tsx` | `skills` prop: `string[]` → `(string \| { name, categoryColor? })[]`; render with category colors |
| `src/components/BadgeDetailModal/BadgeInfo.test.tsx` | Add tests for object-form skills with colors |
| `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | Pass `{ name, categoryColor }` objects to `BadgeInfo` instead of plain strings |
| `src/pages/VerifyBadgePage.tsx` | Use `getCategoryColorClasses` for skill pill rendering |
| `src/App.tsx` | Add lazy import + route for `SkillManagementPage` |
| `src/components/Navbar.tsx` | Add "Skills" admin nav link |
| `src/components/layout/MobileNav.tsx` | Add "Skills" mobile nav link |

### Modified (Backend)
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `color String? @db.VarChar(20)` to `SkillCategory` |
| `prisma/migrations/YYYYMMDD_add_skill_category_color/` | Auto-generated migration |
| `src/skill-categories/dto/skill-category.dto.ts` | Add `color` to Create/Update/Response DTOs |
| `src/skill-categories/skill-categories.service.ts` | Auto-assign color on creation if not provided |
| `src/badge-verification/badge-verification.service.ts` | Include `category.color` in skill resolution query + response |

### NOT Modified
| File | Why |
|------|-----|
| `src/skills/skills.service.ts` | Already uses `include: { category: true }` which includes `color` after migration |
| `src/skills/skills.controller.ts` | No route changes needed — ADMIN/ISSUER roles already correct |

---

## Acceptance Criteria Cross-Reference

| AC | Task(s) | How verified |
|----|---------|-------------|
| 1. View all skills in searchable table | T4 | Search input + table renders |
| 2. Table columns: Name, Description, Category, Level, Badge Count, Actions | T4 | Visual check |
| 3. Filter by category (tree or dropdown) | T4 | Click category → table filters |
| 4. Search by name | T4 | Debounced search input |
| 5. Create skill | T5, T6 | Inline add row, toast on success |
| 6. Edit skill | T5, T6 | Edit dialog, toast on success |
| 7. Delete unref'd skill | T5, T6 | ConfirmDialog, toast on success |
| 8. Delete blocked with template list | T6 | Backend 400 → error toast |
| 9. Colored skill tags match category | T1, T2, T3, T4 | Chip uses `getCategoryColorClasses` |
| 10. Route `/admin/skills` | T8 | Nav link + route |
| 11. Template form groups skills by category | T3, T7a | `SkillsFilter groupByCategory` |
| 12. Badge detail + verify page show category colors | T7b, T7c | Color pills instead of hardcoded blue |

---

## Constraints & Gotchas

1. **No shadcn Table component** — Use raw HTML `<table>` like `BadgeManagementPage`. Do NOT install shadcn Table.
2. **Tailwind v4** — Class names are the same, but tailwind.config.js isn't used for JIT safelist. Static class references in `COLOR_MAP` are sufficient.
3. **`apiFetch` vs `apiFetchJson`** — `useSkills` currently uses raw `apiFetch`. New mutation hooks should use `apiFetchJson` which handles JSON parse + error extraction.
4. **BadgeInfo backward compat** — The `skills` prop type must accept BOTH `string[]` (existing callers) and `{ name, categoryColor? }[]` (new callers). Use union type.
5. **Backend delete guard** — `skills.service.ts` `remove()` already checks `BadgeTemplate.skillIds.has(id)` and returns 400. No backend change needed for delete guard.
6. **Query invalidation** — After skill CRUD, invalidate both `['skills']` and `['skill-categories']` (for tree counts).
7. **`badge.badge.skills`** — On `VerifyBadgePage`, skills come from the verification API (public, no auth), not from `useSkills` hook. The backend change in Task 1 adds `categoryColor` to that response.
8. **Pre-push hook** — `nest build` may fail with exit code 1. Use `git push --no-verify` for docs-only or if pre-push fails on unrelated issues.
9. **Role alignment** — Backend skill controller uses `ADMIN | ISSUER` for write ops. Story 12.2 doesn't change this (unlike 12.1 which restricted to ADMIN-only for categories). Skills can be managed by both roles.

---

## Definition of Done

- [ ] All 12 Acceptance Criteria met
- [ ] TypeScript: 0 errors (frontend + backend)
- [ ] ESLint: 0 errors (frontend + backend)
- [ ] All existing tests pass (551 FE baseline + 756 BE baseline)
- [ ] ~25 new tests written and passing
- [ ] Story file `12-2-skill-management-ui.md` updated with Status: done, Dev Notes, File List
- [ ] `sprint-status.yaml` updated: `12-2: done`
