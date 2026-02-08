# G-Credit Project Documentation

**Version:** 0.9.0  
**Last Updated:** 2026-02-08  
**Status:** Sprint 9 Complete - Bulk Badge Issuance + TD Cleanup

> 📌 **For project status, Sprint progress, and technical overview, see the [Main Project README](../../README.md)**

---

## 📚 Documentation Navigation Hub

This is the **internal documentation navigation center** for the G-Credit project. Use this to find specific documentation quickly.

### 🚀 Quick Start by Role
| Role | Start Here |
|------|------------|
| **New Developer** | [Backend README](../backend/README.md) → [API Guide](../backend/docs/API-GUIDE.md) |
| **DevOps/SRE** | [Deployment Guide](../backend/docs/DEPLOYMENT.md) → [System Architecture](./architecture/system-architecture.md) |
| **QA/Testing** | [Testing Guide](../backend/docs/TESTING.md) → [E2E Tests](../backend/test/) |
| **New Team Member** | [Main README](../../README.md) → [Lessons Learned](./lessons-learned/lessons-learned.md) |

### 📑 Quick Navigation
- 🏗️ [Architecture](#architecture) - System design and technical architecture
- 📋 [Planning](#planning) - Product requirements and specifications
- 🏃 [Sprints](#sprint-documentation) - Sprint backlogs, summaries, and retrospectives
- 🔒 [Security](#security) - Security documentation and policies
- ⚙️ [Setup](#setup--configuration) - Environment and service setup guides
- 🧪 [Testing](#testing) - Testing strategies and guides
- 🎯 [Decisions](#decisions) - Architecture Decision Records (ADRs)
- 📖 [Lessons Learned](#lessons-learned) - Project knowledge base
- 👨‍💻 [Development](#development) - Developer guides and standards

---

## 📁 Documentation Sections

### 🏗️ Architecture
System design, data models, and technical architecture documentation.

**📄 Documents:**
- [system-architecture.md](./architecture/system-architecture.md) - Complete system architecture overview
- **Coming Soon:** data-model.md, api-design.md, infrastructure.md

**Purpose:** Understand how the system is designed and why certain technical decisions were made.

---

### 📋 Planning
Product requirements, epics, user stories, and design specifications.

**📄 Documents:**
- [epics.md](./planning/epics.md) - Epic definitions with user stories
- [ux-design-specification.md](./planning/ux-design-specification.md) - Complete UX/UI specifications
- **Legacy:** See `_bmad-output/planning-artifacts/` for historical planning docs

**Purpose:** Product vision, requirements, and design specifications that guide development.

---

### 🏃 Sprint Documentation
Sprint-by-sprint development history, backlogs, summaries, and retrospectives.

**📁 Sprint Structure:**
```
sprints/
├── sprint-0/ - Infrastructure & Setup (v0.0.1)
├── sprint-1/ - Authentication & Authorization (v0.1.0)
├── sprint-2/ - Badge Template Management (v0.2.0)
├── sprint-3/ - Badge Issuance System (v0.3.0)
├── sprint-4/ - Employee Badge Wallet (v0.4.0)
├── sprint-5/ - Badge Verification & Open Badges 2.0 (v0.5.0)
├── sprint-6/ - Social Sharing & Integrations (v0.6.0)
├── sprint-7/ - Badge Revocation & Lifecycle (v0.7.0)
└── sprint-8/ - Production-Ready MVP (v0.8.0)
    ├── summary.md - Sprint 8 completion report
    └── retrospective.md - Sprint 8 retrospective
└── sprint-9/ - Bulk Badge Issuance + TD Cleanup (v0.9.0) ✅ Current
    ├── backlog.md - Sprint 9 backlog
    └── sprint-status.yaml - Sprint 9 status tracking
```

**Current Status:** Sprint 9 Complete - See [Main README](../../README.md) for detailed progress

**Legacy Location:** Sprint 0-2 artifacts in `_bmad-output/implementation-artifacts/`

---

### 🔒 Security
Security policies, threat models, compliance, and security-related documentation.

**📄 Documents:**
- [security-notes.md](./security/security-notes.md) - Security considerations and best practices
- **Coming Soon:** threat-model.md, compliance.md, security-audit-checklist.md

**Purpose:** Ensure secure development and deployment practices.

---

### ⚙️ Setup & Configuration
Environment setup, service configuration, and deployment prerequisites.

**📄 Documents:**
- [EMAIL_SETUP_QUICK.md](./setup/EMAIL_SETUP_QUICK.md) - Quick email service setup
- [OUTLOOK_EMAIL_SETUP.md](./setup/OUTLOOK_EMAIL_SETUP.md) - Detailed Outlook/Azure setup
- [OUTLOOK_VS_GMAIL_COMPARISON.md](./setup/OUTLOOK_VS_GMAIL_COMPARISON.md) - Email provider comparison
- **Coming Soon:** DATABASE_SETUP.md, AZURE_INFRASTRUCTURE_SETUP.md

**Purpose:** Get your development or production environment configured correctly.

---

### 🧪 Testing
Testing strategies, test documentation, and quality assurance guides.

**📄 Documents:**
- [TESTING.md](../backend/docs/TESTING.md) - Complete testing guide
- [PASSWORD_RESET_TESTING.md](./testing/PASSWORD_RESET_TESTING.md) - Password reset flow testing
- **Backend Tests:** See `../backend/test/` for E2E test code
- **Frontend Tests:** See `../frontend/src/` for component tests

**Test Coverage (Sprint 9):**
- 1087 tests total, 100% passing
- 532 backend tests (unit + integration)
- 397 frontend tests
- 158 E2E tests
- WCAG 2.1 AA accessibility compliance

**Purpose:** Understand testing strategy and how to validate system functionality.

---

### 🎯 Decisions
Architecture Decision Records (ADRs) documenting important technical choices.

**📄 Documents:**
- [002-lodash-security-risk-acceptance.md](./decisions/002-lodash-security-risk-acceptance.md) - Lodash CVE risk acceptance
- **Note:** Decision records should be created here, not scattered in other locations

**ADR Format:**
- Sequential numbering: 001-xxx.md, 002-xxx.md
- Include: Context, Decision, Consequences, Status

**Purpose:** Track why we made important technical decisions and their trade-offs.

---

### 📖 Lessons Learned
Project knowledge base capturing what we've learned from experience.

**📄 Documents:**
- [lessons-learned.md](./lessons-learned/lessons-learned.md) - 33 lessons from Sprint 0-8
- **Categories:** Code Quality, Testing, Email, Prisma, TypeScript, Git, Documentation, Accessibility, Security

**Recent Lessons (Sprint 9):**
- CSV injection prevention in bulk upload flows
- UTF-8 BOM handling for Windows Excel compatibility
- Route-based code splitting for bundle optimization
- Email system unification (nodemailer → Graph API)

**Purpose:** Learn from past experiences and build institutional knowledge.

---

### 👨‍💻 Development
Developer guides, coding standards, and development workflows.

**📄 Documents:**
- [Backend README](../backend/README.md) - Quick start for backend development
- [Backend Code Structure](../backend/src/README.md) - Code organization guide
- **Coming Soon:** coding-standards.md, git-workflow.md, troubleshooting.md

**Quick Links:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

**Purpose:** Help developers contribute effectively with consistent coding practices.

---

## 📖 Backend-Specific Documentation

Backend application has its own detailed documentation:

**Location:** `../backend/docs/`

**Key Documents:**
- [Backend README](../backend/README.md) - Getting started with backend
- [API-GUIDE.md](../backend/docs/API-GUIDE.md) - Complete API reference (21KB)
- [DEPLOYMENT.md](../backend/docs/DEPLOYMENT.md) - Production deployment guide (26KB)
- [TESTING.md](../backend/docs/TESTING.md) - Comprehensive testing guide (26KB)
- [CHANGELOG](../backend/CHANGELOG.md) - Version history (v0.8.0)

**Test Documentation:**
- E2E Tests: `../backend/test/` - 132 E2E tests
- Unit Tests: `../backend/src/**/*.spec.ts` - 284 unit tests

---

## 🗺️ Documentation Map

**Where to find specific information:**

| Need | Location |
|------|----------|
| System overview | [Architecture](./architecture/system-architecture.md) |
| API endpoints | Backend Swagger UI: `http://localhost:3000/api-docs` |
| Sprint history | [Sprints](./sprints/) |
| Setup guides | [Setup](./setup/) |
| Security policies | [Security](./security/security-notes.md) |
| Technical decisions | [Decisions](./decisions/) |
| Lessons learned | [Lessons](./lessons-learned/lessons-learned.md) |
| Code structure | [Backend README](../backend/README.md) |
| Testing strategy | [Testing](./testing/) |
| Environment variables | [Backend .env.example](../backend/.env.example) |

---

## 📝 Document Conventions

### Naming Standards
- Use **kebab-case** for filenames: `system-architecture.md`
- Include context in names: `sprint-2-retrospective.md`
- Avoid generic names: ❌ `doc.md`, `notes.md`

### Document Headers
All documents should include:
```markdown
# Document Title
**Version:** X.Y.Z
**Last Updated:** YYYY-MM-DD
**Status:** Draft | Active | Deprecated
```

### Cross-Referencing
- Use relative links: `[API Guide](../backend/docs/API-GUIDE.md)`
- Update links when moving documents
- Create redirect notes when deprecating documents

---

## 🔄 Maintenance

### Update Frequency
- **Architecture docs** - As needed when architecture changes
- **Planning docs** - Updated during sprint planning
- **Lessons learned** - After each sprint retrospective
- **Security docs** - As needed when security changes

### Review Schedule
- **Quarterly** - Review all documentation for accuracy
- **Post-Sprint** - Update sprint-specific documentation
- **Pre-Release** - Verify all documentation is current

---

## 📊 Documentation Metrics

### Coverage (Sprint 9)
- ✅ Architecture - 100% (system architecture documented)
- ✅ Planning - 100% (14 epics, 85 user stories)
- ✅ Lessons Learned - 100% (33+ lessons from 9 sprints)
- ✅ Backend API - 100% (complete API guide incl. Bulk Issuance)
- ✅ Deployment - 100% (Azure deployment guide)
- ✅ Testing - 100% (1087 tests, comprehensive guide)
- ✅ Security - 100% (security hardening complete)
- ✅ Accessibility - 100% (WCAG 2.1 AA compliant)

### Quality Indicators
- 📄 Total Documents: 60+
- 📏 Total Content: ~500KB
- ✅ All 9 sprints documented
- ✅ All major decisions recorded
- ✅ Complete API coverage (incl. Bulk Issuance)
- ✅ Production-Ready MVP

---

## 🚀 Getting Started

### For New Team Members
1. Read [Project Overview](../README.md) (in project root)
2. Review [System Architecture](./architecture/system-architecture.md)
3. Check [Lessons Learned](./lessons-learned/lessons-learned.md)
4. Read [Backend README](../backend/README.md)
5. Review sprint documentation chronologically

### For Developers
1. [Backend Setup](../backend/README.md)
2. [API Guide](../backend/docs/API-GUIDE.md)
3. [Testing Guide](../backend/docs/TESTING.md)
4. Latest sprint documentation

### For DevOps/SRE
1. [System Architecture](./architecture/system-architecture.md)
2. [Deployment Guide](../backend/docs/DEPLOYMENT.md)
3. [Security Notes](./security/security-notes.md)

---

## 📞 Document Ownership

- **Architecture** - Technical Lead
- **Planning** - Product Owner
- **Decisions** - Engineering Team
- **Lessons Learned** - Scrum Master / Team
- **Security** - Security Champion

---

**Last Review:** 2026-02-08  
**Next Review:** End of Sprint 10  
**Maintained By:** Development Team
