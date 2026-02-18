# Sprint 11 Architecture Review Result

**Reviewer:** Winston (Architect Agent)  
**Requested by:** SM (Bob)  
**Date:** 2026-02-13  
**Sprint:** Sprint 11 — Security + Quality + Feature Hardening  
**Target Version:** v1.1.0  
**Review Scope:** 23 stories across 5 waves, 6 specific review items + overall risk assessment

---

## 📋 审核结论

### **APPROVED WITH CONDITIONS**

Sprint 11 backlog 整体设计合理，优先级排序正确，依赖链基本完整。以下条件必须满足：

1. **Story 11.6 (JWT httpOnly)** 需增加前置子任务或调整估时（见§1 详细建议）
2. **Story 11.6** 需写 ADR-010（必须，架构级变更）
3. **Story 11.4 (Badge Visibility)** 需明确 OB Assertion 端点对 PRIVATE badge 的行为
4. **Story 11.16 (Pagination)** 前后端必须同一 story 原子化修改

---

## 🔍 逐项审核结果

---

### 1. SEC-002: JWT httpOnly Cookie 迁移（Story 11.6）

**风险等级:** 🔴 HIGH — 影响全局认证架构  
**审核结论:** ⚠️ APPROVED WITH CONDITIONS

#### 1.1 CORS 配置变更

**现状分析：** `main.ts` 中 CORS 已配置 `credentials: true`，但当前仅用于 `Authorization` header。迁移到 cookie 后，浏览器在 cross-origin 场景下会自动携带 cookie（前提是 `credentials: 'include'` + 服务端 `Access-Control-Allow-Credentials: true`）。

**建议：**
- CORS 配置基本不需变更（`credentials: true` 已设置）
- `allowedHeaders` 中的 `Authorization` 可保留（向后兼容过渡期）
- `exposedHeaders` 无需变更（cookie 不通过 response header 暴露）
- 确保 `Access-Control-Allow-Origin` 不为 `*`（已满足 — 使用白名单）

#### 1.2 Vite Dev Proxy Cookie 透传

**现状分析：** `vite.config.ts` proxy 配置仅有 `changeOrigin: true`，无 cookie 相关配置。

