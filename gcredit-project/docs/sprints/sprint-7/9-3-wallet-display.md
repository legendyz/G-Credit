# Story 9.3: Employee Wallet Display for Revoked Badges

**Story ID:** Story 9.3  
**Epic:** Epic 9 - Badge Revocation  
**Sprint:** Sprint 7  
**Priority:** HIGH  
**Story Points:** 3 → **4** ⚠️ **UPDATED**  
**Status:** Backlog  
**Last Updated:** February 1, 2026 (Post-Technical Review)

---

## ⚠️ UX DESIGN DECISIONS (Feb 1, 2026)

Following Sprint 7 Technical Review Meeting, Product Owner approved these UX decisions:

**✅ Decision #1: Wallet Display Pattern**
- **Approved:** Greyed out badge + red "REVOKED" banner overlay (Option A)
- **Rationale:** Employees need to see complete history for resume/portfolio
- **Implementation:** Active badges normal, revoked badges 50% opacity + red banner

**✅ Decision #2: Revocation Reason Visibility**
- **Approved:** Categorized display (public vs private reasons)
- **Public reasons:** "Expired", "Issued in Error" → show to employee
- **Private reasons:** "Policy Violation" → show generic "Contact admin for details"
- **Implementation:** Backend categorizes reason in API response

**✅ Decision #3: Share Button Treatment**
- **Approved:** Disabled with tooltip explaining why
- **Implementation:** `<button disabled className="cursor-not-allowed opacity-50" title="Revoked badges cannot be shared">`

**Estimate Updated:**
- Original: 3 hours
- **Revised: 4 hours** (+1h for reason categorization logic)

**References:**
- UX Review: See `EPIC-9-UX-REVIEW-AMELIA.md`
- Meeting Minutes: See `sprint-7-technical-review-meeting-minutes.md`

---

## User Story

**As an** Employee,  
**I want** to see which of my badges have been revoked in my wallet,  
**So that** I am informed of status changes and can understand why.

---

## Background / Context

Currently, Employee Wallet (`/wallet`) displays all issued badges without status distinction. When badges are revoked (Story 9.1), employees must:
1. See revoked badges marked clearly (not silently disappear)
2. Understand why revocation happened
3. Distinguish active vs. revoked credentials

Hiding revoked badges without notice would confuse employees. Showing them with clear status maintains transparency and trust.

---

## Acceptance Criteria

### AC1: Visual Status Badge - Greyed Out + Red Banner ⚠️ **UX DECISION**
**Given** I am logged in as Employee with revoked badges  
**When** I view My Wallet page  
**Then** revoked badges display with grey overlay + red "REVOKED" banner

- [x] **Visual treatment:** Badge card at 50% opacity (greyed out)
- [x] Red banner overlay with "🚫 REVOKED" text
- [x] Banner positioned at top-right or bottom-center of badge card
- [x] Active badges remain full opacity and color
- [x] No separate section (revoked badges mixed with active, visually distinguished)

### AC2: Revocation Details in Modal/Drawer - Categorized Reasons ⚠️ **UX DECISION**
**Given** I click on a revoked badge in wallet  
**When** details modal/drawer opens  
**Then** I see revocation information with categorized reason display

- [x] Revoked date (e.g., "Revoked on February 5, 2026")
- [x] **Categorized reason display:**
  - **Public reasons** ("Expired", "Issued in Error"): Show actual reason
  - **Private reasons** ("Policy Violation"): Show "This badge was revoked. Contact admin@gcredit.com for details."
- [x] Optional notes shown only if reason is public
- [x] Original issuance details still visible below revocation info

### AC3: Download and Share Disabled - With Tooltip ⚠️ **UX DECISION**
- [x] Share button visually disabled (opacity 50%, cursor-not-allowed)
- [x] **Tooltip on hover:** "Revoked badges cannot be shared"
- [x] Download button still enabled (employees can keep records)
- [x] LinkedIn/Teams share buttons both disabled with same tooltip

### AC4: Filtering and Sorting
- [x] Badge wallet supports status filter: "All" | "Active" | "Revoked"
- [x] Default view: "Active" (hides revoked badges unless explicitly selected)
- [x] Filter persists in session storage

