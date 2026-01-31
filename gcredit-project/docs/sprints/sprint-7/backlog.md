# Sprint 7 Backlog - Badge生命周期完整化 + UAT验证

**Sprint:** Sprint 7  
**Duration:** February 3-11, 2026 (7 working days) ← **UPDATED after Technical Review**  
**Team:** Amelia (Dev Agent) + LegendZhu  
**Epic:** Epic 9 - Badge Revocation + Complete Lifecycle UAT  
**Last Updated:** February 1, 2026 (Post-Technical Review Meeting)

---

## 🎯 Sprint Goal

**Primary Goal:** 补齐Badge Revocation功能并完成完整生命周期的UAT验证

**Success Criteria:**
- ✅ Epic 9 (Badge Revocation) 100% complete
- ✅ Complete badge lifecycle UAT executed and documented
- ✅ All P0/P1 bugs discovered in UAT are fixed
- ✅ Standardized UAT process established for future sprints
- ✅ User experience significantly improved

---

## 📋 User Stories

### Sprint Setup (Stories 0.1-0.2)

#### **Story 0.1:** [Git Branch Creation](0-1-git-branch.md) - **CRITICAL** - 5 min ✅ DONE
As a **Development Team**,  
I want **to create Sprint 7 Git branch before any code changes**,  
So that **we follow GitFlow strategy and avoid merge conflicts**.

**Acceptance Criteria:**
- Branch created: `sprint-7/epic-9-revocation-lifecycle-uat`
- Pushed to remote with upstream tracking
- All team members verified working on correct branch
- Main branch remains clean

**Status:** ✅ COMPLETE (2026-01-31)

**Link:** [0-1-git-branch.md](0-1-git-branch.md)

---

#### **Story 0.2a:** [Simple Login & Navigation System (MVP)](0-2-login-navigation.md) - **CRITICAL** - 6h ← **SPLIT from 0.2**
As a **User (any role)**,  
I want **to log in to the system and navigate between features**,  
So that **I can access role-appropriate functionality and complete UAT testing**.

**Acceptance Criteria:**
- Simple login page (email + password, basic ARIA labels)
- Auth state management (Zustand, NO token refresh in MVP)
- Role-based dashboard after login (Admin + Employee only in MVP)
- Protected routes with authentication check
- Basic top navigation layout with logout
- Test accounts accessible (for UAT)

**Why Critical:** Without this, Story U.1 (Complete Lifecycle UAT) cannot test multi-role workflows. UAT requires:
- Admin login → create template → issue badge
- Employee login → view wallet → claim badge
- Admin login again → revoke badge

**MVP Limitations (Sprint 7):**
- No token refresh (acceptable for <1h UAT sessions)
- Basic accessibility (form labels only, no screen reader testing)
- Top navigation (not sidebar - evaluated in UAT feedback)
- Admin + Employee roles only (Manager + Issuer dashboards in Sprint 8)

**Deferred to Story 0.2b (Sprint 8):**
- Token refresh interceptor
- Full WCAG 2.1 AA compliance
- Manager + Issuer dashboard variants
- Cross-browser testing

**Link:** [0-2-login-navigation.md](0-2-login-navigation.md)

---

#### **Story 0.2b:** Auth Enhancements - **Sprint 8** - 3h
- Token refresh interceptor with exponential backoff
- Full WCAG 2.1 AA compliance (NVDA/VoiceOver testing)
- Manager + Issuer dashboard layouts
- Cross-browser testing (Safari, Firefox)
- Forgot password UI (non-functional link)

**Status:** Sprint 8 Backlog

---

#### **Story 0.3:** CSP Security Headers - **Sprint 8** - 1h
As a **Security Team**,  
I want **Content Security Policy headers configured**,  
So that **XSS attacks are mitigated with localStorage tokens**.

**Acceptance Criteria:**
- Helmet middleware installed in NestJS
- CSP directives configured (script-src, img-src, connect-src)
- Dev mode compatibility verified
- Production CSP tested

**Status:** Sprint 8 Backlog (NOT UAT blocker)

