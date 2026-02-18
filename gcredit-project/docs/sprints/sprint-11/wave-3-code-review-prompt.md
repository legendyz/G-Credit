# Wave 3 Code Review Prompt

**Sprint:** 11 — Security & Quality Hardening  
**Wave:** 3 of 5 — Core Features  
**Branch:** `sprint-11/security-quality-hardening`  
**Commits:** `784d92c..a4b81df` (2 commits: 1 feature + 1 fix)  
**Changed Files:** 27 files, +1039 / -15 lines  
**Dev Test Results:** Awaiting SM verification

---

## 📋 Review Scope

请对 Wave 3 的以下 4 个 Core Feature Story 实现做 Code Review。

| Story | 标题 | 改动范围 |
|-------|------|---------|
| 11.4 | Badge Visibility Toggle (PUBLIC/PRIVATE) | Prisma migration + enum, badge-issuance controller/service, badge-verification.service, BadgeTimelineCard, BadgeDetailModal, ClaimSuccessModal, useWallet hook, badge.ts types |
| 11.5 | LinkedIn Share Tab | BadgeShareModal (type + TABS + tab button + panel), badgeShareApi.ts, badge-analytics.controller, badge-analytics.service, index.html OG tags, gcredit-og-image.png |
| 11.18 | Skill UUID→Name | badge-verification.service.ts (skill resolution), VerifyBadgePage.tsx (render name), badge.ts (type change) |
| 11.19 | 403 Access Denied Page | AccessDeniedPage.tsx (new), App.tsx (route), ProtectedRoute.tsx (redirect) |

**Commits:**
- `2d73407` — Main feature implementation (all 4 stories)
- `a4b81df` — Fix: replace `as any` casts with `BadgeVisibility` enum in visibility tests

---

## 📐 Review 参考文档

