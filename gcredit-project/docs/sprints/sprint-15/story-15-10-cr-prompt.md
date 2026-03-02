# Code Review Prompt — Story 15.10: Full Site Emoji → Lucide Icons

## Commit
`80cc896` — `feat(ui): replace all emoji with Lucide React icons (Story 15.10)`

## Scope
**53 files changed**, +587 / -241 lines

## Story Reference
`gcredit-project/docs/sprints/sprint-15/15-10-emoji-to-lucide-icons.md`
ADR-016 DEC-016-05: Full site Lucide migration

## What Changed

### Category 1: Type/Interface Changes (CRITICAL — review first)
These are breaking interface changes that affect multiple consumers:

| File | Change |
|------|--------|
| `utils/audit-activity.utils.ts` | `ActivityConfig.icon: string` → `LucideIcon`; `getActivityIcon()` returns `LucideIcon` instead of emoji string |
| `lib/evidenceApi.ts` | `getFileIcon()` returns `LucideIcon` instead of emoji string |
| `pages/dashboard/EmployeeDashboard.tsx` | `SummaryCardProps.icon: string` → `React.ReactNode` |
| `components/common/EmptyState.tsx` | `EmptyStateProps.icon` default: `'📭'` → `<Inbox size={48} />` |
| `components/common/CelebrationModal.tsx` | `CelebrationModalProps.icon` default: `'🎉'` → `<PartyPopper size={48} />` |

**CR Focus:** Verify ALL consumers of these interfaces were updated. A missed consumer would cause a runtime type mismatch.

### Category 2: Dashboard Pages (4 files, ~25 emoji → Lucide)
- `AdminDashboard.tsx` — SystemHealthBanner icons (✅→CheckCircle, ⚠️→AlertTriangle, 🚨→AlertOctagon)
- `EmployeeDashboard.tsx` — SummaryCards, milestone, latest badge, revoked label
- `IssuerDashboard.tsx` — SummaryCards, chart section header
- `ManagerDashboard.tsx` — SummaryCards, milestone, warning states

### Category 3: BadgeDetailModal (9 files, ~19 emoji → Lucide)
- `ModalHero.tsx` — Status labels (CLAIMED/PENDING/REVOKED/EXPIRED), fallback badge icon, visibility indicator
- `BadgeAnalytics.tsx` — Platform sharing icons (email/globe/clipboard)
- `ExpirationSection.tsx`, `RevocationSection.tsx` — Status header icons
- `IssuerMessage.tsx`, `ReportIssueForm.tsx`, `SimilarBadgesSection.tsx`, `TimelineSection.tsx`, `VerificationSection.tsx`

### Category 4: BadgeShareModal (1 file, ~12 emoji → Lucide)
- Tab labels, success messages, action buttons, tips

### Category 5: BulkIssuance (8 files, ~20 emoji → Lucide)
- Processing states, validation indicators, timers, empty states

### Category 6: Badge Wallet Empty States (4 files, ~10 emoji → Lucide)
- AllRevoked, Filtered, NewEmployee, PendingBadges

### Category 7: Common Components (5 files)
- `ErrorDisplay.tsx`, `ClaimSuccessModal.tsx`, `IdleWarningModal.tsx`
- `TopPerformersTable.tsx` — 🥇🥈🥉 → Trophy with gold/silver/bronze colors
- `RecentActivityFeed.tsx` — Renders `getActivityIcon()` result as component

### Category 8: Other Pages (5 files)
- `AdminAnalyticsPage.tsx`, `BadgeEmbedPage.tsx`, `BulkIssuancePage.tsx`, `ClaimBadgePage.tsx`, `MilestoneManagementPage.tsx`

### Category 9: Evidence Components (2 files)
- `EvidenceAttachmentPanel.tsx`, `EvidenceList.tsx` — Render `getFileIcon()` as component

### Category 10: Admin Dialogs (2 files)
- `DeactivateUserDialog.tsx`, `EditRoleDialog.tsx` — ⚠️ → AlertTriangle

### Category 11: Timeline (1 file)
- `BadgeTimelineCard.tsx` — View/Download/Revoked/Expired status icons

### Category 12: Test Updates (4 files)
- `CelebrationModal.test.tsx`, `EmptyState.test.tsx` — Updated assertions for new icon prop types
- `BulkResultPage.test.tsx`, `IssueBadgePage.test.tsx`, `VerifyBadgePage.test.tsx` — Mock updates for `getFileIcon`

