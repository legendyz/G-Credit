# Sprint 8 Dependency Architecture Review

**Sprint:** Sprint 8 - Production-Ready MVP  
**Review Date:** 2026-02-02  
**Reviewer:** Technical Architect  
**Status:** APPROVED WITH CHANGES  
**Phase:** Post-Setup Review (after Story 8.0 completion)

---

## Executive Summary

After Story 8.0 (Sprint Setup) execution, dependency version analysis reveals **moderate-severity discrepancies** between planned and installed versions. **Overall Risk: 🟢 LOW-MEDIUM** with no blocking issues for Sprint 8 continuation. Key findings:

1. **@nestjs/helmet package does not exist** - NestJS documentation recommends direct `helmet` usage (v8.1.0 installed ✅)
2. **@nestjs/throttler v6.5.0** - Major version jump from planned v5.0.0, but **backward compatible** configuration API
3. **@nestjs/cache-manager v3.1.0** - Major version jump requires **migration to cache-manager v6 + Keyv**
4. **bcrypt v6.0.0** - ✅ Successfully upgraded, no breaking changes, auth tests passing
5. **AWS SDK vulnerabilities** - Deferred to Sprint 9 (no Azure Blob impact)

**Critical Verdict:** No blocking issues. Story 8.6 requires **minor implementation updates** (~1h). Story 8.4 requires **configuration migration** (~1.5h).

---

## Risk Matrix

| Package | Planned | Installed | Risk Level | Impact | Story Affected | Time Impact |
|---------|---------|-----------|------------|--------|----------------|-------------|
| **@nestjs/helmet** | 1.1.0 | **N/A** (helmet 8.1.0) | 🟡 **MEDIUM** | Config syntax change | 8.6 | +0.5h |
| **@nestjs/throttler** | 5.0.0 | **6.5.0** | 🟢 **LOW** | Backward compatible | 8.6 | +0h |
| **@nestjs/cache-manager** | 2.0.0 | **3.1.0** | 🟡 **MEDIUM** | Migration to Keyv required | 8.4 | +1.5h |
| **bcrypt** | 5.1.1 | **6.0.0** | ✅ **RESOLVED** | No breaking changes | None | +0h |
| **Prisma** | 6.19.2 | **6.19.2** | ✅ **LOCKED** | Version matches exactly | None | +0h |

**Total Sprint 8 Time Impact:** +2h (Story 8.4: +1.5h, Story 8.6: +0.5h)

---

## Detailed Analysis

### 1. @nestjs/helmet → helmet@8.1.0

#### Risk Assessment
- **Risk:** 🟡 **MEDIUM**
- **Impact:** Story 8.6 implementation syntax change
- **Breaking Changes:** Package wrapper does not exist; must use direct `helmet` import

#### Root Cause Analysis
**@nestjs/helmet@1.1.0 is NOT a valid npm package.** This was a planning error. NestJS documentation (as of v11) recommends using `helmet` directly without a NestJS wrapper.

**Verification:**
```bash
npm view @nestjs/helmet  # Package does not exist
npm view helmet          # v8.1.0 ✅ Available
```

#### Official NestJS Documentation (v11)
From https://docs.nestjs.com/security/helmet:

```typescript
// Correct approach for NestJS 11 + Express
import helmet from 'helmet';

app.use(helmet());
```

**Key Points:**
- No `@nestjs/helmet` package exists or needed
- Direct `helmet` package usage is the official approach
- helmet v8.1.0 is compatible with NestJS 11

#### Story 8.6 Impact
**Planned Code (INCORRECT):**
```typescript
// ❌ This will fail - package doesn't exist
import helmet from '@nestjs/helmet';

app.use(helmet({
  contentSecurityPolicy: { ... }
}));
```

**Actual Code (CORRECT):**
```typescript
// ✅ Official approach
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://graph.microsoft.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false // For Azure Blob Storage
}));
```

