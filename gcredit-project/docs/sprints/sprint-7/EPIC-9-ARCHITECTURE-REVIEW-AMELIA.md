# Epic 9 Architecture Review: Badge Revocation

**Reviewer:** Amelia, Senior Software Architect  
**Date:** January 31, 2026  
**Epic:** Epic 9 - Badge Revocation  
**Sprint:** Sprint 7  
**Status:** Architecture Review Complete

---

## Executive Summary

This document provides a comprehensive architecture review of Epic 9 (Badge Revocation), analyzing database schema changes, API design patterns, Open Badges 2.0 compliance, and system-wide architectural impacts across 5 stories.

**Overall Assessment:** ⚠️ **APPROVED WITH CONCERNS**

- **3 Architecture Approvals:** Well-designed patterns aligned with existing system
- **6 Critical Concerns:** Require discussion or design refinement
- **2 Architecture Violations:** Conflicts with ADR-003 and system-architecture.md
- **4 Recommended Improvements:** Scalability and maintainability enhancements

---

## Stories Reviewed

1. [Story 9.1: Badge Revocation API](9-1-revoke-api.md) - Database + API
2. [Story 9.2: Revoked Badge Display in Verification Page](9-2-verification-status.md) - Public verification
3. [Story 9.3: Employee Wallet Display for Revoked Badges](9-3-wallet-display.md) - Employee UI
4. [Story 9.4: Badge Revocation Notifications](9-4-notifications.md) - Email integration
5. [Story 9.5: Admin Badge Revocation UI](9-5-admin-ui.md) - Admin UI

**Referenced Architecture Documents:**
- [system-architecture.md](../../architecture/system-architecture.md) - Decision 1.2 (Badge Data Model), Decision 2.2 (API Security)
- [ADR-003: Badge Assertion Format](../../decisions/003-badge-assertion-format.md) - Open Badges 2.0 compliance
- [ADR-007: Baked Badge Storage](../../decisions/007-baked-badge-storage.md) - Cache invalidation strategy

---

## Story 9.1: Badge Revocation API

### Question 1: Database Schema Changes

**Story Proposal:**
```prisma
model Badge {
  // Proposed new fields:
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
  REVOKED  // NEW
}
```

**Architecture Assessment:**

✅ **APPROVED** - Schema design is sound with minor recommendations

**Analysis:**
1. **Field Sufficiency:** 4 new fields are adequate for MVP revocation tracking
2. **Missing Fields:** 
   - ❌ **No `revokedByName`** - If `revoker` user is deleted, audit trail breaks
   - ⚠️ **Consider `revocationInitiator`** - Distinguish between manual admin action vs automated system revocation
3. **Indexing:**
   - ✅ `@@index([recipientId, status])` already exists (sufficient for wallet queries)
   - ⚠️ **RECOMMENDED:** Add `@@index([revokedAt])` for admin "recently revoked badges" reports
4. **revocationReason Field Type:**
   - Story says "Enum or text" - **DECISION REQUIRED**
   - ✅ **RECOMMENDED: ENUM** for consistency and analytics
   ```prisma
   enum RevocationReason {
     POLICY_VIOLATION
     ISSUED_IN_ERROR
     EXPIRED
     EMPLOYEE_LEFT_ORGANIZATION
     OTHER
   }
   ```
   - **Rationale:** Fixed set of reasons enables analytics ("What are the top revocation reasons?"), prevents typos, validates at DB level

**Migration Risk:** ✅ Low - Adding nullable columns is non-breaking

**💡 RECOMMENDED Improvements:**
```prisma
model Badge {
  // ... existing fields ...
  status             BadgeStatus        @default(ISSUED)
  revokedAt          DateTime?
  revokedBy          String?           // FK to User.id
  revokedByName      String?           // Denormalized for audit trail
  revocationReason   RevocationReason?  // ENUM instead of String
  revocationNotes    String?           @db.Text
  
  revoker            User?             @relation(fields: [revokedBy], references: [id])
  
  @@index([revokedAt])  // NEW: For admin revocation reports
}
```

---

### Question 2: Soft Delete Pattern - Badge.status vs revokedAt

**Story Proposal:**
- Badge.status remains CLAIMED
- revokedAt field populated to mark revocation

**Architecture Assessment:**

❌ **ARCHITECTURE VIOLATION** - Contradicts story's own schema proposal

**Issue:** Story text says "Status changed to REVOKED" (AC3) but also proposes adding REVOKED to enum. The story is inconsistent.

**Analysis:**

**Option A: Add REVOKED to BadgeStatus enum (RECOMMENDED)**
```prisma
enum BadgeStatus {
  PENDING   // Issued but not claimed
  CLAIMED   // Employee claimed badge
  REVOKED   // Badge revoked (was PENDING or CLAIMED)
}
```
**Pros:**
- ✅ Clear status lifecycle: PENDING → CLAIMED → REVOKED
- ✅ Simple queries: `WHERE status = 'REVOKED'`
- ✅ Consistent with story AC3: "Status changed to REVOKED"
- ✅ Follows standard soft-delete pattern (status flag + timestamp)

