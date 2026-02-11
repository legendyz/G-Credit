# Architecture Quality Assessment

**Audit Number:** 3 (from Post-MVP Audit Plan)  
**Agent:** Architect (Winston)  
**Date:** 2026-02-11  
**Priority:** P1 — Important for long-term maintainability  
**Status:** ✅ Complete  
**Scope:** Assess architectural soundness and Phase 2/3 readiness  
**Version Assessed:** v1.0.0 (Sprint 10 complete, 1061 tests, UAT 33/33 PASS)

---

## Executive Summary

G-Credit's architecture is **well-founded for MVP scope** and positioned for reasonable Phase 2/3 evolution. The modular monolith pattern, Prisma ORM, and NestJS framework provide a solid base. However, there are architectural debt items that will compound if not addressed — particularly around async processing, test infrastructure maturity, and module coupling. The "cost of delay" analysis identifies 3 items that become significantly more expensive to fix with each additional sprint.

| Area | Health Score | Risk Level | Phase 2/3 Ready? |
|------|-------------|------------|------------------|
| Scalability | ⚠️ 70% | Medium | Conditional |
| Modularity | ✅ 85% | Low | Yes |
| Technical Debt | ⚠️ 75% | Medium | Needs triage |
| Phase 2/3 Readiness | ✅ 80% | Low-Medium | Mostly ready |
| **Overall** | **✅ 78%** | **Medium** | **Ready with caveats** |

---

## 3.1 Scalability Assessment

### 3.1.1 Can the architecture handle 1000+ concurrent users?

**Assessment: ⚠️ CONDITIONAL — needs 3 targeted improvements**

**Current State (Pilot Scale: 50 users):**
- Single NestJS process on Azure App Service B1 (1.75GB RAM, 1 vCPU)
- All requests synchronous (no background job processing)
- Direct PostgreSQL queries (no cache layer)
- Rate limiting: 60 req/min per IP (ThrottlerModule)

**Bottleneck Analysis for 1000+ Users:**

| Component | Current Capacity | 1000-User Requirement | Gap? |
|-----------|-----------------|----------------------|------|
| **API Server** | ~100 concurrent requests | ~200 concurrent requests | ⚠️ Need S1 tier or horizontal scaling |
| **Database (B1ms)** | ~100 connections, 1 vCPU | ~200 connections, 2+ vCPU | ⚠️ Upgrade to General Purpose D2s |
| **Blob Storage** | Unlimited | Unlimited | ✅ OK |
| **JWT Auth** | Stateless (no bottleneck) | Stateless | ✅ OK |
| **Badge Downloads** | Synchronous sharp processing ~50ms each | 20 concurrent downloads saturate CPU | ⚠️ Need caching (TD-004) |

**Specific Risks:**

1. **Badge baking (sharp):** At 50ms per PNG generation with 1 vCPU, 20 simultaneous badge downloads would consume 100% CPU for 1 second. Under load, this creates cascading latency across all endpoints.

2. **Bulk issuance:** Currently limited to 20 badges synchronously (TD-016). With 1000+ users, multiple admins could trigger concurrent bulk operations, overwhelming the single process.

3. **Dashboard analytics:** `DashboardService` performs multiple aggregation queries per request. With 100+ concurrent dashboard views, these queries would contend for database connections.

**Recommendation:**
1. **Before Pilot:** No changes needed (50 users is within comfortable margin)
2. **Before 200+ users:** Upgrade PostgreSQL to D2s ($150/month)
3. **Before 500+ users:** Add Redis cache + Bull Queue (TD-016), implement baked badge caching (TD-004)
4. **Before 1000+ users:** Scale App Service to S1 with auto-scaling, add CDN for badge images

### 3.1.2 N+1 Query Patterns in Prisma

**Assessment: ✅ LOW RISK — Prisma's include pattern is used correctly**

Prisma's `include` and `select` patterns are used throughout the codebase, which pre-fetches related data in a single query rather than lazy-loading.

**Verified patterns:**
- Badge queries include `template`, `recipient`, `issuer` in single queries
- Wallet/timeline queries use composite indexes (`[recipientId, status, issuedAt]`)
- Analytics use aggregation queries, not iterative loops

