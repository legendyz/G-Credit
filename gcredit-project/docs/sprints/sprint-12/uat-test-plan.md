# G-Credit Sprint 12 — UAT Test Plan

**Version:** 1.0
**Created:** 2026-02-22
**Sprint:** 12
**Story:** 12.9
**Tester(s):** _______________
**Date(s):** _______________

---

## 1. Environment Setup

### Prerequisites

- Node.js 20.x, PostgreSQL 16, Azure Blob Storage (evidence container)
- Backend `.env` configured (see `.env.example`)
- M365 Dev Tenant accessible (for sync tests)
- Task -1 (Clean Environment Reset) completed
- Task 0 (Code Hygiene Check) completed
- Task 0.5 (Evidence Migration Verification) completed

### Steps

1. **Database reset & seed:**
   ```bash
   cd gcredit-project/backend
   npx prisma migrate reset --force
   ```
   This runs all migrations + executes the seed script automatically.

2. **Start backend:**
   ```bash
   npm run start:dev
   # Verify: http://localhost:3000/health returns { status: "ok" }
   ```

3. **Start frontend:**
   ```bash
   cd gcredit-project/frontend
   npm run dev
   # Verify: http://localhost:5173 loads login page
   ```

4. **JWT Token expiry (optional):**
   - For extended UAT sessions, edit `backend/.env`:
     ```
     JWT_ACCESS_EXPIRES_IN="4h"
     ```
   - Restart backend for change to take effect.

5. **Verify seed data:**
   - Log in with each test account below.
   - Verify skill categories, skills, and milestones are seeded.
   - Azure Blob "evidence" container is empty.

6. **Browser requirements:**
   - Chrome latest (recommended)
   - Desktop: 1440×900, Mobile: 375×812

### Test Accounts

**Pre-seeded (local) users** — created by `seed-uat.ts`:

| Role | Email | Password | Sprint 12 Features |
|------|-------|----------|-------------------|
| Admin | admin@gcredit.com | password123 | All admin pages, user management, M365 sync, milestones |
| Issuer | issuer@gcredit.com | password123 | Evidence upload/URL during issuance |
| Manager | manager@gcredit.com | password123 | Regression: revocation, team scoping |
| Employee | employee@gcredit.com | password123 | Regression: wallet, evidence display |
| Employee2 | employee2@gcredit.com | password123 | Regression: wallet |

**M365 users** — imported via M365 Sync (NOT pre-seeded):

| Source | How to obtain |
|--------|--------------|
| M365 tenant | Admin → Users → "Sync Users" button → full sync from Azure AD |

> **Note:** M365 users have `passwordHash=''` and cannot log in via password. They appear in the Admin user table after sync.

---

## 2. Test Cases

### 2.1 Skill Category Management — Story 12.1 (7 cases)

| ID | Priority | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|----------|----------|---------------|-------|-----------------|-----------|
| UAT-S12-001 | HIGH | Admin views skill category tree (3 levels) | Logged in as Admin, seed categories exist | 1. Navigate to `/admin/skills/categories` 2. Observe tree structure | Tree displays with expand/collapse chevrons. 3 levels visible (e.g., Technology → Cloud → AWS). Each node shows skill count badge. `<AdminPageShell>` wrapper with title + description. | |
| UAT-S12-002 | HIGH | Admin creates top-level category | On category management page | 1. Click "Add Category" (top-level) 2. Enter name: "Test Category" 3. Enter description: "UAT test" 4. Submit | New Level 1 category appears at bottom of tree. Sonner toast: "Category created successfully". No `parentId` in request. | |
| UAT-S12-003 | HIGH | Admin creates subcategory under existing category | Top-level category exists | 1. Hover a Level 1 category → click "+" action 2. Enter name: "Sub Category" 3. Submit 4. Repeat: hover the new Level 2 → click "+" 5. Enter name: "Sub-Sub Category" | Level 2 category nested under parent. Level 3 nested under Level 2. Attempting to add a child to Level 3 is blocked (max 3 levels). | |
| UAT-S12-004 | MEDIUM | Admin edits category name/description | Categories exist | 1. Click edit icon on any category 2. Change name to "Updated Name" 3. Change description 4. Save | Name and description updated in tree. Toast: success. System-defined categories: edit name/description is blocked (403 from backend). | |
| UAT-S12-005 | MEDIUM | Admin drag-and-drop reorders categories (same level) | Multiple same-level categories exist | 1. Grab drag handle (⠿) on a category 2. Drag to new position within same level 3. Release | Category reordered. `displayOrder` updated. Only same-level reorder works — cross-level reparenting is not supported. | |
| UAT-S12-006 | HIGH | Admin delete blocked for category with skills | Category has skills assigned | 1. Click delete icon on a category that has skills 2. Observe | `<ConfirmDialog>` shows warning: category has N skills and cannot be deleted. Delete button disabled or action rejected by backend. | |
| UAT-S12-007 | MEDIUM | System-defined category shows lock icon, no delete | Seed includes `isSystemDefined=true` categories | 1. Observe system-defined category in tree | Lock icon (🔒) displayed. No delete action available. Edit of name/description blocked. Backend returns 403 on attempted update/delete. | |

