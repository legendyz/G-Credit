# Story 9.5: Admin Badge Revocation UI

**Story ID:** Story 9.5  
**Epic:** Epic 9 - Badge Revocation  
**Sprint:** Sprint 7  
**Priority:** HIGH  
**Story Points:** 4  
**Status:** Backlog

---

## User Story

**As an** Admin or Issuer,  
**I want** a UI to revoke badges with reason selection and notes,  
**So that** I can manage badge lifecycle without using API tools directly.

---

## Background / Context

Currently, badge revocation requires calling the API directly (Story 9.1). Admin users need a user-friendly interface to:
1. Search for badges to revoke
2. Select revocation reason from dropdown
3. Add optional notes explaining decision
4. Confirm revocation with modal
5. See success/error feedback

This completes the revocation workflow by providing the admin-facing UI.

---

## Acceptance Criteria

### AC1: Revoke Button on Badge Management Page
**Given** I am logged in as Admin or Issuer  
**When** I view Badge Management page (`/admin/badges`)  
**Then** Each badge row has "Revoke" action button

- [x] "Revoke" button visible only for ISSUED or CLAIMED badges
- [x] Already-revoked badges show "REVOKED" status (no button)
- [x] Button disabled if I am Issuer and badge was issued by someone else

### AC2: Revocation Confirmation Modal
**Given** I click "Revoke" button  
**When** Modal opens  
**Then** I see confirmation form with reason and notes fields

- [x] Modal title: "Revoke Badge - [Badge Name]"
- [x] Reason dropdown (required):
  - Policy Violation
  - Issued in Error
  - Expired
  - Employee Left Organization
  - Other
- [x] Notes textarea (optional, max 1000 characters)
- [x] Character count indicator for notes
- [x] "Confirm Revoke" button (red/danger style)
- [x] "Cancel" button

### AC3: Revocation API Integration
- [x] On "Confirm Revoke", call `POST /api/badges/:id/revoke`
- [x] Request body: `{ reason: string, notes?: string }`
- [x] Loading spinner during API call
- [x] Success: Show toast "Badge revoked successfully", close modal, refresh badge list
- [x] Error: Show error toast with message (e.g., "Unauthorized", "Badge not found")

### AC4: Badge List Updates
- [x] After successful revocation, badge status in table changes to "REVOKED"
- [x] "Revoke" button disappears, replaced with status badge
- [x] Badge row grayed out or marked visually
- [x] No full page reload (optimistic UI update or refetch)

### AC5: Search and Filter
- [x] Admin can search badges by recipient name, template name, or badge ID
- [x] Filter by status: All | Active | Revoked
- [x] Pagination if many badges (10-20 per page)

---

## Non-Functional Requirements

### Performance
- [x] Modal opens instantly (no lag)
- [x] API call completes in < 500ms
- [x] Badge list refresh does not flicker

### Accessibility
- [x] Modal keyboard accessible (Esc to close, Tab navigation)
- [x] Focus trapped in modal
- [x] ARIA labels for form fields
- [x] Screen reader announces success/error

### UX
- [x] Confirmation modal prevents accidental revocations
- [x] Reason dropdown has clear labels (not codes)
- [x] Notes field supports line breaks
- [x] Professional tone (not harsh language)

---

## Technical Details

### Frontend Components
```
src/pages/admin/BadgeManagementPage.tsx (existing)
- Add "Revoke" button column
- Handle revoke button click
- Trigger modal open

src/components/admin/RevokeBadgeModal.tsx (new)
- Form with reason dropdown and notes textarea
- Submit handler calls revoke API
- Success/error toast notifications

src/api/badgesApi.ts (existing)
- Add revokeBadge(badgeId, dto) function
```