1. **实现规格:** `sprint-11/wave-3-dev-prompt.md` — 每个 Story 的修改位置、方案、验收标准
2. **验收标准:** `sprint-11/backlog.md` 中 Story 11.4, 11.5, 11.18, 11.19 的 Key Deliverables
3. **架构条件:** `sprint-11/arch-review-result.md` — C-3 (PRIVATE badge OB assertion 仍可访问, 方案B), §3 Badge Visibility DB 方案
4. **UX 条件:** `sprint-11/ux-review-result.md` — §1 Badge Visibility (双入口 toggle, 默认 PUBLIC, ClaimSuccessModal 提示), §2 LinkedIn (tab 排序, SVG #0A66C2, "✓ opened" 5s), §3 AccessDenied (ShieldAlert, 显示当前角色不显示所需角色, 双按钮)

---

## ✅ Review Checklist（逐 Story）

### Story 11.4: Badge Visibility Toggle (PUBLIC/PRIVATE) — 4-6h

#### 数据库层
- [ ] Prisma enum `BadgeVisibility { PUBLIC, PRIVATE }` 已创建
- [ ] `Badge` model 新增 `visibility BadgeVisibility @default(PUBLIC)`
- [ ] Migration SQL: `CREATE TYPE "BadgeVisibility"`, `ALTER TABLE "badges" ADD COLUMN "visibility"`, `DEFAULT 'PUBLIC'`
- [ ] 复合索引 `[visibility, status]` 和 `[recipientId, visibility]` 已添加
- [ ] `@default(PUBLIC)` 确保已有数据向后兼容

#### 后端 API
- [ ] `UpdateBadgeVisibilityDto` 创建：`@IsEnum(BadgeVisibility)` 验证
- [ ] `PATCH /badges/:id/visibility` 端点存在，带 Swagger 注解
- [ ] Controller 使用 `req.user.userId`（非 `req.user.id`），与项目 JWT payload 一致
- [ ] Service `updateVisibility()` 实现：findUnique → owner check → update
- [ ] 非 owner 抛 `ForbiddenException`，badge 不存在抛 `NotFoundException`
- [ ] `getWalletBadges()` 和 `getIssuedBadges()` 返回数据中包含 `visibility` 字段

#### 架构条件 C-3（⚠️ 重点审查）
- [ ] **验证页** (`badge-verification.service.ts`)：PRIVATE badge 返回 `null`（等效 404），✅ 正确
- [ ] **OB Assertion 端点** (`GET /api/badges/:id/assertion`)：**未添加** visibility 检查 → PRIVATE badge 的 assertion 仍可访问 ✅ 符合方案B
- [ ] 验证日志记录 `BADGE_VERIFICATION_BLOCKED` + `PRIVATE_VISIBILITY` reason

#### 前端 — BadgeTimelineCard（主入口 toggle）
- [ ] Visibility toggle button 存在，带 `aria-label` 和 `title`
- [ ] PUBLIC → Globe/🌐 图标, PRIVATE → Lock/🔒 图标
- [ ] 点击后 PATCH 切换 + `toast.success`/`toast.error` 反馈
- [ ] Toggle 中 loading spinner 防止重复点击（`isToggling` state）
- [ ] `e.stopPropagation()` 防止冒泡到卡片点击事件
- [ ] 使用 `apiFetch`（httpOnly cookie 自动携带）
- [ ] 本地 state `localVisibility` 即时更新（无需页面刷新）
- [ ] Touch target ≥ 44×44px（`min-w-[44px] min-h-[44px]`）

#### 前端 — BadgeDetailModal（确认入口 toggle）
- [ ] Modal footer 区域有 "Visibility: Public/Private" 切换控件
- [ ] 同样的 PATCH 逻辑 + toast 反馈
- [ ] `localVisibility` state 从 `badge.visibility ?? 'PUBLIC'` 初始化

#### 前端 — ClaimSuccessModal（提示）
- [ ] 添加文字 "Your badge is publicly visible. You can change this anytime from your wallet."
- [ ] 放置在 congratulations 文字和 action buttons 之间

#### 前端类型
- [ ] `BadgeDetail` interface 添加 `visibility: 'PUBLIC' | 'PRIVATE'`
- [ ] `useWallet` hook `Badge` interface 添加 `visibility?: 'PUBLIC' | 'PRIVATE'`

#### 测试
- [ ] `badge-issuance-visibility.service.spec.ts`：正常切换、non-owner 拒绝、badge 不存在
- [ ] `badge-verification.service.spec.ts`：PRIVATE badge 返回 null、PUBLIC badge 正常返回
- [ ] `BadgeTimelineCard.test.tsx`：PUBLIC/PRIVATE/undefined 三态渲染
- [ ] `ClaimSuccessModal.test.tsx`：visibility 提示文字存在

---

### Story 11.5: LinkedIn Share Tab — 3-4h

#### Tab 结构
- [ ] `ShareTab` type 扩展为 `'email' | 'linkedin' | 'teams' | 'widget'`
- [ ] `TABS` 数组顺序：`['email', 'linkedin', 'teams', 'widget']`（LinkedIn 第二位）
- [ ] LinkedIn tab button 带 `role="tab"`, `aria-selected`, `aria-controls`, `tabIndex`
- [ ] Tab button 图标使用 LinkedIn SVG（`fill="#0A66C2"`），不使用 emoji
- [ ] Keyboard navigation（ArrowLeft/ArrowRight）支持 4 tabs

#### LinkedIn Tab Panel
- [ ] Share Preview 区域：badge 名称、验证 URL、hashtags
- [ ] 可编辑 textarea（`linkedInMessage` state）带默认模板
- [ ] 默认模板包含：badge 名称、G-Credit 品牌、验证 URL、hashtags
- [ ] `useEffect` 仅在 `linkedInMessage` 为空时设置默认值（不覆盖用户编辑）
- [ ] "Share on LinkedIn" 按钮：LinkedIn 品牌色 `#0A66C2`
- [ ] 点击后 `window.open()` 打开 LinkedIn share URL (`sharing/share-offsite/?url=`)
- [ ] URL 使用 `encodeURIComponent(verificationUrl)` 编码
- [ ] 弹窗大小 `width=600,height=600`
- [ ] 按钮状态变化：点击后 "✓ LinkedIn opened — share from there" (disabled, green)，5 秒恢复
- [ ] "Opens LinkedIn in a new window" 提示文字

#### Analytics
- [ ] `recordLinkedInShare(badgeId)` 函数在 `badgeShareApi.ts` 中创建
- [ ] 使用 `apiFetch` POST 到 `/badges/:badgeId/share/linkedin`
- [ ] 后端 `badge-analytics.controller.ts` 新增 `POST :badgeId/share/linkedin` 端点
- [ ] `BadgeAnalyticsService.recordShare` platform 类型扩展包含 `'linkedin'`
- [ ] Analytics 记录为 non-blocking（catch 静默处理，不影响分享流程）

#### OG Meta Tags（条件 C-6）
- [ ] `index.html` 添加 `og:title`, `og:description`, `og:image`, `og:type`, `og:site_name`
- [ ] `gcredit-og-image.png` 存在于 `frontend/public/`
- [ ] 内容为静态 fallback（通用 G-Credit branding，非每 badge 动态）

#### 测试
- [ ] `BadgeShareModal.test.tsx`：LinkedIn tab 渲染、4 tabs 顺序正确、LinkedIn panel 内容

---

### Story 11.18: Verification — Skill UUID→Name — 1h

#### 后端
- [ ] `badge-verification.service.ts`：添加 `prisma.skill.findMany({ where: { id: { in: skillIds } } })`
- [ ] 返回 `skills: skills.map(s => ({ id: s.id, name: s.name }))` 替代原 `skillIds || []`
- [ ] `skillIds` 为空时返回空数组（无报错）
- [ ] Skill 查询使用 `select: { id: true, name: true }`（最小化查询）

#### 前端
- [ ] `badge.ts` `VerificationResponse.skills` 类型从 `string[]` 改为 `Array<{ id: string; name: string }>`
- [ ] `VerifyBadgePage.tsx`：`skill.name` 渲染（非 `skillId`），`key={skill.id}`

#### 测试
- [ ] `badge-verification.service.spec.ts`：mock `skill.findMany` 返回 resolved names
- [ ] 验证结果中 `skills` 为 `[{ id, name }]` 对象数组

---

### Story 11.19: 403 Access Denied Page — 2h

#### 组件
- [ ] `AccessDeniedPage.tsx` 创建于 `frontend/src/pages/`
- [ ] 使用 `Layout` 组件包裹 + `pageTitle="Access Denied"`
- [ ] 布局：`min-h-[60vh]`, `text-center`, `flex flex-col items-center justify-center`
- [ ] 图标：ShieldAlert（或等价 SVG）— 非 emoji
- [ ] "403" 大号数字：`text-5xl md:text-6xl font-bold text-neutral-300`
- [ ] "Access Denied" 标题：`text-2xl font-semibold text-neutral-700`
- [ ] 显示当前用户角色（`useAuthStore`），**不显示所需角色**（OWASP）
- [ ] "← Go Back" 按钮：`navigate(-1)`，无历史时 fallback `navigate('/')`
- [ ] "Contact Admin" 按钮：`mailto:admin@company.com?subject=Access Request: {pathname}`
- [ ] 双按钮布局：`flex-col sm:flex-row gap-3`（移动端堆叠）

#### 路由
- [ ] App.tsx 添加 `<Route path="/access-denied" element={<AccessDeniedPage />} />`
- [ ] 使用 lazy import `const AccessDeniedPage = lazy(() => import(...))`

#### ProtectedRoute 修改
- [ ] 角色不足时 `<Navigate to="/access-denied" replace />`（替代原 `<Navigate to="/" replace />`）
- [ ] 401（未登录）仍走 `<Navigate to="/login">` — 未受影响

#### 测试
- [ ] `AccessDeniedPage.test.tsx`：403 数字、标题、角色显示、Go Back 按钮、Contact Admin mailto

---

## 🔍 横向检查项

- [ ] **测试:** BE 测试通过（预期 ~590+，baseline 580），FE 测试通过（~535+，baseline 526）
- [ ] **Lint:** ESLint 0 errors + 0 warnings (`--max-warnings=0`)
- [ ] **TypeScript:** `npx tsc --noEmit` 通过
- [ ] **E2E:** `npm run test:e2e` 通过
- [ ] **CI Pipeline:** 最终状态绿色
- [ ] **Commit 规范:** feat/fix prefixes，message 描述清晰
- [ ] **无副作用:** 未修改 Wave 3 范围外的功能逻辑
- [ ] **apiFetch 使用:** 新增的 API 调用（visibility PATCH, linkedin share POST）都使用 `apiFetch` 而非直接 `fetch`

---

## ⚠️ 特别关注项

### UX 一致性
- [ ] BadgeDetailModal visibility toggle 使用 inline style 还是 Tailwind class？与组件其余部分风格一致吗？
- [ ] BadgeTimelineCard toggle 使用 emoji（🌐/🔒）还是 Lucide 图标？dev prompt 指定 Lucide `Globe`/`Lock`
- [ ] LinkedIn tab panel 大量 inline style — 是否与其他 tab panel (Email/Teams/Widget) 风格一致？
- [ ] AccessDeniedPage 图标是 Lucide `ShieldAlert` 还是 inline SVG？UX review 指定 `ShieldAlert`

### 安全考虑
- [ ] `updateVisibility` 的 owner check：`badge.recipientId !== userId` — 用的是 JWT payload 中的哪个字段？
- [ ] OB Assertion 端点确认**未受影响**（grep `assertion` endpoint，确认无 visibility filter）
- [ ] AccessDeniedPage 不暴露所需角色信息（仅显示当前角色）

### 数据流完整性
- [ ] Wallet 页面刷新后 visibility 状态是否持久化？（后端 getWalletBadges 是否返回 visibility？）
- [ ] BadgeDetailModal 打开时是否正确初始化 `localVisibility`？
- [ ] LinkedIn share 的 `verificationUrl` 构建是否正确？使用 `window.location.origin` + `/verify/` + `badgeId` — 应该是 `verificationId` 还是 `badgeId`？

---

## 📝 Review 输出格式

请按以下格式输出 review 结果：

```
## Review 结果: [APPROVED / APPROVED WITH COMMENTS / CHANGES REQUESTED]

### 各 Story 状态
| Story | 状态 | 备注 |
|-------|------|------|
| 11.4  | ✅/⚠️/❌ | ... |
| 11.5  | ✅/⚠️/❌ | ... |
| 11.18 | ✅/⚠️/❌ | ... |
| 11.19 | ✅/⚠️/❌ | ... |

### Arch/UX 条件满足状况
| # | 条件 | 状态 | 备注 |
|---|------|------|------|
| C-3 | PRIVATE badge OB assertion 仍可访问 | ✅/❌ | ... |
| C-5 | 双入口 toggle (Wallet+Modal), 默认 PUBLIC | ✅/❌ | ... |
| C-6 | OG meta tags for LinkedIn | ✅/❌ | ... |
| UX | ClaimSuccessModal visibility hint | ✅/❌ | ... |
| UX | LinkedIn SVG #0A66C2 + tab order | ✅/❌ | ... |
| UX | 403: ShieldAlert, current role only, dual button | ✅/❌ | ... |
| UX | 401→/login, 403→/access-denied | ✅/❌ | ... |

### 发现的问题（如有）
1. [MUST FIX] 描述...
2. [SUGGESTION] 描述...

### 总结
...
```

---

**Created:** 2026-02-14  
**Author:** SM Agent (Bob)