**Potential N+1 risk areas (minimal):**
- `BadgeIssuanceService.findManySimilar()` — performs a secondary query per recommendation, but is limited to 6 results
- Milestone achievement detection — checks each milestone config against user's badge count, but milestone count is typically < 20

**Recommendation:** Monitor query performance in Application Insights during pilot. No immediate action needed.

### 3.1.3 Bulk Issuance 20-Badge Limit

**Assessment: ⚠️ MEDIUM RISK — real bottleneck for enterprise use**

**Current Architecture:**
```
POST /api/bulk-issuance/upload → CSV validation → BulkIssuanceSession (JSONB)
POST /api/bulk-issuance/confirm/:id → Synchronous loop: issue 1-20 badges sequentially
```

**Impact Analysis:**
- **Pilot (50 users):** 20-badge limit is sufficient for initial programs
- **Production (500+ users):** HR frequently needs 50-200 badge batch issuance for training cohorts
- **Enterprise (1000+ users):** Need 1000+ badge batches for company-wide certifications

**Why this gets more expensive to fix later:**
- The synchronous pattern is embedded in `BulkIssuanceService.confirmSession()` with inline email sending
- Adding async processing requires Redis infrastructure, Bull Queue setup, progress tracking UI, and job monitoring — estimated 8h now, could be 16h+ if additional features depend on the sync pattern

**Recommendation:** Prioritize TD-016 (async bulk processing) for Sprint 12, before production rollout.

### 3.1.4 Bull Queue + Redis Integration Path

**Assessment: ✅ WELL-PLANNED — architecture doc (Decision 3.2) already specifies the pattern**

The architecture document provides complete Bull Queue implementation patterns:
- Queue definitions for `badge-issuance`, `notifications`, `reports`
- Retry strategy (3 attempts, exponential backoff)
- Job progress tracking API pattern
- NestJS `@nestjs/bull` integration code

**Gap:** The architecture specifies `@nestjs/bull` but it's not yet installed. Integration effort is clean:
1. Install `@nestjs/bull`, `bull`, `ioredis`
2. Set up Azure Cache for Redis (Basic C0, $20/month)
3. Create `BulkIssuanceProcessor` based on architecture doc patterns
4. Add progress polling endpoint (`GET /api/tasks/:id`)
5. Update frontend `BulkIssuancePage` with progress tracking

**Estimated effort:** 8h (as documented in TD-016)

---

## 3.2 Modularity Assessment

### 3.2.1 Adding a New Feature Module

**Assessment: ✅ GOOD — low boilerplate, clear pattern**

Adding a new backend module requires:
1. Create directory with `*.module.ts`, `*.controller.ts`, `*.service.ts`, DTOs
2. Register module in `AppModule.imports`
3. Add Swagger `@ApiTags` and `@ApiOperation` decorators

**Boilerplate score:** ~4 files, ~80 lines. NestJS CLI can generate most of this: `nest g module feature-name`

**Coupling analysis:** Modules correctly inject dependencies through NestJS DI container. Cross-module access goes through proper module imports (e.g., `BadgeIssuanceModule` imports `MicrosoftGraphModule` for notification sending).

### 3.2.2 Authentication Module Decoupling for SSO

**Assessment: ✅ WELL-DECOUPLED — SSO addition is straightforward**

**Current Auth Architecture:**
```
src/modules/auth/
├── auth.controller.ts      # Login/register endpoints
├── auth.module.ts           # Module definition
├── auth.service.ts          # Business logic
├── strategies/
│   └── jwt.strategy.ts     # JWT validation strategy
└── dto/                     # Input validation
```

**Global Guards in AppModule:**
```typescript
{ provide: APP_GUARD, useClass: JwtAuthGuard }    // All routes protected by default
{ provide: APP_GUARD, useClass: RolesGuard }       // RBAC enforcement
```

**SSO Addition Path (Phase 3):**
1. Add `azure-ad.strategy.ts` alongside existing `jwt.strategy.ts`
2. Add `POST /api/auth/login/azure` endpoint to `AuthController`
3. Map Azure AD groups to `UserRole` enum
4. Both strategies coexist — existing JWT flow remains for fallback

**Risk Assessment:** Low. The `JwtAuthGuard` validates tokens regardless of how they were issued. Azure AD tokens can be translated to internal JWTs at login time, meaning **zero changes to any other module's guards**.