### AC5: API Integration
- [x] Call `GET /api/badges/my-badges` includes `status` field
- [x] Frontend filters badges by status client-side
- [x] Response format:
  ```json
  [
    {
      "id": "uuid",
      "templateName": "...",
      "status": "ISSUED" | "CLAIMED" | "REVOKED",
      "revokedAt": "2026-02-05T14:30:00Z" (if revoked),
      "revocationReason": "..." (if revoked)
    }
  ]
  ```

---

## Non-Functional Requirements

### Performance
- [x] Wallet page load time < 1.5 seconds (no regression)
- [x] Filtering animation smooth (no jank)

### Accessibility
- [x] ARIA label for revoked status: `aria-label="Badge revoked on [date]"`
- [x] Keyboard navigation works (tab through filter buttons)
- [x] Screen reader announces badge status

### UX
- [x] Not overwhelming (default hides revoked badges)
- [x] Clear path to see revoked badges (filter toggle)
- [x] Empathetic messaging (not accusatory tone)

---

## Technical Details

### Frontend Components Affected
```
src/pages/employee/MyWalletPage.tsx (existing)
- Add status filtering UI (tabs or dropdown)
- Pass status prop to BadgeCard component

src/components/badges/BadgeCard.tsx (existing)
- Add conditional rendering for REVOKED status
- Show red badge overlay
- Gray out card or add red border

src/components/badges/BadgeDetailsModal.tsx (existing)
- Add revocation details section
- Disable Download and Share buttons when status = REVOKED
```

### API Response Structure
```typescript
// GET /api/badges/my-badges
Response:
[
  {
    "id": "uuid",
    "templateId": "uuid",
    "templateName": "Advanced React Development",
    "templateImageUrl": "https://...",
    "issuedAt": "2026-01-15T10:00:00Z",
    "claimedAt": "2026-01-16T14:30:00Z",
    "status": "REVOKED",  // NEW: ISSUED, CLAIMED, or REVOKED
    "revokedAt": "2026-02-05T14:30:00Z",  // NEW: Optional
    "revocationReason": "Policy Violation",  // NEW: Optional
    "revocationNotes": "Detailed explanation"  // NEW: Optional
  }
]
```

### Backend Changes
```typescript
// src/modules/badges/badges.service.ts
async getMyBadges(userId: string) {
  const badges = await this.prisma.badge.findMany({
    where: { recipientId: userId },
    include: {
      template: {
        select: { name: true, imageUrl: true }
      }
    },
    orderBy: { issuedAt: 'desc' }
  });

  return badges.map(badge => ({
    id: badge.id,
    templateName: badge.template.name,
    templateImageUrl: badge.template.imageUrl,
    issuedAt: badge.issuedAt,
    claimedAt: badge.claimedAt,
    status: badge.status,  // Include status
    ...(badge.status === BadgeStatus.REVOKED && {
      revokedAt: badge.revokedAt,
      revocationReason: badge.revocationReason,
      revocationNotes: badge.revocationNotes
    })
  }));
}
```

---

## UI/UX Design

### Wallet Page with Filter Tabs
```
┌─────────────────────────────────────────────┐
│ My Badges                                   │
│                                             │
│ [Active (5)] [Revoked (1)] [All (6)]       │
│ ─────────   ──────────   ─────             │
│                                             │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│ │ Badge 1 │  │ Badge 2 │  │ 🚫 Badge│     │
│ │ Active  │  │ Active  │  │ REVOKED │     │
│ │         │  │         │  │ (grayed)│     │
│ └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────┘
```

### Badge Card with Revoked Status
```
┌─────────────────────────┐
│  Badge Image            │
│  (grayed out, 50% opacity)
│                         │
│  🚫 REVOKED             │ ← Red badge overlay
│                         │
│  Advanced React Dev     │
│  Issued: Jan 15, 2026   │
│  Revoked: Feb 5, 2026   │ ← New line
└─────────────────────────┘
```

### Badge Details Modal (Revoked Badge)
```
┌─────────────────────────────────────┐
│ 🚫 Badge Revoked                    │
│ ───────────────────────────────     │
│ This badge was revoked on           │
│ February 5, 2026                    │
│                                     │
│ Reason: Policy Violation            │
│ Notes: [Detailed explanation]       │
│                                     │
│ ─────────────────────────────       │
│ Original Badge Information          │
│                                     │
│ Template: Advanced React Dev        │
│ Issued: January 15, 2026            │
│ Claimed: January 16, 2026           │
│                                     │
│ [Download - DISABLED]               │
│ [Share - DISABLED]                  │
└─────────────────────────────────────┘
```

