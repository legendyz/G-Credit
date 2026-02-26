# Dev Prompt: Story 13.4 — Login Page Dual Entry + SSO Redirect Flow

**Story:** 13.4  
**Sprint:** 13  
**Priority:** HIGH  
**Depends on:** Story 13.1 (✅ Done), 13.2 (✅ Done), 13.3 (✅ Done) — backend SSO flow fully operational  
**Approach:** Component-first, then integration. Tests via Vitest + Testing Library.  
**Estimated:** ~6-8h  
**Status:** ready-for-dev

---

## Objective

Redesign the login page with dual authentication entry points:
1. **Primary:** "Sign in with Microsoft" SSO button (redirects to backend `GET /api/auth/sso/login`)
2. **Secondary:** Email/password form (existing, migrated to shadcn/ui `<Input>`)

Additionally create an `/sso/callback` page that handles the redirect back from Azure AD, validates the session, and navigates to the dashboard.

**Key constraint:** This is a **frontend-only** story. The backend SSO flow (13.1-13.3) is fully operational. This story wires up the frontend UI to that backend.

---

## Current Architecture (What Already Exists)

### Backend SSO Flow (DO NOT MODIFY)

```
User clicks "Sign in with Microsoft"
  → browser navigates to GET /api/auth/sso/login
  → backend redirects to Azure AD authorize URL
  → user authenticates with Microsoft
  → Azure AD redirects to GET /api/auth/sso/callback
  → backend exchanges code for tokens, runs ssoLogin()
  → backend sets httpOnly JWT cookies (access + refresh)
  → backend redirects to: ${FRONTEND_URL}/sso/callback?success=true
     OR on error: ${FRONTEND_URL}/login?error=<errorCode>
```

**Error codes sent by backend** (as `?error=` query param on `/login`):
| Code | Meaning |
|------|---------|
| `sso_cancelled` | User clicked Cancel on Azure AD consent |
| `sso_failed` | Generic SSO error (state mismatch, code exchange failed, etc.) |
| `sso_no_account` | Legacy — should not occur after 13.2 |
| `account_disabled` | User account deactivated |
| `sso_invalid_token` | Token missing oid claim |

### Current Login Page (`src/pages/LoginPage.tsx`)

```tsx
// 186 lines — email/password only, uses native <input> elements
// Key features:
// - Zustand authStore: login(), isLoading, error, isAuthenticated, clearError
// - Redirects if already authenticated
// - sonner toast on success/failure
// - Accessible: aria-required, aria-live, aria-busy
// - Error alert displayed as inline banner
// - Loading spinner in submit button
```

**Problems to fix:**
- No SSO button
- Uses native `<input>` instead of shadcn `<Input>` (P2-6)
- No SSO callback handling
- No SSO error display

### Auth Store (`src/stores/authStore.ts`)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionValidated: boolean;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  validateSession: () => Promise<boolean>;
}
```

**`validateSession()`** — already exists, does:
1. GET /auth/profile → if 200, set user, return true
2. If 401 → POST /auth/refresh → retry profile
3. If both fail → logout

This is exactly what the SSO callback page needs to call.

### Available shadcn/ui Components

Already installed and used elsewhere in the project:
- `<Input>` — `@/components/ui/input` (wraps native input with consistent styling)
- `<Button>` — `@/components/ui/button` (variant: default/destructive/outline/secondary/ghost/link, size: default/sm/lg/icon)
- `<Label>` — `@/components/ui/label`

### Frontend Test Setup

- **Framework:** Vitest + @testing-library/react + @testing-library/user-event
- **Config:** `vite.config.ts` → `test.globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.ts']`
- **Test files:** `src/**/*.test.tsx` (68 existing test files)
- **Mocks:** global `fetch` mocked in setup.ts, `vi.fn()` available globally

### Router (`App.tsx`)

```tsx
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<LoginPage />} />
  {/* ... other routes ... */}
</Routes>
```

Need to add: `<Route path="/sso/callback" element={<SsoCallbackPage />} />`

---

## Task 1: Microsoft SSO Button Component (AC: #1, #9)

### Create `src/components/auth/MicrosoftSsoButton.tsx`

A self-contained button component following [Microsoft identity branding guidelines](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps):

```tsx
// Requirements:
// - Microsoft logo SVG (official, 21x21px) + "Sign in with Microsoft" text
// - Light theme: white background (#FFFFFF), dark text (#2F2F2F), 1px #8C8C8C border
// - Full-width on mobile, auto-width centered on desktop
// - Loading state: show spinner, disable button, text → "Redirecting..."
// - onClick: set loading → window.location.href = '/api/auth/sso/login'
// - Accessible: aria-label, disabled state
```

