# Sprint 12 Backlog

**Sprint Number:** Sprint 12  
**Sprint Goal:** Complete the three core management UIs (Skill, User, Milestone) and unify the evidence system, giving admins full platform control through the browser.  
**Duration:** TBD (Phase 2 review will confirm dates)  
**Team Capacity:** Solo developer + AI agents  
**Sprint Lead:** LegendZhu

---

## Sprint Goal

Deliver the remaining admin management interfaces (Skill Category, Skill, User, Milestone) and resolve the dual evidence system (TD-010), so that ALL admin operations can be performed through the UI without direct database access. Secondary: clean up activity feed formatting (TD-016) and skill UUID display (TD-017).

**Success Criteria:**
- [ ] Admin can CRUD Skill Categories (hierarchical, 3-level tree)
- [ ] Admin can CRUD Skills within categories
- [ ] Admin can manage users (role edit, lock/unlock, search)
- [ ] Admin can manage Milestones (CRUD, activate/deactivate)
- [ ] Evidence system unified — single EvidenceFile model, no more Dual paths
- [ ] All existing tests pass + new tests for Sprint 12 features
- [ ] Activity feed shows readable descriptions (not JSON)

---

## Wave Structure (per Lesson 41)

### Wave 1: Admin Management UIs (Stories 12.1 — 12.4)
*Focus: New admin pages for Skill, User, Milestone management*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 12.1 | Skill Category Management UI | 🔴 HIGH | 10h | — |
| 12.2 | Skill Management UI | 🔴 HIGH | 10h | 12.1 |
| 12.3 | User Management UI Enhancement | 🔴 HIGH | 10h | — |
| 12.4 | Milestone Admin UI | 🟡 MEDIUM | 8h | — |

**Parallelization:** 12.1 → 12.2 (sequential). 12.3, 12.4 independent — can run parallel with 12.1/12.2.

### Wave 2: Evidence Unification (Stories 12.5 — 12.6)
*Focus: Resolve TD-010 — backend data model + frontend UI*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 12.5 | Evidence Unification — Data Model | 🔴 HIGH | 14h | — |
| 12.6 | Evidence Unification — UI | 🔴 HIGH | 10h | 12.5 |

**Parallelization:** 12.5 → 12.6 (sequential). Can run after Wave 1 or in parallel if not resource-constrained.

### Wave 3: Quick Fixes (Stories 12.7 — 12.8)
*Focus: Small tech debt items — can be done anytime*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 12.7 | Admin Activity Feed Formatting | 🟢 LOW | 3h | — |
| 12.8 | Skills UUID Fallback Hardening | 🟢 LOW | 2h | — |

**Parallelization:** Both independent — can be done anytime as buffer work.

### Wave 4: UAT (Story 12.9)
*Focus: User acceptance testing of all Sprint 12 features*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 12.9 | Sprint 12 UAT | 🟡 MEDIUM | 5h | 12.1–12.8 all complete |

**Timing:** Execute after all development stories are done, before merge to main.

---

## User Stories

### Wave 1: Admin Management UIs

#### Story 12.1: Skill Category Management UI
**Priority:** 🔴 High  
**Estimate:** 10h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-1-skill-category-management-ui.md](sprint-12/12-1-skill-category-management-ui.md)

**Quick Summary:** As an Admin, I want to manage skill categories in a hierarchical tree UI so that skills are organized into a browsable taxonomy.

**Key Deliverables:**
- [ ] Shared `<AdminPageShell>`, `<ConfirmDialog>`, `<CategoryTree>` components
- [ ] Tree view with drag-and-drop reorder (`@dnd-kit`, same-level)
- [ ] CRUD operations (create, rename, reorder, delete with guard)
- [ ] System-defined category protection (lock icon, no delete, 403)
- [ ] Responsive: tree → dropdown on <1024px
- [ ] Tests

**Dependencies:** None

---

#### Story 12.2: Skill Management UI
**Priority:** 🔴 High  
**Estimate:** 10h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-2-skill-management-ui.md](sprint-12/12-2-skill-management-ui.md)

**Quick Summary:** As an Admin, I want to manage individual skills within categories so that the skill library is maintainable through the UI.

**Key Deliverables:**
- [ ] Split layout: category tree (left) + skills table (right)
- [ ] Skill CRUD (add, edit, delete with badge-usage guard)
- [ ] Colored skill tags
- [ ] Tests

**Dependencies:** Story 12.1

---

#### Story 12.3: User Management UI Enhancement
**Priority:** 🔴 High  
**Estimate:** 10h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-3-user-management-ui-enhancement.md](sprint-12/12-3-user-management-ui-enhancement.md)

**Quick Summary:** As an Admin, I want to manage users with role editing, account lock/unlock, and detail panels so that user administration is complete.

**Key Deliverables:**
- [ ] Enhanced user table with search, filter, sort
- [ ] Role edit (inline or modal)
- [ ] Account lock/unlock toggle
- [ ] User detail slide-over panel
- [ ] Tests

