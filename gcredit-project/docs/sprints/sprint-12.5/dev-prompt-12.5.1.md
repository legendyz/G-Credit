# Dev Prompt — Story 12.5.1: CategoryTree Enhancements (D-1, D-2, D-3)

## Mission

Implement three enhancements to the CategoryTree component:
1. **D-1**: Responsive tree→dropdown on screens `<1024px`
2. **D-2**: Blue insertion line during drag-and-drop
3. **D-3**: Cross-level "Move to..." action (backend + frontend)

**Story file:** `gcredit-project/docs/sprints/sprint-12.5/12.5.1-category-tree-enhancements.md`
**Branch:** `sprint-12.5/deferred-cleanup`
**Sprint status:** `gcredit-project/docs/sprints/sprint-status.yaml` — key `12.5-1-category-tree-enhancements`

---

## Coding Standards (MUST Follow)

| # | Rule |
|---|------|
| 1 | All code in English — variables, comments, logs, tests. No Chinese in source. |
| 2 | Backend: `@Controller('api/...')` prefix. No `setGlobalPrefix`. |
| 3 | Frontend: `API_BASE_URL` from `@/lib/apiConfig.ts`. Never hardcode `/api/...`. |
| 4 | Backend: `private readonly logger = new Logger(ClassName.name)`. No `console.log`. |
| 5 | Frontend: `toast.success()` / `toast.error()` from `sonner`. |
| 6 | DTOs: class-validator decorators + Swagger `@ApiProperty` / `@ApiPropertyOptional`. |
| 7 | Backend test: `.spec.ts`. Frontend test: `.test.tsx`. |
| 8 | TODO format: `// TODO(TD-XXX): description`. |

---

## Task Execution Order

Execute tasks in this exact order (from the story file). Mark each `[ ]` → `[x]` in the story file after completion + tests passing.

### Phase 1: D-2 — Blue Insertion Line (Frontend, ~1h)

Start with D-2 because it's self-contained and modifies `CategoryTree.tsx` which D-1 and D-3 also touch.

**Task 5:** Implement `DragOverlay` from `@dnd-kit/core` for visual clone during drag
**Task 6:** Track active drop position and render insertion indicator line
- Use `onDragOver` event to detect current insertion index
- Render `<div className="h-0.5 bg-blue-500 rounded-full mx-2" />` at insertion point  
**Task 7:** Remove or reduce opacity overlay (keep subtle opacity as secondary cue)
**Task 8:** Tests — insertion line appears during drag, correct position

### Phase 2: D-1 — Responsive Tree→Dropdown (Frontend, ~2h)

**Task 1:** Use existing `useIsDesktop()` from `@/hooks/useMediaQuery` for `<1024px` breakpoint
**Task 2:** Create `<CategoryDropdown>` component (`frontend/src/components/admin/CategoryDropdown.tsx`)
- Render as Shadcn `<Select>` with indented option labels
- Wire same `onSelect` callback
- Show toolbar buttons for CRUD on selected item
**Task 3:** In `<CategoryTree>`, conditionally render `<CategoryDropdown>` when not desktop
**Task 4:** Tests for responsive behavior

### Phase 3: D-3 — Cross-Level Move (Backend + Frontend, ~3h)

**Task 9:** Backend — Add `parentId` to `UpdateSkillCategoryDto`
**Task 10:** Backend — Add reparent logic in `skill-categories.service.ts`
**Task 11:** Backend — Tests for reparent logic (7 test cases)
**Task 12:** Frontend — Create `<MoveToDialog>` component
**Task 13:** Frontend — Add "Move to..." button in `CategoryTreeNodeInner`
**Task 14:** Frontend — Tests for MoveToDialog

---

## Source Code Context

### 1. CategoryTree.tsx (Current — 488 lines)

**Location:** `frontend/src/components/admin/CategoryTree.tsx`