### 2.2 Skill Management — Story 12.2 (6 cases)

| ID | Priority | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|----------|----------|---------------|-------|-----------------|-----------|
| UAT-S12-008 | HIGH | Admin views skills filtered by category | Logged in as Admin, seed skills exist | 1. Navigate to `/admin/skills` 2. Observe split layout: category tree (left) + skills table (right) 3. Click a category in tree | Skills table filters to show only skills in selected category. Table columns: Skill Name, Description, Category, Level, Badge Count, Actions. On <1024px: tree collapses into dropdown selector above table. | |
| UAT-S12-009 | HIGH | Admin creates skill with inline add (Tab-to-submit) | Category selected in tree | 1. Click "Add Skill" row at top of table 2. Type skill name: "UAT Skill" 3. Enter description 4. Press Tab | Skill created under selected category. Toast: success. Row becomes normal table row. Press Escape cancels without creating. | |
| UAT-S12-010 | HIGH | Admin edits/deletes skill | Skills exist, some referenced by badge templates | 1. Hover a skill row → click edit (pencil icon) 2. Change name → save 3. Hover another skill → click delete 4. If skill has badge template references: observe blocked delete | Edit: name updated, toast success. Delete (no references): skill removed. Delete (with references): blocked with message showing which templates reference it. | |
| UAT-S12-011 | MEDIUM | Skill tags show category color | Skills with different categories | 1. View skills table 2. Observe category column | Each category tag has its assigned color from 10-color palette (blue, emerald, amber, rose, etc.). Colors match `categoryColors.ts` mapping. | |
| UAT-S12-011b | MEDIUM | Badge Template form groups skills by category | Navigate to Badge Template create/edit | 1. Navigate to Badge Templates → Create Template 2. Open skill picker 3. Observe grouping | Skills grouped under category headers in the picker. Each group header shows category name with color dot. | |
| UAT-S12-011c | MEDIUM | Badge detail + verify page show category-colored skill tags | Badge with skills exists | 1. Open badge detail modal in Admin 2. Observe skill tags 3. Navigate to `/verify/{verificationId}` 4. Observe skill tags | Both pages display skill tags with category-matching colors. Skill names shown (never UUIDs). Unknown skills render as "Unknown Skill" with muted styling. | |

### 2.3 User Management Enhancement — Story 12.3 (10 cases)

