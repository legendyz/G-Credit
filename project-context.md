# G-Credit Project Context
## Internal Digital Credentialing System

**Project Name:** G-Credit  
**Project Type:** Enterprise Internal Platform (Greenfield)  
**Domain:** HR Tech / Learning & Development / Digital Credentials  
**License:** MIT License (Open Source)  
**Status:** ✅ Sprint 11 COMPLETE — 25/25 stories, v1.1.0 Released  
**Sprint 0:** ✅ Complete (100%, 9.5h/10h, committed 2026-01-24)  
**Sprint 1:** ✅ Complete (100%, 21h/21h, committed 2026-01-25)  
**Sprint 2:** ✅ Complete (100%, committed 2026-01-26)  
**Sprint 3:** ✅ Complete (100%, 13h/12.5h, committed 2026-01-28, tagged v0.3.0)  
**Sprint 4:** ✅ Complete (100%, 48h/48h estimated, committed 2026-01-28, tagged v0.4.0)  
**Sprint 5:** ✅ Complete (100%, actual 30h / estimated 28h, committed 2026-01-29, tagged v0.5.0, branch: sprint-5/epic-6-badge-verification)  
**Sprint 6:** ✅ Complete (100%, actual 35h / estimated 56-76h, committed 2026-01-31, branch: sprint-6/epic-7-badge-sharing, 243 tests, v0.6.0)  
**Sprint 7:** ✅ Complete (100%, actual 38.5h / estimated 41-47h, committed 2026-02-02, branch: sprint-7/epic-9-revocation-lifecycle-uat, 302 tests, 100% UAT pass, v0.7.0)  
**Sprint 8:** ✅ Complete (12/12 items, 100%, 80h/76h, branch: sprint-8/epic-10-production-ready-mvp, tagged v0.8.0, 876 tests)  
**Sprint 9:** ✅ Complete (5/5 stories, 37h/51h, branch: sprint-9/epic-8-bulk-issuance-td-cleanup, 1087 tests, v0.9.0-dev)  
**Sprint 10:** ✅ Complete (12/12 stories, branch: sprint-10/v1-release, 1061 tests, UAT 33/33 PASS, v1.0.0)  
**Sprint 11:** ✅ Complete (25/25 stories, 7 waves, branch: sprint-11/security-quality-hardening, 1,307 tests, UAT 152/153 PASS, v1.1.0)  
**Last Updated:** 2026-02-18 (Sprint 11 COMPLETE — merged to main, tagged v1.1.0, GitHub Release published)

---

## 🚨 Maintenance Protocol - How to Keep This Document Current

**⚠️ CRITICAL FOR ALL BMAD AGENTS (ESPECIALLY SM/DEV):** This file is the **Single Source of Truth** for the G-Credit project. It MUST be updated at specific milestones to remain accurate and useful.

### When to Update This Document

#### 🎯 MANDATORY: After Every Sprint Completion
**Trigger:** Sprint retrospective completed, all stories done  
**Responsible:** Scrum Master (Bob) or Developer (Amelia)  
**Reference:** `gcredit-project/docs/templates/sprint-completion-checklist-template.md`

**Required Updates:**
1. **Status Section (Lines 8-14):**
   - Update "Status:" line with current sprint completion
   - Update "Sprint N:" status line (mark as ✅ Complete)
   - Update "Last Updated:" date

2. **Implemented Features Section:**
   - Add new Sprint N subsection with:
     - Sprint completion date and metrics
     - API endpoints added (list all new endpoints)
     - Database models added/modified
     - Key features delivered
     - Testing statistics (X tests, Y% pass rate)
     - Branch name and version tag (if applicable)

3. **Next Actions Section:**
   - Mark current sprint as ✅ COMPLETE
   - Add next sprint planning entry (🔜 Sprint N+1 Planning)
   - Update epic options for next sprint

4. **Repository Structure (if changed):**
   - Update if new directories or modules were added
   - Update file counts or significant structure changes

5. **Technical Stack (if changed):**
   - Update if new dependencies were added
   - Update if versions were upgraded
   - Document any breaking changes

6. **Known Issues (if new issues discovered):**
   - Add new technical debt items
   - Update security vulnerability status
   - Document any deferred work

#### 📋 RECOMMENDED: After Major Milestones
- **New Epic Started:** Update "Current Phase" and epic progress
- **Architecture Change:** Update architecture references and decisions
- **Production Deployment:** Update deployment status and infrastructure
- **New Integration:** Update integration requirements section

### How to Update

**Step 1:** Load this file  
**Step 2:** Reference sprint completion checklist: `gcredit-project/docs/templates/sprint-completion-checklist-template.md`  
**Step 3:** Update all required sections listed above  
**Step 4:** Verify accuracy by reviewing recent sprint retrospective  
**Step 5:** Commit changes with message: `docs: Update project-context.md for Sprint N completion`

### Verification Checklist

After updating, verify:
- [ ] All sprint status lines are accurate
- [ ] "Last Updated" date is current
- [ ] New features are documented in "Implemented Features"
- [ ] "Next Actions" reflects current sprint status
- [ ] No outdated information remains
- [ ] All file paths are correct (especially after documentation reorganization)

### What NOT to Update Frequently

❌ **Don't change these unless truly necessary:**
- Project Vision (only if business direction changes)
- Business Objectives (stable over project lifetime)
- Core User Personas (stable unless new research)
- Integration Requirements (only when scope changes)

---

## Project Vision

Build an internal digital credentialing (badging) platform to securely recognize, verify, and analyze employee skills and achievements—replacing fragmented certificates and reducing dependence on external platforms.

---

## Key Documents

- **Product Brief:** `MD_FromCopilot/product-brief.md` ✅ COMPLETE
- **PRD:** `MD_FromCopilot/PRD.md` ✅ COMPLETE (33 FRs, 22 NFRs)
- **Architecture:** `gcredit-project/docs/architecture/system-architecture.md` ✅ COMPLETE (5,406 lines, 12 decisions, Phased Azure Strategy)
- **UX Design Specification:** `gcredit-project/docs/planning/ux-design-specification.md` ✅ COMPLETE (3,314 lines, 22 screens)
- **UX Wireframes:** `_bmad-output/excalidraw-diagrams/wireframe-gcredit-mvp-20260122.excalidraw` ✅ COMPLETE (10 screens: 6 desktop + 4 mobile)
- **Epics & Stories:** `gcredit-project/docs/planning/epics.md` ✅ COMPLETE (14 epics, 85 stories, 100% FR coverage)
- **Implementation Readiness Review:** `gcredit-project/docs/planning/implementation-readiness-report-2026-01-22.md` ✅ COMPLETE (Score: 10/10)
- **Sprint 0 Backlog:** `gcredit-project/docs/sprints/sprint-0/backlog.md` ✅ COMPLETE (All 5 stories delivered)
- **Sprint 0 Retrospective:** `gcredit-project/docs/sprints/sprint-0/retrospective.md` ✅ COMPLETE (Lessons learned & action items)
- **Sprint 1 Backlog:** `gcredit-project/docs/sprints/sprint-1/backlog.md` ✅ COMPLETE (7 stories, 21h actual, Epic 2 delivered)
- **Sprint 1 Retrospective:** `gcredit-project/docs/sprints/sprint-1/retrospective.md` ✅ COMPLETE (100% test pass rate, perfect time estimation)
- **Sprint 2 Backlog:** `gcredit-project/docs/sprints/sprint-2/backlog.md` ✅ COMPLETE (6 stories + 1 enhancement, Epic 3 delivered)
- **Sprint 2 Retrospective:** `gcredit-project/docs/sprints/sprint-2/retrospective.md` ✅ COMPLETE (27 tests, 100% pass rate, Azure integration)
- **Sprint 3 Backlog:** `gcredit-project/docs/sprints/sprint-3/backlog.md` ✅ COMPLETE (6 stories, 13h/12.5h, Epic 4 delivered)
- **Sprint 3 Retrospective:** `gcredit-project/docs/sprints/sprint-3/retrospective.md` ✅ COMPLETE (46 tests, Open Badges 2.0 compliance, v0.3.0)
- **Sprint 4 Backlog:** `gcredit-project/docs/sprints/sprint-4/backlog.md` ✅ COMPLETE (7 stories, 48h, Epic 5 delivered)
- **Sprint 4 Retrospective:** `gcredit-project/docs/sprints/sprint-4/retrospective.md` ✅ COMPLETE (58 tests, Timeline View + Badge Detail Modal)
- **Sprint 10 Retrospective:** `gcredit-project/docs/sprints/sprint-10/retrospective.md` ✅ COMPLETE (v1.0.0 Release, UAT 33/33, Lesson 39)
- **Sprint 10 Release Notes:** `gcredit-project/docs/sprints/sprint-10/v1.0.0-release-notes.md` ✅ COMPLETE (498 commits, 10 Epics)

**Post-MVP Audit Documents (2026-02-11):**
- **Audit Master Plan:** `gcredit-project/docs/planning/post-mvp-audit-plan.md` — 6 audit dimensions, agent assignments, priorities (394 lines)
- **Audit #1: PRD Compliance** — Covered within Feature Completeness Audit (#6)
- **Audit #2: Architecture Compliance:** `gcredit-project/docs/architecture/architecture-compliance-audit-2026-02.md` — 91% compliance, no P0 blockers (296 lines)
- **Audit #3: Architecture Quality:** `gcredit-project/docs/architecture/architecture-quality-assessment-2026-02.md` — 78% readiness, scalability 70%, modularity 85% (305 lines)
- **Audit #4: Code Quality:** `gcredit-project/docs/development/code-quality-audit-2026-02.md` — Overall grade B+, static analysis A, test quality B- (269 lines)
- **Audit #5: Security:** `gcredit-project/docs/security/security-audit-2026-02.md` — OWASP Top 10, 2 HIGH (localStorage JWT, no lockout), 3 MEDIUM, 4 LOW (234 lines)
- **Audit #6: Feature & UX:** `gcredit-project/docs/planning/feature-completeness-audit-2026-02.md` — 19/22 screens (86%), 35/37 endpoints (95%), 2 P0, 8 P1 (238 lines)
- **Sprint 11 Candidate List:** `gcredit-project/docs/planning/sprint-11-candidate-list.md` — Consolidated audit findings → actionable tickets (166 lines)
- **Sprint 11 Backlog:** `gcredit-project/docs/sprints/sprint-11/backlog.md` ✅ COMPLETE (25 stories, 7 waves, 65h)
- **Sprint 11 Summary:** `gcredit-project/docs/sprints/sprint-11/summary.md` ✅ COMPLETE (25/25 stories, 1,307 tests)
- **Sprint 11 Retrospective:** `gcredit-project/docs/sprints/sprint-11/retrospective.md` ✅ COMPLETE (Lessons 35-43, 6 action items)
- **Sprint 11 Evaluation:** `gcredit-project/docs/sprints/sprint-11/sprint-11-evaluation.md` ✅ COMPLETE (Grade A+, 4.95/5.0)
- **Story 11.24 Dev Prompt:** `gcredit-project/docs/sprints/sprint-11/11-24-dev-prompt.md` — Dev agent execution prompt
- **Story 11.25 Dev Prompt:** `gcredit-project/docs/sprints/sprint-11/11-25-dev-prompt.md` — Dev agent execution prompt
- **Story 11.25:** `gcredit-project/docs/sprints/sprint-11/11-25-cookie-auth-hardening.md` — Cookie auth migration fixes
- **UAT Plan v1.1.0:** `gcredit-project/docs/testing/uat-plan-v1.1.0.md` ✅ COMPLETE (153 cases, 152 PASS, 1 SKIP)
- **Technical Debt:** `gcredit-project/docs/sprints/sprint-11/technical-debt.md` — TD-009/010/016/017/018 (5 items, ~53-77h)

---

## 📂 Documentation Structure & Navigation Guide

**⚠️ IMPORTANT FOR ALL BMAD AGENTS:** This project follows a two-tier documentation architecture. Always reference the correct paths below.

### Canonical Documentation Location
**Primary:** `gcredit-project/docs/` - Project-specific technical documentation
**Secondary:** `_bmad-output/` - BMAD workflow outputs only (deprecated for most documentation)

### Directory Structure