```tsx
import { useState, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, GripVertical, Pencil, Trash2, Plus, ShieldCheck,
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
  type DraggableAttributes, type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { getCategoryColorClasses } from '@/lib/categoryColors';
import type { SkillCategory } from '@/hooks/useSkillCategories';

interface CategoryTreeProps {
  categories: SkillCategory[];
  editable?: boolean;
  onEdit?: (category: SkillCategory) => void;
  onDelete?: (category: SkillCategory) => void;
  onAddChild?: (parent: SkillCategory) => void;
  onReorder?: (updates: Array<{ id: string; displayOrder: number }>) => void;
  selectedId?: string;
  onSelect?: (category: SkillCategory) => void;
  onCreateRoot?: () => void;
}
```

**Key architecture:**
- `CategoryTree` — root component, manages expansion state + DnD sensors
- `SortableTreeNode` — DnD wrapper using `useSortable`, applies `transform`/`transition`/`opacity`
- `CategoryTreeNodeInner` — renders node UI: drag handle, expand toggle, color pill, skill count, system badge, action buttons
- `CategoryTreeNode` — non-sortable wrapper for read-only mode
- DnD: Each level has its own `<DndContext>` + `<SortableContext>` for sibling-only reorder
- Children rendered recursively with `level + 1` and `marginLeft: level * 1.5rem`

**Current DnD feedback:** Only `opacity: isDragging ? 0.5 : undefined` — no insertion line.

### 2. CategoryTree.test.tsx (17 existing tests)

**Location:** `frontend/src/components/admin/CategoryTree.test.tsx`

Test fixtures:
```tsx
const mockCategories: SkillCategory[] = [
  {
    id: 'cat-1', name: 'Technical Skills', level: 1,
    isSystemDefined: true, isEditable: true, displayOrder: 0,
    children: [
      { id: 'cat-1-1', name: 'Frontend', level: 2, parentId: 'cat-1', isSystemDefined: true, isEditable: true, displayOrder: 0, children: [], skills: [{ id: 's1', name: 'React' }, { id: 's2', name: 'Vue' }] },
      { id: 'cat-1-2', name: 'Backend', level: 2, parentId: 'cat-1', isSystemDefined: false, isEditable: true, displayOrder: 1, children: [], skills: [] },
    ],
    skills: [],
  },
  {
    id: 'cat-2', name: 'Soft Skills', level: 1,
    isSystemDefined: false, isEditable: true, displayOrder: 1,
    children: [], skills: [{ id: 's3', name: 'Leadership' }],
  },
];
```

### 3. useMediaQuery Hook (Already Exists)

**Location:** `frontend/src/hooks/useMediaQuery.ts`

Available hooks:
- `useMediaQuery(query: string): boolean` — raw CSS media query
- `useIsMobile()` — `<768px`
- `useIsTablet()` — `768px–1023px`
- **`useIsDesktop()`** — `≥1024px` ← Use this for D-1
- `useBreakpoint()` — returns `'xs'|'sm'|'md'|'lg'|'xl'|'2xl'`

### 4. Existing Responsive Pattern in SkillManagementPage

**Location:** `frontend/src/pages/admin/SkillManagementPage.tsx` (lines 262–310)

Already uses `hidden lg:block` / `lg:hidden` for tree↔dropdown toggle pattern:

```tsx
{/* Desktop: sidebar tree */}
<aside className="hidden lg:block w-80 shrink-0">
  <CategoryTree categories={categoryTree} editable={false} selectedId={selectedCategoryId} onSelect={handleCategorySelect} />
</aside>

{/* Mobile: dropdown fallback */}
<div className="lg:hidden">
  <Select value={selectedCategoryId || '__all__'} onValueChange={handleMobileCategoryChange}>
    <SelectContent>
      <SelectItem value="__all__">All Categories</SelectItem>
      {flatCategories.map((cat) => (
        <SelectItem key={cat.id} value={cat.id}>
          <span style={{ paddingLeft: `${(cat.level - 1) * 16}px` }}>
            {cat.level > 1 && <span className="text-muted-foreground mr-1">└</span>}
            {cat.name}
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### 5. Backend DTO — skill-category.dto.ts

**Location:** `backend/src/skill-categories/dto/skill-category.dto.ts`

```typescript
export class UpdateSkillCategoryDto {
  @IsOptional() @IsString() @SanitizeHtml() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @SanitizeHtml() @MaxLength(100) nameEn?: string;
  @IsOptional() @IsString() @SanitizeHtml() description?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
  // ⚠️ NO parentId field — D-3 requires adding it
}
```

**Note:** `CreateSkillCategoryDto` already has `@IsOptional() @IsUUID() parentId?: string;` — reuse the same pattern.

### 6. Backend Service — skill-categories.service.ts

**Location:** `backend/src/skill-categories/skill-categories.service.ts`

```typescript
@Injectable()
export class SkillCategoriesService {
  private readonly logger = new Logger(SkillCategoriesService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(includeSkills: boolean = false) { /* tree query, level:1 root */ }
  async findOne(id: string) { /* single with parent+children+skills */ }
  async create(createDto: CreateSkillCategoryDto) {
    // Already handles parentId, level calculation, color inheritance, depth check
  }
  async update(id: string, updateDto: UpdateSkillCategoryDto) {
    // ⚠️ SIMPLE: just updates fields, NO reparent logic
    const category = await this.prisma.skillCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(...);
    return this.prisma.skillCategory.update({ where: { id }, data: updateDto, include: { parent: true, children: true } });
  }
  async remove(id: string) { /* checks children/skills before delete */ }
  async findAllFlat() { /* ordered by level, displayOrder */ }
}
```

**D-3 requires modifying `update()` to:**
1. Accept `parentId` in `UpdateSkillCategoryDto`
2. Detect if `parentId` differs from current
3. Validate: not self, not descendant, depth ≤ 3, not `isSystemDefined`
4. Recalculate `level` recursively for moved subtree
5. Set `displayOrder` to append at end of new parent's children

### 7. Backend Controller — skill-categories.controller.ts

**Location:** `backend/src/skill-categories/skill-categories.controller.ts`

5 endpoints, all under `@Controller('api/skill-categories')`:
- `GET /` — tree
- `GET /flat` — flat list
- `GET /:id` — single
- `POST /` — create (Admin)
- `PATCH /:id` — update (Admin) ← D-3 extends this
- `DELETE /:id` — delete (Admin)

**No controller changes needed for D-3** — the existing `PATCH /:id` already passes `UpdateSkillCategoryDto` to service.

### 8. Frontend Hook — useSkillCategories.ts

**Location:** `frontend/src/hooks/useSkillCategories.ts`

```typescript
export interface SkillCategory {
  id: string; name: string; color?: string | null; nameEn?: string;
  description?: string; parentId?: string; level: number;
  isSystemDefined: boolean; isEditable: boolean; displayOrder: number;
  children?: SkillCategory[]; skills?: { id: string; name: string }[];
  _count?: { skills: number };
}

export interface UpdateSkillCategoryInput {
  name?: string; nameEn?: string; description?: string; displayOrder?: number;
  // ⚠️ NO parentId — D-3 requires adding it
}

export function useUpdateSkillCategory() {
  // PATCH /skill-categories/:id with UpdateSkillCategoryInput
}
```

**D-3 requires adding `parentId?: string | null` to `UpdateSkillCategoryInput`.**

### 9. Prisma Schema — SkillCategory Model

```prisma
model SkillCategory {
  id              String           @id @default(uuid())
  name            String           @db.VarChar(100)
  nameEn          String?          @db.VarChar(100)
  description     String?          @db.Text
  parentId        String?
  parent          SkillCategory?   @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children        SkillCategory[]  @relation("CategoryHierarchy")
  level           Int              @default(1)
  isSystemDefined Boolean          @default(false)
  isEditable      Boolean          @default(true)
  displayOrder    Int              @default(0)
  color           String?          @db.VarChar(20)
  skills          Skill[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  @@index([parentId])
  @@index([isSystemDefined])
  @@index([level])
  @@map("skill_categories")
}
```

**Key:** `parentId` already exists in schema. No migration needed for D-3. Only the DTO + service logic need changes.

---

## D-3 Reparent Algorithm (Backend)

```
// In update() method, when parentId is provided and differs from current:

1. Load category with all descendants (recursive)
2. Validate:
   a. parentId !== id (self-reference → 400)
   b. parentId not in descendant IDs (cycle → 400)
   c. category.isSystemDefined === false (→ 403)
   d. If parentId !== null, new parent exists (→ 404)
3. Calculate depth:
   maxAllowedDepth = 3
   currentSubtreeDepth = maxDescendantLevel - category.level
   newLevel = (newParent ? newParent.level + 1 : 1)
   if (newLevel + currentSubtreeDepth > maxAllowedDepth) → 400
4. Execute in transaction:
   a. Update category: parentId, level = newLevel, displayOrder = max of new siblings + 1
   b. Recursively update all descendants: level += (newLevel - oldLevel)
```

Helper to get all descendant IDs:
```typescript
private async getDescendantIds(categoryId: string): Promise<string[]> {
  const children = await this.prisma.skillCategory.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });
  const ids: string[] = [];
  for (const child of children) {
    ids.push(child.id);
    ids.push(...await this.getDescendantIds(child.id));
  }
  return ids;
}
```

---

## D-3 Backend Test Cases (Task 11)

| # | Test | Input | Expected |
|---|------|-------|----------|
| 1 | Move L2→L1 | Category at L2, `parentId: null` | Success, level becomes 1 |
| 2 | Move L1→L2 under parent | Category at L1, `parentId: <existing L1>` | Success, level becomes 2 |
| 3 | Move to self | `parentId: <own id>` | 400 Bad Request |
| 4 | Move to descendant | `parentId: <child's id>` | 400 Bad Request (cycle) |
| 5 | Depth >3 | L2 with L3 children → under another L2 | 400 Bad Request |
| 6 | System-defined | `isSystemDefined: true` + `parentId` change | 403 Forbidden |
| 7 | Non-existent parent | `parentId: <random UUID>` | 404 Not Found |

