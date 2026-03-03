# Dev Prompt: Story 15.1 — Dashboard Tabbed Composite View (TD-035-A)

## Overview

Replace the current role-switched stacked dashboard (`DashboardPage.tsx`) with a tabbed composite view using shadcn/ui `Tabs`. Each user sees tabs based on their dual-dimension permissions (role × isManager). Default tab is always "My Badges".

**Story file:** `docs/sprints/sprint-15/15-1-dashboard-composite-view.md`  
**Priority:** CRITICAL  
**Estimate:** 8h  
**Dependencies:** Story 15.2 (Permissions API) ✅ done, Story 15.3 (Sidebar) ✅ done

---

## Pre-requisites ✅

- shadcn/ui `Tabs` component already installed (Story 15.3): `src/components/ui/tabs.tsx`
- `computeDashboardTabs()` already exists in `src/utils/permissions.ts`
- `useIsManager()` hook already exists in `src/stores/authStore.ts`
- Backend `GET /api/users/me/permissions` already available (Story 15.2)
- All 4 dashboard sub-components exist and work: `EmployeeDashboard`, `ManagerDashboard`, `IssuerDashboard`, `AdminDashboard`
- Dashboard hooks already support `{ enabled?: boolean }`: `useManagerDashboard()`, `useIssuerDashboard()`, `useAdminDashboard()`

**No new packages to install.**

---

## Current Code Snapshot

### DashboardPage.tsx (REPLACE — current: 89 lines)

```tsx
// Current: role-based switch statement, renders stacked dashboards
// Location: src/pages/dashboard/DashboardPage.tsx

export const DashboardPage: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const role = user.role?.toUpperCase();

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard />;           // Admin only
    case 'ISSUER':
      return (
        <IssuerDashboard />                // Stacked:
        <EmployeeDashboard />              // Issuer + Employee
      );
    case 'EMPLOYEE':
    default:
      return (
        {user.isManager && <ManagerDashboard />}  // Conditional stack
        <EmployeeDashboard />
      );
  }
};
```

**Problem:** No tabs, stacked layout, no deep-linking, loads all data immediately.

### Target Architecture

```
┌─────────────────────────────────────────────────┐
│ [My Badges] [Team▾] [Issuance] [Administration] │ ← Tabs (permission-based)
├─────────────────────────────────────────────────┤
│                                                 │
│           Active Tab Content                    │ ← Only active tab fetches data
│           (all tabs mounted, CSS hidden)        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Tab-to-Component Mapping

| Tab ID | Tab Label | Component | Data Hook | Visible When |
|--------|-----------|-----------|-----------|-------------|
| `my-badges` | My Badges | `EmployeeDashboard` | `useEmployeeDashboard()` | Always |
| `team` | Team Overview | `ManagerDashboard` | `useManagerDashboard({ enabled })` | `isManager === true` |
| `issuance` | Issuance | `IssuerDashboard` | `useIssuerDashboard({ enabled })` | `role === 'ISSUER' \|\| role === 'ADMIN'` |
| `admin` | Administration | `AdminDashboard` | `useAdminDashboard({ enabled })` | `role === 'ADMIN'` |

---

## Key Architecture Decisions

### 1. Mount All + Gate Data (DEC-15-03)

**DO:** Mount all visible tab content on load. Hide non-active with CSS `display:none`.  
**DO NOT:** Use conditional rendering (`{activeTab === 'team' && <ManagerDashboard />}`).

Why: Preserves scroll position, DOM state, and prevents remounting when switching tabs.

**Data gating:** Each hook already accepts `{ enabled?: boolean }`. Pass `enabled: activeTab === tabId` so only the active tab triggers API calls.

```tsx
// CORRECT pattern:
<TabsContent value="team" forceMount className={activeTab !== 'team' ? 'hidden' : ''}>
  <ManagerDashboard />   {/* Hook inside receives enabled: activeTab === 'team' */}
</TabsContent>