```
gcredit-project/docs/
├── planning/              # Planning artifacts
│   ├── epics.md          # 14 epics, 85 stories
│   ├── ux-design-specification.md  # 22 screens, 3,314 lines
│   ├── implementation-readiness-report-2026-01-22.md
│   └── ux-design-directions.html
├── architecture/          # System architecture
│   ├── system-architecture.md  # 5,406 lines, 12 decisions
│   └── architecture-diagrams.md
├── sprints/              # Sprint documentation (Sprint 0-9)
│   ├── sprint-0/         # Infrastructure setup
│   ├── sprint-1/         # JWT auth & user management
│   ├── sprint-2/         # Badge template management
│   ├── sprint-3/         # Badge issuance
│   ├── sprint-4/         # Employee badge wallet
│   ├── sprint-5/         # Badge verification
│   ├── sprint-6/         # Badge sharing & social proof
│   ├── sprint-7/         # Badge revocation & lifecycle UAT
│   ├── sprint-8/         # Production-ready MVP
│   ├── sprint-9/         # ✅ COMPLETE - Bulk badge issuance + TD cleanup
│   └── sprint-10/        # ✅ COMPLETE - v1.0.0 Release Sprint (12 stories, UAT PASSED)
│       ├── backlog.md    # Sprint 6 backlog (1,317 lines)
│       ├── version-manifest.md  # ✅ CREATED 2026-01-29 (dependency versions)
│       ├── kickoff-readiness.md # Preparation tasks checklist
│       ├── ux-audit-report.md   # Existing pages UX audit
│       ├── email-template-specs.md  # Email template design
│       └── adaptive-card-specs.md   # Teams card design
├── decisions/            # Architecture Decision Records
│   ├── 002-lodash-security-risk-acceptance.md
│   ├── 003-badge-assertion-format.md
│   └── 004-email-service-selection.md
├── setup/                # Setup guides (email, Azure, infrastructure)
├── testing/              # Testing guides and methodologies
├── development/          # Development guides (coding standards, testing)
├── templates/            # Documentation templates (ADR, sprint, user story)
├── security/             # Security notes and vulnerability tracking
└── lessons-learned/      # Project lessons learned

_bmad-output/
├── excalidraw-diagrams/  # ✅ ACTIVE - Wireframes and diagrams
├── planning-artifacts/   # ⚠️ DEPRECATED - Use gcredit-project/docs/planning/
└── implementation-artifacts/  # ⚠️ DEPRECATED - Use gcredit-project/docs/sprints/
```

### Path Migration Mapping

| Old Path (DEPRECATED) | New Path (USE THIS) |
|----------------------|---------------------|
| `_bmad-output/planning-artifacts/architecture.md` | `gcredit-project/docs/architecture/system-architecture.md` |
| `_bmad-output/planning-artifacts/epics.md` | `gcredit-project/docs/planning/epics.md` |
| `_bmad-output/planning-artifacts/ux-design-specification.md` | `gcredit-project/docs/planning/ux-design-specification.md` |
| `_bmad-output/implementation-artifacts/sprint-N-backlog.md` | `gcredit-project/docs/sprints/sprint-N/backlog.md` |
| `_bmad-output/implementation-artifacts/sprint-N-retrospective.md` | `gcredit-project/docs/sprints/sprint-N/retrospective.md` |

### Finding Documentation

**When looking for:**
- **Planning docs** → `gcredit-project/docs/planning/`
- **Sprint docs** → `gcredit-project/docs/sprints/sprint-N/`
- **Architecture** → `gcredit-project/docs/architecture/`
- **Decisions** → `gcredit-project/docs/decisions/`
- **Setup guides** → `gcredit-project/docs/setup/`
- **Wireframes** → `_bmad-output/excalidraw-diagrams/`

**Complete documentation index:** `gcredit-project/docs/INDEX.md`

---

## Business Objectives

1. Create a culture of recognition & continuous learning
2. Provide trusted, verifiable proof of skills (Open Badges 2.0 compliant)
3. Enable workforce skill visibility and analytics
4. Automate recognition workflows
5. Retain full control of employee data and branding
6. Reduce long-term platform costs vs. SaaS alternatives (Credly, Accredible)

---

## Core User Personas

### 1. Employees (Badge Earners)
- **Goal:** Recognition for learning and career growth
- **Needs:** Simple claiming, trusted credentials, easy sharing with privacy control

### 2. HR & Program Administrators (Issuers)
- **Goal:** Drive learning programs and measure impact
- **Needs:** Easy badge creation, bulk issuing, automation, analytics, governance

### 3. Managers & Team Leads
- **Goal:** Understand team capabilities and motivate members
- **Needs:** Team skill visibility, nomination/approval workflows

---

## Technical Stack (Finalized)

### Core Technologies
- **Architecture Pattern:** Modular Monolith (monorepo: `frontend` + `backend`)
- **Language:** TypeScript 5.9.3 (frontend) / 5.7.3 (backend)
- **Runtime:** Node.js 20.20.0 LTS
- **Database:** PostgreSQL 16 (Azure Flexible Server)
- **ORM:** Prisma 6.19.2 ⚠️ **Version locked** (Prisma 7 has breaking changes)

### Frontend Stack
- **Framework:** React 19.2.3 (with Concurrent Features)
- **Build Tool:** Vite 7.3.1 (instant HMR, optimized production builds)
- **UI Framework:** Tailwind CSS 4.1.18 + @tailwindcss/postcss + Shadcn/ui components
- **State Management:** TanStack Query v5 (server state) + Zustand (client state)
- **Routing:** React Router v6
- **Form Handling:** React Hook Form + Zod validation
- **Charts:** Recharts 3.x (Admin Analytics)

### Backend Stack
- **Framework:** NestJS 11.1.12 (Core), 11.0.16 (CLI) (enterprise-grade Node.js)
- **API Design:** RESTful JSON API (50+ endpoints implemented)
- **Authentication:** ✅ Passport.js + JWT (Access 15min, Refresh 7d, M365 Graph integration via Client Credentials)
- **Authorization:** ✅ RBAC with 4 roles (ADMIN, ISSUER, MANAGER, EMPLOYEE)
- **Job Queue:** Bull (Redis-backed async processing) - *to be added Sprint 2+*
- **Validation:** ✅ Class-validator + Class-transformer (all DTOs validated)
- **Security:** ✅ bcrypt password hashing, JWT guards, role-based guards, token revocation

### Azure Cloud Services
- **Compute:** Azure App Service (frontend + backend)
- **Database:** ✅ Azure Database for PostgreSQL Flexible Server (B1ms, gcredit-dev-db-lz)
- **Storage:** ✅ Azure Blob Storage (gcreditdevstoragelz, containers: badges [public], evidence [private])
- **Identity:** ✅ Azure AD (Entra ID) — M365 Graph API integrated (user sync, email, Teams)
- **Secrets:** Azure Key Vault — planned for production
- **Monitoring:** Azure Application Insights — planned for production
- **Caching:** Azure Cache for Redis — planned for production (Bull queue for async bulk processing)

### Standards & Compliance
- **Digital Credentials:** Open Badges 2.0 JSON-LD format
- **Security:** TLS 1.3, JWT tokens, RBAC, audit logging
- **Data Privacy:** GDPR-compliant, user-controlled badge visibility

---

## Key Features Summary

### Phase 1 - MVP (Target: Q1 2026) ✅ COMPLETE (v1.0.0, 2026-02-11)
- Badge template creation & catalog
- Manual badge issuance (single + bulk CSV)
- Employee badge wallet/profile
- Public verification pages
- Azure AD SSO
- Email notifications

### Phase 1.5 - Post-MVP Hardening (Sprint 11, 2026-02) ✅ COMPLETE
- ✅ Security hardening (account lockout, JWT httpOnly cookies, magic-byte validation, PII log sanitization, HTML sanitization, email masking)
- ✅ Code quality improvement (3 service test suites at 90%+, pagination standardization, NestJS Logger in all 22 services, 5 unused deps removed)
- ✅ Feature polish (badge visibility toggle, LinkedIn share tab, CSV export, 403 page, skill UUID→name, nav fix)
- ✅ DX improvements (Husky v9 pre-commit + pre-push CI mirror, CI Chinese char detection, ESLint no-console)
- ✅ Data contract alignment (14 API-to-UI issues fixed in Story 11.24: formatActivityDescription, multi-format criteria, wallet type discrimination, null safety, dead code cleanup)
- **Tests:** 1,061 → 1,263+ (+202+, +19%+), 0 regressions
- **Security:** 2 HIGH → 0 HIGH findings resolved
- **Pre-push hook:** Fully aligned with CI pipeline — `npm run lint` (not bare eslint), `npm run build` for both BE/FE, Jest `--forceExit` exit code tolerance

### Phase 2 - Automation (Target: Q2 2026)
- LMS integration (auto-issuance on course completion)
- HRIS integration (employee sync)
- Manager approval workflows
- Teams notifications
- Basic analytics dashboard

### Phase 3 - Advanced (Target: Q3 2026)
- Advanced analytics & skill inventory
- External badge import
- Learning pathways & stackable badges
- Gamification elements
- API for external systems

---

## Integration Requirements

1. **Azure AD / Entra ID** - SSO authentication
2. **HRIS** - Employee directory sync
3. **LMS** - Automated badge triggers on course completion
4. **Microsoft Teams** - Notifications and bot integration
5. **Outlook** - Email notifications
6. **LinkedIn** - Badge sharing integration

---

## Success Metrics (KPIs)

- **Adoption:** 60% employee profile activation in first 6 months
- **Engagement:** 40% badge claim rate
- **Sharing:** 25% social sharing rate
- **Program Impact:** 80% participation in badged learning programs
- **Verification:** 500+ external verifications/month
- **Cost Savings:** 50% reduction vs. external platform licensing by year 2

---

## Compliance & Security

- **Data Privacy:** GDPR-compliant, user-controlled visibility
- **Security:** TLS encryption, RBAC, audit logs
- **Standards:** Open Badges 2.0 JSON-LD format
- **Data Residency:** Enterprise cloud (Azure, preferred region)

---

## Project Phases (Roadmap)

| Phase | Duration | Deliverables | Status |
|-------|----------|--------------|--------|
| Phase 1 - Discovery | 4-6 weeks | PRD, Product Brief, KPIs | ✅ COMPLETE |
| Phase 2 - Design & Architecture | 4 weeks | Architecture doc, UX Design, Wireframes | ✅ COMPLETE (Architecture + UX Spec + 10 Wireframe Screens) |
| Phase 3 - MVP Development | 8-12 weeks | Working MVP (core issuance) | ✅ Sprint 9 Complete |
| → Sprint 0 | 2 weeks | Infrastructure Setup | ✅ COMPLETE (2026-01-23→01-24, 9.5h/10h) |
| → Sprint 1 | 1 day | JWT Auth & User Management (Epic 2) | ✅ COMPLETE (2026-01-25, 21h/21h, 40 tests) |
| → Sprint 2 | 2 weeks | Badge Template Management (Epic 3) | ✅ COMPLETE (2026-01-26, 30 endpoints, 27 tests) |
| → Sprint 3 | 2 weeks | Badge Issuance System (Epic 4) | ✅ COMPLETE (2026-01-28, 13h/12.5h, 46 tests, v0.3.0) |
| → Sprint 4 | 2 days | Employee Badge Wallet (Epic 5) | ✅ COMPLETE (2026-01-28, 48h, 58 tests, v0.4.0) |
| → Sprint 5 | 1 day | Badge Verification & Open Badges 2.0 (Epic 6) | ✅ COMPLETE (2026-01-29, 30h, 68 tests, v0.5.0) |
| → Sprint 6 | 3 days | Badge Sharing & Social Proof (Epic 7) | ✅ COMPLETE (2026-01-31, 30h/56h, 243 tests, v0.6.0) |
| → Sprint 7 | 2 days | Badge Revocation & Lifecycle UAT (Epic 9) | ✅ COMPLETE (2026-02-02, 38.5h/41-47h, 302 tests, v0.7.0) |
| → Sprint 8 | 10 days | Production-Ready MVP (Epic 10) | ✅ COMPLETE (2026-02-05, 80h/76h, 876 tests, v0.8.0) |
| → Sprint 9 | 3 days | Bulk Badge Issuance + TD Cleanup (Epic 8) | ✅ COMPLETE (2026-02-08, 37h/51h, 1087 tests, v0.9.0-dev) |
| → Sprint 10 | 2 weeks | v1.0.0 Release (TD + UAT + Release) | ✅ COMPLETE (2026-02-09→02-11, 12 stories, 1061 tests, UAT 33/33 PASS, v1.0.0) |
| Post-MVP Audit | 1 day | 6 comprehensive audits (PRD, Arch, Security, CQ, UX) | ✅ COMPLETE (2026-02-11, 6 reports, ~2,000 lines) |
| → Sprint 11 | 7 days | Security Hardening + Code Quality + Feature Polish | ✅ COMPLETE (2026-02-12→02-18, 25/25 stories, 7 waves, 1,307 tests, UAT 152/153 PASS, v1.1.0 Released) |
| Phase 4 - Pilot | 4-6 weeks | Pilot with one L&D program | ⏳ Pending |
| Phase 5 - Iteration | 4-8 weeks | Analytics, integrations | ⏳ Pending |
| Phase 6 - Production Rollout | Ongoing | Company-wide launch | ⏳ Pending |

