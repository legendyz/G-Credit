# Sprint 5 - Badge Verification & Standards Compliance

**Sprint Number:** Sprint 5  
**Epic:** Epic 6 - Badge Verification & Standards Compliance  
**Duration:** 2026-01-29 → 2026-02-07 (7 working days)  
**Status:** 📋 Planning Complete - Ready to Start  
**Goal:** Implement Open Badges 2.0 compliance with public verification, JSON-LD export, baked PNG generation, and immutable badge metadata

---

## 📋 Sprint Overview

This sprint delivers **complete Open Badges 2.0 compliance**, making G-Credit badges fully interoperable with external platforms (Credly, Badgr, Open Badge Passport). Key features include public verification pages, REST API for third-party verification, baked badges with embedded metadata, and cryptographic integrity enforcement.

### Success Criteria
- ✅ Open Badges 2.0 JSON-LD assertions generated for all badges
- ✅ Public verification page accessible without authentication
- ✅ Third-party verification API operational
- ✅ Baked badges import successfully to external platforms
- ✅ Badge metadata immutability enforced

---

## 📂 Sprint Documentation

### Planning Phase
- **[backlog.md](./backlog.md)** - Complete sprint backlog with 5 user stories (900+ lines)
- **[kickoff-readiness.md](./kickoff-readiness.md)** - Readiness assessment (98/100 score, approved)

### Execution Phase (To Be Created)
- **completion-checklist.md** - Sprint completion checklist (use template)
- **retrospective.md** - Post-sprint lessons learned

---

## 🎯 Sprint Stories

| Story | Title | Priority | Estimate | Status |
|-------|-------|----------|----------|--------|
| 6.1 | Generate Open Badges 2.0 JSON-LD Structure | P0 | 6h | backlog |
| 6.2 | Create Public Verification Pages | P0 | 8h | backlog |
| 6.3 | Implement Verification API Endpoint | P0 | 4h | backlog |
| 6.4 | Generate Baked Badge PNG | P1 | 6h | backlog |
| 6.5 | Ensure Metadata Immutability and Integrity | P0 | 4h | backlog |
| **Testing & Documentation** | E2E tests, API docs | P0 | 8h | backlog |
| **Total** | | | **36h** | **0% complete** |

**Buffer:** 20h (36% of capacity)  
**Total Capacity:** 56h (7 days × 8 hours)

---

## 🔑 Key Technical Decisions

### Open Badges 2.0 Compliance
- **Specification Version:** Open Badges 2.0 (IMS Global)
- **JSON-LD Context:** https://w3id.org/openbadges/v2
- **Verification Type:** Hosted (verification URL)
- **Recipient Privacy:** Email hashed with SHA-256 + salt

### Baked Badge Implementation
- **Package:** sharp@^0.33.0 (PNG processing)
- **Embedding Method:** PNG iTXt chunk with key "openbadges"
- **Compatibility:** Credly, Badgr, Open Badge Passport

### Immutability Strategy
- **Database:** Constraints on immutable fields
- **Application:** Validation layer rejecting unauthorized updates
- **Cryptographic:** SHA-256 hash of assertion for integrity verification

---

## 🏗️ Infrastructure

### Existing Resources (No New Resources Required)
- ✅ Azure PostgreSQL: `gcredit-dev-db-lz` (Sprint 0)
- ✅ Azure Blob Storage: `gcreditdevstoragelz` (Sprint 0)
  - Container: `badges` (public, for image retrieval)

### Database Schema Changes
- Add `badges.verificationId` (UUID, unique)
- Add `badges.metadataHash` (String, SHA-256 hash)

### New Dependencies
- `sharp@^0.33.0` (PNG processing for baked badges)

---

## 🧪 Testing Strategy

### Unit Tests (Target: 20 tests)
- JSON-LD generation logic
- Recipient email hashing
- Badge status verification
- Immutability constraints
- Hash computation

### E2E Tests (Target: 15 tests)
- Public verification page access
- API endpoint responses
- Download functionality
- CORS and caching
- Rate limiting

### Integration Tests (Target: 5 tests)
- Open Badges Validator compatibility
- Baked badge extraction
- External platform import
- Mobile responsive design
- SEO validation

---

## 📖 References

### Project Documentation
- [Sprint Planning Checklist](../../templates/sprint-planning-checklist.md)
- [Lessons Learned](../../lessons-learned/lessons-learned.md)
- [Infrastructure Inventory](../../setup/infrastructure-inventory.md)

### Open Badges 2.0
- [Specification](https://www.imsglobal.org/spec/ob/v2p0/)
- [JSON-LD Context](https://w3id.org/openbadges/v2)
- [Baking Specification](https://www.imsglobal.org/spec/ob/v2p0/#baking)
- [Validator Tool](https://openbadgesvalidator.imsglobal.org/)

### Previous Sprints
- [Sprint 3 - Badge Issuance](../sprint-3/README.md) (Open Badges foundation)
- [Sprint 4 - Employee Badge Wallet](../sprint-4/README.md) (Evidence files)

---

## 👥 Team

**Scrum Master:** Bob  
**Developer:** LegendZhu  
**Sprint Capacity:** 56 hours (7 days)

---

## 📅 Timeline

**Week 1 (Days 1-3):** Foundation
- Day 1: Story 6.1 (JSON-LD generation)
- Day 2: Story 6.2 (Verification page)
- Day 3: Story 6.3 (Verification API)

**Week 2 (Days 4-7):** Advanced Features & Testing
- Day 4: Story 6.4 (Baked badges)
- Day 5: Story 6.5 (Immutability)
- Day 6: Comprehensive testing
- Day 7: Documentation + retrospective

---

**Sprint Status:** ✅ Ready to Start  
**Next Action:** Begin Story 6.1 on 2026-01-29  
**Last Updated:** 2026-01-28
