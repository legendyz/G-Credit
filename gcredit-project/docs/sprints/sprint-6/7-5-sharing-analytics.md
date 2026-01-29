# Story 7.5: Sharing Analytics

Status: **ready-for-dev** 🔵  
Priority: **MEDIUM** (Required by Stories 7.2, 7.3, 7.4)

## Story

As a badge issuer,
I want to track how badges are shared,
so that I can measure engagement and the reach of our credentials.

## Acceptance Criteria

1. [ ] BadgeShare table created and migrated to database
2. [ ] Email shares recorded (platform='email', recipientEmail, sharedAt)
3. [ ] Teams shares recorded (platform='teams', metadata with team/channel IDs)
4. [ ] Widget embeds recorded (platform='widget', metadata with referrer URL)
5. [ ] Badge detail page shows share counts by platform
6. [ ] Badge detail page shows share history (last 10 shares)
7. [ ] Only badge owner/issuer can view analytics
8. [ ] API endpoints tested and documented

## Tasks / Subtasks

### Database Schema

- [ ] **Task 1: Create BadgeShare Table** (AC: #1)
  - [ ] Create Prisma migration: `add_badge_share_table`
  - [ ] Define BadgeShare model in schema.prisma:
    ```prisma
    model BadgeShare {
      id             String   @id @default(uuid())
      badgeId        String
      badge          Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
      
      platform       String   // 'email', 'teams', 'widget'
      sharedAt       DateTime @default(now())
      sharedBy       String   // User ID who shared (optional for widget)
      
      // Platform-specific metadata
      recipientEmail String?  // For email shares
      metadata       Json?    // For Teams (team/channel), Widget (referrer URL)
      
      @@index([badgeId, platform])
      @@index([sharedAt])
      @@map("badge_shares")
    }
    ```
  - [ ] Add `shares BadgeShare[]` relation to Badge model
  - [ ] Run `npx prisma migrate dev --name add_badge_share_table`
  - [ ] Verify migration in database

### Backend Implementation

- [ ] **Task 2: Badge Analytics Service** (AC: #2-4, #6)
  - [ ] Create `BadgeAnalyticsService` in badge-sharing module
  - [ ] Implement `recordShare(badgeId, platform, userId, metadata)` method
  - [ ] Implement `getShareStats(badgeId)` method (returns counts by platform)
  - [ ] Implement `getShareHistory(badgeId, limit)` method (returns recent shares)
  - [ ] Add authorization checks (only badge owner/issuer can view)
  - [ ] Unit tests with mocked Prisma client

- [ ] **Task 3: Integrate with Story 7.2 (Email)** (AC: #2)
  - [ ] Update `BadgeSharingService.shareViaEmail()` to call `recordShare()`
  - [ ] Pass `platform='email'`, `recipientEmail` in metadata
  - [ ] Replace TODO comment with actual implementation
  - [ ] Unit tests verify recordShare is called

- [ ] **Task 4: Integrate with Story 7.4 (Teams)** (AC: #3)
  - [ ] Update `TeamsSharingController.shareToTeams()` to call `recordShare()`
  - [ ] Pass `platform='teams'`, team/channel IDs in metadata
  - [ ] Unit tests verify recordShare is called

- [ ] **Task 5: Integrate with Story 7.3 (Widget)** (AC: #4)
  - [ ] Update widget embed endpoint to call `recordShare()`
  - [ ] Pass `platform='widget'`, referrer URL in metadata (if available)
  - [ ] Anonymous shares allowed (sharedBy can be null)
  - [ ] Unit tests verify recordShare is called

- [ ] **Task 6: Analytics API Endpoints** (AC: #5, #6, #7, #8)
  - [ ] Create `GET /api/badges/:badgeId/analytics/shares` endpoint
    - Returns: `{ total, byPlatform: { email: 5, teams: 3, widget: 12 } }`
    - Authorization: JWT required, badge owner or issuer only
  - [ ] Create `GET /api/badges/:badgeId/analytics/shares/history` endpoint
    - Query params: `?limit=10`
    - Returns: Array of share records with timestamps
    - Authorization: JWT required, badge owner or issuer only
  - [ ] Add Swagger documentation for both endpoints
  - [ ] Controller tests with mocked service

### Frontend Implementation

- [ ] **Task 7: Analytics Display on Badge Detail** (AC: #5, #6)
  - [ ] Add "Share Analytics" section to Badge Detail Modal
  - [ ] Display share counts by platform (Email: 5, Teams: 3, Widget: 12)
  - [ ] Display share history timeline (last 10 shares)
  - [ ] Format timestamps in user-friendly format
  - [ ] Only show if user is badge owner or issuer
  - [ ] Loading state while fetching analytics

- [ ] **Task 8: Admin Analytics Page (Optional)** 
  - [ ] Create `/admin/analytics` page
  - [ ] Show aggregate analytics across all badges
  - [ ] Most shared badges (top 10)
  - [ ] Platform distribution pie chart
  - [ ] Only accessible by ADMIN role

### Testing

- [ ] **Task 9: Unit Tests** (AC: #8)
  - [ ] BadgeAnalyticsService tests (recordShare, getShareStats, getShareHistory)
  - [ ] Authorization tests (owner/issuer can view, others cannot)
  - [ ] Badge sharing integration tests (7.2, 7.3, 7.4 call recordShare)
  - [ ] Achieve >80% test coverage

- [ ] **Task 10: Integration Tests** (AC: #1-4)
  - [ ] Test database migration successful
  - [ ] Test recordShare creates records in database
  - [ ] Test getShareStats returns correct counts
  - [ ] Test getShareHistory returns correct records
  - [ ] Test authorization (403 for unauthorized users)

- [ ] **Task 11: E2E Tests** (AC: #5, #6)
  - [ ] Share badge via email → Verify analytics updated
  - [ ] Share badge via Teams → Verify analytics updated
  - [ ] Embed widget → Verify analytics updated
  - [ ] View badge detail → Verify analytics displayed correctly

## Dev Notes

### Architecture Patterns to Use

- **Service Layer**: `BadgeAnalyticsService` handles all analytics logic
- **Database Relations**: BadgeShare → Badge (many-to-one)
- **Authorization**: Row-level security (only owner/issuer can view)
- **Metadata Storage**: JSON column for platform-specific data
- **Indexing**: Index on `badgeId + platform` for fast queries

### Suggested Source Tree Structure

```
backend/src/badge-sharing/
├── badge-sharing.service.ts         # Add recordShare() calls
├── services/
│   └── badge-analytics.service.ts   # NEW: Analytics logic
│   └── badge-analytics.service.spec.ts
└── controllers/
    └── badge-analytics.controller.ts # NEW: Analytics endpoints
    └── badge-analytics.controller.spec.ts

backend/prisma/
├── schema.prisma                     # Add BadgeShare model
└── migrations/
    └── XXXXXX_add_badge_share_table/ # NEW: Migration

frontend/src/
├── components/
│   └── badge/
│       └── BadgeAnalytics.tsx        # NEW: Analytics display
└── pages/
    └── admin/
        └── AnalyticsPage.tsx         # OPTIONAL: Admin analytics
```

### Database Schema Details

**BadgeShare Table**:
- `id`: UUID primary key
- `badgeId`: Foreign key to Badge (with CASCADE delete)
- `platform`: Enum-like string ('email', 'teams', 'widget')
- `sharedAt`: Timestamp (auto-generated)
- `sharedBy`: User ID (nullable for anonymous widget embeds)
- `recipientEmail`: Email address (only for email platform)
- `metadata`: JSON (flexible storage for platform-specific data)

**Indexes**:
- `(badgeId, platform)`: Fast queries for share counts by platform
- `(sharedAt)`: Fast queries for recent shares

**Example Data**:
```json
// Email share
{
  "id": "abc-123",
  "badgeId": "badge-456",
  "platform": "email",
  "sharedAt": "2026-01-30T10:30:00Z",
  "sharedBy": "user-789",
  "recipientEmail": "john@example.com",
  "metadata": null
}

// Teams share
{
  "id": "def-456",
  "badgeId": "badge-456",
  "platform": "teams",
  "sharedAt": "2026-01-30T11:00:00Z",
  "sharedBy": "user-789",
  "recipientEmail": null,
  "metadata": {
    "teamId": "team-123",
    "channelId": "channel-456",
    "channelName": "General"
  }
}

// Widget embed
{
  "id": "ghi-789",
  "badgeId": "badge-456",
  "platform": "widget",
  "sharedAt": "2026-01-30T12:00:00Z",
  "sharedBy": null, // Anonymous
  "recipientEmail": null,
  "metadata": {
    "referrerUrl": "https://johndoe.com/portfolio"
  }
}
```

### Testing Standards

- **Unit Tests**: Mock Prisma client, test analytics logic in isolation
- **Integration Tests**: Use test database, verify records created/queried
- **Coverage**: >80% for analytics service and controllers
- **Authorization**: Test 403 responses for unauthorized users

### Project Structure Notes

**Alignment:**
- ✅ Analytics service in `badge-sharing/services/` (not a separate module)
- ✅ Analytics controller in `badge-sharing/controllers/`
- ✅ Reuses existing authorization guards (JwtAuthGuard)
- ✅ Follows REST conventions (`/badges/:id/analytics/shares`)

**Key Design Decisions**:
- Analytics in `badge-sharing` module (not separate `analytics` module)
- JSON metadata column for flexibility (avoid adding columns per platform)
- BadgeShare records are NOT deleted when badge is deleted (CASCADE for audit trail)
- Anonymous widget embeds allowed (sharedBy can be null)

### API Response Examples

**GET /api/badges/:id/analytics/shares**:
```json
{
  "badgeId": "badge-456",
  "total": 20,
  "byPlatform": {
    "email": 8,
    "teams": 7,
    "widget": 5
  }
}
```

**GET /api/badges/:id/analytics/shares/history?limit=5**:
```json
{
  "badgeId": "badge-456",
  "shares": [
    {
      "id": "share-1",
      "platform": "teams",
      "sharedAt": "2026-01-30T14:30:00Z",
      "sharedBy": "user-123",
      "metadata": { "channelName": "Engineering" }
    },
    {
      "id": "share-2",
      "platform": "email",
      "sharedAt": "2026-01-30T13:00:00Z",
      "sharedBy": "user-123",
      "recipientEmail": "jane@example.com"
    }
  ]
}
```

### References

- **Epic Details**: [backlog.md](backlog.md) Lines 600-750 (Story 7.5 specification)
- **Prisma Migrations**: [Prisma Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- **JSON Columns**: [Prisma JSON Type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)
- **Architecture**: [API Guidelines](../../architecture/api-guidelines.md)

## Dev Agent Record

### Agent Model Used

**Agent**: TBD (Amelia or assigned dev)  
**Model**: TBD

### Implementation Status

**Status**: 🔵 **READY FOR DEV**

**Dependencies**:
- ✅ Story 7.2 (Email Sharing) - Complete, needs integration
- 🔴 Story 7.3 (Widget Embedding) - Not implemented yet
- ✅ Story 7.4 (Teams Notifications) - Complete, needs integration

**Estimated Effort**: 4-6 hours
- Task 1-2: Database + Service (2 hours)
- Task 3-5: Integration with Stories 7.2, 7.4 (1 hour)
- Task 6: API Endpoints (1 hour)
- Task 7-8: Frontend (1 hour)
- Task 9-11: Testing (1-2 hours)

**Blocking Issues**: None

**Technical Considerations**:
- Story 7.3 integration (Task 5) can be skipped if Story 7.3 is not implemented
- Admin analytics page (Task 8) is optional and can be deferred
- Consider using transaction when recording shares to ensure consistency

### File List

**Not Yet Created** - No files exist for this story.

**Files to Create**:
- `backend/prisma/migrations/XXXXXX_add_badge_share_table/migration.sql`
- `backend/src/badge-sharing/services/badge-analytics.service.ts`
- `backend/src/badge-sharing/services/badge-analytics.service.spec.ts`
- `backend/src/badge-sharing/controllers/badge-analytics.controller.ts`
- `backend/src/badge-sharing/controllers/badge-analytics.controller.spec.ts`
- `frontend/src/components/badge/BadgeAnalytics.tsx` (optional)

**Files to Update**:
- `backend/prisma/schema.prisma` (add BadgeShare model)
- `backend/src/badge-sharing/badge-sharing.service.ts` (add recordShare calls)
- `backend/src/badge-sharing/badge-sharing.module.ts` (register analytics service)
- `backend/src/badge-sharing/controllers/teams-sharing.controller.ts` (add recordShare calls)

---

## Implementation Notes

**Story 7.5 is a PREREQUISITE for complete Sprint 6 functionality:**
- Stories 7.2 and 7.4 have TODO comments: "Record share event in analytics (Story 7.5)"
- Without this story, share tracking is incomplete
- Analytics provide business value for measuring badge engagement

**Implementation Order**:
1. **First**: Create database migration and BadgeShare table
2. **Second**: Implement BadgeAnalyticsService
3. **Third**: Integrate with Stories 7.2 and 7.4 (remove TODO comments)
4. **Fourth**: Add API endpoints
5. **Fifth**: Add frontend display (optional but recommended)
6. **Last**: Integration and E2E tests

**Story File Creation:**
This file was created on **January 30, 2026** by Bob (Scrum Master) to prepare for remaining Sprint 6 work.
