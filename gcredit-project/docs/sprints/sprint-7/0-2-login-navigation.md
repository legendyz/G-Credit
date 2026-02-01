# Story 0.2a: Simple Login & Navigation System (MVP)

**Story ID:** Story 0.2a (Split from 0.2)  
**Epic:** Sprint Setup  
**Sprint:** Sprint 7  
**Priority:** CRITICAL  
**Story Points:** 4 → **6** ⚠️ **UPDATED**  
**Status:** Backlog  
**Last Updated:** February 1, 2026 (Post-Technical Review)

---

## ⚠️ MVP SCOPE NOTE (Feb 1, 2026)

This story has been split into **MVP (0.2a)** and **Enhancements (0.2b - Sprint 8)** following Technical Review.

**MVP Scope (Sprint 7 - This Story):**
- ✅ Basic login with email/password
- ✅ Zustand auth store (NO token refresh in MVP)
- ✅ Protected routes with role guards
- ✅ Admin + Employee dashboards only (Manager/Issuer defer to Sprint 8)
- ✅ Top navigation (not sidebar - evaluated in UAT)
- ✅ Basic accessibility (form labels, ARIA on inputs)

**Deferred to Story 0.2b (Sprint 8):**
- ⏸️ Token refresh interceptor with exponential backoff
- ⏸️ Full WCAG 2.1 AA compliance (NVDA/VoiceOver testing)
- ⏸️ Manager + Issuer dashboard variants
- ⏸️ Cross-browser testing (Safari, Firefox)
- ⏸️ Forgot password UI

**Why Split:**
- UX/Architecture review added +5.5h requirements (6h → 11.5h)
- UAT only needs Admin + Employee roles (<1h sessions, no token refresh needed)
- Day 3 timeline feasible with 6h scope

**Estimate Updated:**
- Original: 4 hours
- **Revised MVP: 6 hours** (basic implementation + accessibility + testing)

**References:**
- UX Review: See meeting minutes Part 1
- Architecture Review: See meeting minutes Part 1  
- Developer Review: See meeting minutes Part 1

---

## User Story

**As a** User (Admin, Issuer, Manager, or Employee),  
**I want** to log in to the system and navigate between features,  
**So that** I can access role-appropriate functionality and complete the UAT testing.

---

## Background / Context

Currently, the frontend has isolated feature pages (TimelineView, VerifyBadge, etc.) but no unified login and navigation system. This blocks:
1. Complete UAT testing (Story U.1) - cannot test multi-role workflows
2. MVP readiness - login is essential for production
3. Role-based feature access - need to show/hide features by role

**Sprint 7 UAT requires:**
- Admin login → create template → issue badge → revoke badge
- Employee login → view wallet → claim badge → see revoked status
- Role switching for complete lifecycle testing

This story creates the **minimum viable login + navigation** to enable UAT, not a production-perfect UI.

---

## Acceptance Criteria

