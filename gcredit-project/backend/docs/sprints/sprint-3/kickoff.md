# Sprint 3 Kickoff - Epic 4: Badge Issuance

**Sprint Period:** TBD (estimated 1-2 days)  
**Sprint Goal:** Implement complete badge issuance and claiming workflow  
**Epic:** Epic 4 - Badge Issuance  
**Team:** Solo Developer  
**Created:** 2026-01-27

---

## ðŸ“Š Sprint Overview

### Sprint Goal
Deliver a working badge issuance system that allows authorized users to issue badges to employees, send email notifications, and enable recipients to claim their badges. All issued badges must comply with Open Badges 2.0 standard.

### Success Criteria
- âœ?Authorized users (ADMIN/ISSUER) can issue individual badges
- âœ?Batch issuance via CSV upload works for 10+ badges
- âœ?Recipients receive email notifications with claim links
- âœ?Recipients can claim badges via unique token
- âœ?Issued badges include Open Badges 2.0 compliant assertion
- âœ?Public verification endpoint returns valid assertions
- âœ?Badge revocation workflow functions correctly
- âœ?All tests pass (unit + E2E) with 100% pass rate
- âœ?API documentation updated in Swagger

---

## ðŸŽ¯ Sprint Backlog Summary

| Story | Description | Estimate | Priority |
|-------|-------------|----------|----------|
| **Story 4.1** | Single Badge Issuance | 2h | Must Have |
| **Story 4.2** | Batch Badge Issuance (CSV) | 3h | Must Have |
| **Story 4.3** | Badge Claiming Workflow | 2h | Must Have |
| **Story 4.4** | Issuance History & Queries | 2h | Must Have |
| **Story 4.5** | Email Notifications | 2h | Must Have |
| **Story 4.6** | Badge Revocation | 1.5h | Should Have |

**Total Estimated Time:** 12.5 hours (based on Sprint 2 velocity)

---

## ðŸ” Team Readiness Check

### Prerequisites Completion Status

#### 1. Sprint 2 Closure âœ?
- [x] Sprint 2 retrospective completed (2026-01-26)
- [x] Technical debt resolved (100%)
- [x] Code review completed (10/10 rating after improvements)
- [x] All tests passing (27/27)
- [x] Documentation complete (90KB+)
- [x] PR merged to main
- [x] Release v0.2.0 published

#### 2. Technical Decisions âœ?
- [x] ADR-003: Open Badges 2.0 assertion format selected
- [x] ADR-004: Azure Communication Services email selected
- [x] Data model designed (Badge entity with assertionJson)
- [x] API endpoints designed (8 endpoints)

#### 3. Infrastructure Readiness âš ï¸ **ACTION REQUIRED**
- [x] Azure PostgreSQL running (from Sprint 0)
- [x] Azure Blob Storage configured (badges, evidence containers)
- [ ] **Azure Communication Services setup** âš ï¸ **2-3h setup time**
  - [ ] Create ACS resource in Azure Portal
  - [ ] Configure email domain (24-48h verification wait)
  - [ ] Get connection string
  - [ ] Add to `.env`: `AZURE_COMMUNICATION_CONNECTION_STRING`
- [ ] **Email templates prepared** (1h)
  - [ ] Badge claim notification template
  - [ ] Badge revocation notification template

#### 4. Development Environment âœ?
- [x] Node.js 20.20.0 LTS installed
- [x] All dependencies up to date (Sprint 2 package.json)
- [x] Database migrations applied
- [x] Test environment functional

#### 5. Documentation âœ?
- [x] Lessons learned reviewed (26 lessons from Sprint 0-2)
- [x] Project structure documented (DOCUMENTATION-STRUCTURE.md)
- [x] Import paths reference available (backend-code-structure-guide.md)
- [x] Sprint 2 retrospective insights captured

---

## ðŸ“š Key Lessons Applied (Sprint 0-2)

### From Sprint 2 Retrospective

#### âœ?Lesson 10: Code-Documentation Sync
**Action:** All import paths in backlog verified against actual codebase
```typescript
// Story 4.1 will use ACTUAL paths:
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../common/email.service';
import { BadgeTemplate } from '@prisma/client';
```

