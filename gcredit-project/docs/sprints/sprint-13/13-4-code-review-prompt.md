# Code Review: Story 13.4 — Login Page Dual Entry + SSO Redirect Flow

**Story:** 13.4 — Login Page Dual Entry (SSO + Email/Password)  
**Sprint:** 13  
**Commits:** `ab10830` (feat) + `c5d191e` (fix: remove unused React import)  
**Base:** `73a4b9d` (13.3 acceptance)  
**Branch:** `sprint-13/sso-session-management`  
**Frontend Test Results:** 751 passed, 0 failures  
**New Tests:** 13 (10 LoginPage + 3 SsoCallbackPage)

---

## Summary of Changes

Story 13.4 redesigns the login page with a dual-entry pattern: Microsoft SSO as the primary CTA, followed by email/password as a secondary option. Also migrates native HTML elements to shadcn/ui (P2-6 cleanup).

1. **MicrosoftSsoButton** (new) — Microsoft-branded SSO button following identity guidelines. White bg, 4-square logo SVG, loading/redirect state.
2. **LoginPage** (rewrite) — SSO button at top + "or" separator + shadcn `<Input>/<Label>/<Button>` replacing native elements. SSO error display from URL params.
3. **SsoCallbackPage** (new) — Handles `/sso/callback?success=true` redirect. Shows loading spinner, calls `loginViaSSO()`, navigates to dashboard or redirects back to login with error.
4. **authStore** — New `loginViaSSO()` action that bypasses `validateSession()`'s `isAuthenticated` guard by going straight to `/auth/profile`.
5. **App.tsx** — Added `/sso/callback` route (lazy-loaded, public).

---

## Files Changed (5 production + 2 test + 3 docs)

| File | Type | Changes |
|------|------|---------|
| `src/components/auth/MicrosoftSsoButton.tsx` | New Component | +90 lines |
| `src/pages/LoginPage.tsx` | Rewrite | +102/−93 lines |
| `src/pages/SsoCallbackPage.tsx` | New Page | +82 lines |
| `src/stores/authStore.ts` | Modified | +26 lines |
| `src/App.tsx` | Modified | +4 lines |
| `src/pages/LoginPage.test.tsx` | New Test | +162 lines |
| `src/pages/SsoCallbackPage.test.tsx` | New Test | +74 lines |
| `docs/sprints/sprint-13/13-4-login-page-dual-entry.md` | Doc | Updated with implementation record |
| `docs/sprints/sprint-13/13-4-dev-prompt.md` | Doc | Dev prompt (new) |
| `docs/sprints/sprint-13/sprint-status.yaml` | Doc | Status update |

---

## Production Code Diff: `MicrosoftSsoButton.tsx` (new)

```tsx
/**
 * Microsoft SSO Button - Story 13.4: Login Page Dual Entry
 *
 * Follows Microsoft identity branding guidelines:
 * https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps
 *
 * Light theme: white background (#FFFFFF), dark text (#2F2F2F), 1px #8C8C8C border
 * // TODO: dark mode variant
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

const MicrosoftLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="21"
    height="21"
    viewBox="0 0 21 21"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-[#2F2F2F]"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

interface MicrosoftSsoButtonProps {
  className?: string;
  disabled?: boolean;
}

export function MicrosoftSsoButton({ className, disabled }: MicrosoftSsoButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = () => {
    if (isRedirecting || disabled) return;
    setIsRedirecting(true);
    window.location.href = '/api/auth/sso/login';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRedirecting || disabled}
      aria-label="Sign in with Microsoft"
      className={cn(
        'flex items-center justify-center gap-3 w-full px-6 py-3',
        'bg-white text-[#2F2F2F] border border-[#8C8C8C] rounded-md',
        'text-sm font-semibold',
        'hover:bg-neutral-50 active:bg-neutral-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
    >
      {isRedirecting ? (
        <>
          <LoadingSpinner />
          <span>Redirecting…</span>
        </>
      ) : (
        <>
          <MicrosoftLogo />
          <span>Sign in with Microsoft</span>
        </>
      )}
    </button>
  );
}
```

