# M365 用户隐私架构讨论记录

> **日期**: 2026-03-03  
> **参与者**: LegendZhu, SM Agent (Bob)  
> **状态**: 待决策 — 需与安全隐私部门讨论后确定方向  
> **关联**: Sprint 16 规划期间发起  

---

## 1. 背景

在 Sprint 16 规划期间，LegendZhu 提出了关于 M365 用户数据安全隐私的核心关切：

> "目前 M365 用户采取全部同步到 G-Credit 系统的方式。由于安全隐私考虑，只能在需要的时候才能从 M365 中取用户信息。"

由此引发了一系列架构层面的讨论，涵盖：
- 是否废弃 M365 Full Sync
- 是否废弃本地用户（密码登录）
- 是否完全不存储用户 PII

---

## 2. 当前架构现状

### 2.1 三条 M365 同步路径

| 路径 | 触发方式 | 数据范围 | 文件 |
|---|---|---|---|
| **Full Sync** | Admin 手动触发 `POST /api/admin/m365-sync` | 拉取 Azure AD 中 **所有用户**（分页 999/批） | `m365-sync.service.ts` → `runSync(FULL)` |
| **JIT Provisioning** | 用户首次 SSO 登录 | 仅同步**当前登录用户** | `auth.service.ts` → `ssoLogin()` → `createSsoUser()` + `syncUserFromGraph()` |
| **Login-Time Mini-Sync** | 用户再次 SSO 登录（距上次同步 >3 分钟） | 仅更新**当前登录用户** | `auth.service.ts` → `ssoLogin()` → `syncUserFromGraph()` |

### 2.2 Full Sync 是唯一的隐私问题

- Full Sync 调用 `getAllAzureUsers()` 拉取所有 Azure AD 用户，无论他们是否使用 G-Credit
- 包含：`displayName`, `mail`, `department`, `jobTitle`, `accountEnabled`, `id`
- 这意味着**从未登录 G-Credit 的员工数据也会被存入本地数据库**

JIT 和 Mini-Sync 是按需同步（on-demand），只同步实际登录的用户，符合隐私最小化原则。

### 2.3 本地用户（密码登录）

系统同时支持两种认证方式：
- **SSO 登录**: Azure AD → MSAL → `ssoLogin()` → JIT/Mini-Sync
- **密码登录**: 邮箱 + 密码 → `login()` → bcrypt 验证

密码登录涉及的存储：`passwordHash`, `failedLoginAttempts`, `lockedUntil`, `PasswordResetToken` 表。

### 2.4 User 表外键依赖（14 个 FK，9 个模型）

| 模型 | FK 字段 | 用途 |
|---|---|---|
| `Badge` | `recipientId`, `issuerId`, `revokedBy` | 徽章接收/颁发/撤销者 |
| `BadgeTemplate` | `createdBy`, `updatedBy` | 模板所有权（RBAC 核心） |
| `MilestoneConfig` | `createdBy` | 里程碑创建者 |
| `MilestoneAchievement` | `userId` | 里程碑达成者 |
| `EvidenceFile` | `uploadedBy` | 证据上传审计链 |
| `RefreshToken` | `userId` | 会话管理 |
| `UserRoleAuditLog` | `userId`, `performedBy` | 管理员审计日志 |
| `BulkIssuanceSession` | `issuerId` | 批量颁发会话 |
| `User`（自引用） | `managerId` | 上级经理层级关系 |

---

## 3. 讨论的三个方案

### 方案 A：精简身份表（Thin Identity Store）— 零 PII

**核心思路**: User 表只保留技术标识符，删除所有 PII 字段。用户姓名、邮箱等信息在 API 响应时实时查询 Graph API（带 Redis 缓存）。

```
本地存储:  id, azureId, role, isActive, managerId, lastLoginAt
不再存储:  email, firstName, lastName, department, jobTitle, passwordHash
显示信息:  实时 Graph API 查询 + Redis 缓存 (TTL ~15 分钟)
```

| 维度 | 评估 |
|---|---|
| PII 存储 | ❌ 零 PII |
| 开发成本 | ~3 Sprint |
| 风险 | 中等 |
| 数据完整性 | ✅ 外键保留（引用 Identity.id） |
| Graph API 依赖 | 运行时依赖（缓存缓解） |
| 数据库泄露影响 | 攻击者仅获得无意义的 UUID + 角色 |

### 方案 B：完全零存储 — 删除 User 表

**核心思路**: 完全不保留 User/Identity 表，所有 FK 改为存储 `azureId` 字符串。

| 维度 | 评估 |
|---|---|
| PII 存储 | ❌ 零 PII |
| 开发成本 | ~6+ Sprint（相当于重写） |
| 风险 | **极高** |
| 数据完整性 | ❌ 丢失外键约束 |
| Graph API 依赖 | 运行时关键路径依赖 |
| 角色管理 | 必须完全依赖 Azure AD 组（需 P1 许可证） |
| 历史审计 | 用户离开 Azure AD 后审计记录不可溯 |

**结论: 不推荐** — 代价极大，破坏关系数据模型。

### 方案 C：静态加密 PII

**核心思路**: 保持现有表结构，对 PII 字段做 AES-256-GCM 应用层加密。