#### âœ?Lesson 11: Adjusted Time Estimates
**Action:** Using Sprint 2 actual velocity (7x faster than original estimates)
- Simple CRUD: 1-2h (not 5-6h)
- Validation logic: 2-3h (not 8-10h)
- Testing: Included in story time (not separate)

#### âœ?Lesson 13: Prisma JSON Types
**Action:** Badge.assertionJson will need DTO â†?Plain Object conversion
```typescript
// When saving assertion to database:
assertionJson: JSON.parse(JSON.stringify(assertionDto))
```

#### âœ?Lesson 14: Union Type Validation
**Action:** All DTOs with union types have explicit decorators
```typescript
@IsNotEmpty() // Required for union types!
value: string | number | boolean | string[];
```

#### âœ?Lesson 5: Test-First Approach
**Action:** Each story includes:
- Test strategy section
- E2E test scenarios
- PowerShell smoke tests

---

## ðŸ—ï¸?Technical Architecture

### New Data Models

#### Badge Entity (Prisma)
```prisma
model Badge {
  id              String        @id @default(uuid())
  templateId      String
  recipientId     String
  issuerId        String
  evidenceUrl     String?
  issuedAt        DateTime      @default(now())
  expiresAt       DateTime?
  status          BadgeStatus   @default(PENDING)
  claimToken      String?       @unique
  claimedAt       DateTime?
  revokedAt       DateTime?
  revocationReason String?
  assertionJson   Json          // Open Badges 2.0
  
  template        BadgeTemplate @relation(fields: [templateId], references: [id])
  recipient       User          @relation("BadgesReceived", fields: [recipientId], references: [id])
  issuer          User          @relation("BadgesIssued", fields: [issuerId], references: [id])
  
  @@index([recipientId, status])
  @@index([templateId, issuedAt])
  @@index([claimToken])
  @@map("badges")
}

enum BadgeStatus {
  PENDING   // Awaiting claim
  CLAIMED   // Claimed by recipient
  EXPIRED   // Past expiration date
  REVOKED   // Revoked by admin
}
```

### API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/badges` | Required | ADMIN, ISSUER | Issue single badge |
| POST | `/api/badges/bulk` | Required | ADMIN, ISSUER | Batch issue via CSV |
| GET | `/api/badges/my-badges` | Required | Any | My received badges |
| GET | `/api/badges/issued` | Required | ADMIN, ISSUER | Badges I issued |
| POST | `/api/badges/:id/claim` | Public | None | Claim badge (token) |
| GET | `/api/badges/:id/assertion` | Public | None | OB 2.0 assertion |
| POST | `/api/badges/:id/revoke` | Required | ADMIN | Revoke badge |
| GET | `/api/badges/:id/verify` | Public | None | Verify authenticity |

### Service Layer

```
badge-issuance/
â”œâ”€â”€ badge-issuance.controller.ts      # 8 endpoints
â”œâ”€â”€ badge-issuance.service.ts         # Core business logic
â”œâ”€â”€ badge-issuance.module.ts
â”œâ”€â”€ dto/
â”?  â”œâ”€â”€ issue-badge.dto.ts            # Single issuance
â”?  â”œâ”€â”€ bulk-issue-badges.dto.ts      # CSV upload
â”?  â”œâ”€â”€ claim-badge.dto.ts            # Claim token
â”?  â”œâ”€â”€ revoke-badge.dto.ts           # Revocation
â”?  â””â”€â”€ query-badge.dto.ts            # Filtering
â””â”€â”€ services/
    â”œâ”€â”€ assertion-generator.service.ts # OB 2.0 JSON-LD
    â”œâ”€â”€ csv-parser.service.ts          # Bulk issuance
    â””â”€â”€ badge-verification.service.ts  # Public verification
```

---

## âš ï¸ Known Risks & Mitigations

### Risk 1: Azure Communication Services Domain Verification (HIGH)
**Impact:** 24-48 hour wait for email domain verification

**Mitigation:**
- âœ?**Option A (Recommended):** Start domain verification NOW (before Sprint 3 dev starts)
- âœ?**Option B:** Use Azure-provided domain for MVP (instant, but ugly sender address)
- âœ?**Option C:** Keep Ethereal for development, deploy ACS later

**Decision:** Use Option B for Sprint 3 development, switch to Option A for production

---

