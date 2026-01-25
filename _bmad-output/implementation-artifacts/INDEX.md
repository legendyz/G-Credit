# Implementation Artifacts Index

This directory contains all Sprint planning, retrospectives, and architectural decision records (ADRs) for the G-Credit project.

**Last Updated:** 2026-01-25

---

## 📋 Sprint Documentation

### Sprint 0: Infrastructure Setup
- **Backlog:** [sprint-0-backlog.md](./sprint-0-backlog.md)
- **Retrospective:** [sprint-0-retrospective.md](./sprint-0-retrospective.md)
- **Duration:** 2026-01-23 → 2026-01-24 (2 days)
- **Status:** ✅ Complete (100%, 9.5h/10h)
- **Deliverables:**
  - Frontend initialization (React 19.2.3 + Vite 7.3.1 + Tailwind CSS 4.1.18)
  - Backend initialization (NestJS 11.1.12 + Prisma 6.19.2)
  - Azure PostgreSQL Flexible Server (B1ms)
  - Azure Blob Storage (2 containers: badges, evidence)
  - Comprehensive README documentation

### Sprint 1: Authentication & User Management
- **Backlog:** [sprint-1-backlog.md](./sprint-1-backlog.md)
- **Retrospective:** [sprint-1-retrospective.md](./sprint-1-retrospective.md)
- **Kickoff Readiness:** [sprint-1-kickoff-readiness.md](./sprint-1-kickoff-readiness.md)
- **Tech Stack Verification:** [sprint-1-tech-stack-verification.md](./sprint-1-tech-stack-verification.md)
- **Duration:** 2026-01-25 (1 day high-intensity development)
- **Status:** ✅ Complete (100%, 21h/21h - perfect estimation!)
- **Epic:** Epic 2 - Basic JWT Authentication & User Management
- **Deliverables:**
  - **7 Stories Completed:**
    - Story 2.1: Enhanced User data model
    - Story 2.2: User registration with validation
    - Story 2.3: JWT dual-token authentication
    - Story 2.4: RBAC with 4 roles (ADMIN, ISSUER, MANAGER, EMPLOYEE)
    - Story 2.5: Password reset via email
    - Story 2.6: User profile management
    - Story 2.7: Session management and logout
  - **14 API Endpoints:** 6 public + 8 protected
  - **3 Database Models:** User, PasswordResetToken, RefreshToken
  - **40 Tests:** 100% pass rate
  - **Security Features:** JWT, bcrypt, RBAC, token revocation
- **Deferred:**
  - Story 2.8: Azure AD SSO (deferred to Sprint 8+)
  - FR-001: OAuth2 email integration (deferred to enterprise deployment)

---

## 🏛️ Architectural Decision Records (ADRs)

### ADR-002: lodash Security Risk Acceptance
- **File:** [decisions/002-lodash-security-risk-acceptance.md](./decisions/002-lodash-security-risk-acceptance.md)
- **Date:** 2026-01-25
- **Status:** Accepted
- **Context:** @nestjs/config dependency contains lodash with prototype pollution vulnerability (CVSS 6.5)
- **Decision:** Accept risk for MVP development (Sprint 1-7), re-evaluate before production deployment
- **Consequences:**
  - ✅ Continue development without breaking dependency changes
  - ✅ Low risk in isolated dev environment
  - ⚠️ Must address before Sprint 8+ production deployment

---

## 📚 Related Documentation

### Project Root Documentation
- **Project Context:** [../project-context.md](../project-context.md) - Single source of truth
- **Root README:** [../../README.md](../../README.md) - Project overview

### Planning Artifacts
- **Architecture:** [../planning-artifacts/architecture.md](../planning-artifacts/architecture.md) (5,406 lines)
- **UX Design:** [../planning-artifacts/ux-design-specification.md](../planning-artifacts/ux-design-specification.md) (3,314 lines)
- **Epics & Stories:** [../planning-artifacts/epics.md](../planning-artifacts/epics.md) (14 epics, 85 stories)
- **Implementation Readiness:** [../planning-artifacts/implementation-readiness-report-2026-01-22.md](../planning-artifacts/implementation-readiness-report-2026-01-22.md) (Score: 10/10)

### Technical Documentation (Project-Specific)
- **Backend Setup:** [../../gcredit-project/backend/README.md](../../gcredit-project/backend/README.md)
- **Email Setup Guides:** [../../gcredit-project/docs/setup/](../../gcredit-project/docs/setup/)
- **Testing Guides:** [../../gcredit-project/docs/testing/](../../gcredit-project/docs/testing/)
- **NPM Warnings Analysis:** [../../gcredit-project/docs/sprint-1-npm-warnings-analysis.md](../../gcredit-project/docs/sprint-1-npm-warnings-analysis.md)

---

## 🎯 Sprint Progress Tracking

| Sprint | Epic | Stories | Estimated | Actual | Pass Rate | Status |
|--------|------|---------|-----------|--------|-----------|--------|
| Sprint 0 | Epic 1 | 5 | 10h | 9.5h | - | ✅ Complete |
| Sprint 1 | Epic 2 | 7 | 21h | 21h | 100% (40/40) | ✅ Complete |
| Sprint 2 | Epic 3 | TBD | TBD | - | - | 🔜 Planning |

**Total Delivered:** 2 Sprints, 2 Epics, 12 Stories, 30.5 hours, 100% quality

---

## 📝 Document Maintenance Guidelines

### When to Update This Index
- After each Sprint completion
- When creating new ADRs
- When restructuring documentation
- At major project milestones

### File Naming Conventions
- Sprint Backlogs: `sprint-{N}-backlog.md`
- Sprint Retrospectives: `sprint-{N}-retrospective.md`
- ADRs: `decisions/{NNN}-{short-title}.md`
- Supporting Docs: `sprint-{N}-{purpose}.md`

### Document Ownership
- **PM:** Sprint backlogs, business retrospectives
- **Dev Team:** Technical retrospectives, ADRs, implementation docs
- **Architect:** Architecture decisions, technical design docs
- **All:** Update index after document creation

---

**Document Version:** 1.0  
**Created:** 2026-01-25  
**Next Review:** After Sprint 2 completion
