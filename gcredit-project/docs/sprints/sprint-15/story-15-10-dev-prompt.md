# Dev Prompt — Story 15.10: Full Site Emoji → Lucide Icons

## Story Reference
`gcredit-project/docs/sprints/sprint-15/15-10-emoji-to-lucide-icons.md`

## Objective
Replace ALL emoji characters in frontend JSX/TSX components with Lucide React icons. The goal is enterprise-grade visual consistency for Pilot deployment.

## Critical Rules

### DO Replace
- All emoji used as **icons** in UI (decorative, status, navigation, action buttons)
- Emoji in `icon` props, `<span>` tags, status labels, headings, button text

### DO NOT Replace
- Emoji in **comments** (e.g., `// ✓ passes`, JSDoc examples)
- Emoji in **seed data / user content** strings that pass through API (e.g., milestone `icon` field from database)
- The `✕` character (U+2715) — this is a close button character, not emoji. Replace with Lucide `X` icon.
- The `✓` checkmark when it's plain text confirmation (e.g., "✓ Copied") — replace with `<Check size={16} />` inline

### Special Case: MilestoneFormSheet.tsx
The emoji picker array (`MILESTONE_ICONS`) is user-selectable data stored in DB. **Keep this as emoji** — it's content, not UI chrome. The `icon` prop rendered from milestone data (`m.icon || '🏅'`) should also stay as-is since it comes from the database.

## Icon Size Scale (Mandatory)
| Context | Size | Usage |
|---------|------|-------|
| Inline with text | `size={16}` | Status labels, button text, list items |
| Default standalone | `size={20}` | Card icons, section headers, nav items |
| Prominent / Hero | `size={24}` or `size={32}` | Empty states, modals, page headers |
| Extra large (replacing text-4xl+ emoji) | `size={48}` or `size={64}` | Claim page states, processing modals |

## Accessibility Rules
- **Decorative icons** (next to text that conveys meaning): `aria-hidden="true"`
- **Functional icons** (sole content of a button): parent must have `aria-label`
- When icon replaces emoji that was inside text, wrap with `<span className="inline-flex items-center">` if needed for alignment

## Comprehensive File-by-File Mapping

### Group 1: Dashboard Pages (HIGH PRIORITY)
| File | Emoji | Lucide Icon | Notes |
|------|-------|-------------|-------|
| `pages/dashboard/AdminDashboard.tsx:120` | `📋` | `ClipboardList` | StatCard icon prop |
| `pages/dashboard/AdminDashboard.tsx:187` | `✅` | `CheckCircle` | SystemHealth healthy |
| `pages/dashboard/AdminDashboard.tsx:194` | `⚠️` | `AlertTriangle` | SystemHealth degraded |
| `pages/dashboard/AdminDashboard.tsx:201` | `🚨` | `Siren` or `AlertOctagon` | SystemHealth critical |
| `pages/dashboard/EmployeeDashboard.tsx:189` | `🏆` | `Award` | StatCard |
| `pages/dashboard/EmployeeDashboard.tsx:195` | `📈` | `TrendingUp` | StatCard |
| `pages/dashboard/EmployeeDashboard.tsx:201` | `⏳` | `Clock` | StatCard |
| `pages/dashboard/EmployeeDashboard.tsx:208` | `🎖️` | `Medal` | StatCard |
| `pages/dashboard/EmployeeDashboard.tsx:248` | `🎉` | `PartyPopper` | Milestone text |
| `pages/dashboard/EmployeeDashboard.tsx:260` | `🎖️` | `Medal` | CardTitle |
| `pages/dashboard/EmployeeDashboard.tsx:320` | `🏆` | `Award` | text-3xl → size={32} |
| `pages/dashboard/EmployeeDashboard.tsx:339` | `🚫` | `Ban` | Revoked label |
| `pages/dashboard/EmployeeDashboard.tsx:365` | `🏅` | `Medal` | EmptyState icon |
| `pages/dashboard/EmployeeDashboard.tsx:484` | `🏆` | `Award` | text-2xl → size={24} |
| `pages/dashboard/IssuerDashboard.tsx:106` | `📤` | `Upload` | StatCard |
| `pages/dashboard/IssuerDashboard.tsx:112` | `⏳` | `Clock` | StatCard |
| `pages/dashboard/IssuerDashboard.tsx:119` | `👥` | `Users` | StatCard |
| `pages/dashboard/IssuerDashboard.tsx:133` | `📋` | `ClipboardList` | StatCard |
| `pages/dashboard/IssuerDashboard.tsx:258` | `📊` | `BarChart3` | Section icon |
| `pages/dashboard/ManagerDashboard.tsx:107` | `👥` | `Users` | StatCard |
| `pages/dashboard/ManagerDashboard.tsx:113` | `🏆` | `Award` | StatCard |
| `pages/dashboard/ManagerDashboard.tsx:119` | `⚠️` | `AlertTriangle` | StatCard |
| `pages/dashboard/ManagerDashboard.tsx:130` | `🌟` | `Star` | Milestone |
| `pages/dashboard/ManagerDashboard.tsx:137` | `🏅` | `Medal` | EmptyState |
| `pages/dashboard/ManagerDashboard.tsx:181` | `⚠️` | `AlertTriangle` | Warning |
| `pages/dashboard/ManagerDashboard.tsx:188` | `✅` | `CheckCircle` | Claimed |