**建议：**
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      // 添加以下配置
      cookieDomainRewrite: 'localhost',  // 确保 cookie domain 匹配 dev 环境
      secure: false,                      // dev 环境允许非 HTTPS cookie
    },
  },
},
```

开发环境中，前后端同 `localhost` 但不同端口（5173 vs 3000），proxy 转发时 cookie 的 `Domain` 和 `Path` 需要正确重写。`cookieDomainRewrite: 'localhost'` 可解决。

#### 1.3 SameSite 策略

| 策略 | 场景影响 | 建议 |
|------|---------|------|
| `Strict` | 从邮件链接（badge claim、password reset）点击进入时，cookie 不会携带，导致登录态丢失 | ❌ 不推荐 |
| `Lax` | GET 请求携带 cookie（顶级导航），POST 不携带（第三方表单） | ✅ **推荐** |
| `None` | 所有场景携带，但要求 `Secure` flag | 仅在 cross-site 部署时使用 |

**推荐：`SameSite=Lax`。** G-Credit 有邮件链接场景（badge claim email、password reset email），`Strict` 会导致用户从邮件点击后需要重新登录，体验极差。`Lax` 在安全性和可用性间取得平衡。

#### 1.4 Refresh Token Cookie Path 隔离

**推荐方案：**
```
Access Token  → cookie path: /api          (所有 API 请求携带)
Refresh Token → cookie path: /api/auth     (仅 auth 相关请求携带)
```

将 Refresh Token 限制在 `/api/auth` 路径下，减少泄露面。Access Token 设短 TTL（15min），即使在 `/api` 全路径下暴露，窗口期有限。

**注意：** Refresh Token 的 path 不要设为 `/api/auth/refresh`（太窄），因为 logout 端点 `POST /api/auth/logout` 也需要读取 refresh token cookie 来执行服务端撤销。`/api/auth` 覆盖 login/logout/refresh 全部场景。

#### 1.5 前后端部署顺序

**风险：** 如果后端先部署（设置 httpOnly cookie），但前端仍用 localStorage 读 token，则 cookie 被忽略、localStorage 无 token → 认证失败。反之亦然。

**推荐策略 — 双写过渡期：**
1. **阶段 1（后端先行）：** 登录响应同时 Set-Cookie + 返回 JSON body 中的 token。后端全局 `JwtAuthGuard` 改为先读 cookie、再读 Authorization header（fallback）。
2. **阶段 2（前端跟进）：** 前端移除 localStorage 写入，改为 `credentials: 'include'`。旧版本前端仍可用（读 JSON body token + Authorization header）。
3. **阶段 3（清理）：** 移除 JSON body 中的 token 返回。全面 cookie-only。

此策略允许前后端独立部署且向后兼容，避免 big-bang 切换风险。

#### 1.6 ⚠️ 关键发现：51 个直接 fetch() 调用

**问题：** 前端代码中有 **51 个直接 `fetch()` 调用**（vs 仅 1 个 apiClient 调用）。Cookie 迁移需要每个 fetch 调用添加 `credentials: 'include'`。逐个修改 51 处：
- 工作量被低估（当前 4-6h 估时可能不够）
- 极易遗漏（任何一处遗漏 → 该功能认证失败）
- 未来维护噩梦

**架构建议：** 创建一个轻量级 `apiFetch()` 包装函数作为 **Story 11.6 的前置子任务**，集中管理 `credentials: 'include'` + `Content-Type` + error handling：

```typescript
// lib/apiFetch.ts
export async function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',  // cookie 自动携带
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
```

然后批量替换 51 个 `fetch()` 调用。这本质上是提前执行 CQ-008（HTTP Client 统一）的最小可行版本。

**估时调整建议：** 4-6h → **6-8h**（含 fetch 包装器创建 + 51 处替换 + E2E 测试更新）

#### 1.7 E2E 测试影响

当前 E2E 测试通过 `Authorization: Bearer ${token}` header 注入认证。迁移到 cookie 后，测试需要：
- 先调用 login 端点获取 Set-Cookie
- 后续请求携带 cookie（如果使用 supertest/axios，需启用 cookie jar）
- 或者：保留 Authorization header 作为 fallback（双写过渡期策略），测试无需改动

**建议：** 采用双写过渡期策略后，E2E 测试可暂不修改，大幅降低迁移风险。

#### 1.8 ADR 需求

**必须创建 ADR-010：** JWT Token Transport Migration (localStorage → httpOnly Cookie)

记录：
- 迁移动机（SEC-002 XSS token theft risk）
- 选定方案（httpOnly cookie + SameSite=Lax + Secure）
- Cookie path 隔离策略
- 双写过渡期设计
- Rollback 策略
- 对 OB2.0 公开端点的影响（无影响 — 公开端点不需认证）

---

### 2. SEC-006: Global HTML Sanitization Pipe（Story 11.9）

**风险等级:** 🟡 MEDIUM  
**审核结论:** ✅ APPROVED（附技术方案推荐）

#### 2.1 实现方式比较

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **A. class-transformer `@Transform()` 装饰器** | 精确控制每个字段、复用性好、自然绑定 DTO | 需要为每个 string DTO 字段添加装饰器 | ✅ **推荐** |
| **B. Global Interceptor** | 一处配置全局生效 | 破坏 DTO 类型信息、难以排除特定字段、对 multipart 请求需特殊处理 | ⚠️ 备选 |
| **C. Custom ValidationPipe** | 与现有 ValidationPipe 集成 | ValidationPipe 职责是验证不是变换，混用违反单一职责 | ❌ 不推荐 |

**推荐方案 A：** 创建自定义 `@SanitizeHtml()` 装饰器：

```typescript
// common/decorators/sanitize-html.decorator.ts
import { Transform } from 'class-transformer';
import sanitize from 'sanitize-html';

