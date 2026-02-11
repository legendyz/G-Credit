# Story 10.8 Code Review

**Story:** gcredit-project/docs/sprints/sprint-10/10-8-uat-bug-fixes.md  
**Reviewer:** LegendZhu  
**Date:** 2026-02-10  

## Git Status
- Clean working tree (no uncommitted changes).

## Findings

### HIGH
1. **Badge template create/edit submits an invalid `issuanceCriteria` shape that fails backend validation.** The form builds `{ requirements: string[] }`, but the backend requires `IssuanceCriteriaDto` with a required `type` field. This will 400 on create/update or overwrite existing structured criteria with an invalid shape. See [issuanceCriteria build](gcredit-project/frontend/src/pages/admin/BadgeTemplateFormPage.tsx#L147-L174) and [DTO requirement](gcredit-project/backend/src/badge-templates/dto/issuance-criteria.dto.ts#L44-L82).

### MEDIUM
2. **Badge template form never collects skill IDs and always sends `skillIds: []` on create.** The API contract requires `skillIds`, and templates without skills break filtering and search semantics. See [create payload](gcredit-project/frontend/src/pages/admin/BadgeTemplateFormPage.tsx#L168-L175) and [skillIds required](gcredit-project/backend/src/badge-templates/dto/badge-template.dto.ts#L44-L67).
3. **Design system compliance gap in new Badge Template list UI.** Status badges and action buttons use hardcoded color utilities (`bg-amber-100`, `text-amber-800`, `bg-green-600`), which conflicts with the story’s requirement to use `@theme` tokens. See [status badge colors](gcredit-project/frontend/src/pages/admin/BadgeTemplateListPage.tsx#L47-L61) and [activate button color](gcredit-project/frontend/src/pages/admin/BadgeTemplateListPage.tsx#L353-L366).

## Notes
## Regression Test Checklist (Not Evidenced)
- BUG-002: Navbar/MobileNav links (Dashboard + My Wallet) — update/add tests for both components.
- BUG-005: SearchInput controlled mode — verify typing works in Badge Management + Wallet search contexts.
- BUG-004: IssueBadge recipients endpoint — admin and issuer can load recipients; employee/manager blocked.
- BUG-003: Badge Template CRUD — list, create, edit, status transitions, delete.
- BUG-006: Manager revocation — same-department only; cross-department denied.
- BUG-007: Profile + password change — profile load/save and password validation paths.
- BUG-008: Bulk issuance timeout — transaction timeout and maxWait updated.
- AC5: Re-run affected UAT test cases.
- AC6: Full test suite (1087+ tests).

## Notes
- AC5 (re-run affected UAT cases) and AC6 (full test suite) are not evidenced in repo artifacts; verify before release.

## Re-review (2026-02-10)

### HIGH
1. **Editing a template forces `issuanceCriteria` to `manual`, which can destroy existing auto-criteria definitions.** The form always sends `{ type: 'manual', description }` on update, so any template with `conditions` or non-manual type will be overwritten. See [criteria build](gcredit-project/frontend/src/pages/admin/BadgeTemplateFormPage.tsx#L161-L166) and [update payload](gcredit-project/frontend/src/pages/admin/BadgeTemplateFormPage.tsx#L169-L182).

### MEDIUM
2. **Skill selections are not persisted on edit.** The UI allows toggling skills, but `updateTemplate` never sends `skillIds`, so changes are dropped. See [skill state](gcredit-project/frontend/src/pages/admin/BadgeTemplateFormPage.tsx#L65-L109) and [update payload](gcredit-project/frontend/src/pages/admin/BadgeTemplateFormPage.tsx#L169-L182).
3. **Touch targets in Badge Template list are below 44px.** Filter tabs and action buttons use `min-h-[36px]`, which conflicts with the Story 10.8 touch-target requirement. See [filter tabs](gcredit-project/frontend/src/pages/admin/BadgeTemplateListPage.tsx#L241) and [card actions](gcredit-project/frontend/src/pages/admin/BadgeTemplateListPage.tsx#L349-L416).

### Resolved From Prior Review
- `issuanceCriteria` now includes a valid `type` field for create/update. See [criteria build](gcredit-project/frontend/src/pages/admin/BadgeTemplateFormPage.tsx#L161-L166).
- `skillIds` are populated on create via selected skills. See [create payload](gcredit-project/frontend/src/pages/admin/BadgeTemplateFormPage.tsx#L186-L190).
- List page status badges use theme tokens for warning/success states. See [status badge config](gcredit-project/frontend/src/pages/admin/BadgeTemplateListPage.tsx#L47-L68).
