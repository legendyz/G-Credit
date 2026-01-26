# G-Credit Project Documentation

**Version:** 0.2.0 (Sprint 2 Complete)  
**Last Updated:** 2026-01-26  
**Status:** Active Development

---

## 📚 Documentation Index

This directory contains all project-level documentation for the G-Credit Digital Credentialing System.

### Quick Links
- 🏗️ [Architecture](./architecture/) - System design and technical architecture
- 📋 [Planning](./planning/) - Product requirements and planning artifacts
- 🎯 [Decisions](./decisions/) - Architecture Decision Records (ADRs)
- 📖 [Lessons Learned](./lessons-learned/) - Project knowledge base
- 🔒 [Security](./security/) - Security documentation and policies

---

## 📁 Directory Structure

### `/architecture` - System Architecture
Technical architecture documents describing system design, data models, and API structure.

**Documents:**
- [system-architecture.md](./architecture/system-architecture.md) - Overall system architecture

### `/planning` - Planning Artifacts
Product planning, requirements, and design specifications.

**Documents:**
- [epics.md](./planning/epics.md) - Epic definitions and user stories
- [ux-design-specification.md](./planning/ux-design-specification.md) - UX/UI design specifications

### `/decisions` - Architecture Decision Records
Important architectural and technical decisions with context and rationale.

**Documents:**
- [002-lodash-security-risk-acceptance.md](./decisions/002-lodash-security-risk-acceptance.md) - Lodash CVE risk acceptance
- [README.md](./decisions/README.md) - ADR index and guidelines

### `/lessons-learned` - Project Knowledge Base
Captured learnings, best practices, and common pitfalls from all sprints.

**Documents:**
- [lessons-learned.md](./lessons-learned/lessons-learned.md) - Comprehensive lessons from Sprint 0-2 (25 key learnings)

### `/security` - Security Documentation
Security policies, threat models, and security-related documentation.

**Documents:**
- [security-notes.md](./security/security-notes.md) - Security considerations and policies

---

## 📖 Backend-Specific Documentation

For backend API documentation, deployment guides, and sprint reports, see:
- [Backend Documentation](../backend/docs/README.md)
- [API Guide](../backend/docs/API-GUIDE.md)
- [Deployment Guide](../backend/docs/DEPLOYMENT.md)
- [Testing Guide](../backend/docs/TESTING.md)

---

## 🎯 Sprint Documentation

Sprint-specific work is organized chronologically:
- [Sprint 0](../backend/docs/sprints/sprint-0/) - Infrastructure Setup
- [Sprint 1](../backend/docs/sprints/sprint-1/) - Authentication & Authorization
- [Sprint 2](../backend/docs/sprints/sprint-2/) - Badge Template Management

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
