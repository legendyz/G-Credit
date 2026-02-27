# Production Deployment Plan — From Dev Laptop to Azure Cloud

**Created:** 2026-02-25  
**Author:** BMad Master (with LegendZhu)  
**Status:** 📋 PLANNING  
**Prerequisite:** Sprint 13 (Azure AD SSO) completion  
**Target Sprint:** Sprint 14 (Production Deployment)  
**Reference Architecture:** `gcredit-project/docs/architecture/system-architecture.md` — Phase 2 & Phase 3

---

## 📌 Context

G-Credit 目前所有前后端服务运行在开发者笔记本上（`localhost:3000` Backend + `localhost:5173` Frontend）。  
本文档规划从 **Phase 1（本地开发）** 迈向 **Phase 2（Pilot）** 和 **Phase 3（Production）** 的全部工作清单、优先级和实施顺序。

**当前状态：**
- ✅ v1.2.1，1,593 tests，12.5 个 Sprint 完成
- ✅ Azure PostgreSQL Flexible Server (B1ms) — 已使用
- ✅ Azure Blob Storage (gcreditdevstoragelz) — 已使用
- ✅ httpOnly Cookie auth、Account Lockout、RBAC — 已实现
- 🔄 Sprint 13 进行中 — Azure AD SSO + Session Management
- ❌ 无 CI/CD 流水线
- ❌ 无 Dockerfile
- ❌ 无生产环境资源（App Service、Key Vault、Redis 等）

---

## 一、基础设施层（Azure Cloud）

### 1.1 计算资源 — Azure App Service

| 需要做的事 | 说明 | 优先级 |
|---|---|---|
| 创建 Azure App Service（至少 B1 tier） | 托管 NestJS 后端 | P0 |
| 前端部署方案选择 | **方案A:** Azure Static Web Apps（推荐，免费 tier 有 CDN）<br>**方案B:** 同一 App Service 提供静态文件 | P0 |
| 配置自定义域名 | 例如 `gcredit.yourcompany.com` | P1 |
| 配置 SSL/TLS 证书 | Azure 托管证书（免费）或企业证书 | P1 |

### 1.2 数据库 — 升级 PostgreSQL

当前状态：Azure PostgreSQL Flexible Server (B1ms, 1 vCore, 2GB RAM, `gcredit-dev-db-lz`)

| 需要做的事 | 说明 | 优先级 |
|---|---|---|
| 创建独立生产 PostgreSQL 实例 | 与 dev 环境完全隔离 | P0 |
| 评估是否需要升级到 General Purpose D2s | 生产用户 >100 必须升级（2 vCore, 8GB RAM，~$150/月） | P1 |
| 启用高可用（HA） | Zone-redundant HA 保证 99.99% SLA | P1 |
| 配置生产级备份策略 | 从 7 天扩展到 35 天 | P1 |
| 配置防火墙规则 | 仅允许 App Service 访问，关闭公网直连 | P0 |

### 1.3 存储 — Azure Blob Storage

当前状态：`gcreditdevstoragelz`（开发账户，LRS 冗余）

| 需要做的事 | 说明 | 优先级 |
|---|---|---|
| 创建生产存储账户 | 例如 `gcreditprodstoragelz`，GRS 冗余 | P0 |
| 配置 CDN | 加速 badge image 全球分发 | P2 |
| 迁移现有数据 | 从 dev 容器迁移到 prod 容器 | P1 |

### 1.4 新增 Azure 服务

| 服务 | 用途 | 估算费用 | 优先级 |
|---|---|---|---|
| **Azure Key Vault** | 管理 JWT_SECRET、数据库密码、API 密钥 | ~$5/月 | **P0 必须** |
| **Azure Cache for Redis (Basic C0)** | 会话缓存、Badge 模板缓存、Bull 队列后端 | ~$20/月 | P1 |
| **Azure Application Insights** | APM 监控、错误日志、性能追踪 | ~$25/月 | P1 |
| **Azure Service Bus (Basic)** | 异步任务（批量发证、邮件队列、Webhook） | ~$10/月 | P2 |

---

## 二、CI/CD 流水线

当前状态：**完全没有 CI/CD**，没有 Dockerfile。

