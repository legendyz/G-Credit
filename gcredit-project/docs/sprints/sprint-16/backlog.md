# Sprint 16 Backlog

**Sprint Number:** Sprint 16  
**Sprint Goal:** Issuer Template Ownership Isolation (F-1) + Pilot Readiness Validation  
**Duration:** 2026-03-03 – 2026-03-04 (2 working days)  
**Team Capacity:** 1 AI developer × 12h  
**Sprint Lead:** SM Agent

---

## Sprint Goal

Enforce issuer-level template ownership so each Issuer can only issue badges, filter templates, and edit templates they created — while ADMIN retains full access. Validate pilot readiness with seed data and a comprehensive UAT.

**Success Criteria:**
- [ ] Issuer-A cannot issue badges using Issuer-B's template (403 Forbidden)
- [ ] Issuer sees only own templates in Issue Badge / Bulk Issuance pages
- [ ] Issuer cannot edit/update templates created by another Issuer
- [ ] ADMIN bypasses all ownership checks
- [ ] Pilot seed script runs successfully (3 Issuers, 10 Employees, 5 templates, 15+ badges)
- [ ] UAT 20/20 PASS (12 F-1 RBAC + 6 regression + 2 pilot readiness)
- [ ] All 1,835+ tests pass (no regression)

---

## User Stories

**📝 用户故事格式：** 每个用户故事使用独立文件，存放于 `docs/sprints/sprint-16/` 目录。

---

### Epic: F-1 — Issuer Template Ownership Isolation

#### Story 16.1: Backend — Issuer Template Ownership Guard
**Priority:** 🔴 High  
**Estimate:** 4h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [16-1-issuer-template-ownership-guard.md](./16-1-issuer-template-ownership-guard.md)

**Quick Summary:** As an Issuer, I want badge issuance restricted to my own templates so that organizational accountability is clear.

**Key Deliverables:**
- [ ] `issueBadge()` ownership check (ISSUER → own template only; ADMIN → any)
- [ ] `bulkIssuance` upload/confirm ownership check
- [ ] Unit + E2E tests: own ✅, other's ✗, admin ✅

**Dependencies:** None

---

#### Story 16.2: Frontend — Template Ownership Filter
**Priority:** 🟡 Medium  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [16-2-frontend-template-ownership-filter.md](./16-2-frontend-template-ownership-filter.md)

**Quick Summary:** As an Issuer, I want the Issue Badge and Bulk Issuance pages to show only my templates so I don't see templates I can't use.

**Key Deliverables:**
- [ ] Backend `creatorId` query param on `GET /api/badge-templates`
- [ ] Frontend IssueBadgePage / BulkIssuancePage filter by creatorId for ISSUER role
- [ ] Frontend tests: ISSUER sees own templates, ADMIN sees all

**Dependencies:** 16.1

---

#### Story 16.3: Template Edit/Update Ownership Guard
**Priority:** 🟡 Medium  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [16-3-template-edit-ownership-guard.md](./16-3-template-edit-ownership-guard.md)

**Quick Summary:** As an Issuer, I want to only edit/update/change status on templates I created so that another Issuer cannot modify my templates.

**Key Deliverables:**
- [ ] PATCH /api/badge-templates/:id ownership check (extends ARCH-P1-004 pattern)
- [ ] PATCH /api/badge-templates/:id/status ownership check
- [ ] Unit + E2E tests

**Dependencies:** None (parallel with 16.1)

---

### Epic: Pilot Readiness

#### Story 16.4: Pilot Seed Data + Smoke Test
**Priority:** 🟡 Medium  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [16-4-pilot-seed-smoke-test.md](./16-4-pilot-seed-smoke-test.md)

**Quick Summary:** As a PM, I want a realistic pilot seed script so that we can demo the system with representative data.

**Key Deliverables:**
- [ ] `prisma/seed-pilot.ts` script (3 Issuers, 10 Employees, 1 Admin, 5 templates, 15+ badges)
- [ ] npm script `seed:pilot`
- [ ] Smoke test: login each role, verify data visible

**Dependencies:** 16.1, 16.3 (ownership must work before seeding)

---

#### Story 16.5: Sprint 16 UAT
**Priority:** 🔴 High  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [16-5-sprint-16-uat.md](./16-5-sprint-16-uat.md)

**Quick Summary:** Comprehensive UAT covering all F-1 ownership rules, regression, and pilot readiness.

**Key Deliverables:**
- [ ] 20 test scenarios executed (12 F-1 + 6 regression + 2 pilot)
- [ ] All PASS or findings documented
- [ ] UAT sign-off

**Dependencies:** 16.1, 16.2, 16.3, 16.4

---

### 📊 Stories Summary

| Story ID | Title | Priority | Hours | Status |
|----------|-------|----------|-------|--------|
| 16.1 | Backend Ownership Guard | 🔴 High | 4h | 🔴 |
| 16.2 | Frontend Template Filter | 🟡 Med | 2h | 🔴 |
| 16.3 | Template Edit Guard | 🟡 Med | 2h | 🔴 |
| 16.4 | Pilot Seed + Smoke Test | 🟡 Med | 2h | 🔴 |
| 16.5 | Sprint 16 UAT | 🔴 High | 2h | 🔴 |
| **Total** | - | - | **12h** | - |

---

## Definition of Done

**Story-Level DoD:**
- [ ] All acceptance criteria met
- [ ] Unit tests written + passing
- [ ] No regression in existing test suite

**Sprint-Level DoD:** ⚠️ **CRITICAL**
- [ ] **project-context.md已更新**
- [ ] **Sprint summary + retrospective已创建**
- [ ] **CHANGELOG.md已更新** (frontend + backend)
- [ ] **代码已合并到main + Git tag已创建** (v1.6.0)
- [ ] **所有测试通过** (1,835+ tests, no regression)

---

## Technical Tasks

### Infrastructure
- None (no new Azure resources, no Prisma migration)

### Technical Debt
- F-1 resolves part of TD-032 (RBAC strengthening)

---

## Sprint Capacity Planning

| Resource | Capacity | Allocated | Buffer |
|----------|----------|-----------|--------|
| AI Developer | 12h | 12h | 0h |

---

## Sprint Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Existing E2E tests break due to ownership checks | Medium | Medium | Review all badge-issuance E2E fixtures for template ownership setup |
| Bulk issuance flow complexity | Low | Medium | Re-use same guard pattern as single issuance |

---

## Dependencies

### Internal Dependencies
- 16.2 depends on 16.1 (backend guard must exist before frontend filters)
- 16.4 depends on 16.1 + 16.3 (ownership enforced before seeding)
- 16.5 depends on all prior stories

### External Dependencies
- None

---

## Execution Order

```
Wave 1 (parallel): 16.1 + 16.3  → Backend ownership guards  (6h)
Wave 2:            16.2          → Frontend template filter   (2h)
Wave 3:            16.4          → Pilot seed + smoke test    (2h)
Wave 4:            16.5          → Final UAT                  (2h)
```

---

## Related Documents

- [Version Manifest](./version-manifest.md)
- [Previous Sprint Backlog](../sprint-15/backlog.md)
- [Sprint Planning Checklist](../../templates/sprint-planning-checklist.md)

---

**Last Updated:** 2026-03-02  
**Status:** Planning Complete  
**Template Version:** v1.2
