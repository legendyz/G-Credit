# Sprint 9 - Technical Debt Tasks

**Sprint:** Sprint 9 (2026-02-06 to 2026-02-20)  
**Total TD Effort:** 13h (16% of 80h capacity)  
**Approach:** Balanced Sprint (50-60% features + 20-30% tech debt)

> **⚠️ Reorganization Notice (2026-02-07)**  
> All TD tasks have been reorganized into Story format to unify the development workflow:  
> - **TD-013** (3h) → Embedded in **Story 8.3** as Task 0 (prerequisite)  
> - **TD-014** (2h) → Embedded in **Story 8.4** as Task 0 (prerequisite)  
> - **TD-015** (8h) → Promoted to **standalone Story** → [td-015-eslint-type-safety.md](td-015-eslint-type-safety.md)  
>  
> This ensures all TD follows the same flow: **dev prompt → dev → code review → fix → test**,  
> preventing TD from being overlooked at Sprint end. See individual story files for details.

---

## Technical Debt Priority Classification

Based on `technical-debt-from-reviews.md`, Sprint 9 addresses **3 P2 debt items** to prevent escalation to P1:

- **TD-015:** ESLint warnings (P2 → risk of P1 in Sprint 10)
- **TD-014:** Email system unification (P2)
- **TD-013:** Frontend bundle size (P2)

**Rationale:** Sprint 8 cleared 17 P1 items to 100% test coverage. Sprint 9 tackles manageable P2 debt while delivering Epic 8 features, maintaining healthy 35% feature / 16% debt balance.

---

## TD-015: Fix ESLint Type Safety Warnings (Phase 1) - 4h

**Priority:** P2  
**Category:** Code Quality  
**Source:** Sprint 8 Technical Debt Review  
**Issue:** 1100+ ESLint warnings from TypeScript strict rules

### Problem Statement
ESLint warnings accumulated from:
- `@typescript-eslint/no-unsafe-call` (300 occurrences)
- `@typescript-eslint/no-unsafe-return` (300 occurrences)
- `@typescript-eslint/no-unsafe-member-access` (300 occurrences)
- `@typescript-eslint/no-unused-vars` (200 occurrences)

These warnings indicate potential type safety issues that could cause runtime errors.

### Phase 1 Scope (Sprint 9)
Fix **300 warnings** from:
- `@typescript-eslint/no-unsafe-call`
- `@typescript-eslint/no-unsafe-return`

**Target:** Reduce total warnings from 1100 → 800 (27% reduction)

### Tasks
- [ ] **Task 1:** Run `npm run lint` to generate current warning list (0.5h)
- [ ] **Task 2:** Fix `no-unsafe-call` warnings in backend services (1.5h)
  - Add proper type assertions
  - Fix Prisma query result types
  - Update service method return types
- [ ] **Task 3:** Fix `no-unsafe-return` warnings in controllers (1.5h)
  - Add explicit return types to controller methods
  - Fix DTO return type mismatches
  - Update response type definitions
- [ ] **Task 4:** Run full test suite to verify no regressions (0.5h)
  - Backend unit tests: 349 tests
  - E2E tests: 199 tests
  - Target: 0 new failures

### Success Criteria
- [ ] ESLint warning count reduced to ≤800
- [ ] 0 test regressions
- [ ] All fixed code passes type checking with `npx tsc --noEmit`

### Testing
- Run existing test suite (548 backend tests)
- No new tests required (type safety enforcement)

---

## TD-015: Fix ESLint Type Safety Warnings (Phase 2) - 4h

**Priority:** P2  
**Category:** Code Quality  
**Continuation of Phase 1**