export function SanitizeHtml() {
  return Transform(({ value }) => 
    typeof value === 'string' 
      ? sanitize(value, { allowedTags: [], allowedAttributes: {} }) 
      : value
  );
}
```

然后在 DTO 中使用：
```typescript
export class CreateBadgeTemplateDto {
  @SanitizeHtml()
  @IsString()
  name: string;

  @SanitizeHtml()
  @IsString()
  description: string;
}
```

**优势：**
- 细粒度控制：可排除无需清洗的字段（如已有其他验证的 email 字段）
- 自文档化：DTO 中直观可见哪些字段被清洗
- 与现有 `ValidationPipe`（`transform: true`）自然集成
- 测试简单：测试装饰器 + 测试 DTO 各字段

#### 2.2 sanitize-html vs DOMPurify

| 库 | Node.js 适配 | 最小可用 | 依赖 | 推荐 |
|----|-------------|---------|------|------|
| `sanitize-html` | ✅ 原生支持 | ✅ 已安装 | 无外部依赖 | ✅ **推荐（已在项目中）** |
| `DOMPurify` | 需要 `jsdom` | ❌ 未安装 | jsdom 较重（~2MB） | ❌ 不推荐 |

`sanitize-html` 已经在项目中使用（CSV flow），且原生支持 Node.js，无需引入 `jsdom`。继续使用它。

#### 2.3 误杀风险

**当前状态分析：**
- Badge template `name`/`description` — 纯文本，不含 Markdown
- Criteria text — 纯文本字段
- User profile `firstName`/`lastName` — 纯文本
- `narrativeJustification` — 纯文本
- 前端无 Markdown 渲染组件（无 `dangerouslySetInnerHTML` 用于用户输入）

**结论：** `allowedTags: []` (剥离所有 HTML) 不会误杀合法内容，因为当前所有用户输入字段都是纯文本。如未来引入 Markdown 编辑器，需为 Markdown 字段使用不同的 sanitization profile（允许安全的 HTML 子集）。

#### 2.4 性能影响

`sanitize-html` 对短字符串（<1KB）的处理时间在微秒级。即使每个请求有 10 个 string 字段需要 sanitize，总开销 < 0.1ms，完全可忽略。

#### 2.5 作用范围

**应仅对写操作生效。** 通过方案 A（DTO 装饰器），自然只作用于带 `@Body()` 的 POST/PUT/PATCH 请求的 DTO，GET 请求的 `@Query()` DTO 可选择不加 `@SanitizeHtml()`。这比 Interceptor 方案更优雅。

---

### 3. FR19: Badge Visibility — 数据库迁移方案（Story 11.4）

**风险等级:** 🟡 MEDIUM  
**审核结论:** ✅ APPROVED（附技术方案推荐）

#### 3.1 Enum vs Boolean

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **Prisma enum `BadgeVisibility`** | DB 级约束、与现有 `BadgeStatus` enum 风格一致、可扩展（未来可加 `ORGANIZATION_ONLY`） | 需要 `CREATE TYPE` migration、enum 扩展需要新 migration | ✅ **推荐** |
| **Boolean `isPublic`** | 简单、无需新 type | 不可扩展（仅 true/false）、不自文档化 | ❌ |
| **String + 应用层校验** | 灵活 | 无 DB 约束、拼写错误风险 | ❌ |

**推荐 Prisma enum：**
```prisma
enum BadgeVisibility {
  PUBLIC
  PRIVATE
}

