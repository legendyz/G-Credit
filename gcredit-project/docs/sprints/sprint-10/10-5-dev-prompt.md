# Story 10.5 Dev Prompt: Admin Analytics — Mock Data → Real Data

**Story File:** `docs/sprints/sprint-10/10-5-admin-analytics-real-data.md`
**Branch:** `sprint-10/v1-release`
**Commit Message:** `feat: connect admin analytics to real API data`
**Estimate:** 6h

---

## Mission

重构 `AdminAnalyticsPage.tsx`，移除全部 mock 数据，对接后端已有的 5 个 Analytics API endpoint，让 Admin 仪表盘展示真实数据库数据。

---

## 重要：你必须遵守的规则

1. **先读 `project-context.md` 的 "Coding Standards (Quick Reference)" 节**
2. 所有代码、注释、变量名用 **英文**（零中文字符）
3. API 调用使用 `API_BASE_URL`（从 `@/lib/apiConfig.ts` 导入），**不硬编码 `/api/...`**
4. 用户提示用 `sonner` 的 `toast.error()` / `toast.success()`，不用 `window.alert`
5. 不用 `console.log/error/warn`（ErrorBoundary 除外）
6. Frontend 测试文件后缀 `.test.ts` / `.test.tsx`
7. Prettier: `singleQuote: true`, `trailingComma: "es5"`, `printWidth: 100`
8. 完成后运行 pre-commit checklist：`npm run lint` (0 errors) + `npx vitest run` (all pass)

---

## 现状分析

### 后端已有 5 个 Endpoint（全部可用，无需修改）

| # | Endpoint | 方法 | 角色 | 缓存 | 用途 |
|---|----------|------|------|------|------|
| 1 | `GET /api/analytics/system-overview` | GET | ADMIN | 15min | 用户/badge/模板统计 + 系统健康 |
| 2 | `GET /api/analytics/issuance-trends?period=30` | GET | ADMIN, ISSUER | 无 | 按日 issued/claimed/revoked 数据点 |
| 3 | `GET /api/analytics/top-performers?limit=10` | GET | ADMIN, MANAGER | 无 | 员工 badge 排行榜 |
| 4 | `GET /api/analytics/skills-distribution` | GET | ADMIN | 15min | 热门技能 + 按类别分布 |
| 5 | `GET /api/analytics/recent-activity?limit=20` | GET | ADMIN | 15min | 审计日志活动流 |

### 后端 DTO 响应结构（必须严格对应）

#### SystemOverviewDto（Endpoint 1）
```typescript
{
  users: {
    total: number;
    activeThisMonth: number;
    newThisMonth: number;
    byRole: { ADMIN: number; ISSUER: number; MANAGER: number; EMPLOYEE: number };
  };
  badges: {
    totalIssued: number;
    claimedCount: number;
    pendingCount: number;
    revokedCount: number;
    claimRate: number;         // 0.0 - 1.0
  };
  badgeTemplates: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastSync: string;          // ISO timestamp
    apiResponseTime: string;   // e.g. '120ms'
  };
}
```

#### IssuanceTrendsDto（Endpoint 2）
```typescript
// Query: ?period=7|30|90|365 &issuerId=<uuid>(optional, ADMIN only)
{
  period: string;              // 'last30days'
  startDate: string;           // '2026-01-10'
  endDate: string;
  dataPoints: Array<{
    date: string;
    issued: number;
    claimed: number;
    revoked: number;
  }>;
  totals: {
    issued: number;
    claimed: number;
    revoked: number;
    claimRate: number;
  };
}
```

#### TopPerformersDto（Endpoint 3）
```typescript
// Query: ?limit=10 &teamId=<string>(optional)
{
  teamId?: string;
  teamName?: string;
  period: string;              // 'allTime'
  topPerformers: Array<{
    userId: string;
    name: string;
    badgeCount: number;
    latestBadge?: {
      templateName: string;
      claimedAt: string;
    };
  }>;
}
```

#### SkillsDistributionDto（Endpoint 4）
```typescript
{
  totalSkills: number;
  topSkills: Array<{           // Top 20
    skillId: string;
    skillName: string;
    badgeCount: number;
    employeeCount: number;
  }>;
  skillsByCategory: Record<string, number>;  // { Technical: 180, 'Soft Skills': 95 }
}
```

#### RecentActivityDto（Endpoint 5）
```typescript
// Query: ?limit=20 &offset=0
{
  activities: Array<{
    id: string;
    type: 'BADGE_ISSUED' | 'BADGE_CLAIMED' | 'BADGE_REVOKED' | 'TEMPLATE_CREATED' | 'USER_REGISTERED';
    actor: { userId: string; name: string };
    target?: {
      userId?: string;
      name?: string;
      badgeTemplateName?: string;
      templateName?: string;
    };
    timestamp: string;         // ISO
  }>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
```