// WRONG pattern (DO NOT USE):
{activeTab === 'team' && <TabsContent value="team"><ManagerDashboard /></TabsContent>}
```

**IMPORTANT:** The `forceMount` prop on `TabsContent` keeps the DOM mounted. Combined with `className="hidden"`, inactive tabs stay in DOM but invisible.

### 2. Hybrid Permission Computation (DEC-15-01)

1. **Immediate render** from JWT claims (via `useAuthStore`): `computeDashboardTabs(role, isManager)`
2. **Background verification** on mount: call `GET /api/users/me/permissions`
3. **If API differs from JWT** (stale token): update `authStore` state → tabs re-render automatically

```tsx
// Step 1: Immediate from JWT
const { user } = useAuthStore();
const isManager = useIsManager();
const role = user?.role ?? 'EMPLOYEE';
const tabs = computeDashboardTabs(role, isManager);

// Step 2: Background verification
const { data: apiPermissions } = useQuery({
  queryKey: ['permissions', 'me'],
  queryFn: () => apiFetchJson<UserPermissionsDto>('/users/me/permissions'),
  staleTime: 5 * 60 * 1000,
});

// Step 3: If API says different, update store
useEffect(() => {
  if (apiPermissions && (apiPermissions.role !== role || apiPermissions.isManager !== isManager)) {
    // Update authStore — this will cause re-render with correct tabs
    useAuthStore.getState().updatePermissions(apiPermissions);
  }
}, [apiPermissions, role, isManager]);
```

**NOTE:** Check if `updatePermissions` method exists in `authStore.ts`. If not, create it or use `setState` directly.

### 3. URL Deep-Link via `?tab=` (REC-15.1-004)

- On load: read `?tab=` from URL search params. If valid tab and user has permission, use it as initial tab.
- On tab click: update URL with `?tab=<id>` using `searchParams.set()` + `navigate({ search }, { replace: true })`.
- **`replace: true`** is critical — tab clicks should NOT push browser history entries.

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const initialTab = searchParams.get('tab');

// Validate: only use if tab is in user's visible set
const defaultTab = tabs.includes(initialTab as DashboardTab) ? initialTab! : 'my-badges';

const handleTabChange = (value: string) => {
  setActiveTab(value);
  setSearchParams({ tab: value }, { replace: true });
};
```

### 4. Mobile Horizontal Scroll (REC-15.1-003)

On mobile (<768px), the `TabsList` should horizontally scroll if tabs overflow. Add a fade indicator.

```tsx
<TabsList className="w-full justify-start overflow-x-auto md:justify-center">
  {/* Tab triggers — will scroll horizontally on mobile */}
</TabsList>
```

CSS for fade indicator (add to `index.css`):

```css
/* === Dashboard Tabs Mobile Scroll — Story 15.1 (REC-15.1-003) === */
@media (max-width: 767px) {
  [data-dashboard-tabs] {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  [data-dashboard-tabs]::-webkit-scrollbar {
    display: none;
  }
}
```

### 5. No Fixed Height (MEDIUM-15.1-002)

Tab container uses natural content height. **DO NOT** set `min-height` or `height` on `TabsContent`.

---

## Implementation Template

### New DashboardPage.tsx

