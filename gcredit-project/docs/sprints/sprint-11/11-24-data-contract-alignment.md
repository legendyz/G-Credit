# Story 11.24: Data Contract Alignment — API-to-UI Integration Fixes

**Status:** done  
**Priority:** 🔴 CRITICAL  
**Estimate:** 8-10h  
**Source:** UAT 全面排查发现 14 个数据契约断裂问题 (2026-02-14)  
**Supersedes:** TD-016 (JSON 活动日志), TD-017 (Skills UUID) — 合并到此 Story 统一修复

## Story

As a user (employee or admin),  
I want all UI pages to correctly display human-readable information from the API,  
So that I see meaningful content instead of raw UUIDs, JSON strings, broken images, or runtime crashes.

## Background

Sprint 11 的安全加固和功能增强修改了多个数据层（auth、revocation、milestones、skills filtering），
但部分组件的 props 传递和数据解析没有同步更新，导致 **"上游改了、下游断了"** 的模式性问题。

UAT 期间发现并验证了 14 个问题，按严重程度分为 3 级。

---

## Issue Inventory

### 🔴 Critical — 必须修复（用户可见 bug / 运行时崩溃）

#### C-1: Admin Dashboard Recent Activity 显示原始 JSON *(原 TD-016)*

- **位置:** `dashboard.service.ts` L401 → `AdminDashboard.tsx`
- **现象:** Recent Activity 显示 `{"reason":"Policy Violation","badgeName":"Python Expert",...}` 而非人类可读描述
- **修复:** 在 `dashboard.service.ts` 添加 `formatActivityDescription()` 函数，按 action 类型格式化 metadata

#### C-2: Admin 创建的模板 Earning Criteria 永远不显示

- **位置:** `BadgeInfo.tsx` L12-17
- **现象:** Admin UI 创建模板使用 `{ type: 'manual', description: '...' }` 格式，但 `BadgeInfo` 只识别 `{ requirements: [...] }` 格式。通过 admin 创建的所有新模板的 criteria 都不渲染
- **修复:** 增加对 `{ description: '...' }` / `{ type, description }` 格式的支持

#### C-3: Milestone 混入 Badge 数组导致 Wallet 运行时崩溃

- **位置:** `badge-issuance.service.ts` L1162 → `useWallet.ts` → `BadgeTimelineCard.tsx`
- **现象:** Wallet API 将 milestone 和 badge 对象合并到同一个 `data[]` 数组，前端按 `Badge` 类型处理 milestone 时 `badge.template.name` 为 undefined → `TypeError`
- **修复:** API 响应中保留 `type` 字段区分 badge/milestone，前端按类型分别渲染

---

### 🟡 Medium — 应该修复（数据不完整或边界异常）

#### M-4: 验证页 `expiresAt` 字段名不匹配

- **位置:** `badge-verification.controller.ts` → `VerifyBadgePage.tsx` L60
- **现象:** API 返回 Open Badges 2.0 的 `expires` 字段，前端读 `expiresAt` → 永远 undefined → 有效期 badge 不显示过期日期
- **修复:** 后端 controller 显式添加 `expiresAt` 字段，或前端改读 `expires`

#### M-5: 验证页 `claimedAt` 未在 API 响应中返回

- **位置:** `badge-verification.controller.ts` → `VerifyBadgePage.tsx` L61
- **现象:** `claimedAt` 不是 Open Badges 2.0 字段，controller 只 spread `assertionData`，因此 `claimedAt` 丢失
- **修复:** Controller 额外添加 `claimedAt: badge.claimedAt`

#### M-7: `issuerMessage` 前端类型存在但后端无此字段

- **位置:** `badge.ts` L19 → `BadgeDetailModal.tsx` L268-272
- **现象:** `IssuerMessage` 组件永远不渲染（死代码）
- **修复:** 移除前端 `issuerMessage` 字段和 `IssuerMessage` 条件渲染，或在后端 Badge model 添加此字段

#### M-8: 撤销者被删除后 `revokedBy` 变成原始 UUID 字符串

- **位置:** `badge-issuance.service.ts` L883-899
- **现象:** 如果撤销操作的 admin 用户后续被删除，`badge.revoker` 为 null，但 `badge.revokedBy`（raw UUID）通过 spread 暴露 → 前端 `.name` / `.role` 访问崩溃
- **修复:** 添加 fallback `{ name: 'Unknown User', role: 'N/A' }`

#### M-9: Badge 模板无图片时显示碎图标

- **位置:** `useWallet.ts` L24 → `BadgeTimelineCard.tsx` L101-104
- **现象:** `imageUrl: string` 类型不允许 null，但后端返回 null → `<img src={null}>` 显示碎图标
- **修复:** 类型改为 `string | null`，组件添加 null check + placeholder image

