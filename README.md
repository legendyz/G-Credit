# G-Credit - Enterprise Internal Digital Credentialing System

[![Status](https://img.shields.io/badge/Status-Sprint%202%20Ready-green)]()
[![Phase](https://img.shields.io/badge/Phase-MVP%20Development-blue)]()
[![Sprint0](https://img.shields.io/badge/Sprint%200-Complete%20(95%25)-success)]()
[![Sprint1](https://img.shields.io/badge/Sprint%201-Complete%20(100%25)-brightgreen)]()
[![Sprint2](https://img.shields.io/badge/Sprint%202-Ready%20to%20Start-green)]()

> **G-Credit** is an enterprise-grade internal digital badging platform designed to securely recognize, verify, and analyze employee skills and achievements. Compliant with Open Badges 2.0 standards, it aims to replace fragmented certificate management and reduce dependency on external platforms.

---

## 📋 Project Overview

**Project Name:** G-Credit  
**Project Type:** Enterprise Internal Platform (Greenfield Development)  
**Domain:** HR Tech / Learning & Development / Digital Credentials  
**Current Status:** 🚀 Sprint 2 Ready to Start - Badge Template Management  
**Sprint 0:** ✅ Complete (100%, 9.5h/10h estimated, 2026-01-24)  
**Sprint 1:** ✅ Complete (100%, 21h/21h estimated, 2026-01-25)  
**Sprint 2:** 🚀 Ready to Start (Epic 3, 32-33h estimated, starts 2026-01-27)  
**Last Updated:** 2026-01-25

### 🎯 Core Objectives

1. ✅ Create a culture of recognition & continuous learning
2. ✅ Provide trusted, verifiable proof of skills (Open Badges 2.0 compliant)
3. ✅ Enable workforce skill visibility and analytics
4. ✅ Automate recognition workflows
5. ✅ Retain full control of employee data and branding
6. ✅ Reduce long-term platform costs (vs. SaaS alternatives like Credly, Accredible)

---

## 🏗️ Technical Architecture

### Architecture Pattern
- **Architecture Style:** Modular Monolith
- **Deployment Strategy:** Separate Frontend/Backend Deployment (Monorepo)
- **Cloud Platform:** Microsoft Azure
- **Standards Compliance:** Open Badges 2.0 (IMS Global / 1EdTech)

### Technology Stack

#### Frontend (`gcredit-web`)
- **Framework:** React 19.2.3 + TypeScript 5.9.3
- **Build Tool:** Vite 7.3.1
- **UI Framework:** Tailwind CSS 4.1.18 + Shadcn/ui
- **State Management:** TanStack Query v5 + Zustand
- **Routing:** React Router v6
- **Form Handling:** React Hook Form + Zod

#### Backend (`gcredit-api`)
- **Framework:** NestJS 11.1.12 (Core), 11.0.16 (CLI) + TypeScript 5.9.3
- **Runtime:** Node.js 20.20.0 LTS
- **Database:** PostgreSQL 16 (Azure Flexible Server B1ms)
- **ORM:** Prisma 6.19.2 ⚠️ **Version Locked** (Prisma 7 has breaking changes)
- **Authentication:** Passport.js + JWT
- **Queue:** Bull (Redis-backed)

#### Azure Cloud Services
- **Compute:** Azure App Service (Frontend + Backend)
- **Database:** Azure Database for PostgreSQL Flexible Server
- **Storage:** Azure Blob Storage (Badge images, evidence files)
- **Identity:** Azure AD (Entra ID) OAuth 2.0 SSO
- **Secrets:** Azure Key Vault
- **Monitoring:** Azure Application Insights
- **Caching:** Azure Cache for Redis

---

## 🚀 Core Features

### Badge Management & Design
- Template-based badge creation (metadata, criteria, skills taxonomy)
- Badge catalog with search and categorization
- Visual designer for badge images and branding
- Optional expiration and renewal policies
- Approval and governance workflows

### Issuance Workflows
- Manual single/bulk CSV issuance
- Automated triggers via LMS course completion
- Manager nomination and approval workflows
- Role-based issuing permissions (RBAC)

### Verification & Standards Compliance
- Open Badges 2.0 compliant badge assertions
- Public verification pages (unique URLs)
- Immutable metadata (issuer, recipient, date, criteria)
- JSON-LD exportable assertions
- Baked Badge PNG support
- Revocation capabilities with reason tracking

### Employee Experience
- Personal badge wallet/profile
- Badge claiming workflow (manual or auto-accept)
- Privacy controls (public/private per badge)
- Social sharing (LinkedIn, email, personal websites)
- Badge download and export

### Analytics & Insights
- Admin dashboards (issuance trends, claim rates, share rates)
- Organizational skill inventory
- Department and role-based skill distribution
- Program effectiveness metrics
- Exportable reports for HR planning

### System Integrations
- Azure AD (Entra ID) SSO authentication
- HRIS employee directory sync
- LMS Webhook consumption (automated issuance)
- Microsoft Teams notifications and bot
- Outlook email notifications
- LinkedIn sharing integration
- RESTful APIs (external system access)

---

## 📊 Project Status

### ✅ Completed Phases (Phase 1-3)

| Document | Status | Details |
|----------|--------|---------|
| **Product Brief** | ✅ Complete | Business needs and core capabilities defined |
| **PRD** | ✅ Complete | 33 Functional Requirements + 22 Non-Functional Requirements |
| **Architecture Document** | ✅ Complete | 5,406 lines, 12 architectural decisions, 16 components |
| **UX Design Specification** | ✅ Complete | 3,314 lines, 22 screens, 7 user flows |
| **UX Wireframes** | ✅ Complete | 10 screens (6 desktop + 4 mobile), 206 elements |
| **Epics & Stories** | ✅ Complete | 14 epics, 85 user stories, 100% requirements coverage |
| **Implementation Readiness Review** | ✅ Complete | 10/10 score (zero critical gaps) |

### 🎯 Current Phase (Phase 4 - Implementation)

**Current Sprint:** Sprint 2 - Badge Template Management (Planning)  
**Status:** Sprint 1 Complete ✅ | Sprint 2 Ready to Start 🔜

**✅ Sprint 0 Completed (2026-01-24):**
- ✅ Frontend React 19.2.3 + Vite 7.3.1 + Tailwind CSS 4.1.18 + Shadcn/ui
- ✅ Backend NestJS 11.1.12 + Prisma 6.19.2 + TypeScript 5.9.3
- ✅ Azure PostgreSQL Flexible Server (B1ms)
- ✅ Azure Blob Storage (2 containers: badges, evidence)
- ✅ Comprehensive documentation
- **Total: 9.5h / 10h estimated (95% accuracy)**
- **Commits:** 6 commits

**✅ Sprint 1 Completed (2026-01-25):**
- ✅ Story 2.1: Enhanced User data model (2h)
- ✅ Story 2.2: User registration with validation (3h)
- ✅ Story 2.3: JWT dual-token authentication (4h)
- ✅ Story 2.4: RBAC with 4 roles (3h)
- ✅ Story 2.5: Password reset via email (4h)
- ✅ Story 2.6: User profile management (3h)
- ✅ Story 2.7: Session management and logout (2h)
- ⏸️ Story 2.8: Azure AD SSO (deferred to Sprint 8+)
- **Total: 21h / 21h estimated (100% accuracy - perfect!)**
- **Commits:** 10 feature commits
- **Testing:** 40/40 tests passed (100%)
- **Deliverables:**
  - 14 API endpoints (6 public, 8 protected)
  - 3 database models (User, PasswordResetToken, RefreshToken)
  - Complete authentication & authorization system
  - JWT tokens, bcrypt, RBAC, token revocation

**🔜 Next Sprints:**
- **Sprint 2:** Badge Template Management (Epic 3) - CRUD, catalog, criteria
- **Sprint 3:** Badge Issuance Foundation (Epic 4) - Single/bulk issuance
- **Sprint 4-5:** Employee Wallet & Verification (Epic 5-6)
- **Sprint 6-7:** Analytics & Integrations

---

## 📁 Project Structure

```
CODE/
├── _bmad/                          # BMAD Framework (v6.0.0-alpha.23)
│   ├── _config/                    # Framework configuration and manifests
│   │   ├── manifest.yaml           # Main manifest
│   │   ├── agent-manifest.csv      # Agent manifest
│   │   └── agents/                 # Agent customization configs
│   ├── _memory/                    # Memory and state management
│   ├── core/                       # Core functionality module
│   ├── bmb/                        # BMad Builder - Builder module
│   ├── bmm/                        # BMad Method - Main methodology module
│   ├── bmgd/                       # BMad Game Dev - Game development module
│   └── cis/                        # Creative Innovation Strategies module
│
├── _bmad-output/                   # Generated artifacts directory
│   ├── planning-artifacts/         # ✅ Planning Complete
│   │   ├── architecture.md         # 185 KB, 5,406 lines, 12 decisions
│   │   ├── ux-design-specification.md  # 137 KB, 3,314 lines, 22 screens
│   │   ├── epics.md                # 122 KB, 14 epics, 85 stories
│   │   ├── implementation-readiness-report-2026-01-22.md  # 10/10 score
│   │   └── bmm-workflow-status.yaml
│   ├── excalidraw-diagrams/        # ✅ Wireframes (10 screens, 206 elements)
│   │   ├── wireframe-gcredit-mvp-20260122.excalidraw
│   │   └── theme.json
│   └── implementation-artifacts/   # 🔄 Sprint 1 Ready to Start
│       ├── sprint-0-backlog.md     # Sprint 0 detailed plan (1,867 lines)
│       ├── sprint-0-retrospective.md  # Sprint 0 lessons learned (12,000+ words)
│       └── sprint-1-backlog.md     # Sprint 1 detailed plan (1,312 lines, 7 stories)
│
├── .github/                        # GitHub configuration
│   └── agents/                     # GitHub Copilot Agents (25 custom agents)
│       ├── bmd-custom-bmm-*.agent.md        # BMM method agents
│       ├── bmd-custom-bmb-*.agent.md        # BMB builder agents
│       ├── bmd-custom-cis-*.agent.md        # CIS innovation agents
│       └── bmd-custom-bmgd-*.agent.md       # BMGD game dev agents
│
├── MD_FromCopilot/                 # Source documents
│   ├── product-brief.md            # Product brief
│   └── PRD.md                      # Product Requirements Document
│
├── docs/                           # Project knowledge base
├── project-context.md              # Project context (single source of truth)
└── README.md                       # This file
```

**Expected Monorepo Structure (To Be Implemented):**
```
├── gcredit-web/                    # Frontend (Vite + React 18)
│   ├── src/features/               # Feature modules
│   ├── src/shared/                 # Shared components
│   └── tests/                      # Frontend tests
│
└── gcredit-api/                    # Backend (NestJS 10)
    ├── src/modules/                # NestJS modules
    ├── prisma/                     # Prisma schema and migrations
    └── test/                       # Backend tests
```

---

## 🎨 BMAD Framework

This project uses the **BMAD (Business Model Agent Development) Framework** v6.0.0-alpha.23 for development management:

### GitHub Copilot Agents

**25 Custom Agents** integrated via `.github/agents/` for enhanced AI-assisted development:

**BMM (Method) Agents (9):**
- Analyst, Architect, Developer, Product Manager
- Scrum Master, Test Engineer, UX Designer, Tech Writer
- Quick Flow Solo Dev

**BMB (Builder) Agents (3):**
- Agent Builder, Module Builder, Workflow Builder

**CIS (Innovation) Agents (6):**
- Brainstorming Coach, Creative Problem Solver, Design Thinking Coach
- Innovation Strategist, Presentation Master, Storyteller

**BMGD (Game Dev) Agents (6):**
- Game Architect, Game Designer, Game Dev, Game QA
- Game Scrum Master, Game Solo Dev

**Core Agent (1):**
- BMAD Master (central orchestrator)

### BMAD Modules

1. **Core** - Core configuration and base functionality
2. **BMM (BMad Method)** - Main methodology module, including:
   - Analyst
   - Architect
   - Developer (Dev)
   - Product Manager (PM)
   - Scrum Master (SM)
   - Test Engineer (TEA)
   - UX Designer
   - Tech Writer
   - Quick Flow Solo Dev

3. **BMB (BMad Builder)** - Builder module:
   - Agent Builder
   - Module Builder
   - Workflow Builder

4. **CIS (Creative Innovation Strategies)** - Innovation strategy module:
   - Brainstorming Coach
   - Creative Problem Solver
   - Design Thinking Coach
   - Innovation Strategist
   - Presentation Master
   - Storyteller

5. **BMGD (BMad Game Dev)** - Game development module (available)

---

## 📈 Success Metrics (KPIs)

| Metric | Target |
|--------|--------|
| **Adoption Rate** | 60% employee profile activation in first 6 months |
| **Engagement** | 40% badge claim rate |
| **Sharing Rate** | 25% social sharing rate |
| **Program Impact** | 80% participation in badged learning programs |
| **Verification** | 500+ external verifications/month |
| **Cost Savings** | 50% reduction vs. external platform licensing by year 2 |

---

## 🔐 Compliance & Security

- **Data Privacy:** GDPR-compliant, user-controlled visibility
- **Security:** TLS encryption, RBAC, audit logs
- **Standards:** Open Badges 2.0 JSON-LD format
- **Data Residency:** Enterprise cloud (Azure, preferred region)

---

## 📅 Roadmap

| Phase | Duration | Deliverables | Status |
|-------|----------|--------------|--------|
| Phase 1 - Discovery | 4-6 weeks | PRD, Product Brief, KPIs | ✅ Complete |
| Phase 2 - Design & Architecture | 4 weeks | Architecture doc, UX Design, Wireframes | ✅ Complete |
| **Phase 3 - MVP Development** | **8-12 weeks** | **Working MVP** | **🔄 In Progress** |
| → Sprint 0 | 1 day | Infrastructure Setup | ✅ Complete (2026-01-24, 9.5h/10h, 95%) |
| → Sprint 1 | 1 day | JWT Auth & User Management (Epic 2) | ✅ Complete (2026-01-25, 21h/21h, 100%) |
| → Sprint 2 | TBD | Badge Template Management (Epic 3) | 🔜 Planning |
| → Sprint 3 | TBD | Badge Issuance (Epic 4) | ⏳ Planned |
| → Sprint 4-5 | TBD | Verification & Wallet (Epic 5-6) | ⏳ Planned |
| → Sprint 6-7 | TBD | Analytics & Integrations | ⏳ Planned |
| Phase 4 - Pilot | 4-6 weeks | Pilot with one L&D program | ⏳ Pending |
| Phase 5 - Iteration | 4-8 weeks | Analytics, integrations | ⏳ Pending |
| Phase 6 - Production Rollout | Ongoing | Company-wide launch | ⏳ Pending |

---

## 👥 Key Stakeholders

- **Product Owner:** HR / L&D Leadership
- **Engineering:** Internal IT / Platform Team
- **Key Users:** HR Admins, Learning Program Managers, Employees
- **Integration Partners:** LMS vendor, HRIS team, IT Security

---

## 🚦 Known Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Low adoption | Pilot with popular program, communication campaign |
| Integration complexity | Phased approach, start with webhooks |
| Badge credibility | Align with industry-recognized programs |
| Data privacy concerns | User-controlled visibility, transparent policies |
| Platform lock-in | Open Badges standard ensures portability |

---

## 🛠️ Development Setup (To Be Implemented)

```bash
# Clone repository
git clone https://github.com/YOUR_ORG/g-credit.git
cd g-credit

# Install frontend dependencies
cd gcredit-web
npm install

# Install backend dependencies
cd ../gcredit-api
npm install

# Setup database
npx prisma migrate dev

# Configure environment variables
cp .env.example .env
# Edit .env file to configure Azure service connections

# Start development server
npm run dev
```

---

## 📚 Key Documents

**Planning Documents (Complete):**
- [Project Context](./project-context.md) - Single source of truth
- [Product Brief](./MD_FromCopilot/product-brief.md) - Business requirements
- [PRD](./MD_FromCopilot/PRD.md) - Product Requirements Document (33 FRs, 22 NFRs)
- [Architecture Document](./_bmad-output/planning-artifacts/architecture.md) - Technical architecture (5,406 lines)
- [UX Design Specification](./_bmad-output/planning-artifacts/ux-design-specification.md) - User experience design (3,314 lines)
- [Epics & Stories](./_bmad-output/planning-artifacts/epics.md) - Implementation breakdown (14 epics, 85 stories)
- [Implementation Readiness Report](./_bmad-output/planning-artifacts/implementation-readiness-report-2026-01-22.md) - Readiness assessment (10/10)

**Implementation Documents:**
- [Implementation Artifacts Index](./_bmad-output/implementation-artifacts/INDEX.md) - Complete index of all sprint docs
- [Sprint 0 Backlog](./_bmad-output/implementation-artifacts/sprint-0-backlog.md) - Infrastructure setup (✅ Complete)
- [Sprint 0 Retrospective](./_bmad-output/implementation-artifacts/sprint-0-retrospective.md) - Lessons learned (8 action items)
- [Sprint 1 Backlog](./_bmad-output/implementation-artifacts/sprint-1-backlog.md) - Authentication & user management (✅ Complete)
- [Sprint 1 Retrospective](./_bmad-output/implementation-artifacts/sprint-1-retrospective.md) - Technical review (100% test pass)
- [Architectural Decisions](./_bmad-output/implementation-artifacts/decisions/) - ADR records

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Project Owner:** LegendZhu  
**Development Team:** Internal IT / Platform Team  
**BMAD Framework Version:** 6.0.0-alpha.23  

---

**Last Updated:** 2026-01-25  
**Status:** Sprint 2 Planning - Badge Template Management 🔜  
**Sprint 0:** ✅ Complete (9.5h/10h, 95%) - [Retrospective](./_bmad-output/implementation-artifacts/sprint-0-retrospective.md)  
**Sprint 1:** ✅ Complete (21h/21h, 100%) - [Retrospective](./_bmad-output/implementation-artifacts/sprint-1-retrospective.md)  
**Sprint 2:** See [Implementation Artifacts](./_bmad-output/implementation-artifacts/) for upcoming sprint planning