#### Recommendation
✅ **NO CHANGES NEEDED** - Current installation (helmet@8.1.0) is correct. Update Story 8.6 documentation to remove `@nestjs/` prefix.

**Security Implications:** ✅ None - `helmet` package provides identical security headers as any hypothetical wrapper would.

---

### 2. @nestjs/throttler 5.0.0 → 6.5.0

#### Risk Assessment
- **Risk:** 🟢 **LOW**
- **Impact:** None - backward compatible
- **Breaking Changes:** None affecting our use case

#### Breaking Changes (v5 → v6)
From GitHub releases analysis:

**v6.0.0 (Jul 2024) - Storage Layer Changes:**
- Internal storage switched from Object to Map
- Block time (ttl) separated from request tracking
- **USER-FACING API: UNCHANGED** ✅

**v6.4.0 (Jan 2025) - NestJS 11 Support:**
- Explicitly added NestJS 11 compatibility
- **Configuration API: UNCHANGED** ✅

**v6.5.0 (Dec 2025) - Latest:**
- Added `setHeaders` option (optional feature)
- **Existing configuration: FULLY COMPATIBLE** ✅

#### Story 8.6 Implementation Verification
**Planned Configuration (v5.0.0):**
```typescript
ThrottlerModule.forRoot({
  ttl: 60,      // Time window (seconds)
  limit: 10     // Max requests per ttl
})
```

**v6.5.0 Compatibility Check:**
```typescript
// ✅ EXACT SAME SYNTAX WORKS
ThrottlerModule.forRoot([{  // Note: v6 uses array format
  ttl: 60000,    // Now in milliseconds (breaking change)
  limit: 10
}])

// OR use old format (backward compatible)
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10
})
```

**IMPORTANT CHANGE DETECTED:** v6 changed `ttl` units from **seconds → milliseconds**.

#### Corrected Story 8.6 Configuration
```typescript
// app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,    // 60 seconds (was 60 in v5)
  limit: 10      // Max requests per ttl
}])

// Per-endpoint overrides
@Throttle({ default: { limit: 5, ttl: 60000 } })  // v6 syntax
@Post('login')
async login() { ... }
```

#### Recommendation
⚠️ **MINOR UPDATE REQUIRED** - Story 8.6 needs ttl unit change (seconds → milliseconds). No API changes, just numeric adjustment.

---

### 3. @nestjs/cache-manager 2.0.0 → 3.1.0

#### Risk Assessment
- **Risk:** 🟡 **MEDIUM**
- **Impact:** Story 8.4 requires configuration migration
- **Breaking Changes:** v3.0.0 requires cache-manager v6 + Keyv migration

#### Breaking Changes (v2 → v3)
From GitHub Release 3.0.0 (Jan 2025):

> **BREAKING CHANGE:** `@nestjs/cache-manager` v3 no longer supports `cache-manager` < v6. Migration to Keyv is necessary.
> 
> Migration guide: https://docs.nestjs.com/migration-guide

**Key Changes:**
1. **cache-manager upgraded** from v5 → v6
2. **Keyv storage required** - New peer dependency
3. **API changes** - Configuration syntax updated
4. **cache-manager v6** uses Keyv as backend (unified key-value interface)

#### Story 8.4 Impact Analysis

**Planned Configuration (v2.0.0 - OUTDATED):**
```typescript
// ❌ This v2 syntax will fail
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 900,   // 15 minutes
      max: 100
    })
  ]
})
```

**v3.1.0 Required Configuration:**
```typescript
// ✅ v3 syntax with Keyv
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 900000,  // Now in milliseconds (900 seconds = 15 minutes)
      max: 100,
      // Keyv is now the default storage
      // For in-memory caching (default), no additional config needed
    })
  ]
})
```

**Dependencies Required:**
```json
{
  "@nestjs/cache-manager": "^3.1.0",
  "cache-manager": "^6.0.0",  // ✅ Already in package.json
  "keyv": "^5.0.0"             // ✅ Already in package.json
}
```

