# Code Review Prompt — Story 12.5.1: CategoryTree Enhancements (D-1, D-2, D-3)

## Review Mission

Perform an **adversarial Senior Developer code review** for Story 12.5.1. This story implements three deferred items from Sprint 12:
- **D-1**: Responsive tree→dropdown on `<1024px`
- **D-2**: Blue insertion line during DnD
- **D-3**: Cross-level "Move to..." action (backend + frontend)

**Story file:** `gcredit-project/docs/sprints/sprint-12.5/12.5.1-category-tree-enhancements.md`
**Branch:** `sprint-12.5/deferred-cleanup` (2 commits ahead of `main`)
**Commits:**
- `408b4c2` — `feat(12.5.1): CategoryTree enhancements D-1, D-2, D-3`
- `e8490aa` — `chore(12.5.1): mark story status review`

---

## Scope: 12 Source Files Changed (+1522 / -38 lines)

| File | Action | Lines | Purpose |
|------|--------|-------|---------|
| `backend/src/skill-categories/dto/skill-category.dto.ts` | MODIFY | +9 | Add `parentId` to `UpdateSkillCategoryDto` |
| `backend/src/skill-categories/skill-categories.service.ts` | MODIFY | +178/-13 | Reparent logic in `update()`, helper methods |
| `backend/src/skill-categories/skill-categories.service.spec.ts` | MODIFY | +249/-2 | 8 new reparent test cases |
| `frontend/src/components/admin/CategoryTree.tsx` | MODIFY | +207/-25 | D-1 responsive, D-2 insertion line, D-3 move button |
| `frontend/src/components/admin/CategoryDropdown.tsx` | NEW | +176 | D-1 responsive dropdown component |
| `frontend/src/components/admin/CategoryDropdown.test.tsx` | NEW | +188 | D-1 dropdown tests (12 tests) |
| `frontend/src/components/admin/MoveToDialog.tsx` | NEW | +219 | D-3 move dialog with constraint validation |
| `frontend/src/components/admin/MoveToDialog.test.tsx` | NEW | +244 | D-3 dialog tests (9 tests) |
| `frontend/src/components/admin/CategoryTree.test.tsx` | MODIFY | +80 | D-1 + D-2 tests added (7 tests) |
| `frontend/src/hooks/useSkillCategories.ts` | MODIFY | +1 | Add `parentId` to `UpdateSkillCategoryInput` |
| `frontend/src/pages/admin/SkillCategoryManagementPage.test.tsx` | MODIFY | +5 | Mock `useIsDesktop` for existing tests |
| `docs/sprints/sprint-status.yaml` | MODIFY | +4/-4 | Story status → review |

---

## Coding Standards to Enforce

| # | Rule | Check |
|---|------|-------|
| 1 | All code in English — no Chinese in source | Grep for `[\u4e00-\u9fff]` |
| 2 | Backend: `@Controller('api/...')` prefix | N/A (no controller changes) |
| 3 | Frontend: `API_BASE_URL` from `@/lib/apiConfig.ts` | Check API calls |
| 4 | Backend: `Logger` — no `console.log` | Check new service code |
| 5 | Frontend: `toast` from `sonner` | Check MoveToDialog error handling |
| 6 | DTOs: class-validator + Swagger decorators | Check `parentId` field |
| 7 | Backend test: `.spec.ts`, Frontend: `.test.tsx` | Verify naming |
| 8 | `TODO` format: `// TODO(TD-XXX)` | Check no orphan TODOs |

---

## Acceptance Criteria Checklist (17 items)

Verify each AC is **actually implemented** in code — not just marked `[x]` in the story.

### D-1: Responsive (AC 1–5)
- [ ] AC1: `<1024px` renders dropdown instead of tree
- [ ] AC2: Dropdown shows hierarchy (indent + `└` prefix)
- [ ] AC3: CRUD actions accessible via toolbar in dropdown mode
- [ ] AC4: DnD reorder disabled on small screens
- [ ] AC5: Uses `useIsDesktop()` from existing `useMediaQuery` hook

### D-2: Insertion Line (AC 6–9)
- [ ] AC6: Blue horizontal line (2px, `bg-blue-500`) during drag
- [ ] AC7: Line accurately indicates insertion point
- [ ] AC8: Opacity reduced (not removed) as secondary feedback
- [ ] AC9: Line only between valid same-level siblings

### D-3: Move To (AC 10–17)
- [ ] AC10: "Move to..." button on each tree node (editable mode)
- [ ] AC11: Dialog opens with target list
- [ ] AC12: "Root (Level 1)" option at top
- [ ] AC13: Self + descendants disabled (cycle prevention)
- [ ] AC14: Level recalculation for moved category + descendants
- [ ] AC15: Depth validation (max 3) prevents invalid moves
- [ ] AC16: `isSystemDefined` cannot be moved (disabled + tooltip)
- [ ] AC17: Backend validates all constraints

---

## Full Diffs for Review

### 1. Backend DTO — `skill-category.dto.ts` (+9)

