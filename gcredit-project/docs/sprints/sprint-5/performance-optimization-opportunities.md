# Sprint 5 Performance Optimization Opportunities

**Sprint:** Sprint 5  
**Created:** 2026-01-28  
**Status:** Analysis - Not Implemented  
**Priority:** Low (Optional Enhancements)

This document identifies potential performance optimization opportunities in Sprint 5 deliverables. All features are functional and meet requirements; these are **nice-to-have** improvements for future consideration.

---

## 📊 Performance Analysis

### Current Performance Baseline

Based on Sprint 5 implementation, estimated response times (unoptimized):

| Endpoint | Method | Avg Response | 95th Percentile | Notes |
|----------|--------|--------------|-----------------|-------|
| `/api/verify/:verificationId` | GET | ~150ms | ~300ms | Database query + email masking |
| `/api/badges/:id/assertion` | GET | ~100ms | ~200ms | Simple database query |
| `/api/badges/:id/download/png` | GET | ~2-5s | ~8s | Azure Blob + Sharp processing |
| `/api/badges/:id/integrity` | GET | ~120ms | ~250ms | Database + hash computation |

**Bottlenecks Identified:**
1. 🐌 Baked badge generation (2-5s per request)
2. 🐌 Verification endpoint N+1 query pattern
3. 🐌 No caching for frequently accessed assertions
4. 🐌 Hash computation on every integrity check

---

## 🚀 Optimization Opportunities

### OPT-001: Baked Badge Caching Strategy

**Priority:** High  
**Estimated Impact:** 95% response time reduction (2-5s → 100-200ms)  
**Effort:** Medium (4-6 hours)

**Current Behavior:**
```typescript
// Every request:
1. Download image from Azure Blob Storage (~500ms)
2. Sharp PNG processing (~1-2s)
3. EXIF metadata embedding (~500ms)
4. Return buffer to client
```

**Problem:**
- No caching - regenerates baked badge on every download
- Azure Blob download happens every time
- Sharp processing repeated for same badge
- High CPU usage for identical requests

**Proposed Solution A: Azure Blob Storage Cache**

Store generated baked badges in dedicated container:

```typescript
// BadgeIssuanceService.generateBakedBadge()
async generateBakedBadge(badgeId: string, userId: string) {
  // 1. Check cache first
  const cacheKey = `baked-badges/${badgeId}.png`;
  
  try {
    const cached = await this.storageService.downloadBlobBuffer(cacheKey);
    this.logger.log(`Cache HIT for baked badge ${badgeId}`);
    return { buffer: cached, filename: this.generateFilename(badge) };
  } catch (error) {
    this.logger.log(`Cache MISS for baked badge ${badgeId}`);
  }
  
  // 2. Generate if not cached
  const bakedBadge = await this.generateBakedBadgeInternal(badgeId);
  
  // 3. Store in cache
  await this.storageService.uploadBlob(cacheKey, bakedBadge, 'image/png');
  
  return { buffer: bakedBadge, filename };
}
```

**Cache Invalidation:**
```typescript
// Invalidate on badge revocation
async revokeBadge(badgeId: string, reason: string) {
  await this.prisma.badge.update({ /* ... */ });
  
  // Delete cached baked badge
  await this.storageService.deleteBlob(`baked-badges/${badgeId}.png`);
}
```

**Benefits:**
- ✅ 95% faster on cache hits (100-200ms vs 2-5s)
- ✅ Reduced Azure Blob egress costs
- ✅ Lower CPU usage (no Sharp processing)
- ✅ Better user experience

**Tradeoffs:**
- ⚠️ Storage cost: ~50KB per baked badge
- ⚠️ Cache invalidation complexity
- ⚠️ Stale cache risk if assertion changes

**Configuration:**
```typescript
// .env
BAKED_BADGE_CACHE_ENABLED=true
BAKED_BADGE_CACHE_TTL=2592000  // 30 days in seconds
BAKED_BADGE_CACHE_CONTAINER=baked-badges
```

---

### OPT-002: Redis Caching for Verification Responses