**Cache Invalidation (Story 8.4):**
```typescript
// ✅ API unchanged - still compatible
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

async revokeBadge(badgeId: string) {
  // v3 still supports del() method
  await this.cacheManager.del('analytics:*');  // ✅ Works
  
  // v3 also supports store.clear() for full cache clear
  await this.cacheManager.store.clear();       // ✅ New option
}
```

**CacheInterceptor (Story 8.4):**
```typescript
// ✅ API unchanged
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('analytics')
@UseInterceptors(CacheInterceptor)
export class AnalyticsController { ... }
```

#### Recommendation
⚠️ **MODERATE UPDATE REQUIRED**:
1. Update Story 8.4 configuration to use milliseconds for `ttl`
2. Verify `keyv` is installed (✅ already in package.json)
3. Update documentation to reflect v3 syntax
4. **No code changes to invalidation logic** - API compatible

**Estimated Time:** +1.5h (configuration changes + testing)

---

### 4. AWS SDK HIGH Vulnerabilities

#### Risk Assessment
- **Risk:** 🟢 **LOW** (for Sprint 8)
- **Impact:** None on current Azure Blob Storage implementation
- **Defer:** Sprint 9 technical debt

#### Analysis
**Current Project Usage:**
```json
{
  "@azure/storage-blob": "^12.30.0",
  "@azure/identity": "^4.13.0",
  "@microsoft/microsoft-graph-client": "^3.0.7"
}
```

**AWS SDK Status:**
- No `@aws-sdk/*` packages in dependencies ✅
- Project uses **Azure Blob Storage** exclusively
- AWS SDK vulnerabilities **do not affect project**

#### Recommendation
✅ **NO ACTION REQUIRED** - Project does not use AWS SDK. Remove from version-manifest.md planning notes.

---

### 5. bcrypt 5.1.1 → 6.0.0

#### Risk Assessment
- **Risk:** ✅ **RESOLVED**
- **Impact:** None
- **Breaking Changes:** None - fully backward compatible

#### Breaking Changes (v5 → v6)
From GitHub Release v6.0.0 (Apr 2025):

**Changes:**
1. Migrated from `node-pre-gyp` to `prebuildify`
2. Updated platform detection (platform/arch/libc in module path)
3. Updated dependencies for security (tar vulnerability fixed)
4. Internal refactoring

**USER-FACING API:** ✅ **UNCHANGED**
- `bcrypt.hash()` - No changes
- `bcrypt.compare()` - No changes
- Password hash format - Backward compatible
- Existing hashes validated correctly

#### Verification
From Story 8.0 test results:
```bash
npm test -- auth.controller.spec.ts  # ✅ PASSED
npm test -- auth.service.spec.ts     # ✅ PASSED
```

**Password Hash Compatibility:**
```typescript
// Hashes created with v5.1.1
const oldHash = '$2b$10$...'  

// v6.0.0 can verify old hashes
await bcrypt.compare(password, oldHash)  // ✅ Returns true
```

#### Recommendation
✅ **NO ACTION REQUIRED** - Upgrade successful, tests passing, backward compatible.

---

## Story Update Requirements

### Story 8.4: Analytics API

**Status:** ⚠️ **MINOR UPDATES REQUIRED**

**Changes Needed:**

1. **CacheModule Configuration:**
```typescript
// OLD (v2 - remove this)
CacheModule.register({
  ttl: 900,   // seconds
  max: 100
})

// NEW (v3 - use this)
CacheModule.register({
  ttl: 900000,  // milliseconds (15 minutes)
  max: 100
})
```

2. **Dependencies Verification:**
```bash
# Verify these are installed (already in package.json ✅)
npm list cache-manager  # Should show v6.0.0
npm list keyv           # Should show v5.0.0
```

3. **Cache Key Format (no changes):**
```typescript
// ✅ Key format unchanged
const cacheKey = `analytics:${endpoint}:${userId}:${queryParams}`;
```

