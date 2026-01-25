# Sprint 1 Kickoff Readiness Checklist
## JWT Authentication & User Management

**Sprint:** Sprint 1  
**Start Date:** 2026-01-27 (Monday)  
**Duration:** 2 weeks (2026-01-27 → 2026-02-09)  
**Team:** Solo Full-Stack Developer (Part-time, 业余时间)  
**Estimated Effort:** 21 hours  
**Epic:** Epic 2 - JWT Authentication & User Management (7 stories)

---

## 🎯 Sprint Goal

**Primary Goal:** Implement complete JWT authentication system with Azure AD SSO integration, enabling secure user login, registration, and session management.

**Success Criteria:**
- ✅ Users can register and login with email/password
- ✅ JWT tokens issued and validated on protected routes
- ✅ Azure AD SSO working for enterprise login
- ✅ Password reset workflow functional
- ✅ User profile API operational
- ✅ All auth endpoints tested and documented

---

## ✅ Pre-Sprint Readiness Checklist

### 1. Sprint 0 Action Items Review

#### **AI-1: Create Version Manifest Template** 🔒 HIGH PRIORITY
**Status:** ⏳ PENDING  
**Required Before Sprint Start:** YES  

**Actions Needed:**
- [ ] Review Sprint 1 Backlog to verify it includes actual versions:
  - React 18.3.1, Vite 7.2.4, TypeScript 5.9.3
  - NestJS 11.0.16, Prisma 6.19.2, TypeScript 5.7.3
  - Node.js 20.20.0 LTS
- [ ] Add "Technology Version Manifest" section to Sprint 1 Backlog if missing
- [ ] Create template for future sprint planning documents

**Impact if Skipped:** Sprint 1 may reference wrong versions, causing confusion during implementation.

---

#### **AI-2: Re-evaluate lodash Security Risk** ⚠️ HIGH PRIORITY
**Status:** ⏳ PENDING  
**Required Before Sprint Start:** YES (Day 1)  

**Actions Needed:**
- [ ] Run `npm audit` in backend directory
- [ ] Review current lodash vulnerability severity
- [ ] Make decision:
  - **Option A:** Accept risk for MVP (document in Known Issues)
  - **Option B:** Test `npm audit fix --force` in feature branch
  - **Option C:** Wait for NestJS dependency update
- [ ] Document decision in sprint-1-backlog.md or create ADR

**Recommended Decision:** Option A (Accept risk for MVP development)
- Moderate severity, Prototype Pollution vulnerability
- Development environment only (not production yet)
- No external traffic to dev database
- Re-evaluate before production deployment

**DECISION MADE:** ✅ Option A - Risk Accepted (2026-01-25)
- **Reference:** [ADR-002](../../docs/decisions/002-lodash-security-risk-acceptance.md)
- **Valid Until:** Sprint 8 (pre-production) or severity escalation
- **Monitoring:** Weekly vulnerability check, bi-weekly dependency check

**Impact if Skipped:** Security risk remains undocumented. May fail security audits later.

---

#### **AI-3: Update Sprint 1 Backlog with Actual Tech Stack** 📝 HIGH PRIORITY
**Status:** ⏳ PENDING  
**Required Before Sprint Start:** YES  

**Actions Needed:**
- [ ] Open `sprint-1-backlog.md`
- [ ] Verify all version numbers match Sprint 0 actual versions
- [ ] Update any outdated references (Prisma 5 → 6.19.2, NestJS 10 → 11.0.16)
- [ ] Add Prisma version lock warning if not present

**Impact if Skipped:** Developers may install wrong versions, causing compatibility issues.

---

#### **AI-4: Establish Dependency Update Policy** 📜 MEDIUM PRIORITY
**Status:** ⏳ PENDING  
**Required Before Sprint Start:** NO (Sprint 1 Week 1)  

**Actions Needed:**
- [ ] Draft dependency update policy:
  - Major versions: Spike required before adoption
  - Minor versions: Changelog review + dev branch testing
  - Patch versions: Safe to auto-update (security focus)
  - Security updates: Immediate evaluation