```diff
@@ -104,6 +104,15 @@ export class UpdateSkillCategoryDto {
   @Min(0)
   displayOrder?: number;

+  @ApiPropertyOptional({
+    example: 'da721a77-18c0-40e7-a7aa-269efe8e26bb',
+    description:
+      'Move category to a new parent. Set to a valid UUID to reparent, or null to move to root (Level 1).',
+  })
+  @IsOptional()
+  @IsUUID()
+  parentId?: string | null;
+
   @ApiPropertyOptional({
     example: 'blue',
```

**Review focus:** Does `@IsUUID()` properly validate `null` values? Is `string | null` the right TS type for class-validator?

### 2. Backend Service — `skill-categories.service.ts` (+178/-13)

Key changes:
- `update()` method now detects reparent operations when `parentId` differs from current
- New helper: `getDescendantIds()` — walks loaded children tree for cycle detection
- New helper: `getMaxSubtreeDepth()` — calculates max depth below a node
- New helper: `buildLevelUpdates()` — generates batch level recalculation
- Transaction wraps reparent: main category update + descendant level updates

```diff
   async update(id: string, updateDto: UpdateSkillCategoryDto) {
-    const category = await this.prisma.skillCategory.findUnique({ where: { id } });
+    const category = await this.prisma.skillCategory.findUnique({
+      where: { id },
+      include: { children: { include: { children: true } } },
+    });
     // ... validation chain: exists → isSystemDefined → self-ref → cycle → depth → execute
```

**Review focus:**
- `include: { children: { include: { children: true } } }` only loads 2 levels deep — is this sufficient for all cases? What if a category has 3+ levels of nesting?
- `getDescendantIds()` only walks the loaded tree — if the tree isn't fully loaded, could cycle detection miss a case?
- Transaction correctness: are the level updates properly ordered?
- `siblingsCount` used for `displayOrder` — does this account for the category being its own sibling if moving within the same parent?
- `ForbiddenException` for `isSystemDefined` — is this consistent with how other parts of the app handle system categories?

### 3. Backend Tests — `skill-categories.service.spec.ts` (+249)

8 new test cases in `describe('reparent')`:
1. Move L2→L1 (to root) ✓
2. Move L1→L2 under parent ✓
3. Move to self → 400 ✓
4. Move to descendant (cycle) → 400 ✓
5. Depth exceeds 3 → 400 ✓
6. isSystemDefined → 403 ✓
7. Non-existent parent → 404 ✓
8. Descendant level recalculation ✓

**Review focus:**
- `$transaction` mock: `jest.fn((cb) => cb(prisma))` — is this a realistic mock of Prisma transactions?
- Are edge cases covered: moving category to its current parent (no-op)?
- Are error messages tested (not just exception types)?

### 4. Frontend — `CategoryTree.tsx` (+207/-25)

Major changes:
- Imports: `useMemo`, `FolderInput`, `DragOverlay`, `DragStartEvent`, `DragOverEvent`, `useIsDesktop`, `CategoryDropdown`, `MoveToDialog`
- New state: `activeDragId`, `overTargetId`, `movingCategory`
- New memo: `activeDragCategory` (finds category by active drag ID)
- D-1: Early return with `<CategoryDropdown>` when `!isDesktop`
- D-2: `DragOverlay` with floating card, insertion line in `SortableTreeNode`
- D-3: `MoveToDialog` rendered when `movingCategory` set, "Move to..." button in node actions
- Opacity changed from `0.5` to `0.3`
- Nested child DnD contexts also get `DragOverlay` + insertion line
- New props: `activeDragId`, `overTargetId`, `onMoveTo`

**Review focus:**
- **Performance:** `activeDragCategory` uses `useMemo` with `find()` — is this O(n) fine or could it be expensive with many categories?
- **DragOverlay duplication:** Both top-level and child DnD contexts render their own `<DragOverlay>` — is this correct for @dnd-kit or should there be only one?
- **Insertion line accuracy:** `showInsertionLine` fires when `overTargetId === category.id` — this shows the line *above* the target, not *between* items. Is this the right UX?
- **Props drilling:** `activeDragId`, `overTargetId`, `onMoveTo` are passed down through multiple levels — would context be cleaner?
- **MoveToDialog placement:** Rendered inside the `editable && onReorder` branch only — what about editable mode without onReorder?

### 5. Frontend — `CategoryDropdown.tsx` (NEW, 176 lines)

New component for D-1 responsive:
- `flattenCategories()` walks tree → flat list
- Shadcn `<Select>` with indented labels (paddingLeft + `└`)
- Toolbar: Edit/AddChild/Delete buttons on selected item
- Empty state with Create CTA
- Delete disabled for categories with children or skills

**Review focus:**
- No `onMoveTo` support — move action not available in dropdown mode. Is this acceptable?
- `handleValueChange` ignores `__all__` — what happens if user selects "All Categories"?
- Level 3 categories cannot add children (check: `selectedItem.original.level < 3`)

### 6. Frontend — `MoveToDialog.tsx` (NEW, 219 lines)

