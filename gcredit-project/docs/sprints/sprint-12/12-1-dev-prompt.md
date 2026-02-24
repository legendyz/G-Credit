# Dev Prompt — Story 12.1: Skill Category Management UI

## Agent Activation

You are the Dev Agent (Amelia). Load `_bmad/bmm/agents/dev.md` persona.

**Story File:** `gcredit-project/docs/sprints/sprint-12/12-1-skill-category-management-ui.md`
**Branch:** `sprint-12/management-uis-evidence`
**communication_language:** English (code comments and commits in English)

---

## Critical Context

### What This Story Does

Build the first Admin Management UI — a Skill Category tree management page at `/admin/skills/categories`. Admins can CRUD all 3 levels (L1/L2/L3) of skill categories, reorder them via drag-and-drop, and view skill counts per node. This also establishes 3 shared components (`AdminPageShell`, `ConfirmDialog`, `CategoryTree`) reused by Stories 12.2–12.4.

### Current Codebase State

- **Backend:** NestJS 11.x, Prisma 6.19.2, PostgreSQL 16, Port 3000
- **Frontend:** React 19.2 + Vite 7.3 + Tailwind CSS 4.1 + Shadcn/ui (New York), Port 5173
- **Tests:** BE ~756 + FE ~551 = ~1,307 total (all passing)
- **TypeScript:** 0 errors (`npx tsc --noEmit`)
- **ESLint:** Clean (FE and BE)
- **Auth:** httpOnly cookies via `apiFetch` wrapper (`credentials: 'include'`); RBAC roles: ADMIN, ISSUER, MANAGER, EMPLOYEE

### Key Architecture Patterns

1. **API calls:** Frontend uses `apiFetch()` / `apiFetchJson<T>()` from `frontend/src/lib/apiFetch.ts` — never raw `fetch` or `axios`. Always `credentials: 'include'`.
2. **React Query:** `@tanstack/react-query` v5 for server state. Pattern: `useQuery({ queryKey, queryFn, staleTime })`.
3. **Routing:** Lazy-loaded pages via `const MyPage = lazy(() => import('@/pages/MyPage'))`, wrapped in `<ProtectedRoute requiredRoles={['ADMIN']}>`.
4. **Page layout:** `PageTemplate` component provides title/description/actions/children. **No loading/error/empty state** — each page handles that manually.
5. **UI library:** Shadcn/ui components at `@/components/ui/*` — `Button`, `Card`, `Dialog`, `Select`, `Input`, etc.
6. **Icons:** `lucide-react` — import individual icons.
7. **Toast:** `import { toast } from 'sonner'` — `toast.success()`, `toast.error()`.
8. **State:** Zustand for auth only (`useAuthStore`). Admin pages use React Query + local `useState`.
9. **Testing:** Vitest + `@testing-library/react` + jsdom. `vi.mock()` for mocking.
10. **Default export:** All page components use `export default function PageName()` for lazy loading compatibility.

---

## Existing Code References