### 3.2.3 Email System Provider Switching

**Assessment: ✅ GOOD — provider can be swapped cleanly**

**Current Architecture:**
```
EmailService (common/email.service.ts)
  └── delegates to → GraphEmailService (microsoft-graph/services/graph-email.service.ts)
```

`EmailService` acts as an abstraction layer. To switch providers:
1. Create new provider service (e.g., `SendGridEmailService`)
2. Update `EmailService` to delegate to the new provider
3. No changes needed in any consuming services

**Note:** `BadgeNotificationService` depends on `GraphEmailService` directly (not through `EmailService`). This is a minor coupling point but doesn't prevent provider switching since notifications are a Graph-specific feature (Teams + email).

### 3.2.4 Open Badges 3.0 Extensibility

**Assessment: ⚠️ MODERATE — requires isolated refactoring**

**Current OB2.0 Implementation:**
- `BadgeIssuanceService` generates JSON-LD assertions inline during issuance
- Assertion format is embedded in the service logic, not in a dedicated generator class
- `assertionJson` JSONB column stores the complete assertion

**OB3.0 Migration Considerations:**
- Open Badges 3.0 uses **Verifiable Credentials (W3C VC)** format instead of custom JSON-LD
- Requires DID (Decentralized Identifier) support
- Proof mechanism changes from hosted verification to cryptographic signatures

**Recommendation:**
- Extract assertion generation into a dedicated `AssertionGeneratorService`
- Implement a strategy pattern: `OB2AssertionGenerator` and `OB3AssertionGenerator`
- This way, both formats can coexist during migration
- **Estimated effort:** 4h for refactoring, 8-12h for OB3.0 implementation

---

## 3.3 Technical Debt Impact Assessment

### Active Technical Debt Registry (9 remaining items)

| TD ID | Issue | Current Severity | Cost of Delay | Compound Risk |
|-------|-------|-----------------|---------------|---------------|
| **TD-006** | Teams Channel Permissions | Medium | 📈 **INCREASES** | Each new sprint adds more Teams-dependent features that can't be tested |
| **TD-016** | Async Bulk Processing | Low | 📈 **INCREASES** | More code built on synchronous pattern = harder migration |
| **TD-003** | metadataHash DB Index | Low | → Stable | Performance impact only at scale |
| **TD-004** | Baked Badge Caching | Low | → Stable | CPU impact only at scale |
| **TD-005** | Test Data Factory | Low | → Stable | Convenience improvement |
| **TD-023** | CI Chinese Character Gate | Low | → Stable | Manual review sufficient for now |
| **TD-024** | CI console.log Gate | Low | → Stable | Currently 0 violations |
| **TD-025** | Husky Pre-commit Hooks | Low | → Stable until team grows | Single developer → no urgency |
| **TD-027** | Playwright Visual Regression | Low | → Stable | Design system is stable post-10.6d |

### Cost-of-Delay Prioritization

**Items that get MORE expensive with time (fix sooner):**

1. **TD-016 (Async Bulk Processing)** — Currently 8h. Every feature that builds on the synchronous `confirmSession()` pattern (e.g., notification batching, analytics event streaming, audit log bulk writes) increases migration complexity. By Phase 2, this could be 16h+. **Recommendation:** Sprint 12 (before production).

2. **TD-006 (Teams Permissions)** — Currently 1 day (admin approval). But 4 test files are skipped, meaning Teams features are accumulating untested code paths. If Phase 2 adds more Teams features (notifications, bot commands), the untested surface area compounds. **Recommendation:** Resolve in Sprint 11 (admin action, not dev work).

3. **TD-004 (Baked Badge Caching)** — Currently 4-6h. Impact grows linearly with user count. At 200+ users, uncached baked badge generation will cause noticeable API latency. **Recommendation:** Sprint 12, alongside Redis setup for TD-016.

**Items with stable cost (can safely defer):**
- TD-003, TD-005, TD-023, TD-024, TD-025, TD-027 — these have fixed scope regardless of when they're addressed.

### New Architectural Debt Identified During This Audit

