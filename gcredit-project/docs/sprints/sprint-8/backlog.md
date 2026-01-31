# Sprint 8 Backlog - Technical Debt & Enhancements

**Sprint:** Sprint 8 (Planning TBD)  
**Created:** February 1, 2026  
**Source:** Sprint 7 Technical Review Meeting (deferred items)  
**Purpose:** Track enhancements and production hardening deferred from Sprint 7

---

## 📋 Sprint 8 Stories Overview

| Story ID | Title | SP | Priority | Source |
|----------|-------|-----|----------|--------|
| 0.2b | Auth Enhancements (Token Refresh, WCAG 2.1 AA) | 3 | MEDIUM | Sprint 7 split |
| 0.3 | CSP Security Headers | 1 | HIGH | Sprint 7 split |
| U.2b | M365 Sync Production Hardening | 6 | MEDIUM | Sprint 7 split |
| TD-1 | Open Badges 2.0 Full Compliance | 4 | LOW | Deferred from Epic 9 |
| TD-2 | Baked Badge Revocation Overlay | 2 | LOW | Deferred from Epic 9 |
| TD-3 | Server-Side Badge Filtering | 2 | LOW | Deferred from Epic 9 |

**Total Estimated:** ~18 SP (~24-28 hours)

---

## 🎯 Core Stories (MVP→Production)

### Story 0.2b: Auth Enhancements
**File:** [0-2b-auth-enhancements.md](sprint-8/0-2b-auth-enhancements.md)  
**Story Points:** 3  
**Priority:** MEDIUM  
**Effort:** 5.75h

**Scope:**
- Token refresh interceptor with exponential backoff
- Full WCAG 2.1 AA compliance (screen reader testing)
- Manager + Issuer dashboard layouts
- Cross-browser testing (Safari, Firefox)
- Forgot password UI (non-functional placeholder)

**Why Deferred:** Sprint 7 MVP only needs basic login for UAT (<1h sessions, no token refresh needed)

**Dependencies:**
- Story 0.2a (Sprint 7) must be complete
- Backend `/api/auth/refresh` endpoint (1h additional work)

---

### Story 0.3: CSP Security Headers
**File:** [0-3-csp-headers.md](sprint-8/0-3-csp-headers.md)  
**Story Points:** 1  
**Priority:** HIGH  
**Effort:** 1h

**Scope:**
- Install and configure `@nestjs/helmet`
- Configure Content Security Policy directives
- Test dev mode + production build compatibility
- Ensure M365 Graph API + Tailwind CSS compatibility

**Why Deferred:** Sprint 7 is internal UAT only, CSP not critical for testing

**Dependencies:**
- Story 0.2a (Sprint 7) - Need localStorage auth to test CSP

---

### Story U.2b: M365 Sync Production Hardening
**File:** [U-2b-m365-hardening.md](sprint-8/U-2b-m365-hardening.md)  
**Story Points:** 6  
**Priority:** MEDIUM  
**Effort:** 8.5h

**Scope:**
- Pagination support for 1000+ user organizations
- Retry logic with exponential backoff (ADR-008 compliance)
- Audit logging (M365SyncLog table)
- User deactivation sync (deleted M365 users → inactive in GCredit)
- Comprehensive error recovery

