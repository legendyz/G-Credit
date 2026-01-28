# ADR-007: Baked Badge Storage Strategy

**ADR Number:** 007  
**Title:** Baked Badge Storage and Caching Strategy  
**Date:** 2026-01-28  
**Status:** ✅ Accepted  
**Author(s):** Winston (Architect)  
**Deciders:** LegendZhu (Tech Lead), Winston (Architect)  
**Sprint:** Sprint 5 (Epic 6 - Badge Verification)  
**Related ADRs:** 
- [ADR-005: Open Badges Integration](./005-open-badges-integration.md)
- [ADR-006: Public API Security](./006-public-api-security.md)

---

## Context

### Problem Statement

Sprint 5 introduces **baked badges** (PNG images with embedded Open Badges 2.0 assertions). These images require:
1. **On-demand generation:** PNG iTXt chunk insertion using sharp package
2. **Storage:** Where to persist generated baked badges
3. **Caching:** How to avoid regenerating same badge repeatedly
4. **Cache invalidation:** When badge status changes (revoked)

**Core Challenge:** Balance **performance** (fast badge downloads) with **cost** (Azure Blob Storage charges) and **data consistency** (revoked badges must not be cached).

### Background

**Current Badge Image Architecture (Sprint 0-4):**

```
Badge Creation Flow:
1. Admin uploads badge template image → Azure Blob Storage
2. Database stores image URL: badges.imageUrl = "https://.../badge.png"
3. Frontend displays image directly from Blob Storage URL

Storage: Azure Blob Storage (container: "badges")
Cost: ~$0.018/GB/month
Access: Public blob read (no auth required)
```

**New Baked Badge Requirements (Sprint 5):**

```
Badge Download Flow:
1. User clicks "Download PNG" button
2. Backend generates baked badge (original PNG + JSON-LD iTXt chunk)
3. User receives PNG with embedded assertion
4. User can upload baked badge to Credly, Badgr, personal website

Technical Requirements:
- sharp package: Image manipulation (50ms processing time)
- Badge immutability: Once issued, badge data doesn't change
- Revocation edge case: Badge can be revoked (status change)
```

**Azure Blob Storage Current Usage:**

| Container | Purpose | Access | Size (Sprint 4) |
|-----------|---------|--------|-----------------|
| `badges` | Badge template images | Public read | ~50MB (100 templates × 500KB) |
| `evidence` | Evidence files (PDF, images) | Private | ~200MB (500 files × 400KB) |

**Cost Analysis:**
- Storage: $0.018/GB/month
- Transactions: $0.01/10,000 read operations
- Egress: First 100GB free, then $0.087/GB

**Constraints:**
- Azure App Service B1 tier: 1.75GB RAM, 1 vCPU
- sharp processing: ~50ms per badge (memory: ~100MB peak)
- Concurrent badge downloads: Expected 10-20 per hour (MVP phase)

**Stakeholders:**
- Employees - want fast badge downloads (<2 seconds)
- Administrators - want cost-efficient solution
- System operators - want simple, maintainable architecture

### Goals

1. **Performance:** Badge download completes in <2 seconds
2. **Cost Efficiency:** Minimize Azure Blob Storage costs
3. **Data Consistency:** Revoked badges never serve stale cached versions
4. **Simplicity:** Avoid complex caching logic
5. **Scalability:** Support 1000+ concurrent downloads (future-proof)

---

## Decision

### Solution

Implement **lazy generation with persistent caching** strategy:

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Badge Download Request                                       │
│ GET /badges/{id}/download/png                              │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
     ┌──────────────────────┐
     │ 1. Check Azure Blob  │
     │    Storage for       │
     │    baked badge       │
     └──────────┬───────────┘
                │
         ┌──────┴──────┐
         │             │
    EXISTS?         NOT EXISTS
         │             │
         ▼             ▼
┌────────────────┐  ┌────────────────────────┐
│ 2a. Return     │  │ 2b. Generate           │
│     cached PNG │  │     baked badge        │
│     directly   │  │     (sharp)            │
└────────────────┘  └───────────┬────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ 3. Upload to          │
                    │    Azure Blob         │
                    │    Storage            │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ 4. Return PNG         │
                    │    to user            │
                    └───────────────────────┘
```

#### Implementation Details

**1. Baked Badge Naming Convention:**

```
Container: badges
Path: baked/{badgeId}-{verificationId}.png

Example: 
badges/baked/123e4567-e89b-12d3-a456-426614174000-pub-abc123.png

