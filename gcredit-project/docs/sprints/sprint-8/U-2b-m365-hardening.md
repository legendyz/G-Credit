# Story U.2b: M365 User Sync - Production Hardening

**Story ID:** Story U.2b  
**Epic:** M365 Integration  
**Sprint:** Sprint 8  
**Priority:** MEDIUM  
**Story Points:** 6  
**Status:** Sprint 8 Backlog  
**Created:** February 1, 2026 (Split from Story U.2 during Technical Review)

---

## Context

Story U.2a (Sprint 7) delivered MVP M365 user sync with:
- ✅ Basic sync for <100 users
- ✅ .env-based role mapping (security fix)
- ✅ Production guard
- ✅ Local mode fallback

This story adds production-grade features deferred from Sprint 7:
- Pagination for 1000+ user organizations
- Retry logic with exponential backoff
- Audit logging
- User deactivation sync
- Comprehensive error recovery

**Reference:** Sprint 7 Technical Review Meeting Minutes, Decision #12-13

---

## User Story

**As a** System Administrator,  
**I want** production-grade M365 user sync with pagination and retry logic,  
**So that** the system can handle large organizations (1000+ users) reliably.

---

## Acceptance Criteria

### AC1: Pagination Support for Large Organizations
**Given** the organization has 1000+ users in M365  
**When** I run the M365 sync command  
**Then** the system fetches all users using pagination

**Implementation:**
```typescript
async getAllUsers(): Promise<GraphUser[]> {
  let allUsers: GraphUser[] = [];
  let nextLink: string | null = '/users?$top=100&$select=id,mail,displayName,jobTitle';

  while (nextLink) {
    const response = await this.graphClient
      .api(nextLink)
      .get();

    allUsers = allUsers.concat(response.value);
    nextLink = response['@odata.nextLink'] || null;

    // Progress logging
    this.logger.log(`Fetched ${allUsers.length} users so far...`);
  }

  return allUsers;
}
```

**Test Scenarios:**
- [ ] Organization with 50 users (single page)
- [ ] Organization with 250 users (3 pages)
- [ ] Organization with 1500 users (15 pages)
- [ ] Verify all users are synced (no data loss)

### AC2: Retry Logic with Exponential Backoff (ADR-008 Compliance)
**Given** the M365 API returns a transient error (429 Too Many Requests, 503 Service Unavailable)  
**When** the sync command is running  
**Then** the system retries with exponential backoff

**Retry Strategy:**
- Max retries: 3
- Initial delay: 1 second
- Backoff multiplier: 2x
- Max delay: 30 seconds
- Retry on: 429, 500, 503, network errors

