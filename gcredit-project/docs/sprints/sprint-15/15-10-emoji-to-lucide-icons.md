# Story 15.10: Full Site Emoji → Lucide Icons (P2-7)

**Status:** done  
**Priority:** MEDIUM  
**Estimate:** 5h  
**Wave:** 3 — UI Polish  
**Source:** P2-7 (Post-MVP UI Audit), ADR-016 DEC-016-05  
**Dependencies:** 15.3 (Sidebar migration — avoid conflicting icon changes)

---

## Story

**As a** user of G-Credit,  
**I want** consistent professional icons throughout the application instead of emoji,  
**So that** the visual quality matches enterprise application standards for Pilot deployment.

## Acceptance Criteria

1. [x] ALL emoji icons across the entire site replaced with Lucide React icons
2. [x] Scope includes: Dashboard cards, Toast messages, Dialog icons, Navigation items, Empty states, Error states, Status indicators
3. [x] Consistent icon sizing (16px, 20px, 24px scale based on context)
4. [x] Icons use design token colors where applicable
5. [x] No emoji characters remain in component JSX (text labels are fine, e.g., "🏆" in seed data is OK)
6. [x] Accessible: icons have `aria-hidden="true"` when decorative, `aria-label` when functional

## Tasks / Subtasks

- [x] **Task 1: Audit all emoji usage** (AC: #1, #2)
  - [x] Search frontend source for emoji patterns: Unicode emoji, emoji entities
  - [x] Categorize by component and context (decorative, status, navigation)
  - [x] Create mapping table: emoji → Lucide icon name
- [x] **Task 2: Dashboard card icons** (AC: #1)
  - [x] Replace dashboard stat card emojis with Lucide icons
  - [x] Use appropriate semantic icons (Award, Users, TrendingUp, etc.)
- [x] **Task 3: Navigation icons** (AC: #1)
  - [x] Ensure sidebar items use Lucide icons (may already be done in 15.3)
  - [x] Verify mobile navigation icons
- [x] **Task 4: Status indicators** (AC: #1)
  - [x] Badge status emojis → Lucide icons (CheckCircle, Clock, XCircle, etc.)
  - [x] Toast message icons → consistent Lucide usage
- [x] **Task 5: Empty/Error states** (AC: #1)
  - [x] Empty state illustrations → Lucide icons with descriptive text
  - [x] Error state icons → AlertTriangle, XCircle
- [x] **Task 6: Dialog & modal icons** (AC: #1)
  - [x] Confirmation dialogs → Lucide icons (works with 15.9)
  - [x] Success/error feedback icons
- [x] **Task 7: Styling standardization** (AC: #3, #4)
  - [x] Define icon size scale: `size={16}` (inline), `size={20}` (default), `size={24}` (prominent)
  - [x] Use `@theme` design tokens for icon colors
  - [x] Apply `strokeWidth` consistently (default 2, thin 1.5)
- [x] **Task 8: Accessibility audit** (AC: #6)
  - [x] Decorative icons: `aria-hidden="true"`
  - [x] Interactive icons (buttons): `aria-label` or wrapping `<button>` with label
- [x] **Task 9: Final verification** (AC: #5)
  - [x] Search for remaining emoji in JSX components
  - [x] Verify no visual regression

## Dev Notes

### Architecture Patterns Used
- ADR-016 DEC-016-05: Full site Lucide migration
- ADR-009: Design tokens for icon colors
- Lucide React library (already a project dependency)

### Icon Mapping Examples
| Emoji | Context | Lucide Icon |
|-------|---------|-------------|
| 🏆 | Badge/Achievement | `Award` |
| 📊 | Analytics | `BarChart3` |
| 👥 | Team/Users | `Users` |
| ✅ | Success/Done | `CheckCircle` |
| ❌ | Error/Failed | `XCircle` |
| ⚠️ | Warning | `AlertTriangle` |
| 📧 | Email | `Mail` |
| 🔒 | Security/Auth | `Lock` |
| 🎉 | Celebration | `PartyPopper` |
| ⏳ | Pending | `Clock` |

### Source Tree Components
- Widespread changes across `frontend/src/pages/` and `frontend/src/components/`
- Icon imports from `lucide-react`

### Testing Standards
- Visual check all pages for consistent icon usage
- Accessibility audit (aria attributes)

### References
- ADR-016 DEC-016-05: Full Lucide migration rationale
- Lucide React docs: https://lucide.dev/guide/packages/lucide-react

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
Replaced ~150+ emoji occurrences across ~45 frontend files with Lucide React icons. Key changes:

- **Utility refactors**: `audit-activity.utils.ts` (`getActivityIcon` returns `LucideIcon`), `evidenceApi.ts` (`getFileIcon` returns `LucideIcon`)
- **Interface changes**: SummaryCard `icon: string` → `React.ReactNode` in Employee/Issuer/Manager dashboards
- **Icon sizing**: 16px inline, 20px standalone, 24px prominent, 48/64px hero/empty states
- **Accessibility**: All decorative icons have `aria-hidden="true"`
- **Preserved exceptions**: MilestoneFormSheet MILESTONE_ICONS array (user content), `m.icon || '🏅'` DB fallbacks, `🏆` in share message text
- **Test updates**: Fixed `getFileIcon` mocks (return component instead of string), updated CelebrationModal/EmptyState test assertions

Validation: `tsc --noEmit` ✅ | ESLint 0 errors ✅ | 837/837 tests pass ✅ | Emoji scan confirms only expected exceptions remain ✅

### File List

**Utilities:**
- `frontend/src/utils/audit-activity.utils.ts`
- `frontend/src/lib/evidenceApi.ts`

**Dashboards:**
- `frontend/src/pages/dashboard/AdminDashboard.tsx`
- `frontend/src/pages/dashboard/EmployeeDashboard.tsx`
- `frontend/src/pages/dashboard/IssuerDashboard.tsx`
- `frontend/src/pages/dashboard/ManagerDashboard.tsx`

**Common Components:**
- `frontend/src/components/common/EmptyState.tsx`
- `frontend/src/components/common/CelebrationModal.tsx`
- `frontend/src/components/common/ErrorDisplay.tsx`
- `frontend/src/components/analytics/RecentActivityFeed.tsx`
- `frontend/src/components/analytics/TopPerformersTable.tsx`
- `frontend/src/components/ClaimSuccessModal.tsx`
- `frontend/src/components/session/IdleWarningModal.tsx`

**Badge Detail Modal (9 files):**
- `frontend/src/components/BadgeDetailModal/BadgeAnalytics.tsx`
- `frontend/src/components/BadgeDetailModal/ExpirationSection.tsx`
- `frontend/src/components/BadgeDetailModal/IssuerMessage.tsx`
- `frontend/src/components/BadgeDetailModal/ModalHero.tsx`
- `frontend/src/components/BadgeDetailModal/ReportIssueForm.tsx`
- `frontend/src/components/BadgeDetailModal/RevocationSection.tsx`
- `frontend/src/components/BadgeDetailModal/SimilarBadgesSection.tsx`
- `frontend/src/components/BadgeDetailModal/TimelineSection.tsx`
- `frontend/src/components/BadgeDetailModal/VerificationSection.tsx`

**Badge Share Modal:**
- `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx`

**Badge Wallet Empty States:**
- `frontend/src/components/BadgeWallet/EmptyStateScenarios/AllRevokedEmptyState.tsx`
- `frontend/src/components/BadgeWallet/EmptyStateScenarios/FilteredEmptyState.tsx`
- `frontend/src/components/BadgeWallet/EmptyStateScenarios/NewEmployeeEmptyState.tsx`
- `frontend/src/components/BadgeWallet/EmptyStateScenarios/PendingBadgesEmptyState.tsx`

**Bulk Issuance (10 files):**
- `frontend/src/components/BulkIssuance/BulkPreviewHeader.tsx`
- `frontend/src/components/BulkIssuance/BulkPreviewPage.tsx`
- `frontend/src/components/BulkIssuance/BulkPreviewTable.tsx`
- `frontend/src/components/BulkIssuance/ConfirmationModal.tsx`
- `frontend/src/components/BulkIssuance/EmptyPreviewState.tsx`
- `frontend/src/components/BulkIssuance/ErrorCorrectionPanel.tsx`
- `frontend/src/components/BulkIssuance/ProcessingComplete.tsx`
- `frontend/src/components/BulkIssuance/ProcessingModal.tsx`
- `frontend/src/components/BulkIssuance/SessionExpiryTimer.tsx`
- `frontend/src/components/BulkIssuance/TemplateSelector.tsx`

**Timeline / Evidence / Admin:**
- `frontend/src/components/TimelineView/BadgeTimelineCard.tsx`
- `frontend/src/components/evidence/EvidenceAttachmentPanel.tsx`
- `frontend/src/components/evidence/EvidenceList.tsx`
- `frontend/src/components/admin/DeactivateUserDialog.tsx`
- `frontend/src/components/admin/EditRoleDialog.tsx`

**Pages:**
- `frontend/src/pages/AdminAnalyticsPage.tsx`
- `frontend/src/pages/BadgeEmbedPage.tsx`
- `frontend/src/pages/BulkIssuancePage.tsx`
- `frontend/src/pages/ClaimBadgePage.tsx`
- `frontend/src/pages/admin/MilestoneManagementPage.tsx`

**Test Files Updated:**
- `frontend/src/components/BulkIssuance/__tests__/BulkResultPage.test.tsx`
- `frontend/src/components/common/CelebrationModal.test.tsx`
- `frontend/src/components/common/EmptyState.test.tsx`
- `frontend/src/pages/IssueBadgePage.test.tsx`
- `frontend/src/pages/VerifyBadgePage.test.tsx`