| ID | Priority | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|----------|----------|---------------|-------|-----------------|-----------|
| UAT-S12-012 | HIGH | Admin views user table with source/role badges | Logged in as Admin | 1. Navigate to `/admin/users` 2. Observe table columns | Table shows: Name, Email, Role (color-coded badge: ADMIN=red, ISSUER=blue, MANAGER=purple, EMPLOYEE=gray), Status, Source (`<SourceBadge>`: M365=blue/Local=gray), Badge Count, Last Active. Pagination controls visible. | |
| UAT-S12-012b | HIGH | Admin searches and filters users | Multiple users exist (local + M365 after sync) | 1. Type name in search box → verify debounce (300ms) 2. Filter by Role: "ISSUER" 3. Filter by Status: "Active" 4. Filter by Source: "Local" 5. Change page size to 25 | Search: results filter as you type. Each filter narrows results. Source filter: "M365" shows only synced users, "Local" shows only local. Page size changes work (10/25/50/100). | |
| UAT-S12-013 | HIGH | Admin edits local user role; M365 user role edit disabled | Local + M365 users exist | 1. Click edit on a **local** user row 2. Change role from EMPLOYEE to MANAGER 3. Confirm in dialog 4. Attempt to edit an **M365** user role | Local: role changes, toast success. M365: edit action not available in row actions (context-aware) OR backend returns 400 if attempted. | |
| UAT-S12-013b | HIGH | Context-aware row actions differ by source | Both local and M365 users in table | 1. Observe action buttons on M365 user row 2. Observe action buttons on Local user row | M365 row: view + lock only (no edit role, no delete). Local row: edit + view + lock + delete. | |
| UAT-S12-014 | MEDIUM | Admin lock/unlock user with M365 notice | M365 user exists | 1. Click lock on a **local** user → confirm → verify locked 2. Click unlock → verify unlocked 3. Click lock on an **M365** user | Local: lock/unlock toggles status. M365 lock dialog shows notice: "This will prevent sign-in to G-Credit only. To disable their Microsoft 365 account, contact your IT administrator." | |
| UAT-S12-015 | MEDIUM | Admin opens user detail slide-over (Sheet) | Users exist | 1. Click "view" on a **local** user → observe Sheet panel 2. Close. Click "view" on an **M365** user | Local user: Sheet shows profile, badge summary, activity. M365 user: Sheet additionally shows "Identity managed by Microsoft 365. Role assigned via Security Group." + last synced timestamp. | |
| UAT-S12-015b | HIGH | Admin creates a local user via "Add User" dialog | Logged in as Admin | 1. Click "Add User" button 2. Fill: email=test@example.com, firstName=Test, lastName=User, department=QA, role=EMPLOYEE 3. Submit 4. Try creating user with same email again | User created, appears in table with Source=Local. Duplicate email returns 409 Conflict error. ADMIN role is excluded from creation dropdown (not selectable). | |
| UAT-S12-015c | HIGH | Admin deletes a local user; blocked for M365 | Local user with/without subordinates, M365 user | 1. Delete a local user with NO subordinates → confirm 2. Delete a local user who IS a manager → observe warning 3. Attempt to delete an M365 user | No subordinates: deleted, toast success. Manager: `<DeleteUserDialog>` shows subordinate count warning ("This user manages N employees. Their manager will be set to none."). M365: delete action not available. | |
| UAT-S12-015d | MEDIUM | M365 Sync panel: Sync Users + Sync Roles | M365 tenant configured in `.env` | 1. Navigate to Users page → open M365 Sync panel 2. Click "Sync Users" (full sync) → observe progress + results 3. Click "Sync Roles" (groups-only) → observe 4. Check sync history table | Full sync: imports users from Azure AD, sets `managerId` from `directReports`. Groups-only: updates roles from security groups only. History table shows entries with sync type (FULL / GROUPS_ONLY), timestamp, user count. | |
| UAT-S12-R08 | MEDIUM | API excludes azureId, returns computed source field | M365 users synced | 1. Call `GET /api/admin/users` via DevTools Network tab 2. Inspect response JSON | Response objects have `source: 'M365'` or `source: 'LOCAL'` field. No raw `azureId` field in response. | |

### 2.4 Milestone Admin — Story 12.4 (5 cases)

| ID | Priority | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|----------|----------|---------------|-------|-----------------|-----------|
| UAT-S12-016 | HIGH | Admin views milestone card grid | Logged in as Admin, seed milestones exist | 1. Navigate to `/admin/milestones` 2. Observe card grid | Cards grouped into "Global Milestones" and "Category Milestones" sections. Each card shows: icon, title, description, metric label, scope label, threshold, isActive toggle, achievement count. Empty section shows "Create your first milestone" CTA card. | |
| UAT-S12-017 | HIGH | Admin creates milestone with unified form | On milestones page | 1. Click "Create Milestone" 2. Select metric: badge_count, scope: global, threshold: 5 3. Fill title, description, pick icon 4. Save 5. Create another: metric: badge_count, scope: category → pick a category 6. Create another: metric: category_count → scope auto-locks to global | Three milestones created: (a) badge_count × global, (b) badge_count × category (with category picker + "Include sub-categories" checkbox), (c) category_count × global (scope auto-locked). Live preview card updates in form. Auto-generated description visible. | |
| UAT-S12-018 | HIGH | Admin activates/deactivates milestone; metric/scope locked in edit | Milestones exist | 1. Toggle a milestone's isActive switch OFF → observe 2. Toggle it back ON 3. Click edit on a milestone 4. Observe metric and scope fields | Toggle updates immediately (Switch component). In edit mode: metric and scope selectors are disabled with tooltip "Cannot change after creation". Title, description, threshold, icon remain editable. | |
| UAT-S12-018b | HIGH | Dashboard shows real milestone progress; CelebrationModal fires | Active milestones exist; employee has some badges | 1. Login as Employee 2. Navigate to Dashboard 3. Observe milestone progress section 4. If employee is close to achieving a milestone: claim a badge to trigger it | Dashboard shows next un-achieved milestone with real progress bar (percentage based on actual badge count vs threshold). If milestone achieved: `<CelebrationModal>` fires with animation. If all achieved: progress shows 100%. If no active milestones: section returns null (not shown). | |
| UAT-S12-018c | MEDIUM | MilestoneTimelineCard renders in wallet TimelineView | Milestones achieved by employee | 1. Login as Employee with achieved milestones 2. Navigate to Wallet `/wallet` 3. Observe timeline | `<MilestoneTimelineCard>` renders in timeline with milestone icon, title, achievement date. Interleaved chronologically with badge cards. | |

