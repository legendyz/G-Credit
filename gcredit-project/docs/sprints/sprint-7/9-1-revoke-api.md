# Story 9.1: Badge Revocation API

**Story ID:** Story 9.1  
**Epic:** Epic 9 - Badge Revocation  
**Sprint:** Sprint 7  
**Priority:** HIGH  
**Story Points:** 5 → **7** ⚠️ **UPDATED**  
**Status:** Backlog  
**Last Updated:** February 1, 2026 (Post-Technical Review)

---

## ⚠️ TECHNICAL REVIEW UPDATES (Feb 1, 2026)

Following Sprint 7 Technical Review Meeting, this story has been updated with architectural decisions:

**Scope Additions:**
1. ✅ **AuditLog Table Creation** - Must create dedicated AuditLog infrastructure (not just Badge fields)
2. ✅ **REVOKED Enum Status** - Use Badge.status = REVOKED (not soft-delete with revokedAt field only)
3. ✅ **API Idempotency** - Revoking already-revoked badge returns 200 OK (not 400 error)
4. ✅ **Database Index** - Add index on revokedAt for admin reporting queries

**Estimate Updated:**
- Original: 5 hours
- **Revised: 7 hours** (+2h for AuditLog table + enum migration)

**Development Approach:**
- **TDD Required:** Write unit tests BEFORE implementation (risk mitigation strategy)
- Test coverage target: 15-20 unit tests + 5 E2E tests

**References:**
- Architecture Review: See `EPIC-9-ARCHITECTURE-REVIEW-AMELIA.md`
- Meeting Minutes: See `sprint-7-technical-review-meeting-minutes.md`

---

## User Story

**As an** Admin or Issuer,  
**I want** to revoke a badge with a documented reason,  
**So that** I can handle policy violations, errors, or expired credentials properly.

---

## Background / Context

Badges need a complete lifecycle including revocation capability. Currently, once issued, badges cannot be revoked. This creates problems when:
- Badge issued in error (wrong recipient, wrong template)
- Policy violations discovered after issuance
- Credentials expire or become invalid
- Recipient leaves organization or loses eligibility

Revocation must maintain audit trail and update badge status across all systems (verification pages, employee wallet, external viewers).

---

## Acceptance Criteria

### AC1: Revocation API Endpoint
**Given** I am authenticated as Admin or badge Issuer  
**When** I call `POST /api/badges/:id/revoke` with reason and notes  
**Then** badge status is updated to REVOKED with timestamp and reason recorded

- [x] Endpoint: `POST /api/badges/:id/revoke`
- [x] Request body: `{ reason: string, notes?: string }`
- [x] Response: `{ success: boolean, badge: BadgeDto, message: string }`
- [x] HTTP 200 on success, 403 if unauthorized, 404 if badge not found

### AC2: Authorization Rules
- [x] Only ADMIN role can revoke any badge
- [x] ISSUER role can only revoke badges they issued
- [x] EMPLOYEE and MANAGER roles cannot revoke
- [x] 403 Forbidden error if unauthorized

### AC3: Database Schema - REVOKED Status Enum ⚠️ **UPDATED**
- [x] Badge.status enum includes REVOKED (not just soft-delete pattern)
- [x] Prisma migration adds REVOKED to BadgeStatus enum
- [x] Fields populated: `revokedAt`, `revokedBy`, `revocationReason`, `revocationNotes`
- [x] Original issuance data preserved
- [x] **NEW:** Index on revokedAt field for admin queries

### AC4: AuditLog Infrastructure ⚠️ **NEW**
- [x] **NEW:** Create AuditLog table with schema:
  ```prisma
  model AuditLog {
    id          String   @id @default(cuid())
    entityType  String   // "Badge"
    entityId    String   // Badge ID
    action      String   // "REVOKED"
    actorId     String   // User who performed action
    timestamp   DateTime @default(now())
    metadata    Json?    // { reason, notes }
    @@index([entityType, entityId])
    @@index([actorId])
    @@index([timestamp])
  }
  ```
- [x] Audit log entry created on revocation
- [x] Log entry immutable (no UPDATE/DELETE endpoints)
- [x] Queryable by admin for compliance reports

### AC5: API Idempotency ⚠️ **UPDATED**
- [x] Revoking already-revoked badge returns **200 OK** (not 400 error)
- [x] Response includes flag: `{ alreadyRevoked: true }`
- [x] No duplicate audit log entries created
- [x] Reason validation: enum or text with max length

---

## Non-Functional Requirements

### Performance
- [x] API response time < 200ms
- [x] Audit log write does not block response

### Security
- [x] JWT authentication required
- [x] Role-based authorization (ADMIN, ISSUER only)
- [x] SQL injection protection (Prisma ORM handles)
- [x] Input validation with DTO