---

## Production Code Diff: `LoginPage.tsx` (rewrite)

```diff
-/**
- * Login Page - Story 0.2a: Login & Navigation System
+/**
+ * Login Page - Story 0.2a / Story 13.4: Dual Entry (SSO + Email/Password)
  * Story 8.3: WCAG 2.1 AA Accessibility
  *
- * Minimal login page for UAT testing.
- * Features: email/password form, error handling, redirect on success.
+ * Features:
+ * - "Sign in with Microsoft" SSO button (primary CTA)
+ * - Email/password form with shadcn/ui components (P2-6 fix)
+ * - SSO error display from URL params
+ * - Redirect on success, sonner toasts, full accessibility
  */

 import React, { useState, useEffect } from 'react';
-import { useNavigate, useLocation } from 'react-router-dom';
+import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
 import { toast } from 'sonner';
 import { useAuthStore } from '../stores/authStore';
+import { MicrosoftSsoButton } from '../components/auth/MicrosoftSsoButton';
+import { Input } from '../components/ui/input';
+import { Button } from '../components/ui/button';
+import { Label } from '../components/ui/label';
+
+/** SSO error codes → user-friendly messages */
+const SSO_ERROR_MESSAGES: Record<string, string> = {
+  sso_cancelled: 'Sign-in was cancelled. Please try again.',
+  sso_failed: 'Microsoft sign-in failed. Please try again or use email login.',
+  account_disabled: 'Your account has been deactivated. Contact your administrator.',
+  sso_invalid_token: 'Authentication error. Please try again.',
+  sso_no_account: 'No account found. Contact your administrator.',
+};

 export function LoginPage() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const navigate = useNavigate();
   const location = useLocation();
+  const [searchParams, setSearchParams] = useSearchParams();

   const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();

+  // SSO error from URL params — capture once on mount, then clear URL
+  const [ssoError] = useState(() => {
+    const errorCode = searchParams.get('error');
+    return errorCode
+      ? SSO_ERROR_MESSAGES[errorCode] || 'An unexpected error occurred. Please try again.'
+      : null;
+  });
+
+  // Clear URL error params after capturing (avoid sticky errors on refresh)
+  useEffect(() => {
+    if (searchParams.has('error')) {
+      setSearchParams({}, { replace: true });
+    }
+  }, []); // eslint-disable-line react-hooks/exhaustive-deps
+
   // Redirect if already authenticated
   useEffect(() => { ... /* unchanged */ });

   // Clear error on unmount
   useEffect(() => { ... /* unchanged */ });

+  const displayError = ssoError || error;
+
   const handleSubmit = async (e: React.FormEvent) => { ... /* unchanged */ };

   return (
     <main ...>
       <div ...>
         <div className="bg-white rounded-lg shadow-elevation-4 p-8">
           <h2 ...>Sign In</h2>

-          {error && (
+          {displayError && (
             <div id="login-error" ... role="alert" aria-live="assertive">
-              {error}
+              {displayError}
             </div>
           )}

+          {/* Primary CTA: Microsoft SSO */}
+          <MicrosoftSsoButton disabled={isLoading} />
+
+          {/* Visual Separator */}
+          <div className="relative my-6">
+            <div className="absolute inset-0 flex items-center">
+              <span className="w-full border-t border-neutral-300" />
+            </div>
+            <div className="relative flex justify-center text-xs uppercase">
+              <span className="bg-white px-2 text-neutral-500">or sign in with email</span>
+            </div>
+          </div>

           <form
             onSubmit={handleSubmit}
-            aria-describedby={error ? 'login-error' : undefined}
+            aria-describedby={displayError ? 'login-error' : undefined}
           >
-            <div>
-              <label htmlFor="email" ...>Email Address</label>
-              <input id="email" type="email" ... className="w-full px-3 py-2 ..." />
+            <div className="space-y-1.5">
+              <Label htmlFor="email">Email Address</Label>
+              <Input id="email" type="email" ... aria-required="true" />
             </div>

-            <div>
-              <label htmlFor="password" ...>Password</label>
-              <input id="password" type="password" ... className="w-full px-3 py-2 ..." />
+            <div className="space-y-1.5">
+              <Label htmlFor="password">Password</Label>
+              <Input id="password" type="password" ... aria-required="true" />
             </div>

-            <button type="submit" ... className="w-full py-2 px-4 ...">
+            <Button type="submit" ... className="w-full" size="lg">
               {isLoading ? <span ...>Signing in…</span> : 'Sign In'}
-            </button>
+            </Button>
           </form>
```

