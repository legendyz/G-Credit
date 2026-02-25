# G-Credit Sprint 12.5 — UAT Test Plan

**Version:** 1.0
**Created:** 2026-02-25
**Sprint:** 12.5 (Deferred Items Cleanup)
**Scope:** Story 12.5.1 (D-1, D-2, D-3) + Story 12.5.2 (D-4)
**Tester(s):** _______________
**Date(s):** _______________

---

## 1. Environment Setup

### Prerequisites

- Sprint 12 UAT environment operational (backend + frontend + DB)
- Node.js 20.x, PostgreSQL 16
- Seed data from Sprint 12 UAT already present (or `npx prisma migrate reset --force`)
- Backend started: `npm run start:dev` → `http://localhost:3000/health` returns OK
- Frontend started: `npm run dev` → `http://localhost:5173` loads login page

### Pre-UAT Checklist

- [ ] Database migrated: `npx prisma migrate deploy` — includes `20260225033009_remove_badge_evidence_url`
- [ ] Backend starts without errors
- [ ] Frontend builds without errors
- [ ] Seed data present: skill categories (12), skills (9), users (5)

### Test Accounts

| Role | Email | Password | Used For |
|------|-------|----------|----------|
| Admin | admin@gcredit.com | password123 | All category management tests |
| Issuer | issuer@gcredit.com | password123 | Badge issuance regression |
| Employee | employee@gcredit.com | password123 | Wallet regression |

### Browser Requirements

- Desktop: Chrome latest, viewport ≥ 1440×900
- Mobile simulation: Chrome DevTools, viewport 375×812 (or any width < 1024px)

---

## 2. Test Cases — Story 12.5.1: CategoryTree Enhancements

### D-1: Responsive Tree → Dropdown (< 1024px)

#### UAT-S12.5-001: Dropdown renders below 1024px [HIGH]

**Pre-condition:** Logged in as Admin, on Skill Categories page: Admin → Skills → Categories tab (`/admin/skills/categories`), desktop ≥ 1024px, tree view visible

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Chrome DevTools → Device Toolbar → set viewport width to 1023px | Page re-renders |
| 2 | Observe category section | Tree view disappears; a `<Select>` dropdown replaces it |
| 3 | Click the dropdown | Options show all categories with `└` indent prefix for child categories |
| 4 | Verify hierarchy display | L1 categories are not indented; L2 categories show `└` prefix; L3 categories show deeper indent with `└` |
| 5 | Set viewport back to 1024px | Dropdown disappears; tree view returns |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-002: Dropdown shows "All Categories" option [MEDIUM]

**Pre-condition:** Viewport < 1024px, dropdown mode active

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click dropdown | First option shows "All Categories" |
| 2 | Select "All Categories" | Any selected category is deselected; toolbar buttons hidden |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-003: Dropdown toolbar — Edit action [HIGH]

**Pre-condition:** Viewport < 1024px, dropdown mode active, Admin user

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a user-defined category (e.g., "Internal Tools") | Category selected; toolbar buttons appear below dropdown |
| 2 | Click "Edit" button (Pencil icon) | Edit dialog opens with category name/description pre-filled |
| 3 | Change name, click Save | Category name updates; dropdown shows new name |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-004: Dropdown toolbar — Add Child action [MEDIUM]

**Pre-condition:** Viewport < 1024px, category selected at level < 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select an L1 category (e.g., "Internal Tools") | Toolbar shows "Add Child" button |
| 2 | Click "Add Child" | Create child dialog opens |
| 3 | Enter name, save | New child category appears under selected parent in dropdown |
| 4 | Select an L3 category (e.g., "AWS / Amazon Web Services") | Toolbar does NOT show "Add Child" button (max depth reached) |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-005: Dropdown toolbar — Delete action constraints [MEDIUM]