### Revoke Badge Modal Component
```tsx
interface RevokeBadgeModalProps {
  badge: Badge;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RevokeBadgeModal({ badge, isOpen, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await badgesApi.revokeBadge(badge.id, { reason, notes });
      toast.success('Badge revoked successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to revoke badge');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Revoke Badge - {badge.templateName}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Reason *
          <select value={reason} onChange={e => setReason(e.target.value)} required>
            <option value="">Select reason</option>
            <option value="Policy Violation">Policy Violation</option>
            <option value="Issued in Error">Issued in Error</option>
            <option value="Expired">Expired</option>
            <option value="Employee Left Organization">Employee Left Organization</option>
            <option value="Other">Other</option>
          </select>
        </label>
        
        <label>
          Notes (optional)
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
            maxLength={1000}
            rows={4}
          />
          <span>{notes.length}/1000 characters</span>
        </label>
        
        <div className="actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!reason || loading} className="danger">
            {loading ? 'Revoking...' : 'Confirm Revoke'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

### API Function
```typescript
// src/api/badgesApi.ts
export const badgesApi = {
  // ... existing functions ...
  
  async revokeBadge(badgeId: string, dto: { reason: string; notes?: string }) {
    const response = await apiClient.post(`/badges/${badgeId}/revoke`, dto);
    return response.data;
  }
};
```

### Badge Management Page Table Column
```tsx
{
  header: 'Actions',
  cell: (badge) => (
    <>
      {badge.status === 'REVOKED' ? (
        <span className="badge badge-danger">REVOKED</span>
      ) : (
        <button 
          onClick={() => openRevokeModal(badge)}
          disabled={!canRevokeBadge(badge)}
          className="btn-sm btn-danger"
        >
          Revoke
        </button>
      )}
    </>
  )
}
```

---

## UI/UX Design

### Badge Management Page (Table View)
```
┌──────────────────────────────────────────────────────────┐
│ Badge Management                          [+ Issue Badge] │
│                                                            │
│ Search: [____________] Filter: [All ▼]                    │
│                                                            │
│ ┌─────────┬──────────────┬─────────┬───────┬─────────┐  │
│ │ Badge   │ Recipient    │ Issued  │ Status│ Actions │  │
│ ├─────────┼──────────────┼─────────┼───────┼─────────┤  │
│ │ React   │ John Doe     │ Jan 15  │CLAIMED│[Revoke] │  │
│ │ DevOps  │ Jane Smith   │ Jan 20  │ISSUED │[Revoke] │  │
│ │ Python  │ Bob Johnson  │ Jan 10  │REVOKED│ (none)  │  │ ← Grayed
│ └─────────┴──────────────┴─────────┴───────┴─────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Revoke Badge Modal
```
┌─────────────────────────────────────────────┐
│ Revoke Badge - Advanced React Development  │
│ ──────────────────────────────────────────  │
│                                             │
│ Recipient: John Doe                         │
│ Issued: January 15, 2026                    │
│                                             │
│ Reason *                                    │
│ [Select reason ▼]                           │
│   - Policy Violation                        │
│   - Issued in Error                         │
│   - Expired                                 │
│   - Employee Left Organization              │
│   - Other                                   │
│                                             │
│ Notes (optional)                            │
│ [_____________________________________]     │
│ [_____________________________________]     │
│ [_____________________________________]     │
│                                             │
│ 0/1000 characters                           │
│                                             │
│ [Cancel]          [Confirm Revoke]          │
│                   (red/danger button)       │
└─────────────────────────────────────────────┘
```

### Success Toast
```
✅ Badge revoked successfully
   The badge has been revoked and the employee notified.
```

---

## Test Plan

### Unit Tests (Frontend)
- [x] Renders RevokeBadgeModal with badge data
- [x] Form validation (reason required)
- [x] Character count updates as user types
- [x] Submit button disabled when reason empty or loading
- [x] Calls revoke API with correct data on submit
- [x] Shows success toast and closes modal on success
- [x] Shows error toast on API failure

### E2E Tests
- [x] Navigate to Badge Management page as Admin
- [x] Click "Revoke" button on a badge
- [x] Modal opens with form
- [x] Fill in reason and notes
- [x] Click "Confirm Revoke"
- [x] Badge status changes to REVOKED in table
- [x] "Revoke" button disappears

### UAT Test Cases (See uat-test-plan.md)
- Scenario 1.6: Badge Revocation (Admin perspective)
- Scenario 2.1: Error handling (already revoked)
- Scenario 2.4: Authorization (Issuer vs Admin)

---

## Definition of Done

### Code Complete
- [x] RevokeBadgeModal component created
- [x] Badge Management page updated with Revoke button
- [x] API integration (revokeBadge function)
- [x] Success/error toast notifications
- [x] Optimistic UI update or refetch
- [x] No TypeScript/ESLint errors

### Testing Complete
- [x] Unit tests for modal component (>80% coverage)
- [x] E2E test for full revocation flow
- [x] Manual testing with real badges
- [x] Test as Admin and Issuer roles

### Documentation Complete
- [x] Component documented in code
- [x] Story file updated with screenshots
- [x] User guide snippet (if needed)

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| RevokeBadgeModal component | 1.5h | Dev |
| Badge Management page integration | 0.5h | Dev |
| API client function | 0.5h | Dev |
| Styling (Tailwind CSS) | 0.5h | Dev |
| Toast notifications | 0.5h | Dev |
| Unit tests | 1h | Dev |
| E2E tests | 0.5h | Dev |
| Manual testing & fixes | 1h | Dev |
| **Total** | **6h** | |

### Confidence Level
Medium - UI work with moderate complexity

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation
- [x] Story 9.1: Badge Revocation API (backend endpoint)

### Blocks
- Story U.1: Complete Lifecycle UAT (admin revocation tested)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Accidental revocations (no undo) | Low | High | Confirmation modal, clear messaging |
| UI state sync issues | Medium | Medium | Use React Query for cache invalidation |
| Authorization bugs (Issuer revokes wrong badge) | Low | High | Backend enforces authz, frontend disables button |

---

## Questions & Assumptions

### Assumptions
- No "undo" or "un-revoke" action (revocation is permanent)
- Admin can revoke any badge, Issuer only their own
- Modal uses existing Modal component (shadcn/ui or custom)
- Toast uses existing toast library (react-toastify, sonner)

### Open Questions
- Should we show audit log in modal (who issued, when)? → Nice-to-have, not MVP
- Should we confirm with "Type REVOKE to confirm"? → No, dropdown + modal is sufficient
- Should we allow bulk revoke? → Not in this story (future enhancement)

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
- **Badge Management Page:** `frontend/src/pages/admin/BadgeManagementPage.tsx`

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-01-31 | Backlog | Bob (Scrum Master) | Story created during planning |

---

**Next Story:** [U.1: Complete Lifecycle UAT](U-1-lifecycle-uat.md)
