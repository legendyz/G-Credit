# Documentation Directory

This directory contains project-specific technical documentation, setup guides, and testing resources.

**Last Updated:** 2026-01-25

---

## 📁 Directory Structure

```
docs/
├── setup/              # Environment and service setup guides
├── testing/            # Testing guides and methodologies
├── decisions/          # Project-specific architectural decisions (ADR copies)
└── INDEX.md            # This file
```

---

## 📚 Documentation Categories

### 🛠️ Setup Guides (`setup/`)
Configuration and installation instructions for various services and integrations.

**Available Guides:**
- **[EMAIL_SETUP_QUICK.md](./setup/EMAIL_SETUP_QUICK.md)** - Quick email configuration for development
- **[OUTLOOK_EMAIL_SETUP.md](./setup/OUTLOOK_EMAIL_SETUP.md)** - Detailed Outlook SMTP configuration
- **[OUTLOOK_VS_GMAIL_COMPARISON.md](./setup/OUTLOOK_VS_GMAIL_COMPARISON.md)** - Email service comparison and recommendations

**Topics Covered:**
- SMTP configuration for development
- Gmail app password setup
- Outlook OAuth2 investigation and limitations
- Email service selection criteria

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
Project-specific copies of ADRs for quick reference (canonical versions in `_bmad-output/implementation-artifacts/decisions/`).

**Available ADRs:**
- **[002-lodash-security-risk-acceptance.md](./decisions/002-lodash-security-risk-acceptance.md)** - Security vulnerability risk acceptance

### 📊 Technical Analysis
In-depth technical investigations and analysis.

**Available Documents:**
- **[sprint-1-npm-warnings-analysis.md](./sprint-1-npm-warnings-analysis.md)** - NPM dependency warnings analysis

---

## 🎯 When to Add Documentation Here

### ✅ Should be in `docs/`
- Service setup guides (email, storage, external APIs)
- Testing methodologies and scripts
- Development environment configuration
- Technical troubleshooting guides
- Integration guides
- API client setup instructions

### ❌ Should NOT be in `docs/`
- Sprint planning documents → `_bmad-output/implementation-artifacts/`
- Architecture documents → `_bmad-output/planning-artifacts/`
- Project context → Root level `project-context.md`
- Code-level documentation → Inline comments and docstrings

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
- **Project Context:** [../project-context.md](../project-context.md)
- **Implementation Artifacts:** [../_bmad-output/implementation-artifacts/](../_bmad-output/implementation-artifacts/)
- **Planning Artifacts:** [../_bmad-output/planning-artifacts/](../_bmad-output/planning-artifacts/)

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

**Document Version:** 1.0  
**Created:** 2026-01-25  
**Next Review:** After Sprint 2 completion