### Phase 2 Scope (Sprint 9)
Fix **300 more warnings** from:
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/no-unused-vars`

**Target:** Reduce total warnings from 800 → 500 (55% reduction from baseline)

### Tasks
- [ ] **Task 1:** Fix `no-unsafe-member-access` warnings (2h)
  - Add proper type definitions for Prisma relations
  - Fix object property access with unknown types
  - Update GraphQL resolver types
- [ ] **Task 2:** Fix `no-unused-vars` warnings (1.5h)
  - Remove unused imports
  - Remove unused function parameters (use underscore prefix if needed)
  - Clean up commented-out code
- [ ] **Task 3:** Run full test suite to verify no regressions (0.5h)

### Success Criteria
- [ ] ESLint warning count reduced to ≤500
- [ ] 0 test regressions
- [ ] Warning reduction progress documented for Sprint 10

### Future Work (Deferred)
- **Phase 3 (Sprint 10):** Fix remaining 500 warnings
- **Phase 4 (Sprint 11):** Enable warnings as errors in CI

---

## TD-014: Email System Unification - 2h

**Priority:** P2  
**Category:** Architecture Cleanup  
**Source:** Sprint 7 Retrospective

### Problem Statement
Two email sending systems exist:
1. **nodemailer** (legacy, SMTP)
2. **GraphEmailService** (current, Microsoft Graph API)

This causes:
- Code duplication
- Configuration complexity
- Inconsistent email templates
- Maintenance overhead

### Solution
Remove nodemailer entirely, use GraphEmailService for all emails.

### Tasks
- [ ] **Task 1:** Audit codebase for nodemailer usage (0.5h)
  - Search: `grep -r "nodemailer" backend/src/`
  - Document all email sending locations
- [ ] **Task 2:** Migrate remaining nodemailer calls to GraphEmailService (1h)
  - Update email sending code
  - Ensure templates compatible with Graph API
  - Update configuration
- [ ] **Task 3:** Remove nodemailer dependency (0.25h)
  - `npm uninstall nodemailer @types/nodemailer`
  - Remove nodemailer config from `.env`
  - Update documentation
- [ ] **Task 4:** Test email sending (0.25h)
  - Test badge issuance email
  - Test password reset email (if applicable)
  - Test admin notification emails

### Success Criteria
- [ ] Zero references to `nodemailer` in codebase
- [ ] All emails sent via GraphEmailService
- [ ] Email tests passing
- [ ] Documentation updated

### Testing
- Run email-related E2E tests (estimated 10 tests)
- Manual verification: Send test emails in dev environment

### Files to Modify
- `backend/src/email/` (remove nodemailer service)
- `backend/package.json` (remove dependency)
- `backend/.env.example` (remove nodemailer config)
- `gcredit-project/docs/setup/environment-setup.md` (update docs)

---

## TD-013: Frontend Bundle Code Splitting - 3h

**Priority:** P2  
**Category:** Performance  
**Source:** Sprint 6 Code Review

### Problem Statement
Frontend bundle size: **579 KB** (production, gzipped)
- Exceeds best practice of <400 KB
- Slow initial page load on slow networks
- Poor Lighthouse performance score

### Root Cause
- All dependencies bundled into single `index-[hash].js`
- Large libraries (e.g., React, Chart.js, date-fns) not code-split
- No lazy loading for route components

### Solution
Implement code splitting using Vite dynamic imports.

### Tasks
- [ ] **Task 1:** Analyze current bundle (0.5h)
  - Run `npm run build`
  - Run `npx vite-bundle-visualizer` to identify large chunks
  - Document top 5 largest dependencies
- [ ] **Task 2:** Implement route-based code splitting (1.5h)
  - Convert route imports to `lazy(() => import(...))`
  - Add `<Suspense>` fallback for loading states
  - Split routes: Dashboard, Badge Management, Bulk Issuance, Analytics
- [ ] **Task 3:** Split large vendor libraries (0.5h)
  - Configure manual chunks in `vite.config.ts`
  - Separate: React, UI library, Chart.js, date utilities
- [ ] **Task 4:** Verify bundle size reduction (0.5h)
  - Rebuild and measure bundle size
  - Target: <400 KB main bundle
  - Run Lighthouse to verify performance improvement

### Success Criteria
- [ ] Main bundle size reduced to <400 KB
- [ ] Lighthouse performance score improved by ≥10 points
- [ ] All routes load correctly with code splitting
- [ ] No increase in Time to Interactive (TTI)

### Testing
- Manual testing: Navigate all routes after build
- Lighthouse audit in production mode
- Browser DevTools Network tab verification

### Configuration Changes
**vite.config.ts:**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'utils-vendor': ['date-fns', 'lodash-es']
        }
      }
    }
  }
});
```