### 前端现状

- **`AdminAnalyticsPage.tsx`（293 行）**: 全部 mock 数据，`useState`/`useEffect` + `setTimeout` 模拟。展示的是"分享统计"（totalShares, platformDistribution），与后端 API 完全不匹配
- **`analyticsApi.ts`**: 不存在，需新建
- **`useAnalytics.ts` hook**: 不存在，需新建
- **TanStack Query**: 项目已在用（`useDashboard.ts`, `useAdminUsers.ts` 等），模式已建立

---

## 实施步骤

### Step 1: 创建 TypeScript 类型定义（~15min）

新建 `src/types/analytics.ts`，定义上面 5 个 DTO 对应的 TypeScript interface。

### Step 2: 创建 API Client（~30min）

新建 `src/lib/analyticsApi.ts`

**遵循已有模式**（参考 `src/lib/adminUsersApi.ts`）:
```typescript
import { API_BASE_URL } from './apiConfig';

const ANALYTICS_BASE = `${API_BASE_URL}/analytics`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getSystemOverview(): Promise<SystemOverviewDto> { ... }
export async function getIssuanceTrends(period?: number): Promise<IssuanceTrendsDto> { ... }
export async function getTopPerformers(limit?: number): Promise<TopPerformersDto> { ... }
export async function getSkillsDistribution(): Promise<SkillsDistributionDto> { ... }
export async function getRecentActivity(limit?: number, offset?: number): Promise<RecentActivityDto> { ... }
```

### Step 3: 创建 TanStack Query Hooks（~30min）

新建 `src/hooks/useAnalytics.ts`

**遵循已有模式**（参考 `src/hooks/useDashboard.ts`）:
```typescript
import { useQuery } from '@tanstack/react-query';

export function useSystemOverview() {
  return useQuery({
    queryKey: ['analytics', 'system-overview'],
    queryFn: getSystemOverview,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,    // AC7: Auto-refresh 5min
    refetchOnWindowFocus: true,
  });
}

export function useIssuanceTrends(period: number = 30) {
  return useQuery({
    queryKey: ['analytics', 'issuance-trends', period],
    queryFn: () => getIssuanceTrends(period),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// ... 类似模式 for useTopPerformers, useSkillsDistribution, useRecentActivity
```

### Step 4: 重构 AdminAnalyticsPage（~2.5h）⚠️ 核心工作

完全重写 `AdminAnalyticsPage.tsx`，替换 mock 数据为真实 API。

**新页面布局**（替代现有的"分享统计"）：

#### Section A: KPI Overview Cards（4 张卡片）
数据来源：`useSystemOverview()`

| 卡片 | 数据 | 格式 |
|------|------|------|
| Total Users | `users.total` | 数字，副文本 `activeThisMonth active this month` |
| Badges Issued | `badges.totalIssued` | 数字，副文本 `claimRate%` claim rate |
| Active Templates | `badgeTemplates.active` | 数字，副文本 `total total` |
| System Health | `systemHealth.status` | 绿/黄/红圆点 + status 文本 |

#### Section B: Issuance Trends Chart
数据来源：`useIssuanceTrends(period)`

- 折线图 / 面积图，X 轴 = date，Y 轴 = count
- 3 条线：issued（蓝）, claimed（绿）, revoked（红）
- 时间范围选择器：7d / 30d / 90d / 365d（对应 `?period=` 参数）
- 右上角显示 totals summary

#### Section C: Top Performers
数据来源：`useTopPerformers(10)`

- 排行榜表格：#, Name, Badge Count, Latest Badge
- 限制显示 top 10

#### Section D: Skills Distribution
数据来源：`useSkillsDistribution()`

- 水平柱状图：top 10 skills by badge count
- 或饼图/环形图：按 skillsByCategory 分布

#### Section E: Recent Activity Feed
数据来源：`useRecentActivity(10)`

- 时间线/列表显示最近 10 条活动
- 每条显示：icon (按 type)、actor name、动作描述、timestamp (相对时间)
- 例：🏅 `John Doe` issued `Excellence Award` to `Jane Smith` — 2 hours ago

#### Section F: Bottom Bar
- "Last updated: {time}" + 手动刷新按钮
- 移除 "Demo Mode" 黄色横幅

### Step 5: UX States（~45min）

每个 Section 都需要 3 个状态：

| 状态 | 实现 |
|------|------|
| **Loading** | 使用 Skeleton/Pulse 动画（Tailwind `animate-pulse` + `bg-muted`），不用 spinner |
| **Error** | 红色 Alert card，显示 error.message，带 "Retry" 按钮调用 `refetch()` |
| **Empty** | 灰色提示 "No data available yet"，不同 section 给不同的引导文案 |