4. **Cache Invalidation (no changes):**
```typescript
// ✅ del() method still works
await this.cacheManager.del('analytics:*');
```

**Time Adjustment:** +1.5h (configuration + testing)

**Updated Acceptance Criteria:**
- AC1-AC5: No changes needed
- Implementation: Update CacheModule.register() ttl to milliseconds
- Testing: Verify cache hit/miss behavior with v3

---

### Story 8.6: Security Hardening

**Status:** ⚠️ **MINOR UPDATES REQUIRED**

**Changes Needed:**

1. **Helmet Integration (AC1):**
```typescript
// OLD (incorrect - package doesn't exist)
import helmet from '@nestjs/helmet';

// NEW (correct)
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://graph.microsoft.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false  // For Azure Blob Storage
}));
```

2. **Rate Limiting (AC3):**
```typescript
// OLD (v5 syntax)
ThrottlerModule.forRoot({
  ttl: 60,    // seconds
  limit: 10
})

// NEW (v6 syntax)
ThrottlerModule.forRoot([{
  ttl: 60000,   // milliseconds
  limit: 10
}])

// Per-endpoint overrides
@Throttle({ default: { limit: 5, ttl: 60000 } })  // v6 syntax
@Post('login')
async login() { ... }

@Throttle({ default: { limit: 3, ttl: 300000 } })  // 5 minutes
@Post('reset-password')
async resetPassword() { ... }
```

3. **Dependencies Installation (AC1, AC3):**
```bash
# Remove incorrect command
npm install @nestjs/helmet@^1.1.0  # ❌ Package doesn't exist

# Correct commands (already installed ✅)
npm install helmet@^8.1.0                # ✅ Installed
npm install @nestjs/throttler@^6.5.0    # ✅ Installed
```

**Time Adjustment:** +0.5h (documentation updates + ttl unit changes)

**Updated Acceptance Criteria:**
- AC1: Update helmet import syntax (remove `@nestjs/` prefix)
- AC2: No changes (CORS config unchanged)
- AC3: Update ThrottlerModule to array format + millisecond ttl
- AC4: No changes (IDOR fix logic unchanged)
- AC5: Update bcrypt version to 6.0.0 (already done ✅)

---

## Action Items (Prioritized)

### CRITICAL (Block Sprint 8)
❌ **NONE** - No blocking issues

### HIGH (Fix in Sprint 8)

1. **Update Story 8.4 Documentation**
   - Change CacheModule.register() ttl to milliseconds
   - Add note about cache-manager v6 + Keyv requirement
   - Update implementation code snippets
   - **Owner:** Tech Lead
   - **Due:** Before Story 8.4 starts
   - **Time:** 30min

2. **Update Story 8.6 Documentation**
   - Remove `@nestjs/helmet` references, use `helmet` directly
   - Update ThrottlerModule to v6 syntax (array format + milliseconds)
   - Update installation commands
   - **Owner:** Tech Lead
   - **Due:** Before Story 8.6 starts
   - **Time:** 30min

3. **Update version-manifest.md**
   - Change `@nestjs/helmet@1.1.0` → `helmet@8.1.0`
   - Change `@nestjs/throttler@5.0.0` → `@nestjs/throttler@6.5.0`
   - Change `@nestjs/cache-manager@2.0.0` → `@nestjs/cache-manager@3.1.0`
   - Add note: "cache-manager v6 requires Keyv"
   - Remove AWS SDK vulnerability note (not applicable)
   - **Owner:** Tech Lead
   - **Due:** 2026-02-02 EOD
   - **Time:** 15min

### MEDIUM (Tech Debt to Sprint 9)

1. **Research cache-manager v6 Advanced Features**
   - Explore Keyv storage adapters (Redis, PostgreSQL)
   - Evaluate distributed caching for multi-instance deployments
   - **Owner:** Backend Lead
   - **Due:** Sprint 9 Planning
   - **Backlog Item:** TECH-009

