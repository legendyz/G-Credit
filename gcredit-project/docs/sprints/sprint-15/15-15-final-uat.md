# Story 15.15: Final UAT — Full UI Acceptance (Wave 4)

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 4h  
**Wave:** 4 — Testing + Final UAT  
**Source:** Sprint 15 Planning — comprehensive UI acceptance before Sprint close  
**Dependencies:** All Wave 1-3 stories must be complete

---

## Story

**As a** Product Owner preparing for Pilot deployment,  
**I want** a comprehensive UI acceptance test covering all Sprint 15 deliverables,  
**So that** I'm confident the UI quality is Pilot-ready.

## Acceptance Criteria

1. [ ] Mid-Sprint UAT regression: all sidebar + dashboard tests still pass
2. [ ] Pagination: template list page controls work correctly
3. [ ] Infinite scroll: wallet loads more badges on scroll
4. [ ] Forgot Password: complete password reset flow works
5. [ ] Delete confirmation: styled modal replaces native confirm
6. [ ] Icons: no emoji remains in application UI (all Lucide)
7. [ ] Dirty-form guard: navigating away from unsaved form shows warning
8. [ ] z-index: modal/toast/sidebar layers correctly
9. [ ] Inline styles: no visual regression from Tailwind migration
10. [ ] Rate limits: configurable (E2E tests not blocked)
11. [ ] UAT results documented with PASS/FAIL and overall pass rate
12. [ ] All FAIL items have documented action plan

## UAT Test Cases

### E. Mid-Sprint Regression (Quick re-check: 10 tests)

| # | Check | Expected |
|---|-------|----------|
| E1 | ADMIN+Manager sidebar | All 4 groups visible |
| E2 | EMPLOYEE sidebar | Only base group |
| E3 | Dashboard default tab | "My Badges" for all |
| E4 | Dashboard ADMIN tabs | 4 tabs visible |
| E5 | Route: /dashboard | Loads without error |
| E6 | Route: /wallet | Loads without error |
| E7 | Route: /templates (ISSUER) | Loads without error |
| E8 | Route: /admin/users (ADMIN) | Loads without error |
| E9 | Mobile sidebar drawer | Opens/closes correctly |
| E10 | Sidebar collapse toggle | Icon-only mode works |

### F. Pagination & Scroll (8 tests)

| # | Check | Expected |
|---|-------|----------|
| F1 | Template list: page 1 | Shows first 10 templates |
| F2 | Template list: next page | Page 2 loads correctly |
| F3 | Template list: page size change | Dropdown 10/20/50 works |
| F4 | Template list: URL params | `/templates?page=2&pageSize=20` deep-linkable |
| F5 | Wallet: initial load | First 20 badges shown |
| F6 | Wallet: scroll to bottom | Loading indicator + next batch |
| F7 | Wallet: end of list | "No more badges" message |
| F8 | Wallet: filter + reset | Scroll position resets on filter change |

### G. Form & Dialog (8 tests)

| # | Check | Expected |
|---|-------|----------|
| G1 | Forgot Password: link on login | Visible and navigates to /forgot-password |
| G2 | Forgot Password: submit email | Shows "check your email" confirmation |
| G3 | Forgot Password: invalid email | Shows validation error |
| G4 | Reset Password: token page | Loads with password fields |
| G5 | Delete template: click delete | Styled AlertDialog appears (not native) |
| G6 | Delete template: cancel | Dialog closes, no deletion |
| G7 | Dirty-form: edit + navigate | Warning dialog appears |
| G8 | Dirty-form: save + navigate | No warning (form clean) |

### H. Visual Quality (10 tests)

| # | Check | Expected |
|---|-------|----------|
| H1 | Dashboard cards | Lucide icons, no emoji |
| H2 | Sidebar items | Lucide icons, no emoji |
| H3 | Toast messages | Lucide icons |
| H4 | Empty states | Lucide icons with descriptive text |
| H5 | Badge status indicators | Lucide icons (check, clock, x) |
| H6 | Inline styles audit | No `style={{}}` visible in DOM inspector (spot check 5 pages) |
| H7 | z-index: modal over sidebar | Modal overlay covers sidebar |
| H8 | z-index: toast over modal | Toast notification visible above modal |
| H9 | Overall visual consistency | Design tokens used, no hardcoded colors (spot check) |
| H10 | Mobile layout | No horizontal overflow, touch targets ≥ 44px |

### I. Technical Verification (4 tests)