**Current Status:** ✅ Sprint 11 Complete, v1.1.0 Released — All 25 stories delivered across 7 waves. UAT 152/153 PASS (99.3%). Merged to main, tagged v1.1.0, GitHub Release published.

---

## Key Stakeholders

- **Product Owner:** HR / L&D Leadership
- **Engineering:** Internal IT / Platform Team
- **Key Users:** HR Admins, Learning Program Managers, Employees
- **Integration Partners:** LMS vendor, HRIS team, IT Security

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Low adoption | Pilot with popular program, communication campaign |
| Integration complexity | Phased approach, start with webhooks |
| Badge credibility | Align with industry-recognized programs |
| Data privacy concerns | User-controlled visibility, transparent policies |
| Platform lock-in alternatives | Open Badges standard ensures portability |

## Known Technical Issues & Technical Debt

> **Master Technical Debt Registry:** `docs/sprints/sprint-7/technical-debt-from-reviews.md` (57 items consolidated)

| Issue | Severity | Status | Plan |
|-------|----------|--------|------|
| **lodash Prototype Pollution vulnerability** | Moderate | ✅ Risk Accepted (ADR-002) | **Decision:** Accept risk for MVP development (Sprint 1-7). Development environment only, CVSS 6.5 (Medium), no external exposure. **Re-evaluate:** Before production deployment (Sprint 8+). See [ADR-002](docs/decisions/002-lodash-security-risk-acceptance.md) for full analysis. |
| **Prisma version locked at 6.x** | Low | 🔒 Intentional | Prisma 7 has breaking changes (prisma.config.ts requirement). Upgrade deferred to post-MVP. Current version stable and meets all requirements. |
| **TD-006: Teams Channel Permissions** | Medium | ⏸️ Documented | **Impact:** 4 Teams integration tests skipped (see [SKIPPED-TESTS-TRACKER.md](gcredit-project/docs/testing/SKIPPED-TESTS-TRACKER.md)). **Blocker:** Requires tenant admin to approve ChannelMessage.Send permission. **Effort:** 1 day (admin approval). **Workaround:** Email sharing functional. |
| **TD-014: Dual Email System** | Low | ✅ Sprint 9 Done | **Resolved:** nodemailer removed, EmailService delegates to GraphEmailService. Completed in Story 8.4 (2026-02-08). |
| **TD-015: ESLint Warnings** | Medium | ✅ Sprint 9 Done | **Resolved:** 1303 → 282 warnings (78% reduction). Completed as standalone story (2026-02-07). Note: 8.4 regressed to 423 warnings — Sprint 10 cleanup. |
| **TD-017: tsc Test-Only Errors** | Low | ✅ Sprint 10 Done | **Resolved:** 114 tsc errors in test files fixed. Completed in Story 10.1 (2026-02-09). |
| **ESLint Warning Regression** | Medium | ✅ Sprint 10 Done | **Resolved:** ESLint 423 warnings → 0 errors + 0 warnings (backend + frontend). CI `--max-warnings=0` gate on both. Completed in Stories 10.2 + 10.3b (2026-02-09). |
| **TD-016: Async Bulk Processing** | Low | 📋 Deferred (P3) | **Issue:** Bulk issuance limited to 20 badges synchronously. **Plan:** Add Redis + Bull Queue for >20 badge async processing. **Effort:** 8h. **Trigger:** When user feedback validates need for >20 badges per batch. |
| **TD-023: CI Chinese Character Gate** | Low | ✅ Sprint 11 Done | **Resolved:** CI workflow grep for Chinese chars in both BE/FE jobs. `scripts/check-chinese.sh` created. 1 fix (方案B→Option B). Completed in Story 11.21 (2026-02-14). |
| **TD-024: CI console.log Gate** | Low | ✅ Sprint 11 Done | **Resolved:** ESLint `no-console: 'error'` in both BE/FE configs with test overrides. ErrorBoundary eslint-disable. Completed in Story 11.21 (2026-02-14). |
| **TD-025: Husky Pre-commit Hooks** | Low | ✅ Sprint 11 Done | **Resolved:** Husky v9 + lint-staged pre-commit (ESLint + Chinese check). Pre-push mirrors full CI pipeline (Lesson 40). Root package.json created. Completed in Story 11.22 (2026-02-14). **Updated (11.24):** Pre-push further aligned — uses `npm run lint` (covers src+test), adds `npm run build` for BE/FE, tolerates Jest `--forceExit` exit code via grep-based pass/fail parsing. |
| **TD-028: Data Contract Alignment** | Critical | ✅ Sprint 11 Done | **Resolved:** 14 API-to-UI data contract issues fixed in Story 11.24 (2026-02-15). (1) Admin Dashboard `formatActivityDescription()` replaces raw JSON. (2) BadgeInfo multi-format criteria parsing. (3) Wallet badge/milestone type discrimination with `MilestoneTimelineCard`. (4) Verification page `expiresAt`/`claimedAt` fields. (5) Null safety: revoker, imageUrl, skill names. (6) Dead code: `issuerMessage`, `recentAchievements`. (7) Display polish: UUID truncation, title case. |
| **TD-029: Decorator Metadata Guard Tests** | Low | ✅ Sprint 11 Done | **Resolved:** Added `Reflect.getMetadata()` unit tests verifying `@Public()` and `@Roles()` decorators on security-critical endpoints. Catches accidental decorator removal during refactoring. Runs locally without database. Badge Issuance: 11 tests, Badge Verification: 3 tests. Added in Story 11.24 (2026-02-15). |
| **TD-026: SM Audit Triage Workflow** | Medium | 📋 Post-Sprint 11 | **Issue:** Audit recommendations not systematically converted to stories. **Plan:** SM agent `[AT]` menu item. **Effort:** 1h. |
| **TD-027: Playwright Visual Regression in CI** | Low | 📋 Post-Sprint 11 | **Issue:** No automated visual regression testing. **Plan:** Playwright screenshot comparison in CI. **Effort:** 4h. |
| **TD-030: LinkedIn Dynamic OG Meta Tags** | P2 | 📋 Deferred Sprint 12 | **Issue:** LinkedIn crawler gets static generic OG meta tags for all `/verify/:id` share links — all previews show identical card. **Root Cause:** SPA with no SSR; LinkedIn bot doesn't execute JS. **Plan:** Backend middleware detecting crawler User-Agent and returning pre-rendered HTML with dynamic `og:title`, `og:description`, `og:image`. **Effort:** 4-6h. Documented as sprint-11/technical-debt.md TD-018. |
| **TD-018: Code TODO Cleanup** | Low | ✅ Sprint 10 Done | **Resolved:** 14 TODO/FIXME markers resolved (6 backend, 5 frontend, 3 test). Hardcoded localhost URLs centralized to apiConfig.ts. Dead nav links fixed. 404 catch-all added. Completed in Story 10.3 (2026-02-08). |
| **TD-019: Frontend ESLint Cleanup** | High | ✅ Sprint 10 Done | **Resolved:** Frontend ESLint 49 errors + 21,363 warnings → 0 errors + 0 warnings. Added `.gitattributes` (LF normalization), fixed 49 errors (react-hooks, typescript, a11y), 13 eslint-disable with justifications. CI `npm run lint --max-warnings=0` gate added to frontend-tests job. 135 files changed. Completed in Story 10.3b (2026-02-09, commit `80b693e`). |
| **TD-020: CI E2E Job Missing Frontend Dependency** | Medium | ✅ Resolved (Story 10.4, `0ba885e`) | **Resolved:** `e2e-tests` job now has `needs: [lint-and-unit, frontend-tests]`. Frontend lint/test failures correctly block E2E execution. Completed in Story 10.4 (2026-02-09). |
| **TD-021: react-hooks/set-state-in-effect Inline Suppressions** | Low | ✅ Resolved (Story 10.4, `0ba885e`) | **Resolved:** Project-level override `react-hooks/set-state-in-effect: 'off'` added in `eslint.config.js`. All 9 inline `eslint-disable` suppressions removed. Completed in Story 10.4 (2026-02-09). |
| **TD-022: API Path Mismatches** | Critical | ✅ Resolved (Story 10.3c, `69aa5b3`+`414de4c`) | **Issue:** 5 CRITICAL API path mismatches found in SM audit. (1) 4 backend controllers (`auth`, `badge-templates`, `skills`, `skill-categories`) missing `api/` prefix — frontend calls `/api/...` but backend routes don't have `api/` prefix. (2) EvidenceSection.tsx evidence download/preview paths missing `/badges` segment. (3) badgeShareApi.ts Teams share path order reversed (`/teams/share` vs `/share/teams`). (4) 8 frontend files hardcode `/api/...` bypassing `API_BASE_URL`. **Resolution:** Added `api/` prefix to 4 controllers, fixed 3 frontend path bugs, unified 8 hardcoded URLs to `API_BASE_URL`. All tests pass. **Code Review Finding:** BadgeEmbedPage.tsx has pre-existing hardcoded `/api/` in widget embed URL (MEDIUM, out of scope). |

---

## Implemented Features (Sprint 0-3)

### Authentication & User Management (Epic 2) ✅
**Sprint 1 Completion:** 2026-01-25 (7/7 stories, 21h/21h, 100% test coverage)

**API Endpoints (14 total):**
- Public (6): POST /auth/register, POST /auth/login, POST /auth/request-reset, POST /auth/reset-password, POST /auth/refresh, POST /auth/logout
- Protected (8): GET /auth/profile, PATCH /auth/profile, POST /auth/change-password, GET /profile, GET /admin-only, GET /issuer-only, GET /manager-only, GET /health

**Database Models (3):**
- User: id, email, passwordHash, firstName, lastName, role, isActive, emailVerified, lastLoginAt, timestamps
- PasswordResetToken: id, token, userId, used, expiresAt, createdAt
- RefreshToken: id, token, userId, expiresAt, isRevoked, createdAt

**Security Features:**
- JWT dual-token system (Access 15min, Refresh 7d)
- bcrypt password hashing (10 rounds)
- RBAC with 4 roles (ADMIN, ISSUER, MANAGER, EMPLOYEE)
- Password strength validation (8+ chars, uppercase/lowercase/number)
- Token revocation mechanism
- Password reset flow with 1-hour expiry
- Email enumeration prevention

**Testing:**
- 40 comprehensive tests (100% pass rate)
- 7 individual story test suites
- Automated test reporting

---

### Badge Template Management (Epic 3) ✅
**Sprint 2 Completion:** 2026-01-26 (6 stories + 1 enhancement, 100% completion)

**API Endpoints (30 total):**
- Badge Templates: POST, GET, PATCH, DELETE, search, criteria templates
- Skills: CRUD operations, search by category
- Skill Categories: CRUD operations, list with skills
- Image upload with Azure Blob Storage integration

**Database Models (3 new):**
- BadgeTemplate: id, name, description, imageUrl, criteria, skills, status
- Skill: id, name, description, categoryId
- SkillCategory: id, name, description, skills

**Key Features:**
- Azure Blob Storage integration for badge images
- Full-text search across templates
- Skill taxonomy with categories
- Template status lifecycle (DRAFT, ACTIVE, ARCHIVED)
- Issuance criteria validation
- Image upload validation (formats, size limits)