model Badge {
  // ... existing fields
  visibility  BadgeVisibility @default(PUBLIC)
}
```

**理由：** 项目已有 `BadgeStatus` enum 先例，团队熟悉此模式。`PUBLIC/PRIVATE` 二值足够 MVP，未来扩展到 `ORGANIZATION_ONLY` 或 `GROUP(groupId)` 只需加 enum 值。

#### 3.2 默认值与数据迁移

`@default(PUBLIC)` 使现有所有 badge 记录自动获得 `PUBLIC` 可见性 — **完全向后兼容，non-breaking**。无需数据迁移脚本。Prisma migration 会自动 `ALTER TABLE ... ADD COLUMN visibility ... DEFAULT 'PUBLIC'`。✅

#### 3.3 索引建议

```prisma
@@index([visibility, status])       // 公开验证页查询：WHERE visibility = PUBLIC AND status = CLAIMED
@@index([recipientId, visibility])  // 员工 profile 页过滤 PRIVATE badge
```

现有的 `@@index([recipientId, status, issuedAt])` 复合索引不覆盖 visibility 过滤。建议至少添加 `[visibility, status]` 索引，因为公开验证页是外部访问量最大的端点之一。

#### 3.4 ⚠️ OB Assertion 端点对 PRIVATE Badge 的行为

**这是需要 PO 确认的架构决策：**

| 方案 | 行为 | OB 2.0 合规性 | 推荐 |
|------|------|-------------|------|
| **A. 阻断 assertion** | `GET /api/badges/:id/assertion` 对 PRIVATE badge 返回 404 | ❌ 违反 OB 2.0（hosted verification 要求 assertion 可访问） | ❌ |
| **B. Assertion 可访问，UI 不展示** | Assertion 端点不检查 visibility；公开 profile、验证页过滤 PRIVATE | ✅ 完全合规 | ✅ **推荐** |

**推荐方案 B：** Visibility 控制的是 **展示层**（WHERE badge appears），不是 **数据层**（assertion data accessibility）。也就是：

- 公开验证页 `GET /api/verify/:verificationId` → PRIVATE badge 返回 404 ✅
- 员工公开 profile → PRIVATE badge 不显示 ✅
- OB assertion `GET /api/badges/:id/assertion` → PRIVATE badge 仍然可访问（UUID v4 不可枚举） ✅
- Badge wallet（内部）→ PRIVATE badge 正常显示（仅 owner 可见） ✅

**理由：** UUID v4 几乎不可暴力枚举（2^122 种组合）。Assertion 的 "公开可访问" 是 OB 2.0 hosted verification 的核心设计要求。Privacy = 控制 discovery，不是控制 access。

#### 3.5 数据库回滚策略

简单 `ALTER TABLE "Badge" DROP COLUMN "visibility"` 即可。无数据依赖关系。Prisma migration down 自动处理。

---

### 4. CQ-007: 分页响应格式标准化（Story 11.16）

**风险等级:** 🟡 MEDIUM — 潜在 Breaking Change  
**审核结论:** ⚠️ APPROVED WITH CONDITIONS

#### 4.1 当前格式差异分析

| 端点 | 数据 key | Meta 结构 | 分页参数名 |
|------|---------|-----------|-----------|
| badge-templates | `data` | `meta: { page, limit, total, totalPages, hasNext, hasPrev }` | page, limit |
| admin-users | `users` | `pagination: { total, page, limit, totalPages, nextCursor, hasMore }` | page, limit |
| bulk-issuance | `rows` | 扁平：`page, pageSize, totalPages, totalRows` | page, pageSize |
| badge-issuance | `data` | `pagination: { page, limit, total, totalPages }` | page, limit |
| analytics | — | `limit` + `offset` 参数 | limit, offset |

**差异严重度：高。** 5 个端点用了 3 种不同的数据 key 名（`data`/`users`/`rows`）、3 种 meta 结构、2 种分页参数命名（`limit`/`pageSize`、`page`/`offset`）。

#### 4.2 推荐统一格式

```typescript
// common/interfaces/paginated-response.interface.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;       // 当前页（1-based）
    limit: number;      // 每页条数
    total: number;      // 总记录数
    totalPages: number; // 总页数
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