Benefits:
- Unique per badge (badgeId)
- Includes verification ID (for debugging)
- Scoped in "baked/" subfolder (easy to purge all baked badges)
```

**2. Badge Download Endpoint:**

```typescript
// src/badges/badges.controller.ts
@Controller('badges')
export class BadgesController {
  @Get(':id/download/png')
  @UseGuards(JwtAuthGuard) // ✅ Authenticated endpoint (employee downloads own badge)
  async downloadBakedBadge(
    @Param('id') badgeId: string,
    @Res() response: Response
  ) {
    const badge = await this.badgesService.findOne(badgeId);
    
    // ✅ Check if baked badge already exists
    const bakedBadgeUrl = `baked/${badge.id}-${badge.verificationId}.png`;
    const exists = await this.storageService.blobExists('badges', bakedBadgeUrl);
    
    let bakedBadgeBuffer: Buffer;
    
    if (exists && badge.status !== 'REVOKED') {
      // ✅ Serve cached baked badge
      bakedBadgeBuffer = await this.storageService.downloadBlob('badges', bakedBadgeUrl);
    } else {
      // ❌ Generate new baked badge (first download or badge revoked)
      bakedBadgeBuffer = await this.badgesService.generateBakedBadge(badge.id);
      
      // ✅ Upload to Blob Storage for future requests
      await this.storageService.uploadBlob(
        'badges',
        bakedBadgeUrl,
        bakedBadgeBuffer,
        'image/png'
      );
    }
    
    // ✅ Set response headers
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Content-Disposition', `attachment; filename="badge-${badge.template.name}.png"`);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache 1 year
    
    response.send(bakedBadgeBuffer);
  }
}
```

**3. Baked Badge Generation Service:**

```typescript
// src/badges/badges.service.ts
import * as sharp from 'sharp';

async generateBakedBadge(badgeId: string): Promise<Buffer> {
  const badge = await this.findOne(badgeId);
  
  // ✅ Download original badge image from Blob Storage
  const imageBuffer = await this.storageService.downloadBlob(
    'badges',
    badge.imageUrl.split('/').pop() // Extract filename
  );
  
  // ✅ Generate Open Badges 2.0 JSON-LD assertion
  const assertion = await this.generateOpenBadgesAssertion(badge);
  
  // ✅ Embed assertion in PNG iTXt chunk
  const bakedBadge = await sharp(imageBuffer)
    .withMetadata({
      iTXt: {
        keyword: 'openbadges',
        value: JSON.stringify(assertion)
      }
    })
    .png()
    .toBuffer();
  
  return bakedBadge;
}
```

**4. Cache Invalidation on Badge Revocation:**

```typescript
// src/badges/badges.service.ts
async revokeBadge(badgeId: string, reason: string): Promise<Badge> {
  const badge = await this.prisma.badge.update({
    where: { id: badgeId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedReason: reason
    }
  });
  
  // ✅ Delete cached baked badge (force regeneration on next download)
  const bakedBadgeUrl = `baked/${badge.id}-${badge.verificationId}.png`;
  await this.storageService.deleteBlob('badges', bakedBadgeUrl);
  
  return badge;
}
```

**5. HTTP Caching Headers:**

```typescript
// For Valid Badges (immutable after issuance)
response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
response.setHeader('ETag', `"${badge.metadataHash}"`);