#### M-13: Skill 名称解析失败时 fallback 显示 UUID

- **位置:** `BadgeDetailModal.tsx` L40
- **现象:** 当 skill 被删除后，`skillNamesMap[id] || id` fallback 显示原始 UUID
- **修复:** Fallback 改为 `'Unknown Skill'` 或不渲染不可解析的 skill

---

### 🟢 Low — 可延后（美观/一致性问题）

#### L-6: 验证页 `id` 是 assertion URL 而非 badge UUID

- **位置:** `VerifyBadgePage.tsx` L51
- **现象:** `badge.id` 被赋值为 Open Badges 2.0 assertion URL `https://g-credit.com/api/badges/xxx/assertion`，语义不正确但暂无可见影响

#### L-10: Wallet `description` 类型应为 nullable

- **位置:** `useWallet.ts` L23 — `description: string` 应为 `string | null`

#### L-11: Employee Dashboard `recentAchievements` 是死代码

- **位置:** `EmployeeDashboard.tsx` L340-366
- **现象:** 渲染 "Recent Achievements Unlocked" 但后端 `getEmployeeDashboard()` 不返回此字段

#### L-12: 批量颁发模板选择器显示完整 UUID

- **位置:** `TemplateSelector.tsx` L137, L169
- **现象:** 用户在下拉菜单看到完整 UUID 字符串

#### L-14: Timeline category 显示小写而非 Title Case

- **位置:** `BadgeTimelineCard.tsx` → 显示 `achievement` 而非 `Achievement`

---

## Acceptance Criteria

### Critical (must fix)

- [ ] AC-C1: Admin Dashboard Recent Activity 显示人类可读描述（非 JSON），覆盖 ISSUED, CLAIMED, REVOKED, NOTIFICATION_SENT, CREATED, UPDATED 六种 action
- [ ] AC-C2: Badge Detail Modal 的 Earning Criteria 正确显示三种格式：`{ requirements: [...] }`、`{ description: '...' }`、纯 string
- [ ] AC-C3: Wallet Timeline 正确处理 badge 和 milestone 两种类型，milestone 不导致崩溃；milestone 有独立 UI 展示

### Medium (should fix)

- [ ] AC-M4: 验证页正确显示有过期时间的 badge 的过期日期
- [ ] AC-M5: 验证页正确显示 badge 的领取日期
- [ ] AC-M7: `issuerMessage` 要么完整实现，要么清理死代码
- [ ] AC-M8: 撤销者用户被删除时，Revocation Section 优雅显示 "Unknown User" 而非崩溃
- [ ] AC-M9: 无图片模板使用 placeholder image 而非碎图标
- [ ] AC-M13: 无法解析的 skill ID 显示 "Unknown Skill" 而非 UUID

### Low (nice to have)

- [ ] AC-L6: 验证页 `badge.id` 为实际 badge UUID
- [ ] AC-L10: Wallet type 声明 `description` 为 nullable
- [ ] AC-L11: `recentAchievements` 死代码被清理
- [ ] AC-L12: 模板选择器不显示完整 UUID
- [ ] AC-L14: Category 值展示为 Title Case

---

## Tasks / Subtasks

### Task 1: Backend — `formatActivityDescription()` (AC-C1) ~2h

- [ ] 在 `dashboard.service.ts` 添加 `formatActivityDescription(action, metadata)` 函数
- [ ] 按 action 类型 (ISSUED, CLAIMED, REVOKED, NOTIFICATION_SENT, CREATED, UPDATED) 解析 metadata 为人类可读描述
- [ ] 未识别 action 类型时 fallback 到 action 名称
- [ ] 为函数添加单元测试（6+ cases）

### Task 2: Frontend — `BadgeInfo.tsx` criteria 多格式支持 (AC-C2) ~30min

- [ ] `BadgeInfo.tsx` 增加对 `{ description: '...' }` 和 `{ type, description }` 格式的支持
- [ ] 三种格式的解析优先级：`requirements[]` → `description` string → 纯 string → 空

### Task 3: Wallet API — Badge/Milestone 类型区分 (AC-C3) ~2h

- [ ] Backend: `getWallet()` 返回时保留 `type: 'badge' | 'milestone'` 字段（不在 `map(item => item.data)` 中丢失）
- [ ] Frontend: `useWallet.ts` 更新 `WalletResponse.data` 类型为联合类型 `(Badge & { type: 'badge' }) | (Milestone & { type: 'milestone' })`
- [ ] Frontend: `TimelineView.tsx` 和 grid view 按 `type` 字段分别渲染 badge/milestone card
- [ ] 创建 `MilestoneTimelineCard.tsx` 组件渲染 milestone 条目

