# G-Credit Project Documentation

**Version:** 0.3.0 (Sprint 3 Complete - Badge Issuance)  
**Last Updated:** 2026-01-27  
**Status:** Active Development

---

## 📚 Documentation Hub - Single Source of Truth

This is the **primary documentation location** for the G-Credit Digital Credentialing System. All project documentation lives here or is linked from here.

### 🚀 Quick Start
- **New Developer?** Start with [Development Getting Started](#development) → [Backend README](../backend/README.md)
- **Looking for APIs?** See [API Documentation](#api-documentation) → [Sprint 3 Badge Issuance](./sprints/sprint-3/)
- **Sprint Planning?** Check [Sprint Documentation](#sprint-documentation)
- **Architecture Questions?** Review [System Architecture](./architecture/system-architecture.md)

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
├── sprint-0/ - Infrastructure & Setup
├── sprint-1/ - Authentication & Authorization  
├── sprint-2/ - Badge Template Management
└── sprint-3/ - Badge Issuance System ⭐ NEW
    ├── summary.md - Complete Sprint 3 report (26 E2E tests, 6 stories)
    └── uat-testing-guide.md - User acceptance testing guide
```

**Current Sprint:** Sprint 3 (Badge Issuance) - ✅ Complete!
- 6/6 stories delivered (100%)
- 26 E2E tests passing
- UAT successfully completed
- See [Sprint 3 Summary](./sprints/sprint-3/summary.md)

**Legacy Location:** Sprint 0-2 artifacts in `_bmad-output/implementation-artifacts/` (to be migrated)

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
- [PASSWORD_RESET_TESTING.md](./testing/PASSWORD_RESET_TESTING.md) - Password reset flow testing
- [UAT Testing Guide](./sprints/sprint-3/uat-testing-guide.md) - Sprint 3 user acceptance testing
- **Backend Tests:** See `../backend/test/` for test code and documentation

**Test Coverage (Sprint 3):**
- 26 E2E tests (badge issuance)
- 20 Unit tests
- 7 UAT scenarios
- All passing ✅

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
- [lessons-learned.md](./lessons-learned/lessons-learned.md) - 25+ lessons from Sprint 0-3
- **Categories:** Code Quality, Testing, Email, Prisma, TypeScript, Git, Documentation

**Key Lessons (Sprint 3):**
- Lesson 26: UAT reveals usability issues automated tests miss
- Lesson 27: PowerShell multipart form-data requires manual encoding
- Lesson 28: API endpoint paths must be consistent across controllers

**Purpose:** Learn from past mistakes and build institutional knowledge.

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
- [Sprint 3 Summary](../backend/docs/SPRINT-3-SUMMARY.md) - Complete Sprint 3 report ⭐ NEW
- [Backend README](../backend/README.md) - Getting started with backend
- [CHANGELOG](../backend/CHANGELOG.md) - Version history
- **Coming Soon:** API-GUIDE.md, DEPLOYMENT.md, TESTING.md

**Test Documentation:**
- [UAT Testing Guide](../backend/test/UAT-TESTING-GUIDE.md) - Manual testing scenarios
- [E2E Test Suite](../backend/test/badge-issuance.e2e-spec.ts) - Automated E2E tests
- [Manual UAT Script](../backend/test/manual-uat-test.ps1) - PowerShell test automation

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

### Coverage (Sprint 2)
- ✅ Architecture - 100% (system architecture documented)
- ✅ Planning - 100% (epics and UX specs complete)
- ✅ Lessons Learned - 100% (25 lessons from 3 sprints)
- ✅ Backend API - 100% (complete API guide)
- ✅ Deployment - 100% (Azure deployment guide)
- ✅ Testing - 100% (comprehensive testing guide)

### Quality Indicators
- 📄 Total Documents: 30+
- 📏 Total Content: ~200KB
- ✅ All sprints documented
- ✅ All major decisions recorded
- ✅ Complete API coverage
- ✅ Production deployment ready

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

**Last Review:** 2026-01-26  
**Next Review:** End of Sprint 3  
**Maintained By:** Development Team
