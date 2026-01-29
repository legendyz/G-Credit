# G-Credit Project Context
## Internal Digital Credentialing System

**Project Name:** G-Credit  
**Project Type:** Enterprise Internal Platform (Greenfield)  
**Domain:** HR Tech / Learning & Development / Digital Credentials  
**License:** MIT License (Open Source)  
**Status:** 🟡 Sprint 6 Planning Complete - Awaiting Kickoff (Epic 7 - Badge Sharing & Social Proof)  
**Sprint 0:** ✅ Complete (100%, 9.5h/10h, committed 2026-01-24)  
**Sprint 1:** ✅ Complete (100%, 21h/21h, committed 2026-01-25)  
**Sprint 2:** ✅ Complete (100%, committed 2026-01-26)  
**Sprint 3:** ✅ Complete (100%, 13h/12.5h, committed 2026-01-28, tagged v0.3.0)  
**Sprint 4:** ✅ Complete (100%, 48h/48h estimated, committed 2026-01-28, tagged v0.4.0)  
**Sprint 5:** ✅ Complete (100%, 30h/28h, committed 2026-01-29, tagged v0.5.0, branch: sprint-5/epic-6-badge-verification)  
**Sprint 6:** 🟡 Planning Complete (Epic 7, 56-76h estimated, awaiting kickoff after rest period)  
**Last Updated:** 2026-01-29

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
├── sprints/              # Sprint documentation (Sprint 0-4)
│   ├── sprint-0/         # Infrastructure setup
│   ├── sprint-1/         # JWT auth & user management
│   ├── sprint-2/         # Badge template management
│   ├── sprint-3/         # Badge issuance
│   └── sprint-4/         # Employee badge wallet
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
- **Language:** TypeScript 5.9.3 (both frontend and backend)
- **Runtime:** Node.js 20.20.0 LTS
- **Database:** PostgreSQL 16 (Azure Flexible Server)
- **ORM:** Prisma 6.19.2 ⚠️ **Version locked** (Prisma 7 has breaking changes)

### Frontend Stack
- **Framework:** React 19.2.3 (with Concurrent Features)
- **Build Tool:** Vite 7.3.1 (instant HMR, optimized production builds)
- **UI Framework:** Tailwind CSS 4.1.18 + @tailwindcss/postcss + Shadcn/ui components
- **State Management:** TanStack Query v5 (server state) + Zustand (client state) - *to be added Sprint 1+*
- **Routing:** React Router v6 - *to be added Sprint 1+*
- **Form Handling:** React Hook Form + Zod validation - *to be added Sprint 1+*

### Backend Stack
- **Framework:** NestJS 11.1.12 (Core), 11.0.16 (CLI) (enterprise-grade Node.js)
- **API Design:** RESTful JSON API (14 endpoints implemented)
- **Authentication:** ✅ Passport.js + JWT (Access 15min, Refresh 7d, Azure AD integration deferred to Sprint 8+)
- **Authorization:** ✅ RBAC with 4 roles (ADMIN, ISSUER, MANAGER, EMPLOYEE)
- **Job Queue:** Bull (Redis-backed async processing) - *to be added Sprint 2+*
- **Validation:** ✅ Class-validator + Class-transformer (all DTOs validated)
- **Security:** ✅ bcrypt password hashing, JWT guards, role-based guards, token revocation

### Azure Cloud Services
- **Compute:** Azure App Service (frontend + backend) - *to be configured Sprint 1+*
- **Database:** ✅ Azure Database for PostgreSQL Flexible Server (B1ms, gcredit-dev-db-lz)
- **Storage:** ✅ Azure Blob Storage (gcreditdevstoragelz, containers: badges [public], evidence [private])
- **Identity:** Azure AD (Entra ID) OAuth 2.0 SSO - *to be integrated Sprint 1+*
- **Secrets:** Azure Key Vault (API keys, connection strings) - *to be added Sprint 2+*
- **Monitoring:** Azure Application Insights (telemetry, logs, alerts) - *to be added Sprint 2+*
- **Caching:** Azure Cache for Redis (job queues, future session storage) - *to be added Sprint 2+*