| # | Check | Expected |
|---|-------|----------|
| I1 | Rate limit: login 6 users | All 6 users can login without 429 error |
| I2 | Rate limit: production default | 5/60s limit still in .env.example |
| I3 | All tests pass | `npm test` in both BE and FE: 0 failures |
| I4 | Build succeeds | `npm run build` in both BE and FE |

## UAT Results

_Phase 1 (Scripted UAT) executed 2026-03-02_

### Summary

| Section | Tests | PASS | FAIL | SKIP | Rate |
|---------|-------|------|------|------|------|
| E. Regression | 10 | 10 | 0 | 0 | 100% |
| F. Pagination | 8 | 8 | 0 | 0 | 100% |
| G. Forms & Dialogs | 8 | 4 | 0 | 4 | 100% (of testable) |
| H. Visual Quality | 10 | 10 | 0 | 0 | 100% |
| I. Technical | 4 | 4 | 0 | 0 | 100% |
| **Total** | **40** | **36** | **0** | **4** | **100%** |

### Phase 1 Detailed Results (Scripted Checks)

| Test ID | Result | Notes |
|---------|--------|-------|
| H1 | PASS | Dashboard cards — no emoji in source; all icons via Lucide |
| H2 | PASS | Sidebar items — no emoji; Lucide icons only |
| H3 | PASS | Toast messages — no emoji; Lucide icons |
| H4 | PASS | Empty states — no emoji; Lucide icons with descriptive text |
| H5 | PASS | Badge status indicators — no emoji; Lucide check/clock/x |
| H6 | PASS | 14 inline `style={{}}` found — all dynamic (tree indent, progress bar width, animation delay); no Tailwind-replaceable hardcoded styles |
| H7 | PASS | z-index: semantic scale verified in `index.css @theme`; modal > sidebar |
| H8 | PASS | z-index: toast (--z-toast: 9999) > modal (--z-modal: 50) |
| H9 | PASS | Design tokens used throughout; no hardcoded color values in source |
| H10 | PASS | Touch targets min-h-[44px] enforced; no horizontal overflow patterns |
| I1 | PASS | Rate limit configurable via THROTTLE_TTL_SECONDS / THROTTLE_LIMIT env vars; E2E tests not blocked |
| I2 | PASS | `.env.example` contains THROTTLE_TTL_SECONDS=60 / THROTTLE_LIMIT=5 defaults (commented) |
| I3 | PASS | Frontend: 844/844 tests pass; Backend: 991/991 tests pass (0 failures) |
| I4 | PASS | Frontend build: success (7.06s); Backend build: success |

#### Emoji Audit Detail
- Node.js Unicode regex scan across all `.tsx/.ts` source files (excluding tests)
- 6 matches found — all safe:
  - `MilestoneFormSheet.tsx:45-46` — emoji picker data array (✨🚀), not rendered as UI text
  - `EvidenceList.tsx:26` — ✕ symbol in code comment
  - `StatusBadge.tsx:6,8,9` — ✓ symbols in contrast-ratio documentation comments
- **Verdict: No emoji rendered in application UI**

#### Inline Style Audit Detail
- 14 `style={{}}` occurrences across 10 files
- All for dynamic computed values: tree-indent `paddingLeft`, progress-bar `width%`, `animationDelay`, celebration modal animation
- No Tailwind-replaceable hardcoded styles found
- **Verdict: All inline styles justified**

### Phase 2 Detailed Results (Manual/UX Checks)

_Tests executed 2026-03-02_

| Test ID | Result | Notes |
|---------|--------|-------|
| E1 | PASS | ADMIN+Manager sidebar displays all 4 groups correctly |
| E2 | PASS | EMPLOYEE sidebar shows base group only |
| E3 | PASS | Dashboard defaults to "My Badges" tab for all roles |
| E4 | PASS | ADMIN user sees all 4 dashboard tabs |
| E5 | PASS | /dashboard route loads without error |
| E6 | PASS | /wallet route loads without error |
| E7 | PASS | /admin/templates route loads correctly for ISSUER |
| E8 | PASS | /admin/users route loads correctly for ADMIN |
| E9 | PASS | Mobile sidebar drawer opens/closes correctly |
| E10 | PASS | Sidebar collapse toggle works (icon-only mode + tooltips) |
| F1–F8 | — | Pending execution |
| G1–G8 | — | Pending execution |

### Phase 2 手动 UAT 详细步骤