**Testing:**
- 27 tests (100% pass rate)
- 19 Jest E2E tests (21.9s)
- 7 PowerShell E2E tests (~10s)
- Technical debt resolved: MultipartJsonInterceptor middleware

---

### Badge Issuance System (Epic 4) ✅
**Sprint 3 Completion:** 2026-01-28 (6 stories, 13h/12.5h, 100% test coverage, v0.3.0)

**API Endpoints (7 core + verification):**
- POST /api/badges - Single badge issuance
- POST /api/badges/bulk - CSV bulk issuance
- POST /api/badges/:id/claim - Public badge claiming
- GET /api/badges/my-badges - User's badges
- GET /api/badges/issued - Issued badges query (admin)
- POST /api/badges/:id/revoke - Badge revocation
- GET /api/badges/:id/assertion - Open Badges 2.0 assertion

**Database Models (1 new):**
- Badge: id, templateId, recipientEmail, issuedBy, claimToken, status, claimedAt, assertion

**Key Features:**
- Single and bulk badge issuance
- Email notifications to recipients
- Secure claim token system (7-day expiry)
- Open Badges 2.0 compliant assertions
- Public verification endpoints
- Badge status lifecycle (ISSUED → CLAIMED → REVOKED)
- CSV bulk upload with validation
- RBAC enforcement (ADMIN, ISSUER roles)

**Testing:**
- 46 tests (100% pass rate)
- 26 E2E tests (badge workflows)
- 20 unit tests (service layer)
- 7 UAT scenarios (100% acceptance)

**Quality Metrics:**
- Test coverage: 82% overall (46 tests, 100% pass rate)
- E2E test execution: < 30 seconds
- All acceptance criteria met (60/60)
- Zero critical bugs
- Documentation compliance: 100% (Phase 1-3 reorganization complete)

---

### Employee Badge Wallet (Epic 5) ✅
**Sprint 4 Completion:** 2026-01-28 (7 stories, 48h estimated, 58 tests passing)

**Key Features:**
- **Timeline View:** Chronological badge display with date navigation (replacing grid view)
- **Badge Detail Modal:** Comprehensive badge information with 10 sub-components
- **Evidence Files:** Azure Blob integration with SAS tokens (5-min expiry, 10MB limit)
- **Similar Badges:** Recommendation algorithm (skills +20, category +15, issuer +10 scoring)
- **Milestones:** Admin-configurable achievements (badge count, skill tracks, anniversaries)
- **Empty States:** 4 scenarios (new employee, pending badges, all revoked, filtered empty)
- **Report Issues:** Inline form sending to g-credit@outlook.com

**API Endpoints (9 new):**
- GET /api/badges/wallet - Timeline view with pagination and date groups
- GET /api/badges/:id/similar - Similar badge recommendations
- GET /api/badges/:id/evidence - List evidence files
- GET /api/badges/:id/evidence/:fileId/download - SAS token generation
- POST /api/badges/:id/report - Badge issue reporting
- POST /api/admin/milestones - Create milestone config
- GET /api/admin/milestones - List milestone configs
- PATCH /api/admin/milestones/:id - Update milestone
- GET /api/milestones/achievements - User's milestone achievements

**Database Tables (3 new):**
- evidence_files: id, badgeId, fileName, originalName, fileSize, mimeType, blobUrl, uploadedBy
- milestone_configs: id, type, title, description, trigger (JSONB), icon, isActive
- milestone_achievements: id, milestoneId, userId, achievedAt (UNIQUE constraint)

**Frontend Components (20+ created):**
- TimelineView: Date sidebar navigation, horizontal badge cards, view toggle
- BadgeDetailModal: 10 sub-components (ModalHero, IssuerMessage, BadgeInfo, Timeline, Verification, Evidence, Similar, ReportForm)
- EmptyState: Auto-detection with 4 scenario-specific displays
- SimilarBadgesSection: Horizontal scroll recommendations

**Testing:**
- 58 backend tests (100% pass rate)
- 19 milestone service tests
- 11 evidence service tests  
- 8 recommendations service tests
- Performance: <500ms milestone detection, <150ms wallet query

**Commit History (7 commits):**
- 298cf32: Database Migration + Timeline View
- ff7e240: Evidence File Management
- cf7c010: Similar Badge Recommendations
- 9953f2d: Badge Detail Modal
- 785dbee: Empty State Handling
- d41c425: Admin-Configurable Milestones

---

### Badge Verification & Open Badges 2.0 (Epic 6) ✅
**Sprint 5 Completion:** 2026-01-29 (5/5 stories, 30h/28h, 100% test coverage)

**API Endpoints (5 new + enhancements):**
- GET /verify/:verificationId - Public HTML verification page
- GET /api/verify/:verificationId - Public JSON-LD assertion (CORS enabled)
- GET /api/badges/:id/assertion - Open Badges 2.0 assertion
- GET /api/badges/:id/download/png - Baked badge PNG (JWT protected)
- GET /api/badges/:id/integrity - Integrity verification endpoint

**Database Changes:**
- Migration: 20260128113455_add_verification_fields
- New columns: verificationId (UUID, unique), metadataHash (String, SHA-256)
- Index: idx_badges_verification on verificationId

**Key Features:**
- **Open Badges 2.0 Compliance:** Full JSON-LD format with three-layer architecture (Issuer → BadgeClass → Assertion)
- **Public Verification:** Unique verification URLs with email masking (j***@example.com)
- **Baked PNG Badges:** Sharp library integration for embedding assertions in PNG EXIF metadata
- **Integrity Verification:** SHA-256 cryptographic hashing for tamper detection
- **Standards Compliance:** Hosted verification (not GPG signed), evidence URLs support

**Frontend Components:**
- VerifyBadgePage.tsx - Public verification UI with status indicators
- Alert & Skeleton components - Loading and status display
- API response transformation logic for _meta wrapper structure

**Testing:**
- 68 tests total (24 unit + 6 integration + 38 E2E)
- Individual suites: 100% passing
- Parallel suite: 45/71 (isolation issues tracked in TD-001)

**Technical Debt (5 items, 18-24h):**
- TD-001: E2E test isolation issues (database cleanup race conditions)
- TD-002: Update failing badge issuance tests (metadataHash migration impact)
- TD-003: Add metadataHash database index for performance
- TD-004: Implement baked badge caching (OPT-001)
- TD-005: Test data factory pattern

**Dependencies Added:**
- sharp@^0.33.0 - PNG image processing for baked badges

**Documentation:**
- 9 Sprint 5 docs (completion summary, retrospective, technical design, demo scripts, performance analysis)
- 3 ADRs: ADR-005 (Open Badges Integration), ADR-006 (Public API Security), ADR-007 (Baked Badge Storage)
- Demo seed script: issuer@gcredit.com, recipient@example.com, verificationId: 550e8400-e29b-41d4-a716-446655440001

**Quality Metrics:**
- Test coverage: 68 tests (100% pass for individual suites)
- Code quality: Zero production bugs, clean production code
- Time estimation: 30h actual vs 28h estimated (7% variance)
- Documentation: 9 comprehensive docs, 100% acceptance criteria met

**Version:** v0.5.0 (tagged 2026-01-29, branch: sprint-5/epic-6-badge-verification)

**Epic 6 Retrospective Key Learnings:**
- ✅ **Architecture-First Approach:** Winston's pre-sprint ADRs (005-007) prevented mid-development debates
- ✅ **Lessons-Learned Application:** Team actively referenced past retrospectives to avoid repeated mistakes
- ✅ **Template Maturity:** Documentation templates accelerated sprint documentation creation
- ✅ **Documentation Reorganization:** Project directory structure improvements made resources easier to find
- ⚠️ **Test Infrastructure Debt:** E2E isolation issues need addressing before test suite scales further
- ⚠️ **UX Gap Identified:** Technical completion ≠ user experience validation; UAT needed
- 📋 **Action:** UX Designer (Sally) embedded in Sprint 6 for pre-sprint UX audit and interaction specs
- 📋 **Action:** Full-role UAT (Admin/Issuer/Employee/External Verifier) scheduled after Sprint 6

---

### Badge Sharing & Social Proof (Epic 7) ✅
**Sprint 6 Completion:** 2026-01-31 (5/5 stories, 30h/56h, 100% backend complete, 243 tests passing)

**API Endpoints (7 new):**
- POST /api/badges/:id/share - Share badge via email (JWT protected)
- POST /api/badges/:id/teams/share - Share badge to Microsoft Teams (JWT protected)
- POST /api/badges/:id/teams/action - Handle Teams Adaptive Card actions (public)
- GET /api/badges/:id/analytics/shares - Share statistics (JWT protected, owner/issuer only)
- GET /api/badges/:id/analytics/shares/history - Share history (JWT protected, owner/issuer only)
- GET /api/badges/:id/embed - Badge data JSON for widget embedding (public, CORS enabled)
- GET /api/badges/:id/widget - Widget HTML snippet (public, CORS enabled)

**Database Changes:**
- Migration: 20260130153351_add_badge_share_table
- New table: badge_shares (id, badgeId, platform, sharedAt, sharedBy, recipientEmail, metadata JSON)
- Indexes: idx_badge_shares_badge_platform, idx_badge_shares_shared_at
- New relation: Badge.shares → BadgeShare[]

**Key Features:**

**Story 7.1 - Microsoft Graph Setup:**
- MicrosoftGraphModule with OAuth 2.0 Client Credentials flow
- GraphTokenProviderService (token caching, lifecycle management, retry logic)
- GraphEmailService (Mail.Send API integration)
- GraphTeamsService (Teams Activity API integration)
- Defensive error handling with graceful degradation
- ADR-008: Microsoft Graph Integration architecture

**Story 7.2 - Email Sharing:**
- BadgeSharingService for email distribution
- EmailTemplateService with professional HTML templates
- Badge verification links embedded in emails
- Integration with BadgeAnalyticsService for tracking

**Story 7.4 - Teams Notifications:**
- TeamsBadgeNotificationService for Teams activity feed
- BadgeNotificationCardBuilder for Adaptive Card generation
- Interactive action buttons (View Badge, Claim Now)
- Webhook callback handling for Teams actions
- Comprehensive Adaptive Card specs documentation

**Story 7.5 - Sharing Analytics:**
- BadgeAnalyticsService (recordShare, getShareStats, getShareHistory)
- Row-level authorization (badge owner/issuer only)
- Platform-specific tracking (email, teams, widget)
- JSON metadata for flexible data storage
- Optimized database indexes for query performance

**Story 7.3 - Embeddable Badge Widget:**
- WidgetEmbedController with 2 public endpoints
- Widget configuration: 3 sizes (small/medium/large), 3 themes (light/dark/auto)
- Responsive HTML/CSS/JS generation server-side
- Optional details display (badge name + issuer)
- CORS enabled for cross-origin embedding
- Click-to-verify functionality
- Widget demo page (backend/docs/widget-demo.html)

**Testing:**
- 243 tests total (100% pass rate)
- 28 tests: Microsoft Graph module (token provider, email, teams services)
- 20+ tests: Email sharing service and templates
- 48 tests: Teams notifications and Adaptive Cards
- 30 tests: Badge analytics (19 service + 11 controller)
- 19 tests: Widget embedding (controller unit tests)
- TypeScript build: 0 errors (strict mode enabled)

**Dependencies Added:**
- @microsoft/microsoft-graph-client@3.0.7 - Microsoft Graph API client
- @azure/identity@4.13.0 - Azure OAuth authentication
- adaptivecards@3.0.5 - Adaptive Card templating

**Documentation:**
- 5 story files: 7-1-microsoft-graph-setup.md, 7-2-email-sharing.md, 7-3-widget-embedding.md, 7-4-teams-notifications.md, 7-5-sharing-analytics.md
- Sprint 6 completion report (comprehensive metrics and retrospective)
- Email template specs, Adaptive Card specs, Widget demo page
- Version manifest (dependency lockdown), Kickoff checklist
- ADR-008: Microsoft Graph Integration

**Quality Metrics:**
- Test coverage: 243 tests (100% passing, >85% code coverage)
- Estimation accuracy: 30h actual vs 56-76h estimated (39-54% of estimate)
- Code quality: Clean TypeScript, no production bugs
- Velocity: 6h average per story (excellent efficiency)
- Applied Lesson 22: Zero Prisma naming issues (previous sprint: 137 files broken)

