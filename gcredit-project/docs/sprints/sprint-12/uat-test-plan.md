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

## 1A. Seed Data Quick Reference

> All data created by `seed-uat.ts`. Use this section to know **exactly** what to expect on each page.

### Users (5)

| Name | Email | Role | Dept | Manager | Badges (CLAIMED/PENDING/REVOKED) |
|------|-------|------|------|---------|----------------------------------|
| Admin User | admin@gcredit.com | ADMIN | IT | — | 1 CLAIMED (Team Player), 1 PENDING (Cloud Expert) |
| Demo Issuer | issuer@gcredit.com | ISSUER | HR | — | 0 |
| Team Manager | manager@gcredit.com | MANAGER | Engineering | — | 2 CLAIMED (Leadership, Innovation) + 1 EXPIRED (Security) |
| Demo Employee | employee@gcredit.com | EMPLOYEE | Engineering | Team Manager | 4 CLAIMED + 1 PENDING + 1 REVOKED = 6 total |
| Demo Employee2 | employee2@gcredit.com | EMPLOYEE | Development | Team Manager | 0 |

> **Manager hierarchy:** Employee + Employee2 → Manager (2 subordinates). Admin, Issuer have no manager.

### Skill Categories (12) — Tree View

```
├─ 🔒 技术技能 / Technical Skills (blue, L1)         ← system-defined
│   ├─ 🔒 编程语言 / Programming Languages (blue, L2)
│   │      Skills: TypeScript (INT), AI (INT)
│   └─ 🔒 云平台 / Cloud Platforms (cyan, L2)
│       │  Skills: Azure Cloud (ADV), Docker (INT)
│       └─ AWS / Amazon Web Services (orange, L3)     ← user-defined, editable
│              Skills: (none)
├─ 🔒 软技能 / Soft Skills (amber, L1)
│   ├─ 🔒 沟通能力 / Communication (amber, L2)
│   │      Skills: Public Speaking (BEG), Negotiation (ADV)
│   └─ 🔒 领导力 / Leadership (orange, L2)
│          Skills: Team Leadership (EXP)
├─ 🔒 行业知识 / Domain Knowledge (emerald, L1)       ← no sub-categories, no skills
├─ 🔒 公司特定能力 / Company-Specific (violet, L1)    ← no sub-categories, no skills
├─ 🔒 通用职业技能 / Professional Skills (cyan, L1)
│      Skills: Project Management (ADV)
├─ Internal Tools (rose, L1)                          ← user-defined, editable
│      Skills: G-Credit Platform (BEG)
└─ Experimental (lime, L1)                            ← user-defined, empty → deletable
       Skills: (none)
```

- 🔒 = `isSystemDefined=true` → lock icon, no delete, no edit name
- L1 × 7 (5 system + 2 custom), L2 × 4 (system), L3 × 1 (user-defined)
- Colors: blue, amber, emerald, violet, cyan, rose, lime, orange

### Skills (9)

| Skill Name | Category (L2/L1) | Level | Used by Templates | Deletable? |
|------------|-------------------|-------|-------------------|-----------|
| TypeScript | Programming Lang. | INT | tmpl1, tmpl6, tmpl7 | ❌ |
| Azure Cloud | Cloud Platforms | ADV | tmpl1, tmpl6 | ❌ |
| Docker | Cloud Platforms | INT | tmpl1, tmpl6 | ❌ |
| AI | Programming Lang. | INT | tmpl1, tmpl7 | ❌ |
| Public Speaking | Communication | BEG | tmpl2, tmpl8, tmpl9 | ❌ |
| Team Leadership | Leadership | EXP | tmpl2, tmpl8 | ❌ |
| Project Management | Professional Skills | ADV | tmpl5, tmpl8, tmpl9 | ❌ |
| **Negotiation** | Communication | ADV | **NONE** | **✅ — use for UAT-S12-010 delete test** |
| **G-Credit Platform** | Internal Tools | BEG | **NONE** | **✅ — but category has skill → category delete blocked** |

### Badge Templates (9, all ACTIVE)