**Cons:**
- ⚠️ Loses information about whether badge was claimed before revocation

**Option B: Keep status as CLAIMED, use revokedAt as flag**
```prisma
// No REVOKED enum, check revokedAt IS NOT NULL
```
**Pros:**
- ✅ Preserves claim history (can see badge was claimed before revocation)

**Cons:**
- ❌ Confusing: Badge.status = CLAIMED but badge is revoked
- ❌ Queries are awkward: `WHERE revokedAt IS NOT NULL`
- ❌ Risk of bugs: Developers forget to check revokedAt field

**DECISION: Option A (Add REVOKED to enum)**

**Rationale:**
- Status should reflect current state, not historical state
- Use `claimedAt` field to preserve claim history
- Align with story's own schema proposal (story already adds REVOKED to enum)
- If needed, can add `previousStatus` field to track PENDING→REVOKED vs CLAIMED→REVOKED

---

### Question 3: Authorization - Who Can Revoke?

**Story Proposal:**
- ADMIN can revoke any badge
- ISSUER can revoke badges they issued
- MANAGER and EMPLOYEE cannot revoke

**Architecture Assessment:**

⚠️ **CONCERN** - Missing permission for MANAGER role

**Analysis:**

**Current Authorization Matrix:**
| Role | Can Revoke Own Badges | Can Revoke Team Badges | Can Revoke Any Badge |
|------|----------------------|----------------------|---------------------|
| EMPLOYEE | ❌ | ❌ | ❌ |
| MANAGER | ❌ (story) | **UNDEFINED** | ❌ |
| ISSUER | ✅ (if they issued) | ✅ (if they issued) | ❌ |
| ADMIN | ✅ | ✅ | ✅ |

**Missing Use Case:** Manager discovers employee left company, needs to revoke their badges.

**Recommendation:**
- **MANAGER can revoke badges of their direct reports**
- Requires adding `managerId` relationship to Badge or User model

**Alternative Approaches:**

**Option A: RBAC with Permission System (RECOMMENDED for scalability)**
```typescript
enum Permission {
  REVOKE_OWN_BADGES = 'revoke:own',
  REVOKE_TEAM_BADGES = 'revoke:team',
  REVOKE_ANY_BADGE = 'revoke:any'
}

// Role → Permission mapping
ADMIN: [REVOKE_ANY_BADGE]
ISSUER: [REVOKE_OWN_BADGES]  // Only badges they issued
MANAGER: [REVOKE_TEAM_BADGES]  // Direct reports
```

**Option B: Simple Role-Based Check (SUFFICIENT for MVP)**
```typescript
async canRevokeBadge(userId: string, badgeId: string): Promise<boolean> {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
  
  // ADMIN: Can revoke any badge
  if (user.role === 'ADMIN') return true;
  
  // ISSUER: Can revoke badges they issued
  if (user.role === 'ISSUER' && badge.issuerId === userId) return true;
  
  // MANAGER: Can revoke badges of direct reports (if managerId relationship exists)
  if (user.role === 'MANAGER') {
    const recipient = await this.prisma.user.findUnique({ 
      where: { id: badge.recipientId } 
    });
    if (recipient.managerId === userId) return true;
  }
  
  return false;
}
```

**💡 RECOMMENDED:** Implement Option B for Sprint 7, plan Option A (permission system) for Sprint 10+ (Phase 3 governance features).

---

### Question 4: Idempotency - Revoking Already-Revoked Badge

**Story Proposal:**
- Cannot revoke already-revoked badge
- Return 400 Bad Request

**Architecture Assessment:**

⚠️ **CONCERN** - Not idempotent, violates REST best practices

**Analysis:**

**Current Behavior (Story):**
```typescript
POST /badges/{id}/revoke
{ "reason": "Policy Violation" }

Response (if already revoked):
400 Bad Request
{ "error": "Badge already revoked" }
```

**Industry Best Practice: Idempotent Operations**

Per REST principles, POST operations that don't create new resources should be idempotent when possible.

**Recommended Behavior:**
```typescript
POST /badges/{id}/revoke
{ "reason": "Policy Violation" }

Response (if already revoked):
200 OK
{ 
  "success": true,
  "message": "Badge was already revoked",
  "badge": { ... },
  "wasAlreadyRevoked": true
}
```

**Rationale:**
- ✅ Client retries don't fail (network issue resilience)
- ✅ Bulk revocation scripts simpler (no error handling for already-revoked)
- ✅ Aligns with HTTP idempotency standards
- ✅ No harm in "revoking" already-revoked badge

**Alternative: Update revocation reason if different**
```typescript
if (badge.status === 'REVOKED') {
  if (dto.reason !== badge.revocationReason) {
    // Update revocation metadata (add to audit log)
    await this.updateRevocationReason(badge.id, dto.reason, dto.notes);
    return { message: 'Revocation reason updated' };
  }
  return { message: 'Badge already revoked', wasAlreadyRevoked: true };
}
```

**💡 RECOMMENDED:** Return 200 OK with `wasAlreadyRevoked: true` flag instead of 400 error.

---

### Question 5: Audit Log Storage

