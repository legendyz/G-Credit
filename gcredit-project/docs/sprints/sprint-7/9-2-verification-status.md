# Story 9.2: Revoked Badge Display in Verification Page

**Story ID:** Story 9.2  
**Epic:** Epic 9 - Badge Revocation  
**Sprint:** Sprint 7  
**Priority:** HIGH  
**Story Points:** 3  
**Status:** Backlog

---

## User Story

**As a** Public Viewer or Verifier,  
**I want** to see if a badge has been revoked when viewing verification page,  
**So that** I know the badge is no longer valid and understand why.

---

## Background / Context

Currently, badge verification page (`/verify/:badgeId`) shows badge as valid regardless of status. When badges are revoked (Story 9.1), the verification page must:
1. Clearly indicate REVOKED status
2. Display revocation date and reason
3. Use visual cues (red alert, warning icon)
4. Preserve original badge details for audit purposes

This is critical for trust in the credentialing system - verifiers must know if credential is current or revoked.

---

## Acceptance Criteria

### AC1: Visual Status Indicator
**Given** I visit verification page for revoked badge  
**When** page loads  
**Then** prominent red alert box displays "BADGE REVOKED" message

- [x] Red banner/alert at top of page
- [x] Warning icon (⚠️ or similar)
- [x] "BADGE REVOKED" text in large font
- [x] Revoked date displayed (e.g., "Revoked on February 5, 2026")

### AC2: Revocation Details
- [x] Revocation reason displayed (Policy Violation, Issued in Error, Expired, Other)
- [x] Revocation notes displayed if provided (optional field)
- [x] "Revoked by: Admin Name" (or "System Admin" if redacted)
- [x] Clear separation from badge details section

### AC3: Original Badge Information
- [x] All original badge details still visible (grayed out or dimmed)
- [x] Template name, issue date, recipient name, issuer
- [x] Competencies/criteria section
- [x] Visual indicator (e.g., strikethrough or opacity) that info is historical

### AC4: API Integration
- [x] Call `GET /api/badges/:id/verify` endpoint
- [x] Response includes `status: 'REVOKED'` field
- [x] Response includes revocation metadata:
  ```json
  {
    "badge": { ... },
    "status": "REVOKED",
    "revokedAt": "2026-02-05T14:30:00Z",
    "revocationReason": "Policy Violation",
    "revocationNotes": "Optional details"
  }
  ```

### AC5: No Download for Revoked Badges
- [x] "Download Badge" button disabled or hidden
- [x] "Share" button disabled (cannot share revoked credentials)
- [x] Tooltip explains: "This badge has been revoked and cannot be downloaded"

---

## Non-Functional Requirements

### Performance
- [x] Page load time < 1 second (no performance regression)
- [x] Status check included in existing verification API call (no extra query)

### Accessibility
- [x] ARIA label for revoked status: `role="alert"` on banner
- [x] Color-blind friendly (not only red - use icon + text)
- [x] Screen reader announces "Badge Revoked" status

### UX
- [x] Clear visual hierarchy (status first, details below)
- [x] Not alarming to point of hiding information
- [x] Professional tone in messaging

---

## Technical Details

### Frontend Components Affected
```
src/pages/VerifyBadgePage.tsx (existing)
- Add status checking logic
- Conditional rendering for revoked state
- New RevokedBadgeAlert component

src/components/badges/RevokedBadgeAlert.tsx (new)
- Red alert banner
- Displays revocation details
- Accepts props: { revokedAt, reason, notes }
```

### API Response Structure
```typescript
// GET /api/badges/:badgeId/verify
Response:
{
  "badge": {
    "id": "uuid",
    "templateName": "...",
    "recipientName": "...",
    // ... other fields ...
  },
  "status": "REVOKED",  // NEW: ISSUED, CLAIMED, or REVOKED
  "isValid": false,     // NEW: false if revoked
  "revokedAt": "2026-02-05T14:30:00Z",
  "revocationReason": "Policy Violation",
  "revocationNotes": "Optional detailed explanation"
}
```

### Backend Changes
```typescript
// src/modules/badges/badges.service.ts
async verifyBadge(badgeId: string) {
  const badge = await this.prisma.badge.findUnique({
    where: { id: badgeId },
    include: { 
      template: true,
      recipient: true,
      revoker: true  // NEW: Include revoker user
    }
  });

  return {
    badge,
    status: badge.status,  // ISSUED, CLAIMED, or REVOKED
    isValid: badge.status !== BadgeStatus.REVOKED,
    ...(badge.status === BadgeStatus.REVOKED && {
      revokedAt: badge.revokedAt,
      revocationReason: badge.revocationReason,
      revocationNotes: badge.revocationNotes
    })
  };
}
```