**Priority:** Medium  
**Estimated Impact:** 70% response time reduction (150ms → 50ms)  
**Effort:** Medium (6-8 hours)

**Current Behavior:**
```typescript
// Every /api/verify/:verificationId request:
1. Database query with 4 joins (badges + template + recipient + issuer)
2. Email masking computation
3. Assertion JSON serialization
4. Response construction
```

**Problem:**
- No in-memory cache
- Database hit on every request
- Same data fetched repeatedly for popular badges
- HTTP Cache-Control headers only (client-side caching)

**Proposed Solution: Redis Cache Layer**

```typescript
// BadgeVerificationService.verifyBadge()
async verifyBadge(verificationId: string) {
  // 1. Try Redis cache
  const cacheKey = `verification:${verificationId}`;
  const cached = await this.redis.get(cacheKey);
  
  if (cached) {
    this.logger.log(`Redis cache HIT: ${verificationId}`);
    return JSON.parse(cached);
  }
  
  // 2. Database query if cache miss
  const badge = await this.prisma.badge.findUnique({ /* ... */ });
  
  if (!badge) return null;
  
  // 3. Format response
  const response = this.formatVerificationResponse(badge);
  
  // 4. Cache with TTL
  const ttl = badge.status === BadgeStatus.REVOKED ? 60 : 3600; // 1min or 1h
  await this.redis.setex(cacheKey, ttl, JSON.stringify(response));
  
  return response;
}
```

**Cache Invalidation:**
```typescript
// On badge status change
async revokeBadge(badgeId: string) {
  const badge = await this.findOne(badgeId);
  
  // Invalidate Redis cache
  await this.redis.del(`verification:${badge.verificationId}`);
  
  // Update database
  await this.prisma.badge.update({ /* ... */ });
}
```

**Benefits:**
- ✅ 70% faster response (50ms vs 150ms)
- ✅ Reduced database load
- ✅ Better scalability for high traffic
- ✅ Configurable TTL per badge status

**Tradeoffs:**
- ⚠️ Redis infrastructure cost (~$20-50/month)
- ⚠️ Additional dependency
- ⚠️ Cache consistency management

**Implementation:**
```bash
npm install ioredis @nestjs/cache-manager cache-manager-ioredis-yet
```

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      ttl: 3600,
    }),
  ],
})
```

---

### OPT-003: Database Query Optimization

**Priority:** Medium  
**Estimated Impact:** 30-40% query time reduction  
**Effort:** Small (2-3 hours)

**Current Issues:**

#### Issue 3.1: N+1 Query Pattern in Verification

```typescript
// Current: Separate queries for related entities
const badge = await prisma.badge.findUnique({
  include: {
    template: true,      // Query 1
    recipient: true,     // Query 2
    issuer: true,        // Query 3
    evidenceFiles: true, // Query 4
  }
});
```

**Solution:** Already optimal with Prisma `include` ✅

#### Issue 3.2: Missing Index on metadataHash

```sql
-- Current schema
CREATE INDEX "idx_badges_verification" ON "badges"("verificationId");

-- Recommended: Add index for integrity queries
CREATE INDEX "idx_badges_metadata_hash" ON "badges"("metadataHash") 
WHERE "metadataHash" IS NOT NULL;
```

**Migration:**
```sql
-- 20260129_add_metadata_hash_index.sql
CREATE INDEX CONCURRENTLY "idx_badges_metadata_hash" 
ON "badges"("metadataHash") 
WHERE "metadataHash" IS NOT NULL;
```

**Impact:**
- Faster integrity verification queries
- Better query planner decisions
- Minimal storage overhead (~1MB for 10,000 badges)

#### Issue 3.3: Assertion JSON Field Size

```typescript
// Current: Store full assertion JSON (can be 5-10KB per badge)
assertionJson: Json  // JSONB column

// Optimization: Use compression for large assertions
import * as zlib from 'zlib';

