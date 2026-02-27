# Sprint 13 — Final Status

**Sprint:** Sprint 13  
**Goal:** Azure AD SSO + Session Management  
**Version:** v1.3.0  
**Branch:** `sprint-13/sso-session-management`  
**Sprint Lead:** LegendZhu  
**Date Completed:** 2026-02-27  
**Status:** ✅ COMPLETE

---

## Sprint Metrics

| Metric | Value |
|--------|-------|
| Stories Planned | 8 |
| Stories Completed | 8/8 (100%) |
| Estimated Hours | 50–60h |
| Backend Tests | 914 passed (+59 from v1.2.1) |
| Frontend Tests | 794 passed (77 files, +56 from v1.2.1) |
| Agent UAT | 47/47 PASS (13 phases) |
| Manual UAT | M1–M6 all PASS |
| Commits on Branch | 29 |

---

## Story Status

| # | Story | Wave | Est | Status |
|---|-------|------|-----|--------|
| 13.1 | Azure AD SSO Strategy + Callback Endpoints | W1: SSO Backend | 10-12h | ✅ Done |
| 13.2 | JIT User Provisioning on First SSO Login | W1: SSO Backend | 6-8h | ✅ Done |
| 13.3 | Login-Time Mini-Sync for Returning SSO Users | W1: SSO Backend | 4-6h | ✅ Done |
| 13.4 | Login Page Dual Entry + SSO Redirect Flow | W2: SSO Frontend | 6-8h | ✅ Done |
| 13.5 | Global 401 Interceptor + Token Refresh Queue | W3: Session Mgmt | 8-10h | ✅ Done |
| 13.6 | Idle Timeout with Warning Modal | W3: Session Mgmt | 6-8h | ✅ Done |
| 13.7 | API Client Cleanup (Remove axios) | W3: Session Mgmt | 3-4h | ✅ Done |
| 13.8 | Integration Testing + UAT | W4: UAT | 6-8h | ✅ Done |

---

## Key Deliverables

### FR27: Azure AD SSO (Stories 13.1–13.4)
- M365 users can log in via "Sign in with Microsoft" (Authorization Code Flow with PKCE)
- First-time SSO users auto-provisioned (JIT) with role/department from Graph API
- Returning SSO users get login-time mini-sync (profile/role/manager refresh)
- Dual entry login page: SSO button + password form (DEC-001 Option A)
- SSO users blocked from profile/password editing (passwordHash='')

### FEAT-007: Session Management (Stories 13.5–13.6)
- Global 401 interceptor with automatic token refresh + retry
- Promise-based refresh queue prevents parallel refresh storms
- 30-minute idle timeout with 5-minute warning modal + countdown
- Auto-logout with redirect to `/login` and reason toast

### P1-3: API Client Cleanup (Story 13.7)
- `axios` fully removed from frontend
- 21 inline `apiFetch()` calls migrated to API lib + hooks
- All API calls route through centralized `apiFetch()` with 401 interceptor

---

## UAT Results

### Agent UAT (47/47 PASS)
13 phases covering: auth (password + SSO), user management, badge templates, badge issuance, badge wallet, badge claiming, badge sharing, badge verification, milestones, skills, admin dashboard, M365 sync, session management.

### Manual UAT (M1–M6 PASS)
| Phase | Scope | Result |
|-------|-------|--------|
| M1 | SSO Login Flow | ✅ PASS |
| M2 | JIT User Provisioning | ✅ PASS |
| M3 | Password Login + Dual Entry | ✅ PASS |
| M4 | Session Management (Idle Timeout) | ✅ PASS |
| M5 | Admin Features (Dashboard, Sync) | ✅ PASS |
| M6 | Badge Lifecycle (Issue→Claim→Share→Verify) | ✅ PASS |

### UAT Bugs Found & Fixed
| ID | Issue | Fix Commit |
|----|-------|------------|
| M3.1 | Login error flash on successful login | `3eeb139` |
| M4.2 | Idle timeout mouse reset during warning | `3eeb139` |
| M6.1 | UAT plan navigation text | `3eeb139` |
| M6.2 | Badge share analytics not auto-refreshing | `299a7b8` |

---

## Commit History (29 commits)

```
b0cdacf config: add Azure AD SSO env vars and fix redirect URI port
e197205 docs: Add production deployment plan
687127d feat(auth): Azure AD SSO strategy + callback (13.1)
8394e56 chore(13.1): SM acceptance — done
1df99e1 chore: add root .gitignore safety net for .env files
543c3fc feat(auth): JIT user provisioning (13.2)
9a1536a fix(auth): Story 13.2 code review findings
2a1b31e chore(13.2): SM acceptance — done
67e359c feat(story-13.3): login-time mini-sync hardening
7cc8a60 fix(story-13.3): code review — clock-skew guard
73a4b9d chore(13.3): SM acceptance — done
ab10830 feat(story-13.4): login page dual entry + SSO
c5d191e fix: remove unused React import in MicrosoftSsoButton
05ce02d fix(story-13.4): code review — timeout/error tests
54a6591 chore(sprint-13): accept story 13.4
6d7049b docs(sprint-13): story 13.4 code review result
0a00b33 feat(story-13.5): 401 interceptor + refresh queue
e49243e fix(story-13.5): code review — ApiError class
65cec91 chore(sprint-13): accept story 13.5
0e30c8a feat(story-13.6): idle timeout with warning modal
d7c5a37 fix(story-13.6): code review — idempotent timeout guard
bd8aac9 docs(story-13.6): SM accepted — idle timeout
6b652de docs(story-13.7): dev prompt
c846ab9 feat(story-13.7): API client cleanup
d3280b4 docs(story-13.7): code review prompt
ad11af6 fix(frontend): Story 13.7 code review nits
6a4850c fix(frontend): CI build errors
8a11910 docs(story-13.7): SM accepted
2f9f68d test(story-13.8): Agent UAT 47/47 pass
9bced11 chore(13.8): UAT seed data + manual UAT plan
6079606 feat(13.8): block SSO users from profile editing
fc386e7 feat(dashboard): admin notification for M365 sync
cac0935 fix(dashboard): m365SyncLog mock in spec
05e9f04 fix(husky): harden pre-push vitest on Windows
3eeb139 fix(frontend): UAT M3.1 + M4.2 + M6.1
299a7b8 feat: badge share UX improvements (UAT M6.2)
```

---

## Success Criteria Checklist

- [x] M365 users can log in via "Sign in with Microsoft" button (Azure AD OAuth 2.0)
- [x] First-time SSO users automatically provisioned (JIT) with correct role/department
- [x] Returning SSO users get login-time mini-sync (profile/role/manager refresh)
- [x] Login page shows dual entry: SSO button + password form
- [x] Password login preserved for non-M365 users
- [x] Global 401 interceptor auto-refreshes tokens and retries failed requests
- [x] Token refresh queue prevents parallel refresh storms
- [x] 30-minute idle timeout with 5-minute warning modal → auto logout
- [x] `axios` dependency removed, all API calls go through `apiFetch()`
- [x] All existing tests pass + new tests for Sprint 13 features

---

## Definition of Done

- [x] All 8 stories completed and tested
- [x] All existing tests pass (BE 914, FE 794, 0 regressions)
- [x] New tests cover all acceptance criteria
- [x] Pre-push hook passes (lint + build + jest + vitest)
- [x] Code committed to `sprint-13/sso-session-management` branch
- [ ] PR created for merge to main
- [x] CHANGELOG.md updated for v1.3.0
- [x] Sprint retrospective notes captured

---

**Signed Off By:** LegendZhu (PO) — 2026-02-27