- [ ] Document in `docs/CONTRIBUTING.md` or project wiki
- [ ] Share with team (if multi-person)

**Can Be Deferred To:** Sprint 1 Week 1 (not blocking Sprint start)

---

#### **AI-5: Add Pre-Commit Git Hooks** 🔒 MEDIUM PRIORITY
**Status:** ⏳ PENDING  
**Required Before Sprint Start:** NO (Sprint 1 Week 2)  

**Actions Needed:**
- [ ] Install Husky + lint-staged in frontend and backend
- [ ] Configure hooks:
  - Block `.env` files from commits
  - Run ESLint/Prettier on staged files
  - Run TypeScript type check
- [ ] Test by attempting to commit `.env` file

**Can Be Deferred To:** Sprint 1 Week 2 (nice-to-have, not blocking)

---

#### **AI-6: Create ADR for Prisma 6 Lock** 📖 LOW PRIORITY
**Status:** ⏳ PENDING  
**Required Before Sprint Start:** NO (Flexible)  

**Actions Needed:**
- [ ] Create `docs/adr/001-prisma-version-lock.md`
- [ ] Document:
  - Context: Prisma 7 breaking changes
  - Decision: Lock at Prisma 6.19.2
  - Consequences: Stable, but missing new features
  - Re-evaluation: Post-MVP (Sprint 10+)
- [ ] Link from `project-context.md`

**Can Be Deferred To:** Any time during Sprint 1 or later

---

#### **AI-7: Automate Dependency Security Scanning** 🛡️ MEDIUM PRIORITY
**Status:** ⏳ PENDING  
**Required Before Sprint Start:** NO (Sprint 2-3)  

**Actions Needed:**
- [ ] Enable GitHub Dependabot or Snyk
- [ ] Configure weekly `npm audit` reports
- [ ] Set up CI pipeline to fail on high/critical vulnerabilities

**Can Be Deferred To:** Sprint 2-3 (CI/CD setup phase)

---

#### **AI-8: Document Sprint Retrospectives** 📚 LOW PRIORITY
**Status:** ✅ DONE (Sprint 0 Retrospective completed)  
**Required Before Sprint Start:** NO  

**Actions Needed:**
- [ ] Create retrospective template for future sprints
- [ ] Schedule 15-minute retro at end of Sprint 1

**Can Be Deferred To:** End of Sprint 1

---

## 2. Technical Environment Check

### Backend Environment
- [ ] **Node.js Version:** Verify `node -v` shows `v20.20.0` or compatible
- [ ] **npm Version:** Verify `npm -v` shows `10.x` or higher
- [ ] **PostgreSQL Connection:** Run `npm run prisma:studio` to verify database access
- [ ] **Azure Blob Storage:** Verify containers exist:
  - `badges` (public read)
  - `evidence` (private)
- [ ] **Environment Variables:** Verify `.env` file has all required variables:
  ```bash
  DATABASE_URL="postgresql://..."
  AZURE_STORAGE_CONNECTION_STRING="..."
  AZURE_STORAGE_ACCOUNT_NAME="gcreditdevstoragelz"
  ```
- [ ] **Health Check:** Run `npm run start:dev`, verify `http://localhost:3000/health` returns 200
- [ ] **Readiness Check:** Verify `http://localhost:3000/ready` returns 200

### Frontend Environment
- [ ] **Node.js Version:** Same as backend (v20.20.0)
- [ ] **Vite Dev Server:** Run `npm run dev`, verify `http://localhost:5173` loads
- [ ] **Tailwind CSS:** Verify Tailwind classes render correctly
- [ ] **Shadcn/ui Components:** Verify Button component works (from Sprint 0)

### Git Repository
- [ ] **Branch Status:** Verify on `main` branch, clean working tree
- [ ] **Remote Sync:** Verify `git pull` shows "Already up to date"
- [ ] **Last Commit:** Verify last commit is Sprint 0 completion or docs update
- [ ] **Sprint 1 Branch:** Create feature branch:
  ```bash
  git checkout -b sprint-1-authentication
  ```

