# Story: Bulk Evidence Attachment by Template Group

Status: backlog

## Story

As an **Admin/Issuer**,
I want to attach evidence (files and/or URLs) to bulk-issued badges grouped by template, with option for per-badge individual evidence,
So that bulk issuance has the same evidence capabilities as single badge issuance without requiring evidence in the CSV file.

## Context

- **Prerequisite:** Story 12.5 (evidence data model unification) + Story 12.6 (evidence UI components)
- **Background:** Sprint 12 removed `evidenceUrl` from CSV template (PO decision 2026-02-22) to simplify the UX. This story implements the replacement: a two-step grouped flow for attaching evidence after bulk issuance.
- **Reuses:** `<EvidenceList>` component from Story 12.6, evidence API endpoints from Story 12.5
- **Estimate:** ~8h (TBD in Phase 2 review)

## User Flow

### Step 1: Upload CSV (unchanged from Sprint 12)
```
CSV columns: recipientEmail, templateId, expiresIn (optional)
↓
Upload → Validate → Preview table → Confirm → Bulk issue badges
```

### Step 2: Attach Evidence by Template Group (NEW)
```
┌──────────────────────────────────────────────────────┐
│ 📋 Bulk Issuance Complete — 18 badges issued         │
│                                                      │
│ 🏆 Cloud Architecture (15 badges)           [展开 ▼] │
│  ├─ 📋 Shared Evidence (0/5):                        │
│  │  ┌────────────────────────────────┐               │
│  │  │ 📎 Drag files here or browse    │               │
│  │  └────────────────────────────────┘               │
│  │  🔗 [Enter URL______________] [+ Add]             │
│  │                                                   │
│  ├─ 📧 alice@gcredit.com  ✅  [+ Individual Evidence] │
│  ├─ 📧 bob@gcredit.com    ✅  [+ Individual Evidence] │
│  └─ 📧 carol@gcredit.com  ✅  [+ Individual Evidence] │
│                                                      │
│ 🏆 Innovation Award (3 badges)              [展开 ▼] │
│  ├─ 📋 Shared Evidence (0/5):  [Add Evidence]        │
│  ├─ 📧 dave@gcredit.com   ✅                         │
│  └─ 📧 emma@gcredit.com   ✅                         │
│                                                      │
│                          [完成] [Skip — No Evidence]  │
└──────────────────────────────────────────────────────┘
```

### Key UX Behaviors:
- **Shared Evidence:** Attached to ALL badges in the template group (calls API for each badge)
- **Individual Evidence:** Optional per-badge override using `[+ Individual Evidence]` button → opens inline `<EvidenceList editable={true}>` for that specific badge
- **5-item limit:** Shared + individual combined ≤ 5 per badge
- **Skip option:** User can skip evidence entirely (badges already issued in Step 1)
- **Progress:** Show upload progress per template group, not per badge

## Acceptance Criteria

1. [ ] Bulk issuance result page displays badges grouped by template
2. [ ] Each template group has a shared evidence attachment area (drag+drop files, URL input)
3. [ ] Shared evidence is applied to ALL badges in the group (up to 5 items per badge)
4. [ ] Individual per-badge evidence can be added via `[+ Individual Evidence]` button
5. [ ] Combined evidence (shared + individual) ≤ 5 per badge, with clear limit indicator
6. [ ] File upload shows per-file progress bar (reuses 12.6 `<EvidenceList>` component)
7. [ ] User can skip evidence attachment entirely ("Skip — No Evidence" button)
8. [ ] Evidence attachment uses existing API endpoints (`POST /api/badges/:badgeId/evidence` for files, `POST /api/badges/:badgeId/evidence/url` for URLs)
9. [ ] All evidence items correctly stored as `EvidenceFile` records (FILE or URL type)
10. [ ] Frontend tests cover grouped flow, individual evidence, limit enforcement

## Tasks / Subtasks

- [ ] Task 1: Bulk result page — template group layout
  - [ ] Group issued badges by `templateId`
  - [ ] Collapsible group sections with badge count
  - [ ] Show recipient list per group with status indicators
- [ ] Task 2: Shared evidence upload per group
  - [ ] Reuse `<EvidenceList editable={true}>` from Story 12.6
  - [ ] On "Complete" — iterate all badges in group, call evidence API for each
  - [ ] Show group-level progress (X/N badges processed)
  - [ ] Handle partial failures gracefully (some uploads fail, others succeed)
- [ ] Task 3: Individual per-badge evidence (MVP+)
  - [ ] `[+ Individual Evidence]` button per badge row
  - [ ] Inline expand → `<EvidenceList>` for that specific badge
  - [ ] Combined count: shared + individual ≤ 5
- [ ] Task 4: Skip flow
  - [ ] "Skip — No Evidence" button → navigate to success/dashboard
  - [ ] Confirm dialog if evidence partially attached
- [ ] Task 5: Tests
  - [ ] Template grouping logic
  - [ ] Shared evidence API call fan-out
  - [ ] Individual evidence limit enforcement
  - [ ] Skip flow navigation

## Dev Notes

### Architecture
- **Frontend-only story** — all backend APIs already exist from Story 12.5/12.6
- Reuses `<EvidenceList>` component (drag+drop, URL input, progress bar)
- Shared evidence = fan-out: 1 set of evidence items → N API calls (one per badge in group)
- Consider batching/parallelism for large groups (15+ badges)

### API Calls (all existing)
- `POST /api/badges/:badgeId/evidence` — file upload (multipart)
- `POST /api/badges/:badgeId/evidence/url` — URL evidence (JSON body)
- `GET /api/badges/:badgeId/evidence` — list evidence per badge

### Risk Assessment
- **MEDIUM:** Fan-out for large groups (50+ badges × 5 evidence items = 250 API calls) — consider rate limiting or batch endpoint
- **LOW:** UX complexity of shared + individual evidence — keep individual evidence as MVP+ (can defer)

### Origin
- PO decision 2026-02-22: Remove `evidenceUrl` from CSV, replace with post-issuance grouped attachment
- Discussed as "方案D改进版" — groups by template instead of per-badge to reduce clicks

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