Key changes: shadcn `<Input>`, `<Label>`, `<Button>` replace native elements. SSO error captured from `?error=` URL param on mount via lazy `useState` initializer, URL cleaned immediately via `setSearchParams`.

---

## Production Code Diff: `SsoCallbackPage.tsx` (new)

```tsx
/**
 * SSO Callback Page - Story 13.4: Login Page Dual Entry
 *
 * Flow:
 * 1. Backend redirects to /sso/callback?success=true (cookies already set)
 * 2. Shows "Signing you in..." loading state
 * 3. Calls authStore.loginViaSSO() to validate cookies and fetch user profile
 * 4. On success → navigate to '/' (dashboard)
 * 5. On failure → navigate to '/login?error=sso_failed'
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const SSO_TIMEOUT_MS = 10_000;

export function SsoCallbackPage() {
  const navigate = useNavigate();
  const loginViaSSO = useAuthStore((s) => s.loginViaSSO);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const timeoutId = setTimeout(() => {
      navigate('/login?error=sso_failed', { replace: true });
    }, SSO_TIMEOUT_MS);

    loginViaSSO()
      .then((success) => {
        clearTimeout(timeoutId);
        if (success) {
          navigate('/', { replace: true });
        } else {
          navigate('/login?error=sso_failed', { replace: true });
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        navigate('/login?error=sso_failed', { replace: true });
      });

    return () => clearTimeout(timeoutId);
  }, [loginViaSSO, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <svg className="animate-spin h-12 w-12 text-brand-600" ...>
            <circle ... />
            <path ... />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">Signing you in…</h1>
        <p className="text-neutral-500 mt-2">Please wait while we verify your account.</p>
      </div>
    </main>
  );
}

export default SsoCallbackPage;
```

---

## Production Code Diff: `authStore.ts`

```diff
 interface AuthState {
   ...
+  // SSO login (validates cookies set by backend SSO redirect)
+  loginViaSSO: () => Promise<boolean>;
+
   // Session validation (verifies cookie validity on app startup)
   sessionValidated: boolean;
   ...
 }

 // Inside create<AuthState>():
+      // SSO login: cookies already set by backend redirect, validate and fetch profile
+      loginViaSSO: async () => {
+        set({ isLoading: true, error: null });
+        try {
+          const profileRes = await apiFetch('/auth/profile');
+          if (profileRes.ok) {
+            const data = await profileRes.json();
+            queryClient.clear();
+            set({
+              user: data.user || data,
+              isAuthenticated: true,
+              isLoading: false,
+              sessionValidated: true,
+            });
+            return true;
+          }
+          throw new Error('Session validation failed');
+        } catch {
+          set({ isLoading: false, isAuthenticated: false });
+          return false;
+        }
+      },
```

---

## Production Code Diff: `App.tsx`

```diff
 const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
+const SsoCallbackPage = lazy(() =>
+  import('@/pages/SsoCallbackPage').then((m) => ({ default: m.SsoCallbackPage }))
+);

   <Routes>
     {/* Public Routes */}
     <Route path="/login" element={<LoginPage />} />
+    <Route path="/sso/callback" element={<SsoCallbackPage />} />
```

---

## Test Diff: `LoginPage.test.tsx` (new, 162 lines, 10 tests)

