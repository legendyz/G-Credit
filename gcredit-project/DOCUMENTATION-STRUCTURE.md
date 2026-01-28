# G-Credit Documentation Structure

**Version:** 1.1  
**Last Updated:** 2026-01-28  
**Status:** ✅ Active - Reflects current project structure  
**Purpose:** Define standard documentation organization for the G-Credit project

---

## 📁 Directory Structure

```
gcredit-project/
├── docs/                              # Project-level documentation (✅ PRIMARY LOCATION)
│   ├── INDEX.md                       # Complete documentation index and navigation
│   ├── README.md                      # Documentation overview
│   ├── architecture/                  # Architecture documents
│   │   ├── system-architecture.md     # Complete system architecture (5,406 lines)
│   │   └── architecture-diagrams.md   # Visual architecture diagrams
│   ├── planning/                      # Planning artifacts
│   │   ├── epics.md                   # 14 epics, 85 stories (126 KB)
│   │   ├── ux-design-specification.md # 22 screens (138 KB)
│   │   ├── implementation-readiness-report-2026-01-22.md
│   │   └── ux-design-directions.html
│   ├── sprints/                       # Sprint documentation (Sprint 0-4)
│   │   ├── README.md                  # Sprint index
│   │   ├── sprint-0/                  # Infrastructure setup (3 files)
│   │   ├── sprint-1/                  # JWT auth & user management (5 files)
│   │   ├── sprint-2/                  # Badge template management (10 files)
│   │   ├── sprint-3/                  # Badge issuance (5 files)
│   │   └── sprint-4/                  # Employee badge wallet (7 files)
│   ├── decisions/                     # Architecture Decision Records (ADRs)
│   │   ├── README.md
│   │   ├── 002-lodash-security-risk-acceptance.md
│   │   ├── 003-badge-assertion-format.md
│   │   └── 004-email-service-selection.md
│   ├── development/                   # Developer guides
│   │   ├── README.md
│   │   ├── coding-standards.md
│   │   ├── testing-guide.md
│   │   ├── badge-wallet-guide.md
│   │   └── backend-code-structure-guide.md
│   ├── lessons-learned/               # Project knowledge base
│   │   └── lessons-learned.md
│   ├── security/                      # Security documentation
│   │   └── security-notes.md
│   ├── setup/                         # Setup and configuration guides
│   │   ├── EMAIL_SETUP_QUICK.md
│   │   ├── OUTLOOK_EMAIL_SETUP.md
│   │   ├── OUTLOOK_VS_GMAIL_COMPARISON.md
│   │   ├── infrastructure-inventory.md
│   │   ├── earning-badges.md
│   │   └── badge-revocation-policy.md
│   ├── testing/                       # Testing guides
│   │   └── PASSWORD_RESET_TESTING.md
│   ├── templates/                     # Document templates
│   │   ├── adr-template.md
│   │   ├── sprint-backlog-template.md
│   │   ├── sprint-completion-checklist-template.md
│   │   ├── sprint-planning-checklist.md
│   │   ├── sprint-version-manifest-template.md
│   │   └── user-story-template.md
│   └── archive/                       # Historical documentation
│       ├── README.md
│       ├── DOCUMENTATION-INVENTORY.md
│       ├── DOCUMENTATION-REORGANIZATION-COMPLETE.md
│       └── DOCUMENTATION-VALIDATION-REPORT.md
│
├── backend/                           # Backend application (NestJS)
│   ├── README.md                      # Backend quick start guide
│   ├── CHANGELOG.md                   # Version history
│   ├── docs/                          # Backend-specific documentation
│   │   └── (Note: Sprint docs moved to gcredit-project/docs/sprints/)
│   ├── src/                          # Source code
│   ├── prisma/                       # Database schema and migrations
│   └── test/                         # Tests
│
├── frontend/                          # Frontend application (future)
│   ├── README.md
│   ├── docs/
│   └── src/
│
└── infrastructure/                    # Infrastructure as Code (future)
    ├── README.md
    ├── terraform/
    └── docs/
```

---

## 📋 Documentation Categories

### 0. **Workspace Root Documentation** (`CODE/`)
**Purpose:** GitHub repository showcase and external visibility

**Key File:**
- `CODE/README.md` - Repository homepage (GitHub first impression)

**Target Audience:** 
- GitHub visitors and potential contributors
- External developers evaluating the project
- Open source community members
- Recruiters and technical evaluators

**Content Focus:**
- Project highlights and achievements
- Technology stack showcase
- Sprint milestones and progress visualization
- Feature status overview (✅ Complete / 🔜 Upcoming)
- Quick start for external contributors
- Professional presentation with badges and metrics

**Update Frequency:** Every Sprint completion (required in sprint-completion-checklist)

**Relationship to project-context.md:**
- `CODE/README.md` = External presentation (GitHub showcase)
- `project-context.md` = Internal SSOT (BMAD agents + team)
- Both should reflect same Sprint status but serve different audiences

