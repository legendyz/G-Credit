# G-Credit v1.0.0 — Re-UAT Round 2 Results Report

**Version:** 1.0  
**Tester:** LegendZhu (Product Owner)  
**Date:** 2026-02-11  
**Sprint:** 10  
**Story:** 10.7 (re-execution) + 10.8 (bug fixes)  
**Environment:** localhost:3000 (backend) + localhost:5173 (frontend)  
**Branch:** `sprint-10/v1-release`  
**Commit Range:** `729e4f0` (10.8 original fixes) → `f27d0b1` (HEAD)  
**Total Post-10.8 Commits:** 31 commits, 63 files changed, 1843 insertions, 324 deletions

---

## Executive Summary

| Metric | Round 1 (2026-02-10) | Round 2 (2026-02-11) | Delta |
|--------|---------------------|---------------------|-------|
| Total Test Cases | 35 | 35 | — |
| PASS | 2 (5.7%) | **33 (94.3%)** | +31 |
| PARTIAL | 7 (20.0%) | 0 (0%) | -7 |
| FAIL | 25 (71.4%) | 0 (0%) | -25 |
| SKIP | 1 (2.9%) | 2 (5.7%) | +1 |
| P0 Bugs | 4 | **0** | -4 |
| P1 Bugs | 3 | **0** | -3 |
| New Bugs Found | — | **0** | — |

**Verdict: ✅ UAT PASSED**

All 33 executable test cases passed. UAT-024 (embeddable widget) and UAT-035 (mobile responsive) skipped as OPTIONAL per the Re-UAT test plan. Zero new bugs discovered. The system meets all v1.0.0 release criteria.

---

## Re-UAT Round 2 Results

### Round A: 基础设施 + 认证 (7 cases)

| # | ID | 场景 | 类型 | Result | 备注 |
|---|-----|------|------|--------|------|
| 1 | UAT-001 | Health check | 🔁 RETEST | ✅ PASS | `http://localhost:3000/health` → `{"status":"ok"}` HTTP 200 |
| 2 | UAT-002 | API 文档 | 🔁 RETEST | ✅ PASS | `http://localhost:3000/api-docs` → Swagger UI loads correctly |
| 3 | UAT-003 | Admin 登录 Dashboard | 🔄 UPGRADE | ✅ PASS | Dashboard displays, nav highlights "Dashboard", separate "My Wallet" link present |
| 4 | UAT-004 | Employee 登录 | 🔄 UPGRADE | ✅ PASS | Dashboard shows, nav limited to Dashboard + My Wallet, no admin links |
| 5 | UAT-005 | 登出 | ✅ REGRESSION | ✅ PASS | Logout clears token, redirects to /login |
| 6 | UAT-006 | 修改密码 | 🔁 RETEST | ✅ PASS | Profile page at `/profile` with Change Password card, password change + re-login works |
| 7 | UAT-007 | RBAC 阻止 Employee | 🔄 UPGRADE | ✅ PASS | Employee accessing admin routes redirected to Dashboard |

**🚦 Gate A: ✅ PASS** — All 7 cases passed, proceed to Round B.

---

### Round B: Badge Template CRUD + 颁发 (8 cases)

| # | ID | 场景 | 类型 | Result | 备注 |
|---|-----|------|------|--------|------|
| 8 | UAT-008 | Admin 创建 DRAFT 模板 | 🔁 RETEST | ✅ PASS | BadgeTemplateFormPage: name/description/category/skills → saved as DRAFT, visible in list |
| 9 | UAT-009 | Admin 激活模板 | 🔁 RETEST | ✅ PASS | Status button Activate → ACTIVE, template available for issuance |
| 10 | UAT-010 | Admin 归档模板 | 🔁 RETEST | ✅ PASS | Archive → ARCHIVED, template no longer available for issuance |
| 11 | UAT-011 | 模板搜索 | 🔁 RETEST | ✅ PASS | Search input accepts typing (BUG-005 fixed), category tab filter works |
| 12 | UAT-012 | Issuer 颁发单个 Badge | 🔁 RETEST | ✅ PASS | Template dropdown populated, recipient dropdown loads user list (BUG-004 fixed), issuance succeeds |
| 13 | UAT-013 | 颁发后 Badge 状态 PENDING | 🔁 RETEST | ✅ PASS | Badge Management shows PENDING status |
| 14 | UAT-014 | Employee 认领 Badge | 🔁 RETEST | ✅ PASS | Claim badge from Wallet + email claim link both work |
| 15 | UAT-015 | OB 2.0 Assertion 格式 | 🔁 RETEST | ✅ PASS | `/api/verification/{id}/assertion` returns valid JSON-LD with `@context` and `type: "Assertion"` |