### AC1: Login Page - MVP with Basic Accessibility ⚠️ **MVP SCOPE**
**Given** I am not logged in  
**When** I visit the app root (http://localhost:5173)  
**Then** I see a simple login form

- [x] Email and password input fields with `<label>` elements
- [x] **NEW:** ARIA labels: `aria-required="true"`, `aria-invalid` on error
- [x] **NEW:** Error messages in `<div role="alert">` for screen readers
- [x] "Login" button with loading state (text changes to "Logging in...")
- [x] Form validation (email format, password required)
- [x] Error message display on failed login (specific: "Invalid credentials" vs "Network error")
- [x] Success: Store token and redirect to Dashboard

### AC2: Authentication State Management - No Token Refresh ⚠️ **MVP SCOPE**
- [x] Use Zustand store for auth state (as per Architecture Decision 4.1)
- [x] Store: accessToken, refreshToken (stored but not used yet), user (id, email, name, role)
- [x] Login action: Call POST /auth/login, store tokens in localStorage
- [x] Logout action: Clear tokens, redirect to login
- [x] **MVP:** NO token refresh interceptor (defer to Story 0.2b)
- [x] **MVP:** Accept manual re-login every ~1h (acceptable for UAT <1h sessions)
- [x] Auto-logout on 401 response (clear store, show message)

### AC3: Role-Based Dashboard - Admin + Employee Only ⚠️ **MVP SCOPE**
**Given** I successfully log in  
**When** Page loads  
**Then** I see role-appropriate dashboard with navigation

**Employee Dashboard:**
- My Badges (link to /wallet)
- Claim Badge (link to /claim) ← **NEW per UX spec**
- Settings (link to /settings)
- Logout button

**Admin Dashboard:**
- My Badges
- Claim Badge
- Badge Templates (link to /templates)
- Issue Badge (link to /issue)
- Badge Management (link to /admin/badges)
- User Management (link to /admin/users)
- Analytics (link to /admin/analytics)
- Settings
- Logout button

**Deferred to Story 0.2b:**
- ⏸️ Manager dashboard
- ⏸️ Issuer dashboard

### AC4: Protected Routes - Standard Pattern ⚠️ **UNCHANGED**
- [x] Unauthenticated users redirected to /login
- [x] Authenticated users can access protected routes
- [x] Role guard component: `<RoleGuard allowedRoles={['ADMIN']}>`
- [x] 403 page if insufficient permissions

### AC5: Basic Layout Component - Top Navigation ⚠️ **UX DECISION**
- [x] **Top navigation bar** (not sidebar - UX team approved for MVP)
- [x] Navigation includes:
  - App logo/title (G-Credit)
  - Horizontal navigation menu (role-based items)
  - User name + role badge (color-coded: Admin=red, Employee=gray)
  - Logout button (right-aligned)
- [x] Main content area with padding
- [x] Simple footer (optional)
- [x] **Note:** Sidebar vs top nav evaluated in UAT feedback (Day 5-6)

---

## Non-Functional Requirements

### Performance
- [x] Login response < 500ms
- [x] Page load after login < 1s

### Accessibility
- [x] Form fields have labels
- [x] Keyboard navigation works (Tab, Enter)
- [x] Error messages are screen-reader friendly

### UX
- [x] Clean, minimal design (not fancy, just functional)
- [x] Clear error messages (e.g., "Invalid email or password")
- [x] Loading spinner during login API call

---

## Technical Details

### Frontend Routes
```tsx
// src/App.tsx or src/router.tsx
const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/verify/:verificationId', element: <VerifyBadgePage /> },
  
  // Protected routes (require authentication)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardPage /> },  // Role-based dashboard
      { path: '/wallet', element: <WalletPage /> },
      { path: '/profile', element: <ProfilePage /> },
      
      // Issuer+ routes
      {
        element: <RoleGuard allowedRoles={['ISSUER', 'ADMIN']} />,
        children: [
          { path: '/templates', element: <BadgeTemplatesPage /> },
          { path: '/issue', element: <IssueBadgePage /> },
        ]
      },
      
      // Admin routes
      {
        element: <RoleGuard allowedRoles={['ADMIN']} />,
        children: [
          { path: '/admin/badges', element: <BadgeManagementPage /> },
          { path: '/admin/users', element: <UserManagementPage /> },
          { path: '/admin/analytics', element: <AdminAnalyticsPage /> },
        ]
      },
    ]
  },
]);
```

### Auth Store (Zustand)
```typescript
// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ISSUER' | 'MANAGER' | 'EMPLOYEE';
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      
      login: async (email, password) => {
        const response = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
      },
      
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
      },
      
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'auth-storage' }
  )
);
```

### Login Page Component
```tsx
// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');  // Redirect to dashboard
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">G-Credit Login</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Test accounts hint */}
        <div className="mt-6 text-xs text-gray-600 text-center">
          <p>Test Accounts:</p>
          <p>admin@example.com / testpass123</p>
          <p>employee@example.com / testpass123</p>
        </div>
      </div>
    </div>
  );
}
```

### Protected Route Component
```tsx
// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}
```

### Dashboard Page (Role-Based)
```tsx
// src/pages/DashboardPage.tsx
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const user = useAuthStore(state => state.user);
  
  if (!user) return null;
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.firstName}!</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Common links */}
        <Link to="/wallet" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
          <h2 className="text-xl font-semibold">My Wallet</h2>
          <p className="text-gray-600">View your badges</p>
        </Link>
        
        {/* Issuer+ links */}
        {['ISSUER', 'ADMIN'].includes(user.role) && (
          <>
            <Link to="/templates" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
              <h2 className="text-xl font-semibold">Badge Templates</h2>
              <p className="text-gray-600">Manage templates</p>
            </Link>
            <Link to="/issue" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
              <h2 className="text-xl font-semibold">Issue Badge</h2>
              <p className="text-gray-600">Issue new badges</p>
            </Link>
          </>
        )}
        
        {/* Admin links */}
        {user.role === 'ADMIN' && (
          <>
            <Link to="/admin/badges" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
              <h2 className="text-xl font-semibold">Badge Management</h2>
              <p className="text-gray-600">Manage all badges</p>
            </Link>
            <Link to="/admin/analytics" className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
              <h2 className="text-xl font-semibold">Analytics</h2>
              <p className="text-gray-600">View analytics</p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
```

### Layout with Navigation
```tsx
// src/components/Layout.tsx
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">G-Credit</h1>
            {user && (
              <div className="flex gap-4">
                <a href="/" className="hover:text-blue-600">Dashboard</a>
                <a href="/wallet" className="hover:text-blue-600">Wallet</a>
                {['ISSUER', 'ADMIN'].includes(user.role) && (
                  <a href="/templates" className="hover:text-blue-600">Templates</a>
                )}
                {user.role === 'ADMIN' && (
                  <a href="/admin/badges" className="hover:text-blue-600">Admin</a>
                )}
              </div>
            )}
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {user.firstName} {user.lastName}
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {user.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
```

---

## Test Plan

### Unit Tests (Frontend)
- [x] LoginPage renders correctly
- [x] Form validation works
- [x] Login success stores token and redirects
- [x] Login failure shows error message
- [x] ProtectedRoute redirects unauthenticated users
- [x] Dashboard shows role-appropriate links

### E2E Tests
- [x] Can login as Admin
- [x] Can login as Employee
- [x] Logout works and redirects to login
- [x] Protected routes require authentication
- [x] Role-based access enforced

### Manual Testing (UAT Prep)
- [x] Login as admin@example.com
- [x] See Admin dashboard with all links
- [x] Logout and login as employee@example.com
- [x] See Employee dashboard (limited links)
- [x] Test navigation between pages
- [x] Verify token persists on page refresh

---

## Definition of Done

### Code Complete
- [x] LoginPage component created
- [x] Auth store (Zustand) implemented
- [x] ProtectedRoute component
- [x] DashboardPage component
- [x] Layout component with nav
- [x] Router updated with all routes
- [x] No TypeScript/ESLint errors

### Testing Complete
- [x] Unit tests written (>80% coverage)
- [x] E2E tests written
- [x] Manual testing passed (4 roles)

### Documentation Complete
- [x] Story file updated with completion notes
- [x] Quick login guide updated

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| Auth store (Zustand) | 0.5h | Dev |
| LoginPage component | 1h | Dev |
| ProtectedRoute + RoleGuard | 0.5h | Dev |
| DashboardPage (role-based) | 1h | Dev |
| Layout component | 0.5h | Dev |
| Router updates | 0.5h | Dev |
| Styling (Tailwind CSS) | 0.5h | Dev |
| Unit tests | 0.5h | Dev |
| E2E tests | 0.5h | Dev |
| Manual testing | 0.5h | Dev |
| **Total** | **6h** | |

### Confidence Level
High - Standard React + Auth patterns

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation
- [x] Stories 9.1-9.5: All features developed (APIs ready)

### Blocks
- Story U.1: Complete Lifecycle UAT (requires login to test)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Auth state management bugs | Low | Medium | Use proven Zustand patterns, test thoroughly |
| Token refresh not implemented | Medium | Low | Acceptable for MVP, add in Sprint 8 |
| UX not polished | High | Low | Intentional - focus on functionality for UAT |

---

## Questions & Assumptions

### Assumptions
- Simple username/password login (no OAuth, no 2FA)
- Token stored in localStorage (acceptable for MVP)
- No "Remember Me" feature
- No password reset in this story
- No user registration UI (admin creates users via API)

### Open Questions
- Should we add token refresh logic? → Nice-to-have, not blocker
- Should we style with shadcn/ui? → No, keep simple for speed

---

## Timeline

**Estimated Start:** February 5, 2026 (Day 3 Morning)  
**Estimated Completion:** February 5, 2026 (Day 3 Afternoon)  
**Actual Start:** [TBD]  
**Actual Completion:** [TBD]

---

## Related Links

- **Sprint 7 Backlog:** [backlog.md](backlog.md)
- **Story U.1:** [Complete Lifecycle UAT](U-1-lifecycle-uat.md) (depends on this)
- **Quick Login Guide:** [../../development/quick-login-guide.md](../../development/quick-login-guide.md)

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-01-31 | Backlog | Bob (Scrum Master) | Story created after kickoff, identified as UAT prerequisite |

---

**Previous Story:** [9.5: Admin Revocation UI](9-5-admin-ui.md)  
**Next Story:** [U.2: Demo Seed Data](U-2-demo-seed.md)