**Implementation:**
```typescript
async fetchWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRetryable = 
        error.statusCode === 429 || 
        error.statusCode === 503 || 
        error.statusCode >= 500;

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      this.logger.warn(
        `M365 API error (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Test Scenarios:**
- [ ] Simulate 429 error (rate limit) - should retry 3 times
- [ ] Simulate 503 error (service unavailable) - should retry 3 times
- [ ] Simulate 400 error (bad request) - should NOT retry
- [ ] Verify exponential backoff delays (1s, 2s, 4s)

### AC3: Audit Logging
**Given** I am running M365 user sync  
**When** the sync completes (success or failure)  
**Then** the system logs audit information

**Audit Log Schema:**
```prisma
model M365SyncLog {
  id            String   @id @default(uuid())
  syncedAt      DateTime @default(now())
  syncedBy      String   // User who triggered sync (or 'SYSTEM')
  usersAdded    Int
  usersUpdated  Int
  usersFailed   Int
  totalUsers    Int
  durationMs    Int
  status        String   // 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED'
  errorMessage  String?
  metadata      Json?    // { apiVersion, retryCount, paginationPages }
}
```

**Logged Information:**
- Who triggered the sync (admin user ID or 'SYSTEM' for cron job)
- When sync started and ended
- How many users added/updated/failed
- Total duration in milliseconds
- Any errors encountered
- Metadata (API version, retry count, pagination details)

**Test Scenarios:**
- [ ] Successful sync with 50 users - verify log entry
- [ ] Partial success (45/50 users) - verify failed count
- [ ] Complete failure - verify error message logged

### AC4: User Deactivation Sync
**Given** a user exists in GCredit but not in M365 (deleted/deactivated)  
**When** I run M365 sync  
**Then** the user is marked as inactive in GCredit

**Implementation:**
```typescript
async syncUserDeactivations(m365Users: GraphUser[]): Promise<number> {
  const m365Emails = new Set(m365Users.map(u => u.mail));
  const localUsers = await this.userService.findAll();

  let deactivatedCount = 0;

  for (const localUser of localUsers) {
    if (!m365Emails.has(localUser.email) && localUser.isActive) {
      await this.userService.deactivate(localUser.id);
      this.logger.warn(
        `Deactivated user ${localUser.email} (no longer in M365)`,
      );
      deactivatedCount++;
    }
  }

  return deactivatedCount;
}
```

**Test Scenarios:**
- [ ] User deleted from M365 → deactivated in GCredit
- [ ] User still in M365 → remains active in GCredit
- [ ] New user in M365 → created as active in GCredit
- [ ] Deactivated users cannot log in
- [ ] Deactivated users' badges remain valid (not revoked automatically)

**Business Rules:**
- Deactivation does NOT revoke badges (manual decision required)
- Deactivated users cannot issue new badges
- Deactivated users' issued badges remain valid

### AC5: Comprehensive Error Recovery
**Given** M365 sync encounters errors during bulk processing  
**When** some users fail to sync  
**Then** the system continues processing remaining users

**Error Recovery Strategy:**
- Process users one-by-one (not bulk transaction)
- Catch errors per user, log, continue
- Return summary: `{ success: 45, failed: 5, errors: [...] }`
- Do NOT rollback successful users if later users fail

**Implementation:**
```typescript
async syncUsers(): Promise<SyncResult> {
  const m365Users = await this.getAllUsers(); // With pagination
  const result: SyncResult = { added: 0, updated: 0, failed: 0, errors: [] };

  for (const m365User of m365Users) {
    try {
      const existing = await this.userService.findByEmail(m365User.mail);
      if (existing) {
        await this.updateUser(existing.id, m365User);
        result.updated++;
      } else {
        await this.createUser(m365User);
        result.added++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        email: m365User.mail,
        error: error.message,
      });
      this.logger.error(`Failed to sync user ${m365User.mail}: ${error.message}`);
      // Continue to next user (do not throw)
    }
  }

  return result;
}
```

**Test Scenarios:**
- [ ] 50 users, 5 have invalid data → 45 synced, 5 failed
- [ ] Database constraint violation on 1 user → 49 synced, 1 failed
- [ ] M365 API error mid-sync → already-synced users remain in DB

---

## Technical Details

### Database Schema Update

Add M365SyncLog table:

```prisma
model M365SyncLog {
  id           String   @id @default(uuid())
  syncDate     DateTime @default(now())
  syncType     String   @default("FULL") // 'FULL' | 'INCREMENTAL'
  userCount    Int      // Total users in M365
  syncedCount  Int      // Successfully synced users
  createdCount Int      @default(0) // New users created
  updatedCount Int      @default(0) // Existing users updated
  status       String   // 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE'
  errorMessage String?  @db.Text
  durationMs   Int?     // Sync duration in milliseconds
  createdAt    DateTime @default(now())

  @@map("m365_sync_logs")
  @@index([syncDate])
  @@index([status])
}
```

Add User.isActive field:

```prisma
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String
  role       Role
  isActive   Boolean  @default(true) // NEW FIELD
  azureId    String?  @unique
  // ... rest of fields
  
  @@index([isActive])  // NEW INDEX
}
```

### CLI Command Enhancement

```typescript
@Command({
  name: 'sync:m365',
  description: 'Sync users from M365 with production-grade features',
})
export class M365SyncCommand {
  async run(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('Starting M365 user sync...');

    try {
      // Fetch with pagination + retry
      const m365Users = await this.graphService.getAllUsers();
      this.logger.log(`Fetched ${m365Users.length} users from M365`);

      // Sync users with error recovery
      const syncResult = await this.syncUsers(m365Users);

      // Sync deactivations
      const deactivated = await this.syncUserDeactivations(m365Users);

      // Audit logging
      const durationMs = Date.now() - startTime;
      await this.logSync({
        syncedBy: 'CLI_USER',
        ...syncResult,
        deactivated,
        durationMs,
        status: syncResult.failed === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
      });

      this.logger.log(
        `Sync complete: ${syncResult.added} added, ${syncResult.updated} updated, ` +
        `${deactivated} deactivated, ${syncResult.failed} failed`,
      );
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`);
      await this.logSync({
        syncedBy: 'CLI_USER',
        durationMs: Date.now() - startTime,
        status: 'FAILED',
        errorMessage: error.message,
      });
      throw error;
    }
  }
}
```

---

## Definition of Done

- [ ] Pagination implemented and tested with 1000+ users
- [ ] Retry logic with exponential backoff implemented
- [ ] M365SyncLog table created (Prisma migration)
- [ ] User.isActive field added (Prisma migration)
- [ ] Audit logging implemented for all sync operations
- [ ] User deactivation sync implemented
- [ ] Comprehensive error recovery implemented
- [ ] All test scenarios pass
- [ ] Integration tests with mock M365 API
- [ ] Manual testing with real M365 test tenant
- [ ] ADR-008 updated (retry logic compliance)
- [ ] Code committed to `sprint-8/m365-hardening` branch
- [ ] PR reviewed and merged

---

## Dependencies

**Depends On:**
- Story U.2a (M365 MVP) - Must be implemented first

**Blocks:**
- None (enhancement, not blocking critical features)

---

## Risks & Considerations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large org sync timeout | Medium | Pagination + progress logging |
| M365 API rate limits | High | Retry logic with exponential backoff |
| Database deadlock during bulk sync | Medium | Process users sequentially (not parallel) |
| Accidental user deactivation | High | Require confirmation, audit logging |

---

## Estimate Breakdown

| Task | Time |
|------|------|
| Pagination implementation | 1.5h |
| Retry logic with exponential backoff | 1.5h |
| M365SyncLog table + migration | 0.5h |
| Audit logging implementation | 1h |
| User deactivation sync | 1h |
| Error recovery strategy | 0.5h |
| Unit + integration tests | 1.5h |
| Manual testing with real M365 tenant | 1h |
| **Total** | **8.5h (~6 SP)** |

---

## Testing Strategy

### Unit Tests
- Pagination logic (mock API responses)
- Retry logic (simulate 429, 503 errors)
- Deactivation logic (user not in M365 list)
- Error recovery (per-user failure handling)

### Integration Tests
- Full sync with mock M365 API (100 users)
- Pagination test (300 users, 3 pages)
- Retry test (mock transient errors)
- Audit log verification

### Manual Tests
- Real M365 test tenant (10-20 users)
- Verify audit logs in database
- Verify deactivated users cannot log in
- Performance test (500+ users, measure duration)

---

## Future Enhancements (Technical Debt)

1. **Incremental Sync (Delta Query):**
   - Use M365 Delta Query API
   - Only sync changed users (not full sync)
   - Reduces API calls by 90%+
   - Ticket: Create in Sprint 10+

2. **Scheduled Cron Job:**
   - Daily automated sync (3 AM)
   - NestJS cron integration
   - Admin UI to view sync history
   - Ticket: Create in Sprint 9+

3. **Admin UI for Sync Logs:**
   - View M365SyncLog table in Admin Dashboard
   - Filter by date, status, user count
   - Retry failed syncs manually
   - Ticket: Create in Sprint 10+

4. **User Re-Activation:**
   - Re-activate deactivated users if they return to M365
   - Admin approval workflow
   - Ticket: Create in Sprint 9+

---

## References

- Story U.2a: M365 User Sync (MVP) - Sprint 7
- Sprint 7 Technical Review Meeting Minutes (Feb 1, 2026)
- ADR-008: Microsoft Graph API Integration
- Architecture Review: `architecture-review-story-u2.md`
- [Microsoft Graph Pagination Documentation](https://learn.microsoft.com/en-us/graph/paging)
- [Microsoft Graph Best Practices - Retry Logic](https://learn.microsoft.com/en-us/graph/best-practices-concept#handling-expected-errors)

---

**Created By:** Bob (Scrum Master)  
**Date:** February 1, 2026  
**Reason:** Split from Story U.2 during Sprint 7 Technical Review (Decision #12-13)