| 维度 | 评估 |
|---|---|
| PII 存储 | ✅ 有（加密存储） |
| 开发成本 | ~1 Sprint |
| 风险 | 低 |
| 数据完整性 | ✅ 完全保留 |
| Graph API 依赖 | 无 |
| 数据库泄露影响 | 加密数据不可读（需同时拿到密钥） |
| 注意 | 数据仍存在本地，可能不满足"不存储"的严格要求 |

---

## 4. 建议的分步实施路径

### 第一步：废弃本地用户密码登录（~1 Sprint, ~7h）

独立于隐私方案，纯安全收益。

| 改动 | 内容 |
|---|---|
| 删除后端 | `register()`, `login()`, `requestPasswordReset()`, `resetPassword()`, `changePassword()` + 5 个 DTO |
| 删除 Schema | `PasswordResetToken` 表 + `passwordHash`, `emailVerified`, `failedLoginAttempts`, `lockedUntil` 字段 |
| 简化前端 | LoginPage 只保留 "Sign in with Microsoft" 按钮，删除邮箱/密码表单 |
| 改 E2E 测试 | 不再用 `register()` 创建测试用户，改为 DB 直插 + mock JWT |

**收益**: 
- 消除密码攻击面（暴力破解、密码泄露、重置令牌拦截）
- 认证安全完全委托给 Microsoft Entra ID
- 测试矩阵减半（只测 SSO 路径）
- 减少 ~500 行代码

**注意**: 此步骤完成后，用户 PII（邮箱、姓名等）**仍然存储在本地数据库中**。

### 第二步：精简身份表去除 PII（~3 Sprint）

在第一步基础上：

| 改动 | 内容 |
|---|---|
| User 表瘦身 | 删除 `email`, `firstName`, `lastName`, `department`, `jobTitle` |
| 新增 GraphUserResolver 服务 | 通过 Graph API `/users/{azureId}` 实时查询用户信息 |
| 新增 Redis 缓存层 | 缓存 Graph API 结果，TTL ~15 分钟 |
| 改造所有 API 响应 | 返回用户信息時通过 Resolver 填充 |
| 改造 `getRecipients()` | 从 Graph API 获取用户列表，不再查本地 User 表 |
| 改造 Admin 用户管理页面 | 从 Graph API 获取展示信息 |

### 第三步：废弃 Full Sync（~0.5 Sprint）

| 改动 | 内容 |
|---|---|
| 标记 `runSync(FULL)` 为 deprecated | 代码中加 `@deprecated` + 日志告警 |
| 前端隐藏 "Trigger M365 Sync" 按钮 | 或限制为 `GROUPS_ONLY` 模式 |
| 保留 JIT + Mini-Sync | 按需同步，隐私合规 |

---

## 5. 总结对比矩阵

| 问题 | 只做第一步 | 第一步 + 第二步 | 第一步 + 第三步 | 全部三步 |
|---|---|---|---|---|
| 本地存密码？ | ❌ 不存 | ❌ 不存 | ❌ 不存 | ❌ 不存 |
| 本地存 PII？ | ✅ **仍存** | ❌ 不存 | ✅ **仍存** | ❌ 不存 |
| 同步全量 M365 用户？ | ✅ **仍可** | ✅ **仍可** | ❌ 已废弃 | ❌ 已废弃 |
| 数据库泄露能识别个人？ | ✅ **能** | ❌ 不能 | ✅ **能** | ❌ 不能 |
| 工作量 | ~1 Sprint | ~4 Sprint | ~1.5 Sprint | ~4.5 Sprint |
| 安全收益 | ★★★ | ★★★ | ★★★ | ★★★ |
| 隐私收益 | ★ | ★★★★★ | ★★ | ★★★★★ |

---

## 6. 待决策事项

| # | 决策项 | 选项 |
|---|---|---|
| D1 | 隐私要求级别 | A) 不存密码就行 → 只做第一步<br>B) 不存任何 PII → 做第一步 + 第二步<br>C) 目前只做加密保护 → 方案 C |
| D2 | Full Sync 是否废弃 | A) 立即废弃<br>B) 保留但限制为 GROUPS_ONLY<br>C) 暂不改动 |
| D3 | 实施时间线 | A) 纳入 Sprint 16（追加 story）<br>B) 单独安排 Sprint 17<br>C) 放入后续 backlog |
| D4 | 开发环境无 Azure AD 的解决方案 | A) 保留 dev-only mock SSO endpoint<br>B) 所有开发者注册 Azure AD 测试租户<br>C) 使用 `.env` 开关切换 SSO/mock 模式 |
| D5 | 现有本地注册用户的迁移策略 | A) 数据库迁移脚本清理（如有）<br>B) 通知用户改用 SSO 登录<br>C) 保留只读数据，禁止密码登录 |

---

## 7. 讨论结论

> **待 LegendZhu 与安全隐私部门讨论后确定方向。**
>
> SM 推荐路径：**全部三步**（废弃密码 → 精简身份表 → 废弃 Full Sync），分步实施，每步可独立验证。
>
> 最快收益路径：**只做第一步**（废弃密码登录），~7h 完成，立即消除最大安全攻击面。
