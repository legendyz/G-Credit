# Documentation Directory

This directory contains project-specific technical documentation, setup guides, sprint history, and testing resources.

**Last Updated:** 2026-03-03 (Sprint 15 complete — v1.5.0 Released)

---


## 📁 Directory Structure

```
docs/
├── architecture/       # System architecture and design
├── planning/           # Planning artifacts (epics, UX spec, readiness reports)
├── sprints/            # Sprint documentation (Sprint 0-14)
├── decisions/          # Architecture Decision Records (ADRs)
├── development/        # Developer guides (coding standards, testing)
├── setup/              # Environment and service setup guides
├── testing/            # Testing guides and methodologies
├── templates/          # Documentation templates (ADR, sprint, user story)
├── security/           # Security policies and notes
├── lessons-learned/    # Project lessons learned
├── INDEX.md            # This file
├── README.md           # Documentation overview
├── DOCUMENTATION-INVENTORY.md
├── DOCUMENTATION-REORGANIZATION-COMPLETE.md
└── DOCUMENTATION-VALIDATION-REPORT.md
```

---

## 📚 Documentation Categories

### 🏗️ Architecture (`architecture/`)
System design, technical architecture, and visual diagrams.

**Available Documents:**
- **[system-architecture.md](./architecture/system-architecture.md)** - Complete system architecture (5,406 lines, 12 decisions)
- **[architecture-diagrams.md](./architecture/architecture-diagrams.md)** - Visual architecture diagrams

### 📋 Planning (`planning/`)
Project planning documents, epics, user stories, and UX specifications.

**Available Documents:**
- **[epics.md](./planning/epics.md)** - 14 epics, 85 stories, 100% FR coverage (126 KB)
- **[ux-design-specification.md](./planning/ux-design-specification.md)** - 22 screens, complete interaction design (138 KB)
- **[implementation-readiness-report-2026-01-22.md](./planning/implementation-readiness-report-2026-01-22.md)** - Score: 10/10 (52 KB)
- **[ux-design-directions.html](./planning/ux-design-directions.html)** - Visual UX design directions (47 KB)


### 🏃 Sprint History (`sprints/`)
Historical sprint documentation organized by sprint number.

**Sprint Structure:**
- **Sprint 0-15:** Each sprint directory contains backlog, retrospective, summary, and sprint-specific docs
- **Total Files:** 230+ files across 17 sprint directories
- **Index:** [sprints/README.md](./sprints/README.md)

**Latest Sprint Closures:**
- Sprint 15 completed (2026-03-03). UI Overhaul + Dashboard Composite View, v1.5.0. 14/15 stories, 1,835 tests, UAT 36/36 PASS.
- Sprint 14 completed (2026-02-28). Dual-dimension role model refactor, v1.4.0. 9/9 stories, 1,757 tests.
- Sprint 13 completed (2026-02-27). Azure AD SSO + Session Management, v1.3.0. 8/8 stories.
- See [sprints/sprint-15/](./sprints/sprint-15/) for latest details.

---

## 🧹 Documentation Hygiene (2026-02-28)

- ADRs: ADR-002 through ADR-018 documented. ADR-016 (Sprint 15 UI decisions), ADR-018 (Search input focus pattern) added in Sprint 15.
- Outdated/legacy files in `_bmad-output/` reviewed — excalidraw diagrams active, planning/implementation artifacts deprecated.
- Index and project-context.md are up-to-date through Sprint 15 (v1.5.0).

**Next Steps:**
- Sprint 16 planning (Fine-Grained RBAC L1 + Pilot Readiness).


### 🛠️ Setup Guides (`setup/`)
Configuration and installation instructions for various services and integrations.

**Available Guides:**
- **[EMAIL_SETUP_QUICK.md](./setup/EMAIL_SETUP_QUICK.md)** - Quick email configuration for development
- **[OUTLOOK_EMAIL_SETUP.md](./setup/OUTLOOK_EMAIL_SETUP.md)** - Detailed Outlook SMTP configuration
- **[OUTLOOK_VS_GMAIL_COMPARISON.md](./setup/OUTLOOK_VS_GMAIL_COMPARISON.md)** - Email service comparison
- **[infrastructure-inventory.md](./setup/infrastructure-inventory.md)** - Azure resources inventory
- **[earning-badges.md](./setup/earning-badges.md)** - Badge earning guide
- **[badge-revocation-policy.md](./setup/badge-revocation-policy.md)** - Badge revocation policy