**注意：** 每个 hook 独立请求，一个 section 失败不影响其他 section 展示。

### Step 6: 图表库选择

检查项目是否已有图表库：
```bash
grep -r "recharts\|chart.js\|@nivo\|visx\|tremor" frontend/package.json
```

- 如果已有 → 使用已有的
- 如果没有 → **用 Recharts**（React 生态最常用，轻量）：
  ```bash
  cd gcredit-project/frontend && npm install recharts
  ```
- 图表组件可以抽到 `src/components/analytics/` 目录下

### Step 7: 测试（~1h）

#### 7a. API Client 测试 `src/lib/__tests__/analyticsApi.test.ts`
- Mock `fetch`，验证 5 个函数正确构造 URL、header、处理错误

#### 7b. Hook 测试 `src/hooks/__tests__/useAnalytics.test.ts`
- 用 `@tanstack/react-query` 的 `renderHook` + `QueryClientProvider` wrapper
- 验证 loading → success 状态转换
- 验证 error 状态

#### 7c. 组件测试 `src/pages/__tests__/AdminAnalyticsPage.test.tsx`
- Mock all 5 hooks
- 测试 loading state renders skeletons
- 测试 data state renders KPI values
- 测试 error state shows retry button
- 测试 empty state when all values are 0

---

## 新建文件清单

| # | 文件 | 用途 |
|---|------|------|
| 1 | `src/types/analytics.ts` | TypeScript 类型定义 |
| 2 | `src/lib/analyticsApi.ts` | API Client (5 个函数) |
| 3 | `src/hooks/useAnalytics.ts` | TanStack Query Hooks (5 个) |
| 4 | `src/components/analytics/IssuanceTrendChart.tsx` | 折线图组件 |
| 5 | `src/components/analytics/SkillsDistributionChart.tsx` | 柱状图/饼图组件 |
| 6 | `src/components/analytics/TopPerformersTable.tsx` | 排行榜组件 |
| 7 | `src/components/analytics/RecentActivityFeed.tsx` | 活动流组件 |
| 8 | `src/components/analytics/AnalyticsSkeleton.tsx` | 加载骨架屏 |
| 9 | `src/lib/__tests__/analyticsApi.test.ts` | API 测试 |
| 10 | `src/hooks/__tests__/useAnalytics.test.ts` | Hook 测试 |
| 11 | `src/pages/__tests__/AdminAnalyticsPage.test.tsx` | 页面集成测试 |

## 修改文件

| # | 文件 | 修改内容 |
|---|------|---------|
| 1 | `src/pages/AdminAnalyticsPage.tsx` | **完全重写**：移除 mock，对接 5 个 hooks |
| 2 | `package.json` | 添加 `recharts`（如果尚未安装） |

---

## AC 验证清单

| AC | 验证方法 |
|----|---------|
| AC1: Fetches from `/api/analytics/*` | `analyticsApi.ts` 使用 `API_BASE_URL + '/analytics/...'`，无硬编码 |
| AC2: KPI cards real data | SystemOverview hook → 4 张卡片显示 users.total / badges.totalIssued / etc. |
| AC3: Charts real data | IssuanceTrends → 折线图，SkillsDistribution → 柱状图 |
| AC4: Loading states | 每个 section 有 Skeleton 组件，`isLoading` 时显示 |
| AC5: Error states | 每个 section 有 error Alert + Retry，`isError` 时显示 |
| AC6: Empty states | 数据为零/空数组时显示引导文案 |
| AC7: Auto-refresh 5min | `refetchInterval: 5 * 60 * 1000` + "Last updated" 显示 |
| AC8: Tests pass | `npm run lint` 0 errors + `npx vitest run` all pass |
| AC9: Commit message | `feat: connect admin analytics to real API data` |

---

## ⚠️ 注意事项

1. **不要修改后端代码。** 5 个 endpoint 已经 production-ready，本 story 只改前端。
2. **移除全部 mock 数据。** AdminAnalyticsPage 不应保留任何 `setTimeout`、硬编码数据、"Demo Mode" 横幅。
3. **页面主题从"分享统计"变为"系统管理仪表盘"。** 旧的 interface（`PlatformStats`, `TopBadge`, `AdminAnalyticsData`）全部删除，用新的 analytics types 替代。
4. **每个 section 的 hook 独立调用。** 不要用一个 mega-query 请求所有数据。一个 section 失败不应阻塞其他 section。
5. **开发环境数据可能很少。** seed 只有 2 个用户 + 1 个 badge，要确保 empty state 处理正确。数据丰富度在 Story 10.6 (UAT Seed Data) 才会解决。