**Dependencies:** None

---

#### Story 12.4: Milestone Admin UI
**Priority:** 🟡 Medium  
**Estimate:** 8h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-4-milestone-admin-ui.md](sprint-12/12-4-milestone-admin-ui.md)

**Quick Summary:** As an Admin, I want to create and manage milestone configurations so that achievement tracking is configurable through the UI.

**Key Deliverables:**
- [ ] Milestone card grid layout
- [ ] Dynamic form per milestone type (BADGE_COUNT, SKILL_TRACK, ANNIVERSARY, CUSTOM)
- [ ] Active/inactive toggle
- [ ] Achievement count display
- [ ] Tests

**Dependencies:** None (resolves TD-009)

---

### Wave 2: Evidence Unification

#### Story 12.5: Evidence Unification — Data Model
**Priority:** 🔴 High  
**Estimate:** 14h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-5-evidence-unification-data-model.md](sprint-12/12-5-evidence-unification-data-model.md)

**Quick Summary:** As a Developer, I want to unify the dual evidence system into a single EvidenceFile model with migration so that evidence is consistent across the platform.

**Key Deliverables:**
- [ ] EvidenceFile schema: type (FILE|URL), `sourceUrl` field
- [ ] Two-phase migration: schema (Prisma) + data script (standalone)
- [ ] Unified `EvidenceItem` API contract
- [ ] Bulk issuance update (20+ file references)
- [ ] Tests

**Dependencies:** None (resolves TD-010 Phase 1)

---

#### Story 12.6: Evidence Unification — UI
**Priority:** 🔴 High  
**Estimate:** 10h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-6-evidence-unification-ui.md](sprint-12/12-6-evidence-unification-ui.md)

**Quick Summary:** As an Admin/Issuer, I want badge issuance to support file uploads and all pages to display evidence uniformly.

**Key Deliverables:**
- [ ] Shared EvidenceList component
- [ ] File upload in IssueBadgePage
- [ ] Evidence column in Badge Management
- [ ] SAS token fix for VerifyBadgePage
- [ ] Tests

**Dependencies:** Story 12.5 (resolves TD-010 Phase 2)

---

### Wave 3: Quick Fixes

#### Story 12.7: Admin Activity Feed Formatting
**Priority:** 🟢 Low  
**Estimate:** 3h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-7-admin-activity-feed-formatting.md](sprint-12/12-7-admin-activity-feed-formatting.md)

**Quick Summary:** As an Admin, I want the dashboard activity feed to show human-readable descriptions instead of JSON.

**Key Deliverables:**
- [ ] `formatActivityDescription()` function
- [ ] All action types: ISSUED, CLAIMED, REVOKED, etc.
- [ ] Tests

**Dependencies:** None (resolves TD-016)

---

#### Story 12.8: Skills UUID Fallback Hardening
**Priority:** 🟢 Low  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-8-skills-uuid-fallback-hardening.md](sprint-12/12-8-skills-uuid-fallback-hardening.md)

**Quick Summary:** As a Developer, I want to ensure no UUID is ever shown to users when skill name lookup fails.

**Key Deliverables:**
- [ ] Audit all skill display locations
- [ ] Apply `useSkillNamesMap()` where missing
- [ ] "Unknown Skill" fallback
- [ ] Tests

**Dependencies:** None (resolves TD-017)

---

### Wave 4: UAT

#### Story 12.9: Sprint 12 UAT — Management UIs + Evidence Unification
**Priority:** 🟡 Medium  
**Estimate:** 5h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-9-sprint-12-uat.md](sprint-12/12-9-sprint-12-uat.md)

**Quick Summary:** As a PO/Tester, I want to validate all Sprint 12 features through structured UAT so that the release is verified.

**Key Deliverables:**
- [ ] UAT test plan document (`sprint-12/uat-test-plan.md`)
- [ ] ~24 new feature test cases (Skill Category, Skill, User, Milestone, Evidence, Quick Fixes)
- [ ] ~6 regression test cases (issuance, wallet, verify, revoke, sharing, RBAC)
- [ ] Seed data updated for new entities
- [ ] Sign-off

**Dependencies:** All Stories 12.1–12.8

---

### 📊 Stories Summary

| Story ID | Title | Priority | Hours | Status | Tech Debt |
|----------|-------|----------|-------|--------|-----------|
| 12.1 | Skill Category Management UI | 🔴 High | 10h | 🔴 | — |
| 12.2 | Skill Management UI | 🔴 High | 10h | 🔴 | — |
| 12.3 | User Management UI Enhancement | 🔴 High | 10h | 🔴 | — |
| 12.4 | Milestone Admin UI | 🟡 Med | 8h | 🔴 | TD-009 |
| 12.5 | Evidence Unification — Data Model | 🔴 High | 14h | 🔴 | TD-010 P1 |
| 12.6 | Evidence Unification — UI | 🔴 High | 10h | 🔴 | TD-010 P2 |
| 12.7 | Admin Activity Feed Formatting | 🟢 Low | 3h | 🔴 | TD-016 |
| 12.8 | Skills UUID Fallback Hardening | 🟢 Low | 2h | 🔴 | TD-017 |
| 12.9 | Sprint 12 UAT | 🟡 Med | 5h | 🔴 | — |
| **Total** | **9 stories** | — | **72h** | — | — |

