# G-Credit Documentation Structure

**Version:** 1.0  
**Last Updated:** 2026-01-26  
**Purpose:** Define standard documentation organization for the G-Credit project

---

## 📁 Directory Structure

```
gcredit-project/
├── docs/                              # Project-level documentation
│   ├── README.md                      # Documentation index
│   ├── project-overview.md            # High-level project description
│   ├── architecture/                  # Architecture documents
│   │   ├── system-architecture.md
│   │   ├── data-model.md
│   │   └── api-design.md
│   ├── planning/                      # Planning artifacts
│   │   ├── product-requirements.md
│   │   ├── epics.md
│   │   ├── ux-design-specification.md
│   │   └── implementation-readiness-reports/
│   ├── decisions/                     # Architecture Decision Records (ADRs)
│   │   ├── 001-framework-selection.md
│   │   ├── 002-lodash-security-risk-acceptance.md
│   │   └── README.md
│   ├── lessons-learned/               # Project knowledge base
│   │   ├── README.md                  # Index of all lessons
│   │   ├── lessons-learned.md         # Main lessons document
│   │   ├── best-practices.md
│   │   └── common-pitfalls.md
│   ├── security/                      # Security documentation
│   │   ├── security-notes.md
│   │   ├── threat-model.md
│   │   └── compliance.md
│   └── templates/                     # Document templates
│       ├── adr-template.md
│       ├── sprint-retrospective-template.md
│       └── user-story-template.md
│
├── backend/                           # Backend application
│   ├── README.md                      # Backend quick start guide
│   ├── CHANGELOG.md                   # Version history
│   ├── docs/                          # Backend-specific documentation
│   │   ├── API-GUIDE.md              # API usage and examples
│   │   ├── DEPLOYMENT.md             # Deployment procedures
│   │   ├── TESTING.md                # Testing guide
│   │   └── sprints/                  # Sprint reports
│   │       ├── sprint-0/
│   │       │   ├── backlog.md
│   │       │   ├── retrospective.md
│   │       │   └── azure-setup-guide.md
│   │       ├── sprint-1/
│   │       │   ├── backlog.md
│   │       │   ├── retrospective.md
│   │       │   ├── kickoff-readiness.md
│   │       │   └── tech-stack-verification.md
│   │       └── sprint-2/
│   │           ├── backlog.md
│   │           ├── kickoff.md
│   │           ├── retrospective.md
│   │           ├── final-report.md
│   │           ├── code-review-recommendations.md
│   │           └── technical-debt-completion.md
│   ├── src/                          # Source code
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

### 2. **Backend Documentation** (`/backend/docs`)
**Purpose:** Backend-specific technical documentation

**Contents:**
- API usage guide
- Deployment procedures
- Testing strategies
- Sprint reports and retrospectives
- Enhancement guides
- Code review reports

**Audience:** Backend developers, DevOps engineers

**Sub-organization:**
- `sprints/` - Organized by sprint number
- Root level - Living documents (API, Deployment, Testing)

---

### 3. **Sprint Documentation** (`/backend/docs/sprints/sprint-X/`)
**Purpose:** Historical record of sprint work

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

## 🔄 Migration from Legacy Structure

### Old Structure (Before 2026-01-26)
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

### New Structure (After Reorganization)
```
docs/                                   # Project-level
├── architecture/
│   └── system-architecture.md         # From: planning-artifacts/architecture.md
├── planning/
│   ├── epics.md                       # From: planning-artifacts/epics.md
│   └── ux-design-specification.md     # From: planning-artifacts/ux-design-specification.md
├── decisions/
│   └── 002-lodash-security-risk-acceptance.md  # From: implementation-artifacts/decisions/
├── lessons-learned/
│   └── lessons-learned.md             # Already here
└── security/
    └── security-notes.md              # Already here

backend/docs/
├── API-GUIDE.md                       # Already here
├── DEPLOYMENT.md                      # Already here
├── TESTING.md                         # Already here
└── sprints/
    ├── sprint-0/
    │   ├── backlog.md                 # From: implementation-artifacts/sprint-0-backlog.md
    │   └── retrospective.md           # From: implementation-artifacts/sprint-0-retrospective.md
    ├── sprint-1/
    │   ├── backlog.md                 # From: implementation-artifacts/sprint-1-backlog.md
    │   └── retrospective.md           # From: implementation-artifacts/sprint-1-retrospective.md
    └── sprint-2/
        ├── backlog.md                 # From: implementation-artifacts/sprint-2-backlog.md
        ├── retrospective.md           # Already in backend/docs/
        ├── final-report.md            # Already in backend/docs/
        └── code-review-recommendations.md  # Already in backend/docs/
```

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
- [ ] Move sprint documents to `/backend/docs/sprints/sprint-X/`
- [ ] Update lessons-learned.md with new insights
- [ ] Archive any deprecated documents
- [ ] Update main README.md indexes

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
- 1.0 (2026-01-26) - Initial structure definition