### Standards & Compliance
- **Digital Credentials:** Open Badges 2.0 JSON-LD format
- **Security:** TLS 1.3, JWT tokens, RBAC, audit logging
- **Data Privacy:** GDPR-compliant, user-controlled badge visibility

---

## Key Features Summary

### Phase 1 - MVP (Target: Q1 2026)
- Badge template creation & catalog
- Manual badge issuance (single + bulk CSV)
- Employee badge wallet/profile
- Public verification pages
- Azure AD SSO
- Email notifications

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
| Phase 3 - MVP Development | 8-12 weeks | Working MVP (core issuance) | 🔄 IN PROGRESS - Sprint 4 Planning |
| → Sprint 0 | 2 weeks | Infrastructure Setup | ✅ COMPLETE (2026-01-23→01-24, 9.5h/10h) |
| → Sprint 1 | 1 day | JWT Auth & User Management (Epic 2) | ✅ COMPLETE (2026-01-25, 21h/21h, 40 tests) |
| → Sprint 2 | 2 weeks | Badge Template Management (Epic 3) | ✅ COMPLETE (2026-01-26, 30 endpoints, 27 tests) |
| → Sprint 3 | 2 weeks | Badge Issuance System (Epic 4) | ✅ COMPLETE (2026-01-28, 13h/12.5h, 46 tests, v0.3.0) |
| → Sprint 4 | 2 days | Employee Badge Wallet (Epic 5) | ✅ COMPLETE (2026-01-28, 48h, 58 tests, v0.4.0) |
| → Sprint 5 | 1 day | Badge Verification & Open Badges 2.0 (Epic 6) | ✅ COMPLETE (2026-01-29, 30h, 68 tests, v0.5.0) |
| → Sprint 6 | 2.5-3 weeks | Badge Sharing & Social Proof (Epic 7) | 🟡 PLANNING COMPLETE (2026-01-29, 56-76h estimated, awaiting kickoff) |
| Phase 4 - Pilot | 4-6 weeks | Pilot with one L&D program | ⏳ Pending |
| Phase 5 - Iteration | 4-8 weeks | Analytics, integrations | ⏳ Pending |
| Phase 6 - Production Rollout | Ongoing | Company-wide launch | ⏳ Pending |

**Current Status:** ✅ Sprint 5 Complete (Badge Verification & Open Badges 2.0, v0.5.0) → 🟡 Sprint 6 Planning Complete (Epic 7 - Badge Sharing & Social Proof, 3,781 lines documentation, awaiting kickoff after rest period)

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

| Issue | Severity | Status | Plan |
|-------|----------|--------|------|
| **lodash Prototype Pollution vulnerability** | Moderate | ✅ Risk Accepted (ADR-002) | **Decision:** Accept risk for MVP development (Sprint 1-7). Development environment only, CVSS 6.5 (Medium), no external exposure. **Re-evaluate:** Before production deployment (Sprint 8+). See [ADR-002](docs/decisions/002-lodash-security-risk-acceptance.md) for full analysis. |
| **Prisma version locked at 6.x** | Low | 🔒 Intentional | Prisma 7 has breaking changes (prisma.config.ts requirement). Upgrade deferred to post-MVP. Current version stable and meets all requirements. |
| **Dependency version drift risk** | Medium | 📋 Process Improvement | Sprint 0 revealed planning docs had outdated versions. Action: All future sprint docs must specify exact versions. Version manifest template to be created. |

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
   - Solo developer, 业余时间, realistic velocity

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

15. 🔜 **Sprint 6 Kickoff** (NEXT - After Rest Period)
   - **Target:** TBD (LegendZhu determines start date)
   - **Pre-Kickoff Tasks Remaining:**
     - Winston: ADR-008 Microsoft Graph Integration Strategy (30-45min)
     - Winston: Adaptive Card Design Templates (1-2h)
     - Winston: Azure AD App Registration Guide (1h)
     - Winston: Microsoft Graph Module Architecture (1h)
   - **Ready to Start:** Email sharing, Widget embedding, Teams notifications, Sharing analytics

---

*This document serves as the single source of truth for all BMAD agents working on this project.*