**Story Mentions:** "Audit log entry created" (AC4)

**Architecture Assessment:**

❌ **ARCHITECTURE VIOLATION** - No AuditLog table exists in schema.prisma

**Current Database Schema:**
```bash
$ grep -i "audit" backend/prisma/schema.prisma
# No results
```

**Missing Infrastructure:**
- No `AuditLog` table
- No audit logging service
- No query API for audit trail

**System Architecture Reference:**
[system-architecture.md](../../architecture/system-architecture.md) mentions "comprehensive audit logging for all issuance and revocation actions" but provides no implementation details.

**Recommended Implementation:**

**Option A: Dedicated AuditLog Table (RECOMMENDED)**
```prisma
model AuditLog {
  id          String   @id @default(uuid())
  entityType  String   // "Badge", "User", "BadgeTemplate"
  entityId    String   // UUID of affected entity
  action      String   // "REVOKE_BADGE", "ISSUE_BADGE", "UPDATE_USER"
  actorId     String   // User who performed action
  actorName   String   // Denormalized for historical accuracy
  metadata    Json     // Flexible JSONB (before/after values, reason, notes)
  createdAt   DateTime @default(now())
  
  actor       User     @relation(fields: [actorId], references: [id])
  
  @@index([entityType, entityId])
  @@index([actorId])
  @@index([action])
  @@index([createdAt])
}
```

**Usage:**
```typescript
await this.prisma.auditLog.create({
  data: {
    entityType: 'Badge',
    entityId: badge.id,
    action: 'REVOKE_BADGE',
    actorId: userId,
    actorName: user.name,
    metadata: {
      badgeName: badge.template.name,
      recipientEmail: badge.recipient.email,
      reason: dto.reason,
      notes: dto.notes,
      beforeStatus: 'CLAIMED',
      afterStatus: 'REVOKED'
    }
  }
});
```

**Query Examples:**
```typescript
// All revocations by specific admin
await this.prisma.auditLog.findMany({
  where: { 
    action: 'REVOKE_BADGE',
    actorId: adminUserId
  }
});

// Audit trail for specific badge
await this.prisma.auditLog.findMany({
  where: {
    entityType: 'Badge',
    entityId: badgeId
  },
  orderBy: { createdAt: 'desc' }
});
```

**Option B: Badge.revocationNotes Only (NOT RECOMMENDED)**
- ❌ No queryability ("Show all badges revoked by Admin X")
- ❌ No historical trail (notes can be overwritten)
- ❌ No audit for non-revocation actions

**💡 RECOMMENDED:** Create `AuditLog` table as part of Story 9.1 (add 1h to story estimate).

---

## Story 9.2: Verification Endpoint Update

### Question 6: Open Badges 2.0 Compliance - Revocation in JSON-LD

**Story Proposal:**
```json
{
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "revoked": true,  // NEW
  "revocationReason": "Policy Violation"  // NEW
}
```

**Architecture Assessment:**

⚠️ **CONCERN** - Not fully compliant with Open Badges 2.0 specification

**ADR-003 Reference:**
[ADR-003: Badge Assertion Format](../../decisions/003-badge-assertion-format.md) mandates Open Badges 2.0 compliance.

**Open Badges 2.0 Specification Analysis:**