| 需要做的事 | 说明 | 优先级 |
|---|---|---|
| 创建 `Dockerfile`（Backend） | NestJS 生产构建 + `node dist/src/main` | P0 |
| 创建 `Dockerfile`（Frontend） | `vite build` → nginx 或 Azure Static Web Apps CLI | P0 |
| 创建 `docker-compose.yml` | 本地集成测试环境（可选） | P2 |
| 配置 GitHub Actions 流水线 | `push to main` → Build → Test → Deploy | P0 |
| 配置环境分离 | `dev` / `staging` / `production` 三套环境变量 | P0 |
| 配置 Azure Container Registry（可选） | 如果用 Docker 部署而非 App Service 直接部署 | P2 |

**推荐的 GitHub Actions 流水线：**
```
PR → Lint + Type Check + Unit Tests → Build
Merge to main → Build → E2E Tests → Deploy to Staging → Deploy to Production
```

---

## 三、安全加固

参考：`gcredit-project/docs/security/security-audit-2026-02.md`

| 项目 | 当前状态 | 需要做的事 | 优先级 |
|---|---|---|---|
| JWT Secret | `.env` 硬编码 | 迁移到 Azure Key Vault，使用 256-bit 强随机密钥 | P0 |
| HTTPS | 本地 HTTP | App Service 强制 HTTPS，HSTS header | P0 |
| CORS | `localhost` 白名单 | 修改为生产域名 | P0 |
| 数据库连接 | 需确认 SSL | 确认 `?sslmode=require` | P0 |
| 硬编码 URL | 3 个 fallback URL（ARCH-DEV-005） | 全部改为环境变量 | P0 |
| Swagger | `NODE_ENV !== 'production'` 时关闭 | ✅ 已实现（Sprint 11, Story 11.3） | — |
| Cookie 安全 | httpOnly cookies ✅ | 生产确保 `Secure=true`、`SameSite=Lax` | P0 |
| 文件上传 | Magic-byte 校验 ✅ | 生产确认生效 | P1 |
| 账号锁定 | ✅ 已实现（Sprint 11, Story 11.6） | 确认生产参数合理 | P1 |

---

## 四、环境变量管理

当前 `.env` 中的关键变量需要生产化：

```env
# ===== 必须更改 =====
NODE_ENV="production"
JWT_SECRET="<从 Key Vault 读取，256-bit 随机>"
JWT_REFRESH_SECRET="<从 Key Vault 读取>"
DATABASE_URL="<生产数据库连接串，sslmode=require>"
AZURE_STORAGE_CONNECTION_STRING="<生产存储账户>"

# ===== 必须设置 =====
FRONTEND_URL="https://gcredit.yourcompany.com"
BACKEND_URL="https://api.gcredit.yourcompany.com"
CORS_ORIGINS="https://gcredit.yourcompany.com"

# ===== Sprint 13 SSO（完成后设置） =====
AZURE_SSO_CLIENT_ID="<生产 App Registration>"
AZURE_SSO_CLIENT_SECRET="<从 Key Vault 读取>"
AZURE_SSO_REDIRECT_URI="https://api.gcredit.yourcompany.com/api/auth/sso/callback"
AZURE_TENANT_ID="afc9fe8f-1d40-41fc-9906-e001e500926c"
```

**管理方式：**
- 开发环境：`.env` 文件（已在 `.gitignore`）
- Staging/Production：Azure App Service Configuration → Key Vault References

---

## 五、数据库迁移策略

| 需要做的事 | 说明 | 优先级 |
|---|---|---|
| 创建生产数据库实例 | 全新实例（不复用 dev） | P0 |
| 运行 `prisma migrate deploy` | 在生产库执行所有 migration（**不用** `prisma migrate dev`） | P0 |
| 创建生产种子数据 | Admin 账户、默认角色、初始 badge 模板 | P0 |
| 数据备份计划 | 自动备份 + 手动备份脚本 | P1 |

**重要提醒：**
- 生产环境使用 `prisma migrate deploy`（仅执行已有 migration，不会生成新的）
- 开发种子数据（`seed-uat.ts`）不应用于生产，需创建生产专用种子脚本

---

## 六、监控与运维