```typescript
// common/utils/pagination.util.ts
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
```

保留 `badge-templates` 现有格式中的 `hasNext`/`hasPrev`（重命名为 `hasNextPage`/`hasPreviousPage`，更 self-documenting）。去掉 `nextCursor`（未实际实现 cursor-based pagination）。

#### 4.3 前端影响面

每个分页端点都有对应的前端组件消费者。需要更新：
- Badge template list page → 消费 `data` + `meta`
- User management page → `users` → `data`（key 名变化）
- Bulk issuance detail → `rows` → `data`，`pageSize` → `limit`
- Badge wallet → 消费 `data` + `pagination` → `meta`
- Analytics dashboard → 如有分页组件需更新

**估计 5-8 处前端修改。**

#### 4.4 API 版本化

**不需要。** 理由：
- 单一消费者（自有前端），无第三方 API 用户
- 前后端同时部署，同一 PR 内原子化修改
- 内部 pilot 阶段，无向后兼容义务
- API 版本化是为外部消费者准备的（Phase 3 FR33）

#### 4.5 ⚠️ 条件：前后端同 Story 原子修改

**必须在同一 story（11.16）中同步修改前后端。** 不可拆分为两个独立 story。建议工作流：

1. 创建 `PaginatedResponse<T>` 接口 + `createPaginatedResponse()` 工具函数
2. 逐个迁移 controller（一个 controller 改完后立即更新对应前端消费者）
3. 每迁移一个 controller 运行 E2E 测试确认无回归
4. 最后统一运行全量测试

**估时评估：** 4-6h 合理（5 controllers × ~45min/controller + 集成测试）

---

### 5. Story 11.20: ClaimPage 新路由设计

**风险等级:** 🟢 LOW  
**审核结论:** ✅ APPROVED

#### 5.1 NestJS 路由优先级

在 NestJS 中，同一个 Controller 内的路由按声明顺序注册。literal path 必须在 parameterized path 之前：

```typescript
@Controller('api/badges')
export class BadgeIssuanceController {
  @Post('claim')        // ← 必须在 :id/claim 之前
  async claimByToken(@Body() dto: ClaimBadgeDto) { ... }

  @Post(':id/claim')    // ← 在后面
  async claimById(@Param('id') id: string, @Body() dto: ClaimBadgeDto) { ... }
}
```

如果顺序反了，`POST /badges/claim` 会被 `:id` 捕获（`claim` 被当作 UUID 字符串），导致 500 错误或 `NotFoundException`。

#### 5.2 路由冲突分析

`BadgeIssuanceController` 已有 `@Controller('api/badges')` 前缀，现有路由包括：
- `POST :id/claim` — claim badge by ID
- `GET :id/assertion` — OB assertion
- `GET :id/integrity` — integrity check
- `PATCH :id/status` — revoke/reinstate

新增 `POST claim` 不会与这些冲突，因为 `claim` 是 literal 路径，NestJS 优先匹配。唯一需要注意的是 **声明顺序**。

#### 5.3 API 设计建议

`POST /api/badges/claim` 是一个 RPC-style 动词路由，不是纯 REST。但这在 enterprise API 中是常见且合理的模式——`claim` 是一个不可逆的业务动作，用 POST + 动词端点准确表达语义。

**推荐实现：**

```typescript
@Post('claim')
@Public()
@ApiOperation({ summary: 'Claim badge by token (no badge ID required)' })
async claimByToken(@Body() dto: ClaimBadgeDto): Promise<Badge> {
  if (!dto.claimToken) {
    throw new BadRequestException('claimToken is required');
  }
  return this.badgeService.claimBadge(dto.claimToken);
}
```

**向后兼容：** 保留 `POST :id/claim` 旧路由（已发出的 claim email 中可能包含 badge ID URL），在 deprecation 期后移除。