### Future Work (Deferred)
- **Sprint 10:** Implement prefetching for lazy routes
- **Sprint 11:** Add service worker for offline caching

---

## Technical Debt Progress Tracking

### Sprint 9 TD Metrics
- **Starting Debt:** 17 P1 resolved (Sprint 8), 8 P2 remaining, 12 P3 remaining
- **Sprint 9 Target:** 3 P2 items (TD-015, TD-014, TD-013)
- **Ending Debt (Target):** 0 P1, 5 P2, 12 P3
- **Total Effort:** 13h / 80h = 16% of sprint capacity

### TD Velocity Trend
- **Sprint 7:** 4h TD (8% capacity)
- **Sprint 8:** 18h TD (36% capacity - aggressive P1 cleanup)
- **Sprint 9:** 13h TD (16% capacity - balanced)
- **Target:** Maintain 15-20% TD capacity in future sprints

### Debt Accumulation Risk
**LOW** - Sprint 9 maintains healthy balance between features and debt cleanup.

---

## Integration with Story Work

### ✅ Reorganized (2026-02-07): TD Tasks Embedded in Stories

All TD tasks are now tracked within their respective stories:

| TD Task | Embedded In | Role | Hours |
|---------|-------------|------|-------|
| **TD-013** (Bundle Size) | **Story 8.3** (Task 0) | 前置任务 — Preview UI 开发前完成 | 3h |
| **TD-014** (Email Unification) | **Story 8.4** (Task 0) | 前置任务 — 批量处理开发前完成 | 2h |
| **TD-015** (ESLint Warnings) | **Standalone Story** | 独立 Story，可与其他 Story 并行 | 8h |

### Sprint 9 Unified Story Execution Order
1. ✅ **Story 8.1** — CSV Template & Validation (done)
2. **Story 8.2** — CSV Upload & Parsing (11.5h)
3. **Story 8.3** — Bulk Preview UI + **TD-013** (14.5h, includes 3h bundle optimization)
4. **Story 8.4** — Batch Processing + **TD-014** (8.5h, includes 2h email unification)
5. **Story TD-015** — ESLint Type Safety (8h, parallel-capable)
  - Recommended order: TD-014 → Story 8.4

- **TD-015 (ESLint)** can be done in parallel with story work
  - No direct dependencies
  - Can be assigned to different developer if needed

### Recommended Sprint 9 Development Order (Updated)
1. **Week 1:**
   - Story 8.1 (CSV Template) ✅ done
   - Story 8.2 (CSV Upload) - 11.5h
   - Story TD-015 (ESLint Phase 1) - 4h (parallel-capable)

2. **Week 2:**
   - Story TD-015 (ESLint Phase 2) - 4h (parallel-capable)
   - Story 8.3 (Preview UI + TD-013 bundle optimization) - 14.5h
   - Story 8.4 (Batch Processing + TD-014 email unification) - 8.5h

---

## Success Criteria for TD Completion

### Quality Gates
- [ ] All TD tasks marked complete in Sprint Backlog
- [ ] 0 test regressions introduced
- [ ] Code review approval for all TD changes
- [ ] Documentation updated where applicable

### Metrics Validation
- [ ] ESLint warnings reduced to ≤500 (55% reduction)
- [ ] Zero nodemailer references in codebase
- [ ] Frontend bundle <400 KB
- [ ] Sprint 9 velocity maintained (28h feature work completed)

### Retrospective Review
- [ ] TD tasks effort matched estimates (±20%)
- [ ] No TD-related blockers for story work
- [ ] Team confidence in sustainable debt management approach

---

## TD-016: Async Batch Processing Enhancement (Phase 2) - **DEFERRED**

**Priority:** P3 (Nice to have, post-MVP validation)  
**Category:** Performance Optimization  
**Source:** Sprint 9 MVP Scope Decision (2026-02-05)  
**Status:** **DEFERRED** (Blocked on MVP user feedback)  
**Effort:** 6-8h (when triggered)

### Decision Context
**Date**: 2026-02-05 (Sprint 9 Planning)  
**Decision**: Defer Redis + async processing from Story 8.4 to validate MVP first

Story 8.4 originally planned Redis + Bull Queue for async batch processing (100+ badges). After product review, simplified to synchronous processing (max 20 badges) to validate core workflow before adding infrastructure complexity.