### Group 2: Badge Detail Modal (8 files)
| File | Emoji | Lucide Icon |
|------|-------|-------------|
| `BadgeAnalytics.tsx:27` | `📧` | `Mail` |
| `BadgeAnalytics.tsx:38` | `🌐` | `Globe` |
| `BadgeAnalytics.tsx:46` | `👥` (commented) | `Users` (keep commented) |
| `BadgeAnalytics.tsx:50` | `📋` | `ClipboardCopy` |
| `ExpirationSection.tsx:25` | `⏰` | `AlarmClock` |
| `IssuerMessage.tsx:13` | `💬` | `MessageCircle` |
| `ModalHero.tsx:26` | `✅` | `CheckCircle` |
| `ModalHero.tsx:28` | `🟡` | `Circle` (with amber color class) |
| `ModalHero.tsx:30` | `🔒` | `Lock` |
| `ModalHero.tsx:32` | `⏰` | `AlarmClock` |
| `ModalHero.tsx:58` | `🏆` | `Award` size={64} (was text-8xl) |
| `ModalHero.tsx:79` | `🌐`/`🔒` | `Globe`/`Lock` |
| `ReportIssueForm.tsx:66` | `⚠️` | `AlertTriangle` |
| `RevocationSection.tsx:37` | `🚫` | `Ban` |
| `SimilarBadgesSection.tsx:65` | `🎯` | `Target` |
| `SimilarBadgesSection.tsx:96` | `🏆` | `Award` size={32} |
| `TimelineSection.tsx:70` | `⚠️` | `AlertTriangle` |
| `VerificationSection.tsx:48` | `✓` | `Check` size={16} inline |
| `VerificationSection.tsx:58` | `🔍` | `Search` |

### Group 3: Badge Share Modal
| File | Emoji | Lucide Icon |
|------|-------|-------------|
| `BadgeShareModal.tsx:30` | `📧` | `Mail` |
| `BadgeShareModal.tsx:47` | `👥` (commented) | `Users` (keep commented) |
| `BadgeShareModal.tsx:48` | `🔗` | `Link` |
| `BadgeShareModal.tsx:321` | `✅` | `CheckCircle` |
| `BadgeShareModal.tsx:412` | `📧` | `Mail` |
| `BadgeShareModal.tsx:430` | `🏆` (in text content string) | **KEEP** — user-facing message text |
| `BadgeShareModal.tsx:478` | `✓`/`📋` | `Check`/`ClipboardCopy` |
| `BadgeShareModal.tsx:493` | `✓` | `Check` |
| `BadgeShareModal.tsx:510` | `💡` | `Lightbulb` |
| `BadgeShareModal.tsx:525` | `💡` | `Lightbulb` |
| `BadgeShareModal.tsx:615` | `👥` | `Users` |
| `BadgeShareModal.tsx:630` | `🎨` | `Palette` |