---

### 1. **Project-Level Documentation** (`/docs`)
**Purpose:** Cross-cutting concerns, planning, architecture decisions

**Contents:**
- Architecture documents
- Product requirements and epics
- UX specifications
- Architecture Decision Records (ADRs)
- Lessons learned and best practices
- Security documentation
- Document templates

**Audience:** All team members, stakeholders, architects

---

### 2. **Sprint Documentation** (`/docs/sprints`)
**Purpose:** Historical record of sprint work, organized by sprint number

**Contents:**
- Sprint backlogs and retrospectives (Sprint 0-4)
- Sprint-specific technical documents
- Kickoff readiness checklists
- Completion checklists
- UX design documents

**Audience:** All team members, stakeholders

**Organization:**
- Each sprint has its own directory: `sprint-0/`, `sprint-1/`, etc.
- Common files: `backlog.md`, `retrospective.md`
- Sprint-specific docs as needed

---

### 3. **Development Guides** (`/docs/development`)
**Purpose:** Developer onboarding and coding standards

**Contents:**
- Coding standards and best practices
- Testing guide
- Backend code structure guide
- Feature-specific guides (e.g., badge wallet)

**Audience:** Developers (new and existing)

---

### 4. **Setup & Configuration** (`/docs/setup`)
**Purpose:** Environment setup and service configuration

**Contents:**
- Email setup guides
- Azure infrastructure inventory
- Service configuration instructions

**Audience:** Developers, DevOps

---

### 5. **Historical Sprint Documentation** (`/docs/sprints/sprint-X/`)
**Purpose:** Snapshot of each sprint's work

**Standard Files:**
- `backlog.md` - Sprint backlog with user stories
- `retrospective.md` - Sprint retrospective
- `final-report.md` - Sprint summary (optional for major sprints)
- Additional sprint-specific documents (setup guides, decisions, etc.)

**Naming Convention:** Use descriptive names with context
- ✅ `azure-setup-guide.md`
- ✅ `tech-stack-verification.md`
- ❌ `doc1.md`, `notes.md`

---

### 4. **Decision Records** (`/docs/decisions/`)
**Purpose:** Track important architectural and technical decisions

**Format:** ADR (Architecture Decision Record)
- Numbered sequentially (001, 002, 003...)
- Use template from `/docs/templates/adr-template.md`
- Include context, decision, consequences

---

### 5. **Lessons Learned** (`/docs/lessons-learned/`)
**Purpose:** Capture and share project knowledge

**Contents:**
- Main `lessons-learned.md` - Comprehensive lessons from all sprints
- `best-practices.md` - Distilled best practices
- `common-pitfalls.md` - Things to avoid
- Sprint-specific lessons (if warranted)

**Update Frequency:** After each sprint retrospective

---

## 🎯 Documentation Principles

### 1. **Single Source of Truth (with Exception for Different Audiences)**
- Each piece of **internal information** should exist in ONE canonical location
- **Exception:** `CODE/README.md` and `project-context.md` both track Sprint status but serve different audiences:
  - `project-context.md` - Internal SSOT for BMAD agents and team (technical details)
  - `CODE/README.md` - External showcase for GitHub visitors (presentation/marketing)
- Link to authoritative sources instead of duplicating
- Update links when moving documents
- **Both README and project-context must be updated every Sprint** (enforced in sprint-completion-checklist)

### 2. **Clear Ownership**
- Workspace root: External presentation → `CODE/README.md`
- Project root: Internal SSOT → `project-context.md`
- Project-level: Architecture, planning → `/docs`
- Backend-specific: API, deployment, testing → `/backend/docs`
- Sprint work: Historical sprints → `/backend/docs/sprints/sprint-X/`

### 3. **Living vs Historical**
- **Living documents** (frequently updated): Keep at root level
  - README.md, API-GUIDE.md, DEPLOYMENT.md, TESTING.md
- **Historical documents** (snapshot in time): Organize by sprint
  - sprint-X-backlog.md, sprint-X-retrospective.md

### 4. **Descriptive Naming**
- Use kebab-case: `sprint-2-retrospective.md`
- Include context: `enhancement-1-testing-guide.md`
- Avoid generic names: `doc.md`, `notes.md`, `temp.md`

### 5. **README Indexes**
- Each major directory should have a README.md index
- List all documents with brief descriptions
- Indicate document status (draft, final, deprecated)

---

## ✅ Migration Completed (2026-01-28)

### Old Structure (Before 2026-01-26) - ⚠️ DEPRECATED
```
_bmad-output/
├── implementation-artifacts/
│   ├── sprint-0-backlog.md
│   ├── sprint-0-retrospective.md
│   ├── sprint-1-backlog.md
│   ├── sprint-1-retrospective.md
│   ├── sprint-2-backlog.md
│   └── decisions/
└── planning-artifacts/
    ├── architecture.md
    ├── epics.md
    └── ux-design-specification.md

backend/docs/
├── sprint-2-retrospective.md
├── sprint-2-final-report.md
├── enhancement-1-testing-guide.md
└── (other sprint-2 docs)

docs/
├── lessons-learned.md
├── security-notes.md
└── templates/
```