### 2.5 Evidence Unification — Stories 12.5 + 12.6 (4 cases)

| ID | Priority | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|----------|----------|---------------|-------|-----------------|-----------|
| UAT-S12-019 | CRITICAL | Issuer uploads file evidence during badge issuance | Logged in as Issuer, ACTIVE template exists | 1. Navigate to `/admin/badges/issue` 2. Select template + recipient 3. In evidence panel: drag a PDF file (< 10MB) into drop zone 4. Observe upload progress bar 5. Add a second file (PNG) 6. Click "Issue Badge" | Files upload with progress bars. Badge issued successfully. Two-step flow: badge created → files uploaded → success. `<FileUploadZone>` accepts PDF, PNG, JPG, DOCX only. Files > 10MB show error toast. Max 5 items. | |
| UAT-S12-020 | CRITICAL | Issuer adds URL evidence during badge issuance | On issue badge page | 1. In evidence panel: click "Add URL" 2. Enter: https://example.com/cert.pdf 3. Add a second URL 4. Click "Issue Badge" | URLs added to evidence list with link icon. Badge created with URL evidence. `GET /api/badges/:id` returns `evidence[]` with `type: 'URL'` entries. | |
| UAT-S12-021 | HIGH | Evidence displays consistently across all pages | Badge with FILE + URL evidence exists | 1. Admin: Badge Management table → observe evidence count column 2. Admin: open badge detail modal → observe `<EvidenceList>` 3. Employee: login → Wallet → open badge detail 4. Public: `/verify/{verificationId}` | Badge Management shows evidence count. Detail modal: `<EvidenceList>` shows both FILE (with name, size, download link) and URL (with link icon, clickable). Wallet: same display (read-only). Verify page: FILE evidence uses SAS token URL, URL evidence shows direct link. Consistent across all views. | |
| UAT-S12-022 | HIGH | Existing badges with old evidence display correctly (migration) | Task 0.5 completed: test badges with `evidenceUrl` migrated to `EvidenceFile` records | 1. Navigate to a badge that was migrated from `evidenceUrl` 2. Open detail modal 3. Check `/verify/{verificationId}` | Migrated evidence appears as `{ type: 'URL', sourceUrl: '...' }` in unified `evidence[]` array. No broken links. Migration was verified in Task 0.5 (idempotent, reversible). | |

### 2.6 Quick Fixes — Stories 12.7 + 12.8 (2 cases)

| ID | Priority | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|----------|----------|---------------|-------|-----------------|-----------|
| UAT-S12-023 | MEDIUM | Activity feed shows human-readable descriptions | Logged in as Admin, recent badge activity exists | 1. Navigate to Dashboard 2. Observe "Recent Activity" section | Activity entries show human-readable descriptions (e.g., "Issued Cloud Expert badge to John Doe") instead of raw JSON/action names. Covers: ISSUED, CLAIMED, REVOKED, NOTIFICATION_SENT, CREATED, UPDATED. Unknown types degrade to action name (not JSON). | |
| UAT-S12-024 | HIGH | No UUID displayed for skill names anywhere in the UI | Skills assigned to badges | 1. Check badge detail modal → skill tags 2. Check verify page → skill tags 3. Check badge search filters → skill chips 4. Check any other page displaying skills | All pages show human-readable skill names. If a skill ID cannot be resolved (edge case): displays "Unknown Skill" with muted italic styling (`text-muted-foreground italic bg-muted`). Never shows raw UUID strings. | |

### 2.7 Regression Tests (7 cases)