---

## 3. Sprint 1 Backlog Verification

### Story 2.1: Enhanced User Data Model (3h)
- [ ] **Prisma Schema Clear:** Understand User model extensions (email, passwordHash, role, etc.)
- [ ] **Migration Command Ready:** `npx prisma migrate dev --name add-auth-fields`
- [ ] **Test Data Plan:** Plan to create 2-3 test users

### Story 2.2: JWT Authentication Service (3h)
- [ ] **Dependencies Known:** `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`
- [ ] **JWT Secret Plan:** Decide JWT secret for dev (e.g., `JWT_SECRET=dev-secret-change-in-prod`)
- [ ] **Token Expiry:** Default 1h access token, 7d refresh token

### Story 2.3: Auth Controllers & Guards (3h)
- [ ] **Endpoints Clear:** POST `/auth/register`, POST `/auth/login`, GET `/auth/profile`
- [ ] **Guard Strategy:** Understand JWT guard application (@UseGuards(JwtAuthGuard))

### Story 2.4: Password Management (3h)
- [ ] **Endpoints Clear:** POST `/auth/forgot-password`, POST `/auth/reset-password`
- [ ] **Email Strategy:** Decide email sending approach (console.log for Sprint 1, real email in Sprint 2+)

### Story 2.5: Session Management (3h)
- [ ] **Strategy:** Understand refresh token flow
- [ ] **Storage:** Plan to store refresh tokens (database vs. Redis - database for MVP)

### Story 2.6: Azure AD SSO (4h)
- [ ] **Prerequisites:** Azure AD app registration (may defer to Sprint 2 if complex)
- [ ] **Passport Strategy:** `passport-azure-ad` package
- [ ] **Callback URL:** Plan callback URL structure

### Story 2.7: User Profile API (2h)
- [ ] **Endpoints Clear:** GET `/users/me`, PATCH `/users/me`
- [ ] **Profile Fields:** Name, email, avatar (optional), role

---

## 4. Definition of Done Review

Each story is considered DONE when:
- ✅ Code written and committed to feature branch
- ✅ Unit tests written and passing (Jest)
- ✅ API endpoints tested manually (Postman/curl)
- ✅ TypeScript compiles with no errors (`npm run build`)
- ✅ ESLint passes with no warnings (`npm run lint`)
- ✅ Documentation updated (README or inline comments)
- ✅ Merged to main branch (or sprint-1-authentication branch)

**Additional for Sprint 1:**
- ✅ JWT tokens successfully generated and validated
- ✅ Protected routes reject unauthenticated requests
- ✅ Password hashing working (bcrypt)
- ✅ At least 2 test users can register and login

---

## 5. Risk Assessment for Sprint 1

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Azure AD integration complexity** | Medium | High | Start with local JWT auth first (Stories 2.1-2.5), defer Azure AD (2.6) to end or Sprint 2 if needed |
| **Password reset email sending** | Low | Medium | Use console.log for token output in dev, real email in production |
| **Refresh token storage strategy** | Low | Low | Store in database for MVP, migrate to Redis in Sprint 2+ |
| **21h workload vs 10h Sprint 0** | High | Medium | Split work across 2 weeks, track daily progress, use P0/P1/P2 priorities |
| **JWT security best practices** | Low | High | Follow NestJS docs, use strong secret, short expiry for access tokens |

**High Priority Mitigation:**
- **Risk #1 (Azure AD):** If Azure AD (Story 2.6) takes >6h, defer to Sprint 2. Local JWT auth is sufficient for MVP.
- **Risk #4 (Workload):** Track progress daily. If behind by Day 7, consider deferring Story 2.6 (Azure AD) to Sprint 2.

---

## 6. Communication & Progress Tracking