**Microsoft Logo SVG** (official brand asset — simplified 4-square):
```tsx
const MicrosoftLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);
```

**Component API:**
```tsx
interface MicrosoftSsoButtonProps {
  className?: string;
  disabled?: boolean;
}
```

---

## Task 2: Login Page Redesign (AC: #2, #8)

### Modify `src/pages/LoginPage.tsx`

**Layout (top to bottom):**
1. Logo/Branding (existing)
2. Login Card:
   - `<MicrosoftSsoButton />` — primary CTA, full width
   - Visual separator: `<div>` with `<hr>` + centered "or sign in with email" text
   - Email field → replace native `<input>` with shadcn `<Input>` from `@/components/ui/input`
   - Password field → same replacement
   - Submit button → replace native `<button>` with shadcn `<Button>` from `@/components/ui/button`
   - Labels → replace native `<label>` with shadcn `<Label>` from `@/components/ui/label`
3. Help text (existing)
4. Footer (existing)

**Visual Separator Pattern:**
```tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-neutral-300" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-white px-2 text-neutral-500">or sign in with email</span>
  </div>
</div>
```

**SSO Error Display (from URL params):**
```tsx
// On mount, check for ?error= in URL search params
// Display appropriate error message via inline alert (same pattern as existing error)
// Error messages:
//   sso_cancelled → "Sign-in was cancelled. Please try again."
//   sso_failed → "Microsoft sign-in failed. Please try again or use email login."
//   account_disabled → "Your account has been deactivated. Contact your administrator."
//   sso_invalid_token → "Authentication error. Please try again."
// After displaying, clear URL params (replace state) to avoid sticky errors on refresh
```

**Keep all existing behavior:**
- `useAuthStore()` hook usage
- Redirect if already authenticated
- clearError on unmount
- Form validation (trim check)
- sonner toasts
- Accessibility attributes (aria-required, aria-live, aria-busy, aria-describedby)

---

## Task 3: SSO Callback Page (AC: #4, #5, #6)

### Create `src/pages/SsoCallbackPage.tsx`

A minimal page that handles the redirect back from backend after SSO:

```tsx
// Flow:
// 1. Backend redirects to /sso/callback?success=true (cookies already set)
// 2. This page renders "Signing you in..." with loading spinner
// 3. Calls authStore.validateSession() to verify cookies and fetch user profile
// 4. On success → navigate to '/' (dashboard)
// 5. On failure → navigate to '/login?error=sso_failed'

// Key behavior:
// - Uses useEffect (run once on mount)
// - Shows full-screen centered loading state (spinner + text)
// - No user interaction needed — auto-redirect
// - 10-second timeout guard: if validateSession() takes too long, redirect to login with error
```

### Add `loginViaSSO()` to Auth Store (AC: #5)

Add a new action to `src/stores/authStore.ts`:

```typescript
// New action in AuthState interface:
loginViaSSO: () => Promise<boolean>;

// Implementation:
loginViaSSO: async () => {
  set({ isLoading: true, error: null });
  try {
    // Cookies are already set by the backend redirect
    // Validate by calling /auth/profile
    const profileRes = await apiFetch('/auth/profile');
    if (profileRes.ok) {
      const data = await profileRes.json();
      queryClient.clear();
      set({
        user: data.user || data,
        isAuthenticated: true,
        isLoading: false,
        sessionValidated: true,
      });
      return true;
    }
    throw new Error('Session validation failed');
  } catch {
    set({ isLoading: false, isAuthenticated: false });
    return false;
  }
},
```

**Why `loginViaSSO()` instead of reusing `validateSession()`?**
- `validateSession()` has a guard: `if (!state.isAuthenticated) { return false }` — at SSO callback time, `isAuthenticated` is still `false` in Zustand (cookies were just set by backend, but store doesn't know yet)
- `loginViaSSO()` skips that guard and directly calls `/auth/profile`

### Register Route in `App.tsx`

```tsx
const SsoCallbackPage = lazy(() =>
  import('@/pages/SsoCallbackPage').then((m) => ({ default: m.SsoCallbackPage }))
);

// Add to Routes (public — no ProtectedRoute wrapper):
<Route path="/sso/callback" element={<SsoCallbackPage />} />
```

---

## Task 4: Error Handling (AC: #7)

Error handling is split across two locations:

### A. Login Page (URL param errors)

Backend redirects to `/login?error=<code>` on SSO failures. Login page reads and displays:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  sso_cancelled: 'Sign-in was cancelled. Please try again.',
  sso_failed: 'Microsoft sign-in failed. Please try again or use email login.',
  account_disabled: 'Your account has been deactivated. Contact your administrator.',
  sso_invalid_token: 'Authentication error. Please try again.',
  sso_no_account: 'No account found. Contact your administrator.',
};
```

### B. SSO Callback Page (session validation failure)

If `loginViaSSO()` returns false or times out → redirect to `/login?error=sso_failed`.

### C. Network Error During SSO Button Click

The SSO button uses `window.location.href` (full page navigation), so network errors are handled by the browser natively. No special handling needed — browser shows its own error page.

---

## Task 5: Tests (AC: #10)

### Create `src/pages/LoginPage.test.tsx`

```typescript
// Test utilities needed:
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock authStore (Zustand)
vi.mock('@/stores/authStore');