New dialog for D-3 cross-level move:
- `getDescendantIds()` — mirrors backend logic
- `getMaxSubtreeDepth()` — recursive depth calculation
- `buildTargetList()` — generates flat target list with disable reasons
- Uses `useUpdateSkillCategory` mutation
- Listbox UI with option buttons

**Review focus:**
- **Duplicate depth logic:** Both frontend `getMaxSubtreeDepth()` and backend have the same logic — is this DRY concern valid or acceptable for client-side validation?
- **Race condition:** Dialog calls `mutateAsync()` then `onOpenChange(false)` — what if mutation succeeds but invalidation hasn't finished? Does the tree flicker?
- **Error display:** No visible error handling if `mutateAsync()` rejects — does `useUpdateSkillCategory`'s `onError` toast handle this?
- **Root disabled logic:** `movingCategory.parentId === null` checks if already at root, but also checks `1 + subtreeDepth > 3` — this second check would only fail for a root node with depth 2 subtree moving to... itself? Is this logic correct?

### 7. Frontend — `useSkillCategories.ts` (+1)

```diff
   displayOrder?: number;
+  parentId?: string | null;
 }
```

**Review focus:** `parentId?: string | null` — optional AND nullable. Is this correct? Does `mutateAsync` properly serialize `null` to JSON?

### 8. Test Files

**CategoryDropdown.test.tsx** (12 tests):
- Render, combobox role, empty state, CTA, toolbar visibility, CRUD callbacks, delete constraints, create button

**MoveToDialog.test.tsx** (9 tests):
- Render, current parent disabled, self disabled, descendants disabled, depth constraint, valid targets, Move button state, confirm mutation, root target

**CategoryTree.test.tsx** (+7 tests):
- D-2: no insertion line in normal state, opacity not 0.3 normally, DragOverlay in editable mode
- D-1: renders tree on desktop, dropdown on mobile, empty state on mobile

**SkillCategoryManagementPage.test.tsx** (+5 lines):
- Mock `useIsDesktop` to return true for existing tests

**Review focus:**
- Are DnD interaction tests missing? (actual drag events, not just DOM state)
- CategoryDropdown: no test for `onSelect` callback firing
- MoveToDialog: no test for error state (mutation rejection)

---

## Architecture & Project Context

### Prisma Schema — SkillCategory
```prisma
model SkillCategory {
  id              String           @id @default(uuid())
  name            String           @db.VarChar(100)
  parentId        String?
  parent          SkillCategory?   @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children        SkillCategory[]  @relation("CategoryHierarchy")
  level           Int              @default(1)       // max 3
  isSystemDefined Boolean          @default(false)
  isEditable      Boolean          @default(true)
  displayOrder    Int              @default(0)
  color           String?          @db.VarChar(20)
  skills          Skill[]
  @@index([parentId])
  @@map("skill_categories")
}
```

### DnD Stack
- `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2`

### Test Baseline
- Backend: 847 tests (28 skipped = TD-006) → should be ≥855 now
- Frontend: 702 tests (66 files) → should be ≥730 now

---

## Review Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | All 17 ACs actually implemented (not just marked [x]) | |
| 2 | All 14 tasks actually completed | |
| 3 | No Chinese characters in source code | |
| 4 | No `console.log` in backend code | |
| 5 | DTOs have class-validator + Swagger decorators | |
| 6 | Backend tests cover all 7 reparent error paths | |
| 7 | Frontend tests cover responsive, DnD, and move dialog | |
| 8 | No security vulnerabilities (injection, auth bypass) | |
| 9 | Transaction correctness in reparent logic | |
| 10 | `@IsUUID()` + `null` compatibility | |
| 11 | Error handling: user-facing errors use proper patterns | |
| 12 | No orphan TODOs | |
| 13 | File List in story matches actual git changes | |
| 14 | Test count meets DoD targets (BE ≥855, FE ≥730) | |

---

## Known Review Hints (Areas to Probe)

1. **2-level include depth:** Service loads `children: { include: { children: true } }` — only 2 levels deep. With max 3 levels, if moving a L1 with L2→L3 subtree, the L3 nodes ARE loaded. But what about the general pattern — is this fragile if max depth increases?

2. **`@IsUUID()` with `null`:** class-validator's `@IsUUID()` may reject `null`. The `@IsOptional()` decorator skips validation if the value is `undefined`, but `null` is NOT `undefined`. This could mean `parentId: null` (move to root) fails validation. **This is a potential critical bug.**

3. **DragOverlay per DndContext:** Each nested `DndContext` (for child groups) creates its own `DragOverlay`. In @dnd-kit, `DragOverlay` should be a sibling of `SortableContext` within the same `DndContext`. Multiple overlays might conflict or cause visual glitches.

4. **Insert line shows above target, not between:** The insertion line renders BEFORE the target node. This means dragging between items A and B shows the line above B, not between A and B. This might be visually correct (drop position indicator) or confusing.

5. **Move not available in dropdown mode:** `CategoryDropdown` has no `onMoveTo` prop — "Move to..." is desktop-only. AC10 says "each tree node in editable mode" — does this cover mobile?
