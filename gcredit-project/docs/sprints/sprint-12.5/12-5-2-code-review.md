# Code Review: Story 12.5.2

**Verdict:** Approved

## Scope

- Story: `docs/sprints/sprint-12.5/12.5.2-remove-evidence-url.md`
- Review prompt: `docs/sprints/sprint-12.5/code-review-prompt-12.5.2.md`
- Branch: `sprint-12.5/deferred-cleanup`
- Base: `f6ccfe8`
- Reviewed commit: `59b7e19`
- Re-review commit: `670fc15` (story/status/docs sync)

## AC Status

- AC-1: ✅ `evidenceUrl` removed from `Badge` model in `backend/prisma/schema.prisma`.
- AC-2: ✅ Migration generated with `ALTER TABLE "badges" DROP COLUMN "evidenceUrl"` in `backend/prisma/migrations/20260225033009_remove_badge_evidence_url/migration.sql`.
- AC-3: ✅ Migration SQL affects only one column in one table (`badges.evidenceUrl`).
- AC-4: ✅ Backend full suite passed: **855 passed**, 28 skipped, 46/50 suites executed (`npx jest --forceExit`).
- AC-5: ✅ Frontend full suite passed: **735 passed**, 68/68 files (`npx vitest run`).
- AC-6: ✅ Stale `evidenceUrl` comments removed from `backend/src/badge-issuance/dto/bulk-issue-badges.dto.ts`.
- AC-7: ✅ `npx prisma generate` succeeds; generated Prisma client types do not contain `evidenceUrl` in `backend/node_modules/.prisma/client/index.d.ts`.

## Findings

### Confirmed

- R-1 (migration safety): Confirmed single-column drop only.
- R-2 (no application code references): No `evidenceUrl` matches in `backend/src/**` or `frontend/src/**`.
- R-3 (factory cleanup): `badge.factory.ts` cleanup is correct; no `evidenceUrl` usage found in `backend/test/**` as factory input.
- R-4 (deleted scripts references): No `migrate-evidence*` references in `backend/package.json` scripts.
- R-5 (historical migration untouched): `20260127020604_add_badge_model/migration.sql` not modified by `59b7e19`.

### Comments (Non-blocking)

1. Historical/project docs still reference deleted scripts (`scripts/migrate-evidence.ts`, `scripts/migrate-evidence-down.ts`) in older Sprint 12 docs/prompts. This does not block schema cleanup correctness, but documentation hygiene follow-up is recommended.

## Summary

Story 12.5.2 implementation is correct and low-risk. The legacy `Badge.evidenceUrl` column removal is cleanly applied at schema + migration + generated client levels, and full backend/frontend suites are green. Approved with a minor documentation cleanup comment.

## Re-review Update (2026-02-25)

- Re-reviewed latest branch head `670fc15`.
- This commit contains documentation/status synchronization only (`12.5.2` status to `done`, review prompt/report files) and introduces no new backend/frontend source changes affecting Story 12.5.2 runtime behavior.
- Prior validation evidence for `59b7e19` remains valid; verdict is unchanged.
- Non-blocking documentation hygiene comment **resolved**: all references are in historical Sprint 12 docs (dev prompts, code reviews, UAT) that accurately described state at time of writing — no modification needed. Sprint 12.5 docs already correctly document the scripts as DELETED.
