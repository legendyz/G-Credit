# Dev Prompt — Story 15.12: Dirty-Form Guard

## Story Reference
`gcredit-project/docs/sprints/sprint-15/15-12-dirty-form-guard.md`

## Objective
Add a navigation guard to all form pages that warns users when they attempt to leave with unsaved changes. Uses `beforeunload` for browser close/refresh, React Router `useBlocker` for client-side navigation, and a styled shadcn/ui AlertDialog for the confirmation dialog.

## Current State
- **No dirty-form guard exists anywhere** in the codebase
- Form pages use individual `useState` fields (no form library like react-hook-form)
- React Router v6.30.3 is installed — `useBlocker` is **stable** (no `unstable_` prefix)
- Existing `ConfirmDialog` component at `components/ui/ConfirmDialog.tsx` uses `Dialog` (not `AlertDialog`) — we'll create a separate `NavigationGuardDialog` using `AlertDialog` per AC#6

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/hooks/useFormGuard.ts` | **New** | Core hook: `beforeunload` + `useBlocker` |
| `frontend/src/components/ui/NavigationGuardDialog.tsx` | **New** | Styled AlertDialog for navigation warning |
| `frontend/src/pages/admin/BadgeTemplateFormPage.tsx` | Modify | Add `useFormGuard` with dirty tracking |
| `frontend/src/pages/ProfilePage.tsx` | Modify | Add `useFormGuard` for profile + password forms |
| `frontend/src/pages/IssueBadgePage.tsx` | Modify | Add `useFormGuard` for badge issuance form |
| `frontend/src/pages/BulkIssuancePage.tsx` | Modify | Add `useFormGuard` when file is selected/uploading |

## Part 1: `useFormGuard` Hook

**File:** `frontend/src/hooks/useFormGuard.ts`

```ts
import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

interface UseFormGuardOptions {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Optional custom message (not used by modern browsers for beforeunload, but used by dialog) */
  message?: string;
}

interface UseFormGuardReturn {
  /** Whether the blocker is currently active (dialog should be shown) */
  isBlocked: boolean;
  /** Call to proceed with navigation (user clicked "Leave") */
  proceed: () => void;
  /** Call to cancel navigation (user clicked "Stay") */
  reset: () => void;
}

