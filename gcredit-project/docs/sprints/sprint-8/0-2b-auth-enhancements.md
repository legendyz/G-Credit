# Story 0.2b: Login & Navigation - Production Enhancements

**Story ID:** Story 0.2b  
**Epic:** Sprint Setup  
**Sprint:** Sprint 8  
**Priority:** MEDIUM  
**Story Points:** 3  
**Status:** Sprint 8 Backlog  
**Created:** February 1, 2026 (Split from Story 0.2 during Technical Review)

---

## Context

Story 0.2a (Sprint 7) delivered MVP Login & Navigation with:
- ✅ Basic login (email/password)
- ✅ Zustand auth store (no token refresh)
- ✅ Protected routes with role guards
- ✅ Admin + Employee dashboards only
- ✅ Top navigation layout
- ✅ Basic accessibility (form labels, ARIA on inputs)

This story adds production-ready enhancements deferred from Sprint 7:
- Token refresh interceptor with exponential backoff
- Full WCAG 2.1 AA compliance (screen reader testing)
- Manager + Issuer dashboard variants
- Cross-browser testing (Safari, Firefox)
- Forgot password UI (non-functional link for MVP)

**Reference:** Sprint 7 Technical Review Meeting Minutes, Decision #1-6

---

## User Story

**As a** User (any role),  
**I want** production-grade authentication and navigation,  
**So that** I have a seamless, accessible experience across all browsers.

---

## Acceptance Criteria

### AC1: Token Refresh Interceptor
**Given** I am logged in and my token expires  
**When** I make an API request  
**Then** the system automatically refreshes my token and retries the request

**Implementation:**
```typescript
// src/lib/api/authInterceptor.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken } = response.data;

        useAuthStore.getState().setTokens(accessToken, refreshToken);
        processQueue(null, accessToken);

        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
```

**Test Scenarios:**
- [ ] Token expires during API call → auto-refreshed → request succeeds
- [ ] Multiple simultaneous API calls with expired token → queued, single refresh
- [ ] Refresh token expired → logged out, redirected to login
- [ ] Network error during refresh → logged out gracefully

### AC2: Full WCAG 2.1 AA Compliance
**Given** I am using a screen reader (NVDA or VoiceOver)  
**When** I navigate the application  
**Then** all interactive elements are properly announced and accessible

**Required Enhancements:**
1. **Keyboard Navigation:**
   - All interactive elements reachable via Tab
   - Skip to main content link
   - Focus visible (clear outline)
   - Logical tab order

2. **ARIA Enhancements:**
   - `role="navigation"` on nav bar
   - `aria-current="page"` on active nav link
   - `aria-label` on icon-only buttons
   - `aria-live="polite"` on error messages
   - `aria-describedby` for form field hints

3. **Form Accessibility:**
   - Error messages linked with `aria-describedby`
   - Required fields marked with `aria-required="true"`
   - Invalid fields marked with `aria-invalid="true"`
   - Error summary at top of form

4. **Screen Reader Testing:**
   - [ ] NVDA (Windows) - Login flow
   - [ ] VoiceOver (Mac) - Navigation flow
   - [ ] JAWS (Windows) - Complete user journey

**Tools:**
- axe DevTools (automated testing)
- Manual screen reader testing
- Keyboard-only navigation testing

### AC3: Manager + Issuer Dashboard Layouts
**Given** I am logged in as a Manager or Issuer  
**When** I land on the dashboard  
**Then** I see role-appropriate content and navigation

**Manager Dashboard:**
```tsx
// src/pages/ManagerDashboard.tsx
export default function ManagerDashboard() {
  return (
    <div className="p-6">
      <h1>Manager Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <MetricCard title="Team Size" value="12" />
        <MetricCard title="Badges Issued (Team)" value="48" />
        <MetricCard title="Pending Approvals" value="3" />
      </div>

      {/* Team Activity */}
      <section className="mt-8">
        <h2>Team Activity</h2>
        <TeamBadgeTimeline />
      </section>

      {/* Pending Approvals */}
      <section className="mt-8">
        <h2>Pending Approvals</h2>
        <BadgeApprovalQueue />
      </section>
    </div>
  );
}
```

**Issuer Dashboard:**
```tsx
// src/pages/IssuerDashboard.tsx
export default function IssuerDashboard() {
  return (
    <div className="p-6">
      <h1>Badge Issuer Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <MetricCard title="Templates Created" value="8" />
        <MetricCard title="Badges Issued" value="127" />
        <MetricCard title="Pending Claims" value="5" />
      </div>

      {/* Quick Actions */}
      <section className="mt-8">
        <h2>Quick Actions</h2>
        <div className="flex gap-4">
          <Button href="/templates/new">Create Template</Button>
          <Button href="/badges/issue">Issue Badge</Button>
        </div>
      </section>

      {/* Recent Issuances */}
      <section className="mt-8">
        <h2>Recent Issuances</h2>
        <RecentBadgesTable />
      </section>
    </div>
  );
}
```

**Test Scenarios:**
- [ ] Manager login → see team metrics + approvals
- [ ] Issuer login → see template management + issuances
- [ ] Admin login → see all dashboards (unchanged)
- [ ] Employee login → see wallet (unchanged)