---

## UI/UX Design

### Revoked Badge Layout (Wireframe)
```
┌─────────────────────────────────────────┐
│ 🚫 BADGE REVOKED                        │
│                                         │
│ This badge was revoked on Feb 5, 2026  │
│ Reason: Policy Violation                │
│ Notes: [Optional detailed explanation]  │
│                                         │
│ Original badge information shown below  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Badge Details (Historical)              │
│ ────────────────────────────            │
│ Template: Advanced React Development    │
│ Issued to: John Doe                     │
│ Issued on: January 15, 2026             │
│ Issued by: Jane Smith (Manager)         │
│                                         │
│ [Grayed out / reduced opacity]          │
│                                         │
│ ⚠️ Download and Share disabled          │
└─────────────────────────────────────────┘
```

### Color Palette
- Revoked Banner: `bg-red-100 border-red-500 text-red-900` (Tailwind)
- Badge Details: `opacity-60` for grayed-out effect
- Icon: Red warning triangle

---

## Test Plan

### Unit Tests (Frontend)
- [x] Renders RevokedBadgeAlert component when status = REVOKED
- [x] Displays revocation date, reason, notes correctly
- [x] Grays out badge details section
- [x] Hides Download and Share buttons
- [x] Does NOT show revoked alert when status = ISSUED or CLAIMED

### Unit Tests (Backend)
- [x] Verify API returns correct status field
- [x] Verify isValid = false for revoked badges
- [x] Verify revocation metadata included in response

### E2E Tests
- [x] Navigate to verification page for revoked badge
- [x] Assert red alert visible
- [x] Assert original details still visible but dimmed
- [x] Assert Download button disabled
- [x] Screenshot test for visual regression

### UAT Test Cases (See uat-test-plan.md)
- Scenario 1.6: Badge Revocation → Verify revoked badge display
- Scenario 3.2: Public badge verification (revoked status)

---

## Definition of Done

### Code Complete
- [x] RevokedBadgeAlert component created
- [x] VerifyBadgePage updated with status logic
- [x] Backend verify API returns status field
- [x] Download/Share buttons disabled for revoked badges
- [x] No TypeScript/ESLint errors

### Testing Complete
- [x] Unit tests for frontend component (>80% coverage)
- [x] Unit tests for backend API response
- [x] E2E test with revoked badge
- [x] Manual testing with real revoked badge
- [x] Cross-browser testing (Chrome, Firefox, Edge)

### Documentation Complete
- [x] Component documented in code comments
- [x] Story file updated with screenshots
- [x] API response format documented

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| Backend: Update verify API | 0.5h | Dev |
| Frontend: RevokedBadgeAlert component | 1h | Dev |
| Frontend: VerifyBadgePage updates | 0.5h | Dev |
| Styling (Tailwind CSS) | 0.5h | Dev |
| Unit tests (Frontend + Backend) | 1h | Dev |
| E2E tests | 0.5h | Dev |
| Manual testing & fixes | 0.5h | Dev |
| **Total** | **4.5h** | |

### Confidence Level
High - Mostly UI work, backend changes minimal

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation
- [x] Story 9.1: Badge Revocation API (must have revoked badges to display)

### Blocks
- Story U.1: Complete Lifecycle UAT (requires visual verification of revoked status)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| UX too alarming (scares users) | Low | Medium | Use professional tone, not "ERROR" language |
| Breaking existing verification flow | Low | High | Add feature flag for gradual rollout |
| Missing revocation details | Low | Low | Make notes optional, handle gracefully |

---

## Questions & Assumptions

### Assumptions
- Public viewers can see revocation reason (not hidden)
- Original badge details remain visible for audit trail
- No "unrevoke" action needed in UI (permanent revocation)
- Download button fully disabled (not just warning message)

### Open Questions
- Should we redact revoker name for privacy? → Default: Show "System Admin"
- Should verification page show revocation count? → Not in this story

---

## Timeline

**Estimated Start:** February 3, 2026 (Day 1 - after Story 9.1)  
**Estimated Completion:** February 3, 2026 (Day 1)  
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

**Next Story:** [9.3: Employee Wallet Display](9-3-wallet-display.md)