**Topics Covered:**
- SMTP configuration for development
- Gmail app password setup
- Outlook OAuth2 investigation and limitations
- Email service selection criteria
- Azure infrastructure setup

### 🧪 Testing Guides (`testing/`)
Testing strategies, scripts, and methodologies.

**Available Guides:**
- **[PASSWORD_RESET_TESTING.md](./testing/PASSWORD_RESET_TESTING.md)** - Password reset flow testing guide

**Topics Covered:**
- Functional testing approaches
- Test script usage
- Manual testing procedures
- Security testing considerations

### 🏛️ Architectural Decisions (`decisions/`)
Architecture Decision Records (ADRs) documenting important technical decisions.

**Available ADRs:**
- **[002-lodash-security-risk-acceptance.md](./decisions/002-lodash-security-risk-acceptance.md)** - Security vulnerability risk acceptance

### 📊 Technical Analysis
In-depth technical investigations and analysis.

**Available Documents:**
- **[npm-warnings-analysis.md](../backend/docs/sprints/sprint-1/npm-warnings-analysis.md)** - NPM dependency warnings analysis (Sprint 1)

---

## 🎯 When to Add Documentation Here

### ✅ Should be in `docs/`
- **Planning:** Epics, user stories, UX specifications
- **Architecture:** System design, technical decisions, diagrams
- **Sprints:** Sprint backlogs, retrospectives, sprint-specific docs
- **Setup:** Service configuration, environment setup, integration guides
- **Testing:** Testing methodologies, test scripts, UAT guides
- **Development:** Coding standards, developer onboarding, technical guides
- **Decisions:** Architecture Decision Records (ADRs)
- **Templates:** Reusable documentation templates
- **Security:** Security policies, vulnerability tracking
- **Lessons Learned:** Project knowledge base

### ❌ Should NOT be in `docs/`
- **Root level docs** → `project-context.md` (root), `README.md` (root)
- **BMAD workflow outputs** → `_bmad-output/` (except when migrating to docs/)
- **Code-level documentation** → Inline comments, docstrings, JSDoc
- **API documentation** → OpenAPI/Swagger specs (generate from code)
- **Test output** → Test reports, coverage reports (generated files)

---

## 📝 Documentation Standards

### File Naming
- Use kebab-case: `my-setup-guide.md`
- Be descriptive: `email-smtp-configuration.md` not `email.md`
- Include version if applicable: `api-v1-migration.md`

### Content Structure
All guides should include:
1. **Title and Purpose** - What this document covers
2. **Prerequisites** - What you need before starting
3. **Step-by-Step Instructions** - Clear, numbered steps
4. **Troubleshooting** - Common issues and solutions
5. **Additional Resources** - Links to external documentation

### Language
- **Primary Language:** English
- **Code Examples:** Well-commented, copy-paste ready
- **Screenshots:** Include when helpful (store in `docs/images/`)

---

## 🔄 Document Lifecycle

### Creation
1. Create document in appropriate subdirectory
2. Follow naming conventions
3. Add entry to this INDEX.md
4. Include "Last Updated" date in document

### Updates
1. Update content
2. Change "Last Updated" date
3. If major changes, update INDEX.md description
4. Consider adding version history section

### Archival
1. Move outdated docs to `docs/archive/`
2. Update INDEX.md with archive note
3. Keep for reference but mark as deprecated

---

## 🔗 Related Documentation

### Main Project Documentation
- **Project Context:** [../../project-context.md](../../project-context.md)
- **Sprint Documentation:** [./sprints/](./sprints/)
- **Planning Documentation:** [./planning/](./planning/)
- **Architecture:** [./architecture/](./architecture/)
- **Lessons Learned:** [./lessons-learned/](./lessons-learned/)
- **Decisions:** [./decisions/](./decisions/)

### Code Documentation
- **Backend README:** [../gcredit-project/backend/README.md](../gcredit-project/backend/README.md)
- **Frontend README:** [../gcredit-project/frontend/README.md](../gcredit-project/frontend/README.md)

---

## 📧 Contributing

When adding new documentation:
1. Place in appropriate subdirectory
2. Follow templates if available
3. Update this INDEX.md
4. Test all code examples
5. Review for clarity and completeness

**Document Maintainers:**
- Setup Guides: Development Team
- Testing Guides: QA & Development Team
- Technical Analysis: Tech Lead / Architect

---

**Document Version:** 1.4  
**Created:** 2026-01-25  
**Next Review:** After Sprint 16 completion
