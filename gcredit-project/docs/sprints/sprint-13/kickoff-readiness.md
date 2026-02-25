# Sprint 13 Kickoff Readiness

**Sprint:** Sprint 13  
**Target Version:** v1.3.0  
**Sprint Goal:** Azure AD SSO + Session Management Hardening  
**Branch:** `sprint-13/sso-session-management`  
**Created:** 2026-02-25

---

## Planning Artifacts

| Artifact | Status | Location |
|----------|--------|----------|
| Sprint Backlog | ✅ Created | [backlog.md](backlog.md) |
| Story Files (8) | ✅ Created | [13-1](13-1-azure-ad-sso-strategy.md) / [13-2](13-2-jit-user-provisioning.md) / [13-3](13-3-login-time-mini-sync.md) / [13-4](13-4-login-page-dual-entry.md) / [13-5](13-5-401-interceptor-refresh-queue.md) / [13-6](13-6-idle-timeout-warning-modal.md) / [13-7](13-7-api-client-cleanup.md) / [13-8](13-8-sprint-13-uat.md) |
| Version Manifest | ✅ Created | [version-manifest.md](version-manifest.md) |
| sprint-status.yaml | ✅ Updated | 8 stories: all `backlog` |
| project-context.md | ✅ Updated | Sprint 13 section with waves and PO decisions |
| Kickoff Readiness | ✅ This file | |

---

## UX / Architecture Review Assessment (Section 6.6)

| Story | UX Review | Arch Review | Reason |
|-------|-----------|-------------|--------|
| 13.1 Azure AD SSO Strategy | ❌ No | ✅ **REQUIRED** | Security/auth flow — must review MSAL integration, cookie handling, OAuth grants |
| 13.2 JIT User Provisioning | ❌ No | ✅ **REQUIRED** | Data integrity (race condition, user creation), Graph API integration |
| 13.3 Login-Time Mini-Sync | ❌ No | 🟡 Recommended | Reuses existing sync logic — lower risk |
| 13.4 Login Page Dual Entry | ✅ **REQUIRED** | 🟡 Recommended | New UI layout, Microsoft branding compliance, responsive design |
| 13.5 401 Interceptor | ❌ No | ✅ **REQUIRED** | Complex async pattern (refresh queue), affects all API calls |
| 13.6 Idle Timeout Modal | ✅ **REQUIRED** | 🟡 Recommended | New UI component, timer accuracy, UX for warning modal |
| 13.7 API Client Cleanup | ❌ No | ❌ No | Low risk cleanup — self-review sufficient |
| 13.8 UAT | ❌ No | ❌ No | Testing only |

**Recommendation:** Architecture review on 13.1, 13.2, 13.5 (HIGH risk auth/security). UX review on 13.4, 13.6 (new UI). Execute reviews before development of each wave.

---

## Code Review Strategy (Section 7.5)

| Story | Risk Level | Review Method | Rationale |
|-------|-----------|---------------|-----------|
| 13.1 Azure AD SSO | 🔴 HIGH | TDD + AI Review + Self-review | Security-critical: OAuth flow, token validation, cookie handling |
| 13.2 JIT Provisioning | 🔴 HIGH | TDD + AI Review + Self-review | User creation, race conditions, admin bootstrap |
| 13.3 Mini-Sync | 🟡 MEDIUM | AI Review + Self-review | Reuses existing logic, but role derivation is sensitive |
| 13.4 Login Page | 🟡 MEDIUM | AI Review + Self-review | UI component, auth flow integration |
| 13.5 401 Interceptor | 🔴 HIGH | TDD + AI Review + Self-review | Complex async pattern, affects all API calls globally |
| 13.6 Idle Timeout | 🟡 MEDIUM | AI Review + Self-review | Timer logic, event handling — standard patterns |
| 13.7 API Cleanup | 🟢 LOW | Self-review | Mechanical cleanup, grep verification |
| 13.8 UAT | 🟢 LOW | Self-review | Testing — no production code |

**TDD Stories:** 13.1, 13.2, 13.5 — write tests first, then implement.

**AI Review Checklist (for each review):**
- [ ] Authorization checks at correct layer?
- [ ] Error handling complete (try-catch, edge cases)?
- [ ] Database queries efficient (N+1, indexes)?
- [ ] Sensitive data not leaked (logs, responses)?
- [ ] Tests cover critical paths?

---

## Resource Requirements (Section 8)

