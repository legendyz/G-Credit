# G-Credit Project Context
## Internal Digital Credentialing System

**Project Name:** G-Credit  
**Project Type:** Enterprise Internal Platform (Greenfield)  
**Domain:** HR Tech / Learning & Development / Digital Credentials  
**License:** MIT License (Open Source)  
**Status:** Sprint 0 in Progress - Story 1.1 Complete (Frontend)  
**Last Updated:** 2026-01-23

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
- **Sprint 0 Backlog:** `_bmad-output/implementation-artifacts/sprint-0-backlog.md` 🔄 IN PROGRESS (Story 1.1 ✅, Story 1.2-1.5 TODO)

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
- **Architecture Pattern:** Modular Monolith (monorepo: `gcredit-web` + `gcredit-api`)
- **Language:** TypeScript 5 (unified frontend + backend)
- **Runtime:** Node.js 20 LTS
- **Database:** PostgreSQL 16
- **ORM:** Prisma 5

### Frontend Stack
- **Framework:** React 18 (with Concurrent Features)
- **Build Tool:** Vite 5 (instant HMR, optimized production builds)
- **UI Framework:** Tailwind CSS 3.x + Shadcn/ui components
- **State Management:** TanStack Query v5 (server state) + Zustand (client state)
- **Routing:** React Router v6
- **Form Handling:** React Hook Form + Zod validation

### Backend Stack
- **Framework:** NestJS 10 (enterprise-grade Node.js)
- **API Design:** RESTful with standard response wrapper `{data, meta}`
- **Authentication:** Passport.js + JWT (Azure AD integration)
- **Job Queue:** Bull (Redis-backed async processing)
- **Validation:** Class-validator + Class-transformer

### Azure Cloud Services
- **Compute:** Azure App Service (frontend + backend)
- **Database:** Azure Database for PostgreSQL Flexible Server
- **Storage:** Azure Blob Storage (badge images, evidence files, user uploads)
- **Identity:** Azure AD (Entra ID) OAuth 2.0 SSO
- **Secrets:** Azure Key Vault (API keys, connection strings)
- **Monitoring:** Azure Application Insights (telemetry, logs, alerts)
- **Caching:** Azure Cache for Redis (job queues, future session storage)

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
| Phase 3 - MVP Development | 8-12 weeks | Working MVP (core issuance) | 🔄 NEXT - Sprint 0 starting |
| Phase 4 - Pilot | 4-6 weeks | Pilot with one L&D program | ⏳ Pending |
| Phase 5 - Iteration | 4-8 weeks | Analytics, integrations | ⏳ Pending |
| Phase 6 - Production Rollout | Ongoing | Company-wide launch | ⏳ Pending |

**Current Status:** All Planning Phases Complete (PRD + Architecture + UX + Epics & Stories) → Implementation Readiness Score: 10/10 → Ready for Sprint Planning

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

8. 🔄 **Sprint 0: Infrastructure Setup** (IN PROGRESS - Started 2026-01-23)
   - ✅ Story 1.1: Frontend initialization (React 18 + Vite + TypeScript + Tailwind CSS + Shadcn/ui) - COMPLETE
   - ⏭️ Story 1.2: Backend initialization (NestJS 10 + Prisma) - TODO
   - ⏭️ Story 1.3: Azure PostgreSQL configuration - TODO
   - ⏭️ Story 1.4: Azure Blob Storage configuration - TODO
   - ⏭️ Story 1.5: README documentation - TODO
   - **Progress:** 30% (3h / 10h core work completed)
   - **Sprint End:** 2026-02-05

9. 🏃 **Sprint 1-N: MVP Development** (After Sprint 0)
   - Epic 2: JWT Authentication & User Management
   - Epic 3: Badge Template Management
   - Epic 4: Assertion Issuance
   - Epic 5: Badge Wallet & Viewing
   - Target: 6-week MVP (50-user pilot)

---

*This document serves as the single source of truth for all BMAD agents working on this project.*
