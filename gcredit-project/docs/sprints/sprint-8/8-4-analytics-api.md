# Story 8.4: Basic Analytics API

**Story ID:** Story 8.4  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** MEDIUM  
**Story Points:** 3  
**Estimated Hours:** 5h  
**Status:** backlog  
**Created:** 2026-02-02

---

## Context

Admin Dashboard (Story 8.1) needs backend API endpoints to display key metrics. This story implements foundational analytics endpoints for system overview and reporting.

**Future Scope (Sprint 9+):**
- Advanced analytics (trend analysis, skill gap analysis)
- Data visualization (charts, graphs)
- Export to Excel/PDF

**Reference:** PRD FR-23 (Analytics & Reporting), Story 8.1 (Dashboard API requirements)

**Caching Implementation:**
- Uses @nestjs/cache-manager (install required: `npm install @nestjs/cache-manager cache-manager`)
- Cache TTL: 900 seconds (15 minutes)
- Cache key format: `analytics:{endpoint}:{userId}:{queryParams}`
- Invalidation: On badge issuance/revocation, user updates

---

## User Story

**As an** Admin,  
**I want** API endpoints that provide system-wide metrics and statistics,  
**So that** I can monitor platform health and usage from the dashboard.

---

## Acceptance Criteria

### AC1: System Overview API
**Given** I am an Admin  
**When** I call `GET /api/analytics/system-overview`  
**Then** I receive:

```json
{
  "users": {
    "total": 450,
    "activeThisMonth": 320,
    "newThisMonth": 25,
    "byRole": {
      "ADMIN": 5,
      "ISSUER": 20,
      "MANAGER": 45,
      "EMPLOYEE": 380
    }
  },
  "badges": {
    "totalIssued": 1234,
    "claimedCount": 1015,
    "pendingCount": 189,
    "revokedCount": 30,
    "claimRate": 0.82
  },
  "badgeTemplates": {
    "total": 23,
    "active": 18,
    "draft": 3,
    "archived": 2
  },
  "systemHealth": {
    "status": "healthy",
    "lastSync": "2026-02-02T09:00:00Z",
    "apiResponseTime": "120ms"
  }
}
```

**Authorization:**
- Only ADMIN role can access
- Returns 403 for other roles

### AC2: Badge Issuance Trends API
**Given** I am an Admin or Issuer  
**When** I call `GET /api/analytics/issuance-trends?period=30`  
**Then** I receive daily/weekly/monthly badge issuance statistics:

```json
{
  "period": "last30days",
  "startDate": "2026-01-03",
  "endDate": "2026-02-02",
  "dataPoints": [
    {
      "date": "2026-01-03",
      "issued": 15,
      "claimed": 12,
      "revoked": 0
    },
    {
      "date": "2026-01-04",
      "issued": 20,
      "claimed": 18,
      "revoked": 1
    }
    // ...30 data points
  ],
  "totals": {
    "issued": 456,
    "claimed": 380,
    "revoked": 8,
    "claimRate": 0.83
  }
}
```

**Query Parameters:**
- `period`: `7` (last 7 days), `30` (last 30 days), `90`, `365`
- `issuerId`: (optional) Filter by specific issuer (Admin only)

### AC3: Top Performers API
**Given** I am a Manager  
**When** I call `GET /api/analytics/top-performers?teamId={id}&limit=10`  
**Then** I receive ranked list of team members by badge count:

```json
{
  "teamId": "uuid",
  "teamName": "Engineering Team",
  "period": "allTime",
  "topPerformers": [
    {
      "userId": "uuid",
      "name": "Jane Smith",
      "badgeCount": 15,
      "latestBadge": {
        "templateName": "Python Expert",
        "claimedAt": "2026-02-01T10:00:00Z"
      }
    },
    // ...up to 10 performers
  ]
}
```

**Authorization:**
- Manager can only see their own team
- Admin can see all teams

### AC4: Skills Distribution API
**Given** I am an Admin  
**When** I call `GET /api/analytics/skills-distribution`  
**Then** I receive aggregated skills data:

```json
{
  "totalSkills": 45,
  "topSkills": [
    {
      "skillId": "uuid",
      "skillName": "Python",
      "badgeCount": 120,
      "employeeCount": 85
    },
    {
      "skillId": "uuid",
      "skillName": "Leadership",
      "badgeCount": 95,
      "employeeCount": 72
    }
    // ...top 20 skills
  ],
  "skillsByCategory": {
    "Technical": 180,
    "Soft Skills": 95,
    "Leadership": 60
  }
}
```

