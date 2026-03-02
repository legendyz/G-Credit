# Dev Prompt — Story 15.9: Styled Delete Confirmation Modal

## Story Reference
`gcredit-project/docs/sprints/sprint-15/15-9-styled-delete-confirmation.md`

## Objective
Replace the **single remaining** raw `confirm()` call with a styled shadcn/ui `AlertDialog`. This is the template delete confirmation in `BadgeTemplateListPage.tsx`.

## Audit Results

Only **one** raw `confirm()` call exists in the entire frontend:

| File | Line | Usage |
|------|------|-------|
| `frontend/src/pages/admin/BadgeTemplateListPage.tsx` | 205 | `if (!confirm(\`Delete template "${template.name}"? This cannot be undone.\`)) return;` |

All other destructive actions already use styled dialogs:
- `BadgeManagementPage` → custom revoke modal (`isModalOpen` state)
- `MilestoneManagementPage` → `ConfirmDialog` (`deleteDialogOpen` state)
- `SkillCategoryManagementPage` → `ConfirmDialog` (imported from `@/components/ui/ConfirmDialog`)
- `BulkResultPage` → custom skip confirm dialog
- `BulkIssuance/ConfirmationModal` → already styled

## What to Do

### Option A: Reuse Existing `ConfirmDialog` (Recommended — Simpler)

The existing `ConfirmDialog` component at `components/ui/ConfirmDialog.tsx` already has:
- `variant: 'danger'` → renders `destructive` Button
- `title`, `description`, `confirmLabel`, `cancelLabel` props
- `loading` state support
- Focus trap via shadcn `Dialog`

Story AC#2 says "shadcn/ui AlertDialog" — but `ConfirmDialog` already uses shadcn `Dialog` which has identical accessibility. If AC#6 (Lucide icon) is desired, just add an icon to the title.

**However**, the Story explicitly says `AlertDialog`. So:

### Option B: Use `AlertDialog` via New Component (Matches AC Literally)

Since `alert-dialog.tsx` was already installed in Story 15.12, create a dedicated `ConfirmDeleteDialog` using `AlertDialog`:

**File:** `frontend/src/components/ui/ConfirmDeleteDialog.tsx`

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TriangleAlert } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Refactor `BadgeTemplateListPage.tsx`

**Before (line ~205):**
```tsx
const handleDelete = async (template: BadgeTemplate) => {
  if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
  setActionLoading(template.id);
  try { ... }
};
```

**After:**
```tsx
// Add state for delete confirmation dialog
const [deleteTarget, setDeleteTarget] = useState<BadgeTemplate | null>(null);

// Split into two functions: request + confirm
const handleDeleteRequest = (template: BadgeTemplate) => {
  setDeleteTarget(template);
};

const handleDeleteConfirm = async () => {
  if (!deleteTarget) return;
  const template = deleteTarget;
  setDeleteTarget(null); // Close dialog
  setActionLoading(template.id);
  try {
    await deleteTemplate(template.id);
    queryClient.invalidateQueries({ queryKey: ['badge-templates'] });
    toast.success(`Template "${template.name}" deleted`);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to delete template');
  } finally {
    setActionLoading(null);
  }
};
```

**Replace all `onClick={() => handleDelete(template)}` with `onClick={() => handleDeleteRequest(template)}`.**

**Add dialog at end of JSX:**
```tsx
<ConfirmDeleteDialog
  open={!!deleteTarget}
  onOpenChange={(open) => !open && setDeleteTarget(null)}
  title="Delete Template"
  description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
  onConfirm={handleDeleteConfirm}
  loading={actionLoading === deleteTarget?.id}
/>
```

### Update Test File

**File:** `frontend/src/pages/admin/BadgeTemplateListPage.test.tsx`

Remove the `window.confirm` mock (line ~155):
```tsx
// REMOVE: vi.spyOn(window, 'confirm').mockReturnValue(true);
```

Update delete test to interact with the dialog instead:
```tsx
it('shows delete confirmation dialog and deletes on confirm', async () => {
  renderWithProviders(<BadgeTemplateListPage />);
  
  // Wait for templates to load
  await waitFor(() => expect(screen.getByText('Cloud Expert')).toBeInTheDocument());
  
  // Click delete button
  const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
  fireEvent.click(deleteButton);
  
  // Dialog appears
  await waitFor(() => {
    expect(screen.getByText('Delete Template')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });
  
  // Click confirm
  const confirmButton = screen.getByRole('button', { name: /delete/i });
  fireEvent.click(confirmButton);
  
  await waitFor(() => {
    expect(mockDeleteTemplate).toHaveBeenCalled();
  });
});
```

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/ui/ConfirmDeleteDialog.tsx` | **New** | AlertDialog-based delete confirmation |
| `frontend/src/pages/admin/BadgeTemplateListPage.tsx` | Modify | Replace `confirm()` with dialog state |
| `frontend/src/pages/admin/BadgeTemplateListPage.test.tsx` | Modify | Remove `window.confirm` mock, test dialog interaction |

## Tailwind v4 Reminder
- `text-destructive`, `bg-destructive`, `text-destructive-foreground` — valid tokens
- No `hsl(var(--x))` — use `var(--x)` directly

## Testing Checklist
1. `npx tsc --noEmit` — zero TS errors
2. `npx eslint . --max-warnings=0` — zero lint errors
3. `npm test` — all tests pass (currently 844)
4. Manual: click Delete on template → styled dialog appears → Cancel works → Delete works
5. Verify: no raw `confirm()` left — `grep -r "confirm(" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v test | grep -v ConfirmDialog | grep -v ConfirmDeleteDialog | grep -v ConfirmationModal | grep -v setShow`

## Commit Message Template
```
feat: styled delete confirmation dialog (Story 15.9)

- New ConfirmDeleteDialog (shadcn/ui AlertDialog + TriangleAlert icon)
- Replace raw confirm() in BadgeTemplateListPage with styled dialog
- Update test: remove window.confirm mock, test dialog interaction

0 lint errors | 0 TS errors | N/N tests pass
```