Per [IMS Global Open Badges 2.0 spec](https://www.imsglobal.org/spec/ob/v2p0/), revocation is **NOT** indicated in the assertion JSON itself. Instead:

**Correct Approach: HostedBadge with Revocation Check**

```json
// GET /badges/{id}/assertion (public verification endpoint)
// Returns assertion JSON WITHOUT revoked field

{
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "id": "https://gcredit.example.com/api/badges/{uuid}/assertion",
  "verification": {
    "type": "hosted"  // Verifier must check this URL
  }
}
```

**If badge revoked, verification endpoint should:**
- **Option A:** Return HTTP 410 Gone (badge permanently unavailable)
- **Option B:** Return 200 OK with revocation details in **separate field** (not in @context assertion)

**Open Badges 2.0 Spec Guidance:**
> "For hosted verification, the verification URL should return the Assertion. If the badge has been revoked, the hosted URL MAY return HTTP status 410 Gone."

**Recommended Implementation:**

```typescript
// GET /api/badges/:id/verify (human-readable verification page)
Response:
{
  "badge": { ... },
  "assertion": { /* OB 2.0 JSON-LD */ },
  "status": "REVOKED",
  "isValid": false,
  "revoked": true,
  "revokedAt": "2026-02-05T14:30:00Z",
  "revocationReason": "Policy Violation"
}

// GET /api/badges/:id/assertion (OB 2.0 assertion endpoint)
Response:
- If valid: 200 OK with assertion JSON
- If revoked: 410 Gone with minimal JSON
{
  "@context": "https://w3id.org/openbadges/v2",
  "id": "https://gcredit.example.com/api/badges/{uuid}/assertion",
  "revoked": true,
  "revocationReason": "Policy Violation"  // Optional extension
}
```

**💡 RECOMMENDED:**
1. Keep `/verify` endpoint (human-readable) returning 200 with revocation details
2. Add `/assertion` endpoint (machine-readable) returning 410 Gone for revoked badges
3. Document in ADR-003 that revocation follows OB 2.0 hosted verification pattern

---

### Question 7: Verification Endpoint HTTP Status Code

**Story Proposal:**
- Revoked badges return 200 OK with warning

**Architecture Assessment:**

⚠️ **CONCERN** - HTTP status code semantics unclear

**Analysis:**

**Current Proposal (Story 9.2):**
```typescript
GET /api/badges/{id}/verify

Response (revoked):
200 OK
{ "status": "REVOKED", "isValid": false }
```

**RESTful Alternatives:**

| HTTP Status | Meaning | Use Case |
|------------|---------|----------|
| **200 OK** | Request succeeded, badge exists | Client can see badge was revoked (transparency) |
| **410 Gone** | Resource permanently deleted | Badge no longer valid, treat as non-existent |
| **404 Not Found** | Resource never existed | Ambiguous (was badge deleted or never issued?) |

**Recommendation:** **200 OK for transparency** (current story approach)

**Rationale:**
- ✅ Verifiers need to see WHY badge is invalid (revocation reason)
- ✅ Returning error status hides information
- ✅ `isValid: false` flag clearly indicates invalidity
- ✅ Supports audit requirements (proof badge was issued then revoked)

**Alternative for `/assertion` endpoint:** Use 410 Gone (see Question 6)

**💡 APPROVED:** 200 OK with `isValid: false` is correct approach for human-readable verification page.

---

### Question 8: Baked Badge Images - Visual Indicator for Revoked Badges

**Story Says:** "No changes needed to baked badge"

**Architecture Assessment:**

⚠️ **CONCERN** - Revoked badges still downloadable with misleading visual

**ADR-007 Reference:**
[ADR-007: Baked Badge Storage](../../decisions/007-baked-badge-storage.md) describes lazy generation with persistent caching.

**Current Implementation (ADR-007):**
```typescript
// Baked badge cached at: baked/{badgeId}-{verificationId}.png
// Cache invalidation on revocation: DELETE blob on revoke
```

**Issue:** Story 9.1 AC5 and Story 9.3 AC3 disable download button, BUT:
- ❌ Direct URL access still works: `/badges/{id}/download/png`
- ❌ Previously downloaded baked badges don't show revoked status
- ❌ Badge image has no visual indicator of revocation

**Recommended Approach:**

**Option A: Block Download Endpoint (SIMPLEST)**
```typescript
@Get(':id/download/png')
async downloadBakedBadge(@Param('id') id: string) {
  const badge = await this.badgesService.findOne(id);
  
  if (badge.status === 'REVOKED') {
    throw new ForbiddenException('Cannot download revoked badge');
  }
  
  // ... existing logic ...
}
```

**Option B: Generate Revoked Badge Image (BETTER UX)**
```typescript
if (badge.status === 'REVOKED') {
  // Generate badge with red "REVOKED" overlay
  const revokedBadgeBuffer = await sharp(imageBuffer)
    .composite([{
      input: Buffer.from(`
        <svg width="400" height="100">
          <rect width="400" height="100" fill="rgba(255,0,0,0.8)" />
          <text x="200" y="60" text-anchor="middle" fill="white" 
                font-size="36" font-weight="bold">
            REVOKED
          </text>
        </svg>
      `),
      gravity: 'center'
    }])
    .png()
    .toBuffer();
    
  return revokedBadgeBuffer;
}
```

**Option C: Return Text File Instead of Image**
```typescript
if (badge.status === 'REVOKED') {
  response.setHeader('Content-Type', 'text/plain');
  response.send(`
    This badge has been revoked and is no longer valid.
    
    Badge: ${badge.template.name}
    Revoked on: ${badge.revokedAt}
    Reason: ${badge.revocationReason}
    
    For questions, contact: badges@gcredit.example.com
  `);
}
```

**💡 RECOMMENDED:** Implement Option A for Sprint 7 (MVP), consider Option B for Sprint 8+ (enhanced UX).

**ADR-007 Compliance:**
- ✅ Cache deletion on revocation still works (existing logic)
- ✅ Next download attempt generates new badge (or blocks download)
- ✅ No breaking changes to storage strategy

---

## Story 9.3: Badge Wallet UI

### Question 9: Frontend State Management - Revoked Badge Filtering

**Story Proposal:**
- Filter badges client-side (fetch all, filter in React)

**Architecture Assessment:**

⚠️ **CONCERN** - Scalability issue for employees with 100+ badges

**System Architecture Reference:**
[system-architecture.md Decision 4.1](../../architecture/system-architecture.md#decision-41-state-management-strategy) recommends TanStack Query for server state.

**Current Proposal (Story 9.3):**
```typescript
// Fetch all badges
const { data: badges } = useQuery(['my-badges'], fetchMyBadges);

// Client-side filtering
const activeBadges = badges.filter(b => b.status !== 'REVOKED');
const revokedBadges = badges.filter(b => b.status === 'REVOKED');
```

**Pros:**
- ✅ Simple implementation (no API changes)
- ✅ Fast filtering (no additional API calls)
- ✅ Works for MVP scale (employees have 5-20 badges)

**Cons:**
- ❌ Fetches all badges even if user only wants active badges
- ❌ Network payload grows with badge count (100 badges × 500 bytes = 50KB)
- ❌ No pagination support (future scalability issue)

**Recommended Approach:**

**Option A: API Query Parameter (RECOMMENDED)**
```typescript
// API endpoint supports filtering
GET /api/badges/my-badges?status=ACTIVE
GET /api/badges/my-badges?status=REVOKED
GET /api/badges/my-badges?status=ALL

// Backend implementation
async getMyBadges(userId: string, status?: BadgeStatus) {
  const where: any = { recipientId: userId };
  
  if (status === 'ACTIVE') {
    where.status = { in: ['PENDING', 'CLAIMED'] };
  } else if (status === 'REVOKED') {
    where.status = 'REVOKED';
  }
  // If status === 'ALL', no filter applied
  
  return this.prisma.badge.findMany({ where });
}
```

**Frontend:**
```typescript
function useMyBadges(statusFilter: 'ACTIVE' | 'REVOKED' | 'ALL') {
  return useQuery(['my-badges', statusFilter], 
    () => api.get('/badges/my-badges', { params: { status: statusFilter } })
  );
}
```

**Benefits:**
- ✅ Reduced network payload (only fetch needed badges)
- ✅ Database-level filtering (faster)
- ✅ Enables pagination later: `?status=ACTIVE&page=1&limit=20`
- ✅ Follows REST best practices (query parameters for filtering)

**Option B: Separate Endpoints (NOT RECOMMENDED)**
```typescript
GET /api/badges/my-badges/active
GET /api/badges/my-badges/revoked
```
- ❌ Less flexible (can't filter by other criteria)
- ❌ More code duplication

**💡 RECOMMENDED:** Implement Option A (query parameter) - modify Story 9.3 to include API change.

---

## Story 9.4: Revocation Notifications

### Question 10: Email Service Integration - EmailModule Capabilities

**Story Says:** "Use existing EmailModule"

**Architecture Assessment:**

✅ **APPROVED** - EmailService already supports required features

**Code Review:**
```typescript
// backend/src/common/email.service.ts exists
class EmailService {
  async sendMail(options: SendMailOptions): Promise<void>
  // Supports: to, subject, html, text
}
```

**Template Rendering Check:**
- ❌ **EmailService does NOT have built-in template engine**
- Story proposes Handlebars templates (`template: 'badge-revoked'`)
- Current implementation only accepts raw HTML strings

**Required Enhancement:**
```typescript
// Add template rendering to EmailService
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  
  constructor(private config: ConfigService) {
    // Load templates on startup
    this.loadTemplate('badge-revoked', 'email-templates/badge-revoked.hbs');
    this.loadTemplate('badge-issued', 'email-templates/badge-issued.hbs');
  }
  
  private loadTemplate(name: string, filePath: string): void {
    const templateSource = fs.readFileSync(
      path.join(__dirname, '../../', filePath), 
      'utf-8'
    );
    this.templates.set(name, Handlebars.compile(templateSource));
  }
  
  async sendTemplatedEmail(
    to: string, 
    templateName: string, 
    context: any
  ): Promise<void> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }
    
    const html = template(context);
    await this.sendMail({ to, subject: context.subject, html });
  }
}
```

**Async/Queue Support:**
- ❌ **EmailService is synchronous** (blocks revocation API response)
- Story requires async notification (AC1: "Email sent asynchronously")

**Required Enhancement:** Integrate with Bull queue (existing in system per architecture doc)

```typescript
// Add email queue processor
@Processor('notifications')
export class NotificationProcessor {
  constructor(private emailService: EmailService) {}
  
  @Process('badge-revoked-email')
  async handleBadgeRevokedEmail(job: Job<BadgeRevokedEmailDto>) {
    await this.emailService.sendTemplatedEmail(
      job.data.recipientEmail,
      'badge-revoked',
      job.data
    );
  }
}

// In badge revocation service
async revokeBadge(badgeId: string, userId: string, dto: RevokeBadgeDto) {
  // ... revoke badge ...
  
  // Queue email (non-blocking)
  await this.notificationQueue.add('badge-revoked-email', {
    recipientEmail: badge.recipient.email,
    recipientName: badge.recipient.name,
    badgeName: badge.template.name,
    revocationDate: badge.revokedAt,
    revocationReason: badge.revocationReason,
  });
}
```

**💡 RECOMMENDED:**
1. Add Handlebars template rendering to EmailService
2. Integrate email sending with Bull queue (notification queue)
3. Add Story 9.4 dependencies: Install `handlebars` package, create email template files

---

### Question 11: Notification Failure Handling - Transactional Consistency

**Story AC3 Says:** "Email failures logged but do not fail revocation operation"

**Architecture Assessment:**

✅ **APPROVED** - Correct approach for notification vs critical operations

**Analysis:**

**Current Approach (Story 9.4):**
```typescript
await this.revokeBadge(badgeId, userId, dto);

// Fire-and-forget email (failures logged, don't throw)
this.emailService.sendEmail(...).catch(err => {
  this.logger.error('Email failed', err);
});
```

**Transactional Consistency Question:** Should email failure rollback revocation?

**Answer: NO** - Revocation is critical business operation, email is notification

**Architecture Pattern: Saga Pattern (Eventual Consistency)**

```
┌─────────────────┐
│ 1. Revoke Badge │ ← CRITICAL (must succeed)
│    (Database)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Queue Email  │ ← BEST EFFORT (can retry)
│    (Bull Queue) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Send Email   │ ← EVENTUAL (retry 3x)
│    (SMTP/ACS)   │
└─────────────────┘
```

**Failure Scenarios:**

| Scenario | Badge Revoked? | Email Sent? | Correct Behavior |
|----------|---------------|-------------|------------------|
| Database success, queue success, email success | ✅ | ✅ | Happy path |
| Database success, queue success, email fails | ✅ | ❌ | Retry email (Bull retry logic) |
| Database success, queue fails | ✅ | ❌ | Log error, manual retry |
| Database fails | ❌ | ❌ | Return error to admin |

**Recommended Implementation:**
```typescript
async revokeBadge(badgeId: string, userId: string, dto: RevokeBadgeDto) {
  // 1. Critical operation (transactional)
  const badge = await this.prisma.$transaction(async (tx) => {
    const badge = await tx.badge.update({
      where: { id: badgeId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: userId,
        revocationReason: dto.reason,
        revocationNotes: dto.notes
      }
    });
    
    // Audit log also in transaction
    await tx.auditLog.create({
      data: { /* audit data */ }
    });
    
    return badge;
  });
  
  // 2. Non-critical notification (separate transaction)
  try {
    await this.notificationQueue.add('badge-revoked-email', {
      badgeId: badge.id,
      recipientEmail: badge.recipient.email,
      // ... other data
    }, {
      attempts: 3,  // Retry up to 3 times
      backoff: { type: 'exponential', delay: 5000 }
    });
  } catch (queueError) {
    // Queue failure logged but doesn't fail revocation
    this.logger.error('Failed to queue revocation email', queueError);
  }
  
  return badge;
}
```

**Monitoring Recommendations:**
- Alert on email delivery rate < 95%
- Dashboard: "Badges revoked but email not sent" (check queue failed jobs)
- Manual retry tool for failed notifications

**💡 APPROVED:** Story's approach is architecturally sound. Ensure Bull queue retry logic is configured.

---

## Story 9.5: Admin Revocation UI

### Question 12: API Endpoint Reuse - Single vs Separate Admin Endpoint

**Story Proposal:**
- Admin UI calls same `POST /badges/:id/revoke` endpoint as API users

**Architecture Assessment:**

✅ **APPROVED** - Single endpoint with role-based authorization is correct

**Analysis:**

**Single Endpoint Approach (Current):**
```typescript
POST /api/badges/:id/revoke
Authorization: Bearer <jwt>

// Works for:
- Admin revoking any badge
- Issuer revoking badge they issued
- (Future) Manager revoking team member badge
```

**Pros:**
- ✅ DRY (Don't Repeat Yourself) - single code path
- ✅ Consistent authorization logic
- ✅ Single audit log entry format
- ✅ Easier to test (one endpoint, multiple authorization scenarios)

**Cons:**
- ⚠️ Cannot differentiate admin-initiated vs issuer-initiated revocation (mitigation: check role in audit log)

**Alternative: Separate Admin Endpoint**
```typescript
POST /api/admin/badges/:id/revoke  // Admin only
POST /api/badges/:id/revoke        // Issuer only
```

**Cons:**
- ❌ Code duplication (same revocation logic)
- ❌ Risk of inconsistency (admin path gets features issuer path doesn't)
- ❌ More endpoints to maintain

**Recommendation: Single endpoint is correct**

**Role-Based Response Variation (Optional Enhancement):**
```typescript
// Admin gets extra details in response
{
  "success": true,
  "badge": { ... },
  "affectedUsers": 5,  // If badge was shared/endorsed
  "relatedBadges": []  // Other badges from same issuance batch
}

// Issuer gets basic response
{
  "success": true,
  "badge": { ... }
}
```

**Implementation:**
```typescript
@Post(':id/revoke')
@UseGuards(JwtAuthGuard, RevokePermissionGuard)  // Custom guard checks authorization
async revokeBadge(
  @Param('id') badgeId: string,
  @Body() dto: RevokeBadgeDto,
  @CurrentUser() user: User
) {
  const badge = await this.badgesService.revokeBadge(badgeId, user.id, dto);
  
  // Role-based response enrichment
  if (user.role === 'ADMIN') {
    const analytics = await this.badgesService.getRevocationImpact(badgeId);
    return { badge, ...analytics };
  }
  
  return { badge };
}
```

**💡 APPROVED:** Single endpoint with RBAC is architecturally sound and follows DRY principle.

---

## Summary of Architecture Concerns

### ✅ APPROVED (3)

1. **Database Schema Design (Q1):** 4 new fields are sufficient, minor recommendations for denormalization
2. **Notification Transactional Model (Q11):** Fire-and-forget email with retry is correct saga pattern
3. **Single API Endpoint (Q12):** Reusing endpoint with RBAC avoids duplication

### ⚠️ CONCERNS (6)

1. **Missing Database Index (Q1):** Add `@@index([revokedAt])` for admin reports
2. **Manager Authorization Gap (Q3):** No permission for managers to revoke team badges
3. **Non-Idempotent API (Q4):** Should return 200 OK when revoking already-revoked badge
4. **Open Badges 2.0 Compliance (Q6):** Revocation metadata placement not spec-compliant
5. **Scalability - Client-Side Filtering (Q9):** Will not scale beyond 100 badges per employee
6. **EmailService Missing Features (Q10):** No template rendering or async queue integration

### ❌ ARCHITECTURE VIOLATIONS (2)

1. **Inconsistent Status Model (Q2):** Story contradicts itself on using REVOKED enum vs revokedAt flag
2. **Missing AuditLog Infrastructure (Q5):** Story requires audit logging but no table exists in schema

### 💡 RECOMMENDED IMPROVEMENTS (4)

1. **RevocationReason Enum (Q1):** Use enum instead of free text for analytics and validation
2. **Baked Badge Revocation Handling (Q8):** Block download or add visual "REVOKED" overlay
3. **API Query Parameters (Q9):** Server-side filtering for better performance and scalability
4. **Separate Verification Endpoints (Q6):** Add `/assertion` endpoint returning 410 Gone for machine-readable verification

---

## Action Items

### Must Fix Before Sprint 7 Implementation

1. **[Story 9.1]** Resolve soft-delete pattern: Use REVOKED enum status (update story AC3)
2. **[Story 9.1]** Create AuditLog table (add to Prisma schema, update story estimate +1h)
3. **[Story 9.1]** Change API behavior: Return 200 OK (with flag) instead of 400 for already-revoked badges
4. **[Story 9.2]** Add `/badges/:id/assertion` endpoint returning 410 Gone (Open Badges 2.0 compliance)
5. **[Story 9.4]** Add template rendering to EmailService (Handlebars integration)
6. **[Story 9.4]** Connect email sending to Bull notification queue (async processing)

### Should Fix During Sprint 7

7. **[Story 9.1]** Add `revocationReason` as enum (create RevocationReason enum)
8. **[Story 9.1]** Add `revokedByName` denormalized field (audit trail preservation)
9. **[Story 9.1]** Add `@@index([revokedAt])` to Badge model
10. **[Story 9.3]** Modify `/badges/my-badges` endpoint to support `?status=ACTIVE|REVOKED|ALL` query parameter
11. **[Story 9.3]** Update BadgeWallet component to use API filtering instead of client-side filtering

### Consider for Sprint 8 (Post-MVP)

12. **[Story 9.1]** Implement RBAC permission system for revocation (REVOKE_OWN, REVOKE_TEAM, REVOKE_ANY)
13. **[Story 9.1]** Add manager revocation authorization (requires `managerId` relationship)
14. **[Story 9.2]** Add visual "REVOKED" overlay to baked badge images
15. **[Story 9.3]** Add pagination support to wallet API (`?page=1&limit=20`)

---

## Updated Story Estimates

| Story | Original | Updated | Reason |
|-------|----------|---------|--------|
| 9.1 - Revoke API | 5h | **7h** | +1h AuditLog table, +1h enum refactoring |
| 9.2 - Verification | 3h | **4h** | +1h separate `/assertion` endpoint |
| 9.3 - Wallet UI | 3h | **4h** | +1h API filtering implementation |
| 9.4 - Notifications | 2h | **4h** | +1h template engine, +1h queue integration |
| 9.5 - Admin UI | 4h | **4h** | No change |
| **Total** | **17h** | **23h** | **+6h** |

**Sprint Impact:** Epic 9 now requires 23 hours (2.9 days) instead of 17 hours (2.1 days).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AuditLog schema migration breaks existing code | Low | High | Create table in separate migration, test thoroughly |
| Open Badges 2.0 compliance issues with external validators | Medium | High | Test exported badges with Badgr.com and Credly validators |
| Email queue failures cause notification loss | Low | Medium | Monitor Bull queue, implement manual retry tool |
| Manager authorization scope creep | Medium | Low | Defer to Sprint 8, document as known limitation |
| Performance degradation with 100+ badges | Low | Medium | Implement API filtering (action item #10) |

---

## Architecture Decision Updates Required

### ADR-003: Badge Assertion Format

**Addition Required:**
```markdown
## Revocation Handling (Sprint 7)

Revoked badges follow Open Badges 2.0 hosted verification pattern:

1. **Assertion JSON does NOT include revoked field** (spec-compliant)
2. **Verification endpoint** (`/badges/:id/verify`) returns 200 OK with revocation metadata
3. **Assertion endpoint** (`/badges/:id/assertion`) returns 410 Gone for revoked badges
4. **Baked badges** embed original assertion (verifiers must check hosted URL for current status)

Example revoked assertion response (410 Gone):
\`\`\`json
{
  "@context": "https://w3id.org/openbadges/v2",
  "id": "https://gcredit.example.com/api/badges/{uuid}/assertion",
  "revoked": true,
  "revocationReason": "Policy Violation"
}
\`\`\`
```

### ADR-007: Baked Badge Storage

**Addition Required:**
```markdown
## Revocation Cache Invalidation (Sprint 7)

When badge is revoked:
1. Delete cached baked badge from Azure Blob Storage (`baked/{badgeId}-{verificationId}.png`)
2. Block `/badges/:id/download/png` endpoint (return 403 Forbidden)
3. Alternatively: Generate baked badge with visual "REVOKED" overlay (Sprint 8 enhancement)

Implementation:
\`\`\`typescript
async revokeBadge(badgeId: string, userId: string, dto: RevokeBadgeDto) {
  // ... revoke badge ...
  
  // Invalidate baked badge cache
  const bakedBadgeUrl = \`baked/\${badge.id}-\${badge.verificationId}.png\`;
  await this.storageService.deleteBlob('badges', bakedBadgeUrl);
}
\`\`\`
```

---

## Conclusion

Epic 9 introduces critical badge lifecycle functionality with mostly sound architectural patterns. The primary concerns are:

1. **Missing infrastructure** (AuditLog table, template rendering, queue integration)
2. **Specification compliance** (Open Badges 2.0 revocation handling)
3. **Scalability** (client-side filtering, lack of pagination)

**Recommendation:** Address "Must Fix" action items (1-6) before sprint kickoff. Implement "Should Fix" items (7-11) during sprint. Defer "Consider for Sprint 8" items (12-15) to technical debt backlog.

**Overall Risk Level:** ⚠️ **MEDIUM** - Story estimates should increase by 6 hours, but no architectural blockers prevent implementation.

**Sign-off:**
- ✅ Approved with conditions (see Action Items)
- ⚠️ Requires ADR updates for ADR-003 and ADR-007
- ⚠️ Requires schema changes beyond original story scope

---

**Reviewed by:** Amelia, Senior Software Architect  
**Date:** January 31, 2026  
**Next Review:** Post-Sprint 7 retrospective (validate revocation patterns in production)

---

## Appendix A: Prisma Schema Changes

**Recommended Final Schema:**

```prisma
model Badge {
  id               String           @id @default(uuid())
  templateId       String
  recipientId      String
  issuerId         String
  evidenceUrl      String?
  issuedAt         DateTime         @default(now())
  expiresAt        DateTime?
  status           BadgeStatus      @default(PENDING)
  claimToken       String?          @unique
  claimedAt        DateTime?
  
  // Revocation fields (Sprint 7)
  revokedAt        DateTime?
  revokedBy        String?
  revokedByName    String?          // Denormalized for audit trail
  revocationReason RevocationReason?
  revocationNotes  String?          @db.Text
  
  // Open Badges 2.0 fields
  assertionJson    Json
  recipientHash    String
  verificationId   String           @unique @default(uuid())
  metadataHash     String?
  
  template         BadgeTemplate    @relation(fields: [templateId], references: [id])
  recipient        User             @relation("BadgesReceived", fields: [recipientId], references: [id])
  issuer           User             @relation("BadgesIssued", fields: [issuerId], references: [id])
  revoker          User?            @relation("BadgesRevoked", fields: [revokedBy], references: [id])
  evidenceFiles    EvidenceFile[]
  shares           BadgeShare[]
  
  @@index([recipientId, status])
  @@index([templateId, issuedAt])
  @@index([claimToken])
  @@index([status, expiresAt])
  @@index([issuerId])
  @@index([verificationId])
  @@index([revokedAt])  // NEW: For admin reports
  @@index([recipientId, status, issuedAt(sort: Desc)], name: "idx_badges_timeline")
  @@map("badges")
}

enum BadgeStatus {
  PENDING
  CLAIMED
  REVOKED  // NEW
}

enum RevocationReason {
  POLICY_VIOLATION
  ISSUED_IN_ERROR
  EXPIRED
  EMPLOYEE_LEFT_ORGANIZATION
  OTHER
}

model AuditLog {
  id          String   @id @default(uuid())
  entityType  String   // "Badge", "User", "BadgeTemplate"
  entityId    String   // UUID of affected entity
  action      String   // "REVOKE_BADGE", "ISSUE_BADGE", etc.
  actorId     String
  actorName   String   // Denormalized
  metadata    Json     // Flexible JSONB
  createdAt   DateTime @default(now())
  
  actor       User     @relation("AuditActions", fields: [actorId], references: [id])
  
  @@index([entityType, entityId])
  @@index([actorId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_log")
}

model User {
  id               String      @id @default(uuid())
  email            String      @unique
  name             String
  role             UserRole
  // ... existing fields ...
  
  badgesReceived   Badge[]     @relation("BadgesReceived")
  badgesIssued     Badge[]     @relation("BadgesIssued")
  badgesRevoked    Badge[]     @relation("BadgesRevoked")  // NEW
  auditActions     AuditLog[]  @relation("AuditActions")   // NEW
  
  @@map("users")
}
```

---

**End of Architecture Review**