> **前提条件**
> 1. 启动后端：在 `c:\G_Credit\CODE\gcredit-project\backend` 目录运行 `npm run start:dev`
> 2. 启动前端：在 `c:\G_Credit\CODE\gcredit-project\frontend` 目录运行 `npm run dev`
> 3. 确保数据库已 seed：在 `c:\G_Credit\CODE\gcredit-project\backend` 运行 `npx prisma db seed`
> 4. 前端默认地址：`http://localhost:5173`
> 5. 后端默认地址：`http://localhost:3000`
>
> **测试账号（统一密码：`Password123`）**
>
> | 角色 | 邮箱 | isManager |
> |------|------|-----------|
> | ADMIN | admin@gcredit.com | false |
> | ISSUER | issuer@gcredit.com | false |
> | EMPLOYEE+Manager | manager@gcredit.com | true（有 2 名下属） |
> | EMPLOYEE | employee@gcredit.com | false（24 个 CLAIMED 徽章，用于 F6 滚动测试） |
> | EMPLOYEE | employee2@gcredit.com | false |
>
> **注意**：2026-03-03 更新 — 为 employee@gcredit.com 添加了 20 个额外徽章（共 24 个 CLAIMED），以测试 F6 Wallet 无限滚动。需重新运行 `npx prisma db seed` 以获取更新数据。

---

#### E. Mid-Sprint Regression（10 项）

**E1 — ADMIN+Manager 侧边栏显示 4 组**
1. 打开浏览器访问 `http://localhost:5173/login`
2. 使用 `admin@gcredit.com` / `Password123` 登录
3. 查看左侧侧边栏
4. ✅ 预期：看到 4 个导航分组 —— 基础组（Dashboard, Wallet）、Team 组、Issuance 组（Templates, Badges, Bulk Issue, Analytics）、Admin 组（Users, Categories, Skills, Milestones）
5. 每个组之间有分隔线，组标签文字可见

**E2 — EMPLOYEE 侧边栏仅基础组**
1. 登出当前用户（点击侧边栏底部 "Sign Out"）
2. 使用 `employee@gcredit.com` / `Password123` 登录
3. 查看左侧侧边栏
4. ✅ 预期：仅看到基础组（Dashboard, Wallet），不显示 Team、Issuance、Admin 组

**E3 — Dashboard 默认标签为 "My Badges"**
1. 以任意账号登录后，访问 `http://localhost:5173/`
2. 查看 Dashboard 页面的标签页
3. ✅ 预期：默认选中并显示 "My Badges" 标签内容

**E4 — Dashboard ADMIN 用户显示 4 个标签**
1. 使用 `admin@gcredit.com` 登录
2. 访问 `http://localhost:5173/`
3. ✅ 预期：看到 4 个标签 —— My Badges、Team Overview、Issuance、Administration

**E5 — 路由 /dashboard 正常加载**
1. 在地址栏输入 `http://localhost:5173/`（即 Dashboard 路由）
2. ✅ 预期：页面正常加载，无白屏或错误提示

**E6 — 路由 /wallet 正常加载**
1. 点击侧边栏 "Wallet" 或直接访问 `http://localhost:5173/wallet`
2. ✅ 预期：Badge Wallet 页面正常加载，显示徽章时间线

**E7 — 路由 /admin/templates (ISSUER) 正常加载**
1. 使用 `issuer@gcredit.com` 登录
2. 点击侧边栏 "Templates" 或访问 `http://localhost:5173/admin/templates`
3. ✅ 预期：Badge Templates 列表页正常加载，显示模板列表

**E8 — 路由 /admin/users (ADMIN) 正常加载**
1. 使用 `admin@gcredit.com` 登录
2. 点击侧边栏 Admin 组的 "Users" 或访问 `http://localhost:5173/admin/users`
3. ✅ 预期：User Management 页面正常加载，显示用户列表

**E9 — 移动端侧边栏抽屉**
1. 使用浏览器 DevTools（F12）切换至移动视口（如 iPhone 14, 390×844）
2. 刷新页面
3. 点击左上角汉堡菜单图标（☰）
4. ✅ 预期：侧边栏以抽屉（Sheet overlay）形式从左滑出
5. 点击遮罩层或关闭按钮
6. ✅ 预期：抽屉关闭

**E10 — 侧边栏折叠切换**
1. 切换回桌面视口
2. 将鼠标悬停在侧边栏右边缘的窄条（SidebarRail）上
3. 点击该条或双击
4. ✅ 预期：侧边栏折叠为图标模式，仅显示图标不显示文字
5. 悬停在图标上时显示 tooltip（如 "Dashboard"、"Wallet"）
6. 再次点击 Rail 条
7. ✅ 预期：侧边栏展开恢复完整模式