**Technical Excellence:**
- Zero breaking changes (all existing tests still passing)
- Zero regressions introduced
- Modular, testable architecture
- Complete Swagger API documentation
- CORS configured for widget cross-origin embedding
- Type-safe TypeScript throughout (strict mode)

**Version:** v0.6.0 (pending tag, branch: sprint-6/epic-7-badge-sharing, final commit: 286eb5d)

**Epic 7 Key Achievements:**
- ✅ **Complete Backend Implementation:** All 5 stories fully functional
- ✅ **Defensive Architecture:** Microsoft Graph integration with graceful degradation
- ✅ **Standards Compliance:** Open Badges 2.0 widget embedding support
- ✅ **Analytics Foundation:** Comprehensive share tracking for future insights
- ✅ **Agent Efficiency:** 30h actual vs 56-76h estimated (agent-assisted development)
- ✅ **Lesson 22 Applied:** Zero Prisma-related issues (compared to Sprint 6 Lesson 22 disaster)

**Pending Work (Optional/Future):**
- Frontend UI: Badge sharing modal, widget generator, analytics dashboard
- Manual testing: Integration tests (CORS, embedding), cross-browser tests
- Production deployment: Azure App Service, environment configuration

---

### Badge Revocation & Complete Lifecycle UAT (Epic 9) ✅
**Sprint 7 Status:** ✅ Complete (10/10 stories, 38.5h/41-47h, 2026-02-02, v0.7.0)

**Planning Complete:** 2026-02-01 (100% - All 11 stories planned, technical review completed, pre-development 100%)

**Sprint 7 Scope:**
- Epic 9: Badge Revocation (5 stories - 9.1 through 9.5)
- Complete Lifecycle UAT (3 stories - U.1, U.2a, U.3)
- Login & Navigation MVP (2 stories - 0.2a, 0.4)
- Sprint Setup (1 story - 0.1)

**Stories Complete:** 6/7 (86%)
- ✅ Story 0.1: Git Branch Setup (5min) - Branch created 2026-01-31
- ✅ Story 9.1: Badge Revocation API (5h) - TDD approach, complete 2026-02-01
- ✅ Story 9.2: Revoked Badge Verification Display (4.5h) - Complete 2026-02-01
- ✅ Story 9.3: Employee Wallet Revoked Display (4.5h) - Complete 2026-02-01
- ✅ Story 9.4: Revocation Email Notifications (2.5h) - Complete 2026-02-01
- ✅ Story 9.5: Admin Revocation UI (5.5h) - Complete 2026-02-01

**Story 9.1 - Badge Revocation API (Complete 2026-02-01):**

**API Endpoints (1 new):**
- POST /api/badges/:id/revoke - Revoke badge with reason and notes (Manager authorization only)

**Database Changes:**
- New table: AuditLog (action, entityType, entityId, userId, metadata JSONB, timestamp)
- Badge enum update: BadgeStatus now includes 'REVOKED' status
- Migration: 20260201_add_revoked_status_and_audit_log

**Key Features:**
- **Authorization:** Only Manager role can revoke badges (403 for Employee/Admin)
- **Idempotency:** Repeated revoke calls return 200 OK (safe to retry)
- **Audit Logging:** Every revocation creates AuditLog entry with WHO/WHAT/WHEN/WHY
- **TDD Implementation:** Test-first development with 47 tests (21 unit + 26 E2E)
- **Metadata Tracking:** Revocation reason, notes, timestamp, revoker ID

**Testing:**
- 47 new tests (100% pass rate)
- 21 unit tests (service + controller layers)
- 26 E2E tests (full revocation flow)
- Test coverage: >80% for new code
- Security: 4 code review issues identified and fixed (authorization ordering, HTTP status, test completeness, docs)

**Code Review Fixes:**
- Authorization ordering improved (check permissions before database queries)
- HTTP status standardization (200 OK for idempotent operations)
- Test completeness enhancements (authorization, idempotency, error cases)
- Documentation clarity improvements

**Documentation (12,000+ lines created):**
- Sprint 7 planning: 4,305 lines (11 stories fully specified)
- Technical review meeting: 5,800 lines (18 decisions documented)
- Pre-development checklist: 16/16 action items complete (100%)
- Developer context guide: DEVELOPER-CONTEXT.md (400+ lines)
- Architect TDD guide: 500 lines implementation guidance in story 9.1
- UX specifications: login-ux-spec.md (500+ lines wireframes + ARIA specs)
- Activation prompts: amelia-activation-simple.md, amelia-day1-prompt.md (1,600+ lines)

**Sprint 7 Key Decisions (Technical Review):**
- Decision #3: Public verification page - reason display categorization (public vs private reasons)
- Decision #11: Story splitting strategy (MVP 'a' stories vs Enhancement 'b' stories in Sprint 8)
- Decision #14: M365 auto role detection (Graph API `/users/{id}/directReports`)
- Decision #16: TDD mandatory for Story 9.1 (high-risk authorization story)
- Decision #18: Accessibility MVP scope (basic ARIA Sprint 7, full WCAG 2.1 AA Sprint 8)

**Branch:** sprint-7/epic-9-revocation-lifecycle-uat

**Story 9.2 - Revoked Badge Verification Display (Complete 2026-02-01):**

**Frontend Changes:**
- RevokedBadgeAlert component with red warning banner
- Reason categorization logic (public vs private reasons)
- Disabled Download/Share buttons for revoked badges
- ARIA role="alert" for accessibility

**Backend Changes:**
- Updated GET /api/badges/:id/verify endpoint
- Returns revocation status, reason, date, revokedBy
- Reason categorization: public reasons shown, private reasons generic message

**Testing:**
- 25 tests added (8 unit + 17 E2E)
- Code review: 6 issues identified and fixed
- All acceptance criteria met (5/5)

**Story 9.3 - Employee Wallet Revoked Display (Complete 2026-02-01):**

**Frontend Changes:**
- Visual distinction for revoked badges (grayed out, REVOKED label)
- Default filter: "Active badges only"
- RevocationSection component with metadata display
- Disabled share buttons (LinkedIn, Teams, Email) for revoked badges
- Tooltips explaining why features are disabled

**Features:**
- sessionStorage persistence for filter state
- Conditional rendering based on badge status
- ARIA labels for accessibility
- Download remains enabled (evidence preservation)

**Testing:**
- 24 tests passing (3 new tests added)
- Code review: 6 issues identified and fixed (4 HIGH, 2 MEDIUM)
- All acceptance criteria met (5/5)

**Story 9.4 - Revocation Email Notifications (Complete 2026-02-01):**

**Features:**
- Asynchronous email notifications for badge revocation
- Retry logic (3 attempts) for failed email delivery
- Enhanced email template with revocation details (date, reason, notes)
- Manager CC prepared (infrastructure for future use)
- Audit logging for notification delivery

**Testing:**
- 8 tests added (7 unit + 1 E2E expanded)
- Code review: 9 issues identified and fixed (4 HIGH, 4 MEDIUM, 1 LOW)
- All acceptance criteria met (4/4, AC4 in-app notification deferred)

**Story 9.5 - Admin Revocation UI (Complete 2026-02-01):**

**Frontend Features:**
- BadgeManagementPage with sortable table
- RevokeBadgeModal with reason dropdown (6 options) and notes textarea
- Search by recipient name/email/template name
- Filter by status (All/Active/Pending/Claimed/Revoked/Expired)
- Pagination (10 badges per page)
- Toast notifications (success/error)
- Role-based authorization (Admin/Issuer)

**Backend Enhancements:**
- Added search parameter to QueryBadgeDto
- Added activeOnly filter (PENDING + CLAIMED combined)
- Search implementation in getIssuedBadges service

**Testing:**
- 52 frontend unit tests added (vitest + testing-library)
  - 17 API client tests
  - 13 modal component tests
  - 22 page integration tests
- Code review: 5 issues identified and fixed (1 HIGH, 3 MEDIUM, 1 LOW)
- All acceptance criteria met (5/5)

**Combined Testing Statistics (Stories 9.1-9.5):**
- Total tests: 334 (up from 244 in Sprint 6, +90 tests)
- Passing: 297 core tests (100% pass rate)
  - Backend: 245 tests
  - Frontend: 52 tests
- Story 9.1: 47 tests (21 unit + 26 E2E)
- Story 9.2: 25 tests (8 unit + 17 E2E)
- Story 9.3: 24 tests passing
- Story 9.4: 8 tests (7 unit + 1 E2E)
- Story 9.5: 52 tests (17 API + 13 modal + 22 page)
- Teams tests deferred: 16 (Sprint 6 technical debt)

**Code Quality Summary (Stories 9.1-9.5):**
- Total code review issues: 30 (4+6+6+9+5)
- All issues fixed: 30/30 (100%)
- Test coverage: >80% for all new code
- TypeScript errors: 0
- ESLint warnings: 0

**Next Story:**
- Story U.1: Complete Lifecycle UAT (8h) - Ready for development

---

### Bulk Badge Issuance MVP (Epic 8) ✅
**Sprint 9 Completion:** 2026-02-08 (5/5 stories, 37h/51h, 1087 tests, 100% pass rate)

**API Endpoints (4 new):**
- GET /api/bulk-issuance/template - Download CSV template (UTF-8 BOM, dynamic date)
- POST /api/bulk-issuance/upload - Upload and parse CSV (RFC 4180, IDOR protection, rate limiting)
- POST /api/bulk-issuance/confirm/:sessionId - Synchronous batch processing (up to 20 badges)
- GET /api/bulk-issuance/error-report/:sessionId - Download error report CSV
- GET /api/bulk-issuance/preview/:sessionId - Preview parsed results with pagination

**Database Changes:**
- New table: BulkIssuanceSession (id, userId, fileName, status, validRows JSON, errorRows JSON, createdAt, expiresAt)
- Status lifecycle: PENDING → VALIDATED → PROCESSING → COMPLETED/FAILED

**Key Features:**
- **CSV Template:** Dynamic download with example rows, badge template ID pre-fill
- **Upload & Validation:** CSV injection sanitization (ARCH-C1), XSS protection, BOM stripping, row-by-row validation
- **Preview UI:** 7 new components, paginated table, error correction panel, session expiry timer
- **Batch Processing:** Synchronous issuance loop, partial failure handling, atomic transactions per badge (ARCH-C6)
- **Frontend UX:** Drag-drop upload, simulated per-badge progress, failed badges table, retry button
- **Security:** IDOR protection on all session endpoints, rate limiting, session ownership validation

**Technical Debt Resolved:**
- TD-013: Frontend bundle 707 KB → 235 KB (66.8% reduction via route-based code splitting)
- TD-014: nodemailer removed, EmailService delegates to GraphEmailService
- TD-015: ESLint warnings 1303 → 282 (78% reduction)

**Testing:**
- Backend: 532 tests (12 new), 0 failures
- Frontend: 397 tests (27 new), 0 failures
- E2E: 158 tests (6 new), 0 failures
- Total: 1087 tests (up from 876 in Sprint 8)

**Dependencies Removed:**
- nodemailer (replaced by Microsoft Graph API)
- @types/nodemailer

**Version:** v0.9.0-dev (branch: sprint-9/epic-8-bulk-issuance-td-cleanup)

---

## Coding Standards (Quick Reference)

> **Canonical source:** `gcredit-project/docs/development/coding-standards.md` (1055 lines, 14 sections)
> Dev Agent and Code Review workflows MUST follow these rules.

### Critical Rules

| # | Rule | Detail |
|---|------|--------|
| 1 | **All code in English** | Variables, comments, `@ApiProperty`, logs, tests — no Chinese characters in source code |
| 2 | **Controller prefix `api/`** | Every `@Controller()` must include `api/` (e.g., `@Controller('api/badges')`). No `setGlobalPrefix`. |
| 3 | **`API_BASE_URL` for all API calls** | Frontend must import from `@/lib/apiConfig.ts`. Never hardcode `/api/...`. |
| 4 | **Zustand for state management** | Use `create()` + `persist` from Zustand. Do NOT use React Context for global state. Stores in `src/stores/`. |
| 5 | **NestJS Logger only** | Backend: `private readonly logger = new Logger(ClassName.name)`. No `console.log/error/warn`. |
| 6 | **Frontend: Sonner toast** | User-facing messages use `toast.success()` / `toast.error()` from `sonner`. No `window.alert`. |
| 7 | **TODO must reference TD ticket** | Format: `// TODO(TD-XXX): description`. Orphan TODOs flagged in code review. |