### Current Structure (As of 2026-01-28) - ✅ COMPLETE
```
docs/                                   # Project-level (PRIMARY LOCATION)
├── architecture/
│   ├── system-architecture.md         # ✅ From: _bmad-output/planning-artifacts/architecture.md
│   └── architecture-diagrams.md       # ✅ Created during Phase 3
├── planning/
│   ├── epics.md                       # ✅ From: _bmad-output/planning-artifacts/epics.md
│   ├── ux-design-specification.md     # ✅ From: _bmad-output/planning-artifacts/
│   ├── implementation-readiness-report-2026-01-22.md  # ✅ Migrated
│   └── ux-design-directions.html      # ✅ Migrated
├── sprints/                           # ✅ MOVED from backend/docs/sprints/
│   ├── sprint-0/ (3 files)            # ✅ From: _bmad-output/implementation-artifacts/
│   ├── sprint-1/ (5 files)            # ✅ From: _bmad-output/implementation-artifacts/
│   ├── sprint-2/ (10 files)           # ✅ From: _bmad-output/implementation-artifacts/ + backend/docs/
│   ├── sprint-3/ (5 files)            # ✅ Complete
│   └── sprint-4/ (7 files)            # ✅ Complete
├── decisions/ (4 files)               # ✅ From: _bmad-output/implementation-artifacts/decisions/
├── development/ (5 files)             # ✅ Created during Phase 3
├── templates/ (6 files)               # ✅ Created during Phase 3
├── setup/ (6 files)                   # ✅ Consolidated
├── testing/ (1 file)                  # ✅ Organized
├── lessons-learned/                   # ✅ Consolidated
├── security/                          # ✅ Consolidated
└── archive/                           # ✅ Historical documentation

_bmad-output/
├── excalidraw-diagrams/               # ✅ ACTIVE - Wireframes
├── planning-artifacts/                # ⚠️ DEPRECATED (README.md with migration notice)
└── implementation-artifacts/          # ⚠️ DEPRECATED (README.md with migration notice)
```

**Migration Status:** ✅ **100% COMPLETE** (2026-01-28)
- All planning docs migrated to `docs/planning/`
- All sprint docs migrated to `docs/sprints/`
- All architecture docs migrated to `docs/architecture/`
- Deprecation notices in place with clear migration mapping
- 14 path references updated across 6 files
- 28/28 BMAD agents configured to use new structure

---

## ✅ Documentation Checklist

### When Creating New Documents
- [ ] Choose correct location based on scope (project vs backend vs sprint)
- [ ] Use descriptive, kebab-case filename
- [ ] Add document metadata (version, date, purpose)
- [ ] Update parent directory README.md
- [ ] Cross-link with related documents

### When Moving Documents
- [ ] Update all references and links
- [ ] Create redirect or note in old location (if applicable)
- [ ] Update parent directory READMEs
- [ ] Commit with clear message explaining the move

### At End of Each Sprint
- [ ] Create sprint directory: `/docs/sprints/sprint-X/`
- [ ] Move sprint documents (backlog, retrospective) to sprint directory
- [ ] Update `project-context.md` with sprint completion status (CRITICAL)
- [ ] Update lessons-learned.md with new insights
- [ ] Update `docs/sprints/README.md` sprint index
- [ ] Archive any deprecated documents
- [ ] Verify completion using `docs/templates/sprint-completion-checklist-template.md`

---

## 📊 Benefits of This Structure

1. **Clarity** - Clear separation of concerns (project vs backend, living vs historical)
2. **Discoverability** - Logical grouping makes documents easy to find
3. **Scalability** - Structure supports multiple applications (frontend, mobile)
4. **Maintenance** - Living documents separated from historical snapshots
5. **Onboarding** - New team members can navigate documentation easily
6. **History** - Sprint work preserved chronologically

---

## 🚀 Next Steps

1. **Immediate** (2026-01-26)
   - Create directory structure
   - Move existing documents
   - Update all cross-references
   - Create README indexes

2. **Short-term** (Next Sprint)
   - Add ADR template
   - Create sprint retrospective template
   - Document security practices

3. **Long-term** (Ongoing)
   - Maintain structure discipline
   - Update lessons learned after each sprint
   - Review and refactor documentation quarterly

---

**Document Owner:** Development Team  
**Review Frequency:** Quarterly or when structure pain points emerge  
**Version History:**
- 1.1 (2026-01-28) - Updated to reflect actual structure, Sprint 0-4 complete, migration finished
- 1.0 (2026-01-26) - Initial structure definition