### Problem Statement
Story 8.4 MVP implements synchronous bulk badge issuance with 20-badge limit. While sufficient for MVP, future users may need:
- **Larger batches**: 50-100+ badges per upload
- **Non-blocking UI**: Long-running operations don't freeze browser
- **Progress tracking**: Real-time updates for better UX
- **Reliability**: Job persistence and retry mechanisms

### Trigger Conditions (All must be met)
- [ ] **User Feedback**: ≥3 users request >20 badges/batch
- [ ] **Usage Frequency**: Bulk issuance feature used ≥10 times/week
- [ ] **Wait Time Complaints**: Users report 20-second wait is unacceptable
- [ ] **MVP Success**: Core bulk issuance workflow proven valuable

**Decision Point**: Sprint 10 Retrospective (review metrics)

### Phase 2 Solution
Upgrade Story 8.4 from synchronous to asynchronous processing using **Redis + Bull Queue**.

### Tasks (Estimated 6-8h)
- [ ] **Task 1:** Azure Redis Cache setup (0.5h)
  - Create Basic C0 instance ($12/month)
  - Configure connection in backend `.env`
  - Verify connection with health check
  
- [ ] **Task 2:** Install Bull Queue dependencies (0.5h)
  - `npm install @nestjs/bull bull @types/bull`
  - Configure BullModule in `app.module.ts`
  - Create `bulk-issuance-queue`
  
- [ ] **Task 3:** Database schema update (1h)
  - Create `BulkIssuanceJob` table in Prisma
    - Fields: jobId, sessionId, status, totalBadges, processedCount, successCount, failedCount
- Run migration: `npx prisma migrate dev`
  
- [ ] **Task 4:** Background processor implementation (3h)
  - Create `BulkIssuanceProcessor` class with `@Process()` decorator
  - Implement batch processing logic (10 badges per batch)
  - Progress tracking after each batch
  - Error handling (partial failures don't stop job)
  
- [ ] **Task 5:** Frontend async flow (2h)
  - Update confirmation to return jobId immediately
  - Implement job status polling (every 2 seconds)
  - Real-time progress bar component
  - Completion notification
  
- [ ] **Task 6:** Testing (2h)
  - 10 unit tests (processor, job API)
  - 5 E2E tests (async flow, progress, completion)
  - Load test with 100 badges

### Success Criteria
- [ ] Support ≥100 badges per batch
- [ ] Job creation < 1 second (non-blocking)
- [ ] Progress updates every 2 seconds
- [ ] Processing speed: ~10 badges/second
- [ ] All 876 existing tests pass (0 regressions)

### Cost Impact
- **Azure Redis**: +$12/month (Basic C0)
- **Maintenance**: +1-2h/month (monitoring, occasional scaling)

### Non-Goals (Still deferred)
- ❌ Job cancellation
- ❌ Resume from failure
- ❌ Parallel processing (concurrency > 1)
- ❌ WebSocket real-time updates (polling sufficient)

### Migration Path
**From MVP (Story 8.4) to Phase 2**:
1. Keep existing synchronous endpoint as fallback
2. Add new async endpoint: `/api/bulk-issuance/confirm-async/:sessionId`
3. Frontend detects batch size: <20 use sync, ≥20 use async
4. Gradual rollout: Monitor success rates
5. Deprecate sync endpoint in Sprint 11+

### References
- **Original Design**: `sprint-9/8-4-batch-processing-phase1.md` (contains commented async code)
- **Bull Queue Docs**: https://docs.nestjs.com/techniques/queues
- **Azure Redis Setup**: Sprint 9 Kickoff Readiness checklist (Section 3.2)
- **Redis Explanation**: Sprint 9 Planning discussion (2026-02-05)

---

## References
- **Technical Debt Backlog:** `gcredit-project/docs/sprints/technical-debt-from-reviews.md`
- **Sprint 8 Retrospective:** `gcredit-project/docs/sprints/sprint-8/retrospective.md`
- **ESLint Config:** `gcredit-project/backend/eslint.config.mjs`
- **Bundle Analysis:** `gcredit-project/frontend/vite.config.ts`