### Platform-Specific Conventions

| Item | Backend | Frontend |
|------|---------|----------|
| ESLint config | `eslint.config.mjs` (flat, `tseslint.config()`) | `eslint.config.js` (flat, `defineConfig()`) |
| `no-explicit-any` | `'off'` (MVP phase) | `recommended` default |
| Prettier `trailingComma` | `"all"` | `"es5"` |
| Prettier `printWidth` | `80` (default) | `100` |
| Test file suffix | `.spec.ts` | `.test.ts` / `.test.tsx` |
| E2E test suffix | `.e2e-spec.ts` | — |

### Pre-commit / Pre-push Checklist

**Automated by Husky (`.husky/pre-commit` + `.husky/pre-push`):**
- [x] `lint-staged` runs ESLint + Chinese char check on staged files (pre-commit)
- [x] `npm run lint` in BE + FE (pre-push, mirrors CI)
- [x] `npx tsc --noEmit` in BE + FE (pre-push, FE uses `tsconfig.app.json`)
- [x] `npx jest --forceExit` in BE + FE (pre-push, grep-based pass/fail — tolerates exit code 1)
- [x] `npm run build` in BE + FE (pre-push, catches build-only errors)

**Manual checks:**
- [ ] No Chinese characters in source code
- [ ] No `console.log` in production code
- [ ] All API calls use `API_BASE_URL`
- [ ] Controller `@Controller()` includes `api/`
- [ ] DTOs have class-validator decorators + Swagger docs
- [ ] Security-critical endpoints have `@Public()` / `@Roles()` decorator metadata tests

---

## Repository Structure

```
CODE/
├── _bmad/                    # BMAD framework configuration
├── _bmad-output/             # Generated BMAD artifacts (deprecated for documentation)
│   ├── excalidraw-diagrams/  # ✅ Wireframes (10 screens, 206 elements)
│   ├── planning-artifacts/   # ⚠️ DEPRECATED - See gcredit-project/docs/
│   └── implementation-artifacts/ # ⚠️ DEPRECATED - See gcredit-project/docs/sprints/
├── gcredit-project/          # Main project (canonical documentation location)
│   ├── docs/
│   │   ├── planning/         # Planning artifacts (epics, UX spec, readiness reports)
│   │   ├── architecture/     # Architecture documentation
│   │   ├── sprints/          # Sprint documentation (Sprint 0-4)
│   │   ├── decisions/        # Architecture decision records
│   │   └── INDEX.md          # Documentation index
│   ├── backend/              # NestJS backend
│   └── frontend/             # React frontend
├── MD_FromCopilot/           # Source documents
│   ├── product-brief.md
│   └── PRD.md
├── docs/                     # Project knowledge & decisions
│   ├── infrastructure-inventory.md  # Azure resources (Sprint 0)
│   ├── security-notes.md           # Security vulnerabilities tracking (Sprint 2+)
│   └── decisions/                  # Architecture Decision Records
│       ├── 001-lodash-prototype-pollution.md
│       └── 002-lodash-security-risk-acceptance.md
├── gcredit-project/          # ⚠️ ACTUAL PROJECT ROOT (not gcredit-web/gcredit-api)
│   ├── frontend/             # React 19.2.3 + Vite 7.3.1 + TypeScript 5.9.3
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── lib/          # Utilities, API client
│   │   │   └── assets/       # Static resources
│   │   └── tests/            # Vitest + React Testing Library
│   └── backend/              # NestJS 11.0.1 + Prisma 6.19.2 + TypeScript 5.7.3
│       ├── src/
│       │   ├── common/       # ⚠️ SHARED INFRASTRUCTURE (Prisma, guards, decorators, services)
│       │   │   ├── prisma.module.ts
│       │   │   ├── prisma.service.ts
│       │   │   ├── storage.module.ts
│       │   │   ├── storage.service.ts
│       │   │   ├── email.service.ts
│       │   │   ├── guards/           # JWT auth guard, roles guard
│       │   │   ├── decorators/       # Roles decorator, GetUser decorator
│       │   │   └── services/         # BlobStorageService
│       │   ├── modules/              # DOMAIN MODULES WITH COMPLEX BUSINESS LOGIC
│       │   │   └── auth/             # Authentication module (strategies, JWT config)
│       │   ├── badge-templates/      # Sprint 2 - Badge template CRUD (flat structure)
│       │   ├── skill-categories/     # Sprint 2 - Skill category management (flat structure)
│       │   ├── skills/               # Sprint 2 - Skill management (flat structure)
│       │   ├── config/               # Configuration files (Azure Blob, JWT, etc.)
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── prisma/                   # Database schema and migrations
       │   ├── schema.prisma         # 8 models (User, PasswordResetToken, RefreshToken, BadgeTemplate, Badge, SkillCategory, Skill, BadgeSkill)
       │   ├── migrations/           # 3 migrations (Sprint 1, Sprint 2, Sprint 3)
│       │   └── seed.ts               # Seed data (25 skill categories, 8 skills)
│       ├── test/                     # E2E tests (Jest + Supertest)
│       ├── package.json              # 910 packages (6 vulnerabilities - documented)
│       └── .env                      # Environment variables (Azure, DB, JWT)
└── project-context.md                # THIS FILE
```

**⚠️ CRITICAL: Backend Module Organization Pattern**

Sprint 0-2 established this pattern:

1. **`src/common/`** - Infrastructure & cross-cutting concerns
   - Prisma (database access)
   - Auth guards & decorators
   - Storage services (Azure Blob)
   - Email service
   - **Import path:** `'../common/prisma.service'`, `'../common/guards/jwt-auth.guard'`

2. **`src/modules/`** - Complex domain modules with strategies/config
   - Auth module (Passport strategies, JWT configuration)
   - Future: modules requiring advanced patterns (CQRS, event sourcing, etc.)
   - **Import path:** `'../modules/auth/...'`

3. **Flat feature modules** - Standard CRUD features (Sprint 2 pattern)
   - `badge-templates/`, `skill-categories/`, `skills/`
   - Each contains: controller, service, DTOs, module file
   - **Import shared:** `'../common/prisma.module'`, `'../common/guards/roles.guard'`
   - **Import between features:** Avoid cross-feature imports; use events/shared services

**Monorepo Architecture:**
- **Frontend:** ~50-100 files (components, routing, API client) - Sprint 3+ development
- **Backend:** ~180+ files (3 Sprint 2 feature modules, auth module, shared infrastructure)
- **Independent Deployment:** Frontend and backend deployed separately to Azure App Service

---

## Next Actions

### ✅ Completed (Phase 1-3)

1. ✅ Create project context document (DONE - 2026-01-22)
2. ✅ Create Architecture Document (DONE - 2026-01-22)
   - **Output:** `gcredit-project/docs/architecture/system-architecture.md` (5,406 lines)
   - **Coverage:** 12 architectural decisions, 16 components, 33 FR mappings
   - **Status:** Validated, zero critical gaps
3. ✅ Create UX Design Specification (DONE - 2026-01-22)
   - **Output:** `gcredit-project/docs/planning/ux-design-specification.md` (3,314 lines)
   - **Coverage:** 22 screens, 7 user flows, complete interaction design
4. ✅ Create UX Wireframes (DONE - 2026-01-22)
   - **Output:** `_bmad-output/excalidraw-diagrams/wireframe-gcredit-mvp-20260122.excalidraw`
   - **Coverage:** 10 screens (6 desktop + 4 mobile), 206 elements
   - **Purpose:** Stakeholder alignment and visual communication
5. ✅ Create Epics & User Stories (DONE - 2026-01-22)
   - **Output:** `gcredit-project/docs/planning/epics.md`
   - **Coverage:** 14 epics, 85 stories, 100% FR coverage validated
6. ✅ Implementation Readiness Review (DONE - 2026-01-22)
   - **Output:** `gcredit-project/docs/planning/implementation-readiness-report-2026-01-22.md`
   - **Score:** 10/10 ("Rare achievement, zero critical gaps")

### 🎯 Current Phase (Phase 4 - Implementation)

7. ✅ **Sprint Planning** (DONE - 2026-01-23)
   - Sprint 0 plan created (2 weeks, 28 hours capacity)
   - 5 core stories + 3 bonus stories defined
   - Solo developer, spare-time project, realistic velocity

8. ✅ **Sprint 0: Infrastructure Setup** (COMPLETE - 2026-01-23 to 2026-01-24)
   - ✅ Story 1.1: Frontend initialization (React 18.3.1 + Vite 7.2.4 + TypeScript 5.9.3 + Tailwind CSS 4.1.18 + Shadcn/ui)
   - ✅ Story 1.2: Backend initialization (NestJS 11.0.16 + Prisma 6.19.2 + TypeScript 5.7.3)
   - ✅ Story 1.3: Azure PostgreSQL Flexible Server (B1ms, gcredit-dev-db-lz)
   - ✅ Story 1.4: Azure Blob Storage (gcreditdevstoragelz, 2 containers)
   - ✅ Story 1.5: Comprehensive README documentation (root + backend)
   - **Actual Time:** 9.5h / 10h estimated (95% accuracy)
   - **Completion:** 100% (5/5 core stories)
   - **Retrospective:** Key learnings documented in sprint-0-retrospective.md

9. ✅ **Sprint 1: JWT Authentication & User Management** (COMPLETE - 2026-01-25)
   - **Duration:** 1 day (high-intensity development session)
   - **Stories:** 7 stories from Epic 2 (2.1-2.7, Story 2.8 deferred to Sprint 8+)
   - **Actual Time:** 21h / 21h estimated (100% accuracy - perfect estimation!)
   - **Completion:** 100% (7/7 stories delivered)
   - **Testing:** 40/40 tests passed (100% pass rate)
   - **Key Deliverables:**
     - ✅ Enhanced User data model with roles
     - ✅ User registration with validation
     - ✅ JWT dual-token authentication (Access + Refresh)
     - ✅ RBAC with 4 roles (ADMIN, ISSUER, MANAGER, EMPLOYEE)
     - ✅ Password reset flow via email
     - ✅ User profile management (get/update/change password)
     - ✅ Session management and logout
     - ✅ 14 API endpoints (6 public, 8 protected)
     - ✅ 3 database models (User, PasswordResetToken, RefreshToken)
     - ✅ Comprehensive test suite (7 test scripts + 1 integration suite)
   - **Branch:** `sprint-1-authentication` (8 commits, ready to merge)
   - **Future Requirements:** FR-001 OAuth2 email integration (deferred to enterprise deployment)
   - **Retrospective:** Perfect time estimation, 100% test coverage, production-ready authentication system
   
10. ✅ **Sprint 2: Badge Template Management** (COMPLETE - 2026-01-26)
   - **Epic:** Epic 3 - Badge Template Management
   - **Actual Time:** ~21 hours (as estimated)
   - **Deliverables:** 30 API endpoints, 3 data models, Azure Blob integration
   - **Testing:** 27 tests (100% pass rate)
   - **Key Achievement:** MultipartJsonInterceptor middleware reduced code duplication by 88%
   
11. ✅ **Sprint 3: Badge Issuance System** (COMPLETE - 2026-01-28)
   - **Epic:** Epic 4 - Badge Issuance
   - **Actual Time:** 13h / 12.5h estimated (104% accuracy)
   - **Deliverables:** 7 API endpoints, Open Badges 2.0 compliance, email notifications
   - **Testing:** 46 tests (26 E2E + 20 unit), 7 UAT scenarios (100% pass)
   - **Key Achievements:** 
     - Complete badge lifecycle (issue → claim → verify → revoke)
     - Fixed UUID validation bug in test suite
     - Phase 1-3 documentation reorganization (45%→100% compliance)
   - **Version:** v0.3.0 (tagged 2026-01-28)