**🚦 Gate B: ✅ PASS** — All 8 cases passed, proceed to Round C.

---

### Round C: Wallet + 验证 + 分享 + 批量 + 撤销 (15 cases)

| # | ID | 场景 | 类型 | Result | 备注 |
|---|-----|------|------|--------|------|
| 16 | UAT-016 | Employee Wallet 时间线 | 🔁 RETEST | ✅ PASS | My Wallet → `/wallet`, timeline displays correctly |
| 17 | UAT-017 | Badge 详情 Modal | 🔁 RETEST | ✅ PASS | Badge card click opens detail modal with full info |
| 18 | UAT-018 | Evidence 文件查看 | 🔁 RETEST | ✅ PASS | Evidence file links open correctly, metadata encoding fixed |
| 19 | UAT-019 | 公开验证页面 | 🔁 RETEST | ✅ PASS | `/verify/{verificationId}` loads without login, badge info displayed |
| 20 | UAT-020 | Baked Badge PNG 下载 | 🔁 RETEST | ✅ PASS | Download PNG succeeds, consistent blue button style |
| 21 | UAT-021 | JSON-LD Assertion API | 🔁 RETEST | ✅ PASS | Valid JSON-LD response |
| 22 | UAT-022 | Email 分享 Badge | 🔁 RETEST | ✅ PASS | Share via email succeeds, share event recorded |
| 23 | UAT-023 | 分享 Analytics 记录 | 🔁 RETEST | ✅ PASS | Admin Analytics shows share events in AuditLog |
| 24 | UAT-024 | 嵌入式 Widget HTML | ⏭️ OPTIONAL | ⏭️ SKIP | Requires live server — deferred to Post-MVP |
| 25 | UAT-025 | 下载 CSV 模板 | 🔄 UPGRADE | ✅ PASS | CSV pre-fills templateId (UX-001 fixed), copy-to-clipboard available |
| 26 | UAT-026 | 上传 CSV + 确认 | 🔁 RETEST | ✅ PASS | First upload succeeds immediately (BUG-008 P2028 timeout fixed) |
| 27 | UAT-027 | 上传无效 CSV 报错 | 🔄 UPGRADE | ✅ PASS | Valid rows shown as "X of Y", partial confirm available (UX-002 fixed) |
| 28 | UAT-028 | Manager 撤销 Badge | 🔁 RETEST | ✅ PASS | Manager sees Badge Management, can revoke same-department badges, department editing works |
| 29 | UAT-029 | 撤销后验证页面 | 🔁 RETEST | ✅ PASS | `/verify/{id}` shows REVOKED status with date and reason |
| 30 | UAT-030 | 撤销后 Wallet 显示 | 🔁 RETEST | ✅ PASS | Revoked badge grey in Wallet, share disabled |

---

### Round D: 全生命周期 + 移动端 + Dashboard (5 cases)

| # | ID | 场景 | 类型 | Result | 备注 |
|---|-----|------|------|--------|------|
| 31 | UAT-031 | Admin Dashboard 统计 | 🔄 UPGRADE | ✅ PASS | All summary cards clickable with navigation (UX-003 fixed) |
| 32 | UAT-032 | Badge 搜索 | 🔁 RETEST | ✅ PASS | Search input accepts typing, filter works correctly (BUG-005 fixed) |
| 33 | UAT-033 | Admin 用户管理 | ✅ REGRESSION | ✅ PASS | User list + role change + department editing functional |
| 34 | UAT-034 | 完整生命周期 | 🔁 RETEST | ✅ PASS | Full lifecycle: Create ACTIVE template → Issue → Claim → Share → Revoke → Verify REVOKED |
| 35 | UAT-035 | 移动端全流程 | ⏭️ OPTIONAL | ⏭️ SKIP | Deferred — not v1.0.0 release requirement |

---

## Summary

| Metric | Value |
|--------|-------|
| Total Test Cases | 35 |
| **PASS** | **33 (94.3%)** |
| PARTIAL | 0 (0%) |
| FAIL | 0 (0%) |
| SKIP | 2 (5.7%) — UAT-024 (embed), UAT-035 (mobile) |
| New Bugs Discovered | **0** |
| UX Issues Remaining | **0** (all 3 resolved: UX-001, UX-002, UX-003) |

---

## Bug Fix Verification Status

All 7 original bugs confirmed fixed in Round 2:

| Bug ID | Severity | Status | Fix Commits |
|--------|----------|--------|-------------|
| BUG-002 | P0 | ✅ Fixed | Nav links restructured — Dashboard + My Wallet separated |
| BUG-003 | P0 | ✅ Fixed | BadgeTemplateListPage + BadgeTemplateFormPage built |
| BUG-004 | P0 | ✅ Fixed | `/badges/recipients` endpoint + IssueBadgePage updated |
| BUG-005 | P0 | ✅ Fixed | SearchInput controlled mode with `internalValue` |
| BUG-006 | P1 | ✅ Fixed | MANAGER role in route guards + department check |
| BUG-007 | P1 | ✅ Fixed | ProfilePage with password change |
| BUG-008 | P1 | ✅ Fixed | Prisma transaction timeout 30s + maxWait 10s |

---

## Additional Fixes During Re-UAT Round 2

During Round 2 testing, 12 additional improvements were made in real time (commits `729e4f0` → `f27d0b1`):

| # | Fix | Commit | Category |
|---|-----|--------|----------|
| 1 | Verify page data mapping from `_meta` | `c1bd598` | UAT-015 fix |
| 2 | VerificationSection uses `verificationId` for verify URL | `3b7a3a3` | UAT-015 fix |
| 3 | Evidence files UI — padding, cursor, download URL | `c7650ca` | UAT-018 fix |
| 4 | Azure credentials parse from connection string | `b2119ea` | UAT-018 fix |
| 5 | Fix garbled Unicode separator in evidence metadata | `c60ed78` | UAT-018 fix |
| 6 | Unify Download PNG button to blue style | `8eb53c9` | UI polish |
| 7 | Convert UAT seed IDs to valid UUID v4 | `34b6be7` | Seed data fix |
| 8 | Increase global rate limit 10→60 req/min | `7cb6830` | Throttle fix |
| 9 | Record badge share events in AuditLog | `7b68912` | UAT-023 feature |
| 10 | Analytics refresh button + category nameEn | `1f2fa07` | Analytics polish |
| 11 | Add `/claim` page for email badge claiming | `2c62c77` | UAT-014 fix |
| 12 | Add department editing for users | `a442030` | UAT-028 support |

**Session commits (this round):**

| Commit | Description |
|--------|-------------|
| `3d60511` | Re-UAT Round 2: UI fixes + session validation on startup (11 files) |
| `f27d0b1` | Add User Management nav link for Admin role (Navbar + MobileNav) |

---

## Passing Criteria Verification

Per Re-UAT Test Plan Section 5:

| Criterion | Required | Actual | Met? |
|-----------|----------|--------|------|
| PASS count | ≥ 30/33 | 33/33 | ✅ |
| FAIL count | = 0 | 0 | ✅ |
| PARTIAL | ≤ 3 | 0 | ✅ |
| SKIP | UAT-024 + UAT-035 only | UAT-024 + UAT-035 | ✅ |
| P0 bugs unfixed | Not allowed | 0 | ✅ |
| P1 bugs unfixed | Not allowed | 0 | ✅ |
| New P0/P1 bugs | Not allowed | 0 | ✅ |

**All criteria met. UAT PASSED.**

---

## Known Limitations (Unchanged)

Per `uat-known-limitations.md` — 5 known limitations accepted for v1.0.0:

1. **LIM-001:** Teams Channel Notifications require tenant admin approval
2. **LIM-002:** Badge issuance limited to registered users
3. **LIM-003:** ~~Navbar link error~~ — **RESOLVED** (BUG-002 fixed)
4. **LIM-004:** Bulk issuance max 20 badges per batch (sync processing)
5. **LIM-005:** Email sharing has no domain restriction (by design)

---

## Post-MVP Items Identified During UAT

| ID | Description | Priority |
|----|-------------|----------|
| FEAT-004 | Multi-role / permission-based role model | P2 |
| FEAT-006 | Additional Dashboard analytics & trend charts | P3 |
| FEAT-007 | Session management: idle timeout + 401 auto-refresh | P2 |
| FEAT-008 | Comprehensive user management (add user, M365 sync UI, self-registration) | P1 |

---

## Verdict

### ✅ UAT PASSED — v1.0.0 Release Approved

G-Credit v1.0.0 has successfully completed User Acceptance Testing. All 33 executable test cases passed with zero failures and zero new bugs. The system successfully demonstrates the full badge lifecycle across all user roles (Admin, Issuer, Manager, Employee).

---

## Sign-Off

| Role | Name | Date | Result |
|------|------|------|--------|
| Tester / PO | LegendZhu | 2026-02-11 | ✅ PASSED |
| Scrum Master | Bob (SM Agent) | 2026-02-11 | ✅ PASSED |
| Product Owner | LegendZhu | 2026-02-11 | ✅ Approved for Release |
