# Sprint 11 Architecture Review Brief

**Reviewer:** Architect (Winston)  
**Requested by:** SM (Bob)  
**Date:** 2026-02-13  
**Sprint:** Sprint 11 — Security + Quality + Feature Hardening  
**Target Version:** v1.1.0

---

## 📋 审核请求

请审核 Sprint 11 完整 backlog，重点评估以下架构关注点。Backlog 位于：
- `gcredit-project/docs/sprints/sprint-11/backlog.md`

补充参考文档：
- `project-context.md` — 项目全局上下文
- `gcredit-project/docs/security/security-audit-2026-02.md` — 安全审计原文
- `gcredit-project/docs/architecture/architecture-compliance-audit-2026-02.md` — 架构合规审计
- `gcredit-project/docs/development/code-quality-audit-2026-02.md` — 代码质量审计

---

## 🔍 重点审核项

### 1. SEC-002: JWT httpOnly Cookie 迁移（Story 11.6）
**风险等级:** 高 — 影响全局认证架构

- 当前 JWT 存储在 localStorage，计划迁移到 httpOnly Cookie
- **需评估：**
  - CORS 配置变更（`credentials: 'include'` + 服务端 `Access-Control-Allow-Credentials`）
  - Vite dev proxy 对 Cookie 的透传是否需要调整
  - SameSite=Strict vs Lax 对跨站场景的影响
  - Refresh Token 的 Cookie path 隔离策略（`/api/auth/refresh` only）
  - 前后端同时变更的部署顺序风险
  - 是否需要写 ADR？
  - 是否影响已有的 E2E 测试中的 token 注入方式？

### 2. SEC-006: Global HTML Sanitization Pipe（Story 11.9）
**风险等级:** 中

- 计划在 NestJS 层全局拦截所有 string 类型 DTO 字段
- **需评估：**
  - 实现方式：Global Validation Pipe decorator vs 自定义 Transform Pipe vs Interceptor？
  - 是否会误杀合法内容（例如 Markdown 格式的 badge description、criteria text）？
  - DOMPurify 是否适合 Node.js 服务端使用（需要 `jsdom`），还是用 `sanitize-html`？
  - 性能影响：每个请求的每个 string 字段都走 sanitization？
  - 是否应该只对写操作（POST/PUT/PATCH）生效？

### 3. FR19: Badge Visibility — 数据库迁移方案（Story 11.4）
**风险等级:** 中

- Badge 表新增 `visibility` 字段（PUBLIC/PRIVATE, default: PUBLIC）
- **需评估：**
  - 新增 enum field vs 新增 boolean `isPublic`？
  - 是否需要数据库 enum 类型？还是用 string + 应用层校验？
  - 现有 badge 的 PUBLIC 默认值是否 non-breaking？
  - 对 badge 查询的索引影响（公开验证页需要过滤 PRIVATE）
  - 对 OB (Open Badge) assertion 端点的影响 — PRIVATE badge 的 assertion URL 是否仍然可访问？

### 4. CQ-007: 分页响应格式标准化（Story 11.16）
**风险等级:** 中 — 潜在 Breaking Change

- 计划将 5 个控制器的分页响应统一为 `PaginatedResponse<T>` 格式
- **需评估：**
  - 当前各端点的响应格式差异有多大？
  - 前端有多少处消费分页 API？变更影响面评估
  - 是否应该做版本化（v1/v2）以保持向后兼容？
  - 新格式 `{ data: T[], meta: { total, page, limit, totalPages } }` vs 当前格式的差异
  - 是否应该与前端在同一个 story 中同步修改？

### 5. Story 11.20: ClaimPage 新路由设计
**风险等级:** 低

- 计划新增 `POST /api/badges/claim` 路由，替代使用硬编码 nil UUID 的 `POST /api/badges/:id/claim`
- **需评估：**
  - NestJS 路由优先级：`POST /badges/claim` 必须声明在 `POST /badges/:id/claim` 之前
  - 是否会与现有路由冲突？（`/badges/:id` 的其他子路由）
  - API 设计一致性：RESTful 风格下 `claim` 作为动词路由是否合理？

### 6. 整体架构风险
- 23 个 stories 的依赖链是否有遗漏？
- 数据库迁移的回滚策略？
- 是否需要新的 ADR 来记录关键架构决策？

---

## 📤 期望输出

1. **每个审核项的架构建议**（具体技术方案推荐）
2. **新发现的风险或依赖**
3. **是否需要调整 story 设计或执行顺序**
4. **需要新增的 ADR 列表**
5. **审核结论：** APPROVED / APPROVED WITH CONDITIONS / NEEDS REVISION

---

**审核文件保存位置（如需）:** `gcredit-project/docs/sprints/sprint-11/arch-review-result.md`