12. ✅ **Sprint 4: Employee Badge Wallet** (COMPLETE - 2026-01-28)
   - **Epic:** Epic 5 - Badge Wallet & Employee Profile
   - **Actual Time:** 48h estimated (58 tests, 100% pass)
   - **Deliverables:** Timeline View, Badge Detail Modal, Evidence Files, Similar Badges, Milestones, Empty States, Report Issues
   - **Testing:** 58 backend tests (19 milestone + 11 evidence + 8 recommendations)
   - **Key Achievements:**
     - Timeline view replacing grid layout (date navigation, horizontal cards)
     - Badge detail modal with 10 sub-components
     - Azure Blob evidence integration with SAS tokens (5-min expiry)
     - Similar badge recommendations (skills +20, category +15, issuer +10)
     - Admin-configurable milestones (badge count, skill tracks, anniversaries)
     - 4 empty state scenarios with auto-detection
     - Inline issue reporting to g-credit@outlook.com
   - **Database:** 3 new tables (evidence_files, milestone_configs, milestone_achievements)
   - **API Endpoints:** 9 new endpoints (wallet, similar, evidence, download, report, milestones)
   - **Branch:** sprint-4/epic-5-employee-badge-wallet (7 commits)
   - **Version:** v0.4.0 (tagged 2026-01-29)