| ID | Issue | Impact | Recommended Priority |
|----|-------|--------|---------------------|
| **ARCH-TD-001** | `@isaacs/brace-expansion` HIGH vulnerability (new since Sprint 10) | Security risk in production | P1 — Fix before pilot |
| **ARCH-TD-002** | Assertion generation logic embedded in `BadgeIssuanceService` | Blocks OB3.0 migration | P2 — Refactor in Phase 2 |
| **ARCH-TD-003** | 3 hardcoded fallback URLs in Teams notification code | Silent failures in production | P2 — Fix before pilot |
| **ARCH-TD-004** | No Application Insights integration (architecture Phase 3 item) | No production observability | P1 — Add before production rollout |

---

## 3.4 Phase 2/3 Readiness Assessment

### 3.4.1 Azure AD SSO — Can it be added without restructuring auth?

**Assessment: ✅ YES — minimal restructuring needed**

**Effort estimate:** 1 week (as documented in architecture Phase 3 migration plan)

**Required changes:**
1. Install `passport-azure-ad` package
2. Add `AzureAdStrategy` alongside existing `JwtStrategy`
3. Add login endpoint: `POST /api/auth/login/azure`
4. Map Azure AD groups → `UserRole` enum
5. Add `azureId` field to User model (already exists — Sprint 8 M365 sync)
6. Frontend: Add "Login with Microsoft" button on `LoginPage.tsx`

**Why it's easy:** The global `JwtAuthGuard` validates JWT tokens regardless of origin. Azure AD login would issue the same internal JWT as email/password login. No other module needs changes.

### 3.4.2 Database Schema — Ready for LMS webhook events?

**Assessment: ⚠️ NEEDS EXTENSION — 2 new tables required**

**Current schema** doesn't have webhook event storage. LMS integration (Phase 2) needs:

```prisma
model WebhookEvent {
  id          String   @id @default(uuid())
  source      String   // 'lms', 'hris'
  eventType   String   // 'course.completed', 'user.updated'
  payload     Json     // Raw webhook payload
  status      String   // 'received', 'processed', 'failed'
  processedAt DateTime?
  error       String?
  createdAt   DateTime @default(now())
  
  @@index([source, eventType])
  @@index([status])
}

model AutomationRule {
  id            String   @id @default(uuid())
  trigger       String   // 'lms.course.completed'
  templateId    String   // Badge template to auto-issue
  conditions    Json     // Additional conditions (score > 80, etc.)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
}
```

**Migration effort:** 2-3h (Prisma migration + 2 service files)

**Risk:** Low — no existing schema changes needed, purely additive.

### 3.4.3 Frontend Routing — Can it support 22 screens from UX spec?

**Assessment: ✅ YES — React Router v6 scales easily**

**Current routes (14 pages):**
```
/login, /dashboard, /profile, 
/admin/analytics, /admin/users, /admin/*, 
/issue, /bulk-issuance, 
/claim/:token, /verify/:id, /embed/:id, 
/404, /*
```

**Remaining screens from UX spec (8 planned for Phase 2/3):**
- Settings page, Badge Designer (advanced), Learning Pathways, 
- Team Skills View (Manager), Approval Workflows, 
- Badge Import, Report Builder, System Configuration

**Assessment:** React Router v6 with code splitting (`React.lazy()`) handles 22+ routes without performance issues. The current routing structure supports easy addition — each new page is a component in `pages/` directory + a route entry.

### 3.4.4 Test Infrastructure — Ready for 2000+ tests?

**Assessment: ⚠️ NEEDS IMPROVEMENT — 2 concerns**

**Current state:** 1061 tests (1087 peak in Sprint 9, 26 removed during Sprint 10 cleanup)

**Concern 1: Test execution time**
- Backend Jest: ~60-90s for full suite
- Frontend Vitest: ~30-45s for full suite
- E2E: ~120-180s with database isolation
- **At 2000 tests:** Estimated 3-5 minutes per CI run — acceptable but approaching the point where parallel test runners (Jest `--shard`) become beneficial

**Concern 2: E2E test database isolation**
- TD-001 was fixed in Sprint 8 (schema-based isolation)
- Current approach: Each E2E test file gets its own PostgreSQL schema
- **At 2000+ tests:** Schema-per-file approach may hit PostgreSQL connection limits
- **Recommendation:** Consider test container pools or in-memory database for unit tests