---

## Definition of Done

**Story-Level DoD:**
- All Acceptance Criteria met
- Unit tests written and passing
- No TypeScript errors
- No ESLint warnings
- Pre-push hook passes
- Story doc updated with completion notes

**Sprint-Level DoD:**
- [ ] UAT test plan created and executed (Story 12.9)
- [ ] All CRITICAL/HIGH UAT test cases PASS
- [ ] project-context.md updated
- [ ] Sprint summary + retrospective created
- [ ] CHANGELOG.md updated (frontend + backend)
- [ ] Code merged to main + Git tag (v1.2.0)
- [ ] All tests pass (Unit >80%, E2E critical paths)

---

## Sprint Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Evidence migration corrupts data | Medium | High | Reversible migration + backup, test on copy first |
| Skill tree performance (deep nesting) | Low | Medium | Limit to 3 levels (schema enforced) |
| API contract changes break frontend | Medium | Medium | Version API, update consumers in same PR |
| Scope creep from Phase 2 review | Medium | Low | Architect/UX can suggest but SM gates scope |

---

## Dependencies

### Internal Dependencies
- 12.2 depends on 12.1 (Skill UI needs Category tree component)
- 12.6 depends on 12.5 (Evidence UI needs unified API)

### External Dependencies
- None — no new Azure resources, no SSO changes

---

## Testing Strategy

### Unit Testing
- Target coverage: >80%
- New test files for each story
- Key: migration script tests, tree CRUD tests, evidence type tests

### E2E Impact
- Existing E2E scripts should not break (no auth changes)
- New pages: manual walkthrough + optional Playwright updates

---

## Notes

### Phase 2 Review Items
All 8 stories are marked "⚠️ Phase 2 Review Needed". Party Mode session with Architect (Winston) + UX Designer (Sally) will:
- Review tech approach for Evidence Unification (12.5/12.6)
- Review UI layouts/interactions for new admin pages (12.1-12.4)
- Validate estimates
- Confirm/adjust wave ordering

### Phase 2 Review Findings (Applied)
All 8 stories reviewed by Architect (Winston) + UX Designer (Sally) on 2026-02-19.

**Key decisions:**
- Drag-and-drop for tree reorder (`@dnd-kit`, same-level only)
- Skill tag colors derived from category (`color` field on SkillCategory)
- Inline add skill (tab-to-submit)
- Shared components: `<AdminPageShell>`, `<ConfirmDialog>`, `<CategoryTree>`, `<EvidenceList>`
- Milestone trigger Zod schemas per type
- Evidence field renamed: `sourceUrl` (not `externalUrl`)
- Two-phase migration (schema + data script separately)
- Bulk issuance impact: +2h to Story 12.5
- Two-step issuance UX (issue → attach evidence)
- `Badge.evidenceUrl` kept through Sprint 12 for backward compat, removed Sprint 13

**Estimate change:** 61h → 65h (+2h Story 12.1 for dnd + shared components, +2h Story 12.5 for bulk issuance) → 70h (+5h Story 12.9 UAT added) → **72h** (+2h Story 12.2 for category color propagation)

### Items Deferred to Sprint 13

| # | Item | Source | Est. | Reason |
|---|------|--------|------|--------|
| D-1 | Responsive tree→dropdown (`<1024px`) | Story 12.1 Task 1 | ~2h | Admin 管理页面主要桌面端使用，非核心 AC |
| D-2 | Blue insertion line (DnD visual feedback) | Story 12.1 Task 2 | ~1h | 需要 DragOverlay 自定义，当前 opacity 反馈可用 |
| D-3 | Cross-level "Move to..." action | Story 12.1 Task 2 | ~3h | 需新增后端 reparent API + MoveToDialog，独立功能点 |
| D-4 | Remove deprecated `Badge.evidenceUrl` field | Story 12.5 | ~1h | Sprint 12 保留向后兼容，Sprint 13 移除 |

**Total Sprint 13 carry-forward: ~7h**

### Lessons Applied from Sprint 11
- **Lesson 41:** Wave structure for parallelization
- **Lesson 42:** Stories are implementation-ready with explicit ACs and task lists
- **Lesson 43:** E2E test awareness — grep for affected consumers before committing

---

**Last Updated:** 2026-02-19 — Story 12.9 (UAT) added, total 70h  
**Status:** Planning Complete — Ready for Sprint Branch + Development  
**Template Version:** v1.2