13. ✅ **Sprint 5: Badge Verification & Open Badges 2.0** (COMPLETE - 2026-01-29)
   - **Epic:** Epic 6 - Badge Verification & Standards Compliance
   - **Duration:** 1 day (accelerated from 7-day estimate)
   - **Actual Time:** 30h / 28h estimated (107% velocity)
   - **Stories:** 5 stories (6.1-6.5, 100% complete)
   - **Completion:** 100% (5/5 stories delivered)
   - **Testing:** 68 tests (24 unit + 6 integration + 38 E2E), individual suites 100% passing
   - **Key Deliverables:**
     - ✅ Open Badges 2.0 JSON-LD assertions (hosted verification)
     - ✅ Public verification pages with unique URLs
     - ✅ Verification API endpoint (no auth, CORS enabled)
     - ✅ Baked badge PNG with Sharp library (iTXt metadata embedding)
     - ✅ Metadata immutability & integrity (SHA-256 hashing)
     - ✅ 5 API endpoints (3 public, 2 protected)
     - ✅ Database migration: verificationId + metadataHash columns
     - ✅ Frontend: VerifyBadgePage.tsx with email masking
     - ✅ 3 ADRs (005: Open Badges, 006: Public API Security, 007: Baked Badge Storage)
   - **Technical Debt:** 5 items (18-24h) - test isolation, index optimization, caching
   - **Quality Metrics:** Zero production bugs, clean production code, 100% FR coverage
   - **Branch:** sprint-5/epic-6-badge-verification (16 commits)
   - **Version:** v0.5.0 (tagged 2026-01-29)
   - **Retrospective Key Learnings:**
     - Architecture-first approach (Winston's ADRs) prevented mid-sprint debates
     - Lessons-learned application avoided past mistakes
     - Documentation templates accelerated sprint closeout
     - Project organization improvements enhanced team navigation
     - UX gap identified: Technical completion ≠ user experience validation
     - **Action Item:** UX Designer embedded in Sprint 6, full-role UAT scheduled

14. ✅ **Sprint 6 Planning** (COMPLETE - 2026-01-29)
   - **Epic:** Epic 7 - Badge Sharing & Social Proof
   - **Status:** 🟡 PLANNING COMPLETE - Awaiting Kickoff (after rest period)
   - **Planning Activities Completed:**
     - ✅ Sprint 6 Strategy Adjustment Meeting (2026-01-29)
     - ✅ Strategic decisions finalized (MS Graph API, Adaptive Cards, LinkedIn deferred)
     - ✅ UX audit completed by Sally (4h, 1,181 lines, ux-audit-report.md)
     - ✅ Email template specs created (844 lines, email-template-specs.md)
     - ✅ Adaptive Card design specs created (adaptive-card-specs.md)
     - ✅ Kickoff readiness checklist created (441 lines, kickoff-readiness.md)
     - ✅ Full backlog prepared (1,315 lines, backlog.md)
   - **Scope Summary:**
     - **Feature Stories:** 4 stories (7.2 Email, 7.3 Widget, 7.4 Teams, 7.5 Analytics)
     - **Technical Stories:** Azure AD Setup, Microsoft Graph Module
     - **Technical Debt:** TD-001 E2E Test Isolation (8-10h)
     - **Deferred to Sprint 7:** Story 7.1 LinkedIn Sharing
   - **Estimated Effort:** 56-76 hours
   - **Sprint Duration:** 2.5-3 weeks
   - **Team:** Winston (Architect), Amelia (Dev), Sally (UX Designer), Bob (Scrum Master)
   - **Technology Decisions:**
     - Microsoft Graph API (not SMTP) for email integration
     - Full Adaptive Cards (not mock) for Teams notifications
     - Unified Microsoft Graph module architecture
   - **Prerequisites Status:**
     - ✅ Epic 6 complete (verification URLs ready)
     - ✅ UX audit complete (Sally, 4h)
     - ✅ Email/Teams/Widget design specs complete
     - ⏳ Pending: ADR-008 (Microsoft Graph Integration Strategy)
     - ⏳ Pending: Azure AD App Registration
     - ⏳ Pending: Microsoft Graph Module Architecture diagram
   - **Blocking Issues:** None (all planning complete, ready to start after rest)
   - **UAT Planning:** Full-role UAT scheduled after Sprint 6 implementation
   - **Documentation:** 3,781 lines of Sprint 6 planning artifacts created

15. ✅ **Sprint 7: Badge Revocation & Complete Lifecycle UAT** (COMPLETE - 2026-02-02)
   - **Epic:** Epic 9 - Badge Revocation & Complete Lifecycle
   - **Duration:** 2 days (2026-02-01 to 2026-02-02)
   - **Scope:** 10 stories (9.1-9.5 core features + U.1 UAT + 4 technical debt stories)
   - **Actual Time:** 38.5h / 41-47h estimated (92-82% capacity utilization, efficient execution)
   - **Completion:** 100% (10/10 stories delivered)
   - **Testing:** 334 tests total, 297 passing (100% pass rate for active tests), +90 tests from Sprint 6
   - **Key Deliverables:**
     - ✅ Badge Revocation API with 4 reasons (misconduct, error, expired, voluntary)
     - ✅ Admin Revocation Panel (frontend UI with filters, search, audit trail)
     - ✅ Email notifications for all revocation scenarios
     - ✅ Public verification with revocation status checking
     - ✅ Admin audit dashboard with analytics
     - ✅ Complete lifecycle UAT (100% pass rate, 8 scenarios)
     - ✅ 9 P0 technical debt items resolved
   - **Technical Achievements:**
     - Badge lifecycle: Issue → Claim → Verify → Revoke → Re-verify ✅
     - Public verification honors revocation status
     - Email system handles all state transitions
     - Admin audit trail with 7-day reporting
   - **Code Quality:**
     - 30 code review issues identified and fixed (100%)
     - Test coverage: >80% for all new code
     - Zero TypeScript/ESLint errors
   - **Branch:** sprint-7/epic-9-revocation-lifecycle-uat (committed 2026-02-02)
   - **Version:** v0.7.0
   - **Retrospective:** Excellent execution velocity, all acceptance criteria met, production-ready revocation system

16. ✅ **Sprint 8: Production-Ready MVP** (COMPLETE - 2026-02-05)
   - **Epic:** Epic 10 - Production-Ready MVP
   - **Duration:** 10 working days (2026-02-03 to 2026-02-14)
   - **Sprint Goal:** "Production-Ready MVP with UX Excellence, Security Hardening & M365 Integration"
   - **Scope:** 10 stories + 4 tasks = 14 work items, 44 SP, 77h estimated
   - **Progress:** 4/14 items complete (29%), 24.5h/77h used (32%)
   - **Branch:** sprint-8/epic-10-production-ready-mvp
   - **Target Version:** v0.8.0
   
   **Completed Items:**
   - ✅ **Task 8.0: Sprint Setup** (1.5h) - Dependencies installed, migrations applied
     - bcrypt@6.0.0 upgraded (fixed tar vulnerability, SEC-P1-005)
     - helmet@8.1.0, @nestjs/throttler@6.5.0, @nestjs/cache-manager@3.1.0
     - Prisma migrations: M365SyncLog, UserAuditLog, User fields
   
   - ✅ **Task 8.6: Security Hardening** (6.5h) - CRITICAL
     - Helmet CSP headers with direct import pattern
     - CORS whitelist with ALLOWED_ORIGINS env
     - ThrottlerModule v6.5.0 (global + auth endpoint limits)
     - Evidence upload IDOR fix
     - Resolved: SEC-P1-001 to SEC-P1-005 (5 P1 security issues)
   
   - ✅ **Story 8.3: WCAG Accessibility** (8.5h) - CRITICAL
     - Keyboard navigation support
     - ARIA labels and landmarks
     - Color contrast compliance (WCAG 2.1 Level AA)
     - Focus indicators and skip links
     - Resolved: UX-P1-004 to UX-P1-007 (4 P1 accessibility issues)
   
   - ✅ **Task 8.8: E2E Test Isolation** (8h) - CRITICAL ⭐
     - **Major Achievement:** Resolved TD-001 from Sprint 5
     - Schema-based database isolation for parallel test execution
     - Test data factories for all entities (user, badge, template)
     - **Test Results:** 83/83 E2E tests passing (100% pass rate)
     - **Performance:** 6x speedup (40s vs 4min with 4 workers)
     - **CI/CD:** 100% reliability (was 20% before)
     - **Flaky Tests:** 0/83 (eliminated 45 flaky tests)
     - GitHub Actions: First CI run passed ✅
     - Files created: 1,800+ lines (test infrastructure + factories + CI/CD)
     - Documentation: E2E test guidelines (393 lines)
   
   **Completed (as of 2026-02-05):**
   - ✅ Task 8.0: Sprint 8 Development Environment Setup (1.5h)
   - ✅ Task 8.6: Security Hardening (6.5h)
   - ✅ Task 8.7: Architecture Fixes (5h)
   - ✅ Task 8.8: E2E Test Isolation (8h)
   - ✅ Story 8.1: Dashboard Homepage with Key Metrics (8h)
   - ✅ Story 8.2: Badge Search Enhancement (5.5h)
   - ✅ Story 8.3: WCAG 2.1 Accessibility (8.5h)
   - ✅ Story 8.4: Analytics API (6h)
   - ✅ Story 8.5: Responsive Design Optimization (4h)
   - ✅ Story 8.9: M365 Production Hardening (6h)
   - ✅ Story 8.10: Admin User Management Panel (11.5h)
   - ✅ Legacy 0.2b: Auth Enhancements (merged into Story 8.3 + Task 8.7)
   - ✅ Legacy 0.3: CSP Headers (merged into Task 8.6)
   
   **Sprint 8 Status: ✅ ALL WORK COMPLETE**
   - 12/12 executable items complete (100%)
   - 2 legacy items (0.2b, 0.3) merged into other stories
   - Total: 80h actual / 76h estimated (4h over capacity)
   
   **Technical Debt Resolution:**
   - ✅ TD-001: E2E Test Isolation (COMPLETE - Sprint 8 Task 8.8)
   - ✅ SEC-P1-001 to SEC-P1-005: Security vulnerabilities (COMPLETE - Sprint 8 Task 8.6)
   - ✅ UX-P1-001 to UX-P1-007: Accessibility issues (COMPLETE - Stories 8.1, 8.3)
   - ✅ ARCH-P1-001 to ARCH-P1-004: Architecture fixes (COMPLETE - Sprint 8 Task 8.7)
   - ✅ SEC-HIGH-003: Role self-assignment on registration (COMPLETE - Story 8.10)
   - ✅ TD-014: Dual Email System → Embedded as Task 0 in Sprint 9 Story 8.4
   - ✅ TD-015: ESLint Warnings 1100 → Standalone Sprint 9 Story (td-015-eslint-type-safety.md)
   - ⏳ TD-006: Teams Channel Permissions (4 tests skipped)
   
   **Technical Debt Tracker Location:**
   - **Master List:** `docs/sprints/sprint-7/technical-debt-from-reviews.md` (57 items consolidated)
   - Includes: TD-001 to TD-015, SEC-P0/P1/P2, ARCH-P0/P1, UX-P0/P1/P2
   
   **Key Metrics:**
   - Test count: Backend 532 + Frontend 397 + E2E 158 = 1087 tests passing
   - Test reliability: 100% pass rate in parallel execution
   - CI/CD duration: ~2 minutes total
   - Security: 22 vulnerabilities remaining (AWS SDK upstream, non-blocking)

17. ✅ **Sprint 9 - Epic 8: Bulk Badge Issuance + TD Cleanup (COMPLETE - 2026-02-08)**
   - **Branch:** `sprint-9/epic-8-bulk-issuance-td-cleanup`
   - **Duration:** 2026-02-06 to 2026-02-08 (3 days, 12 days ahead of schedule)
   - **Capacity:** 80h, 5 stories (TD fully integrated into stories)
   - **Actual Time:** 37h / 51h estimated (27% under budget)
   
   **Completed (All 5 Stories SM Accepted):**
   - ✅ Story 8.1: CSV Template & Validation (8h actual / 8.5h est) - SM accepted 2026-02-07
     - CSV template download with BOM+date, badge template selector, Multer 100KB
     - 7 ACs verified, all tests passing
   - ✅ Story 8.2: CSV Upload & Parsing + Security Hardening (4h actual / 11.5h est) - SM accepted 2026-02-07
     - RFC 4180 CSV parser, CSV injection sanitization (ARCH-C1), XSS sanitization (sanitize-html)
     - DB-backed sessions ($transaction ReadCommitted), IDOR protection, env-configurable rate limiting
     - 3-state drag-drop UI, validation summary panel, 6 ACs verified
   - ✅ TD-015: ESLint Type Safety Cleanup (8h actual / 8h est) - SM accepted 2026-02-07
     - 1303 → 282 warnings (78% reduction, exceeded 62% target)
     - Shared `RequestWithUser` interface replaces `req: any` across 9 controllers
     - All 992 tests passing, zero regressions
   - ✅ Story 8.3: Bulk Preview UI + TD-013 Bundle Splitting (10h actual / 14.5h est) - SM accepted 2026-02-08
     - TD-013: Main chunk 707 KB → 235 KB (66.8% reduction)
     - 10 lazy-loaded routes, 5 vendor chunks, 7 new components, 29 tests
     - 5 code review findings — all FALSE POSITIVE
   - ✅ Story 8.4: Batch Processing Phase 1 + TD-014 Email Unification (7h actual / 8.5h est) - SM accepted 2026-02-08
     - TD-014: nodemailer fully removed, EmailService delegates to GraphEmailService
     - Synchronous batch processing (up to 20 badges), partial failure handling
     - ProcessingModal translated to English, simulated per-badge progress
     - ProcessingComplete with failed badges table, "Retry Failed Badges" button
     - 6 code review findings — 5 FALSE POSITIVE, 1 TRUE POSITIVE (low)
   
   **Sprint 9 Final Metrics:**
   - Stories: 5/5 done (100%)
   - Hours: 37h actual / 51h estimated (27% under budget)
   - Tests: Backend 532 + Frontend 397 + E2E 158 = 1087 total (0 failures)
   - ESLint: 423 warnings, 0 errors (regression from 308, needs Sprint 10 cleanup)
   - tsc: 114 test-only errors (improved from 124, TD-017)
   - Bundle: 235 KB main chunk (target ≤240 KB)
   - TD Resolved: TD-013 (bundle), TD-014 (email), TD-015 (ESLint)
   - New TD: ESLint regression (423 warnings), TD-017 (114 tsc test errors)

18. ✅ **Sprint 10 - v1.0.0 Release Sprint (COMPLETE - 2026-02-11)**
   - **Branch:** `sprint-10/v1-release`
   - **Duration:** 2026-02-09 to 2026-02-11 (3 days)
   - **Sprint Goal:** v1.0.0 Release: TD Cleanup + Full UAT + Release Tag
   - **Capacity:** 80h, 12 stories
   - **4 Phases:**
     - Phase 1 (Day 1): TD Cleanup — Stories 10.1-10.4 (17h) ✅
     - Phase 2 (Day 1): Feature Enhancement — Story 10.5 (6h) ✅
     - Phase 3 (Day 2-3): UAT — Stories 10.6-10.8 (28h) ✅
     - Phase 4 (Day 3): Release — Stories 10.9-10.10 (6h) ✅
   
   **Stories (12 total — all complete):**
   - ✅ 10.1: TD-017 Fix 114 tsc Test Type Errors (7.5h)
   - ✅ 10.2: ESLint Regression 423→0 + CI Gate (8h)
   - ✅ 10.3: TD-018 TODO/FIXME Cleanup (4h)
   - ✅ 10.3b: TD-019 Frontend ESLint Cleanup + CI Gate (3.5h)
   - ✅ 10.3c: TD-022 API Path Audit Fixes (1.5h)
   - ✅ 10.4: i18n Chinese String Scan + UX Quick Wins (2.5h)
   - ✅ 10.5: Admin Analytics Real Data (6h)
   - ✅ 10.6: UAT Test Plan & Seed Data (8h)
   - ✅ 10.7: Full UAT Execution — Round 1: 2/35 PASS → Round 2: 33/33 PASS
   - ✅ 10.8: UAT Bug Fixes — 7 bugs (4 P0 + 3 P1) all fixed + 12 additional fixes
   - ✅ 10.9: Release Documentation & CHANGELOG
   - ✅ 10.10: Merge Main + Tag v1.0.0
   
   **Key Achievements:**
   - UAT: 33/33 PASS, 0 FAIL, 2 SKIP (optional)
   - Tests: Backend 534 + Frontend 527 = 1,061 (100% pass rate)
   - ESLint: 0 errors, 0 warnings (zero-tolerance CI gate)
   - TypeScript: 0 errors (tsc --noEmit clean)
   - Bundle: 235 KB main chunk (10 lazy-loaded routes)
   - Version: v1.0.0 (backend + frontend package.json)
   
   **Release Notes:** `docs/sprints/sprint-10/v1.0.0-release-notes.md`

19. ✅ **Post-MVP Comprehensive Audit (COMPLETE - 2026-02-11)**
   - **Scope:** 6 audit dimensions covering PRD compliance, architecture, security, code quality, feature/UX
   - **Key Findings:**
     - Architecture: 91% compliance, 78% Phase 2/3 readiness, no P0 blockers
     - Security: 2 HIGH (localStorage JWT tokens, no account lockout), 3 MEDIUM, 4 LOW
     - Code Quality: Grade B+, 3 critical services with 0% test coverage
     - Feature/UX: 86% screen coverage, 95% endpoint coverage, 2 P0 issues
   - **Output:** 6 audit reports (~2,000 lines total):
     - `gcredit-project/docs/planning/post-mvp-audit-plan.md` (Master Plan)
     - `gcredit-project/docs/architecture/architecture-compliance-audit-2026-02.md` (#2)
     - `gcredit-project/docs/architecture/architecture-quality-assessment-2026-02.md` (#3)
     - `gcredit-project/docs/development/code-quality-audit-2026-02.md` (#4)
     - `gcredit-project/docs/security/security-audit-2026-02.md` (#5)
     - `gcredit-project/docs/planning/feature-completeness-audit-2026-02.md` (#6)
     - `gcredit-project/docs/planning/sprint-11-candidate-list.md` (Consolidated → Sprint 11)
   - **Action:** All P0/P1 findings triaged into Sprint 11 backlog

20. ✅ **Sprint 11 — Security Hardening + Code Quality + Feature Polish (COMPLETE - 2026-02-18)**
   - **Branch:** `sprint-11/security-quality-hardening`
   - **Duration:** 2026-02-12 to 2026-02-18 (7 days)
   - **Capacity:** 60h target (~65h actual, 92% accuracy)
   - **Stories:** 25/25 stories delivered across 7 Waves (all code reviews APPROVED)
     - Wave 1: Quick Wins (11.3, 11.14, 11.23, 11.7, 11.20) — ✅
     - Wave 2: Core Security (11.1, 11.2, 11.8, 11.9, 11.6) — ✅
     - Wave 3: Complex Features (11.4, 11.5, 11.18, 11.19) — ✅
     - Wave 4: Tests + Logger + Pagination (11.13, 11.10, 11.11, 11.12, 11.16) — ✅
     - Wave 5: Polish + CI (11.15, 11.17, 11.21, 11.22) — ✅
     - Wave 6: Data Contract Alignment (11.24) — ✅
     - Wave 7: Cookie Auth Hardening (11.25) — ✅
   
   **Key Achievements:**
   - Security: 2 HIGH → 0 HIGH (httpOnly cookies, account lockout, magic-byte, PII sanitization, HTML sanitization, email masking)
   - Tests: 1,061 → 1,310 (+249, +23%), 0 regressions
   - Code Quality: NestJS Logger in 22 services, PaginatedResponse<T>, 5 unused deps removed
   - DX: Husky v9 pre-commit + pre-push (CI mirror), CI Chinese char detection
   - Features: Badge visibility, LinkedIn share, CSV export, 403 page, skill UUID→name
   
   **UAT Results (2026-02-17/18):**
   - **153 test cases, 152 PASS, 0 FAIL, 1 SKIP (99.3%)**
   - 7 inline fixes during UAT (Badge lifecycle UX, sorting, ISSUER analytics scope, Badge Type rename)
   - Story 11.24: Data Contract Alignment — 14 API-to-UI issues fixed
   - Story 11.25: Cookie Auth Hardening — 8 httpOnly migration issues fixed
   
   **Technical Debt (5 items, ~53-77h):**
   - TD-009: Milestone Admin UI (P2, 16-24h)
   - TD-010: Evidence System Unification (P1, 24-40h)
   - TD-016: Dashboard JSON display (P2, 3-4h)
   - TD-017: Skills UUID fallback (P2, 2-3h, partial fix)
   - TD-018: LinkedIn OG meta tags (P2, 4-6h)
   
   **Evaluation:** Grade A+ (4.95/5.0) — see sprint-11-evaluation.md
   
   **Status:** ✅ v1.1.0 Released (merged to main, tagged, GitHub Release published)
   
   **Sprint Docs:** summary.md, retrospective.md, backlog.md, sprint-11-evaluation.md, 25 story files, 7 wave code reviews, uat-plan-v1.1.0.md

21. 🔜 **Next Actions (Post-Sprint 11 — Sprint 12 Planning)**
   - Phase 4 Pilot planning (L&D program pilot)
   - FEAT-008: User Management enhancements (manual add, M365 sync UI) — P1
     > ⚠️ **依赖 FR27:** M365 同步用户 passwordHash 为空，无法用当前 JWT 密码登录。需先决定 SSO 优先还是临时密码方案。
   - FR27: Azure AD SSO (Entra ID OAuth 2.0 替代密码登录) — P3, 16-24h
     > ⚠️ **与 FEAT-008 关联:** 若先做 SSO 则 M365 用户可直接登录；否则 FEAT-008 需增加临时密码生成逻辑。
   - FEAT-007: Session management (idle timeout, centralized HTTP client) — P2
   - FEAT-004: Role model refactor (Issuer as permission flag) — P2
   - TD-006: Teams Channel Permissions (requires tenant admin approval) — External
   - TD-016: Async Bulk Processing (Redis + Bull Queue for >20 badges) — P3
   - TD-027: Playwright Visual Regression in CI — P3
   - **Sprint 12 待决策 (PO):**
     - DEC-001: 登录页 UX 方案（双入口/SSO优先/统一SSO/智能路由）
     - DEC-002: 是否保留密码登录（pilot 兜底 vs GA 下线）
     - DEC-003: 手工创建用户的长期定位（迁移关闭 vs 长期并存）
     - DEC-004: FEAT-008 与 FR27 执行顺序（详见 Sprint 11 backlog 待决策清单）
     - DEC-005: Admin 初始化机制（M365 同步默认 EMPLOYEE，无生产级 Admin bootstrap，需决定环境变量/Azure AD Group/CLI 方案）
     - DEC-006: Badge 邮件分享送达率（发件域 `2wjh85.onmicrosoft.com` 被外部拦截，需配置自定义域名+SPF/DKIM/DMARC 或接入 SendGrid）

---

*This document serves as the single source of truth for all BMAD agents working on this project.*