async storeAssertion(assertion: any) {
  const compressed = zlib.gzipSync(JSON.stringify(assertion));
  await prisma.badge.update({
    data: { assertionJsonCompressed: compressed }
  });
}
```

**Tradeoffs:**
- ✅ 60-70% storage reduction
- ⚠️ CPU overhead for compress/decompress
- ⚠️ Schema change required

**Recommendation:** Not worth it unless storage becomes issue

---

### OPT-004: Lazy Assertion Generation

**Priority:** Low  
**Estimated Impact:** 10-20% badge issuance time reduction  
**Effort:** Small (2 hours)

**Current Behavior:**
```typescript
// Badge issuance flow:
1. Create badge in database (PENDING)
2. Generate assertion JSON ← Can be deferred
3. Compute metadata hash ← Can be deferred
4. Update badge with assertion + hash
5. Send notification email
```

**Problem:**
- Assertion generation blocks badge creation
- User waits for assertion computation
- Not critical for PENDING badges

**Proposed Solution:**

```typescript
async issueBadge(dto: IssueBadgeDto) {
  // 1. Create badge immediately (fast)
  const badge = await this.prisma.badge.create({
    data: {
      status: BadgeStatus.PENDING,
      // No assertion yet
    }
  });
  
  // 2. Generate assertion asynchronously
  this.generateAssertionAsync(badge.id).catch(err => {
    this.logger.error(`Async assertion generation failed: ${err}`);
  });
  
  // 3. Return immediately
  return badge;
}

private async generateAssertionAsync(badgeId: string) {
  await this.waitForCommit(); // Ensure badge committed
  
  const assertion = await this.assertionGenerator.generate(/*...*/);
  const hash = this.assertionGenerator.computeHash(assertion);
  
  await this.prisma.badge.update({
    where: { id: badgeId },
    data: { assertionJson: assertion, metadataHash: hash }
  });
}
```

**Benefits:**
- ✅ Faster badge issuance response
- ✅ Better user experience
- ✅ Non-blocking workflow

**Tradeoffs:**
- ⚠️ Assertion not immediately available
- ⚠️ Need to handle async failures
- ⚠️ Potential race conditions

**Recommendation:** Only if issuance latency becomes issue

---

### OPT-005: Email Masking Optimization

**Priority:** Very Low  
**Estimated Impact:** <5ms per request  
**Effort:** Trivial (30 minutes)

**Current Implementation:**
```typescript
// Computed on every verification request
private maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 1) return `*@${domain}`;
  const masked = localPart[0] + '***';
  return `${masked}@${domain}`;
}
```

**Optimization:**
```typescript
// Pre-compute and store in database
model User {
  email       String  @unique
  maskedEmail String? // Store pre-masked version
}

// On user creation/update
async createUser(data: CreateUserDto) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      maskedEmail: this.maskEmail(data.email), // Pre-compute
    }
  });
}