## Review Checklist

### 1. Interface Consistency
- [ ] `SummaryCard` icon prop changed from `string` → `React.ReactNode` — verify all 4 dashboards pass correct type
- [ ] `EmptyState` icon prop — verify all callers (NoBadgesState, NoActivityState, NoTeamMembersState, direct uses)
- [ ] `CelebrationModal` icon prop — verify BadgeEarnedCelebration, MilestoneReachedCelebration callers
- [ ] `getActivityIcon()` → `LucideIcon` — verify `RecentActivityFeed.tsx` renders it correctly (should now render as `<Icon size={16} />`)
- [ ] `getFileIcon()` → `LucideIcon` — verify `EvidenceList.tsx` and `EvidenceAttachmentPanel.tsx` render correctly

### 2. Icon Sizing Consistency
Verify adherence to the sizing scale:
- [ ] `size={16}` for inline with text (status labels, button text)
- [ ] `size={20}` for standalone default (card icons, section headers)
- [ ] `size={24}` for prominent (stat cards, dashboard cards)
- [ ] `size={48}` or `size={64}` for hero/empty states

### 3. Accessibility
- [ ] All decorative icons have `aria-hidden="true"`
- [ ] Functional icons (in buttons without text) have `aria-label` on parent
- [ ] No double-announcement (icon + adjacent text both accessible)

### 4. Preserved Exceptions (should NOT be changed)
- [ ] `MilestoneFormSheet.tsx` — `MILESTONE_ICONS` array still uses emoji (user-selectable content)
- [ ] `m.icon || '🏅'` fallbacks — DB milestone data, should remain emoji
- [ ] Badge share message text `"🏆 I earned the..."` — user-facing message content
- [ ] Comments with emoji (JSDoc, accessibility ratio notes in StatusBadge.tsx)

### 5. Tailwind v4 Compliance
- [ ] No `hsl()` wrapping of CSS variables
- [ ] Icon colors use standard `text-*` Tailwind classes
- [ ] No hardcoded color values — use design tokens

### 6. Import Hygiene
- [ ] No unused Lucide imports
- [ ] No duplicate icon imports across files
- [ ] `import type { LucideIcon }` used for type-only imports (not runtime)

### 7. Test Validity
- [ ] `CelebrationModal.test.tsx` assertions match new default icon (PartyPopper)
- [ ] `EmptyState.test.tsx` assertions match new default icon (Inbox)
- [ ] `getFileIcon` mock returns component instead of string
- [ ] All 837 tests still pass

### 8. Visual Regression Spots
- [ ] SystemHealthBanner — icon replaced inline in text flow, alignment OK?
- [ ] `TopPerformersTable` rank icons — 🥇🥈🥉 replaced with colored Trophy — visually distinct?
- [ ] `ProcessingModal` spinner — ⏳ replaced with Loader2 + animate-spin?
- [ ] Badge status labels in `ModalHero.tsx` — emoji was inline in label text, now icon + text — spacing OK?

## Key Diffs to Focus On

### audit-activity.utils.ts (Type system change)
```diff
-export function getActivityIcon(type: string): string {
-  return (ACTIVITY_CONFIG as Record<string, ActivityConfig>)[type]?.icon ?? '📋';
+export function getActivityIcon(type: string): LucideIcon {
+  return (ACTIVITY_CONFIG as Record<string, ActivityConfig>)[type]?.icon ?? ClipboardList;
```

### evidenceApi.ts (Type system change)
```diff
-export function getFileIcon(mimeType?: string): string {
-  if (!mimeType) return '📎';
+export function getFileIcon(mimeType?: string): LucideIcon {
+  if (!mimeType) return Paperclip;
```

### EmployeeDashboard.tsx (Interface + multiple icon replacements)
```diff
-  icon: string;
+  icon: React.ReactNode;
...
-        <span className="text-2xl" aria-hidden="true">
-          {icon}
-        </span>
+        <div aria-hidden="true">{icon}</div>
```

## Validation Results (from Dev)
- `tsc --noEmit` — ✅ clean
- ESLint — ✅ 0 errors
- Tests — ✅ 837/837 pass
- Emoji scan — ✅ only expected exceptions remain (milestone data, share text, comments)

## Decision Required
None — straightforward migration per ADR-016 DEC-016-05.