---

### Epic 9: Badge Revocation (Stories 9.1-9.5)

#### **Story 9.1:** [Badge Revocation API](9-1-revoke-api.md) - **HIGH** - 7h ← **UPDATED (+2h)**
As an **Admin or Issuer**,  
I want **to revoke a badge with a documented reason**,  
So that **I can handle policy violations, errors, or expired credentials properly**.

**Acceptance Criteria:**
- API endpoint `POST /api/badges/:id/revoke` implemented
- Request body accepts revocation reason and optional notes
- Soft-delete pattern: Badge.status = REVOKED (not CLAIMED)
- **NEW:** AuditLog table created and entry logged
- **NEW:** REVOKED enum status added to Prisma schema
- **NEW:** API is idempotent (revoke already-revoked badge returns 200)
- Authorization: Only ADMIN or original issuer can revoke

**Technical Updates (Post-Review):**
- Must create AuditLog infrastructure (+1h)
- Must use REVOKED status enum (not soft-delete with revokedAt field) (+0.5h)
- Must add revokedAt index for admin reports (+0.5h)
- TDD approach: Write tests first, then implement

**Link:** [9-1-revoke-api.md](9-1-revoke-api.md)

---

####Story 9.2:** [Revoked Badge Status in Verification](9-2-verification-status.md) - **HIGH** - 4h
As an **External Verifier**,  
I want **to see when a badge has been revoked on the verification page**,  
So that **I know the badge is no longer valid**.

**Acceptance Criteria:**
- Public verification page shows REVOKED status clearly
- Revocation date and reason (if public-facing) displayed
- Visual treatment (red badge, warning icon)
- JSON-LD assertion reflects revoked status
- Open Badges 2.0 compliance maintained
- **UX Decision:** Show revocation reason only if public-safe category (not "Policy Violation")

**Link:** [9-2-verification-status.md](9-2-verification-status.md)

---

#### **Story 9.3:** [Employee Wallet Revoked Badge Display](9-3-wallet-display.md) - **HIGH** - 4h
As an **Employee**,  
I want **to see which of my badges have been revoked in my wallet**,  
So that **I understand my current credential status**.

**Acceptance Criteria:**
- **UX Decision:** Revoked badges shown greyed out with red "REVOKED" banner overlay
- Badge detail modal shows revocation details
- **UX Decision:** Show revocation reason with categorization (public vs private)
- Revoked badges cannot be shared (button disabled with tooltip)
- Download still available (for record keeping)
- Filter option: Show/hide revoked badges (optional)

**Link:** [9-3-wallet-display.md](9-3-wallet-display.md)

---

#### **Story 9.4:** [Revocation Notifications](9-4-notifications.md) - **MEDIUM** - 2-3h
As an **Employee**,  
I want **to receive a notification when my badge is revoked**,  
So that **I'm aware of the change in my credential status**.

**Acceptance Criteria:**
- Email notification sent immediately on revocation
- Email includes revocation reason (if appropriate)
- Email template professional and empathetic
- Teams notification (if enabled)
- Notification logged in audit trail

**Link:** [9-4-notifications.md](9-4-notifications.md)

---

#### **Story 9.5:** [Admin Revocation UI](9-5-admin-ui.md) - **HIGH** - 3-4h
As an **Admin**,  
I want **an intuitive UI to revoke badges with reason selection**,  
So that **I can quickly handle policy violations or errors**.

**Acceptance Criteria:**
- Revoke button/action in admin badge management
- Modal with reason dropdown (Policy Violation, Error, Expired, Other)
- Optional notes field
- Confirmation dialog with impact warning
- Success feedback after revocation
- Bulk revoke capability (nice-to-have)

**Link:** [9-5-admin-ui.md](9-5-admin-ui.md)

---

### UAT Phase Stories (U.1-U.3)

#### **Story U.1:** [Complete Lifecycle UAT Execution](U-1-lifecycle-uat.md) - **CRITICAL** - 6-8h
As a **Product Owner**,  
I want **to execute complete badge lifecycle testing across all roles**,  
So that **I can verify the entire user experience works correctly**.