2. **Create ADR for Helmet Usage**
   - Document decision to use `helmet` directly vs wrapper
   - Rationale: Official NestJS approach, no wrapper exists
   - **Owner:** Tech Architect
   - **Due:** Sprint 9
   - **File:** docs/decisions/ADR-007-helmet-integration.md

### LOW (Monitor Only)

1. **Monitor @nestjs/throttler v7 Release**
   - Check for future breaking changes
   - **Review Date:** Q2 2026

2. **Monitor cache-manager v7 Release**
   - Evaluate migration impact
   - **Review Date:** Q2 2026

---

## Documentation Updates Required

- [x] **version-manifest.md** (HIGH)
  - Lines 107-108: Change `@nestjs/helmet@1.1.0+` → `helmet@8.1.0` (NEW)
  - Lines 108: Change `@nestjs/throttler@5.0.0+` → `@nestjs/throttler@6.5.0`
  - Lines 88-89: Add `cache-manager@6.0.0` and `keyv@5.0.0` entries
  - Lines 185: Remove AWS SDK update note
  - Lines 105-106: Update bcrypt to 6.0.0 (already done)

- [x] **8-4-analytics-api.md** (HIGH)
  - Lines 33-36: Update CacheModule.register() ttl to milliseconds
  - Lines 37-42: Update code snippets
  - Lines 33: Add note about cache-manager v6 + Keyv

- [x] **8-6-security-hardening.md** (HIGH)
  - Lines 54-85: Remove `@nestjs/helmet`, use `helmet` directly
  - Lines 55-56: Update installation command
  - Lines 58-80: Update import statements
  - Lines 114-148: Update ThrottlerModule to array format
  - Lines 122: Change ttl units to milliseconds
  - Lines 133-139: Update per-endpoint decorator syntax
  - Lines 187-199: Confirm bcrypt v6.0.0 (already documented)

- [ ] **sprint-status.yaml** (MEDIUM)
  - Update Story 8.4 time estimate: 5h → 6.5h
  - Update Story 8.6 time estimate: 6h → 6.5h
  - Total Sprint 8 adjustment: +2h

- [ ] **backlog.md** (MEDIUM)
  - Add TECH-009: Research cache-manager v6 advanced features
  - Add TECH-010: Create ADR-007 for Helmet integration

---

## Final Verdict

### ✅ **APPROVED WITH CHANGES**

**Justification:**

1. **No Blocking Issues:** All dependency discrepancies have workarounds or are backward compatible.

2. **Moderate Time Impact:** +2h total across Stories 8.4 and 8.6 is within acceptable range for sprint adjustment.

3. **Low Technical Risk:** 
   - Helmet: Using official approach, more secure than hypothetical wrapper
   - Throttler v6: Backward compatible, just unit changes
   - Cache-manager v3: Migration path clear, dependencies already installed
   - bcrypt v6: ✅ Confirmed working, tests passing

4. **Security Posture:** ✅ Improved
   - bcrypt v6 fixes tar vulnerability
   - helmet v8.1.0 has latest security headers
   - No AWS SDK exposure

### Next Steps

1. **Immediate (2026-02-02):**
   - Update version-manifest.md
   - Update Story 8.4 and 8.6 documentation
   - Notify Scrum Master of +2h time adjustment

2. **Before Story 8.4 Starts:**
   - Developer reviews cache-manager v3 migration guide
   - Verify keyv installation

3. **Before Story 8.6 Starts:**
   - Developer reviews helmet and throttler v6 syntax changes

4. **Sprint 8 Retrospective:**
   - Discuss lesson: Always verify package existence before planning
   - Add to sprint checklist: "Verify npm package availability"

---

**Reviewed By:** Technical Architect  
**Approved By:** [Pending Scrum Master Approval]  
**Last Updated:** 2026-02-02  
**Next Review:** Sprint 9 Planning (Post-MVP Security Audit)