### Task 4: Verification page 字段修复 (AC-M4, AC-M5, AC-L6) ~1h

- [ ] Backend: `badge-verification.controller.ts` 在响应中显式添加 `expiresAt`, `claimedAt`, `badgeId` 字段
- [ ] Frontend: `VerifyBadgePage.tsx` 读取修正后的字段名

### Task 5: Null safety 和 fallback 加固 (AC-M8, AC-M9, AC-M13) ~1.5h

- [ ] `badge-issuance.service.ts` — revoker null 时 fallback `{ name: 'Unknown User', role: 'N/A' }`
- [ ] `useWallet.ts` — `imageUrl: string | null`, `description: string | null` (AC-L10)
- [ ] `BadgeTimelineCard.tsx` — `imageUrl` null check + placeholder image
- [ ] `BadgeDetailModal.tsx` — skill fallback 改为 `'Unknown Skill'`

### Task 6: 死代码清理 (AC-M7, AC-L11) ~30min

- [ ] 评审 `issuerMessage` 功能：如 Sprint 12 不计划实现，移除 `badge.ts` 类型字段 + `IssuerMessage` 条件渲染
- [ ] `EmployeeDashboard.tsx` — 移除 `recentAchievements` section（或标注 TODO 待后端实现）

### Task 7: 展示美化 (AC-L12, AC-L14) ~30min

- [ ] `TemplateSelector.tsx` — UUID 改为截断显示 + copy 按钮
- [ ] `BadgeTimelineCard.tsx` — category 渲染时应用 title case：`category.charAt(0).toUpperCase() + category.slice(1)`

---

## Technical Notes

### 模式性问题总结

这 14 个问题属于三种模式：

| 模式 | 数量 | 示例 |
|------|------|------|
| **后端返回 ID，前端直接渲染** | 4 | Skills UUID, Template UUID, assertion URL as id |
| **数据结构不匹配** | 5 | criteria 格式, milestone vs badge, field name 不一致 |
| **Nullable 处理缺失** | 3 | imageUrl, revokedBy, description |
| **死代码 / 未接通** | 2 | issuerMessage, recentAchievements |

### 预防措施建议

1. **Zod schema 校验**: 前端增加 API response 的 runtime schema 验证（Sprint 12 可评估）
2. **E2E 数据契约测试**: 添加 contract test 验证 API response shape 符合 frontend type
3. **Nullable linting rule**: ESLint 规则强制 Prisma nullable 字段在前端也声明为 nullable

---

## Files Affected

| File | Changes |
|------|---------|
| `backend/src/dashboard/dashboard.service.ts` | Task 1: 添加 `formatActivityDescription()` |
| `frontend/src/components/BadgeDetailModal/BadgeInfo.tsx` | Task 2: 多格式 criteria 解析 |
| `backend/src/badge-issuance/badge-issuance.service.ts` | Task 3: wallet 保留 type 字段; Task 5: revoker fallback |
| `frontend/src/hooks/useWallet.ts` | Task 3: 联合类型; Task 5: nullable 字段 |
| `frontend/src/components/TimelineView/TimelineView.tsx` | Task 3: type-based 渲染分流 |
| `frontend/src/components/TimelineView/BadgeTimelineCard.tsx` | Task 5: image fallback; Task 7: category title case |
| `frontend/src/components/TimelineView/MilestoneTimelineCard.tsx` | Task 3: 新文件 — milestone 卡片组件 |
| `backend/src/badge-verification/badge-verification.controller.ts` | Task 4: 添加 expiresAt, claimedAt, badgeId |
| `frontend/src/pages/VerifyBadgePage.tsx` | Task 4: 字段名修正 |
| `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` | Task 5: skill fallback |
| `frontend/src/types/badge.ts` | Task 6: 移除 issuerMessage (如决定清理) |
| `frontend/src/pages/dashboard/EmployeeDashboard.tsx` | Task 6: 移除 recentAchievements section |
| `frontend/src/components/BulkIssuance/TemplateSelector.tsx` | Task 7: UUID 截断 |

## Testing Strategy

- 单元测试: `formatActivityDescription()` 6+ cases
- 单元测试: `BadgeInfo` 三种 criteria 格式渲染
- 手动 UAT: Wallet timeline 含 milestone 时不崩溃
- 手动 UAT: 验证页显示 expiresAt / claimedAt
- 手动 UAT: 无图片模板显示 placeholder
- 现有 722+ backend tests + 541+ frontend tests 不因此 break