### AC5: Recent Activity Feed API
**Given** I am an Admin  
**When** I call `GET /api/analytics/recent-activity?limit=20`  
**Then** I receive system-wide activity log:

```json
{
  "activities": [
    {
      "id": "uuid",
      "type": "BADGE_ISSUED",
      "actor": {
        "userId": "uuid",
        "name": "John Issuer"
      },
      "target": {
        "userId": "uuid",
        "name": "Jane Recipient",
        "badgeTemplateName": "Python Expert"
      },
      "timestamp": "2026-02-02T09:30:00Z"
    },
    {
      "type": "TEMPLATE_CREATED",
      "actor": {...},
      "templateName": "New Badge",
      "timestamp": "2026-02-02T09:00:00Z"
    }
    // ...up to 20 activities
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1250
  }
}
```

**Activity Types:**
- `BADGE_ISSUED`, `BADGE_CLAIMED`, `BADGE_REVOKED`
- `TEMPLATE_CREATED`, `USER_REGISTERED`

---

## Caching Implementation

### Setup (Task 8.0 dependency)
```bash
# Install cache manager (Task 8.0)
npm install @nestjs/cache-manager cache-manager
```

### Module Configuration
```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 900, // 15 minutes (900 seconds)
      max: 100, // Maximum 100 items in cache
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### Controller with Caching
```typescript
// analytics.controller.ts
import { Controller, Get, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(CacheInterceptor)
export class AnalyticsController {
  
  @Get('system-overview')
  @Roles(Role.ADMIN)
  @CacheKey('analytics:system-overview')
  @CacheTTL(900) // 15 minutes
  async getSystemOverview() {
    return this.analyticsService.getSystemOverview();
  }
  
  // Other endpoints similarly cached...
}
```

### Cache Invalidation
```typescript
// badge.service.ts
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export class BadgeService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async issueBadge(dto: IssueBadgeDto) {
    const badge = await this.prisma.badge.create({ data: dto });
    
    // Invalidate analytics cache
    await this.cache.del('analytics:system-overview');
    await this.cache.del('analytics:badge-trends');
    
    return badge;
  }
}
```

**Cache Strategy:**
- Key format: `analytics:{endpoint}:{userId}:{queryParams}`
- TTL: 900 seconds (15 minutes)
- Invalidation triggers: Badge issuance, revocation, user updates

---

## Tasks / Subtasks

### Task 1: Analytics Module Setup - 0.5h
- [ ] Create `src/analytics/analytics.module.ts`
- [ ] Import CacheModule
- [ ] Create `src/analytics/analytics.controller.ts`
- [ ] Create `src/analytics/analytics.service.ts`
- [ ] Register module in `app.module.ts`
- [ ] Add Swagger tags: `@ApiTags('analytics')`

### Task 2: System Overview API (AC1) - 1h
- [ ] Implement `GET /api/analytics/system-overview`
  - [ ] Query user counts (total, active, by role)
  - [ ] Query badge statistics (issued, claimed, pending, revoked)
  - [ ] Query badge template counts (total, active, draft)
  - [ ] Add system health (mock for MVP, real in production)
- [ ] Add ADMIN role guard
- [ ] Write unit tests (5 tests: happy path, auth, data aggregation)
- [ ] Write E2E test (1 test)
- [ ] Add Swagger documentation

### Task 3: Issuance Trends API (AC2) - 1.5h
- [ ] Implement `GET /api/analytics/issuance-trends`
  - [ ] Query badges grouped by issue date
  - [ ] Support period query param (7, 30, 90, 365 days)
  - [ ] Calculate claim rate
  - [ ] Optional issuerId filter (Admin only)
- [ ] Add role guards (ADMIN + ISSUER)
- [ ] Write unit tests (6 tests: periods, filtering, auth)
- [ ] Write E2E test (2 tests)
- [ ] Add Swagger documentation

### Task 4: Top Performers API (AC3) - 1h
- [ ] Implement `GET /api/analytics/top-performers`
  - [ ] Query user badge counts
  - [ ] Filter by teamId (Manager) or all (Admin)
  - [ ] Order by badge count DESC
  - [ ] Include latest badge details
  - [ ] Limit to top N (default 10)
- [ ] Add role guards (MANAGER + ADMIN)
- [ ] Authorization logic (Manager sees own team only)
- [ ] Write unit tests (5 tests: ranking, auth, team filtering)
- [ ] Write E2E test (2 tests)
- [ ] Add Swagger documentation

### Task 5: Skills Distribution API (AC4) - 0.5h
- [ ] Implement `GET /api/analytics/skills-distribution`
  - [ ] Query skills with badge counts
  - [ ] Join with badge_templates_skills
  - [ ] Group by skill category
  - [ ] Order by badge count DESC
- [ ] Add ADMIN role guard
- [ ] Write unit tests (4 tests)
- [ ] Write E2E test (1 test)
- [ ] Add Swagger documentation

### Task 6: Recent Activity Feed API (AC5) - 0.5h
- [ ] Implement `GET /api/analytics/recent-activity`
  - [ ] Query AuditLog table (Sprint 7)
  - [ ] Include user/badge details
  - [ ] Support pagination (limit, offset)
  - [ ] Order by timestamp DESC
- [ ] Add ADMIN role guard
- [ ] Write unit tests (4 tests)
- [ ] Write E2E test (1 test)
- [ ] Add Swagger documentation

---

## Backend Implementation Details

### Database Queries

#### System Overview Query (AC1)
```typescript
async getSystemOverview(): Promise<SystemOverviewDto> {
  const [
    userCounts,
    badgeCounts,
    templateCounts
  ] = await Promise.all([
    this.prisma.user.groupBy({
      by: ['role'],
      _count: true
    }),
    this.prisma.badge.groupBy({
      by: ['status'],
      _count: true
    }),
    this.prisma.badgeTemplate.groupBy({
      by: ['status'],
      _count: true
    })
  ]);

  // Transform and aggregate data
  return {
    users: this.transformUserCounts(userCounts),
    badges: this.transformBadgeCounts(badgeCounts),
    badgeTemplates: this.transformTemplateCounts(templateCounts),
    systemHealth: await this.getSystemHealth()
  };
}
```

#### Issuance Trends Query (AC2)
```typescript
async getIssuanceTrends(period: number, issuerId?: string): Promise<IssuanceTrendsDto> {
  const startDate = subDays(new Date(), period);

  const badges = await this.prisma.badge.findMany({
    where: {
      issuedAt: { gte: startDate },
      ...(issuerId && { issuedById: issuerId })
    },
    select: {
      issuedAt: true,
      status: true,
      revokedAt: true
    }
  });

  // Group by date and count statuses
  const dataPoints = this.groupByDate(badges, period);

  return {
    period: `last${period}days`,
    startDate,
    endDate: new Date(),
    dataPoints,
    totals: this.calculateTotals(badges)
  };
}
```

### Performance Considerations
- **Caching:** System overview cached for 5 minutes (Redis in production)
- **Indexes Required:**
  - `badges.issuedAt` (for trends query)
  - `badges.status` (for aggregations)
  - `auditLog.createdAt` (for recent activity)
- **Query Optimization:** Use `groupBy` for aggregations (faster than COUNT(*))

---

## Dev Notes

### Architecture Patterns Used
- **Analytics Module:** Separate module for analytics logic
- **DTO Pattern:** Strong typing for all responses
- **Role-Based Guards:** @Roles() decorator on all endpoints
- **Query Optimization:** Promise.all for parallel queries

### Source Tree Components
```
backend/src/
├── analytics/
│   ├── analytics.module.ts (NEW)
│   ├── analytics.controller.ts (NEW)
│   ├── analytics.service.ts (NEW)
│   └── dto/
│       ├── system-overview.dto.ts (NEW)
│       ├── issuance-trends.dto.ts (NEW)
│       ├── top-performers.dto.ts (NEW)
│       ├── skills-distribution.dto.ts (NEW)
│       └── recent-activity.dto.ts (NEW)
└── common/
    └── decorators/
        └── roles.decorator.ts (EXISTING)
```

### Testing Standards
- **Unit Tests:** 24 tests (5+6+5+4+4 per endpoint)
- **E2E Tests:** 7 tests (1+2+2+1+1)
- **Total:** 31 tests

---

## Definition of Done

- [ ] All 5 Acceptance Criteria met
- [ ] 31 tests passing (unit + E2E)
- [ ] All endpoints documented in Swagger
- [ ] Role-based authorization enforced
- [ ] Database queries optimized (no N+1 queries)
- [ ] Response times < 500ms for all endpoints
- [ ] Code review complete
- [ ] Story file updated with completion notes

---

## Dependencies

**Blocked By:**
- None (uses existing database schema)

**Blocks:**
- Story 8.1 (Dashboard can now call these APIs)

---

## References

- PRD FR-23: Analytics & Reporting
- Story 8.1: Dashboard Homepage (API consumer)
- Sprint 7: AuditLog table (used in AC5)
- Story 9.1: Badge revocation data (used in trends)