### PageTemplate (wrap, don't replace)
```tsx
// frontend/src/components/layout/PageTemplate.tsx (37 lines)
interface PageTemplateProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}
export function PageTemplate({ title, description, actions, children, className = '' }: PageTemplateProps) {
  return (
    <div className={`px-4 py-6 md:px-8 md:py-8 space-y-6 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-neutral-900">{title}</h1>
          {description && <p className="mt-1 text-body text-neutral-600">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
```

### Admin Page Pattern (AdminUserManagementPage — follow this style)
```tsx
// frontend/src/pages/AdminUserManagementPage.tsx (333 lines)
import { useState, useCallback, useMemo } from 'react';
import { Search, Users, Filter, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { PageTemplate } from '@/components/layout/PageTemplate';

export function AdminUserManagementPage() {
  const { data, isLoading, isError, error } = useAdminUsers(queryParams);
  // Manual loading/error/empty handling:
  if (isLoading) return <PageTemplate title="..."><Loader2 className="animate-spin" /></PageTemplate>;
  if (isError) return <PageTemplate title="..."><AlertCircle /> Error: {error.message}</PageTemplate>;
  if (!data?.length) return <PageTemplate title="...">No users found</PageTemplate>;
  return <PageTemplate title="User Management" actions={...}>{/* content */}</PageTemplate>;
}
export default AdminUserManagementPage;
```

### React Query Hook Pattern (useSkills.ts — follow this style)
```tsx
// frontend/src/hooks/useSkills.ts
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';

export function useSkills(options: UseSkillsOptions = {}) {
  return useQuery({
    queryKey: ['skills', { categoryId, search }],
    queryFn: async (): Promise<Skill[]> => {
      const response = await apiFetch(fullUrl);
      if (!response.ok) throw new Error('Failed to fetch skills');
      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
```

### Route Registration Pattern (App.tsx)
```tsx
// frontend/src/App.tsx
const AdminUserManagementPage = lazy(() => import('@/pages/AdminUserManagementPage'));
// ...in <Routes>:
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requiredRoles={['ADMIN']}>
      <Layout pageTitle="User Management">
        <AdminUserManagementPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### Navigation Links (add to both)
```tsx
// frontend/src/components/Navbar.tsx (desktop) — hardcoded <Link> elements
{user?.role === 'ADMIN' && (
  <li><Link to="/admin/users">Users</Link></li>
)}

// frontend/src/components/layout/MobileNav.tsx (mobile) — data-driven array
const navLinks = [
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
];
```

### Toast Pattern
```tsx
import { toast } from 'sonner';
toast.success('Category created successfully');
toast.error(error.message || 'Failed to create category');
```

### Dialog Pattern (shadcn)
```tsx
import {
  Dialog, DialogContent, DialogTitle, DialogHeader,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
```

---

## Backend: Current State & Required Changes

### Prisma Schema (READ-ONLY — do not modify)
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
  skills          Skill[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}
```

### Existing API Endpoints (controller is ready — no new routes needed)
| Method | Path | Auth | Roles | Notes |
|--------|------|------|-------|-------|
| `GET` | `/api/skill-categories` | Public | — | Returns nested tree (`?includeSkills=true` for counts) |
| `GET` | `/api/skill-categories/flat` | Public | — | Flat list for dropdowns |
| `GET` | `/api/skill-categories/:id` | Public | — | Single category with parent+children+skills |
| `POST` | `/api/skill-categories` | JWT+Roles | ADMIN, ISSUER | Create — **parentId currently required** |
| `PATCH` | `/api/skill-categories/:id` | JWT+Roles | ADMIN, ISSUER | Update name/description/displayOrder |
| `DELETE` | `/api/skill-categories/:id` | JWT+Roles | ADMIN | Delete (blocked if has children/skills, 403 if system-defined) |

### Seed Data (25 categories already exist)
5 L1 categories (system-defined): `技术技能`, `软技能`, `业务能力`, `管理与领导力`, `其他`
20 L2 categories under them (system-defined): `前端开发`, `后端开发`, `数据库`, `DevOps`, etc.

---

## Task Execution Order (MUST follow in sequence)

### Task 0: Create `<AdminPageShell>` shared component (CROSS-CUTTING) ~1h

**Create file:** `frontend/src/components/admin/AdminPageShell.tsx`

**What to do:**
1. Create a wrapper that composes `PageTemplate` + adds 3-state management (loading, error, empty):
   ```tsx
   import { type ReactNode } from 'react';
   import { Loader2, AlertCircle, FolderOpen } from 'lucide-react';
   import { PageTemplate } from '@/components/layout/PageTemplate';
   import { Button } from '@/components/ui/button';

   interface AdminPageShellProps {
     title: string;
     description?: string;
     actions?: ReactNode;
     children: ReactNode;
     className?: string;
     // State management
     isLoading?: boolean;
     isError?: boolean;
     error?: Error | null;
     isEmpty?: boolean;
     emptyTitle?: string;
     emptyDescription?: string;
     emptyAction?: ReactNode;
     onRetry?: () => void;
   }

   export function AdminPageShell({
     title, description, actions, children, className,
     isLoading, isError, error, isEmpty,
     emptyTitle = 'No data found',
     emptyDescription = 'Get started by creating your first item.',
     emptyAction, onRetry,
   }: AdminPageShellProps) {
     // Loading state: centered spinner
     if (isLoading) {
       return (
         <PageTemplate title={title} description={description} className={className}>
           <div className="flex items-center justify-center py-20">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
         </PageTemplate>
       );
     }
     // Error state: alert with retry
     if (isError) {
       return (
         <PageTemplate title={title} description={description} className={className}>
           <div className="flex flex-col items-center justify-center py-20 gap-4">
             <AlertCircle className="h-10 w-10 text-destructive" />
             <p className="text-body text-neutral-600">{error?.message || 'Something went wrong'}</p>
             {onRetry && <Button variant="outline" onClick={onRetry}>Try Again</Button>}
           </div>
         </PageTemplate>
       );
     }
     // Empty state: icon + CTA
     if (isEmpty) {
       return (
         <PageTemplate title={title} description={description} className={className}>
           <div className="flex flex-col items-center justify-center py-20 gap-4">
             <FolderOpen className="h-10 w-10 text-neutral-400" />
             <div className="text-center">
               <p className="text-body font-medium text-neutral-700">{emptyTitle}</p>
               <p className="mt-1 text-sm text-neutral-500">{emptyDescription}</p>
             </div>
             {emptyAction}
           </div>
         </PageTemplate>
       );
     }
     // Normal content
     return (
       <PageTemplate title={title} description={description} actions={actions} className={className}>
         {children}
       </PageTemplate>
     );
   }
   ```
2. **Write tests** for `AdminPageShell`:
   - Renders loading state with spinner
   - Renders error state with message and retry button
   - Renders empty state with custom title/description and CTA
   - Renders children in normal state
   - Passes `title`, `description`, `actions` to `PageTemplate`
3. Test file: `frontend/src/components/admin/AdminPageShell.test.tsx`
4. Run `cd gcredit-project/frontend; npx vitest run` — all tests must pass

**AC:** Shared page shell with 3-state management, ready for reuse across Stories 12.1–12.4.

---

### Task 0b: Create `<ConfirmDialog>` shared component (CROSS-CUTTING) ~30min

**Create file:** `frontend/src/components/ui/ConfirmDialog.tsx`

**What to do:**
1. Create a reusable confirmation dialog wrapping shadcn `Dialog`:
   ```tsx
   import {
     Dialog, DialogContent, DialogHeader, DialogTitle,
     DialogDescription, DialogFooter,
   } from '@/components/ui/dialog';
   import { Button } from '@/components/ui/button';

   interface ConfirmDialogProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     title: string;
     description: string;
     confirmLabel?: string;
     cancelLabel?: string;
     variant?: 'default' | 'danger';
     loading?: boolean;
     onConfirm: () => void;
   }

   export function ConfirmDialog({
     open, onOpenChange, title, description,
     confirmLabel = 'Confirm', cancelLabel = 'Cancel',
     variant = 'default', loading = false, onConfirm,
   }: ConfirmDialogProps) {
     return (
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{title}</DialogTitle>
             <DialogDescription>{description}</DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
               {cancelLabel}
             </Button>
             <Button
               variant={variant === 'danger' ? 'destructive' : 'default'}
               onClick={onConfirm}
               disabled={loading}
             >
               {loading ? 'Processing...' : confirmLabel}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     );
   }
   ```
2. **Write tests** for `ConfirmDialog`:
   - Renders title and description
   - Calls `onConfirm` when confirm button clicked
   - Calls `onOpenChange(false)` when cancel clicked
   - Shows destructive variant for `variant="danger"`
   - Disables buttons when `loading=true`
3. Test file: `frontend/src/components/ui/ConfirmDialog.test.tsx`
4. Run FE tests

**AC:** Reusable confirmation dialog with danger variant, ready for all delete/destructive actions.

---

### Task 1: Create `useSkillCategories` hook ~40min

**Create file:** `frontend/src/hooks/useSkillCategories.ts`

**What to do:**
1. Create React Query hook following the `useSkills` pattern:
   ```tsx
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { apiFetch, apiFetchJson } from '@/lib/apiFetch';
   import { toast } from 'sonner';

   // Types
   export interface SkillCategory {
     id: string;
     name: string;
     nameEn?: string;
     description?: string;
     parentId?: string;
     level: number;
     isSystemDefined: boolean;
     isEditable: boolean;
     displayOrder: number;
     children?: SkillCategory[];
     skills?: { id: string; name: string }[];
     _count?: { skills: number };
   }

   export interface CreateSkillCategoryInput {
     name: string;
     nameEn?: string;
     description?: string;
     parentId?: string;  // optional — null = Level 1
     displayOrder?: number;
   }

   export interface UpdateSkillCategoryInput {
     name?: string;
     nameEn?: string;
     description?: string;
     displayOrder?: number;
   }

   const QUERY_KEY = 'skill-categories';

   // Fetch tree
   export function useSkillCategoryTree() {
     return useQuery({
       queryKey: [QUERY_KEY, 'tree'],
       queryFn: async (): Promise<SkillCategory[]> => {
         const res = await apiFetch('/skill-categories?includeSkills=true');
         if (!res.ok) throw new Error('Failed to fetch skill categories');
         return res.json();
       },
       staleTime: 5 * 60 * 1000,
     });
   }

   // Fetch flat list (for parent selector dropdown)
   export function useSkillCategoryFlat() {
     return useQuery({
       queryKey: [QUERY_KEY, 'flat'],
       queryFn: async (): Promise<SkillCategory[]> => {
         const res = await apiFetch('/skill-categories/flat');
         if (!res.ok) throw new Error('Failed to fetch categories');
         return res.json();
       },
       staleTime: 5 * 60 * 1000,
     });
   }

   // Create mutation
   export function useCreateSkillCategory() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: async (input: CreateSkillCategoryInput) => {
         return apiFetchJson<SkillCategory>('/skill-categories', {
           method: 'POST',
           body: JSON.stringify(input),
         });
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
         toast.success('Category created successfully');
       },
       onError: (error: Error) => {
         toast.error(error.message || 'Failed to create category');
       },
     });
   }

   // Update mutation
   export function useUpdateSkillCategory() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: async ({ id, ...input }: UpdateSkillCategoryInput & { id: string }) => {
         return apiFetchJson<SkillCategory>(`/skill-categories/${id}`, {
           method: 'PATCH',
           body: JSON.stringify(input),
         });
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
         toast.success('Category updated successfully');
       },
       onError: (error: Error) => {
         toast.error(error.message || 'Failed to update category');
       },
     });
   }

   // Delete mutation
   export function useDeleteSkillCategory() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: async (id: string) => {
         const res = await apiFetch(`/skill-categories/${id}`, { method: 'DELETE' });
         if (!res.ok) {
           const error = await res.json().catch(() => ({ message: res.statusText }));
           throw new Error(error.message || `HTTP ${res.status}`);
         }
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
         toast.success('Category deleted successfully');
       },
       onError: (error: Error) => {
         toast.error(error.message || 'Failed to delete category');
       },
     });
   }
   ```
2. **Write tests** for each hook: mock `apiFetch`/`apiFetchJson`, verify query keys, verify mutations invalidate cache, verify toast calls.
3. Test file: `frontend/src/hooks/useSkillCategories.test.ts`
4. Run FE tests

**AC:** Complete data layer for skill category CRUD with cache invalidation and toast feedback.

---

### Task 2: Create `<CategoryTree>` shared component ~2h

**Create file:** `frontend/src/components/admin/CategoryTree.tsx`

**What to do:**
1. Build a recursive tree component with expand/collapse:
   - **Props:**
     - `categories: SkillCategory[]` — nested tree data
     - `editable?: boolean` — if true, show drag handles + action buttons (edit/delete/add child)
     - `onEdit?: (category: SkillCategory) => void`
     - `onDelete?: (category: SkillCategory) => void`
     - `onAddChild?: (parent: SkillCategory) => void`
     - `onReorder?: (id: string, newDisplayOrder: number) => void`
     - `selectedId?: string` — highlighted node (for read-only selector mode)
     - `onSelect?: (category: SkillCategory) => void`
   - **Each tree node displays:**
     - Expand/collapse chevron (`ChevronRight` / `ChevronDown` from lucide)
     - Category name
     - Skill count badge: `(12 skills)` — use `category.skills?.length` or `category._count?.skills`
     - Lock icon (`Lock` from lucide) if `isSystemDefined === true`
     - In editable mode: drag handle (`GripVertical`), Edit button, Add Child button, Delete button (disabled if `isSystemDefined`)
   - **Expand/collapse:** Track expanded state with `useState<Set<string>>()`. Top-level nodes expanded by default.
   - **Visual:** Indentation per level (e.g., `ml-6` per level). Alternating background for clarity. Hover highlight.
   - **Empty state:** "No categories found. Create your first skill category." with CTA button
   - **Responsive:** On `<1024px`, collapse tree into a flat searchable selector (stretch goal — can defer)

2. **Create `<CategoryTreeNode>` sub-component** (recursive child):
   - Renders single node + recursively renders `children`
   - Handles expand/collapse toggle
   - Shows action icons on hover (edit, delete, add child)

3. **Write tests:**
   - Renders tree with nested children
   - Expand/collapse toggles children visibility
   - Shows skill count per node
   - Shows lock icon for system-defined categories
   - Calls `onEdit`, `onDelete`, `onAddChild` when action buttons clicked
   - Delete button disabled for system-defined categories
   - Read-only mode hides action buttons
4. Test file: `frontend/src/components/admin/CategoryTree.test.tsx`
5. Run FE tests

**AC:** Reusable tree component with editable and read-only modes.

---

### Task 3: Install `@dnd-kit` + Drag-and-drop reorder ~1.5h

**What to do:**
1. Install dependencies:
   ```bash
   cd gcredit-project/frontend
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```
2. Integrate into `CategoryTree` for editable mode:
   - Wrap sortable siblings in `<SortableContext>` with `verticalListSortingStrategy`
   - Each `<CategoryTreeNode>` uses `useSortable()` hook
   - Drag handle (`GripVertical` icon) activates via `{...attributes, ...listeners}` only on the handle element
   - Blue insertion line during drag (via `DragOverlay` or CSS `:active` state)
   - **Constraint:** Same-level reorder ONLY — `useSortable` scoped per parent group. No cross-level reparenting via drag.
   - On `onDragEnd`: calculate new `displayOrder` values, call `PATCH /api/skill-categories/:id` with `{ displayOrder }` for each moved item
   - Use `useMutation` for batch reorder, toast on success/error

3. **Write tests:**
   - Drag handle renders in editable mode
   - Drag handle hidden in read-only mode
   - `onReorder` callback fires with correct id and new display order
4. Run FE tests

**AC:** Same-level drag-and-drop reorder with visual feedback. No cross-level drag.

---

### Task 3b: Backend — Allow Level 1 Category Creation ~30min

**Files:**
- `backend/src/skill-categories/dto/skill-category.dto.ts`
- `backend/src/skill-categories/skill-categories.service.ts`

**What to do:**

**DTO change** (skill-category.dto.ts, `CreateSkillCategoryDto` class):
1. Change `parentId` from required to optional:
   ```typescript
   // BEFORE (line 48-52):
   @ApiProperty({
     example: 'da721a77-18c0-40e7-a7aa-269efe8e26bb',
     description: 'Parent category ID (required, top-level creation not allowed)',
   })
   @IsUUID()
   parentId: string;

   // AFTER:
   @ApiPropertyOptional({
     example: 'da721a77-18c0-40e7-a7aa-269efe8e26bb',
     description: 'Parent category ID. Omit or null to create a top-level (Level 1) category.',
   })
   @IsOptional()
   @IsUUID()
   parentId?: string;
   ```

**Service change** (skill-categories.service.ts, `create()` method, around line 75):
1. Handle missing `parentId` for Level 1 creation:
   ```typescript
   async create(createDto: CreateSkillCategoryDto) {
     const { parentId, ...data } = createDto;

     let level = 1;

     if (parentId) {
       // Verify parent exists
       const parent = await this.prisma.skillCategory.findUnique({
         where: { id: parentId },
       });
       if (!parent) {
         throw new NotFoundException(`Parent category with ID ${parentId} not found`);
       }
       if (parent.level >= 3) {
         throw new BadRequestException(
           'Cannot create subcategory: maximum nesting level (3) reached',
         );
       }
       level = parent.level + 1;
     }

     const category = await this.prisma.skillCategory.create({
       data: {
         ...data,
         parentId: parentId || null,
         level,
         isSystemDefined: false,
         isEditable: true,
       },
       include: { parent: true },
     });

     return category;
   }
   ```

2. **Update/write backend tests:**
   - Create category without parentId → Level 1 created, `parentId: null`
   - Create category with valid parentId → level = parent.level + 1
   - Create category with parentId at level 3 → 400 BadRequest
   - Create category with non-existent parentId → 404 NotFound
3. **Update Swagger docs:** `@ApiPropertyOptional` already handles this
4. Run `cd gcredit-project/backend; npx jest --forceExit` — all tests must pass

**AC:** Admin can create Level 1 categories via API (no parent required).

---

### Task 4: Create Category Form Dialog ~1h

**Create file:** `frontend/src/components/admin/CategoryFormDialog.tsx`

**What to do:**
1. Build a Dialog for create/edit:
   - **Props:**
     - `open: boolean`
     - `onOpenChange: (open: boolean) => void`
     - `mode: 'create' | 'edit'`
     - `category?: SkillCategory` — pre-populate for edit mode
     - `parentId?: string` — pre-selected parent for "Add child" action
     - `onSubmit: (data: CreateSkillCategoryInput | UpdateSkillCategoryInput) => void`
     - `loading?: boolean`
   - **Fields:**
     - Name (required, max 100 chars) — `<Input>`
     - Name (English) (optional) — `<Input>`
     - Description (optional) — `<Input>` or `<Textarea>`
     - Parent Category (optional) — `<Select>` using flat category list from `useSkillCategoryFlat()`. Pre-selected if `parentId` provided. Empty = "No parent (Top-level category)".
   - **Validation:** Name required, max 100. Show inline error messages.
   - **Title:** "Create Category" / "Edit Category" based on mode

2. **Write tests:**
   - Renders create form with empty fields
   - Renders edit form with pre-populated values
   - Validates required name field
   - Parent selector shows flat category list
   - Submits correct data for create/edit
3. Test file: `frontend/src/components/admin/CategoryFormDialog.test.tsx`
4. Run FE tests

**AC:** Form dialog works for both create and edit, with parent selector and validation.

---

### Task 5: Delete Category with Guard ~30min

**Integration with `ConfirmDialog`:**

**What to do:**
1. In the main page component (Task 6), wire delete action:
   - On delete button click → check if category has skills or children
   - If has skills: show message "Cannot delete '{name}' — it has {n} skills assigned. Reassign them first."
   - If has children: show message "Cannot delete '{name}' — it has subcategories. Delete them first."
   - If empty: show `ConfirmDialog` with `variant="danger"`, title "Delete Category", description "Are you sure you want to delete '{name}'? This action cannot be undone."
   - On confirm → call `useDeleteSkillCategory().mutate(id)`
2. System-defined categories (`isSystemDefined=true`):
   - Show lock icon on tree node
   - Delete button disabled (grey out)
   - Tooltip: "System-defined categories cannot be deleted"
3. **Tests covered in page-level tests (Task 7)**

**AC:** Delete blocked with explanation if has skills/children. System-defined categories protected.

---

### Task 6: Page + Route + Navigation ~1.5h

**Create file:** `frontend/src/pages/admin/SkillCategoryManagementPage.tsx`

**What to do:**
1. Build the main page composing all components:
   ```tsx
   import { useState } from 'react';
   import { Plus } from 'lucide-react';
   import { Button } from '@/components/ui/button';
   import { AdminPageShell } from '@/components/admin/AdminPageShell';
   import { CategoryTree } from '@/components/admin/CategoryTree';
   import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
   import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
   import {
     useSkillCategoryTree,
     useCreateSkillCategory,
     useUpdateSkillCategory,
     useDeleteSkillCategory,
     type SkillCategory,
   } from '@/hooks/useSkillCategories';
   // ... component with dialog state, CRUD handlers, tree rendering
   ```
2. **State management:**
   - `formDialogOpen` + `formMode` ('create'|'edit') + `editingCategory` + `preSelectedParentId`
   - `deleteDialogOpen` + `deletingCategory`
3. **Wiring:**
   - Tree `onEdit` → open form dialog in edit mode
   - Tree `onAddChild` → open form dialog with parent pre-selected
   - Tree `onDelete` → open confirm dialog
   - "Create Category" button in `actions` slot → open form dialog in create mode (no parent)
   - Form submit → call create/update mutation → close dialog on success
   - Delete confirm → call delete mutation → close dialog on success

4. **Route registration** (App.tsx):
   ```tsx
   const SkillCategoryManagementPage = lazy(() => import('@/pages/admin/SkillCategoryManagementPage'));
   // Add route:
   <Route
     path="/admin/skills/categories"
     element={
       <ProtectedRoute requiredRoles={['ADMIN']}>
         <Layout pageTitle="Skill Categories">
           <SkillCategoryManagementPage />
         </Layout>
       </ProtectedRoute>
     }
   />
   ```

5. **Navigation links** (AC #10 says sidebar nav is future Sprint 13, but add route now):
   - **Navbar.tsx:** Add link under ADMIN section:
     ```tsx
     {user?.role === 'ADMIN' && (
       <>
         <li><Link to="/admin/users">Users</Link></li>
         <li><Link to="/admin/skills/categories">Skill Categories</Link></li>
       </>
     )}
     ```
   - **MobileNav.tsx:** Add to navLinks array:
     ```tsx
     { to: '/admin/skills/categories', label: 'Skill Categories', roles: ['ADMIN'] },
     ```

6. **Default export** for lazy loading:
   ```tsx
   export default SkillCategoryManagementPage;
   ```

7. Run FE tests

**AC:** Page renders at `/admin/skills/categories`, ADMIN-only, with full CRUD functionality.

---

### Task 7: Tests ~1h

**Test files to create/update:**
- `frontend/src/pages/admin/SkillCategoryManagementPage.test.tsx`

**What to test:**
1. Page renders with tree of categories
2. "Create Category" button opens form dialog
3. Submit create form → category added to tree
4. Edit button → form pre-populated → submit → category updated
5. Delete button on empty category → confirm dialog → category removed
6. Delete button on category with skills → blocked with message
7. System-defined category → lock icon visible, delete disabled
8. Loading state shows spinner via AdminPageShell
9. Error state shows error message with retry
10. Empty state shows CTA

**Backend test file:**
- `backend/src/skill-categories/skill-categories.service.spec.ts` — update/add tests for optional `parentId` in create

Run full test suites:
- `cd gcredit-project/frontend; npx vitest run`
- `cd gcredit-project/backend; npx jest --forceExit`

---

## Post-Implementation Checklist

After ALL tasks are complete:

1. **TypeScript check:** `cd gcredit-project/backend; npx tsc --noEmit` — 0 errors
2. **TypeScript check:** `cd gcredit-project/frontend; npx tsc --noEmit` — 0 errors
3. **Backend tests:** `cd gcredit-project/backend; npx jest --forceExit` — all pass
4. **Frontend tests:** `cd gcredit-project/frontend; npx vitest run` — all pass
5. **ESLint BE:** `cd gcredit-project/backend; npx eslint src/` — clean
6. **ESLint FE:** `cd gcredit-project/frontend; npx eslint src/` — clean
7. **Commit:** Single commit with message:
   ```
   feat(Story-12.1): Skill Category Management UI

   - AdminPageShell: shared page wrapper with loading/error/empty states
   - ConfirmDialog: shared confirmation dialog with danger variant
   - CategoryTree: recursive tree with editable/read-only modes
   - CategoryFormDialog: create/edit dialog with parent selector
   - Drag-and-drop reorder via @dnd-kit (same-level only)
   - Backend: parentId made optional for Level 1 creation
   - Route: /admin/skills/categories (ADMIN only)
   - New deps: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
   ```
8. **Mark story as complete** in the story file: `Status: done`
9. **Update `sprint-status.yaml`:** `12-1-skill-category-management-ui: done`

---

## Key File References

| File | Purpose |
|------|---------|
| `project-context.md` | Single Source of Truth — read first |
| `gcredit-project/docs/sprints/sprint-12/12-1-skill-category-management-ui.md` | Story file |
| `gcredit-project/frontend/src/lib/apiFetch.ts` | API client — always use this |
| `gcredit-project/frontend/src/components/layout/PageTemplate.tsx` | Base page template (AdminPageShell wraps this) |
| `gcredit-project/frontend/src/pages/AdminUserManagementPage.tsx` | Reference admin page pattern |
| `gcredit-project/frontend/src/hooks/useSkills.ts` | Reference React Query hook pattern |
| `gcredit-project/frontend/src/App.tsx` | Route registration |
| `gcredit-project/frontend/src/components/Navbar.tsx` | Desktop nav links |
| `gcredit-project/frontend/src/components/layout/MobileNav.tsx` | Mobile nav links |
| `gcredit-project/backend/src/skill-categories/dto/skill-category.dto.ts` | DTO to modify (parentId optional) |
| `gcredit-project/backend/src/skill-categories/skill-categories.service.ts` | Service to modify (Level 1 creation) |
| `gcredit-project/backend/src/skill-categories/skill-categories.controller.ts` | Controller (read-only, no changes) |
| `gcredit-project/backend/prisma/schema.prisma` | Prisma schema (read-only) |

## Important Constraints

- **DO NOT** modify Prisma schema — all changes at DTO/service/component level
- **DO NOT** break existing ~1,307 tests
- **DO NOT** use raw `fetch` or `axios` — always `apiFetch` / `apiFetchJson`
- **DO NOT** install `react-arborist` or heavyweight tree libs — custom `CategoryTree` only
- **DO** use shadcn/ui components for all UI elements
- **DO** use `lucide-react` for all icons
- **DO** use `sonner` toast for user feedback
- **DO** follow existing code patterns: Prisma service → Controller → React Query hook → Component
- **DO** use `export default` on page components for lazy loading