---

## Technical Details

### API Endpoint
```typescript
POST /api/badges/:badgeId/revoke
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "reason": "Policy Violation" | "Issued in Error" | "Expired" | "Other",
  "notes": "Optional detailed explanation (max 1000 chars)"
}

Response (200 OK):
{
  "success": true,
  "message": "Badge revoked successfully",
  "badge": {
    "id": "uuid",
    "status": "REVOKED",
    "revokedAt": "2026-02-03T10:30:00Z",
    "revokedBy": "admin-user-id",
    "revocationReason": "Policy Violation"
  }
}

Error Responses:
- 400 Bad Request: Badge already revoked
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Badge does not exist
```

### Database Changes
```prisma
model Badge {
  // ... existing fields ...
  status          BadgeStatus  @default(ISSUED)  // Add REVOKED to enum
  revokedAt       DateTime?
  revokedBy       String?      // FK to User.id
  revocationReason String?     // Enum or text
  revocationNotes  String?     // Text, max 1000 chars
  
  revoker         User?        @relation(fields: [revokedBy], references: [id])
}

enum BadgeStatus {
  ISSUED
  CLAIMED
  REVOKED
}
```

**Migration Required:** Yes
- Add 4 new columns to Badge table
- Update BadgeStatus enum

### Dependencies
- Prisma Client (existing)
- JWT Auth guards (existing)
- Badge service (existing)
- Audit logging service (to be verified)

---

## Test Plan

### Unit Tests (15-20 tests)
- [x] Successfully revoke badge as Admin
- [x] Successfully revoke badge as original Issuer
- [x] Fail to revoke as Employee (403)
- [x] Fail to revoke someone else's badge as Issuer (403)
- [x] Fail to revoke already-revoked badge (400)
- [x] Fail with missing reason (400)
- [x] Fail with invalid badge ID (404)
- [x] Validate notes max length (1000 chars)
- [x] Verify audit log entry created
- [x] Verify all fields populated correctly

### E2E Tests
- [x] Full revocation flow: issue → claim → revoke
- [x] Authorization matrix (all 4 roles)
- [x] Error scenarios (double revoke, not found)

### UAT Test Cases (See uat-test-plan.md)
- Scenario 1.6: Badge Revocation (Admin)
- Scenario 2.1: Revoke already-revoked badge
- Scenario 2.4: Authorization checks

---

## Definition of Done

### Code Complete
- [x] API endpoint implemented
- [x] DTO validation with class-validator
- [x] Authorization guards applied
- [x] Database migration created
- [x] Service layer logic implemented
- [x] No TypeScript errors

### Testing Complete
- [x] Unit tests written (>80% coverage)
- [x] E2E tests written
- [x] Manual API testing with Postman/Thunder Client
- [x] Authorization matrix tested

### Documentation Complete
- [x] Swagger/OpenAPI docs updated
- [x] Inline code comments for business logic
- [x] Story file updated with completion notes

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| Database migration | 0.5h | Dev |
| Service layer (revoke logic) | 1h | Dev |
| Controller & DTO | 1h | Dev |
| Authorization guards | 0.5h | Dev |
| Unit tests | 1h | Dev |
| E2E tests | 0.5h | Dev |
| Manual testing & fixes | 0.5h | Dev |
| **Total** | **5h** | |

### Confidence Level
High - Similar to existing badge CRUD operations

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation

### Blocks
- Story 9.2: Verification Status Display
- Story 9.3: Employee Wallet Display
- Story 9.4: Revocation Notifications

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Breaking existing badge queries | Low | High | Add database indexes, test thoroughly |
| Audit log performance impact | Low | Medium | Make audit logging async |
| Migration issues in production | Low | High | Test migration on staging first |

---

## Questions & Assumptions

### Assumptions
- Revocation is permanent (cannot "un-revoke")
- All roles can view revoked badges
- Revoked badges remain in verification system (status shown)
- No bulk revoke API needed in this story (future enhancement)

---

## Timeline

**Estimated Start:** February 3, 2026 (Day 1)  
**Estimated Completion:** February 3, 2026 (Day 1)  
**Actual Start:** [TBD]  
**Actual Completion:** [TBD]

---

## Related Links

- **Epic 9:** Badge Revocation (in epics.md)
- **Sprint 7 Backlog:** [backlog.md](backlog.md)
- **Database Schema:** [infrastructure-inventory.md](../../setup/infrastructure-inventory.md)

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-01-31 | Backlog | Bob (Scrum Master) | Story created during planning |

---

**Next Story:** [9.2: Verification Status Display](9-2-verification-status.md)