**Pre-condition:** Viewport < 1024px

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a category with children (e.g., "Technical Skills") | "Delete" button disabled |
| 2 | Select a category with skills but no children (e.g., "Professional Skills") | "Delete" button disabled |
| 3 | Select "Experimental" (no children, no skills) | "Delete" button enabled |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-006: DnD disabled below 1024px [MEDIUM]

**Pre-condition:** Viewport < 1024px, dropdown mode active

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe the dropdown UI | No drag handles visible |
| 2 | Try long-pressing / dragging items in dropdown | No drag-and-drop behavior; items cannot be reordered |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

### D-2: Blue Insertion Line (DnD Visual Feedback)

#### UAT-S12.5-007: Blue insertion line appears during drag [HIGH]

**Pre-condition:** Desktop viewport ≥ 1024px, tree view active, Admin on Skill Category Management page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Hover over a user-defined L1 category (e.g., "Experimental") | Action buttons appear on hover; grip handle visible |
| 2 | Click and drag the grip handle (GripVertical icon), move pointer ≥ 5px | Drag initiates; a floating overlay card appears showing the category name with blue border and shadow |
| 3 | Drag over the gap between other L1 categories | A blue horizontal line (2px, blue-500) appears at the insertion point |
| 4 | Move the drag over different gaps | Insertion line moves to follow pointer position, indicating where drop will place the item |
| 5 | Drop the item | Category moves to the indicated position; insertion line disappears |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-008: Insertion line only between same-level siblings [HIGH]

**Pre-condition:** Desktop viewport ≥ 1024px, tree view

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Drag an L1 category | Insertion line appears only between other L1 categories |
| 2 | Drag to a position between L2 children of a different parent | No insertion line appears (cross-level drag not allowed via DnD — use "Move to..." instead) |
| 3 | Drag an L2 category within its parent's children | Insertion line appears between sibling L2 categories under the same parent |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-009: Dragged item visual feedback [LOW]

**Pre-condition:** Desktop viewport ≥ 1024px

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start dragging a category | Original item in tree fades to ~30% opacity |
| 2 | Floating overlay: white card with shadow, category name, blue border | Overlay follows cursor |
| 3 | Drop the item | Original position restores full opacity (or item moves to new position) |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

### D-3: Cross-Level "Move to..." Action

#### UAT-S12.5-010: Move button visible on hover (desktop) [HIGH]

**Pre-condition:** Desktop viewport ≥ 1024px, Admin, tree view

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Hover over a user-defined category (e.g., "Internal Tools") | Action buttons appear: Edit, Add Child, **Move** (FolderInput icon), Delete |
| 2 | Hover over a system-defined category (e.g., "Technical Skills") | Move button visible but **disabled** with tooltip: "System-defined categories cannot be moved" |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-011: Move button in dropdown mode [HIGH]

**Pre-condition:** Viewport < 1024px, dropdown mode, Admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a user-defined category in dropdown | Toolbar shows "Move" button (FolderInput icon) |
| 2 | Click "Move" | MoveToDialog opens |
| 3 | Select a system-defined category in dropdown | "Move" button appears **disabled** with title "System-defined categories cannot be moved" |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-012: MoveToDialog — target list with constraints [CRITICAL]

**Pre-condition:** Admin, click "Move" on "Internal Tools" (L1, user-defined, has 1 skill "G-Credit Platform")

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Dialog opens | Title: `Move "Internal Tools"`; description mentions depth/cycle constraints |
| 2 | Observe target list | Shows "Root (Level 1)" at top, then all categories indented by level |
| 3 | "Internal Tools" itself in list | Disabled, shows "(Cannot move to self)" |
| 4 | "Root (Level 1)" | Disabled, shows "(Already at root)" — because "Internal Tools" is already L1 |
| 5 | Select "Technical Skills" (L1) as target | Item highlights with blue background |
| 6 | Click "Move" button | Dialog closes; "Internal Tools" is now a child of "Technical Skills" (L2) |
| 7 | Verify tree | "Internal Tools" appears under "Technical Skills" with its skill "G-Credit Platform" |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-013: MoveToDialog — cycle prevention [CRITICAL]

