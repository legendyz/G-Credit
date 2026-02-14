# Sprint 11 - Technical Debt Registry

**Created:** 2026-02-14  
**Sprint:** Sprint 11 (v1.1.0)  
**Branch:** `sprint-11/security-quality-hardening`

---

## TD-016: Admin Dashboard Recent Activity 显示原始 JSON

**Priority:** P2  
**Category:** UX / Code Quality  
**Source:** UAT 测试发现 (2026-02-14)  
**Effort Estimate:** 3-4h  
**Suggested Sprint:** Sprint 12  
**Superseded by:** [Story 11.24 — Data Contract Alignment](11-24-data-contract-alignment.md) (Issue C-1)

### Problem Statement

Admin Dashboard 的 **Recent Activity** 区域直接显示 `auditLog.metadata` 的 `JSON.stringify()` 结果，
用户看到的是原始 JSON 字符串，例如：

```
NOTIFICATION_SENT
{"error":null,"success":true,"attempts":1,"recipientEmail":"employee@gcredit.com","notificationType":"REVOCATION"}

REVOKED
{"reason":"Issued in Error","badgeName":"Garage Hero - Bronze","recipientEmail":"employee@gcredit.com"}

CLAIMED
{"newStatus":"CLAIMED","oldStatus":"PENDING"}
```

这对用户来说不友好，不符合 production-ready 标准。

### Root Cause

**Backend** — `dashboard.service.ts` L401:

```typescript
// Transform audit logs to activity DTOs
const recentActivity: AdminActivityDto[] = recentActivityRaw.map((log) => ({
  id: log.id,
  type: log.action,
  description: log.metadata ? JSON.stringify(log.metadata) : log.action,  // ← 问题
  actorName: actorMap.get(log.actorId) || 'System',
  timestamp: log.timestamp,
}));
```

`log.metadata` 是 Prisma `Json` 类型（可存任意结构），当前直接序列化为字符串。

**Frontend** — `AdminDashboard.tsx` L274:

```tsx
<p className="text-sm text-muted-foreground truncate">{activity.description}</p>
```

直接渲染后端返回的 `description` 字符串（即原始 JSON）。

### Proposed Solution

#### Option A: Backend 格式化（推荐）

在 `dashboard.service.ts` 中增加一个 `formatActivityDescription()` 函数，根据 `log.action` 类型解析 `metadata` 并生成人类可读描述：

```typescript
function formatActivityDescription(action: string, metadata: Record<string, unknown> | null): string {
  if (!metadata) return action;

  switch (action) {
    case 'REVOKED':
      return `Revoked "${metadata.badgeName}" — ${metadata.reason}`;
    case 'CLAIMED':
      return `Badge status changed: ${metadata.oldStatus} → ${metadata.newStatus}`;
    case 'NOTIFICATION_SENT':
      return `${metadata.notificationType} notification sent to ${metadata.recipientEmail}`;
    case 'ISSUED':
      return `Badge "${metadata.badgeName}" issued to ${metadata.recipientEmail}`;
    case 'CREATED':
      return `Template "${metadata.templateName}" created`;
    case 'UPDATED':
      return `${metadata.entity || 'Record'} updated`;
    default:
      return action;
  }
}
```

**优点：** 所有 consumer（Dashboard、Analytics Page、未来 API）统一受益  
**工作量：** ~2h

#### Option B: Frontend 格式化

在 `ActivityItem` 组件中解析 `description`（如果是 JSON）并格式化。

**优点：** 不需要改后端  
**缺点：** 只修复一个页面；Analytics Page 的 `RecentActivityFeed` 也用了不同的数据源，需要重复处理

#### 推荐

**Option A** — 后端统一处理，确保所有前端页面都能拿到友好描述。同时保留原始 `metadata` 字段供 debug 或 audit 使用。

### Affected Files

| File | Role |
|------|------|
| `backend/src/dashboard/dashboard.service.ts` (L398-404) | 转换 audit log → activity DTO |
| `frontend/src/pages/dashboard/AdminDashboard.tsx` (L249-280) | `ActivityItem` 组件渲染 |
| `backend/src/analytics/analytics.service.ts` | Analytics 端的 recent-activity（可能也有同样问题） |
| `frontend/src/components/analytics/RecentActivityFeed.tsx` | Analytics 页面的活动 feed |

