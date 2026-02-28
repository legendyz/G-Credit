# Sprint 14 Retrospective

**Sprint:** Sprint 14 — Dual-Dimension Role Model Refactor  
**Date:** 2026-02-28  
**Facilitator:** Bob (Scrum Master Agent)  
**Participants:** LegendZhu, Amelia (Dev Agent), Bob (SM Agent)

---

## ✅ What Went Well

### 1. Architecture-First Approach Paid Off
ADR-017 provided a complete 11-step implementation sequence. Stories 14.2–14.4 followed the spec precisely, resulting in zero design ambiguity during development. The dual-dimension identity model (Permission × Organization) is clean and extensible.

### 2. Story Absorption Was Efficient
Stories 14.5 (RolesGuard cleanup) and 14.6 (M365 sync cleanup) were naturally absorbed into Story 14.2 during schema migration. This avoided artificial story boundaries and reduced context-switching. The expanded-scope CR properly accounted for the merged work.

### 3. Code Review Process Caught Real Issues
- 14.7 CR: Found `ProtectedRoute` requireManager evaluation gap and `useDashboard` unconditional API calls
- 14.9 CR: Found LinkedIn SVG `fill` not tokenized — follow-up commit resolved
- Every CR added measurable quality improvements

### 4. Test Matrix Provides Confidence
The 31-test role×manager matrix (Story 14.8) validates all 6 valid combinations against 4 real endpoints plus dashboard access. This is the ADR-017 §7 safety net that prevents future regressions.

### 5. Sprint Pacing Was Smooth
9 stories completed in 2 days with no blockers. Wave structure (quick win → backend → frontend → testing) ensured each wave built on a stable foundation.

---

## ⚠️ What Could Be Improved

### 1. Rate Limit Discovery Was Late
TD-038 (auth endpoint rate limits hardcoded in `@Throttle` decorators) was discovered during Story 14.8 E2E testing when >5 logins were needed. This forced a workaround (`JwtService.sign()` for the 6th test user). Should be addressed before Sprint 15 E2E testing grows.

### 2. Version Verify Script Has Encoding Issues
`verify-versions.ps1` has Chinese character encoding corruption, preventing automated version manifest verification. This is a recurring issue from Sprint 13.

### 3. Story 14.4 Backlog Status Inconsistency
Story 14.4 was completed but the backlog.md still showed `backlog` status for 14.4 and `backlog (partial)` for 14.7. Sprint-status.yaml was correctly updated but backlog.md was not maintained in sync.

---

## 🎯 Action Items for Sprint 15

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Address TD-038 (configurable auth rate limits) — Story 15.14 in backlog | Dev | MEDIUM |
| 2 | Fix verify-versions.ps1 encoding issue | Dev | LOW |
| 3 | Use `@theme` design tokens consistently in all new Sprint 15 UI work | Dev | HIGH |
| 4 | Validate all 6 role×manager combos in Sprint 15 dashboard composite view | SM | HIGH |

---

## 📊 Sprint Metrics

| Metric | Sprint 13 | Sprint 14 | Trend |
|--------|-----------|-----------|-------|
| Stories | 8/8 (100%) | 9/9 (100%) | → |
| Tests | 1,708 | 1,757 (+49) | ↑ |
| Tech Debt Resolved | 0 | 2 (TD-034, TD-036) | ↑ |
| Tech Debt Created | 1 (TD-036) | 1 (TD-038) | → |
| Regressions | 0 | 0 | → |
| CR follow-ups | 3 | 3 | → |

---

## 📚 Lessons Learned

### Lesson 49: Architecture Specs as Development Contracts

**What Happened:** ADR-017 specified an 11-step implementation sequence with explicit file lists, guard patterns, and test matrix requirements. Development followed the spec step-by-step with zero interpretation disputes.

**Root Cause:** Investment in detailed architecture spec (ADR-017) before Sprint Planning paid dividends during execution.

**Key Takeaway:**
> For architectural refactors, invest time in a detailed ADR with step-by-step implementation guidance. The ADR becomes a development contract — not just a decision record.

### Lesson 50: Story Absorption Reduces Overhead

**What Happened:** Stories 14.5 and 14.6 were absorbed into 14.2 because the schema migration naturally included RolesGuard cleanup and M365 sync changes. Keeping them separate would have created artificial boundaries.

**Root Cause:** Fine-grained story splitting sometimes creates unnecessary handoff points for tightly coupled changes.

**Key Takeaway:**
> When a larger story naturally encompasses smaller related stories, absorb them early and note it in sprint-status.yaml rather than creating artificial development boundaries.

### Lesson 51: Rate Limiter Settings Need E2E Testing Awareness

**What Happened:** Auth controller has 8 `@Throttle()` decorators with hardcoded limits that override the global `ConfigService`-based throttle config. Story 14.8's 6-combination matrix needed >5 logins, hitting the 5/min rate limit.

**Root Cause:** Rate limits were set for production security but never considered E2E testing scenarios.

**Key Takeaway:**
> When adding rate limiters, always consider the E2E testing impact. Use `ConfigService`-based values that can be overridden in test environments rather than hardcoded decorator values.

---

## 🔗 Sprint Documents

| Document | Path |
|----------|------|
| Backlog | [backlog.md](backlog.md) |
| Version Manifest | [version-manifest.md](version-manifest.md) |
| Summary | [summary.md](summary.md) |
| Story files | 14-1 through 14-9 (9 files) |
| Dev prompts | 14-1 through 14-9 (9 files) |
| CR results | 14-1 through 14-9 (9 files) |
