# Story 11.5: FEATURE-P0-2 — LinkedIn Share Tab in BadgeShareModal

**Status:** backlog  
**Priority:** 🔴 CRITICAL  
**Estimate:** 3-4h  
**Source:** Feature Audit P0-2 + PRD ("viral growth engine")  

## Story

As an employee,  
I want a LinkedIn sharing tab in the badge share modal,  
So that I can share my credentials on LinkedIn for professional visibility.

## Acceptance Criteria

1. [ ] New "LinkedIn" tab added to BadgeShareModal alongside Email, Teams, Widget
2. [ ] LinkedIn share generates proper URL with pre-filled title, summary, and verification link
3. [ ] One-click "Share on LinkedIn" button opens LinkedIn share dialog in new window
4. [ ] Preview shows how the share will appear (title + description + verification URL)
5. [ ] Share events are tracked in analytics (ShareType.LINKEDIN or similar)
6. [ ] Tab uses LinkedIn brand colors (blue #0A66C2) and recognizable icon
7. [ ] Accessible: keyboard navigable, proper ARIA labels
8. [ ] All existing share modal tests pass

## Tasks / Subtasks

- [ ] **Task 1: Add LinkedIn tab option** (AC: #1)
  - [ ] In `BadgeShareModal.tsx` (786 lines):
    - Add `'linkedin'` to tab union type: `'email' | 'teams' | 'widget' | 'linkedin'`
    - Add LinkedIn tab button in tab bar with icon
    - Tab order: Email → Teams → LinkedIn → Widget

- [ ] **Task 2: LinkedIn share URL generator** (AC: #2, #3)
  - [ ] Create LinkedIn share URL utility:
    ```typescript
    const generateLinkedInShareUrl = (params: {
      title: string;
      summary: string;
      url: string;
    }) => {
      const base = 'https://www.linkedin.com/sharing/share-offsite/';
      const searchParams = new URLSearchParams({ url: params.url });
      return `${base}?${searchParams.toString()}`;
    };
    ```
  - [ ] Note: LinkedIn Share API only supports `url` parameter now (title/summary from og:tags)
  - [ ] Open in `window.open()` with popup dimensions

- [ ] **Task 3: Tab content UI** (AC: #4, #6, #7)
  - [ ] Share preview card showing:
    - Badge name as title
    - Badge description as summary
    - Verification URL
    - Badge image thumbnail
  - [ ] "Share on LinkedIn" primary button (LinkedIn blue #0A66C2)
  - [ ] "Copy Link" secondary button for manual sharing
  - [ ] Use Lucide `Linkedin` icon (or `ExternalLink` if not available)

- [ ] **Task 4: Analytics tracking** (AC: #5)
  - [ ] Add `LINKEDIN` to share type enum/constants
  - [ ] On share click: POST to `/api/badges/:id/share` with `{ platform: 'linkedin' }`
  - [ ] Reuse existing share tracking API pattern from email/teams tabs

- [ ] **Task 5: Tests** (AC: #8)
  - [ ] Unit test: LinkedIn URL generation
  - [ ] Component test: LinkedIn tab renders, button opens new window
  - [ ] Verify existing share modal tests pass

## Dev Notes

### Source Tree Components
- **BadgeShareModal:** `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx` (786 lines)
- **Badge sharing API:** `frontend/src/lib/badgeShareApi.ts`
- **Share analytics:** `backend/src/badge-sharing/` module

### Architecture Patterns
- Follow existing tab pattern (Email, Teams, Widget) — same structure
- LinkedIn Share API quirk: only `url` param works; LinkedIn reads Open Graph tags from URL
- Verification page needs proper `<meta og:title>`, `<meta og:description>` for rich preview

### Coding Standards
- No Chinese characters
- Use `API_BASE_URL` for API calls
- Sonner toast for success/error feedback

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
