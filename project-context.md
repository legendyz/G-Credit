# G-Credit Project Context
## Internal Digital Credentialing System

**Project Name:** G-Credit  
**Project Type:** Enterprise Internal Platform (Greenfield)  
**Domain:** HR Tech / Learning & Development / Digital Credentials  
**License:** MIT License (Open Source)  
**Status:** 🔄 Sprint 1 - JWT Authentication & User Management (Ready to Start)  
**Sprint 0:** ✅ Complete (100%, 9.5h/10h, committed 2026-01-24)  
**Last Updated:** 2026-01-24

---

## Project Vision

Build an internal digital credentialing (badging) platform to securely recognize, verify, and analyze employee skills and achievements—replacing fragmented certificates and reducing dependence on external platforms.

---

## Key Documents

- **Product Brief:** `MD_FromCopilot/product-brief.md` ✅ COMPLETE
- **PRD:** `MD_FromCopilot/PRD.md` ✅ COMPLETE (33 FRs, 22 NFRs)
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md` ✅ COMPLETE (5,406 lines, 12 decisions, Phased Azure Strategy)
- **UX Design Specification:** `_bmad-output/planning-artifacts/ux-design-specification.md` ✅ COMPLETE (3,314 lines, 22 screens)
- **UX Wireframes:** `_bmad-output/excalidraw-diagrams/wireframe-gcredit-mvp-20260122.excalidraw` ✅ COMPLETE (10 screens: 6 desktop + 4 mobile)
- **Epics & Stories:** `_bmad-output/planning-artifacts/epics.md` ✅ COMPLETE (14 epics, 85 stories, 100% FR coverage)
- **Implementation Readiness Review:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-01-22.md` ✅ COMPLETE (Score: 10/10)
- **Sprint 0 Backlog:** `_bmad-output/implementation-artifacts/sprint-0-backlog.md` ✅ COMPLETE (All 5 stories delivered)
- **Sprint 0 Retrospective:** `_bmad-output/implementation-artifacts/sprint-0-retrospective.md` ✅ COMPLETE (Lessons learned & action items)
- **Sprint 1 Backlog:** `_bmad-output/implementation-artifacts/sprint-1-backlog.md` 🔄 READY (7 stories, 21h estimated, Epic 2 complete)

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
- **Framework:** React 18.3.1 (with Concurrent Features)
- **Build Tool:** Vite 7.2.4 (instant HMR, optimized production builds)
- **UI Framework:** Tailwind CSS 4.1.18 + @tailwindcss/postcss + Shadcn/ui components
- **State Management:** TanStack Query v5 (server state) + Zustand (client state) - *to be added Sprint 1+*
- **Routing:** React Router v6 - *to be added Sprint 1+*
- **Form Handling:** React Hook Form + Zod validation - *to be added Sprint 1+*

### Backend Stack
- **Framework:** NestJS 11.0.16 (enterprise-grade Node.js)
- **API Design:** RESTful with standard response wrapper `{data, meta}` - *to be implemented Sprint 1+*
- **Authentication:** Passport.js + JWT (Azure AD integration) - *to be added Sprint 1+*
- **Job Queue:** Bull (Redis-backed async processing) - *to be added Sprint 2+*
- **Validation:** Class-validator + Class-transformer - *to be added Sprint 1+*

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
| Phase 3 - MVP Development | 8-12 weeks | Working MVP (core issuance) | 🔄 IN PROGRESS - Sprint 1 (JWT Auth) |
| → Sprint 0 | 2 weeks | Infrastructure Setup | ✅ COMPLETE (2026-01-23→01-24, 9.5h/10h) |
| → Sprint 1 | 2 weeks | JWT Auth & User Management (Epic 2) | 🔄 READY TO START (2026-01-27→02-09, 21h) |
| Phase 4 - Pilot | 4-6 weeks | Pilot with one L&D program | ⏳ Pending |
| Phase 5 - Iteration | 4-8 weeks | Analytics, integrations | ⏳ Pending |
| Phase 6 - Production Rollout | Ongoing | Company-wide launch | ⏳ Pending |

**Current Status:** ✅ Sprint 0 Infrastructure Complete (100%) → 🔄 Sprint 1 Ready to Start → JWT Authentication & User Management (Epic 2, 7 stories, 21h)

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
| **lodash Prototype Pollution vulnerability** | Moderate | ⚠️ Accepted Risk | Deferred to Sprint 1. Dependency of @nestjs/config. Fix requires breaking change (downgrade to v1.1.5). Development environment only, low exploit risk. Will re-evaluate before Sprint 1 starts. |
| **Prisma version locked at 6.x** | Low | 🔒 Intentional | Prisma 7 has breaking changes (prisma.config.ts requirement). Upgrade deferred to post-MVP. Current version stable and meets all requirements. |
| **Dependency version drift risk** | Medium | 📋 Process Improvement | Sprint 0 revealed planning docs had outdated versions. Action: All future sprint docs must specify exact versions. Version manifest template to be created. |