// For Revoked Badges (must revalidate)
if (badge.status === 'REVOKED') {
  response.setHeader('Cache-Control', 'no-cache, must-revalidate');
  response.setHeader('Pragma', 'no-cache');
}
```

#### Storage Cost Analysis

**Scenario: 1000 Badges Issued**

| Metric | Original Images | Baked Badges | Total |
|--------|-----------------|--------------|-------|
| Size per badge | 500KB (template) | 600KB (template + assertion JSON) | 1.1MB |
| Total storage | 500MB | 600MB | 1.1GB |
| Monthly cost | $0.009 | $0.011 | $0.020 |

**Cost Efficiency:**
- Lazy generation: Only cache downloaded badges (not all 1000)
- Assumption: 20% of badges downloaded (200 badges)
- Actual cost: $0.009 (originals) + $0.002 (200 baked) = **$0.011/month**

**Transaction Costs:**
- First download: 1 read (check existence) + 1 write (upload) = $0.0002
- Subsequent downloads: 1 read (from cache) = $0.0001
- 1000 downloads: Mostly cached = **$0.10/month**

**Total Cost (1000 badges, 1000 downloads/month): ~$0.12/month** ✅

### Rationale

**Why Lazy Generation (vs. Eager Generation)?**

1. **Cost Savings:** Only generate badges that are downloaded (not all badges)
2. **Reduced Storage:** 80% of badges may never be downloaded (internal credentials)
3. **Flexibility:** Assertion format changes don't require mass regeneration
4. **Simplicity:** No background job to regenerate all badges on code changes

**Why Persistent Caching (vs. In-Memory Caching)?**

1. **Stateless App Service:** Multiple instances share Azure Blob Storage cache
2. **Survives Restarts:** No cache loss on app redeployment
3. **Cost Efficiency:** Blob Storage cheaper than RAM ($0.018/GB vs. $0.10/GB)
4. **Auto-Scaling:** New App Service instances immediately benefit from cache

**Why Azure Blob Storage (vs. Redis/CDN)?**

1. **Already Provisioned:** Blob Storage exists (Sprint 0), no new infrastructure
2. **Simple Integration:** Existing StorageService can handle baked badges
3. **No Expiration:** Badges immutable (don't need TTL-based expiration)
4. **Cost Effective:** Blob Storage 10× cheaper than Redis for static files

**Why Delete on Revocation (vs. Overwrite)?**

1. **Simpler Logic:** Delete-on-revoke easier than regenerate-and-upload
2. **Safety:** Ensures next download always generates fresh badge with revoked status
3. **Rare Operation:** Badge revocation expected <1% of badges (infrequent cache invalidation)

### Alternatives Considered

#### Alternative 1: Eager Generation (Generate All Baked Badges on Issuance)

- **Description:** Generate baked badge immediately when badge issued, store in Blob Storage
- **Pros:**
  - Fastest download experience (no generation latency)
  - Predictable performance (no "first download slowness")
  - All badges available immediately
- **Cons:**
  - **Wasted Storage:** 80% of badges never downloaded (wasted 480MB for 1000 badges)
  - **Increased Issuance Time:** Badge issuance 50ms slower (sharp processing)
  - **Mass Regeneration:** Assertion format change requires regenerating all badges
  - **Higher Cost:** $0.020/month vs. $0.011/month (82% more expensive)
- **Reason for Rejection:** Cost and storage inefficiency not justified for MVP

#### Alternative 2: In-Memory Caching (Node.js Memory Cache)

- **Description:** Cache baked badges in App Service RAM using `node-cache` or similar
- **Pros:**
  - Fastest possible access (no network roundtrip to Blob Storage)
  - No storage cost (uses RAM already paid for)
  - Simple implementation (npm package)
- **Cons:**
  - **Lost on Restart:** Cache cleared on app redeployment (frequent in development)
  - **Limited Capacity:** B1 tier has 1.75GB RAM (only ~500 baked badges fit)
  - **Not Shared:** Multiple App Service instances have separate caches (redundant generation)
  - **Memory Pressure:** sharp processing peak memory 100MB (limits concurrency)
- **Reason for Rejection:** Stateless architecture requires persistent cache

#### Alternative 3: Azure CDN (Content Delivery Network)

- **Description:** Serve baked badges via Azure CDN (caches at edge locations)
- **Pros:**
  - Ultra-fast downloads (edge locations worldwide)
  - Reduced App Service load (CDN handles traffic)
  - Built-in DDoS protection
- **Cons:**
  - **High Cost:** $0.081/GB egress + $0.05/10,000 requests = **$10-20/month** for 1000 badges
  - **Complex Cache Invalidation:** Purging CDN cache on revocation requires Azure SDK calls
  - **Overkill for MVP:** Internal credentials don't need global edge distribution
  - **Delayed Revocation:** CDN TTL (5 minutes) means revoked badges cached temporarily
- **Reason for Rejection:** 100× cost increase not justified for internal system

#### Alternative 4: Database BLOB Column (PostgreSQL BYTEA)

- **Description:** Store baked badge PNG directly in `badges` table as BYTEA column
- **Pros:**
  - Single source of truth (badge data + image in one database)
  - ACID transactions (image updates atomic with badge status)
  - No separate storage service needed
- **Cons:**
  - **Poor Performance:** Database queries slower for large binary data
  - **Backup Size:** Daily backups include all badge images (100MB → 1GB)
  - **Memory Usage:** PostgreSQL loads entire BYTEA into memory on read
  - **Anti-Pattern:** Databases optimized for structured data, not large binaries
- **Reason for Rejection:** PostgreSQL not designed for storing images (use Blob Storage)

---

## Consequences

### Positive Consequences

1. **Cost Efficiency:**
   - Only cache downloaded badges (80% storage savings)
   - $0.12/month for 1000 badges (negligible cost)
   - No new Azure resources required

2. **Performance:**
   - Cached baked badges serve in <200ms (Blob Storage roundtrip)
   - First download: ~300ms (50ms sharp + 250ms Blob Storage upload)
   - Subsequent downloads: <200ms (cached)

3. **Data Consistency:**
   - Revoked badges always regenerate (cache invalidation on revoke)
   - No stale data served to users
   - Immutable badges cached indefinitely (no TTL needed)

4. **Operational Simplicity:**
   - Reuses existing StorageService (no new code patterns)
   - No background jobs (no cron, no message queues)
   - No cache expiration logic (delete-on-revoke sufficient)

5. **Scalability:**
   - Stateless App Service (multiple instances share cache)
   - Azure Blob Storage handles 500 requests/second per blob
   - Auto-scaling works seamlessly (new instances use cache immediately)

### Negative Consequences

1. **First Download Latency:**
   - Users experience 50ms delay on first badge download
   - **Mitigation:** Pre-generate popular badges (top 10% downloaded)
   - **Acceptance:** 300ms total download time still < 2 second goal

2. **Storage Bloat Over Time:**
   - Baked badges never deleted (except on revocation)
   - **Impact:** 10,000 badges issued = 6GB storage = $0.11/month (acceptable)
   - **Mitigation:** Implement periodic cleanup (delete baked badges older than 1 year, Epic 8)

3. **Revocation Delay:**
   - CDN/browser cache may serve revoked badge for ~5 minutes (HTTP cache TTL)
   - **Mitigation:** Set `Cache-Control: no-cache` for revoked badges
   - **Acceptance:** Revocation rare (<1% of badges), delay acceptable

4. **Manual Purge Complexity:**
   - Administrator can't easily purge all baked badges
   - **Mitigation:** Create admin endpoint `DELETE /badges/baked-cache` (Epic 7)
   - **Workaround:** Azure Portal → Blob Storage → Delete "baked/" folder

5. **No Revocation History:**
   - Deleting baked badge on revoke loses original cached version
   - **Impact:** Can't compare pre-revoke vs. post-revoke assertions
   - **Mitigation:** Audit log stores original assertion JSON (database record)

### Risks

#### Risk 1: Blob Storage Outage

- **Description:** Azure Blob Storage unavailable, baked badges can't be served
- **Probability:** Very Low (Azure SLA: 99.9% uptime)
- **Impact:** High (badge downloads fail)
- **Mitigation:**
  - Fallback: Generate baked badge in-memory, serve directly (skip caching)
  - Retry logic: Exponential backoff for Blob Storage operations
  - **Acceptance:** Same risk as original badge images (already dependent on Blob Storage)

#### Risk 2: sharp Package Memory Leak

- **Description:** sharp library leaks memory on repeated badge generation
- **Probability:** Low (sharp is mature, widely used)
- **Impact:** Medium (App Service out-of-memory crashes)
- **Mitigation:**
  - Explicit `sharp` object disposal after each operation
  - Azure App Service auto-restart on memory threshold
  - Monitor memory usage in Application Insights

#### Risk 3: Concurrent Generation of Same Badge

- **Description:** Two users download same badge simultaneously, both trigger generation
- **Probability:** Medium (race condition on first download)
- **Impact:** Low (duplicate storage upload, wasted CPU)
- **Mitigation:**
  - Idempotent upload (overwrite existing blob)
  - Check existence again before upload (double-check pattern)
  - **Acceptance:** Minor inefficiency, no data corruption

#### Risk 4: Assertion Format Change Invalidates Cache

- **Description:** Code change modifies JSON-LD assertion structure, cached badges outdated
- **Probability:** Medium (Open Badges 2.0 → 3.0 migration in future)
- **Impact:** Medium (incompatible cached badges)
- **Mitigation:**
  - Naming convention includes version: `baked/v2/{badgeId}.png`
  - Purge all `baked/v1/*` blobs on version upgrade
  - Admin endpoint to force cache invalidation

---

## Implementation

### Changes Required

#### Backend (NestJS)

- [ ] **Badge Download Endpoint**
  - [ ] `GET /badges/:id/download/png` controller method
  - [ ] Check Blob Storage for existing baked badge
  - [ ] Generate baked badge if not cached
  - [ ] Upload to Blob Storage after generation
  - [ ] Set appropriate HTTP cache headers

- [ ] **Storage Service Extensions**
  - [ ] `blobExists(container, path)` method
  - [ ] `downloadBlob(container, path)` method (already exists)
  - [ ] `uploadBlob(container, path, buffer, contentType)` method (already exists)
  - [ ] `deleteBlob(container, path)` method

- [ ] **Badge Service Methods**
  - [ ] `generateBakedBadge(badgeId)` - sharp processing
  - [ ] `revokeBadge(badgeId, reason)` - with cache invalidation

#### Testing

- [ ] **Unit Tests (8 tests)**
  - [ ] `blobExists()` returns true/false correctly
  - [ ] `generateBakedBadge()` embeds assertion in iTXt chunk
  - [ ] Badge revocation deletes cached baked badge
  - [ ] HTTP headers set correctly (valid vs. revoked)

- [ ] **E2E Tests (5 tests)**
  - [ ] First download generates and caches baked badge
  - [ ] Second download serves cached badge (fast)
  - [ ] Revoked badge regenerates on next download
  - [ ] Concurrent downloads handle race condition gracefully

- [ ] **Performance Tests (3 tests)**
  - [ ] Cached badge download completes in <200ms
  - [ ] Uncached badge download completes in <500ms
  - [ ] 100 concurrent downloads don't exhaust memory

#### Documentation

- [ ] **Developer Guides**
  - [ ] Baked badge architecture diagram
  - [ ] Cache invalidation strategy explanation
  - [ ] How to manually purge baked badge cache

- [ ] **Operational Runbooks**
  - [ ] How to monitor Blob Storage usage
  - [ ] How to debug cache misses
  - [ ] How to force cache regeneration

### Migration Path

**Phase 1: Deploy Lazy Generation (Sprint 5 Day 5)**

1. Implement badge download endpoint with cache check
2. Test with 10 sample badges (verify cache hit/miss)
3. Deploy to staging
4. Monitor Application Insights for sharp memory usage

**Phase 2: Enable for All Users (Sprint 5 Day 6)**

1. Add "Download PNG" button to frontend
2. Test baked badge import to Credly/Badgr
3. Verify iTXt chunk readable by validators
4. Deploy to production

**Phase 3: Monitor and Optimize (Sprint 5 Day 7)**

1. Monitor Blob Storage transaction costs (first week)
2. Identify most-downloaded badges (consider pre-generation)
3. Adjust HTTP cache headers if needed
4. Document cache hit rate in retrospective

### Rollback Plan

If performance issues or cost overruns detected:

1. **Immediate:** Disable baked badge caching (always generate in-memory)
```typescript
const bakedBadgeBuffer = await this.badgesService.generateBakedBadge(badge.id);
// Skip upload to Blob Storage
response.send(bakedBadgeBuffer);
```

2. **Short-term:** Revert to on-demand generation only (no caching)

3. **Fix:** Optimize sharp processing or implement Alternative 2 (in-memory cache)

4. **Re-deploy:** After performance testing

---

## References

### Azure Documentation

- [Azure Blob Storage Pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/) - Cost calculator
- [Azure Blob Storage Performance](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-performance-checklist) - Optimization guide
- [Azure CDN Integration](https://learn.microsoft.com/en-us/azure/cdn/cdn-overview) - Edge caching (future consideration)

### Open Badges Specification

- [Baked Badges Specification](https://www.imsglobal.org/spec/ob/v2p0/#baking) - PNG iTXt chunk format
- [Badge Baking Best Practices](https://github.com/IMSGlobal/openbadges-specification/blob/master/docs/BakingBestPractices.md) - IMS Global recommendations

### Technical References

- [sharp Package Documentation](https://sharp.pixelplumbing.com/api-metadata) - PNG metadata manipulation
- [PNG iTXt Chunk Specification](http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html#C.iTXt) - Technical spec
- [HTTP Caching Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) - MDN guide

### Related ADRs

- [ADR-005: Open Badges Integration](./005-open-badges-integration.md) - Why baked badges needed
- [ADR-006: Public API Security](./006-public-api-security.md) - HTTP cache security

### Internal Documents

- [Sprint 5 Backlog](../sprints/sprint-5/backlog.md) - Story 6.4 (Baked Badge Generation)
- [Sharp Installation Guide](../sprints/sprint-5/sharp-installation-guide.md) - Windows setup
- [Infrastructure Inventory](../setup/infrastructure-inventory.md) - Azure Blob Storage details

---

**Decision Status:** ✅ **ACCEPTED**  
**Implementation Sprint:** Sprint 5 (2026-01-29 to 2026-02-07)  
**Cost Review:** Required after 1 month of production usage  
**Review Date:** 2026-02-07 (Sprint 5 Retrospective)  
**Last Updated:** 2026-01-28  
**Document Owner:** Winston (Architect)