**Pre-condition:** Admin, click "Move" on "Technical Skills" (L1, system-defined) — **Note:** Move button disabled for system-defined. Use a parent category with children instead.

Alternative: Click "Move" on "Programming Languages" (L2, system-defined under Technical Skills) — also disabled.

**Adjusted test:** Create a user-defined L1 with a child first, then test:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a user-defined L1 "Test Parent" | Category created at L1 |
| 2 | Create child "Test Child" under "Test Parent" | L2 child created |
| 3 | Click "Move" on "Test Parent" | MoveToDialog opens |
| 4 | Observe "Test Child" in target list | Disabled, shows "(Descendant (cycle))" |
| 5 | Try to select "Test Child" | Cannot select — disabled |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-014: MoveToDialog — depth limit enforcement [CRITICAL]

**Pre-condition:** Admin, category tree with 3 levels

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Move" on an L2 category that has L3 children (e.g., "Cloud Platforms" has L3 child "AWS") | MoveToDialog opens |
| 2 | Observe other L2 categories in target list | Disabled, shows "(Would exceed max depth)" — because moving L2-with-L3-child under another L2 would create L4 |
| 3 | Observe L1 categories | Enabled — moving under L1 keeps within depth 3 |
| 4 | Select an L1 category, click Move | Move succeeds; "Cloud Platforms" is now under the new L1 parent; "AWS" remains at L3 |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-015: Move L2 to Root [HIGH]

**Pre-condition:** Admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Move" on an L2 category (e.g., "Leadership" under "Soft Skills") | Dialog opens |
| 2 | Select "Root (Level 1)" | Highlighted |
| 3 | Click "Move" | "Leadership" becomes an L1 top-level category |
| 4 | Verify tree | "Leadership" appears as L1; its skill "Team Leadership" still attached |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-016: Move L1 to become child of another L1 [HIGH]

**Pre-condition:** Admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Move" on "Experimental" (L1, user-defined, no children/skills) | Dialog opens |
| 2 | Select "Domain Knowledge" (L1) as target | Highlighted |
| 3 | Click "Move" | "Experimental" becomes L2 under "Domain Knowledge" |
| 4 | Verify tree | "Domain Knowledge" now expandable, shows "Experimental" as child |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-017: Current parent disabled in target list [MEDIUM]

**Pre-condition:** Admin, click "Move" on "Programming Languages" (L2 under "Technical Skills") — disabled because system-defined.

**Adjusted:** Use a user-defined L2 (move "Internal Tools" under "Technical Skills" first, then try to move it again)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Move "Internal Tools" under "Technical Skills" (from UAT-S12.5-012) | Done |
| 2 | Click "Move" on "Internal Tools" again | MoveToDialog opens |
| 3 | Observe "Technical Skills" in target list | Disabled, shows "(Current parent)" |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-018: Move button — loading state [LOW]

**Pre-condition:** Admin, MoveToDialog open with target selected

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a valid target, click "Move" | Button text changes to "Moving..." |
| 2 | During mutation | Cancel button disabled; dialog cannot be closed |
| 3 | After success | Dialog closes; tree refreshes |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

## 3. Test Cases — Story 12.5.2: Remove Badge.evidenceUrl

#### UAT-S12.5-019: Badge issuance still works (no regression) [HIGH]

**Pre-condition:** Logged in as Issuer

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Badge Issuance page | Page loads normally |
| 2 | Issue a single badge (select template, select recipient) | Badge created successfully with PENDING status |
| 3 | Verify badge in Badge Management | Badge appears with correct template, recipient, status |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-020: Evidence upload still works (no regression) [HIGH]

**Pre-condition:** Logged in as Issuer, a CLAIMED badge exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to a badge that supports evidence | Evidence section visible |
| 2 | Upload a file as evidence | Upload succeeds; file appears in evidence list |
| 3 | Add a URL as evidence | URL evidence added; displays in evidence list |
| 4 | Verify badge detail shows evidence | Both file and URL evidence displayed correctly |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-021: Existing seeded evidence displays correctly [HIGH]