| # | Name | Category | Skills | Created By |
|---|------|----------|--------|------------|
| tmpl1 | Cloud Expert Certification | certification | TypeScript, Azure Cloud, Docker, AI | Issuer |
| tmpl2 | Leadership Excellence | achievement | Team Leadership, Public Speaking | Issuer |
| tmpl3 | Innovation Champion | achievement | (none) | Admin |
| tmpl4 | Security Specialist | certification | (none) | Admin |
| tmpl5 | Team Player Award | participation | Project Management | Issuer |
| tmpl6 | DevOps Engineer Certification | skill | Azure Cloud, Docker, TypeScript | Issuer |
| tmpl7 | AI & Machine Learning Pioneer | skill | AI, TypeScript | Admin |
| tmpl8 | Mentor of the Year | achievement | Team Leadership, Public Speaking, Project Mgmt | Issuer |
| tmpl9 | Customer Success Champion | participation | Public Speaking, Project Mgmt | Admin |

### Badges (11)

| Badge | Template | Recipient | Status | Evidence | VerificationId (last 4) |
|-------|----------|-----------|--------|----------|------------------------|
| badge1 | Cloud Expert | Employee | CLAIMED | 📄 cloud-cert-2026.pdf | ...0001 |
| badge2 | Leadership Excellence | Employee | CLAIMED | 🔗 learn.microsoft.com/certifications/leadership | ...0002 |
| badge3 | Innovation Champion | Employee | CLAIMED | 📄 innovation-proposal-q1.pdf | ...0003 |
| badge4 | Team Player Award | Employee | CLAIMED | (none) | ...0004 |
| badge5 | Security Specialist | Employee | ⏳ PENDING | (none) | ...0005 |
| badge6 | Cloud Expert | Employee | 🚫 REVOKED | (none) | ...0006 |
| badge7 | Leadership Excellence | Manager | CLAIMED | (none) | ...0007 |
| badge8 | Innovation Champion | Manager | CLAIMED | (none) | ...0008 |
| badge9 | Security Specialist | Manager | CLAIMED (**EXPIRED**) | (none) | ...0009 |
| badge10 | Team Player Award | Admin | CLAIMED | (none) | ...0010 |
| badge11 | Cloud Expert | Admin | ⏳ PENDING | (none) | ...0011 |

**Verification URLs (copy-paste for testing):**
- CLAIMED badge: `http://localhost:5173/verify/00000000-0000-4000-a000-000300000001`
- PENDING badge: `http://localhost:5173/verify/00000000-0000-4000-a000-000300000005`
- REVOKED badge: `http://localhost:5173/verify/00000000-0000-4000-a000-000300000006`
- EXPIRED badge: `http://localhost:5173/verify/00000000-0000-4000-a000-000300000009`

### Evidence Files (3)

| Evidence | Badge | Type | File/URL | Uploaded By |
|----------|-------|------|----------|-------------|
| evidence1 | badge1 (Cloud Expert) | FILE | cloud-cert-2026.pdf (240KB, PDF) | Employee |
| evidence2 | badge3 (Innovation) | FILE | innovation-proposal-q1.pdf (500KB, PDF) | Employee |
| evidence3 | badge2 (Leadership) | URL | https://learn.microsoft.com/certifications/leadership | Employee |

### Milestones (5)

| Milestone | Type | Scope | Threshold | Active | Icon |
|-----------|------|-------|-----------|--------|------|
| First Badge | BADGE_COUNT | global | 1 | ✅ | 🏆 |
| Badge Collector | BADGE_COUNT | global | 5 | ✅ | ⭐ |
| Well-Rounded Learner | CATEGORY_COUNT | global | 3 | ✅ | 🌟 |
| Cloud Specialist | BADGE_COUNT | category (技术技能) | 3 | ✅ | ☁️ |
| Badge Master | BADGE_COUNT | global | 10 | ❌ inactive | 👑 |

### Milestone Progress per User (expected)

| User | CLAIMED Badges | First Badge (≥1) | Badge Collector (≥5) | Well-Rounded (≥3 cats) | Cloud Specialist (≥3 Tech) |
|------|---------------|-------------------|---------------------|------------------------|--------------------------|
| Employee | 4 | ✅ ACHIEVED | ❌ 4/5 (80%) | depends on impl. | depends on impl. |
| Manager | 2 | ✅ ACHIEVED | ❌ 2/5 (40%) | depends on impl. | ❌ |
| Admin | 1 | ✅ ACHIEVED | ❌ 1/5 (20%) | ❌ | ❌ |
| Issuer | 0 | ❌ 0/1 (0%) | ❌ 0/5 (0%) | ❌ | ❌ |
| Employee2 | 0 | ❌ 0/1 (0%) | ❌ 0/5 (0%) | ❌ | ❌ |