export function useFormGuard({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseFormGuardOptions): UseFormGuardReturn {
  // Browser close/refresh protection
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom message but require returnValue
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  // React Router client-side navigation protection
  const blocker = useBlocker(isDirty);

  const proceed = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const reset = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return {
    isBlocked: blocker.state === 'blocked',
    proceed,
    reset,
  };
}
```

**Key design decisions:**
- `useBlocker(isDirty)` — the blocker only activates when `isDirty` is true
- When `isDirty` becomes false (after save), blocker automatically deactivates (AC#4)
- `blocker.state === 'blocked'` triggers the dialog
- `blocker.proceed()` lets navigation continue
- `blocker.reset()` cancels navigation

## Part 2: `NavigationGuardDialog` Component

**File:** `frontend/src/components/ui/NavigationGuardDialog.tsx`

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

interface NavigationGuardDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function NavigationGuardDialog({ open, onStay, onLeave }: NavigationGuardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-amber-500" />
            Unsaved Changes
          </AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you leave this page.
            Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>Stay on Page</AlertDialogCancel>
          <AlertDialogAction
            onClick={onLeave}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Leave Page
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Prerequisite:** shadcn/ui `alert-dialog` component must exist. Check if `frontend/src/components/ui/alert-dialog.tsx` exists. If not, install:
```bash
cd gcredit-project/frontend
npx shadcn@latest add alert-dialog
```

## Part 3: Form Page Integrations

### 3a. BadgeTemplateFormPage (576 lines)

This page has individual `useState` fields. Dirty detection strategy: **compare current state to initial/loaded state**.

```tsx
// Add imports at top
import { useFormGuard } from '@/hooks/useFormGuard';
import { NavigationGuardDialog } from '@/components/ui/NavigationGuardDialog';

// Inside the component, after existing state declarations:

// Track initial values for dirty detection (Story 15.12)
const [initialValues, setInitialValues] = useState({
  name: '',
  description: '',
  category: '' as TemplateCategory | '',
  validityPeriod: '',
  status: 'DRAFT' as TemplateStatus,
  criteriaText: '',
  selectedSkills: [] as string[],
});

// Compute isDirty by comparing current vs initial
const isDirty = useMemo(() => {
  if (isReadOnly) return false; // Never dirty in readonly mode
  return (
    name !== initialValues.name ||
    description !== initialValues.description ||
    category !== initialValues.category ||
    validityPeriod !== initialValues.validityPeriod ||
    status !== initialValues.status ||
    criteriaText !== initialValues.criteriaText ||
    JSON.stringify(selectedSkills) !== JSON.stringify(initialValues.selectedSkills) ||
    imageFile !== null
  );
}, [name, description, category, validityPeriod, status, criteriaText, selectedSkills, imageFile, initialValues, isReadOnly]);

// Form guard hook
const { isBlocked, proceed, reset } = useFormGuard({ isDirty });
```

**After loading template data in edit mode** (inside the existing `fetchTemplate` callback):
```tsx
// After setting all form fields from template data:
setInitialValues({
  name: template.name,
  description: template.description || '',
  category: template.category || '',
  validityPeriod: template.validityPeriod?.toString() || '',
  status: template.status,
  criteriaText: /* existing criteria text extraction */,
  selectedSkills: template.skillIds || [],
});
```

**After successful save** (inside `handleSubmit` after `toast.success`):
```tsx
// Update initial values to match saved state (deactivates guard)
setInitialValues({ name, description, category, validityPeriod, status, criteriaText, selectedSkills });
```

**Add dialog to JSX** (at the end, before closing tag):
```tsx
<NavigationGuardDialog open={isBlocked} onStay={reset} onLeave={proceed} />
```

### 3b. ProfilePage

ProfilePage has two independent forms (Profile Info + Password). Track dirty on both:

```tsx
import { useFormGuard } from '@/hooks/useFormGuard';
import { NavigationGuardDialog } from '@/components/ui/NavigationGuardDialog';

// Dirty detection — profile section
const isProfileDirty = useMemo(() => {
  if (!profile) return false;
  return firstName !== profile.firstName || lastName !== profile.lastName;
}, [firstName, lastName, profile]);

// Dirty detection — password section
const isPasswordDirty = currentPassword !== '' || newPassword !== '' || confirmPassword !== '';

// Combined dirty state
const isDirty = isProfileDirty || isPasswordDirty;

const { isBlocked, proceed, reset } = useFormGuard({ isDirty });

// In JSX:
<NavigationGuardDialog open={isBlocked} onStay={reset} onLeave={proceed} />
```

**After successful profile save:** Profile state refreshes via `fetchProfile()` which updates `profile`, so `isProfileDirty` auto-resolves.

**After successful password change:** Clear all password fields (already done) → `isPasswordDirty` auto-resolves.

### 3c. IssueBadgePage

```tsx
import { useFormGuard } from '@/hooks/useFormGuard';
import { NavigationGuardDialog } from '@/components/ui/NavigationGuardDialog';

// Dirty = any form field has been filled
const isDirty = useMemo(() => {
  return (
    selectedTemplateId !== '' ||
    selectedRecipientId !== '' ||
    expiresIn !== '' ||
    pendingFiles.length > 0 ||
    pendingUrls.length > 0
  );
}, [selectedTemplateId, selectedRecipientId, expiresIn, pendingFiles, pendingUrls]);

const { isBlocked, proceed, reset } = useFormGuard({ isDirty: isDirty && !isSubmitting });

// In JSX:
<NavigationGuardDialog open={isBlocked} onStay={reset} onLeave={proceed} />
```

**Note:** `isDirty && !isSubmitting` — disable guard during submission (the page navigates away on success).

### 3d. BulkIssuancePage

```tsx
import { useFormGuard } from '@/hooks/useFormGuard';
import { NavigationGuardDialog } from '@/components/ui/NavigationGuardDialog';

// Dirty = file selected or upload in progress
const isDirty = fileSelected || isUploading;

const { isBlocked, proceed, reset } = useFormGuard({ isDirty });

// In JSX:
<NavigationGuardDialog open={isBlocked} onStay={reset} onLeave={proceed} />
```

## Tailwind v4 Reminder (Lesson 52)
- CSS variables: `var(--color-x)` directly, NOT `hsl(var(--x))`
- Colors use oklch format
- `text-amber-500`, `bg-destructive`, `text-destructive-foreground` — all valid Tailwind tokens

## Testing Checklist

1. `npx tsc --noEmit` — zero TS errors
2. `npx eslint . --max-warnings=0` — zero lint errors
3. `npm test` — all tests pass (currently 844)
4. Manual testing:
   - BadgeTemplateFormPage: type in name → navigate away → dialog shows → "Stay" cancels → "Leave" proceeds
   - BadgeTemplateFormPage: type in name → save → navigate away → NO dialog
   - ProfilePage: change first name → click sidebar link → dialog shows
   - ProfilePage: save profile → navigate → no dialog
   - IssueBadgePage: select template → close tab → browser warning
   - BulkIssuancePage: select CSV file → navigate → dialog
   - All pages: no flash of dialog on initial mount (isDirty starts false)

## Test Ideas

```tsx
// useFormGuard.test.ts
describe('useFormGuard', () => {
  it('should not block when isDirty is false');
  it('should add beforeunload listener when isDirty is true');
  it('should remove beforeunload listener on cleanup');
  it('should set blocker state to blocked on navigation attempt when dirty');
});

// NavigationGuardDialog.test.tsx
describe('NavigationGuardDialog', () => {
  it('renders dialog when open is true');
  it('calls onStay when Stay button clicked');
  it('calls onLeave when Leave button clicked');
  it('does not render when open is false');
});
```

## Commit Message Template
```
feat: dirty-form guard for unsaved changes (Story 15.12)

- New useFormGuard hook (beforeunload + useBlocker)
- New NavigationGuardDialog (shadcn/ui AlertDialog)
- Integrate with BadgeTemplateFormPage, ProfilePage,
  IssueBadgePage, BulkIssuancePage
- Guard activates on dirty state, deactivates after save

0 lint errors | 0 TS errors | N/N tests pass
```