### Group 4: Badge Wallet Empty States (4 files)
| File | Emoji | Lucide Icon |
|------|-------|-------------|
| `AllRevokedEmptyState.tsx:55` | `📧` | `Mail` |
| `AllRevokedEmptyState.tsx:61` | `📄` | `FileText` |
| `FilteredEmptyState.tsx:53` | `✕` | `X` |
| `FilteredEmptyState.tsx:63` | `🔄` | `RotateCw` |
| `NewEmployeeEmptyState.tsx:55` | `🔍` | `Search` |
| `NewEmployeeEmptyState.tsx:61` | `📚` | `BookOpen` |
| `NewEmployeeEmptyState.tsx:68` | `💡` | `Lightbulb` |
| `PendingBadgesEmptyState.tsx:61` | `🎉` | `PartyPopper` |
| `PendingBadgesEmptyState.tsx:76` | `🎁` | `Gift` |
| `PendingBadgesEmptyState.tsx:87` | `⏰` | `AlarmClock` |

### Group 5: Bulk Issuance (8 files)
| File | Emoji | Lucide Icon |
|------|-------|-------------|
| `BulkPreviewHeader.tsx:45` | `✅` | `CheckCircle` |
| `BulkPreviewHeader.tsx:49` | `❌` | `XCircle` |
| `BulkPreviewPage.tsx:216` | `⏰` | `AlarmClock` size={48} |
| `BulkPreviewTable.tsx:143` | `✓` | `Check` size={16} |
| `ConfirmationModal.tsx:32` | `⚠️` | `AlertTriangle` |
| `EmptyPreviewState.tsx:12` | `📋` | `ClipboardList` size={48} |
| `EmptyPreviewState.tsx:21` | `🔄` | `RotateCw` |
| `ErrorCorrectionPanel.tsx:31` | `⚠️` | `AlertTriangle` |
| `ErrorCorrectionPanel.tsx:54` | `📥` | `Download` |
| `ErrorCorrectionPanel.tsx:60` | `🔄` | `RotateCw` |
| `ProcessingComplete.tsx:57` | `✅`/`⚠️` | `CheckCircle`/`AlertTriangle` size={48} |
| `ProcessingModal.tsx:75` | `⏳` | `Loader2` (with animate-spin) |
| `ProcessingModal.tsx:96` | `✅` | `CheckCircle` |
| `ProcessingModal.tsx:102` | `✓` | `Check` |
| `ProcessingModal.tsx:103` | `⏳` | `Clock` |
| `ProcessingModal.tsx:109` | `⏱️` | `Timer` |
| `ProcessingModal.tsx:144` | `⚠️` | `AlertTriangle` |
| `SessionExpiryTimer.tsx:57` | `⏱️` | `Timer` |
| `TemplateSelector.tsx:129` | `📋` | `ClipboardList` |
| `TemplateSelector.tsx:140` | `✕` | `X` |

### Group 6: Common Components
| File | Emoji | Lucide Icon |
|------|-------|-------------|
| `CelebrationModal.tsx:59` | `🎉` (default) | `PartyPopper` |
| `CelebrationModal.tsx:172` | `🎉` | `PartyPopper` |
| `CelebrationModal.tsx:176` | `🏆` | `Award` |
| `CelebrationModal.tsx:195` | `🌟` | `Star` |
| `CelebrationModal.tsx:198` | `🏅` | `Medal` |
| `EmptyState.tsx:28` | `📭` (default) | `Inbox` |
| `EmptyState.tsx:60` | `🏅` | `Medal` |
| `EmptyState.tsx:73` | `📊` | `BarChart3` |
| `EmptyState.tsx:84` | `👥` | `Users` |
| `ErrorDisplay.tsx:46` | `⚠️` | `AlertTriangle` |
| `ErrorDisplay.tsx:67` | `⚠️` | `AlertTriangle` |

### Group 7: Other Components
| File | Emoji | Lucide Icon |
|------|-------|-------------|
| `ClaimSuccessModal.tsx:74` | `🎉` | `PartyPopper` |
| `admin/DeactivateUserDialog.tsx:162` | `⚠️` | `AlertTriangle` |
| `admin/EditRoleDialog.tsx:335-336` | `⚠️` (×2) | `AlertTriangle` |
| `analytics/TopPerformersTable.tsx:27` | `🥇🥈🥉` | `Trophy` with gold/silver/bronze colors |
| `evidence/EvidenceAttachmentPanel.tsx:117` | `🔗` | `Link` |
| `evidence/EvidenceAttachmentPanel.tsx:145` | `📋` | `ClipboardList` |
| `evidence/EvidenceAttachmentPanel.tsx:160` | `📄` | `FileText` |
| `evidence/EvidenceAttachmentPanel.tsx:191` | `✕` | `X` |
| `evidence/EvidenceList.tsx:90` | `🔗` | `Link` |
| `session/IdleWarningModal.tsx:36` | `⚠` | `AlertTriangle` |
| `TimelineView/BadgeTimelineCard.tsx:188` | `👁️` | `Eye` |
| `TimelineView/BadgeTimelineCard.tsx:196` | `⬇️` | `Download` |
| `TimelineView/BadgeTimelineCard.tsx:220` | `🚫` | `Ban` |
| `TimelineView/BadgeTimelineCard.tsx:227` | `⏰` | `AlarmClock` |