| Test | What it verifies |
|------|------------------|
| `renders SSO button with Microsoft branding` | Button exists, has SVG logo |
| `SSO button click triggers redirect to /api/auth/sso/login` | `window.location.href` set correctly |
| `SSO button shows loading state after click` | "Redirecting" text, button disabled |
| `displays SSO error from URL params (sso_cancelled)` | Error alert with correct message |
| `displays SSO error from URL params (account_disabled)` | Error alert with correct message |
| `renders email and password fields with shadcn Input components` | Inputs exist, tagName is INPUT |
| `renders visual separator between SSO and email form` | "or sign in with email" text |
| `password login form calls authStore.login()` | `login()` called with email/password |
| `displays auth store error` | Error alert shows store error |
| `redirects if already authenticated` | `navigate('/')` called |

## Test Diff: `SsoCallbackPage.test.tsx` (new, 74 lines, 3 tests)

| Test | What it verifies |
|------|------------------|
| `shows loading state during validation` | "Signing you in" + "Please wait" visible |
| `navigates to dashboard on successful SSO validation` | `navigate('/', { replace: true })` |
| `navigates to login with error on failed SSO validation` | `navigate('/login?error=sso_failed', { replace: true })` |

---

## Acceptance Criteria Coverage

| AC | Description | Implementation | Test Coverage |
|----|-------------|----------------|---------------|
| 1 | Microsoft branded SSO button | `MicrosoftSsoButton.tsx` — logo SVG, #FFF/#2F2F2F/#8C8C8C | ✓ renders SSO button |
| 2 | Email/password below SSO + separator | LoginPage "or sign in with email" | ✓ separator test |
| 3 | SSO button → `GET /api/auth/sso/login` | `window.location.href = '/api/auth/sso/login'` | ✓ redirect test |
| 4 | SSO callback page handles redirect | `SsoCallbackPage.tsx` reads success, calls loginViaSSO | ✓ success/failure tests |
| 5 | `loginViaSSO()` action | `authStore.ts` calls `/auth/profile` | ✓ indirect via callback tests |
| 6 | Loading state during SSO flow | Button: "Redirecting…", Callback: "Signing you in…" | ✓ loading tests |
| 7 | Error handling (SSO errors) | `SSO_ERROR_MESSAGES` map + URL param extraction | ✓ sso_cancelled, account_disabled |
| 8 | shadcn/ui `<Input>` replacing native | `<Input>`, `<Label>`, `<Button>` from shadcn | ✓ tagName is INPUT |
| 9 | Responsive: full-width mobile | `w-full` on SSO button | ✓ implicit (CSS) |
| 10 | Tests | 13 tests across 2 suites | ✓ 751 total pass |

---

## Review Checklist

### Correctness
- [ ] `MicrosoftSsoButton`: `handleClick` sets `isRedirecting` then assigns `window.location.href` — is there a race between React re-render and navigation? Could `isRedirecting` fail to show the "Redirecting" state?
- [ ] `MicrosoftSsoButton`: After redirect and browser back-button, `isRedirecting` state could be `true` (stuck). Is this handled?
- [ ] `LoginPage`: `useState(() => searchParams.get('error'))` — lazy initializer captures SSO error. If component remounts (React strict mode), does this still work correctly?
- [ ] `LoginPage`: `useEffect` clears `searchParams` on mount — `eslint-disable-line react-hooks/exhaustive-deps` suppression. Is it correct to omit `searchParams` and `setSearchParams` from deps?
- [ ] `LoginPage`: `displayError = ssoError || error` — SSO error takes priority. Should SSO error be cleared when user starts typing (currently only `clearError()` clears store error, not ssoError)?
- [ ] `SsoCallbackPage`: `hasRun` ref prevents double execution in StrictMode — verify this pattern is correct.
- [ ] `SsoCallbackPage`: 10s timeout navigates to `/login?error=sso_failed` — is the timeout cleaned up correctly on unmount? On success?
- [ ] `SsoCallbackPage`: Does not read `?success=true` param — the page just calls `loginViaSSO()` regardless. Is this intentional?
- [ ] `authStore.loginViaSSO`: `data.user || data` — why the fallback? Is `/auth/profile` response shape inconsistent?
- [ ] `authStore.loginViaSSO`: `queryClient.clear()` — same as `login()` action? Verify no stale cache from pre-SSO state.
- [ ] `authStore.loginViaSSO`: Only sets `isLoading: false` in success path via `set()` — in catch block, `isLoading: false` is also set. Confirm both paths covered.

