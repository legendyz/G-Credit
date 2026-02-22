# Code Review Report — Story 12.5: Evidence Unification (Data Model + Migration)

## Scope

- Story: `docs/sprints/sprint-12/12-5-evidence-unification-data-model.md`
- Dev Prompt: `docs/sprints/sprint-12/12-5-dev-prompt.md`
- Review Prompt: `docs/sprints/sprint-12/12-5-code-review-prompt.md`
- Base commit: `519f61c`
- Reviewed commits: `40502b4`, `175df06`

## Verdict

**Approved with Notes.**

The implementation is consistent with Story 12.5 goals and acceptance criteria. No blocking defects were found in the reviewed scope. Schema migration, evidence unification behavior, and bulk CSV `evidenceUrl` removal are implemented and validated.

## What Was Verified

### Backend

- ✅ Prisma migration is schema-only and additive (`EvidenceType`, `EvidenceFile.type`, `EvidenceFile.sourceUrl`).
- ✅ Data migration scripts exist for both directions:
  - `scripts/migrate-evidence.ts` (idempotent up migration with `--dry-run`)
  - `scripts/migrate-evidence-down.ts` (down migration restoring `Badge.evidenceUrl`)
- ✅ `issueBadge()` writes URL evidence into `EvidenceFile(type='URL')` and keeps `Badge.evidenceUrl` for temporary backward compatibility.
- ✅ `findOne()` now returns unified `evidence[]` (FILE + URL) while preserving legacy `evidenceUrl` in response.
- ✅ `EvidenceService` supports URL evidence creation (`addUrlEvidence`) with issuer/admin authorization checks.
- ✅ Download/preview guard rejects URL-type evidence for SAS endpoints.
- ✅ Bulk issuance path no longer consumes/passes `evidenceUrl` from CSV.

### API / Controller

- ✅ New endpoint exists: `POST /api/badges/:badgeId/evidence/url`.
- ✅ Endpoint has RBAC guards and DTO validation (`AddUrlEvidenceDto`).
- ✅ Existing multipart upload endpoint remains intact.

### Frontend impact

- ✅ Bulk preview model/table removed `evidenceUrl` column and corresponding test assertions.

## Findings

### Blocking Issues

None.

### Non-Blocking Recommendations

1. **Type safety (low):** `EvidenceFileResponse.type` in `upload-evidence.dto.ts` is `string`; prefer union type `'FILE' | 'URL'`.
2. **Defense-in-depth (low):** `addUrlEvidence()` service-level URL validation currently uses `new URL(...)`; consider explicitly constraining protocol to `http/https` in service as well (even though controller DTO validates).
3. **Code hygiene (low):** `CSVParserService.isValidURL()` remains unused after CSV `evidenceUrl` removal.
4. **Down migration UX (low):** `migrate-evidence-down.ts --dry-run` could log per-record details (currently summary-only behavior is functional but less transparent).

## AC Coverage Summary

- **AC1:** Met — `EvidenceFile` supports `type` and `sourceUrl`.
- **AC2:** Met — migration script converts `Badge.evidenceUrl` to URL-type evidence records with idempotency.
- **AC3:** Met — `Badge.evidenceUrl` retained for compatibility while unified path is active.
- **AC4:** Met (practical implementation) — file and URL evidence are both supported through unified model with dedicated endpoints/content types.
- **AC5:** Met — badge detail returns unified `evidence[]`.
- **AC6:** Met — FILE evidence via SAS, URL evidence via direct link (and SAS guard).
- **AC7:** Met — no regressions observed in targeted checks.
- **AC8:** Met — down migration script present and operational.

## Validation Evidence

Executed in workspace:

- `backend`: `npm run type-check` ✅
- `backend`: `npm run lint` ✅
- `frontend`: `npm run build` ✅
- `frontend`: `npm run lint` ✅
- `backend`: `npm test -- evidence.service.spec.ts --runInBand` ✅ (18/18)
- `backend`: `npm test -- badge-issuance.service.spec.ts --runInBand` ✅ (31/31)
- `backend`: `npm test -- bulk-issuance.service.spec.ts --runInBand` ✅ (57/57)
- `backend`: `npm test -- csv-validation.service.spec.ts --runInBand` ✅ (58/58)
- `backend`: `npx jest --config test/jest-e2e.json test/badge-issuance.e2e-spec.ts --runInBand` ✅ (28/28)
- `backend`: `npx jest --config test/jest-e2e.json test/bulk-issuance-template.e2e-spec.ts --runInBand` ✅ (6/6)

## Approval Decision

**Approved with Notes**

Story 12.5 is ready to proceed. The listed recommendations can be tracked as follow-up cleanup items (non-blocking).