### Acceptance Criteria

- [ ] Recent Activity 区域显示人类可读的活动描述（非 JSON）
- [ ] 覆盖所有常见 action 类型：ISSUED, CLAIMED, REVOKED, NOTIFICATION_SENT, CREATED, UPDATED
- [ ] 未识别的 action 类型优雅降级（显示 action 名称，不显示 JSON）
- [ ] 原始 metadata 保留在 audit log 表中，不被删除
- [ ] 现有单元测试不因此变更而 break
- [ ] 为 `formatActivityDescription()` 添加单元测试

### Notes

- 这个问题在 Analytics Page 的 `RecentActivityFeed.tsx` 中使用了不同的数据源 (`/api/analytics/recent-activity`)，该端点返回的是结构化的 `ActivityItem` 类型（含 `actor`, `target` 子对象），由 `buildDescription()` 函数格式化——那边的显示是正常的。
- 问题仅存在于 Admin Dashboard 使用的 `/api/dashboard/admin` 端点，该端点直接读取 `auditLog` 表。
- 修复时可参考 `RecentActivityFeed.tsx` 的 `buildDescription()` 函数的模式。

---

## TD-017: Badge Detail 页面 Skills Demonstrated 显示 UUID 而非技能名称

**Priority:** P1  
**Category:** UX Bug  
**Source:** UAT 测试发现 (2026-02-14)  
**Effort Estimate:** 2-3h  
**Suggested Sprint:** Sprint 12  
**Status:** ✅ 已在 UAT 期间通过 `useSkillNamesMap` hook 修复  
**Superseded by:** [Story 11.24 — Data Contract Alignment](11-24-data-contract-alignment.md) (Issue M-13: fallback 加固)

### Problem Statement

Badge Detail Modal 的 **Skills Demonstrated** 区域显示原始 UUID（如 `a0a00006-0006-4006-a006-000000000006`），
而非人类可读的技能名称（如 "Teamwork", "Leadership"）。

### Root Cause

**Frontend** — `BadgeDetailModal.tsx` L265:

```tsx
<BadgeInfo
  description={badge.template.description}
  skills={badge.template.skillIds}  // ← 传入的是 UUID 数组
  criteria={badge.template.issuanceCriteria}
/>
```

**Backend** — `GET /badges/:id` 返回的 `template.skillIds` 是 `String[]` 类型的 UUID 数组，
未 join `Skill` 表解析为名称。

`BadgeInfo.tsx` 中直接渲染数组元素：

```tsx
{skills.map((skill, index) => (
  <span key={index} className="... rounded-full">{skill}</span> // ← 直接显示 UUID
))}
```

### Proposed Solution

#### Option A: Backend resolve（推荐）

在 `GET /badges/:id` 的 Prisma 查询中，将 `skillIds` 替换为 resolved skills：

```typescript
// 获取 badge 之后
const skillNames = await this.prisma.skill.findMany({
  where: { id: { in: badge.template.skillIds } },
  select: { id: true, name: true },
});
// 返回时添加 skills: skillNames.map(s => s.name)
```

同时需要更新 frontend 类型和 `BadgeInfo` props。

#### Option B: Frontend resolve

在 `BadgeDetailModal` 中额外调用 Skills API 获取名称映射。

**推荐 Option A** — 单一请求即可获取完整数据。

### Affected Files

| File | Role |
|------|------|
| `backend/src/badge-issuance/badge-issuance.service.ts` | `findOne()` 方法的 Prisma 查询 |
| `frontend/src/components/BadgeDetailModal/BadgeInfo.tsx` | Skills pill 渲染 |
| `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` | 传递 skills prop |
| `frontend/src/pages/VerifyBadgePage.tsx` | 验证页面也显示 skills（可能同样受影响） |

### Acceptance Criteria

- [ ] Skills Demonstrated 区域显示技能名称（如 "Teamwork"）而非 UUID
- [ ] 公开验证页面同样显示技能名称
- [ ] 技能名称不存在时优雅降级（显示 "Unknown Skill" 或隐藏）
- [ ] 现有测试不 break

---