### AC4: Cross-Browser Testing
**Given** I am using Safari or Firefox  
**When** I use the application  
**Then** all features work identically to Chrome

**Test Matrix:**

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Login | ✅ | Test | Test | ✅ |
| Token Refresh | ✅ | Test | Test | ✅ |
| Protected Routes | ✅ | Test | Test | ✅ |
| Navigation | ✅ | Test | Test | ✅ |
| Logout | ✅ | Test | Test | ✅ |

**Known Issues to Test:**
- Safari: localStorage behavior in private mode
- Firefox: Axios interceptor compatibility
- Edge: Should work (Chromium-based)

**Test Devices:**
- [ ] Windows 11: Chrome, Firefox, Edge
- [ ] macOS: Safari, Chrome, Firefox
- [ ] Mobile Safari (iOS) - bonus testing

### AC5: Forgot Password UI
**Given** I am on the login page  
**When** I click "Forgot Password?"  
**Then** I see a placeholder message

**Implementation:**
```tsx
// src/pages/LoginPage.tsx (updated)
<form onSubmit={handleLogin}>
  {/* ... email and password fields ... */}
  
  <div className="text-right mt-2">
    <button
      type="button"
      onClick={() => alert('Password reset coming in Sprint 9. Contact admin@gcredit.com')}
      className="text-sm text-blue-600 hover:underline"
    >
      Forgot Password?
    </button>
  </div>
  
  <button type="submit">Log In</button>
</form>
```

**Why Non-Functional:**
- Password reset backend not implemented
- Email service not configured
- MVP doesn't need password reset (internal users, IT can reset)
- Provides visual completeness without blocking production

**Test Scenarios:**
- [ ] Click "Forgot Password?" → see alert with contact info
- [ ] Alert message is clear and actionable
- [ ] Does NOT break login flow

---

## Technical Details

### Token Storage Update

Store both access and refresh tokens:

```typescript
// src/stores/authStore.ts (updated)
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null; // NEW
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'), // NEW
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken); // NEW
    set({ accessToken, refreshToken });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken'); // NEW
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
```

### Backend Changes Required

Add `/api/auth/refresh` endpoint:

```typescript
// backend/src/auth/auth.controller.ts
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  const { accessToken, refreshToken } = await this.authService.refreshTokens(
    dto.refreshToken,
  );
  return { accessToken, refreshToken };
}
```

---

## Definition of Done

- [ ] Token refresh interceptor implemented and tested
- [ ] WCAG 2.1 AA compliance verified (axe + manual testing)
- [ ] Manager dashboard implemented
- [ ] Issuer dashboard implemented
- [ ] Cross-browser testing completed (Chrome, Safari, Firefox)
- [ ] Forgot password UI added (non-functional placeholder)
- [ ] All unit tests pass
- [ ] E2E tests updated for new dashboards
- [ ] Manual testing: Complete user journey for all roles
- [ ] Code committed to `sprint-8/auth-enhancements` branch
- [ ] PR reviewed and merged

---

## Dependencies

**Depends On:**
- Story 0.2a (Login MVP) - Must be implemented first
- Backend: `/api/auth/refresh` endpoint (1h backend work)

**Blocks:**
- None (enhancement, not blocking critical features)

---

## Risks & Considerations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token refresh race condition | Medium | Queue concurrent requests during refresh |
| Safari private mode breaks localStorage | Low | Detect and show warning message |
| Screen reader compatibility issues | Medium | Thorough testing with NVDA + VoiceOver |
| Manager/Issuer dashboard data requirements | Medium | Use mock data if backend APIs not ready |

---

## Estimate Breakdown

| Task | Time |
|------|------|
| Token refresh interceptor | 1h |
| WCAG 2.1 AA enhancements | 1h |
| Manager dashboard | 0.5h |
| Issuer dashboard | 0.5h |
| Cross-browser testing | 0.5h |
| Forgot password UI | 0.25h |
| Backend refresh endpoint | 1h |
| Testing (unit + E2E + manual) | 1h |
| **Total** | **5.75h (~3 SP)** |

---

## Future Enhancements (Technical Debt)

1. **Functional Password Reset:**
   - Email service integration (SendGrid/Mailgun)
   - Password reset token generation
   - Reset password page
   - Ticket: Create in Sprint 9+

2. **Remember Me Functionality:**
   - 30-day refresh token expiry
   - Secure cookie storage (httpOnly)
   - Ticket: Create in Sprint 10+

3. **Multi-Factor Authentication (MFA):**
   - TOTP support (Google Authenticator)
   - SMS backup (Twilio)
   - Ticket: Create in Sprint 11+

4. **Session Management:**
   - View active sessions
   - Logout from all devices
   - Ticket: Create in Sprint 10+

---

## References

- Story 0.2a: Login & Navigation (MVP) - Sprint 7
- Sprint 7 Technical Review Meeting Minutes (Feb 1, 2026)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Axios Interceptor Documentation](https://axios-http.com/docs/interceptors)
- ADR-006: Frontend Architecture (to be updated with token refresh pattern)

---

**Created By:** Bob (Scrum Master)  
**Date:** February 1, 2026  
**Reason:** Split from Story 0.2 during Sprint 7 Technical Review (Decision #1-6)