### Daily Standup Questions (Solo Developer - Self-Check)
1. **What did I complete yesterday?** (Story #, hours spent)
2. **What will I work on today?** (Story #, planned hours)
3. **Any blockers or risks?** (Dependencies, unknowns)

### Progress Tracking
- [ ] **Day 1 (Mon):** AI-2 decision + Story 2.1 start
- [ ] **Day 3 (Wed):** Story 2.1 + 2.2 complete (6h total)
- [ ] **Day 5 (Fri):** Story 2.3 complete (3h)
- [ ] **Day 7 (Sun):** Mid-sprint check - 50% complete (Stories 2.1-2.3 done)
- [ ] **Day 10 (Wed):** Story 2.4 + 2.5 complete (6h)
- [ ] **Day 12 (Fri):** Story 2.6 progress check (decide defer if needed)
- [ ] **Day 14 (Sun):** Sprint 1 complete or extend 1-2 days if needed

### Sprint 1 Success Metrics
- **Target:** 21h estimated, 80%+ completion rate (17h minimum)
- **Minimum Viable:** Stories 2.1-2.5 complete (17h), defer 2.6+2.7 to Sprint 2
- **Stretch Goal:** All 7 stories complete (21h)

---

## 7. Reference Documents

- **Sprint 1 Backlog:** `_bmad-output/implementation-artifacts/sprint-1-backlog.md` (1,312 lines, detailed tasks)
- **Sprint 0 Retrospective:** `_bmad-output/implementation-artifacts/sprint-0-retrospective.md` (Action items AI-1 to AI-8)
- **Project Context:** `project-context.md` (Single source of truth)
- **Architecture Document:** `_bmad-output/planning-artifacts/architecture.md` (Auth architecture in Section 5.3)

---

## 8. Pre-Sprint Action Items Summary

### **MUST DO before Sprint 1 Start (2026-01-27):**

1. ✅ **AI-1: Version Manifest Check**
   - Verify Sprint 1 Backlog has correct versions
   - Create manifest template for future sprints
   - **Time:** 30 minutes

2. ✅ **AI-2: lodash Security Decision**
   - Run `npm audit`
   - Document decision (recommend: Accept risk for MVP)
   - **Time:** 15 minutes

3. ✅ **AI-3: Tech Stack Update Verification**
   - Review Sprint 1 Backlog for outdated versions
   - **Time:** 15 minutes

4. ✅ **Technical Environment Check**
   - Verify backend health checks pass
   - Verify frontend dev server runs
   - Create Sprint 1 feature branch
   - **Time:** 30 minutes

**Total Pre-Sprint Prep Time:** ~1.5 hours

### **CAN DEFER (Sprint 1 Week 1-2):**
- AI-4: Dependency update policy (Week 1)
- AI-5: Git hooks (Week 2)
- AI-6: Prisma ADR (Flexible)

### **CAN DEFER (Sprint 2+):**
- AI-7: Automated security scanning (Sprint 2-3)
- AI-8: Retrospective template (End of Sprint 1)

---

## 9. Sprint 1 Kickoff Confirmation

**By checking all boxes below, Sprint 1 is ready to start:**

- [ ] ✅ Sprint 0 action items AI-1, AI-2, AI-3 completed or decision made
- [ ] ✅ Backend environment operational (health checks pass)
- [ ] ✅ Frontend environment operational (dev server runs)
- [ ] ✅ Git repository clean and sprint-1-authentication branch created
- [ ] ✅ Sprint 1 Backlog reviewed and understood (all 7 stories clear)
- [ ] ✅ Definition of Done understood and agreed
- [ ] ✅ Risk mitigation plan in place (especially Azure AD deferral strategy)
- [ ] ✅ Daily progress tracking method decided (standup questions)

**Ready to Start:** [ ] YES - All checks complete  
**Start Date:** 2026-01-27 (Monday)  
**First Task:** AI-2 (lodash decision) + Story 2.1 (User data model)

---

**Prepared by:** Product Manager  
**Date:** 2026-01-25  
**Next Review:** 2026-01-27 (Sprint 1 Day 1)