### Group 8: Pages
| File | Emoji | Lucide Icon |
|------|-------|-------------|
| `AdminAnalyticsPage.tsx:50` | `⚠️` | `AlertTriangle` |
| `AdminAnalyticsPage.tsx:286` | `🏆` | `Award` |
| `BadgeEmbedPage.tsx:125` | `⚠️` | `AlertTriangle` size={48} |
| `BadgeEmbedPage.tsx:138` | `🎨` | `Palette` |
| `BadgeEmbedPage.tsx:233,250` | `✓`/`📋` | `Check`/`ClipboardCopy` |
| `BadgeEmbedPage.tsx:263` | `📖` | `BookOpen` |
| `BulkIssuancePage.tsx:245` | `📋` | `ClipboardList` |
| `BulkIssuancePage.tsx:255` | `💡` | `Lightbulb` |
| `BulkIssuancePage.tsx:258` | `⚠️` | `AlertTriangle` |
| `BulkIssuancePage.tsx:393` | `⚠️` | `AlertTriangle` |
| `BulkIssuancePage.tsx:397` | `✅` | `CheckCircle` |
| `BulkIssuancePage.tsx:398` | `❌` | `XCircle` |
| `ClaimBadgePage.tsx:70` | `⚠️` | `AlertTriangle` size={48} |
| `ClaimBadgePage.tsx:91` | `⏳` | `Loader2` animate-spin size={48} |
| `ClaimBadgePage.tsx:104` | `🎉` | `PartyPopper` size={48} |
| `ClaimBadgePage.tsx:126` | `❌` | `XCircle` size={48} |
| `admin/MilestoneManagementPage.tsx:294` | `👥` | `Users` |

### Group 9: Utility Files
| File | Emoji | Lucide Icon |
|------|-------|-------------|
| `lib/evidenceApi.ts:162` | `📎` | Return Lucide icon name string `'Paperclip'` |
| `lib/evidenceApi.ts:163` | `📷` | `'Camera'` |
| `lib/evidenceApi.ts:164` | `📄` | `'FileText'` |
| `lib/evidenceApi.ts:165` | `📝` | `'FileEdit'` |
| `lib/evidenceApi.ts:166` | `📎` | `'Paperclip'` |
| `utils/audit-activity.utils.ts:20-27,32` | All emoji | Return Lucide icon name strings |

**Important for utils:** These files return emoji as strings. The approach should be:
- Change the return type from emoji string to Lucide icon **component name** string
- Create a render helper: `renderActivityIcon(iconName: string)` that maps name → `<LucideIcon />`
- OR change the type to `React.ComponentType` and return the actual Lucide component
- Check all consumers of these utils to update rendering

Recommended approach for `audit-activity.utils.ts`:
```tsx
import { Medal, CheckCircle, Ban, Upload, FilePen, PenLine, User, Wrench, ClipboardList } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ACTIVITY_CONFIG: Record<string, { icon: LucideIcon; verb: string }> = {
  BADGE_ISSUED: { icon: Medal, verb: 'issued' },
  BADGE_CLAIMED: { icon: CheckCircle, verb: 'claimed' },
  BADGE_REVOKED: { icon: Ban, verb: 'revoked' },
  BADGE_SHARED: { icon: Upload, verb: 'shared' },
  TEMPLATE_CREATED: { icon: FilePen, verb: 'created template' },
  TEMPLATE_UPDATED: { icon: PenLine, verb: 'updated template' },
  USER_REGISTERED: { icon: User, verb: 'registered' },
  USER_UPDATED: { icon: Wrench, verb: 'updated user' },
};
// Default: ClipboardList
```
Then update all consumers to render `<Icon size={16} aria-hidden="true" />` instead of `{icon}`.