**Pre-condition:** Seed data loaded (3 evidence files: cloud-cert PDF, innovation-proposal PDF, leadership URL)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as Employee | Dashboard loads |
| 2 | Go to Wallet → Cloud Expert badge (badge1) | Badge detail shows evidence: cloud-cert-2026.pdf |
| 3 | Go to Wallet → Innovation Champion badge (badge3) | Evidence: innovation-proposal-q1.pdf |
| 4 | Go to Wallet → Leadership Excellence badge (badge2) | Evidence: URL link to learn.microsoft.com |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-022: Database migration applied cleanly [MEDIUM]

**Pre-condition:** Database access (psql or Prisma Studio)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check `_prisma_migrations` table | `20260225033009_remove_badge_evidence_url` migration present with `finished_at` timestamp |
| 2 | `SELECT column_name FROM information_schema.columns WHERE table_name='badges'` | `evidenceUrl` column does NOT exist |
| 3 | Check other badge columns | All other columns intact: id, templateId, recipientId, issuerId, issuedAt, expiresAt, status, etc. |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

## 4. Regression Test Cases

#### UAT-S12.5-R01: Category DnD same-level reorder still works [HIGH]

**Pre-condition:** Desktop ≥ 1024px, Admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Drag an L1 category to a different position among L1 siblings | Category reorders; blue insertion line guides placement |
| 2 | Refresh page | New order persists |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-R02: Category create/edit/delete still works [HIGH]

**Pre-condition:** Admin, desktop tree view

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a new L1 category "UAT Test" | Created successfully |
| 2 | Edit it — change name to "UAT Test Renamed" | Name updated |
| 3 | Delete "UAT Test Renamed" (no children, no skills) | Deleted successfully |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-R03: Verify page still works [MEDIUM]

**Pre-condition:** None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open CLAIMED badge verify URL: `http://localhost:5173/verify/00000000-0000-4000-a000-000300000001` | Badge verification page shows: valid badge, recipient info, evidence if attached |
| 2 | Open REVOKED badge verify URL: `http://localhost:5173/verify/00000000-0000-4000-a000-000300000006` | Shows revoked status |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

#### UAT-S12.5-R04: Wallet view still works [MEDIUM]

**Pre-condition:** Logged in as Employee

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to My Wallet | Badge cards display correctly |
| 2 | Click a badge card | Badge detail shows correct info (template, status, skills, evidence) |

**Result:** ⬜ PASS / ⬜ FAIL — Notes: _______________

---

## 5. Test Summary

### Counts

| Category | CRITICAL | HIGH | MEDIUM | LOW | Total |
|----------|----------|------|--------|-----|-------|
| D-1: Responsive | — | 2 | 3 | 1 | 6 |
| D-2: Insertion Line | — | 2 | — | 1 | 3 |
| D-3: Move to... | 3 | 4 | 1 | 1 | 9 |
| D-4: evidenceUrl | — | 3 | 1 | — | 4 |
| Regression | — | 2 | 2 | — | 4 |
| **Total** | **3** | **13** | **7** | **3** | **26** |

### Results

| Priority | Total | PASS | FAIL | SKIP |
|----------|-------|------|------|------|
| CRITICAL | 3 | | | |
| HIGH | 13 | | | |
| MEDIUM | 7 | | | |
| LOW | 3 | | | |
| **Total** | **26** | | | |

### Sign-off

- [ ] All CRITICAL test cases PASS
- [ ] All HIGH test cases PASS
- [ ] No blocking bugs open
- Tester: _______________
- Date: _______________
- Verdict: ⬜ PASS / ⬜ FAIL

---

**Notes:**
- D-3 tests may modify seed data (moving categories). If re-running, reset DB first.
- System-defined categories cannot be moved — tests adjusted accordingly.
- D-4 (evidenceUrl removal) is a backend-only change; frontend regression tests confirm no visible impact.
