# Story 10.3 Dev Prompt: TODO/FIXME Cleanup + UX Audit Critical Fixes

**Story Doc:** [10-3-todo-fixme-cleanup.md](10-3-todo-fixme-cleanup.md)  
**Branch:** `sprint-10/v1-release`  
**Estimate:** 5h  
**Priority:** Execute UX Critical fixes (Tasks 10-12) FIRST, then backend/frontend TODOs

---

## 执行顺序

1. **Step 1:** 创建 `apiConfig.ts` 集中 API_BASE_URL（消除重复定义）
2. **Step 2:** 修复 10 处 hardcoded `localhost:3000`（AC5）
3. **Step 3:** 修复 11 处 dead navigation links（AC6）
4. **Step 4:** 添加 404 catch-all route（AC7）
5. **Step 5:** 解决 Backend TODO 标记（AC1, AC2）
6. **Step 6:** 解决 Frontend TODO 标记（AC1）
7. **Step 7:** 附加 UX 修复（window.alert + console.log）
8. **Step 8:** 全面验证

---

## Step 1: 创建集中 API 配置

当前 `API_BASE_URL` 在 5 个文件中独立重复定义。创建一个 SSOT：

**创建 `frontend/src/lib/apiConfig.ts`：**
```typescript
/**
 * Centralized API configuration.
 * All API calls should import API_BASE_URL from this file.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

然后让所有文件从这里导入：
- `frontend/src/lib/badgesApi.ts` L6 → 删除本地定义, `import { API_BASE_URL } from './apiConfig';`
- `frontend/src/lib/badgeShareApi.ts` L6 → 同上
- `frontend/src/pages/BulkIssuancePage.tsx` L17 → 同上
- `frontend/src/components/BulkIssuance/TemplateSelector.tsx` L12 → 同上
- `frontend/src/hooks/useDashboard.ts` L15 → 同上 (**注意：这个文件定义少了 `/api` 后缀，需要修正**)

---

## Step 2: 修复 10 处 Hardcoded `localhost:3000`（AC5）

每个文件添加 `import { API_BASE_URL } from '...apiConfig';`，然后替换：

### 2.1 `frontend/src/pages/VerifyBadgePage.tsx` L34
```typescript
// ❌ 当前
const response = await fetch(`http://localhost:3000/api/verify/${verificationId}`);
// ✅ 修复
const response = await fetch(`${API_BASE_URL}/verify/${verificationId}`);
```

### 2.2 `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` — 3 处
```typescript
// L62 ❌
const response = await fetch(`http://localhost:3000/api/badges/${badgeId}`, {
// L62 ✅
const response = await fetch(`${API_BASE_URL}/badges/${badgeId}`, {

// L88 ❌
const response = await fetch(`http://localhost:3000/api/badges/${badge.id}/download/png`, {
// L88 ✅
const response = await fetch(`${API_BASE_URL}/badges/${badge.id}/download/png`, {

// L124 ❌
const response = await fetch(`http://localhost:3000/api/badges/${badge.id}/claim`, {
// L124 ✅
const response = await fetch(`${API_BASE_URL}/badges/${badge.id}/claim`, {
```

### 2.3 `frontend/src/components/BadgeDetailModal/EvidenceSection.tsx` — 3 处
```typescript
// L29 ❌
const response = await fetch(`http://localhost:3000/api/badges/${badgeId}/evidence`, {
// L29 ✅
const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/evidence`, {

// L64 ❌
const response = await fetch(`http://localhost:3000/api/evidence/${badgeId}/${fileId}/download`, {
// L64 ✅
const response = await fetch(`${API_BASE_URL}/evidence/${badgeId}/${fileId}/download`, {

// L97 ❌
const response = await fetch(`http://localhost:3000/api/evidence/${badgeId}/${fileId}/preview`, {
// L97 ✅
const response = await fetch(`${API_BASE_URL}/evidence/${badgeId}/${fileId}/preview`, {
```

### 2.4 `frontend/src/components/BadgeDetailModal/SimilarBadgesSection.tsx` L35
```typescript
// ❌
const response = await fetch(`http://localhost:3000/api/badges/${badgeId}/similar?limit=6`, {
// ✅
const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/similar?limit=6`, {
```

### 2.5 `frontend/src/components/BadgeDetailModal/ReportIssueForm.tsx` L41
```typescript
// ❌
const response = await fetch(`http://localhost:3000/api/badges/${badgeId}/report`, {
// ✅
const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/report`, {
```

### 2.6 `frontend/src/hooks/useWallet.ts` L70
```typescript
// ❌
const response = await fetch(`http://localhost:3000/api/badges/wallet?${searchParams}`, {
// ✅
const response = await fetch(`${API_BASE_URL}/badges/wallet?${searchParams}`, {
```

### 验证
```powershell
# 应该返回 0 结果（不含 node_modules）
Get-ChildItem -Path frontend/src -Recurse -Include *.ts,*.tsx | Select-String "localhost:3000" | Where-Object { $_.Path -notmatch "node_modules" }
```

---

## Step 3: 修复 11 处 Dead Navigation Links（AC6）

### 现有路由映射表

| 有效路由 | 页面 |
|----------|------|
| `/` | DashboardPage |
| `/wallet` | TimelineView（Badge Wallet） |
| `/admin/analytics` | AdminAnalyticsPage |
| `/admin/badges` | BadgeManagementPage（模板管理+发证） |
| `/admin/bulk-issuance` | BulkIssuancePage |
| `/admin/users` | AdminUserManagementPage |
| `/login` | LoginPage |
| `/verify/:id` | VerifyBadgePage |

### 修复策略

**对于有合理映射目标的：** 重定向到最接近的现有路由  
**对于没有对应功能的：** 禁用按钮 + "Coming soon" tooltip + `aria-disabled`

| # | Dead Route | 文件 | 行号 | 修复方案 |
|---|-----------|------|------|---------|
| 1 | `/catalog` | EmployeeDashboard.tsx | 188 | → `/wallet`（最接近的"浏览徽章"体验） |
| 2 | `/badges` | EmployeeDashboard.tsx | 141 | → `/wallet` |
| 3 | `/badges/issue` | IssuerDashboard.tsx | 85 | → `/admin/badges`（在 Badge Management 中可发证） |
| 4 | `/badges/manage` | IssuerDashboard.tsx | 93 | → `/admin/badges` |
| 5 | `/team/nominate` | ManagerDashboard.tsx | 86 | 禁用 — "Coming in Phase 2"（功能不存在） |
| 6 | `/team/skills` | ManagerDashboard.tsx | 94 | 禁用 — "Coming in Phase 2"（功能不存在） |
| 7 | `/admin/templates` | AdminDashboard.tsx | 85 | → `/admin/badges` |
| 8 | `/admin/templates` | AdminDashboard.tsx | 129 | → `/admin/badges` |
| 9 | `/admin/settings` | AdminDashboard.tsx | 139 | 禁用 — "Coming in Phase 2"（功能不存在） |
| 10 | `/docs/help/earning-badges` | TimelineView.tsx | 176 | 禁用或移除链接（外部文档不存在） |
| 11 | `/badges/templates` | TimelineView.tsx | 173, 271 | → `/wallet` |

### 禁用按钮模式

对 #5, #6, #9 使用一致的禁用样式：
```tsx
<Button 
  variant="outline" 
  disabled 
  className="flex items-center gap-2 min-h-[44px] opacity-50 cursor-not-allowed"
  title="Coming in Phase 2"
>
  <Award className="h-4 w-4" />
  Nominate Team Member
</Button>
```

对 #10 (`onLearnMore`)：移除回调或改为默认空操作 + 移除对应按钮（外部文档不存在没有意义显示）

---

## Step 4: 添加 404 Catch-All Route（AC7）

### 4.1 创建 `frontend/src/pages/NotFoundPage.tsx`
```tsx
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Layout pageTitle="Page Not Found">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          Back to Dashboard
        </button>
      </div>
    </Layout>
  );
}
```

### 4.2 在 `App.tsx` 添加 catch-all 路由

在 `</Routes>` 前添加：
```tsx
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// ... 在最后一个 Route 之后，</Routes> 之前:
<Route path="*" element={<NotFoundPage />} />
```

---

## Step 5: 解决 Backend TODO 标记（AC1, AC2）

### 5.1 `dashboard.service.ts` L411 — systemHealth
```typescript
// ❌ 当前
systemHealth: 'healthy', // TODO: Implement actual health check

// ✅ 修复 — 使用 Prisma 检查数据库连接
systemHealth: await this.checkSystemHealth(),

// 添加私有方法：
private async checkSystemHealth(): Promise<string> {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return 'healthy';
  } catch {
    return 'degraded';
  }
}
```

### 5.2 `auth.service.ts` L56 — 审计日志
```typescript
// ❌ 当前
// 4. TODO: Add audit logging (Task 2.2.8)
console.log(`[AUDIT] User registered: ${user.email} (${user.id})`);

// ✅ 修复 — 改用 NestJS Logger（最小改动，不需要完整审计系统）
this.logger.log(`[AUDIT] User registered: ${user.email} (${user.id})`);
// 移除 TODO 注释，添加说明：
// Audit logging via NestJS Logger — full audit trail system deferred to Phase 2
```

### 5.3 `auth.service.ts` L86 — 失败登录日志
```typescript
// ❌ 当前
// TODO: Log failed attempt for rate limiting (Task 2.3.9)
this.logger.warn(`Failed login attempt for user: ${dto.email}`, 'LoginAttempt');

// ✅ 修复 — 日志已经在做了，只需移除 TODO，添加说明：
// Rate limiting deferred to Phase 2 — failed attempts logged for monitoring
this.logger.warn(`Failed login attempt for user: ${dto.email}`, 'LoginAttempt');
```

### 5.4 `skills.service.ts` L152 — 技能引用检查
```typescript
// ❌ 当前
// TODO: In future sprints, check if skill is referenced in badge templates

// ✅ 修复 — 实现引用检查
const referencingTemplates = await this.prisma.badgeTemplate.count({
  where: {
    skills: { some: { id } },
  },
});
if (referencingTemplates > 0) {
  throw new BadRequestException(
    `Cannot delete skill: referenced by ${referencingTemplates} badge template(s)`,
  );
}
```
**注意：** 需要确认 Prisma schema 中 BadgeTemplate 和 Skill 的关系字段名称。

### 5.5 `teams-sharing.controller.ts` L91 — Teams Channel Sharing（TD-006）
```typescript
// ❌ 当前
// TODO: Technical Debt - Teams Channel Sharing Not Implemented

// ✅ 修复 — 转为 ADR 注释（不需要代码改动）
// ADR: Teams Channel Sharing deferred — requires ChannelMessage.Send Graph API
// permission (pending tenant admin approval). See TD-006 in Post-MVP Backlog.
// Current behavior: returns BadRequestException instructing user to use email sharing.
```

### 5.6 Backend spec file TODOs（4 个 `describe.skip` 文件）
这些是 TD-006 相关的测试，保留 `describe.skip` 但将 TODO 改为 ADR 注释：
```typescript
// ❌ 当前
// TODO: Re-enable when Teams permissions are configured (TD-003)

// ✅ 修复
// ADR: Tests skipped pending ChannelMessage.Send permission approval (TD-006).
// See Post-MVP Backlog and SKIPPED-TESTS-TRACKER.md for resolution steps.
```

文件列表：
- `src/badge-issuance/badge-issuance-teams.integration.spec.ts` L32
- `src/microsoft-graph/services/graph-teams.service.spec.ts` L7
- `src/microsoft-graph/teams/teams-badge-notification.service.spec.ts` L9
- `src/badge-sharing/controllers/teams-sharing.controller.spec.ts` L12

---

## Step 6: 解决 Frontend TODO 标记（AC1）

### 6.1 `TimelineView.tsx` L153-155 — Badge 统计
```typescript
// ❌ 当前
const claimedBadges = 0; // TODO: Get from API response if available
const pendingBadges = 0; // TODO: Get from API response if available
const revokedBadges = 0; // TODO: Get from API response if available

// ✅ 修复 — 从 badges 数组中客户端计算
// badges 来自 useWallet hook 的 walletData.badges
const claimedBadges = badges.filter(b => b.status === 'CLAIMED').length;
const pendingBadges = badges.filter(b => b.status === 'PENDING').length;
const revokedBadges = badges.filter(b => b.status === 'REVOKED').length;
```
**注意：** 需要确认 badges 变量在 TimelineView.tsx 中的作用域和 badge status 枚举值。读取组件的完整上下文确认。

### 6.2 `AdminAnalyticsPage.tsx` L46 — Mock 数据
```typescript
// ❌ 当前
// TODO: Replace with actual admin analytics endpoint when backend implements it
await new Promise(resolve => setTimeout(resolve, 1000)); // fake delay
const mockData = { totalShares: 1247, ... };

// ✅ 修复 — 使用实际的 analytics API
const token = localStorage.getItem('access_token');
const response = await fetch(`${API_BASE_URL}/analytics/system-overview`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!response.ok) throw new Error('Failed to fetch analytics');
const data = await response.json();
```
**注意：** 需要看后端 `/api/analytics/system-overview` 返回的字段结构，确认与前端 `AdminAnalyticsData` 接口是否匹配。如果不完全匹配，可能需要适配或补充缺失字段。

### 6.3 `BadgeDetailModal.tsx` L286 — isOwner
```typescript
// ❌ 当前
<BadgeAnalytics badgeId={badge.id} isOwner={true} // TODO: Check if current user is badge owner or issuer />

// ✅ 修复 — 从 localStorage 获取用户信息比对
const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
const isOwner = badge.recipientId === currentUserId;
// ...
<BadgeAnalytics badgeId={badge.id} isOwner={isOwner} />
```
**注意：** 需要确认 localStorage 中 user 对象的结构和 badge 对象是否有 `recipientId` 字段。

---

## Step 7: 附加 UX 修复

### 7.1 替换 `window.alert()`

**`BulkPreviewPage.tsx` L157：**
```typescript
// ❌
alert(err instanceof Error ? err.message : 'Download failed');
// ✅
import { toast } from 'sonner';
toast.error(err instanceof Error ? err.message : 'Download failed');
```

**`ProcessingComplete.tsx` L60：**
```typescript
// ❌
alert('Failed to download error report');
// ✅
import { toast } from 'sonner';
toast.error('Failed to download error report');
```

### 7.2 移除 `console.log` 调试代码

**`BadgeDetailModal.tsx` L29：**
```typescript
// ❌ 删除这行
console.log('BadgeDetailModal render - isOpen:', isOpen, 'badgeId:', badgeId);
```

---

## Step 8: 全面验证

```powershell
# 1. 确认 0 个 TODO/FIXME（在 src/ 中，不含注释中的 ADR 参考）
cd gcredit-project/backend
Get-ChildItem -Path src -Recurse -Include *.ts | Select-String "// TODO:|// FIXME:" | Where-Object { $_ -notmatch "ADR:" }

cd gcredit-project/frontend
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String "// TODO:|// FIXME:"

# 2. 确认 0 个 hardcoded localhost
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String "localhost:3000" | Where-Object { $_ -notmatch "apiConfig" }

# 3. ESLint clean
cd gcredit-project/backend
npx eslint "{src,apps,libs,test}/**/*.ts" --max-warnings=0

# 4. tsc clean
npx tsc --noEmit

# 5. Backend tests pass
npx jest --passWithNoTests --no-coverage

# 6. Frontend builds/compiles
cd gcredit-project/frontend
npx tsc --noEmit

# 7. 前端启动测试（手动验证 404 页面）
npm run dev
# 浏览器访问 http://localhost:5173/nonexistent → 应看到 404 页面
```

---

## Commit Message

```
refactor: resolve TODO/FIXME markers + fix dead links and localhost URLs
```

---

## ⚠️ 提交前必须通过（Zero-Tolerance CI 标准）

从 Story 10.2 起，项目执行 zero-tolerance 代码质量门禁。每次提交前 **必须** 验证以下三项全部通过：

```powershell
# 1. ESLint: 0 errors + 0 warnings（CI 硬性门禁）
cd gcredit-project/backend
npm run lint

# 2. TypeScript 类型检查: 0 errors
npx tsc --noEmit

# 3. 全量测试: 0 failures
npx jest --passWithNoTests --no-coverage
```

**任何一项失败都不得提交。** CI pipeline 会阻断不合规的代码。

---

## 实施注意事项

1. **Prisma schema 确认：** 修复 skills.service.ts 前先检查 `BadgeTemplate` 和 `Skill` 的关系字段名
2. **AdminAnalyticsPage 字段对齐：** 后端 analytics API 返回的字段需与前端 `AdminAnalyticsData` 接口对齐，可能需要创建适配层
3. **TimelineView badge status：** 确认 badge 对象的 `status` 字段枚举值（`CLAIMED`/`PENDING`/`REVOKED`/`EXPIRED`）
4. **currentUser 来源：** 检查项目中获取 current user 的标准方式（localStorage? AuthContext? hook?），保持一致
5. **测试影响：** skills.service 添加引用检查后，需要更新对应的 spec 文件测试用例
6. **apiConfig.ts 路径：** 各文件导入路径不同，注意相对路径正确性