---

## DnD Packages Reference

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

**Key imports for D-2:**
- `DragOverlay` from `@dnd-kit/core` — renders floating preview
- `DragStartEvent`, `DragOverEvent` from `@dnd-kit/core` — track active/over states
- Use `onDragStart`, `onDragOver`, `onDragEnd` event handlers on `<DndContext>`

---

## Files to Create / Modify Summary

| File | Action | Task |
|------|--------|------|
| `frontend/src/components/admin/CategoryTree.tsx` | MODIFY | D-1 (responsive toggle), D-2 (insertion line + DragOverlay), D-3 (Move button) |
| `frontend/src/components/admin/CategoryDropdown.tsx` | CREATE | D-1 (responsive dropdown) |
| `frontend/src/components/admin/MoveToDialog.tsx` | CREATE | D-3 (move target selector) |
| `frontend/src/components/admin/CategoryTree.test.tsx` | MODIFY | D-1, D-2, D-3 tests |
| `frontend/src/components/admin/CategoryDropdown.test.tsx` | CREATE | D-1 tests |
| `frontend/src/components/admin/MoveToDialog.test.tsx` | CREATE | D-3 tests |
| `frontend/src/hooks/useSkillCategories.ts` | MODIFY | D-3 (add `parentId` to `UpdateSkillCategoryInput`) |
| `backend/src/skill-categories/dto/skill-category.dto.ts` | MODIFY | D-3 (add `parentId` to `UpdateSkillCategoryDto`) |
| `backend/src/skill-categories/skill-categories.service.ts` | MODIFY | D-3 (reparent logic in `update()`) |
| `backend/src/skill-categories/skill-categories.service.spec.ts` | MODIFY | D-3 (7 reparent test cases) |

---

## Test Baseline

- Backend: 847 tests (28 skipped = TD-006)
- Frontend: 702 tests (66 files)
- **All must pass after implementation. Zero regressions.**

---

## Definition of Done

1. All 17 AC checkboxes in story file marked `[x]`
2. All 14 task checkboxes in story file marked `[x]`
3. Backend tests: ≥854 (847 + 7 new reparent tests)
4. Frontend tests: ≥712 (702 + ~10 new tests)
5. Zero test regressions
6. ESLint clean (both BE + FE)
7. No Chinese characters in source code
8. Story status updated to `review` in story file + sprint-status.yaml
