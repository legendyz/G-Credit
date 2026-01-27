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

### Database & Data Management
- [ADR-001: Prisma Version Lock](001-prisma-version-lock.md) ⏳

### Architecture & Design Patterns
- *None yet*

### Third-Party Integrations
- *None yet*

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

**Last Updated:** 2026-01-25  
**Maintained By:** Tech Lead / Architecture Team  
**Review Frequency:** Monthly or as decisions are made