```tsx
/**
 * DashboardPage — Story 15.1 (TD-035-A)
 *
 * Tabbed composite dashboard. Shows tabs based on dual-dimension
 * permissions (role × isManager). Default tab: "My Badges" (DEC-016-01).
 *
 * - All visible tabs mounted, non-active hidden via CSS (DEC-15-03)
 * - Data gated by React Query `enabled` flag (MEDIUM-15.1-001)
 * - Hybrid permission: JWT instant + API background verify (DEC-15-01)
 * - URL deep-link via ?tab= param (REC-15.1-004)
 *
 * @see ADR-016 DEC-016-01
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore, useIsManager } from '@/stores/authStore';
import { computeDashboardTabs, type DashboardTab } from '@/utils/permissions';
import { apiFetchJson } from '@/lib/apiFetch';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { IssuerDashboard } from './IssuerDashboard';
import { AdminDashboard } from './AdminDashboard';

/** Tab metadata: label for display */
const TAB_LABELS: Record<DashboardTab, string> = {
  'my-badges': 'My Badges',
  team: 'Team Overview',
  issuance: 'Issuance',
  admin: 'Administration',
};

export const DashboardPage: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const isManager = useIsManager();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Loading / Auth guard (keep existing pattern) ---
  if (isLoading) return <PageLoader text="Loading..." />;
  if (!isAuthenticated || !user) {
    return <ErrorDisplay title="Not Authenticated" message="Please log in." variant="page" />;
  }

  const role = (user.role ?? 'EMPLOYEE') as 'EMPLOYEE' | 'ISSUER' | 'ADMIN';
  const visibleTabs = computeDashboardTabs(role, isManager);

  // --- URL deep-link (REC-15.1-004) ---
  const urlTab = searchParams.get('tab');
  const defaultTab = visibleTabs.includes(urlTab as DashboardTab) ? urlTab! : 'my-badges';
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true }); // No history push
  };

  // --- Background permission verification (DEC-15-01) ---
  // TODO: Implement useQuery for /users/me/permissions + stale check

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList
        className="w-full justify-start overflow-x-auto md:justify-center"
        data-dashboard-tabs
      >
        {visibleTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="min-w-[100px]">
            {TAB_LABELS[tab]}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Mount ALL visible tabs, hide non-active (DEC-15-03) */}
      {visibleTabs.includes('my-badges') && (
        <TabsContent value="my-badges" forceMount className={activeTab !== 'my-badges' ? 'hidden' : ''}>
          <ErrorBoundary>
            <EmployeeDashboard />
          </ErrorBoundary>
        </TabsContent>
      )}

      {visibleTabs.includes('team') && (
        <TabsContent value="team" forceMount className={activeTab !== 'team' ? 'hidden' : ''}>
          <ErrorBoundary>
            <ManagerDashboard />
          </ErrorBoundary>
        </TabsContent>
      )}

      {visibleTabs.includes('issuance') && (
        <TabsContent value="issuance" forceMount className={activeTab !== 'issuance' ? 'hidden' : ''}>
          <ErrorBoundary>
            <IssuerDashboard />
          </ErrorBoundary>
        </TabsContent>
      )}

      {visibleTabs.includes('admin') && (
        <TabsContent value="admin" forceMount className={activeTab !== 'admin' ? 'hidden' : ''}>
          <ErrorBoundary>
            <AdminDashboard />
          </ErrorBoundary>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default DashboardPage;
```

---

## Data Gating Pattern (MEDIUM-15.1-001)

The existing dashboard hooks already accept `{ enabled?: boolean }`. The challenge is: each sub-dashboard component internally calls its own hook without passing `enabled`.

**Two approaches (choose one):**

### Option A: Pass `enabled` prop to sub-dashboards

Add an `enabled` prop to `EmployeeDashboard`, `ManagerDashboard`, etc., and forward it to the hook:

```tsx
// In ManagerDashboard.tsx:
export const ManagerDashboard: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const { data, isLoading, error, refetch, isFetching } = useManagerDashboard({ enabled });
  // ...
};
```

Then in DashboardPage:
```tsx
<ManagerDashboard enabled={activeTab === 'team'} />
```

### Option B: Use React Context for active tab

Create a `DashboardTabContext` that sub-dashboards read to determine if they should fetch.

**Recommendation:** Option A is simpler and more explicit. Only 3 components need the `enabled` prop (`ManagerDashboard`, `IssuerDashboard`, `AdminDashboard`). `EmployeeDashboard` always fetches (my-badges is the default tab and always shown).

---

## Existing Hook Signatures (for reference)

```typescript
// src/hooks/useDashboard.ts — already supports enabled
export function useEmployeeDashboard()                         // No enabled (always fetches)
export function useIssuerDashboard(options?: { enabled?: boolean })
export function useManagerDashboard(options?: { enabled?: boolean })
export function useAdminDashboard(options?: { enabled?: boolean })
```

---

## Routing Changes (App.tsx)

The `DashboardPage` route at `/` stays the same. **No routing changes needed.** The route already renders:

```tsx
<Route path="/" element={
  <ProtectedRoute>
    <Layout pageTitle="Dashboard">
      <DashboardPage />
    </Layout>
  </ProtectedRoute>
} />
```