---

## Repository Structure

```
CODE/
├── _bmad/                    # BMAD framework configuration
├── _bmad-output/             # Generated artifacts
│   ├── planning-artifacts/   # ✅ Planning complete (all documents validated)
│   │   ├── architecture.md           # 185 KB, 5,406 lines, 12 decisions
│   │   ├── ux-design-specification.md # 137 KB, 3,314 lines, 22 screens
│   │   ├── epics.md                   # 122 KB, 14 epics, 85 stories
│   │   └── implementation-readiness-report-2026-01-22.md # 10/10 score
│   ├── excalidraw-diagrams/  # ✅ Wireframes (10 screens, 206 elements)
│   └── implementation-artifacts/ # 🔄 Ready for Sprint artifacts
├── MD_FromCopilot/           # Source documents
│   ├── product-brief.md
│   └── PRD.md
├── docs/                     # Project knowledge
├── gcredit-web/              # Frontend monorepo (Vite + React 18 + TypeScript)
│   ├── src/
│   │   ├── features/         # Feature modules (badges, assertions, users, etc.)
│   │   ├── shared/           # Shared UI components, hooks, utils
│   │   ├── lib/              # Third-party integrations (API client, auth)
│   │   └── assets/           # Static assets (images, fonts)
│   └── tests/                # Frontend tests (Vitest + React Testing Library)
├── gcredit-api/              # Backend monorepo (NestJS 10 + Prisma 5)
│   ├── src/
│   │   ├── modules/          # Feature modules (badges, assertions, auth, etc.)
│   │   ├── common/           # Shared utilities (filters, guards, interceptors)
│   │   └── config/           # Configuration modules
│   ├── prisma/               # Prisma schema and migrations
│   └── test/                 # Backend tests (Jest + Supertest)
└── project-context.md        # THIS FILE
```

**Monorepo Architecture:**
- **Frontend:** ~150-200 files (7 feature modules, shared components, routing)
- **Backend:** ~120-150 files (9 NestJS modules, Prisma schema, global utilities)
- **Independent Deployment:** Frontend and backend can be deployed separately

---

## Next Actions

### ✅ Completed (Phase 1-3)

1. ✅ Create project context document (DONE - 2026-01-22)
2. ✅ Create Architecture Document (DONE - 2026-01-22)
   - **Output:** `_bmad-output/planning-artifacts/architecture.md` (5,406 lines)
   - **Coverage:** 12 architectural decisions, 16 components, 33 FR mappings
   - **Status:** Validated, zero critical gaps
3. ✅ Create UX Design Specification (DONE - 2026-01-22)
   - **Output:** `_bmad-output/planning-artifacts/ux-design-specification.md` (3,314 lines)
   - **Coverage:** 22 screens, 7 user flows, complete interaction design
4. ✅ Create UX Wireframes (DONE - 2026-01-22)
   - **Output:** `_bmad-output/excalidraw-diagrams/wireframe-gcredit-mvp-20260122.excalidraw`
   - **Coverage:** 10 screens (6 desktop + 4 mobile), 206 elements
   - **Purpose:** Stakeholder alignment and visual communication
5. ✅ Create Epics & User Stories (DONE - 2026-01-22)
   - **Output:** `_bmad-output/planning-artifacts/epics.md`
   - **Coverage:** 14 epics, 85 stories, 100% FR coverage validated
6. ✅ Implementation Readiness Review (DONE - 2026-01-22)
   - **Output:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-01-22.md`
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

9. 🔄 **Sprint 1: JWT Authentication & User Management** (READY TO START - 2026-01-27)
   - **Duration:** 2 weeks (2026-01-27 → 2026-02-09)
   - **Stories:** 7 stories from Epic 2 (2.1-2.7)
   - **Estimated:** 21 hours total
   - **Scope:** Enhanced User model, JWT service, auth controllers/guards, password management, sessions, Azure AD SSO, user profile API
   - **Prerequisites:** ✅ Sprint 0 retrospective reviewed, action items identified (AI-1 through AI-8)
   - **Backlog:** See `sprint-1-backlog.md` for detailed task breakdown
   
10. 🔜 **Sprint 2-N: MVP Development** (After Sprint 1)
   - Epic 3: Badge Template Management
   - Epic 4: Assertion Issuance
   - Epic 5: Badge Wallet & Viewing
   - Target: 6-week MVP total (50-user pilot)

---

*This document serves as the single source of truth for all BMAD agents working on this project.*