**Acceptance Criteria:**
- 4 test scenarios executed (Happy Path, Error Cases, Privacy, Integration)
- All 4 user roles tested (Admin, Issuer, Employee, External Verifier)
- Screen recordings captured for key workflows
- UAT Test Report document created
- Issue list prioritized (P0/P1/P2/P3)

**Link:** [U-1-lifecycle-uat.md](U-1-lifecycle-uat.md)

---

#### **Story U.2a:** [M365 User Sync MVP](U-2-demo-seed.md) - **HIGH** - 6h ← **SPLIT from U.2**
As a **Developer**,  
I want **to sync users from Microsoft 365 organization for realistic UAT data**,  
So that **UAT testing uses actual organizational users instead of mock accounts**.

**Acceptance Criteria:**
- GraphUsersService calls Microsoft Graph `/users` API
- **SECURITY FIX:** Role mapping via .env file (NOT YAML in Git)
- **SECURITY FIX:** Production guard prevents accidental sync (NODE_ENV check)
- Hybrid mode: `npm run seed:demo` (local) OR `npm run seed:m365`
- Support <100 users (Product Owner org ~15 users)
- Upsert pattern (safe to re-run)
- Console output shows progress
- Fallback to local mode if M365 API fails

**MVP Limitations (Sprint 7):**
- No pagination (works for <100 users)
- No retry logic (fail-fast with error message)
- No audit logging
- No user deactivation sync

**Deferred to Story U.2b (Sprint 8):**
- Pagination support (1000+ users)
- Retry logic with exponential backoff (ADR-008 compliance)
- Audit logging (who synced, when, count)
- User deactivation sync (deleted M365 users)

**Prerequisites:**
- Product Owner must verify User.Read.All permission granted in Azure Portal

**Link:** [U-2-demo-seed.md](U-2-demo-seed.md)

---

#### **Story U.2b:** M365 Sync Production Hardening - **Sprint 8** - 6h
- Pagination support for large organizations (1000+ users)
- Retry logic with exponential backoff
- Audit logging for compliance
- User deactivation sync
- Enhanced error messages
- Comprehensive testing
- Update ADR-008 documentation

**Status:** Sprint 8 Backlog

---

#### **Story U.3:** [UAT Issue Resolution](U-3-bug-fixes.md) - **VARIABLE** - TBD
As a **Development Team**,  
I want **to fix all P0 and P1 issues found during UAT**,  
So that **the user experience meets quality standards**.

**Acceptance Criteria:**
- All P0 (blocker) issues fixed
- All P1 (high priority) issues fixed
- Regression testing completed
- UAT re-test confirms fixes
- P2/P3 issues documented in backlog

**Link:** [U-3-bug-fixes.md](U-3-bug-fixes.md)

---

## ⏱️ Capacity Planning

### Sprint Timeline (7 days) - UPDATED AFTER TECHNICAL REVIEW

**Day 1 (Feb 3): Backend Foundation**
- Story 9.1: Badge Revocation API (7h - TDD approach)
- Axe-core accessibility setup (0.5h)
- **Total: 7.5h**

**Day 2 (Feb 4): Frontend Development**
- Design sync meeting (15min)
- Story 9.2: Verification Update (4h)
- Story 9.3: Wallet UI Update (4h)
- Story 0.2a: Login MVP START (2h of 6h)
- **Total: 10.25h** (can split UI/backend tasks)

**Day 3 (Feb 5): Auth & Data**
- Story 0.2a: Login MVP COMPLETE (4h remaining)
- Story U.2a: M365 Sync MVP (6h)
- **Total: 10h** (could parallelize with 2 developers)

**Day 4 (Feb 6): Integration**
- Story 9.5: Admin Revocation UI (4h)
- Story 9.4: Revocation Notifications (3h)
- Integration testing (1h)
- **Total: 8h**

**Day 5 (Feb 7): UAT Day 1**
- Story U.1: Complete UAT Phase 1 (8h)
  - Badge creation → issuance → claim
  - Badge sharing → verification  
  - Badge revocation → wallet display