---

### 6. 整体架构风险

#### 6.1 依赖链审查

| 依赖关系 | 状态 | 说明 |
|---------|------|------|
| 11.8 (PII sanitization) → 11.13 (Logger) | ✅ 正确 | Logger 应使用 sanitized output |
| 11.13 (Logger) → 11.21 (CI console.log gate) | ✅ 正确 | CI gate 不应在 Logger 迁移前启用 |
| 11.6 (JWT httpOnly) → E2E tests | ⚠️ 需注意 | 双写策略可缓解 |
| **11.6 (JWT httpOnly) ↔ CQ-008 (fetch 统一)** | ⚠️ **新发现** | 51 处 fetch 需要添加 `credentials: 'include'`，实质上需要部分提前执行 CQ-008 |

**新发现的隐藏依赖：** Story 11.6 与被排除在 Sprint 11 之外的 CQ-008（HTTP Client 统一）存在实际耦合。建议在 11.6 中创建最小化的 `apiFetch()` 包装器（见 §1.6），一次性解决 51 处 fetch 调用的 credentials 问题。

#### 6.2 数据库迁移回滚策略

| Story | 迁移内容 | 回滚方式 | 风险 |
|-------|---------|---------|------|
| 11.1 (Account lockout) | User 表新增 `failedAttempts` INT + `lockedUntil` DateTime | DROP COLUMN ×2 | 🟢 低 |
| 11.4 (Badge visibility) | Badge 表新增 `visibility` enum + CREATE TYPE | DROP COLUMN + DROP TYPE | 🟢 低 |
| 11.6 (JWT httpOnly) | 无 DB 迁移（传输层变更） | 恢复 localStorage 代码 | 🟢 低 |

所有数据库变更都是 **additive**（新增列/类型），不修改、不删除现有数据。回滚策略清晰，风险可控。

#### 6.3 执行顺序风险

Backlog 中的 5-Wave 执行顺序总体合理。额外建议：

- **Wave 1** (Quick Wins): ✅ 合理。零风险 stories 先行，快速产出有利于团队信心。
- **Wave 2** (Security): ✅ 合理。11.8 在 11.13 前执行（PII sanitization before Logger）。
- **Wave 3** (Features): ✅ 合理。Feature stories 相互独立。
- **Wave 4** (Code Quality): ✅ 合理。测试类 stories 独立，不影响生产代码行为。
- **Wave 5** (Polish): ✅ 合理。CI gates 在最后，避免过早限制开发流程。

**一个调序建议：** Story 11.13 (Logger Integration) 可以考虑提前到 Wave 2 紧跟 11.8 之后执行，因为 Logger 改完后所有后续 stories 的调试都会更方便（结构化日志 vs no log）。当前安排在 Wave 4 开头也可接受。

---

## 📌 新发现的风险或依赖

| # | 发现 | 影响 | 建议 |
|---|------|------|------|
| **R-1** | Story 11.6 与 CQ-008 (51 fetch calls) 存在隐藏耦合 | 11.6 估时可能不足 | 在 11.6 中创建 `apiFetch()` 包装器，估时调整为 6-8h |
| **R-2** | Story 11.4 未明确 PRIVATE badge 的 OB Assertion 端点行为 | 实现时可能产生分歧 | 确认使用方案 B（assertion 可访问，UI 不展示）并记录到 Story Doc |
| **R-3** | Story 11.16 前后端改动必须原子部署 | 分步部署会导致运行时错误 | 确保同一 PR、同时 merge |
| **R-4** | Vite proxy 需要 cookie 配置调整（11.6） | 开发环境 httpOnly cookie 不生效 | 在 11.6 story doc 中明确 Vite 配置变更 |
| **R-5** | Story 11.9 装饰器方案需要逐个 DTO 添加 | 遗漏某个 DTO 字段 → 未受保护 | 创建 DTO checklist，确保所有写入 DTO 的 string 字段都覆盖 |