### Risk 2: CSV Parsing Complexity (MEDIUM)
**Impact:** Bulk issuance may take longer than estimated if CSV format issues arise

**Mitigation:**
- Use proven library: `csv-parse` (already used in industry)
- Provide clear CSV template with example data
- Validate CSV headers before processing
- Return detailed error messages (row number, field name)

**CSV Template:**
```csv
recipientEmail,templateId,evidenceUrl,expiresIn
john.doe@example.com,uuid-1,https://...,365
jane.smith@example.com,uuid-1,,
```

---

### Risk 3: Open Badges 2.0 Complexity (MEDIUM)
**Impact:** JSON-LD assertion generation may be complex

**Mitigation:**
- Reference implementation from Mozilla/Credly
- Use TypeScript interfaces for type safety
- Create comprehensive unit tests for assertion generation
- Validate against OB 2.0 schema

**Reference:** https://www.imsglobal.org/spec/ob/v2p0/

---

### Risk 4: Email Deliverability (MEDIUM)
**Impact:** Emails may land in spam folders

**Mitigation:**
- Verify SPF, DKIM, DMARC records
- Test with multiple email providers (Gmail, Outlook)
- Use clear from address and subject lines
- Include unsubscribe link (optional for transactional emails)
- Monitor bounce rate in Azure Portal

---

## ðŸ§ª Testing Strategy

### Test Pyramid

#### Unit Tests (Jest) - 20 tests
- AssertionGeneratorService (8 tests)
  - âœ?Generate valid OB 2.0 JSON-LD
  - âœ?Hash recipient email (SHA-256)
  - âœ?Include evidence URLs
  - âœ?Handle expiration dates
  - âœ?Generate verification URLs
  
- CSVParserService (6 tests)
  - âœ?Parse valid CSV
  - âœ?Validate headers
  - âœ?Handle missing optional fields
  - âœ?Reject invalid data
  
- BadgeService (6 tests)
  - âœ?Issue single badge
  - âœ?Generate unique claim token
  - âœ?Revoke badge
  - âœ?Verify badge authenticity

#### Integration Tests (Jest E2E) - 15 tests
- Issue Badge (3 tests)
  - âœ?Authorized user can issue
  - âœ?Unauthorized user cannot issue
  - âœ?Invalid template ID rejected
  
- Bulk Issue (3 tests)
  - âœ?Valid CSV processes successfully
  - âœ?Invalid CSV rejected with errors
  - âœ?Partial failures handled
  
- Claim Badge (3 tests)
  - âœ?Valid token claims successfully
  - âœ?Invalid token rejected
  - âœ?Expired token rejected
  
- Query Badges (3 tests)
  - âœ?User sees own badges only
  - âœ?Issuer sees issued badges
  - âœ?Admin sees all badges
  
- Revoke Badge (3 tests)
  - âœ?Admin can revoke
  - âœ?Non-admin cannot revoke
  - âœ?Revoked badge returns 410 Gone

#### E2E Tests (PowerShell) - 5 tests
- âœ?Complete issuance workflow (issue â†?notify â†?claim)
- âœ?Bulk issuance smoke test
- âœ?Public assertion endpoint
- âœ?Badge verification
- âœ?Revocation workflow

**Total Tests:** 40 tests  
**Target Pass Rate:** 100%

---

## ðŸ“¦ Test Data Preparation

### CSV Fixtures
**File:** `backend/test/fixtures/bulk-badges.csv`
```csv
recipientEmail,templateId,evidenceUrl,expiresIn
test1@example.com,{{TEMPLATE_ID}},https://example.com/cert1.pdf,365
test2@example.com,{{TEMPLATE_ID}},,730
```

### Evidence Files
**File:** `backend/test/fixtures/sample-evidence.pdf`
- Placeholder PDF for testing evidence uploads

### Email Templates
**File:** `backend/test/fixtures/email-templates/`
- `badge-claim.html`
- `badge-revoked.html`

---

## ðŸ“‹ Definition of Done

A story is considered "Done" when:

### Code Quality
- [ ] All TypeScript strict mode checks pass
- [ ] ESLint warnings resolved
- [ ] No console.log in production code (use Logger)
- [ ] Error handling implemented with proper HTTP status codes
- [ ] Input validation with class-validator
- [ ] Code follows NestJS conventions