| Resource | Story | Status | Action Needed |
|----------|-------|--------|---------------|
| `@azure/msal-node` npm package | 13.1 | ❌ New | `npm install @azure/msal-node` |
| Azure AD App Registration — SSO redirect URI | 13.1 | ❌ New config | Add `http://localhost:3001/api/auth/sso/callback` to redirect URIs |
| Azure AD App — `openid profile email` scopes | 13.1 | ⚠️ Verify | May already be configured, verify in Azure Portal |
| `AZURE_SSO_CLIENT_ID` env var | 13.1 | ❌ New | Add to `.env` and `.env.example` |
| `AZURE_SSO_CLIENT_SECRET` env var | 13.1 | ❌ New | Generate in Azure Portal → Add to `.env` |
| `AZURE_SSO_REDIRECT_URI` env var | 13.1 | ❌ New | Add to `.env`: `http://localhost:3001/api/auth/sso/callback` |
| `INITIAL_ADMIN_EMAIL` env var | 13.2 | ❌ New | Optional bootstrap var, add to `.env.example` |
| Prisma migration — `azureId` on User | 13.1 | ⚠️ Verify | Check if already exists in schema; if not, create migration |
| PostgreSQL | All | ✅ Exists | Azure Flexible Server, no changes needed |
| Azure Storage | N/A | ✅ Exists | No changes this sprint |
| Remove `axios` from frontend | 13.7 | ✅ Ready | `npm uninstall axios` |

**Pre-Development Checklist:**
- [ ] Verify Azure AD App Registration permissions (admin consent if needed)
- [ ] Generate client secret for SSO app
- [ ] Add SSO redirect URI to Azure AD app
- [ ] Create `.env` entries for SSO variables
- [ ] Check if `azureId` field exists in Prisma User model

---

## Tech Debt Assessment (Section 8.5)

**Sprint 13 is Feature-Heavy (SSO + Session Management).**

Tech debt allocation: **~5%** capacity (Story 13.7 only = 3-4h)

| TD Item | Priority | Status | Action |
|---------|---------|--------|--------|
| P1-3: API Client Unification | P1 | ✅ Included as Story 13.7 | 3-4h, remove axios + inline migrations |
| TD-006: Teams ChannelMessage.Send | P1 | ⏸️ Blocked (external) | No action — waiting on IT admin |
| 28 skipped tests (TD-006) | P2 | ⏸️ Blocked | Tests will be unskipped when TD-006 resolves |
| P2-6: Native `<input>` on LoginPage | P2 | ✅ Included in Story 13.4 | Fix as part of LoginPage rewrite |

**Not included this sprint (intentional):**
- P2 UI improvements (11 items) → Sprint 14
- P3 feature enhancements → Sprint 14+
- ESLint warnings cleanup → low priority

---

## Testing Strategy (Section 10.5)

### Coverage Targets
- **Unit tests:** >80% coverage on new code (Stories 13.1-13.7)
- **Integration tests:** SSO callback flow, 401 interceptor with refresh, idle timeout lifecycle
- **E2E tests:** Story 13.8 UAT covers full SSO + session flows

### Testing Approach by Story

| Story | Test Type | Key Test Scenarios | Mock Strategy |
|-------|-----------|-------------------|---------------|
| 13.1 SSO Strategy | Unit + Integration | Callback happy path, invalid code, expired token, missing oid | Mock `@azure/msal-node` ConfidentialClientApplication |
| 13.2 JIT Provisioning | Unit | JIT create, sync failure fallback, admin bootstrap, duplicate prevention | Mock Prisma, mock M365SyncService |
| 13.3 Mini-Sync | Unit | Sync updates fields, sync failure graceful, lastLoginAt updated | Mock Graph API responses |
| 13.4 Login Page | Unit | SSO button renders, redirect triggers, callback page success/error | Mock `window.location`, mock auth store |
| 13.5 401 Interceptor | Unit + Integration | Single/concurrent 401 → refresh → retry, refresh failure → logout, no infinite loop | Mock `fetch()`, mock refresh endpoint |
| 13.6 Idle Timeout | Unit | Timer fires at 30m, activity resets, warning at 25m, auto-logout | `vi.useFakeTimers()` for time control |
| 13.7 API Cleanup | Verification | `grep -r "axios"` = 0 results, all tests pass, build succeeds | N/A (verification, not new tests) |

### Test Data Strategy
- **Data Isolation:** Each test suite uses independent data (lesson from TD-001)
- **Naming Convention:** `{suite}-{test}@test.gcredit.com` for test emails
- **Mock MSAL:** Create `__mocks__/@azure/msal-node.ts` for consistent SSO mocking
- **Cookie Testing:** Use `extractCookieToken()` helper for httpOnly cookie verification

### Current Test Baseline
- Backend: 855 tests (827 pass, 28 skip = TD-006)
- Frontend: 738 tests (738 pass)
- Target post-Sprint 13: 950+ BE, 800+ FE (net new: ~100 BE, ~60 FE)