---

## 📐 Story 设计或执行顺序调整建议

### 调整 1：Story 11.6 估时调整
- **原估时：** 4-6h
- **建议估时：** 6-8h
- **原因：** 需包含 `apiFetch()` 包装器创建 + 51 处 fetch 替换 + Vite proxy 配置 + 双写过渡期实现

### 调整 2：Story 11.6 子任务分解
建议将 Story 11.6 分解为以下子任务（在 story doc 中明确）：
1. **Sub-1 (1h):** 创建 `apiFetch()` 包装器 + 批量替换 51 处 `fetch()` 调用（纯重构，行为不变）
2. **Sub-2 (2h):** 后端实现 Set-Cookie + cookie 读取（双写模式：cookie + Authorization header fallback）
3. **Sub-3 (1h):** 前端移除 localStorage 写入 + 测试 cookie 认证流程 + Vite proxy 配置
4. **Sub-4 (1h):** E2E auth 测试（登录、刷新、登出全流程）
5. **Sub-5 (1h):** 写 ADR-010 + 更新 auth 文档

### 调整 3：无需调整执行顺序
当前 Wave 1-5 的顺序合理，无需变更。

---

## 📝 需要新增的 ADR 列表

| ADR | 标题 | 关联 Story | 必要性 |
|-----|------|-----------|--------|
| **ADR-010** | JWT Token Transport: localStorage → httpOnly Cookie | 11.6 | 🔴 **必须** — 全局认证架构变更 |
| **ADR-011** | Global Input Sanitization Strategy | 11.9 | 🟡 **推荐** — 防御策略设计决策 |

**不需要 ADR 的变更：**
- Badge Visibility (11.4) — 标准 feature 字段添加，不涉及架构决策
- Pagination Standardization (11.16) — 接口规范化，不涉及架构层面选择
- ClaimPage Route (11.20) — 路由优化，影响面小

---

## ✅ 审核总结

| 审核项 | 结论 | 风险等级 | 条件 |
|--------|------|---------|------|
| 1. JWT httpOnly 迁移 (11.6) | ⚠️ 有条件通过 | 🔴 HIGH | 需创建 `apiFetch()` 包装器、写 ADR-010、估时调整为 6-8h |
| 2. HTML Sanitization Pipe (11.9) | ✅ 通过 | 🟡 MEDIUM | 推荐 `@SanitizeHtml()` 装饰器方案 + `sanitize-html` 库 |
| 3. Badge Visibility (11.4) | ✅ 通过 | 🟡 MEDIUM | 推荐 Prisma enum + 方案 B (assertion 可访问) |
| 4. Pagination 标准化 (11.16) | ⚠️ 有条件通过 | 🟡 MEDIUM | 前后端必须原子化修改 |
| 5. ClaimPage Route (11.20) | ✅ 通过 | 🟢 LOW | 注意路由声明顺序 |
| 6. 整体架构风险 | ✅ 可控 | 🟡 MEDIUM | 关注 R-1 (fetch 耦合) 和 R-2 (OB assertion 行为) |

### 最终判定

**APPROVED WITH CONDITIONS** — Sprint 11 backlog 架构设计合理，优先级正确，可进入开发阶段。需满足以下条件：

1. ✅ Story 11.6 估时调至 6-8h 并在 story doc 中包含 `apiFetch()` 子任务
2. ✅ Story 11.6 完成时提交 ADR-010
3. ✅ Story 11.4 story doc 中明确 PRIVATE badge 的 OB assertion 行为（推荐方案 B）
4. ✅ Story 11.16 前后端在同一 PR 中提交

---

*Reviewed by Winston (Architect Agent) on 2026-02-13.*  
*Reference: arch-review-brief.md, backlog.md, security-audit-2026-02.md, architecture-compliance-audit-2026-02.md, code-quality-audit-2026-02.md, project-context.md*