> **UAT-S12-018b tip:** Login as Employee → Dashboard should show **"Badge Collector" at 80% progress** (4/5). Issue 1 more badge to Employee and claim it → CelebrationModal should fire.

### Audit Logs (9)

| Action | Entity | Actor | When |
|--------|--------|-------|------|
| ISSUED (badge1 Cloud Expert) | Badge | Issuer | ~2 months ago |
| CLAIMED (badge1) | Badge | Employee | ~2 months ago |
| ISSUED (badge2 Leadership) | Badge | Issuer | ~1 month ago |
| CLAIMED (badge2) | Badge | Employee | ~1 month ago |
| ISSUED (badge6 Cloud Expert) | Badge | Issuer | ~2 months ago |
| CLAIMED (badge6) | Badge | Employee | ~2 months ago |
| REVOKED (badge6) | Badge | Manager | ~1 week ago |
| CREATED (tmpl1 Cloud Expert) | BadgeTemplate | Issuer | ~2+ months ago |
| UPDATED (Employee role) | User | Admin | ~1 week ago |

---

## 1B. Recommended Execution Order

> Follow this order to avoid dependency issues. Each phase builds on the previous one.

### Phase 1: View & Verify Seed Data (10 min)
> Goal: Confirm the environment is correct before making any changes.

| Step | Test Case(s) | Login As | What to Check |
|------|-------------|----------|---------------|
| 1 | UAT-S12-001 | Admin | Category tree shows 3 levels: 技术技能 → 云平台 → AWS |
| 2 | UAT-S12-007 | Admin | System categories (5 L1 + 4 L2) show 🔒 icon, no delete |
| 3 | UAT-S12-008 | Admin | Skills page: click 编程语言 → shows TypeScript + AI |
| 4 | UAT-S12-011 | Admin | Skill tags show colored badges matching category tree colors |
| 5 | UAT-S12-012 | Admin | Users table: 5 rows, all Source=Local (gray badge) |
| 6 | UAT-S12-016 | Admin | Milestones: 3 global cards + 1 category card (Cloud Specialist). Badge Master is grayed/hidden (inactive) |
| 7 | UAT-S12-023 | Admin | Dashboard activity feed: human-readable (not JSON) |
| 8 | UAT-S12-024 | Admin | Check badge detail → skill names shown (not UUIDs) |

### Phase 2: CRUD Operations (20 min)
> Goal: Test create/edit/delete workflows.

| Step | Test Case(s) | Login As | What to Do |
|------|-------------|----------|------------|
| 9 | UAT-S12-002 | Admin | Create top-level category "Test Category" |
| 10 | UAT-S12-003 | Admin | Create subcategory under it; create sub-sub under that; try L4 → blocked |
| 11 | UAT-S12-004 | Admin | Edit "Experimental" name → verify; try edit 🔒 category → 403 |
| 12 | UAT-S12-005 | Admin | Drag-reorder categories at same level |
| 13 | UAT-S12-006 | Admin | Try delete "Internal Tools" (has skill G-Credit Platform) → blocked |
| 14 | — | Admin | Delete "Experimental" (empty custom) → should succeed |
| 15 | UAT-S12-009 | Admin | Click category in tree → "Add Skill" inline → type name → Tab |
| 16 | UAT-S12-010 | Admin | Edit a skill name → save. Delete "Negotiation" (unreferenced) → success. Delete "TypeScript" (referenced) → blocked |
| 17 | UAT-S12-015b | Admin | Create local user test@example.com → success. Same email again → 409 |
| 18 | UAT-S12-017 | Admin | Create milestone: badge_count × global, threshold=2. Create another: badge_count × category |
| 19 | UAT-S12-018 | Admin | Toggle Badge Master active → observe. Toggle back off. Edit Cloud Specialist → metric/scope disabled |

### Phase 3: Evidence (15 min)
> Goal: Test file + URL evidence during badge issuance.