// Mock sonner
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
```

**Required test cases:**

1. **SSO button renders with Microsoft branding**
   - Assert: button with text "Sign in with Microsoft" is visible
   - Assert: Microsoft logo SVG is present (by role or test-id)

2. **SSO button click triggers redirect**
   - Mock `window.location.href` setter
   - Click SSO button → assert `window.location.href` was set to `/api/auth/sso/login`

3. **SSO error from URL params displayed**
   - Render LoginPage with `?error=sso_cancelled` in URL
   - Assert: error message "Sign-in was cancelled" is visible

4. **Password login form still functional**
   - Type email + password → submit
   - Assert: `authStore.login()` called with correct args

5. **shadcn Input components rendered (P2-6 fix)**
   - Assert: email and password fields use shadcn styling classes (or just verify they render correctly)

6. **SSO button shows loading state**
   - After click, assert: button is disabled, text changed to "Redirecting..."

### Create `src/pages/SsoCallbackPage.test.tsx`

1. **Success flow: validates session and navigates to dashboard**
   - Mock `loginViaSSO()` → returns true
   - Assert: `navigate('/')` called

2. **Failure flow: navigates to login with error**
   - Mock `loginViaSSO()` → returns false
   - Assert: `navigate('/login?error=sso_failed')` called

3. **Loading state shown during validation**
   - Assert: "Signing you in" text visible on mount

---

## File Change Summary

| File | Type | Change |
|------|------|--------|
| `src/components/auth/MicrosoftSsoButton.tsx` | **New** | SSO button with Microsoft branding |
| `src/pages/LoginPage.tsx` | **Modify** | Add SSO button + separator + migrate to shadcn Input/Button/Label + SSO error display |
| `src/pages/SsoCallbackPage.tsx` | **New** | SSO callback handler — loading + validateSession + redirect |
| `src/stores/authStore.ts` | **Modify** | Add `loginViaSSO()` action |
| `src/App.tsx` | **Modify** | Add `/sso/callback` route |
| `src/pages/LoginPage.test.tsx` | **New** | 6 test cases |
| `src/pages/SsoCallbackPage.test.tsx` | **New** | 3 test cases |

---

## Verification Checklist

After implementation:

```bash
cd gcredit-project/frontend
npx vitest run 2>&1 | tail -20
```

Manual verification:
- [ ] Login page shows SSO button above email form with "or" separator
- [ ] SSO button has Microsoft 4-square logo + "Sign in with Microsoft" text
- [ ] Clicking SSO button → browser navigates to `/api/auth/sso/login`
- [ ] Email/password fields use shadcn `<Input>` (consistent with rest of app)
- [ ] Submit button uses shadcn `<Button>`
- [ ] Navigate to `/login?error=sso_cancelled` → shows friendly error message
- [ ] Navigate to `/sso/callback?success=true` → shows loading, then redirects to dashboard (requires backend running)
- [ ] Mobile responsive: SSO button full-width
- [ ] All existing password login behavior preserved
- [ ] All tests pass (new + existing)

---

## Architecture Notes

- **No `fetch` for SSO login initiation** — this is a full-page redirect (`window.location.href`), not an AJAX call. The backend handles the Azure AD redirect chain.
- **Cookies are already set** when user arrives at `/sso/callback` — the backend's `sso/callback` endpoint sets httpOnly cookies before redirecting to the frontend.
- **`loginViaSSO()` vs `validateSession()`** — see Task 3 for why we need a separate action.
- **No dark mode** — current app doesn't have dark mode. Only implement the light-theme Microsoft button variant. Add `// TODO: dark mode variant` comment for future.
- **P2-6 fix** — replacing native `<input>` with shadcn `<Input>` is part of this story per AC #8. Don't forget `<Label>` and `<Button>` too.
