# ⚠️ This Directory Has Been Deprecated

**Date:** 2026-01-28  
**Status:** DEPRECATED - Files Migrated

---

## 📢 Important Notice

This directory (`_bmad-output/implementation-artifacts/`) has been **deprecated** as part of the G-Credit project documentation reorganization completed on 2026-01-27.

All implementation artifacts have been migrated to their proper locations following the new documentation structure.

---

## 📁 New Locations

### Sprint Documentation
All sprint backlogs and retrospectives have been moved to:

**New Location:** `gcredit-project/docs/sprints/sprint-N/`

| Old Location | New Location |
|--------------|--------------|
| `sprint-0-backlog.md` | `gcredit-project/docs/sprints/sprint-0/backlog.md` |
| `sprint-0-retrospective.md` | `gcredit-project/docs/sprints/sprint-0/retrospective.md` |
| `sprint-1-backlog.md` | `gcredit-project/docs/sprints/sprint-1/backlog.md` |
| `sprint-1-retrospective.md` | `gcredit-project/docs/sprints/sprint-1/retrospective.md` |
| `sprint-1-kickoff-readiness.md` | `gcredit-project/docs/sprints/sprint-1/kickoff-readiness.md` |
| `sprint-1-tech-stack-verification.md` | `gcredit-project/docs/sprints/sprint-1/tech-stack-verification.md` |
| `sprint-2-backlog.md` | `gcredit-project/docs/sprints/sprint-2/backlog.md` |
| `sprint-2-kickoff.md` | `gcredit-project/docs/sprints/sprint-2/kickoff.md` |
| `sprint-2-azure-setup-guide.md` | `gcredit-project/docs/sprints/sprint-2/azure-setup-guide.md` |

**Sprint Index:** [gcredit-project/docs/sprints/README.md](../../gcredit-project/docs/sprints/README.md)

### Decision Records
Architecture Decision Records (ADRs) have been moved to:

**New Location:** `gcredit-project/docs/decisions/`

| Old Location | New Location |
|--------------|--------------|
| `decisions/002-lodash-security-risk-acceptance.md` | `gcredit-project/docs/decisions/002-lodash-security-risk-acceptance.md` |

**Decision Records Index:** [gcredit-project/docs/decisions/README.md](../../gcredit-project/docs/decisions/README.md)

---

## 📚 Documentation Structure

The new documentation structure follows a clear organizational pattern:

```
gcredit-project/
├── docs/                           # Project-level documentation
│   ├── sprints/                   # Sprint documentation
│   │   ├── sprint-0/
│   │   ├── sprint-1/
│   │   ├── sprint-2/
│   │   ├── sprint-3/
│   │   ├── sprint-4/
│   │   └── README.md              # Sprint index
│   ├── decisions/                 # Architecture Decision Records
│   ├── architecture/              # System architecture docs
│   ├── planning/                  # Planning artifacts
│   ├── lessons-learned/           # Project knowledge base
│   ├── security/                  # Security documentation
│   └── INDEX.md                   # Documentation index
└── project-context.md             # Single Source of Truth
```

---

## 🎯 Quick Links

### Documentation Entry Points
- **[Documentation Master Index](../../gcredit-project/docs/README.md)** - Start here for all documentation
- **[Sprint Documentation](../../gcredit-project/docs/sprints/README.md)** - All sprint backlogs and retrospectives
- **[Project Context](../../project-context.md)** - Single source of truth for project status
- **[Architecture](../../gcredit-project/docs/architecture/)** - System architecture documentation

### Reference Documents
- **[Documentation Structure Guide](../../gcredit-project/DOCUMENTATION-STRUCTURE.md)** - Complete structure definition
- **[Documentation Reorganization Report](../../gcredit-project/docs/DOCUMENTATION-REORGANIZATION-COMPLETE.md)** - Full migration history

---

## ℹ️ Why Was This Changed?

The documentation reorganization was completed to:

1. **Improve Discoverability** - Logical grouping makes documents easy to find
2. **Establish Clear Ownership** - Separate project-level and code-level docs
3. **Support Scalability** - Structure supports multiple applications
4. **Separate Living vs Historical** - Living documents vs sprint snapshots
5. **Simplify Onboarding** - New team members can navigate easily

For complete details, see the [Documentation Reorganization Report](../../gcredit-project/docs/DOCUMENTATION-REORGANIZATION-COMPLETE.md).

---

## 🚀 Action Required

If you have bookmarks or references to files in this directory:

1. ✅ Update your bookmarks to the new locations listed above
2. ✅ Update any scripts or tools that reference these paths
3. ✅ Use the [Sprint Index](../../gcredit-project/docs/sprints/README.md) to find all sprint documentation

---

## 📧 Questions?

If you need help finding a specific document, please refer to:
- [Documentation Master Index](../../gcredit-project/docs/README.md)
- [Project Context](../../project-context.md)

---

**Last Updated:** 2026-01-28  
**Migration Completed:** 2026-01-27  
**Maintained By:** Development Team