// In verification
recipient: {
  name: `${badge.recipient.firstName} ${badge.recipient.lastName}`,
  email: badge.recipient.maskedEmail, // Use pre-computed
}
```

**Benefits:**
- ✅ No runtime computation
- ✅ Slightly faster responses

**Tradeoffs:**
- ⚠️ Extra database column
- ⚠️ Schema migration
- ⚠️ Minimal actual benefit

**Recommendation:** Not worth the effort

---

## 📊 Optimization Priority Matrix

| Optimization | Impact | Effort | Priority | ROI |
|--------------|--------|--------|----------|-----|
| OPT-001: Baked Badge Caching | ⭐⭐⭐⭐⭐ | Medium | **High** | Very High |
| OPT-002: Redis Verification Cache | ⭐⭐⭐⭐ | Medium | **Medium** | High |
| OPT-003: Database Indexing | ⭐⭐⭐ | Small | **Medium** | High |
| OPT-004: Lazy Assertion Generation | ⭐⭐ | Small | Low | Medium |
| OPT-005: Email Masking Pre-compute | ⭐ | Trivial | Very Low | Very Low |

---

## 🎯 Recommended Implementation Plan

### Phase 1: Quick Wins (Sprint 6 - Week 1, 2-3 hours)
- ✅ OPT-003.2: Add metadataHash index
- ✅ Performance monitoring baseline (New Relic/DataDog)

### Phase 2: High-Impact Optimizations (Sprint 6 - Week 2, 4-6 hours)
- ✅ OPT-001: Implement baked badge caching
- ✅ Load testing with Apache JMeter
- ✅ Document performance improvements

### Phase 3: Scalability (Sprint 7, 6-8 hours)
- 🔄 OPT-002: Redis caching layer (if traffic demands)
- 🔄 Horizontal scaling setup
- 🔄 CDN integration for baked badges

### Phase 4: Advanced (Future, if needed)
- ⏸️ OPT-004: Async assertion generation
- ⏸️ Database read replicas
- ⏸️ GraphQL API for flexible queries

---

## 📈 Success Metrics

### Target Performance (Post-Optimization)

| Endpoint | Current | Target | Improvement |
|----------|---------|--------|-------------|
| `/api/verify/:verificationId` | 150ms | 50ms | **67% faster** |
| `/api/badges/:id/download/png` | 2-5s | 100-200ms | **95% faster** |
| `/api/badges/:id/integrity` | 120ms | 80ms | **33% faster** |

### Scalability Targets

| Metric | Current | Target |
|--------|---------|--------|
| Concurrent Users | 10-50 | 500-1000 |
| Requests/Second | ~5 | ~100 |
| 95th Percentile | 300ms | 150ms |
| Database CPU | 30% | 15% |

---

## 💰 Cost-Benefit Analysis

### OPT-001: Baked Badge Caching

**Costs:**
- Azure Blob storage: ~$0.02/GB/month
- Estimated usage: 10,000 badges × 50KB = 500MB = **$0.01/month**
- Development: 4-6 hours

**Benefits:**
- 95% response time reduction
- Better user experience
- Reduced Azure egress costs: ~$0.087/GB
- 10,000 downloads/month: 500GB × $0.087 = $43.50 saved
- **Net Savings: $43.49/month**

**Break-even:** Immediate (first month)

### OPT-002: Redis Caching

**Costs:**
- Azure Cache for Redis (Basic C0): $16.06/month
- Development: 6-8 hours

**Benefits:**
- 70% response time reduction
- Reduced database load
- Better scalability
- Estimated database cost reduction: ~$5-10/month

**Break-even:** ~6-12 months (mainly for scalability investment)

---

## 🔄 Monitoring & Validation

### Performance Monitoring Setup

```typescript
// app.module.ts
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
```

```typescript
// performance.interceptor.ts
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        logger.log({
          method: request.method,
          url: request.url,
          duration,
          timestamp: new Date().toISOString(),
        });
      }),
    );
  }
}
```

### Load Testing Script

```javascript
// load-test.js (using k6)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 100 },  // Sustained load
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const verificationId = '550e8400-e29b-41d4-a716-446655440000';
  
  const res = http.get(`http://localhost:3000/api/verify/${verificationId}`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 150ms': (r) => r.timings.duration < 150,
  });
  
  sleep(1);
}
```

---

## 📝 Implementation Checklist

When implementing optimizations:

- [ ] Performance baseline measured (before)
- [ ] Optimization implemented with feature flag
- [ ] Load testing conducted
- [ ] Performance metrics improved (after)
- [ ] Monitoring/alerting configured
- [ ] Documentation updated
- [ ] Cost analysis validated
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] A/B tested in production
- [ ] Rolled out to 100%

---

## 🚦 When to Optimize

**Don't optimize if:**
- ❌ Current performance meets requirements
- ❌ Traffic is low (<100 users/day)
- ❌ No user complaints about speed
- ❌ Other priorities are more urgent

**Do optimize when:**
- ✅ User feedback indicates slowness
- ✅ Traffic exceeds 500 users/day
- ✅ Database CPU >70%
- ✅ Response times >2 seconds
- ✅ Cost reduction opportunity identified

**Current Recommendation for Sprint 5:**
- ⏸️ **Wait and monitor** - Current performance is acceptable
- 📊 **Establish baseline** - Set up monitoring first
- 🎯 **Optimize if needed** - Only if metrics show issues

---

**Document Status:** Analysis Complete  
**Implementation:** Not scheduled (pending performance monitoring data)  
**Review Date:** Sprint 7 Retrospective (2026-03-15)