### Color Palette
- Revoked badge overlay: `bg-red-600 text-white` (pill badge)
- Grayed out card: `opacity-50`
- Red border option: `border-2 border-red-500`

---

## Test Plan

### Unit Tests (Frontend)
- [x] Renders revoked badge with status overlay
- [x] Filters badges by status (Active, Revoked, All)
- [x] Disables Download and Share buttons for revoked badges
- [x] Displays revocation details in modal
- [x] Default filter shows only Active badges

### Unit Tests (Backend)
- [x] GET /api/badges/my-badges includes status field
- [x] Returns revocation metadata when status = REVOKED
- [x] Excludes revocation fields when status ≠ REVOKED

### E2E Tests
- [x] Employee logs in with 1 active + 1 revoked badge
- [x] Default view shows only active badge
- [x] Click "Revoked" filter → see revoked badge
- [x] Click revoked badge → modal shows revocation details
- [x] Download and Share buttons disabled

### UAT Test Cases (See uat-test-plan.md)
- Scenario 1.6: Badge Revocation → Employee views wallet
- Scenario 3.1: Employee sees revoked badge in wallet

---

## Definition of Done

### Code Complete
- [x] BadgeCard component updated with REVOKED status
- [x] MyWalletPage has status filter UI
- [x] BadgeDetailsModal shows revocation details
- [x] Backend API returns status and revocation fields
- [x] Download/Share buttons disabled logic
- [x] No TypeScript/ESLint errors

### Testing Complete
- [x] Unit tests for frontend components (>80% coverage)
- [x] Unit tests for backend API
- [x] E2E test with revoked badges
- [x] Manual testing with real data
- [x] Cross-browser testing

### Documentation Complete
- [x] Component changes documented in code
- [x] Story file updated with completion notes
- [x] Screenshots added to story file

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| Backend: Update my-badges API | 0.5h | Dev |
| Frontend: Badge filter UI | 1h | Dev |
| Frontend: BadgeCard status display | 1h | Dev |
| Frontend: BadgeDetailsModal revocation section | 0.5h | Dev |
| Styling (Tailwind CSS) | 0.5h | Dev |
| Unit tests (Frontend + Backend) | 1h | Dev |
| E2E tests | 0.5h | Dev |
| Manual testing & fixes | 0.5h | Dev |
| **Total** | **5.5h** | |

### Confidence Level
Medium-High - UI work with some complexity in filtering

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation
- [x] Story 9.1: Badge Revocation API (must have revoked badges)

### Blocks
- Story U.1: Complete Lifecycle UAT (requires wallet display)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Employees upset seeing revoked badges | Low | Medium | Default to "Active" filter, empathetic messaging |
| Filter UI confusing | Low | Low | Use standard tab pattern, clear labels |
| Performance with many badges | Low | Low | Client-side filtering is fast, paginate if needed |

---

## Questions & Assumptions

### Assumptions
- Default filter is "Active" (hides revoked badges unless clicked)
- Employees can see their own revocation reasons (transparent)
- No "dispute" or "appeal" action in this story (future enhancement)
- Filter state saved in session storage (not user preferences DB)

### Open Questions
- Should we show count in filter tabs? (e.g., "Revoked (3)") → Yes, per wireframe
- Should we allow bulk hide/unhide of revoked badges? → Not in this story

---

## Timeline

**Estimated Start:** February 4, 2026 (Day 2)  
**Estimated Completion:** February 4, 2026 (Day 2)  
**Actual Start:** [TBD]  
**Actual Completion:** [TBD]

---

## Related Links

- **Epic 9:** Badge Revocation (in epics.md)
- **Sprint 7 Backlog:** [backlog.md](backlog.md)
- **Story 9.1:** [Badge Revocation API](9-1-revoke-api.md) (prerequisite)

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-01-31 | Backlog | Bob (Scrum Master) | Story created during planning |

---

**Next Story:** [9.4: Revocation Notifications](9-4-notifications.md)