**Concern 3: Test data management**
- TD-005 (Test Data Factory) is deferred
- Currently, each test creates its own seed data inline
- **At 2000+ tests:** Duplicated test setup code becomes a maintenance burden
- **Recommendation:** Implement test data factory pattern before test count exceeds 1500

---

## Architecture Health Scorecard

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Security Architecture** | ✅ 90% | Helmet, CORS, RBAC, JWT validation, rate limiting all properly configured |
| **Data Architecture** | ✅ 90% | Clean Prisma schema, proper indexes, JSONB for flexible data, clean migration history |
| **API Architecture** | ✅ 95% | Consistent REST patterns, Swagger docs, proper guards on all endpoints |
| **Module Architecture** | ✅ 85% | Well-isolated modules, minor organizational deviation |
| **Frontend Architecture** | ✅ 80% | Zustand + TanStack Query correctly used, centralized API config, but component structure could be more feature-oriented |
| **Test Architecture** | ⚠️ 75% | Good coverage (1061 tests), but missing factory pattern and may need parallelization strategy |
| **DevOps Architecture** | ⚠️ 65% | No CI/CD pipeline deployed yet, no Application Insights, no automated deployment |
| **Scalability Architecture** | ⚠️ 70% | Good for pilot, needs Redis + async processing + caching for production |

**Weighted Overall: 78%** — Solid MVP architecture with known improvement areas

---

## Recommendations Priority Matrix

### P0 — Before Pilot (Sprint 11)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Resolve `@isaacs/brace-expansion` HIGH vulnerability | 1h | Security |
| 2 | Re-evaluate and document lodash risk for pilot deployment (ADR-010) | 2h | Compliance |

### P1 — Before Production (Sprint 11-12)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 3 | Fix 3 hardcoded fallback URLs in Teams notification code | 1h | Reliability |
| 4 | Resolve TD-006: Teams Channel Permissions (admin action) | 1d | Testing coverage |
| 5 | Implement TD-016: Async bulk processing with Redis + Bull Queue | 8h | Scalability |
| 6 | Add Application Insights for production monitoring | 2d | Observability |

### P2 — Phase 2 Preparation

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 7 | Extract assertion generator for OB3.0 readiness | 4h | Extensibility |
| 8 | Implement baked badge caching (TD-004) | 4-6h | Performance |
| 9 | Standardize backend module organization | 2h | Consistency |
| 10 | Create test data factory pattern (TD-005) | 4h | Maintainability |

### P3 — Phase 3 / Backlog

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 11 | Add API versioning (`/api/v1/`) | 2h | Future-proofing |
| 12 | Migrate frontend to feature-based structure | 8h | Scalability |
| 13 | Set up CI/CD pipeline (GitHub Actions) | 1d | Automation |
| 14 | Add webhook event table for LMS integration | 2-3h | Phase 2 feature |

---

## Conclusion

G-Credit's architecture is **healthy for its current lifecycle stage**. The decisions made during Sprint 0 planning (modular monolith, PostgreSQL, NestJS, Prisma, TanStack Query + Zustand) were well-chosen and consistently implemented through 10 sprints.

**Strengths:**
- Clean module boundaries with proper NestJS dependency injection
- Consistent RBAC enforcement across all 19 controllers
- Solid Open Badges 2.0 compliance with hosted verification
- Well-designed public API security model (ADR-006)
- Comprehensive audit logging (3 audit tables)
- Good database indexing strategy

**Areas for Improvement:**
- Async processing infrastructure (Redis + Bull Queue) is the highest-impact missing piece
- Production observability (Application Insights) not yet integrated
- CI/CD pipeline not deployed to Azure
- Test infrastructure needs factory patterns before scaling past 1500 tests

**Bottom Line:** The architecture can support pilot deployment (50 users) as-is. For production rollout (500+ users), the Redis/Bull Queue and Application Insights additions are required. Both are well-documented in the architecture document and can be added incrementally without restructuring existing code.

---

*Assessment conducted by Winston (Architect Agent) on 2026-02-11. Based on analysis of system-architecture.md (5,755 lines), 8 ADRs, project-context.md (1,432 lines), Prisma schema (410 lines, 16 models), 19 backend modules, and 14 frontend pages.*