## TD-018: LinkedIn 分享缺少动态 OG Meta Tags

**Priority:** P2  
**Category:** Feature Gap / SEO  
**Source:** UAT 讨论 (2026-02-15)  
**Effort Estimate:** 4-6h  
**Suggested Sprint:** Sprint 12

### Problem Statement

当用户通过 LinkedIn 分享验证链接 `https://<domain>/verify/<verificationId>` 时，LinkedIn 爬虫（LinkedInBot）获取到的是**静态通用 OG meta tags**，而非该徽章的具体信息。所有分享链接在 LinkedIn 上显示完全相同的预览卡片：

- **标题:** "G-Credit — Verified Digital Badge"（固定）
- **描述:** 通用产品描述（固定）
- **图片:** 通用 logo `/gcredit-og-image.png`（固定）

用户期望看到的是对应徽章的名称、描述和图片。

### Root Cause

**前端架构限制** — G-Credit 是纯 SPA（React + Vite），`index.html` 中的 OG tags 在构建时写死：

```html
<!-- frontend/index.html L12-17 -->
<meta property="og:title" content="G-Credit — Verified Digital Badge" />
<meta property="og:description" content="This digital badge was issued and verified through G-Credit..." />
<meta property="og:image" content="/gcredit-og-image.png" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://gcredit.example.com" />
<meta property="og:site_name" content="G-Credit" />
```

LinkedIn 爬虫不执行 JavaScript，因此无法获取 SPA 动态渲染的内容。后端也没有为 `/verify/:id` 提供服务端 HTML 的逻辑。

### Proposed Solutions

#### Option A: NestJS OG 代理路由（推荐，4-6h）

在 NestJS 后端添加一个 middleware/controller，拦截 `/verify/:id` 请求：
- 检测 User-Agent（`LinkedInBot`, `facebookexternalhit`, `Twitterbot` 等）
- 爬虫请求 → 返回注入动态 OG tags 的最小 HTML
- 普通用户请求 → 301 重定向到 SPA 或返回 SPA 的 `index.html`

```typescript
// 伪代码
@Get('verify/:verificationId')
async verifyPage(@Param('verificationId') id: string, @Req() req, @Res() res) {
  const isCrawler = /LinkedInBot|facebookexternalhit|Twitterbot/i.test(req.headers['user-agent']);
  
  if (isCrawler) {
    const badge = await this.verificationService.getBadgeForOG(id);
    return res.send(`
      <html><head>
        <meta property="og:title" content="${badge.name} — Verified Badge" />
        <meta property="og:description" content="Issued to ${badge.recipientName} by ${badge.issuerName}" />
        <meta property="og:image" content="${badge.imageUrl}" />
        <meta property="og:url" content="https://gcredit.com/verify/${id}" />
      </head><body>Redirecting...</body></html>
    `);
  }
  
  // Serve SPA index.html or redirect
  return res.sendFile('index.html');
}
```

#### Option B: Prerender 服务（2h 配置 + 月费 $$）

使用 Prerender.io 或 Rendertron 等服务，在反向代理层为爬虫提供预渲染的 HTML 快照。

#### Option C: Edge Function（2-3h，依赖部署架构）

在 CDN 层（Cloudflare Workers / Vercel Edge / Azure Functions）拦截爬虫请求并注入动态 meta tags。

### Affected Files

| File | Role |
|------|------|
| `frontend/index.html` | 当前静态 OG tags |
| `backend/src/badge-verification/` | 验证逻辑（需新增 OG 代理路由） |
| 部署配置 (nginx / Azure) | 路由规则可能需调整 |

### Dependencies

- 需要生产域名确定后才能设置正确的 `og:url`
- Badge 模板图片需通过公网可访问的 URL 提供（Azure Blob public access 或 CDN）

### Acceptance Criteria

- [ ] LinkedIn 分享验证链接后，预览卡片显示该徽章的名称
- [ ] 预览卡片显示该徽章的描述或核心信息
- [ ] 预览卡片显示该徽章的图片（非通用 logo）
- [ ] 普通用户访问验证链接仍正常渲染 SPA 验证页面
- [ ] PRIVATE visibility 的徽章不生成动态 OG（显示通用卡片或 404）
