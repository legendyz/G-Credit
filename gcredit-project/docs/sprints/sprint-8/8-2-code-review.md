# Story 8.2 Code Review

**Story/Task:** 8.2 Badge Search & Filter Enhancement  
**Date:** 2026-02-05  
**Reviewer:** Amelia (Dev Agent)

---

## Scope Reviewed
- Frontend search components, wallet search integration, badge management search integration
- Backend badge issuance query DTOs and filtering logic
- Story documentation vs repo state

---

## Summary
Search UI components are present, but several ACs are unimplemented or only partially wired. Critical gaps include missing backend query parameters for skills/date/issuer filters, no server-side search path for large datasets, and skills filters that do not function because skill IDs are never populated.

---

## Git vs Story Discrepancies
- **No tracked code changes detected for Story 8.2; only an untracked test output file exists.** This makes it impossible to verify a completed implementation from git history alone. Evidence: `git status --porcelain` (untracked: gcredit-project/frontend/test-output.txt)
- **Story status remains “backlog” despite implementation claims.** Evidence: [8-2-badge-search-enhancement.md](gcredit-project/docs/sprints/sprint-8/8-2-badge-search-enhancement.md#L9)

---

## Findings

### 🔴 High

1) **Backend search/filter API changes are missing (AC1, AC2, AC5)**
- The backend query DTOs and service only support `status`, `templateId`, and `search` for issued badges; there are no query params or filtering for `skills`, `fromDate`, `toDate`, or `issuerId`. Wallet query DTO also lacks all search-related fields. This blocks server-side search, skills/date filters, and issuer filter requirements.
- Evidence: [query-badge.dto.ts](gcredit-project/backend/src/badge-issuance/dto/query-badge.dto.ts#L1-L82), [wallet-query.dto.ts](gcredit-project/backend/src/badge-issuance/dto/wallet-query.dto.ts#L1-L27), [badge-issuance.service.ts](gcredit-project/backend/src/badge-issuance/badge-issuance.service.ts#L498-L546)

2) **Server-side search switch is unimplemented (AC5)**
- `useBadgeSearch` exposes a server-search option but never calls it; `isSearching` is hardcoded false and the callback is explicitly reserved for future use. This violates AC5 for 50+ badges.
- Evidence: [useBadgeSearch.ts](gcredit-project/frontend/src/hooks/useBadgeSearch.ts#L94-L113)

3) **Skills filter is non-functional because badge skill IDs are never populated (AC1, AC2)**
- Wallet and Badge Management map badges with `skillIds: []` and TODO placeholders, so any skills filter will always return no matches.
- Evidence: [TimelineView.tsx](gcredit-project/frontend/src/components/TimelineView/TimelineView.tsx#L28-L42), [BadgeManagementPage.tsx](gcredit-project/frontend/src/pages/admin/BadgeManagementPage.tsx#L146-L166)

---

### 🟡 Medium

4) **Issuer filter UI is missing in Badge Management (AC2)**
- The shared `BadgeSearchBar` only includes skills/date/status controls; no issuer dropdown is wired, and `useBadgeSearch`’s `issuerFilter` is never set from UI.
- Evidence: [BadgeSearchBar.tsx](gcredit-project/frontend/src/components/search/BadgeSearchBar.tsx#L94-L156)

5) **Mobile search UX requirements are incomplete (AC1)**
- The wallet search bar is sticky, but there’s no focus-driven “auto-expand to full width” behavior or temporary hiding of filter chips as required. Infinite scroll on mobile is also not implemented.
- Evidence: [TimelineView.tsx](gcredit-project/frontend/src/components/TimelineView/TimelineView.tsx#L213-L232)

6) **No-results empty state copy does not meet AC1**
- AC1 requires a message including the query and suggestions. Current wallet no-results state only shows a generic message and a clear filters button.
- Evidence: [TimelineView.tsx](gcredit-project/frontend/src/components/TimelineView/TimelineView.tsx#L240-L254)

---

## Recommendations
- Implement backend query params (`skills`, `fromDate`, `toDate`, `issuerId`, pagination) for `/api/badges/my-badges` and `/api/badges/issued`, plus server-side filtering in service layer.
- Wire server-side search in `useBadgeSearch` for datasets ≥50 and provide a loading state.
- Populate `skillIds` and issuer fields in badge responses so skills/issuer filters work.
- Add issuer dropdown in Badge Management and pass `issuerFilter` to search hook.
- Complete mobile UX requirements (focus expansion, hiding chips, infinite scroll), and update empty-state copy per AC1.

---

## Outcome
**Status:** Changes requested (high-severity AC gaps present).