| 需要做的事 | 说明 | 优先级 |
|---|---|---|
| Azure Application Insights | 前后端 APM + 错误追踪 | P1 |
| 健康检查端点 | `GET /api/health`（确认已有） | P0 |
| 日志聚合 | 结构化日志 → Application Insights | P1 |
| 告警规则 | 5xx 错误率 > 1%、响应时间 > 2s、数据库连接异常 | P1 |
| Uptime 监控 | Azure Monitor 或第三方（UptimeRobot） | P2 |

---

## 七、性能优化

| 需要做的事 | 说明 | 优先级 |
|---|---|---|
| 前端生产构建 | `vite build` 输出压缩、分片、tree-shaking | P0（build 命令已有） |
| gzip/Brotli 压缩 | App Service 或 nginx 层启用 | P1 |
| 数据库索引审查 | 确认查询 hotpath 有合适索引 | P1 |
| Badge 图片 CDN | Azure CDN 或 Azure Front Door | P2 |
| Redis 缓存层 | Badge 模板、用户权限等热数据 | P2 |

---

## 八、成本估算

| 阶段 | Azure 服务 | 月费用 | 说明 |
|---|---|---|---|
| **Phase 1: MVP Dev（当前）** | PostgreSQL + Blob Storage | **~$20** | 仅开发用 |
| **Phase 2: Pilot（50用户）** | + App Service (B1) | **~$35** | 内部试点 |
| **Phase 3: Production（500-5000用户）** | 全套 Azure 服务 | **~$285** | 企业级平台 |

**Phase 3 费用明细：**
- PostgreSQL General Purpose D2s: ~$150
- App Service Standard S1: ~$70
- Redis Basic C0: ~$20
- Application Insights: ~$25
- Key Vault: ~$5
- Service Bus Basic: ~$10
- Blob Storage + CDN: ~$5

---

## 九、建议实施顺序

| 阶段 | 工作内容 | 预估时间 | 前置依赖 |
|---|---|---|---|
| **Step 1** | 完成 Sprint 13（Azure AD SSO + Session） | 当前进行中 | — |
| **Step 2** | Azure Key Vault + 环境变量生产化 | 2 天 | Step 1 |
| **Step 3** | 创建生产 Azure 资源（App Service + 生产 DB + 生产 Storage） | 1 天 | Step 2 |
| **Step 4** | 编写 Dockerfile + GitHub Actions CI/CD | 3-5 天 | Step 3 |
| **Step 5** | 安全加固（CORS、HTTPS、硬编码清理） | 2 天 | Step 3 |
| **Step 6** | 数据库迁移 + 生产种子数据 | 1 天 | Step 3 |
| **Step 7** | Application Insights 接入 + 告警规则 | 2 天 | Step 4 |
| **Step 8** | Redis 缓存 + CDN（可与 Step 7 并行） | 3 天 | Step 4 |
| **Step 9** | UAT 在 staging 环境执行 | 2-3 天 | Step 5 + Step 6 |
| **Step 10** | 正式上线 + 监控观察期 | 1 天 | Step 9 |

**总预估：15-20 个工作日（约 3-4 周）**

---

## 十、关联文档

| 文档 | 路径 | 关系 |
|---|---|---|
| 系统架构（Phase 1-3 策略） | `docs/architecture/system-architecture.md` | 架构蓝图来源 |
| 安全审计报告 | `docs/security/security-audit-2026-02.md` | 安全加固清单来源 |
| 基础设施清单 | `docs/setup/infrastructure-inventory.md` | 当前 Azure 资源清单 |
| 架构合规审计 | `docs/architecture/architecture-compliance-audit-2026-02.md` | ARCH-DEV-005 硬编码问题 |
| Sprint 13 Backlog | `docs/sprints/sprint-13/backlog.md` | SSO 前置工作 |
| Epic 规划 | `docs/planning/epics.md` | Epic 13 (SSO) + 未来 Epic 规划 |

---

## 📝 Notes

- 本文档将作为 Sprint 14 规划的输入（类似 `sprint-11-candidate-list.md` 的作用）
- 实施顺序可根据团队资源和业务优先级调整
- Phase 2（Pilot）可作为中间里程碑，先服务 50 人内部试点
- 所有 Azure 资源创建后应更新 `docs/setup/infrastructure-inventory.md`