### Testing
- [ ] Unit tests written and passing
- [ ] E2E tests written and passing
- [ ] PowerShell smoke tests passing
- [ ] Test coverage â‰?80% for new code
- [ ] Edge cases covered (invalid input, errors)

### Documentation
- [ ] Swagger/OpenAPI annotations added
- [ ] DTO classes documented with examples
- [ ] Complex logic has inline comments
- [ ] README updated if new dependencies added

### Integration
- [ ] Prisma migrations applied successfully
- [ ] Database indexes created
- [ ] Azure Blob Storage integration tested
- [ ] Email sending tested (development + production)

### Security
- [ ] Authentication guards applied correctly
- [ ] Role-based access control enforced
- [ ] Input sanitization implemented
- [ ] Sensitive data not logged
- [ ] Public endpoints carefully reviewed

---

## ðŸš€ Sprint Execution Plan

### Day 1 (6-7 hours)
**Morning (3-4h):**
- âœ?Story 4.1: Single Badge Issuance (2h)
- âœ?Story 4.5: Email Notifications (2h)

**Afternoon (3h):**
- âœ?Story 4.3: Badge Claiming Workflow (2h)
- âœ?Setup Azure Communication Services (1h)

### Day 2 (5-6 hours)
**Morning (3-4h):**
- âœ?Story 4.2: Batch Badge Issuance (CSV) (3h)
- âœ?Story 4.4: Issuance History & Queries (2h)

**Afternoon (2h):**
- âœ?Story 4.6: Badge Revocation (1.5h)
- âœ?Final testing & bug fixes (30min)

### Day 3 (Optional, 2-3 hours)
- âœ?Sprint retrospective
- âœ?Update documentation
- âœ?Prepare Sprint 3 final report
- âœ?Create PR and merge to main
- âœ?Tag v0.3.0 release

---

## ðŸ“– Reference Documents

### Sprint Planning
- [Sprint 3 Detailed Backlog](./backlog.md) - **PRIMARY REFERENCE**
- [Sprint 3 Test Strategy](./test-strategy.md)

### Technical Decisions
- [ADR-003: Badge Assertion Format](../../decisions/003-badge-assertion-format.md)
- [ADR-004: Email Service Selection](../../decisions/004-email-service-selection.md)

### Lessons Learned
- [Lessons Learned (26 lessons)](../../lessons-learned/lessons-learned.md)
- [Sprint 2 Retrospective](../sprint-2/retrospective.md)
- [Sprint 2 Code Review](../sprint-2/code-review-recommendations.md)

### Project Documentation
- [API Guide](../../API-GUIDE.md)
- [Deployment Guide](../../DEPLOYMENT.md)
- [Testing Guide](../../TESTING.md)
- [Documentation Structure](../../../DOCUMENTATION-STRUCTURE.md)

---

## âœ?Pre-Sprint Checklist

### Infrastructure
- [ ] Azure Communication Services resource created
- [ ] Email domain configured (or using Azure default domain)
- [ ] ACS connection string added to `.env`
- [ ] Email templates created in codebase

### Development Environment
- [ ] Git branch created: `sprint-3/epic-4-badge-issuance`
- [ ] Latest code pulled from main (v0.2.0)
- [ ] Dependencies installed (`npm install`)
- [ ] Database up to date (`node_modules\.bin\prisma migrate dev`)
- [ ] Development server running (`npm run start:dev`)

### Documentation
- [ ] Sprint 3 backlog reviewed
- [ ] ADR-003 and ADR-004 reviewed
- [ ] Lessons learned internalized (Top 10)
- [ ] Test strategy understood

### Team Alignment
- [ ] Sprint goal clear
- [ ] Story priorities agreed
- [ ] Definition of Done understood
- [ ] Risks acknowledged and mitigations ready

---

## ðŸŽ¯ Sprint Goal Reminder

> **"By the end of Sprint 3, any authorized user can issue badges to employees, recipients can claim their badges via email, and all badges comply with Open Badges 2.0 standard for external verification."**

---

**Status:** âœ?Ready to Start  
**Next Step:** Review [Sprint 3 Backlog](./backlog.md) and begin Story 4.1  
**Questions?** Refer to lessons learned or ADR documents

---

**Good luck with Sprint 3! ðŸš€**