| Step | Test Case(s) | Login As | What to Do |
|------|-------------|----------|------------|
| 20 | UAT-S12-019 | Issuer | Issue badge → upload PDF file evidence → observe progress bar |
| 21 | UAT-S12-020 | Issuer | Issue another badge → add URL evidence (https://example.com/cert) |
| 22 | UAT-S12-021 | Admin → Employee | Check badge detail in Admin; login as Employee → Wallet → same badge; open /verify/... in incognito |
| 23 | UAT-S12-022 | Employee | Open badge1 (has FILE evidence) and badge2 (has URL evidence) → both display correctly |

### Phase 4: User Management Advanced (15 min)
> Goal: Test dual-mode user provisioning features.

| Step | Test Case(s) | Login As | M365? | What to Do |
|------|-------------|----------|-------|------------|
| 24 | UAT-S12-012b | Admin | No | Search "Demo" → filters to 3 users. Filter Role=MANAGER → 1 result. Filter Status=Active → 5. Change page size |
| 25 | UAT-S12-013 | Admin | No | Edit Employee's role to MANAGER → confirm dialog → success |
| 26 | UAT-S12-015c | Admin | No | Delete test@example.com (created in step 17). Try delete Employee → warning "manages 0–2 employees" |
| 27 | UAT-S12-014 | Admin | No | Lock Employee2 → confirm → status=Locked. Unlock → Active |
| 28 | UAT-S12-015 | Admin | No | Click view on Employee → Sheet panel with profile + badge summary |
| 29 | UAT-S12-015d | Admin | **YES** | Open M365 Sync panel → "Sync Users" → observe. Check sync history |
| 30 | UAT-S12-013b | Admin | **YES** | Observe M365 user row: only view+lock. Local user row: edit+view+lock+delete |
| 31 | UAT-S12-R08 | Admin | **YES** | DevTools Network → GET /api/admin/users → check `source` field, no `azureId` |

### Phase 5: Dashboard & Wallet (10 min)
> Goal: Milestone progress + timeline rendering.

| Step | Test Case(s) | Login As | What to Do |
|------|-------------|----------|------------|
| 32 | UAT-S12-018b | Employee | Dashboard → milestone progress shows "Badge Collector" at 4/5 (80%) |
| 33 | — | Issuer→Employee | **(optional)** Issue 1 more badge to Employee → Employee claims → CelebrationModal fires |
| 34 | UAT-S12-018c | Employee | Wallet → timeline → MilestoneTimelineCard for "First Badge" achieved |
| 35 | UAT-S12-011b | Admin | Badge Template create → skill picker → skills grouped by category with color dots |
| 36 | UAT-S12-011c | — | Badge detail + /verify page → skill tags with category colors |

### Phase 6: Regression (10 min)
> Goal: Existing features not broken.

| Step | Test Case(s) | Login As | What to Do |
|------|-------------|----------|------------|
| 37 | UAT-S12-R01 | Issuer | Single badge issuance → success. Bulk CSV → download template → upload → preview → confirm |
| 38 | UAT-S12-R02 | Employee→Mgr | Employee claim badge5 (PENDING). Open verify URL. Manager revoke it |
| 39 | UAT-S12-R03 | Admin→Manager | Admin dashboard = global stats. Manager dashboard = team stats (2 direct reports) |
| 40 | UAT-S12-R04 | Employee | Wallet → badge cards in timeline |
| 41 | UAT-S12-R05 | Employee | Badge detail → Share via Email → send |
| 42 | UAT-S12-R06 | Employee→Issuer | Employee → /admin/badges/issue → blocked. Issuer → /admin/users → blocked |
| 43 | UAT-S12-R07 | Manager | Badge issuance/issued list → only direct reports visible |

---

## 1C. M365 Dependency Guide

### Cases Requiring M365 Tenant (6 cases)

These test cases **require a configured M365 Dev Tenant** in `.env` (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`). If no M365 tenant is available, **skip with justification "No M365 tenant configured"**.

| Test Case | Why M365 Required | Degraded Testing Without M365 |
|-----------|-------------------|-------------------------------|
| UAT-S12-012b (partial) | Source filter "M365" needs synced users | ⚠️ Test search + role/status filters only, skip Source=M365 filter |
| UAT-S12-013b | M365 row has restricted actions | ❌ Cannot verify M365 row action restrictions |
| UAT-S12-014 (partial) | M365 lock notice text | ⚠️ Test local lock/unlock only, skip M365 notice |
| UAT-S12-015 (partial) | M365 detail panel shows "Identity managed by..." | ⚠️ Test local user detail only |
| UAT-S12-015d | Sync Users + Sync Roles buttons | ❌ Cannot test sync functionality |
| UAT-S12-R08 | `source: 'M365'` in API response | ⚠️ Verify `source: 'LOCAL'` only |

### Cases Fully Testable Without M365 (35 cases)

All other test cases work with **local-only** users. No M365 configuration needed.

### How to Enable M365 Testing

1. Ensure `.env` has valid Azure AD credentials:
   ```
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-client-id
   AZURE_CLIENT_SECRET=your-client-secret
   AZURE_ADMIN_GROUP_ID=your-admin-group-id
   ```
2. Restart backend after `.env` change
3. Login as Admin → Users → "Sync Users" → wait for sync to complete
4. Verify M365 users appear in table with blue "M365" source badge
5. Proceed with M365-dependent test cases

---

## 1D. Specific Verification Checklist

> Quick-reference numbers for manual testing. Use alongside the test cases below.

### When Viewing Skill Category Tree (UAT-S12-001)
- Expect **7 top-level** nodes (5 system 🔒 + 2 custom)
- Expand **技术技能** → 2 children (编程语言, 云平台)
- Expand **云平台** → 1 child (AWS) — this proves **3 levels**
- Expand **软技能** → 2 children (沟通能力, 领导力)
- Skill counts per node: 编程语言=2, 云平台=2, 沟通能力=2, 领导力=1, Professional Skills=1, Internal Tools=1

### When Viewing Users Table (UAT-S12-012)
- Expect **5 rows**: Admin User (ADMIN), Demo Issuer (ISSUER), Team Manager (MANAGER), Demo Employee (EMPLOYEE), Demo Employee2 (EMPLOYEE)
- All Source badges = **gray "Local"**
- Badge counts: Admin=2, Issuer=0, Manager=3, Employee=6, Employee2=0

### When Viewing Milestones Grid (UAT-S12-016)
- **Global Milestones** section: 3 cards (First Badge 🏆, Badge Collector ⭐, Well-Rounded Learner 🌟)
- **Category Milestones** section: 1 card (Cloud Specialist ☁️)
- Badge Master (👑) should be **hidden or grayed** (inactive)

### When Testing Evidence Display (UAT-S12-021)
| Badge | What to See |
|-------|-------------|
| badge1 (Cloud Expert, Employee) | 📄 "cloud-certification-exam-results.pdf" (240KB) with download link |
| badge2 (Leadership, Employee) | 🔗 "https://learn.microsoft.com/certifications/leadership" clickable link |
| badge3 (Innovation, Employee) | 📄 "innovation-proposal-q1-2026.pdf" (500KB) with download link |
| badge4 (Team Player, Employee) | No evidence section (or "No evidence attached") |

### When Testing Dashboard Milestone Progress (UAT-S12-018b)

**Login as Employee (4 CLAIMED badges):**
- "First Badge" (threshold=1): ✅ ACHIEVED — should not show in progress bar (already done)
- "Badge Collector" (threshold=5): **4/5 = 80%** — next goal, progress bar visible
- "Well-Rounded Learner" (threshold=3): depends on category counting implementation

**Login as Manager (2 CLAIMED badges + 1 expired):**
- Expired badges typically don't count → effectively 2 badges
- "First Badge": ✅ ACHIEVED
- "Badge Collector": 2/5 = 40%

**Login as Admin (1 CLAIMED + 1 PENDING):**
- PENDING doesn't count as earned → effectively 1 badge
- "First Badge": ✅ ACHIEVED
- "Badge Collector": 1/5 = 20%

### When Testing Activity Feed (UAT-S12-023)
- Expect at least **9 entries** in audit log
- Latest first (reverse chronological): REVOKED → UPDATED → CLAIMED → ISSUED → ...
- Human-readable format examples:
  - "Issued Cloud Expert Certification badge to employee@gcredit.com"
  - "employee@gcredit.com claimed a badge"
  - "manager@gcredit.com revoked a badge — Reason: Certification expired..."

### When Testing RBAC (UAT-S12-R06)

| Role | Can Access | Blocked From |
|------|-----------|--------------|
| ADMIN | All admin pages | — |
| ISSUER | `/admin/badges/issue`, `/admin/badges` | `/admin/users`, `/admin/milestones`, `/admin/skills/categories` |
| MANAGER | Dashboard (team), Wallet | All `/admin/*` pages |
| EMPLOYEE | Dashboard, Wallet | All `/admin/*` pages |

### When Testing Manager Scoping (UAT-S12-R03, R07)
- Manager "Team Manager" has **2 direct reports**: Demo Employee, Demo Employee2
- Manager dashboard should show: badges issued to these 2 employees only
- Admin dashboard should show: all 11 badges across all users

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
