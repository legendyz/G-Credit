# Sprint 7 Backlog - Badge生命周期完整化 + UAT验证

**Sprint:** Sprint 7  
**Duration:** February 3-7, 2026 (5 days)  
**Team:** Amelia (Dev Agent) + LegendZhu  
**Epic:** Epic 9 - Badge Revocation + Complete Lifecycle UAT

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

### Epic 9: Badge Revocation (Stories 9.1-9.5)

#### **Story 9.1:** [Badge Revocation API](9-1-revoke-api.md) - **HIGH** - 4-5h
As an **Admin or Issuer**,  
I want **to revoke a badge with a documented reason**,  
So that **I can handle policy violations, errors, or expired credentials properly**.

**Acceptance Criteria:**
- API endpoint `POST /api/badges/:id/revoke` implemented
- Request body accepts revocation reason and optional notes
- Soft-delete pattern (status updated, not deleted)
- Audit log entry created
- Authorization: Only ADMIN or original issuer can revoke

**Link:** [9-1-revoke-api.md](9-1-revoke-api.md)

---

#### **Story 9.2:** [Revoked Badge Status in Verification](9-2-verification-status.md) - **HIGH** - 2-3h
As an **External Verifier**,  
I want **to see when a badge has been revoked on the verification page**,  
So that **I know the badge is no longer valid**.

**Acceptance Criteria:**
- Public verification page shows REVOKED status clearly
- Revocation date and reason (if public) displayed
- Visual treatment (red badge, warning icon)
- JSON-LD assertion reflects revoked status
- Open Badges 2.0 compliance maintained

**Link:** [9-2-verification-status.md](9-2-verification-status.md)

---

#### **Story 9.3:** [Employee Wallet Revoked Badge Display](9-3-wallet-display.md) - **HIGH** - 3-4h
As an **Employee**,  
I want **to see which of my badges have been revoked in my wallet**,  
So that **I understand my current credential status**.

**Acceptance Criteria:**
- Revoked badges shown in wallet (greyed out or marked)
- Badge detail modal shows revocation details
- Revoked badges cannot be shared
- Download still available (for record keeping)
- Filter option: Show/hide revoked badges

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

#### **Story U.2:** [Demo Seed Data Creation](U-2-demo-seed.md) - **HIGH** - 3-4h
As a **Developer**,  
I want **comprehensive demo seed data script**,  
So that **UAT testing can be quickly repeated and stakeholder demos are rich**.

**Acceptance Criteria:**
- Seed script creates 3 admins, 5 employees
- 10 badge templates across different categories
- 20 badges in various states (ISSUED, CLAIMED, REVOKED)
- Email notification history populated
- Script can reset database to clean state
- Run time < 2 minutes

**Link:** [U-2-demo-seed.md](U-2-demo-seed.md)

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

### Sprint Timeline (5 days)

**Day 1-2: Epic 9 Development**
- Day 1: Stories 9.1 + 9.2 (Backend: API + Verification)
- Day 2: Stories 9.3 + 9.4 + 9.5 (Frontend + Notifications + Admin UI)
- Parallel: U.2 Demo Seed Data creation

**Day 3: Complete Lifecycle UAT**
- Story U.1: Execute 4 test scenarios
- Record screen videos
- Document all findings
- Prioritize issues

**Day 4-5: UAT Issue Resolution**
- Story U.3: Fix P0/P1 issues
- Regression testing
- UAT re-verification
- Documentation updates

### Total Estimated Effort

| Category | Stories | Estimated Hours |
|----------|---------|-----------------|
| **Epic 9 Stories** | 9.1-9.5 | 14-19h |
| **UAT Execution** | U.1 | 6-8h |
| **Demo Seed Data** | U.2 | 3-4h |
| **Bug Fixes** | U.3 | 8-12h (TBD) |
| **Total** | 8 stories | **31-43h** |

**Team Capacity:** 2 developers × 5 days × 6h/day = **60h available**

**Buffer:** ~17-29h for unknowns and polish

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