- **Total: 8h**

**Day 6 (Feb 8): UAT Day 2 & Bug Fixes**
- Story U.1: Complete UAT Phase 2 (4h)
  - Admin UI testing
  - Email notification testing
  - Accessibility testing (+1h from risk mitigation)
- Story U.3: Bug Fixes START (4h of 8h)
- **Total: 8h**

**Day 7 (Feb 9): Finalization & Buffer**
- Story U.3: Bug Fixes COMPLETE (4h remaining)
- Sprint Retrospective (1h)
- Documentation updates (1h)
- Production readiness checklist (1h)
- Buffer for overflow (1h)
- **Total: 8h**

### Total Estimated Effort

| Category | Stories | Estimated Hours | Notes |
|----------|---------|-----------------|-------|
| **Sprint Setup** | 0.1, 0.2a | 5 min + 6h | Login MVP |
| **Epic 9 Stories** | 9.1-9.5 | 22h | +3h from review |
| **M365 Sync MVP** | U.2a | 6h | Security fixes |
| **UAT Execution** | U.1 | 12h | 2-day UAT |
| **Bug Fixes** | U.3 | 8h | TBD based on UAT |
| **Risk Mitigation** | Axe-core, meetings | 1.25h | Accessibility |
| **Total** | 11 stories | **54.5h** | Realistic estimate |

**Team Capacity:** Solo developer × 7 days × 8h/day = **56h available**

**Buffer:** 1.5h (3% - minimal but Sprint 7 can extend if needed)

**Deferred to Sprint 8:**
- Story 0.2b: Auth Enhancements (3h)
- Story 0.3: CSP Security Headers (1h)
- Story U.2b: M365 Sync Hardening (6h)
- Epic 9 polish items (Open Badges full compliance, etc.)

### Capacity Analysis

**Critical Path:** 40 hours (Story 9.1 → 9.3 → 0.2a → 9.5 → U.1 → U.3)  
**Total Capacity:** 56 hours  
**Buffer:** 16 hours (29% - HEALTHY)

**Risk Mitigation Built-In:**
- Day 1: TDD for Story 9.1 (prevent downstream blocks)
- Day 1: Axe-core setup (catch accessibility issues early)
- Day 2: Design sync meeting (ensure UI consistency)
- Day 7: Full buffer day for UAT overflow

---

## 🛠️ Technical Tasks

### Database Changes
- [ ] Add `Badge.revokedAt` (DateTime, nullable)
- [ ] Add `Badge.revokedBy` (String, foreign key to User.id)
- [ ] Add `Badge.revocationReason` (String, nullable)
- [ ] Add `Badge.revocationNotes` (Text, nullable)
- [ ] Create Prisma migration for new fields
- [ ] Update Badge model in Prisma schema

### Backend Tasks
- [ ] Implement `POST /api/badges/:id/revoke` endpoint
- [ ] Update badge status enum (add REVOKED)
- [ ] Create revocation service with audit logging
- [ ] Update verification endpoint to handle revoked status
- [ ] Update badge wallet query to include revoked badges
- [ ] Implement revocation email notification
- [ ] Add authorization checks (only admin/issuer)
- [ ] Unit tests for revocation logic (15-20 tests)

### Frontend Tasks
- [ ] Create RevokeBadgeModal component
- [ ] Add revoke button to admin badge management
- [ ] Update badge wallet to show revoked status
- [ ] Update badge detail modal for revoked badges
- [ ] Disable sharing for revoked badges
- [ ] Update verification page styling for revoked status
- [ ] Add filter for revoked badges in wallet
- [ ] UI polish and responsive design

### UAT Tasks
- [ ] Create UAT test plan document
- [ ] Set up screen recording tools (OBS/Loom)
- [ ] Create demo seed data script
- [ ] Execute 4 test scenarios
- [ ] Document all findings with screenshots
- [ ] Prioritize issues (P0/P1/P2/P3)
- [ ] Create UAT Test Report