The old role-based routing logic was entirely inside `DashboardPage.tsx` (the `switch` statement). That's what gets replaced by tabs. No changes to `App.tsx` are needed.

---

## Permissions API Response Shape (for verification hook)

```typescript
// Backend response from GET /api/users/me/permissions
interface UserPermissionsDto {
  role: 'EMPLOYEE' | 'ISSUER' | 'ADMIN';
  isManager: boolean;
  dashboardTabs: string[];   // ['my-badges', 'team', 'issuance']
  sidebarGroups: string[];   // ['base', 'team', 'issuance']
  permissions: {
    canViewTeam: boolean;
    canIssueBadges: boolean;
    canManageUsers: boolean;
  };
}
```

---

## Execution Order (10 steps)

1. **Modify ManagerDashboard, IssuerDashboard, AdminDashboard** — add `enabled` prop, forward to hook
2. **Rewrite DashboardPage.tsx** — replace switch with Tabs + forceMount + CSS hidden
3. **Add deep-link support** — `useSearchParams` for `?tab=` param
4. **Add background permission verification** — `useQuery` for `/users/me/permissions`
5. **Add mobile scroll CSS** — append to `index.css` (REC-15.1-003)
6. **Verify no App.tsx changes needed** — route untouched
7. **Write DashboardPage tests** — 6 role×manager tab visibility combos
8. **Write tab switching tests** — active state, hidden class, deep-link
9. **Run full test suite** — `npx vitest run` must pass all existing + new tests
10. **TypeScript check** — `npx tsc --noEmit` must pass

---

## Test Strategy

### Unit Tests (DashboardPage.test.tsx)

```typescript
describe('DashboardPage', () => {
  describe('Tab Visibility (6 combinations)', () => {
    // EMPLOYEE + false → [My Badges]
    // EMPLOYEE + true  → [My Badges, Team Overview]
    // ISSUER  + false → [My Badges, Issuance]
    // ISSUER  + true  → [My Badges, Team Overview, Issuance]
    // ADMIN   + false → [My Badges, Issuance, Administration]
    // ADMIN   + true  → [My Badges, Team Overview, Issuance, Administration]
  });

  describe('Default Tab', () => {
    // Always "My Badges" regardless of role
    // URL ?tab=issuance → Issuance tab if user has permission
    // URL ?tab=admin → falls back to My Badges if EMPLOYEE
  });

  describe('Tab Switching', () => {
    // Active tab content visible, others have 'hidden' class
    // URL updates with replace: true (no history push)
  });

  describe('Data Gating', () => {
    // Only active tab's hook called with enabled: true
    // Switching tab toggles enabled flag
  });
});
```

### Mock Pattern (reuse from AppSidebar.test.tsx)

```typescript
function setAuthState(role: UserRole, isManager: boolean) {
  useAuthStore.setState({
    user: {
      id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User',
      role, isManager,
    },
    isAuthenticated: true,
  });
}
```

---

## What NOT to Change

| File/Area | Reason |
|-----------|--------|
| `App.tsx` routes | Route structure unchanged |
| `utils/permissions.ts` | Shared logic, already has `computeDashboardTabs()` |
| `stores/authStore.ts` | May need `updatePermissions()` but check first |
| `EmployeeDashboard.tsx` | No `enabled` prop needed (always active) |
| Sidebar components | Story 15.3 done, don't touch |
| Backend | No backend changes |

---

## References

- **ADR-016 DEC-016-01:** Default tab, tab visibility matrix
- **DEC-15-01:** Hybrid permission (JWT + API)
- **DEC-15-03:** Mount all + CSS hide + React Query enabled gate
- **MEDIUM-15.1-001:** React Query `enabled` to avoid 4× parallel fetches
- **MEDIUM-15.1-002:** Natural scroll height, no fixed height
- **REC-15.1-003:** Mobile horizontal scroll
- **REC-15.1-004:** URL `?tab=` deep-link, no history push
- **CRITICAL-15.1-002:** Stacked → tabbed is intentional UX improvement
- Story 15.2: Permissions API (done)
- Story 15.3: Sidebar + Tabs installed (done)
- Sprint 14 Story 14.8: 6-combo test matrix pattern