### Known Test Infrastructure Issues
- TD-006 (28 skipped): Teams permission — not Sprint 13 scope
- No flaky tests currently
- Pre-push hook runs full suite: ~3-5 min (acceptable)

---

## Git Branch Strategy (Section 16)

### Branch Creation
```bash
git checkout main
git pull origin main
git checkout -b sprint-13/sso-session-management
git push -u origin sprint-13/sso-session-management
```

### Commit Convention
- Feature commits: `feat(auth): implement Azure AD SSO strategy [13.1]`
- Fix commits: `fix(auth): handle missing oid claim in SSO callback [13.1]`
- Refactor: `refactor(api): remove axios dependency [13.7]`
- Test: `test(auth): add SSO callback integration tests [13.1]`

### PR Strategy
- Single PR: `sprint-13/sso-session-management` → `main`
- PR title: `Sprint 13: Azure AD SSO + Session Management (v1.3.0)`
- Squash merge when all stories complete

---

## Environment Setup Checklist

### Backend
- [ ] Node.js v20.20.0 installed
- [ ] `cd gcredit-project/backend && npm install` — all deps resolved
- [ ] `.env` file has all required variables (including new SSO vars)
- [ ] `npx prisma generate` — Prisma client generated
- [ ] `npx prisma migrate dev` — database schema up to date
- [ ] `npm test` — 855 tests pass (28 skip)
- [ ] `npm run build` — compiles without errors
- [ ] `npm run lint` — no errors

### Frontend
- [ ] `cd gcredit-project/frontend && npm install` — all deps resolved
- [ ] `npm test` — 738 tests pass
- [ ] `npm run build` — compiles without errors
- [ ] `npm run lint` — no errors
- [ ] `npm run dev` — dev server starts on localhost:5173

### Azure Portal
- [ ] App Registration has redirect URI: `http://localhost:3001/api/auth/sso/callback`
- [ ] App has scopes: `openid`, `profile`, `email`, `User.Read`
- [ ] Client secret generated and added to `.env`
- [ ] Admin consent granted (if required by tenant policy)
- [ ] Test user accounts available in tenant

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Azure AD admin consent required | Medium | HIGH — blocks all SSO stories | Pre-verify permissions in Azure Portal before Wave 1 starts |
| MSAL integration complexity | Low | MEDIUM — delays 13.1 | Use stateless code exchange, reference MSAL docs |
| 401 interceptor breaks existing pages | Medium | HIGH — regressions | Thorough testing in 13.5, run full test suite after each change |
| Idle timeout interferes with bulk operations | Low | LOW — UX annoyance | Reset timer on API activity, not just UI events |
| Env var misconfiguration | Low | LOW — easy to debug | Document all vars in `.env.example`, validation on startup |

---

## Sprint Timeline (Estimated)

| Day | Focus | Stories |
|-----|-------|---------|
| Day 1-2 | Azure Portal setup + SSO backend | 13.1 (start) |
| Day 3-4 | SSO backend completion | 13.1 (complete), 13.2, 13.3 |
| Day 5 | Login page frontend | 13.4 |
| Day 6-7 | Session management | 13.5, 13.6 |
| Day 8 | API cleanup | 13.7 |
| Day 9-10 | Integration testing + UAT | 13.8 |

---

## Kickoff Approval

- [ ] **Scrum Master Approval:** All preparation complete
- [ ] **Team Consensus:** Sprint scope agreed
- [ ] **Product Owner Informed:** Sprint goal and scope confirmed

**Status:** 🟡 **READY FOR REVIEW**  
**First Story:** Story 13.1 — Azure AD SSO Strategy + Callback Endpoints  
**Pre-condition:** Azure AD App Registration configured with redirect URI

---

## Next Steps

1. ⏭️ **Story 0.1:** Create Git Branch `sprint-13/sso-session-management`
2. ⏭️ **Story 0.2:** Configure Azure AD App Registration (redirect URI + scopes)
3. ⏭️ **Story 0.3:** Add SSO env vars to `.env` and `.env.example`
4. ⏭️ **Story 13.1:** Start Azure AD SSO Strategy implementation

---

**Quick Checklist Summary:**
- ✅ Planning Artifacts: 6/6
- ⏭️ Git Branch: 0/3 (create at sprint start)
- ⏭️ Environment: 0/9 (verify at sprint start)
- ⏭️ Azure Resources: 0/5 (configure at sprint start)
- ✅ Testing Infrastructure: baseline recorded
- ⚠️ Permissions: TD-006 known blocker (not Sprint 13 scope)
- ✅ Documentation: 4/4
- ✅ Risks Assessed: 5 risks documented with mitigations

---

**Created By:** SM Agent (Bob)  
**Reviewed:** Pending