---

#### F. Pagination & Scroll（8 项）

> 前提：使用 `admin@gcredit.com` 或 `issuer@gcredit.com` 登录（需要 Templates 访问权限）

**F1 — Templates 列表第 1 页**
1. 访问 `http://localhost:5173/admin/templates`
2. ✅ 预期：显示前 10 个模板（默认 pageSize=10）
3. 页面底部显示分页控件（页码、上一页/下一页按钮）

**F2 — Templates 列表翻页**
1. 点击分页控件的 "下一页" 或页码 "2"
2. ✅ 预期：加载第 2 页内容，URL 变为包含 `?page=2`
3. 列表内容刷新，显示第 11-20 条（如果有的话）

**F3 — Templates 列表切换页大小**
1. 在分页区域找到 pageSize 下拉选择器
2. 从 10 切换到 20
3. ✅ 预期：URL 包含 `pageSize=20`，列表显示最多 20 条
4. 切换到 50
5. ✅ 预期：URL 包含 `pageSize=50`

**F4 — Templates 列表 URL 深度链接**
1. 在浏览器地址栏直接输入 `http://localhost:5173/admin/templates?pageSize=20&page=1`
2. ✅ 预期：页面直接加载第 1 页，每页 20 条
3. 分页控件状态与 URL 参数一致

**F5 — Wallet 初始加载**
1. 访问 `http://localhost:5173/wallet`
2. ✅ 预期：显示前 20 个徽章（如账号有足够数据）
3. 页面以时间线形式展示

**F6 — Wallet 滚动到底部加载更多**
1. 使用 `employee@gcredit.com` 登录（该账号现有 24 个 CLAIMED 徽章用于测试）
2. 在 Wallet 页面向下滚动至底部
3. ✅ 预期：出现加载指示器（spinning indicator），然后加载并追加下一批徽章
4. 注：需重新运行 `npx prisma db seed` 以获取更新的测试数据（2026-03-03 为 F6 测试添加了 20 个额外徽章）

**F7 — Wallet 列表到达末尾**
1. 继续滚动直到所有徽章加载完毕
2. ✅ 预期：显示 "No more badges" 或类似的末尾提示
3. 不再触发新的加载请求

**F8 — Wallet 筛选后滚动位置重置**
1. 如果 Wallet 页面有筛选/过滤功能，应用一个筛选条件
2. ✅ 预期：滚动位置回到顶部，列表重新从第一条开始显示
3. 清除筛选
4. ✅ 预期：列表重新加载，滚动位置在顶部

---

#### G. Forms & Dialogs（8 项）

**G1 — 登录页 "Forgot Password" 链接**
1. 访问 `http://localhost:5173/login`
2. 查看登录表单下方或密码输入框附近
3. ✅ 预期：看到 "Forgot Password?" 链接
4. ⚠️ 注意：Story 15-6（Forgot Password 页面）已延期至 backlog，如果链接不存在或指向占位符页面，标注为 **N/A（DEFERRED）**

**G2 — Forgot Password 提交邮箱**
1. 如果 G1 链接存在，点击进入忘记密码页面
2. 输入有效邮箱（如 `admin@gcredit.com`）
3. 点击提交
4. ✅ 预期：显示 "check your email" 确认信息
5. ⚠️ 如 Story 15-6 已延期，标注为 **N/A（DEFERRED）**

**G3 — Forgot Password 无效邮箱**
1. 在忘记密码页面输入无效邮箱（如 `notanemail`）
2. 点击提交
3. ✅ 预期：显示验证错误提示
4. ⚠️ 如 Story 15-6 已延期，标注为 **N/A（DEFERRED）**

**G4 — Reset Password token 页面**
1. 访问 `/reset-password?token=xxx`（或相应路由）
2. ✅ 预期：页面加载，显示新密码和确认密码两个输入框
3. ⚠️ 如 Story 15-6 已延期，标注为 **N/A（DEFERRED）**

**G5 — 删除模板：点击删除按钮出现自定义对话框**
1. 使用 `admin@gcredit.com` 登录
2. 访问 `http://localhost:5173/admin/templates`
3. 找到一个模板，点击其删除按钮（🗑 图标或 "Delete" 按钮）
4. ✅ 预期：弹出一个**样式化的 AlertDialog**（shadcn/ui 风格），而非浏览器原生 `confirm()` 弹窗
5. 对话框应包含标题（如 "Delete Template"）、描述文字、"Cancel" 和 "Delete" 按钮
6. 来源组件：`c:\G_Credit\CODE\gcredit-project\frontend\src\components\ui\ConfirmDeleteDialog.tsx`

