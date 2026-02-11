# Architecture Decision Records (ADRs)

> **Purpose:** Track significant architectural and technical decisions for the G-Credit project  
> **Format:** Based on Michael Nygard's ADR template  
> **Owner:** Tech Lead / Architecture Team  
> **Review:** Updated as decisions are made

---

## ADR Index

| ADR # | Date | Title | Status | Decision Maker |
|-------|------|-------|--------|----------------|
| [001](001-prisma-version-lock.md) | TBD | Prisma Version Lock at 6.19.2 | ⏳ Pending | Tech Lead |
| [002](002-lodash-security-risk-acceptance.md) | 2026-01-25 | Accept lodash Security Risk for MVP | ✅ Accepted | PM / Tech Lead |
| [003](003-badge-assertion-format.md) | 2026-01-26 | Badge Assertion Format (JSON-LD) | ✅ Accepted | Architect |
| [004](004-email-service-selection.md) | 2026-01-27 | Email Service Selection for Badge Claims | ✅ Accepted | Tech Lead |
| [005](005-open-badges-integration.md) | 2026-01-28 | Open Badges 2.0 Integration Architecture | ✅ Accepted | Architect |
| [006](006-public-api-security.md) | 2026-01-28 | Public API Security Model | ✅ Accepted | Architect |
| [007](007-baked-badge-storage.md) | 2026-01-28 | Baked Badge Storage Strategy | ✅ Accepted | Architect |
| [008](ADR-008-microsoft-graph-integration.md) | 2026-01-29 | Microsoft Graph Integration Strategy | ✅ Accepted | Architect |
| [009](ADR-009-tailwind-v4-css-first-config.md) | 2026-02-09 | Tailwind CSS v4 CSS-First Configuration | ✅ Accepted | SM / Project Lead |

---

## ADR Status Legend

- ✅ **Accepted** - Decision approved and in effect
- ⏳ **Pending** - Under consideration or documentation in progress
- 🔄 **Superseded** - Replaced by a newer ADR
- ❌ **Rejected** - Decision considered but not adopted
- 📝 **Proposed** - Initial proposal, awaiting review

---

## Quick Links by Category

### Infrastructure & Deployment
- *None yet*

### Security & Authentication
- [ADR-002: lodash Security Risk Acceptance](002-lodash-security-risk-acceptance.md) ✅
- [ADR-006: Public API Security Model](006-public-api-security.md) ✅

### Database & Data Management
- [ADR-001: Prisma Version Lock](001-prisma-version-lock.md) ⏳
- [ADR-003: Badge Assertion Format (JSON-LD)](003-badge-assertion-format.md) ✅
- [ADR-007: Baked Badge Storage Strategy](007-baked-badge-storage.md) ✅

### Architecture & Design Patterns
- [ADR-005: Open Badges 2.0 Integration Architecture](005-open-badges-integration.md) ✅

### Third-Party Integrations
- [ADR-004: Email Service Selection](004-email-service-selection.md) ✅

---

## How to Create a New ADR

1. **Copy the template:** Use `docs/templates/adr-template.md`
2. **Number sequentially:** Next available ADR number (e.g., 003, 004)
3. **Fill in all sections:** Context, Decision, Alternatives, Consequences
4. **Add to this index:** Update the table above
5. **Link from relevant docs:** Reference from READMEs, sprint backlogs, etc.
6. **Commit and push:** `git commit -m "docs: add ADR-XXX [title]"`

---

## ADR Template Structure

Each ADR should contain:
- **Title:** Clear, concise decision statement
- **Status:** Current state (Proposed/Accepted/Rejected/Superseded)
- **Context:** Problem and background
- **Decision:** What we decided to do
- **Alternatives Considered:** Other options evaluated
- **Consequences:** Positive, negative, and neutral impacts
- **References:** Links to related docs, issues, or external resources

---

## Recent ADRs (Sprint 5)

### Sprint 5: Badge Verification & Open Badges 2.0 Compliance

**Context:** Sprint 5 introduces public badge verification and Open Badges 2.0 standard compliance, requiring architectural decisions for security, storage, and external integration.

**Key Decisions:**
- **ADR-005:** Open Badges 2.0 hosted verification (vs. signed badges)
- **ADR-006:** Public API security model (rate limiting, CORS, privacy)
- **ADR-007:** Lazy generation + persistent caching for baked badges

**Related Documents:**
- [Sprint 5 Technical Design](../sprints/sprint-5/technical-design.md)
- [Sprint 5 Backlog](../sprints/sprint-5/backlog.md)

---

**Last Updated:** 2026-01-28  
**Maintained By:** Tech Lead / Architecture Team  
**Review Frequency:** Monthly or as decisions are made