| ID | Priority | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|----------|----------|---------------|-------|-----------------|-----------|
| UAT-S12-R01 | CRITICAL | Existing badge issuance flow still works (single + bulk) | Logged in as Issuer, ACTIVE templates | 1. Issue a single badge (select template, recipient, submit) 2. Navigate to bulk issuance 3. Download CSV template 4. Upload CSV with 2-3 valid rows 5. Preview + confirm | Single: badge created, status PENDING. Bulk: CSV template downloads with correct headers (recipientEmail, templateId, expiresIn — NO evidenceUrl column). Preview shows rows. Confirm issues badges. | |
| UAT-S12-R02 | CRITICAL | Badge claim/verify/revoke lifecycle unaffected | PENDING badge exists for Employee | 1. Login as Employee → Wallet → claim badge 2. Open `/verify/{verificationId}` in incognito 3. Login as Manager → revoke the badge 4. Re-check verify page | Claim: status → CLAIMED. Verify: public page loads, shows badge details. Revoke: status → REVOKED with reason. Verify page shows REVOKED status. | |
| UAT-S12-R03 | HIGH | Dashboard analytics — manager-based team scoping | Logged in as Admin, then Manager | 1. Admin: Dashboard shows global stats (all users) 2. Manager: Dashboard shows team stats (direct reports only, via `managerId`) | Admin sees all users' data. Manager sees only direct reports' badge data (migrated from department-based to `managerId`-based scoping in 12.3a). | |
| UAT-S12-R04 | HIGH | Employee wallet view still works | Logged in as Employee, has badges | 1. Navigate to `/wallet` 2. View badge cards in timeline 3. Click a badge to see detail | Timeline renders with badge cards + milestone cards (if any). Detail shows all fields. No layout regressions. | |
| UAT-S12-R05 | MEDIUM | Email sharing still functional | Logged in as Employee, CLAIMED badge | 1. Open badge detail 2. Click "Share via Email" 3. Enter recipient email 4. Send | Success toast, email sent. Sharing analytics recorded. | |
| UAT-S12-R06 | HIGH | RBAC enforcement unchanged | Multiple user roles | 1. Login as Employee → try `/admin/badges/issue` 2. Login as Issuer → try `/admin/users` 3. Login as Manager → try `/admin/milestones` | Employee: blocked from issuance pages. Issuer: blocked from user management. Manager: blocked from milestones admin. Only ADMIN sees all admin pages. | |
| UAT-S12-R07 | HIGH | Manager badge-issuance scoping uses managerId | Logged in as Manager | 1. Navigate to badge issuance (if Manager has issuer-level access) or check API: `GET /api/badges/issued` 2. Verify only direct reports' badges visible | Scoping is `managerId`-based (not department-based). Manager sees only badges for their direct reports. | |

---

## 3. Test Summary

| Section | Test Cases | IDs | Priority Breakdown |
|---------|-----------|-----|--------------------|
| 2.1 Skill Category Management | 7 | UAT-S12-001 to UAT-S12-007 | 3 HIGH, 4 MEDIUM |
| 2.2 Skill Management | 6 | UAT-S12-008 to UAT-S12-011c | 3 HIGH, 3 MEDIUM |
| 2.3 User Management | 10 | UAT-S12-012 to UAT-S12-R08 | 6 HIGH, 4 MEDIUM |
| 2.4 Milestone Admin | 5 | UAT-S12-016 to UAT-S12-018c | 4 HIGH, 1 MEDIUM |
| 2.5 Evidence Unification | 4 | UAT-S12-019 to UAT-S12-022 | 2 CRITICAL, 2 HIGH |
| 2.6 Quick Fixes | 2 | UAT-S12-023 to UAT-S12-024 | 1 HIGH, 1 MEDIUM |
| 2.7 Regression | 7 | UAT-S12-R01 to UAT-S12-R07 | 2 CRITICAL, 4 HIGH, 1 MEDIUM |
| **Total** | **41** | | **4 CRITICAL, 22 HIGH, 15 MEDIUM** |

### Pass Criteria

- **All 4 CRITICAL** test cases must PASS
- **All 22 HIGH** test cases must PASS (minor cosmetic deviations acceptable if documented)
- **MEDIUM** test cases: best-effort; failures documented and triaged (defer to Sprint 13 if LOW impact)
- Zero data integrity regressions (evidence, milestones, user roles)

---

## 4. Bug Log

| Bug # | Test Case | Severity | Description | Status | Fix Commit |
|-------|-----------|----------|-------------|--------|------------|
| | | | | | |

---

## 5. Sign-Off

| Role | Name | Date | Result |
|------|------|------|--------|
| Tester / PO | | | |
| Scrum Master | | | |

---

**Reference:** Sprint 10 UAT (35 cases, 153 PASS) — see `sprint-10/uat-test-plan.md`