### Security
- [ ] `MicrosoftSsoButton`: Redirect via `window.location.href` to relative path `/api/auth/sso/login` — safe from open redirect? (Yes, relative path)
- [ ] `SsoCallbackPage`: Is it safe as a public route? Could an attacker visit `/sso/callback` directly without SSO flow? (`loginViaSSO` would fail, redirect to login — acceptable)
- [ ] `LoginPage`: SSO error messages — do any leak internal details? (Review `SSO_ERROR_MESSAGES` values)
- [ ] URL param error handling: Are there any XSS risks from reading `searchParams.get('error')` and mapping to a known set? (Safe — only mapped to static strings)

### UX / Accessibility
- [ ] `MicrosoftSsoButton`: `aria-label="Sign in with Microsoft"` — redundant with visible text? (Acceptable, reinforces intent)
- [ ] `MicrosoftSsoButton`: Microsoft logo uses `aria-hidden="true"` — correct since text label exists
- [ ] `LoginPage`: `role="alert"` + `aria-live="assertive"` on error div — correct for SSO error announcement?
- [ ] `LoginPage`: Form `aria-describedby` updated to use `displayError` — verify screen reader flow
- [ ] `LoginPage`: shadcn `<Label>` still associated with inputs via `htmlFor`? (Yes, `<Label htmlFor="email">`)
- [ ] `SsoCallbackPage`: No explicit `role` or `aria-live` — is the loading state announced to screen readers?

### Microsoft Branding Compliance
- [ ] Logo: 4 colored squares (red #f25022, blue #00a4ef, green #7fba00, yellow #ffb900) — verify against official brand assets
- [ ] Button text: "Sign in with Microsoft" — matches official required wording?
- [ ] Button styling: white bg, #2F2F2F text, #8C8C8C border — matches light theme spec?
- [ ] Button minimum size / padding requirements met?

### Testing Gaps
- [ ] Is there a test for unknown error code in URL (e.g., `?error=unknown_code` → generic message)?
- [ ] Is there a test for the `SsoCallbackPage` timeout scenario (10s)?
- [ ] Is there a test for `loginViaSSO()` throwing an exception (network error)?
- [ ] Is there a test for the SSO button's disabled state when `isLoading` is already true?
- [ ] Is there a test that verifies URL params are cleared after SSO error display?
- [ ] Is there a test for `loginViaSSO()` in authStore directly (unit test)?

### Code Quality
- [ ] `React` import in LoginPage (`import React, { useState, useEffect } from 'react'`) — is it needed? (JSX transform should handle it)
- [ ] `SsoCallbackPage` has both named and default export — intentional for lazy loading?
- [ ] `MicrosoftSsoButton` has only named export — consistent with project patterns?
- [ ] Inline SVGs in `MicrosoftSsoButton` and `SsoCallbackPage` — should spinner SVG be extracted to shared component?

---

## How to Review

```bash
# See the full diff
cd gcredit-project
git diff 73a4b9d c5d191e

# Run only affected tests
cd frontend
npx vitest run src/pages/LoginPage.test.tsx src/pages/SsoCallbackPage.test.tsx

# Run all frontend tests
npx vitest run
```

---

## Output Format

Please produce your review as `13-4-code-review-result.md` with:
1. **Verdict**: Approved / Approved with Notes / Changes Requested
2. **Findings**: Each finding with severity (CRITICAL / MAJOR / MINOR / NIT) and file:line reference
3. **Fixes Applied**: If you fix anything, list the commit SHA