Similarly for `evidenceApi.ts` — change `getFileIcon()` to return a Lucide component.

## Refactoring Pattern for `icon` Props

Many components accept `icon` as a string prop (e.g., `icon="🏆"`). The migration strategy:

### Option A (Recommended): Change `icon` prop to accept `ReactNode`
```tsx
// Before
interface StatCardProps { icon: string; ... }
<span className="text-2xl">{icon}</span>

// After
interface StatCardProps { icon: ReactNode; ... }
<span className="flex items-center justify-center h-8 w-8">{icon}</span>

// Caller:
<StatCard icon={<Award size={24} aria-hidden="true" />} ... />
```

### Option B: Change `icon` prop to accept `LucideIcon` type
```tsx
import type { LucideIcon } from 'lucide-react';
interface StatCardProps { icon: LucideIcon; ... }
// Then render: <props.icon size={24} aria-hidden="true" />
```

Choose Option A if the component might receive non-Lucide icons in the future, Option B for stricter typing.

## Components That Accept `icon` as String Prop (must update interface)
1. `StatCard` (used by all 4 dashboards)
2. `EmptyState` (`components/common/EmptyState.tsx`)
3. `CelebrationModal` (`components/common/CelebrationModal.tsx`)
4. Any other component with `icon: string` prop

**Check the component definition** and update the typing + rendering logic, then update ALL callers.

## Tailwind v4 Reminder (CRITICAL — Lesson 52)
- Colors use `oklch()` format — do NOT wrap in `hsl()`
- CSS variables: use `var(--color-x)` directly, NOT `hsl(var(--x))`
- `className` for Lucide: use `text-green-600`, `text-amber-500`, etc.
- Icon color is inherited from parent `text-*` class by default

## strokeWidth Convention
- Default: `strokeWidth={2}` (Lucide default, no need to specify)
- Thin/subtle: `strokeWidth={1.5}`
- Bold/emphasis: `strokeWidth={2.5}`

## Testing Checklist
1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx eslint . --max-warnings=0` — zero lint errors  
3. `npm test` — all tests pass (currently 837)
4. Visual: every page should show Lucide icons, zero emoji in UI
5. Search verification: `grep -rn` for emoji in `.tsx`/`.ts` (excluding comments, test files, milestone icon data) should return zero

## Final Verification Command
```bash
python -c "
import os, re
pattern = re.compile(r'[\U0001F300-\U0001F9FF\u2600-\u27BF\u2702-\u27B0\u2764\uFE0F\u200D\u20E3\U0001FA00-\U0001FAFF]')
skip = ['node_modules', 'dist', '__tests__', '.test.', '.spec.']
hits = []
for root, dirs, files in os.walk('frontend/src'):
    dirs[:] = [d for d in dirs if d not in skip]
    for f in files:
        if f.endswith(('.tsx', '.ts')) and not any(s in f for s in skip):
            fp = os.path.join(root, f)
            for i, line in enumerate(open(fp, encoding='utf-8'), 1):
                if pattern.search(line):
                    stripped = line.strip()
                    # Allow: comments, milestone icon data, share message text
                    if stripped.startswith('//') or stripped.startswith('*'):
                        continue
                    if 'MILESTONE_ICONS' in stripped or \"m.icon || '\" in stripped:
                        continue
                    hits.append(f'{fp}:{i}: {stripped[:100]}')
for h in hits:
    print(h)
if not hits:
    print('✅ Zero emoji remaining in JSX source!')
"
```

## Estimated Scope
- **~45 files** to modify
- **~150+ emoji occurrences** to replace
- **~3 interface/type changes** (StatCard, EmptyState, CelebrationModal icon props)
- **2 utility refactors** (audit-activity.utils.ts, evidenceApi.ts)

## Commit Message Template
```
feat(ui): replace all emoji with Lucide React icons (Story 15.10)

- Replaced ~150 emoji occurrences across ~45 frontend files
- Standardised icon sizing: 16/20/24/32/48px by context
- Updated StatCard/EmptyState/CelebrationModal icon prop types
- Refactored audit-activity.utils and evidenceApi to return Lucide components
- Added aria-hidden="true" to all decorative icons
- Retained milestone emoji picker (user content data, not UI chrome)

Ref: ADR-016 DEC-016-05
0 lint errors | 0 TS errors | 837/837 tests pass
```
