# Story 10.6d Code Review

**Story:** gcredit-project/docs/sprints/sprint-10/10-6d-design-system-ui-overhaul.md  
**Reviewer:** LegendZhu  
**Date:** 2026-02-09  

## Git Status
- Clean working tree (no uncommitted changes).

## Findings

### HIGH
1. **AC5 not met — Layout still applies padding, so double padding remains.** The `Layout` wrapper adds `px-4 py-6 md:px-8 md:py-8`, which conflicts with the requirement to move padding into `PageTemplate` only. See [Layout padding](gcredit-project/frontend/src/components/layout/Layout.tsx#L45-L53).
2. **AC8 not met — Admin dashboard lacks a “View All” link for Recent Activity.** The list is sliced to 5 items but no link or action is provided to access the full list. See [Recent Activity card](gcredit-project/frontend/src/pages/dashboard/AdminDashboard.tsx#L89-L111).
3. **AC12 not met — Analytics page title is not role-aware.** Title is hard-coded to “Admin Analytics” and does not switch for ISSUER users. See [PageTemplate title](gcredit-project/frontend/src/pages/AdminAnalyticsPage.tsx#L100-L104).
4. **AC4.1 not met — Wallet view is not using `PageTemplate`, and the title is “My Badge Wallet” instead of “My Badges.”** The header is hard-coded inside `TimelineView` with no `PageTemplate` wrapper. See [Timeline header](gcredit-project/frontend/src/components/TimelineView/TimelineView.tsx#L199-L212).

### MEDIUM
5. **AC2 partially implemented — spacing tokens and `md` radius are missing from Tailwind config.** The `extend` block defines colors, font sizes, shadows, and radii but does not add the `spacing` scale required by the story, and radius uses `DEFAULT` instead of `md`. See [Tailwind tokens](gcredit-project/frontend/tailwind.config.js#L66-L91).
6. **AC3 partially implemented — dark mode CSS variables are not mapped to Fluent palette.** Dark mode values still use near-neutral defaults (e.g., `--primary` becomes near-white), which does not reflect Fluent colors. See [dark mode variables](gcredit-project/frontend/src/index.css#L85-L116).
7. **AC2.2 not met — “Issue New Badge” route points to `/admin/badges`, not `/admin/badges/issue`.** The quick action uses the wrong path. See [Quick Actions](gcredit-project/frontend/src/pages/dashboard/IssuerDashboard.tsx#L77-L83).
8. **AC3.4 not met — Bulk Issuance page lacks the steps indicator.** The UI only shows “Step 1/Step 2” sections; there is no multi-step indicator (Download → Upload → Preview → Confirm). See [Bulk issuance sections](gcredit-project/frontend/src/pages/BulkIssuancePage.tsx#L190-L198).
9. **AC4.3 not met — Verify Badge page lacks a public branding header.** The page renders directly into a container with no branding header or logo section. See [Verify page layout](gcredit-project/frontend/src/pages/VerifyBadgePage.tsx#L147-L149).
10. **AC14/AC15 not evidenced — test and ESLint validation are not recorded.** Dev Agent Record remains empty, with no completion notes or file list to show tests/ESLint ran. See [Dev Agent Record placeholders](gcredit-project/docs/sprints/sprint-10/10-6d-design-system-ui-overhaul.md#L287-L296).

## Notes
- No uncommitted changes were detected; the review is based on current repo state.