### Documentation Tasks
- [ ] Update API documentation (Swagger)
- [ ] Create revocation user guide
- [ ] Update admin documentation
- [ ] Document UAT process for future sprints
- [ ] Update lessons-learned.md with UAT insights

---

## 🔗 Dependencies & Integration Points

### Internal Dependencies
- ✅ Badge issuance system (Sprint 3, Epic 4)
- ✅ Badge verification system (Sprint 5, Epic 6)
- ✅ Email notification system (Sprint 6, Epic 7)
- ✅ Employee badge wallet (Sprint 4, Epic 5)

### External Dependencies
- ✅ Azure PostgreSQL (existing)
- ✅ Azure Blob Storage (existing)
- ✅ Microsoft Graph API (Sprint 6)
- ✅ Azure Communication Services (Sprint 6)

**No new external dependencies required!**

---

## 🔧 Technical Stack

**Version Manifest:** [version-manifest.md](version-manifest.md)

**Key Technologies:**
- **Backend:** NestJS 11.0.1, Prisma 6.19.2, PostgreSQL 16
- **Frontend:** React 19.2.3, Vite 7.3.1, TypeScript 5.9.3
- **Testing:** Jest (backend), Vitest (frontend), Manual UAT
- **Infrastructure:** Azure PostgreSQL, Azure Blob Storage

---

## 📊 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **UAT discovers major UX issues** | Medium | High | Buffer time allocated (17-29h), prioritization framework ready |
| **Database migration complexity** | Low | Medium | Simple schema addition, no data migration needed |
| **Revoked badge display complexity** | Low | Medium | Can reuse existing badge card components |
| **Email template issues** | Low | Low | Reuse existing notification templates |
| **Performance with revoked badges** | Low | Medium | Database indexes on status field, pagination already implemented |

---

## ✅ Definition of Done

**Story-Level DoD:**
- [ ] Code implemented and passing linting
- [ ] Unit tests written and passing (>80% coverage)
- [ ] API endpoints documented in Swagger
- [ ] Frontend component responsive on desktop/tablet/mobile
- [ ] Code reviewed (self-review or peer)
- [ ] Manual testing completed
- [ ] Story file updated with completion notes

**Sprint-Level DoD:**
- [ ] All Epic 9 stories (9.1-9.5) complete
- [ ] Complete lifecycle UAT executed and documented
- [ ] All P0 and P1 issues fixed
- [ ] Regression testing passed
- [ ] Demo seed data script working
- [ ] Sprint retrospective completed
- [ ] Documentation updated (lessons-learned, completion report)
- [ ] Code merged to main branch
- [ ] Git tag created (v0.7.0)

---

## 📅 Sprint Ceremonies

### Daily Standup
- **Time:** 9:00 AM daily
- **Duration:** 15 minutes
- **Format:** What did I do yesterday? What will I do today? Any blockers?

### Sprint Review
- **Time:** February 7, 2026, 3:00 PM
- **Duration:** 1 hour
- **Attendees:** Dev team + Product Owner (LegendZhu)
- **Agenda:** Demo revocation feature, present UAT findings

### Sprint Retrospective
- **Time:** February 7, 2026, 4:15 PM
- **Duration:** 45 minutes
- **Format:** What went well? What could be improved? Action items

---

## 📚 Reference Documents

### Planning Documents
- [Sprint Planning Checklist](../../templates/sprint-planning-checklist.md)
- [Epics.md](../../planning/epics.md) - Epic 9 details
- [Infrastructure Inventory](../../setup/infrastructure-inventory.md)

### Previous Sprint References
- [Sprint 6 Completion Report](../sprint-6/sprint-6-completion-report.md)
- [Sprint 6 Retrospective](../sprint-6/sprint-6-retrospective.md)
- [Lessons Learned](../../lessons-learned/lessons-learned.md)

### Technical References
- [Open Badges 2.0 Specification](https://www.imsglobal.org/spec/ob/v2p0/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**Backlog Created:** January 31, 2026  
**Next Update:** Daily during Sprint 7  
**Owner:** Bob (Scrum Master) + Amelia (Dev Agent)