**Why Deferred:** Sprint 7 UAT only needs 30-50 users (Product Owner's org size, single GraphAPI call sufficient), pagination not needed

**Dependencies:**
- Story U.2a (Sprint 7) must be complete
- Prisma migrations for M365SyncLog table + User.isActive field

---

## 🔧 Technical Debt Items

### TD-1: Open Badges 2.0 Full Compliance
**Story Points:** 4  
**Priority:** LOW  
**Effort:** 5-6h  
**Source:** Sprint 7 Architecture Review (deferred from Epic 9)

**Scope:**
- Update Badge JSON-LD to Open Badges 2.0 spec
- Add `credentialStatus` property with revocation status endpoint
- Implement `StatusList2021Credential` for batch revocation checks
- Update verification endpoint to check status

**Why Deferred:** 
- Not required for MVP (internal system)
- External verifiers rare in early stages
- Verification endpoint already shows revocation (adequate for Sprint 7 UAT)

**Reference:** EPIC-9-ARCHITECTURE-REVIEW-AMELIA.md, Must-Fix Item #6

---

### TD-2: Baked Badge Revocation Overlay
**Story Points:** 2  
**Priority:** LOW  
**Effort:** 2-3h  
**Source:** Sprint 7 Architecture Review (deferred from Epic 9)

**Scope:**
- Server-side image manipulation (Sharp library)
- Add red "REVOKED" overlay to baked badge PNG
- Cache revoked badge images (avoid regenerating)
- Update badge baking service

**Why Deferred:**
- Sprint 7 shows revocation in UI (adequate)
- Baked badge download edge case (low usage expected)
- Image processing adds complexity

**Reference:** EPIC-9-ARCHITECTURE-REVIEW-AMELIA.md, Must-Fix Item #5

---

### TD-3: Server-Side Badge Filtering
**Story Points:** 2  
**Priority:** LOW  
**Effort:** 2-3h  
**Source:** Sprint 7 Architecture Review (deferred from Epic 9)

**Scope:**
- Update `GET /api/badges/my-badges` with `?status=ACTIVE|REVOKED|ALL` query param
- Filter badges on backend (not frontend)
- Add pagination support (limit/offset)
- Performance optimization (indexed queries)

**Why Deferred:**
- Frontend filtering works for MVP (<100 badges expected)
- Server-side filtering is performance optimization (not functional requirement)
- Low urgency for small datasets

**Reference:** EPIC-9-ARCHITECTURE-REVIEW-AMELIA.md, Should-Fix Item #8

---

## 📝 Additional Enhancements (Future Sprints)

### Lower Priority Items (Sprint 9+)

1. **Functional Password Reset** (3 SP, Sprint 9)
   - Email service integration (SendGrid/Mailgun)
   - Password reset token generation
   - Reset password page
   - Security: Time-limited tokens, rate limiting

2. **M365 Incremental Sync** (4 SP, Sprint 10+)
   - Delta Query API integration
   - Only sync changed users (not full sync)
   - Reduces API calls by 90%+
   - Scheduled cron job (daily 3 AM)

3. **Admin UI for M365 Sync Logs** (3 SP, Sprint 10+)
   - View M365SyncLog table in Admin Dashboard
   - Filter by date, status, user count
   - Retry failed syncs manually
   - Sync history visualization

4. **Multi-Factor Authentication** (5 SP, Sprint 11+)
   - TOTP support (Google Authenticator)
   - SMS backup (Twilio integration)
   - Recovery codes
   - MFA enforcement policies

5. **Session Management UI** (2 SP, Sprint 10+)
   - View active sessions
   - Logout from all devices
   - Session timeout configuration
   - IP address tracking

---

## 🎯 Sprint 8 Success Criteria

- [ ] All 3 core stories (0.2b, 0.3, U.2b) completed
- [ ] At least 1 technical debt item completed (TD-1, TD-2, or TD-3)
- [ ] Zero regressions from Sprint 7 (all UAT scenarios still pass)
- [ ] Production-readiness improved (token refresh, CSP, M365 hardening)
- [ ] Technical debt backlog < 10 items

---

## 📚 References

- Sprint 7 Technical Review Meeting Minutes (Feb 1, 2026)
- EPIC-9-ARCHITECTURE-REVIEW-AMELIA.md (Architecture Review)
- EPIC-9-UX-REVIEW-AMELIA.md (UX Review)
- EPIC-9-DEVELOPER-FEASIBILITY-REVIEW.md (Developer Review)

---

**Created By:** Bob (Scrum Master)  
**Date:** February 1, 2026  
**Purpose:** Systematically track deferred Sprint 7 work for Sprint 8 planning