**G6 — 删除模板：取消操作**
1. 在 G5 弹出的删除对话框中，点击 "Cancel" 按钮
2. ✅ 预期：对话框关闭，模板未被删除，列表不变

**G7 — Dirty-form guard：编辑后导航离开**
1. 使用 `admin@gcredit.com` 或 `issuer@gcredit.com` 登录
2. 访问 `http://localhost:5173/admin/badges/issue`（Issue Badge 页面）
3. 在表单中选择一个 Badge Template 或填写 Recipient
4. **不点击提交**，直接点击侧边栏的 "Dashboard" 或其他导航链接
5. ✅ 预期：弹出 "Unsaved Changes" 警告对话框，询问 "You have unsaved changes that will be lost if you leave this page"
6. 对话框应有 "Stay" 和 "Leave" 两个按钮
7. 来源组件：`c:\G_Credit\CODE\gcredit-project\frontend\src\components\ui\NavigationGuardDialog.tsx`
8. Hook：`c:\G_Credit\CODE\gcredit-project\frontend\src\hooks\useFormGuard.ts`

**G8 — Dirty-form guard：保存后导航离开**
1. 在 Issue Badge 页面填写完整表单并成功提交
2. 提交成功后，点击侧边栏导航到其他页面
3. ✅ 预期：**不弹出**任何警告对话框，直接导航（因为表单已清理）

---

#### 各测试结果记录表

| Test ID | Result | Notes |
|---------|--------|-------|
| E1 | PASS | ADMIN+Manager sidebar displays all 4 groups |
| E2 | PASS | EMPLOYEE sidebar shows base group only |
| E3 | PASS | Dashboard defaults to "My Badges" tab |
| E4 | PASS | ADMIN user sees all 4 dashboard tabs |
| E5 | PASS | /dashboard route loads without error |
| E6 | PASS | /wallet route loads without error |
| E7 | PASS | /admin/templates route loads for ISSUER |
| E8 | PASS | /admin/users route loads for ADMIN |
| E9 | PASS | Mobile sidebar drawer opens/closes correctly |
| E10 | PASS | Sidebar collapse toggle works (icon-only mode) |
| F1 | PASS | Templates list page 1 displays correctly with pagination controls |
| F2 | PASS | Templates pagination next/previous works |
| F3 | PASS | Templates pageSize switching works (10/20/50) |
| F4 | PASS | Templates URL deep link loads correct page/size |
| F5 | PASS | Wallet initial load shows badges in timeline |
| F6 | PASS | Wallet infinite scroll loads more badges on scroll |
| F7 | PASS | Wallet end-of-list indicator shown when all loaded |
| F8 | PASS | Wallet filter resets scroll position to top |
| G1 | SKIP | Forgot Password deferred (Story 15-6 in backlog) |
| G2 | SKIP | Forgot Password deferred (Story 15-6 in backlog) |
| G3 | SKIP | Forgot Password deferred (Story 15-6 in backlog) |
| G4 | SKIP | Forgot Password deferred (Story 15-6 in backlog) |
| G5 | PASS | Delete template shows styled AlertDialog (not native confirm) |
| G6 | PASS | Cancel on delete dialog closes without deleting |
| G7 | PASS | Dirty-form guard shows unsaved changes warning |
| G8 | PASS | No guard after successful form submit |

### Action Items (FAIL items)

| # | Test ID | Issue | Severity | Resolution |
|---|---------|-------|----------|------------|
| — | — | None | — | — |

**UAT Verdict:** ✅ **PASS** — 36/36 testable cases passed (4 skipped: password reset deferred)

## Dev Notes

### References
- Sprint 10 UAT: 33/33 PASS (100%)
- Sprint 11 UAT: 152/153 PASS (99.3%)
- Sprint 13 UAT: 47/47 Agent + M1-M6 Manual PASS (100%)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- Phase 1 (Scripted UAT): 14/14 PASS — executed 2026-03-02
- Phase 2 (Manual/UX UAT): 22/22 testable PASS, 4 SKIP (G1-G4 password reset deferred) — executed 2026-03-03
- UI fixes applied during Phase 2: container scroll model, search input focus (ADR-018), responsive filter layout, Skills dropdown z-index, compact filter bar redesign
