# Dev Prompt: Story 10.6c — UAT Test Plan & Seed Data Preparation

**Sprint:** 10  
**Branch:** `sprint-10/v1-release`  
**Estimate:** 6h  
**Dependencies:** Stories 10.6a, 10.6b, 10.6d complete  
**Risk Level:** 🟢 LOW (documentation + seed script, no production code changes)

---

## 目标

为 v1.0.0 发布前的手动 UAT 做全面准备。产出物包含：

1. **UAT 测试计划** — 覆盖全部 10 个 Epic 的 30+ 测试用例
2. **UAT Seed 脚本** — 一键填充 / 重置 UAT 测试数据
3. **已知限制文档** — 记录当前功能限制及 workaround
4. **UAT 账号参考卡** — 测试账号速查

---

## Step 1: UAT Test Plan 文档 (2.5h)

### 输出文件：`docs/sprints/sprint-10/uat-test-plan.md`

### 1.0 环境准备章节 (Environment Setup)

测试计划最前面必须包含环境准备章节：

```markdown
## Environment Setup

### Prerequisites
- Node.js 20.x, PostgreSQL 16, pnpm/npm
- Backend `.env` configured (see `.env.example`)
- M365 Dev Tenant accessible (for email/Teams tests)

### Steps
1. **Database reset & seed:**
   ```bash
   cd gcredit-project/backend
   npm run seed:reset
   ```
2. **Start backend:**
   ```bash
   npm run start:dev
   # Verify: http://localhost:3000/api/health returns { status: "ok" }
   ```
3. **Start frontend:**
   ```bash
   cd gcredit-project/frontend
   npm run dev
   # Verify: http://localhost:5173 loads login page
   ```
4. **JWT Token expiry (可选):**
   - 默认 Access Token 过期时间 15 分钟
   - UAT 期间如需延长，修改 `backend/.env`：
     ```
     JWT_ACCESS_EXPIRES_IN="4h"
     ```
   - 重启后端生效
5. **验证测试账号:**
   - 依次登录 Admin / Issuer / Manager / Employee 账号，确认均可成功登录
6. **浏览器要求:**
   - Chrome 最新版（推荐）
   - 分辨率：Desktop 1440×900, Mobile 375×812

### Test Accounts
| Role | Email | Password | Accessible Features |
|------|-------|----------|---------------------|
| Admin | admin@gcredit.com | password123 | All features (templates, issuance, analytics, user mgmt, revocation) |
| Issuer | issuer@gcredit.com | password123 | Badge templates + single/bulk issuance |
| Manager | manager@gcredit.com | password123 | Badge wallet + revocation |
| Employee | M365DevAdmin@2wjh85.onmicrosoft.com | password123 | Badge wallet only |
```

> **重要：** 使用项目现有的测试账号（seed.ts 中已创建），不要引入新的测试邮箱域名。Employee 使用 M365DevAdmin 账号，因为这是唯一真实可接收邮件的邮箱。

### 1.1 测试用例格式

每个测试用例使用以下格式：

```markdown
| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
```

### 1.2 测试用例覆盖范围（至少 30 个用例）

按 Epic 分组编写测试用例，以下是每个 Epic 的覆盖要求：

#### Epic 1: Infrastructure & Health (2 cases)
- **UAT-001:** Health check endpoint (`GET /api/health`)
- **UAT-002:** API availability (Swagger docs at `/api/docs`)

#### Epic 2: Authentication & User Management (5 cases)
- **UAT-003:** Admin login → Dashboard 显示 Admin 面板
- **UAT-004:** Employee login → Dashboard 仅显示 Wallet
- **UAT-005:** Logout → 清除 token，重定向到 login
- **UAT-006:** Password change (login → 修改密码 → 重新登录)
- **UAT-007:** RBAC 拦截测试 (Employee 访问 `/admin/badges/issue` 被重定向)

#### Epic 3: Badge Templates (4 cases)
- **UAT-008:** Admin 创建 DRAFT template
- **UAT-009:** Admin 激活 template (DRAFT → ACTIVE)
- **UAT-010:** Admin 归档 template (ACTIVE → ARCHIVED)
- **UAT-011:** Template 搜索 (按名称 / 类别)

#### Epic 4: Badge Issuance (4 cases)
- **UAT-012:** Issuer 通过 UI 发放单个 badge (`/admin/badges/issue`)
- **UAT-013:** 验证发放后 badge 状态为 PENDING
- **UAT-014:** Employee 认领 badge (PENDING → CLAIMED)
- **UAT-015:** 验证 Open Badges 2.0 assertion JSON-LD 格式

#### Epic 5: Employee Badge Wallet (3 cases)
- **UAT-016:** Employee 查看 wallet timeline view
- **UAT-017:** Badge detail modal (点击 badge → 显示完整信息)
- **UAT-018:** Evidence file 查看/下载

#### Epic 6: Badge Verification (3 cases)
- **UAT-019:** Public verification page (无需登录访问 `/verify/:id`)
- **UAT-020:** Baked badge PNG 下载（检查含嵌入 metadata）
- **UAT-021:** JSON-LD assertion 可通过 API 获取

#### Epic 7: Badge Sharing (3 cases)
- **UAT-022:** Email 分享 badge — **收件人填 `M365DevAdmin@2wjh85.onmicrosoft.com`**，在 Outlook 中验证收到邮件
- **UAT-023:** Sharing analytics — 分享后查看 analytics 记录
- **UAT-024:** Embeddable widget — 通过 API 获取 widget HTML

> **注意：** 邮件分享使用方案 B（真实发送）。收件人统一使用 `M365DevAdmin@2wjh85.onmicrosoft.com`。测试完成后可在 Outlook 中查看邮件内容和格式。

#### Epic 8: Bulk Issuance (3 cases)
- **UAT-025:** 下载 CSV template
- **UAT-026:** 上传有效 CSV → 预览 → 确认发放
- **UAT-027:** 上传无效 CSV → 显示错误报告

#### Epic 9: Badge Revocation (3 cases)
- **UAT-028:** Manager revoke badge → 选择原因 + notes
- **UAT-029:** Revoked badge 在 public verification page 显示撤销状态
- **UAT-030:** Revoked badge 在 wallet 中灰显 + 不可分享

#### Epic 10: Production Features (3 cases)
- **UAT-031:** Admin Dashboard — 统计数据显示（badge count, user count, trends）
- **UAT-032:** Badge search — 全局搜索功能
- **UAT-033:** Admin User Management — 查看/修改用户角色

#### Cross-Epic: Full Lifecycle (2 cases)
- **UAT-034:** 完整生命周期：创建 Template → Issue Badge → Claim → Share via Email → Verify → Revoke → Re-verify (revoked)
- **UAT-035:** Mobile 端完整流程：手机视口下登录 → Wallet → Badge Detail → Share

### 1.3 Teams 通知测试说明

在测试计划中，Teams 相关测试用例标记为 **SKIP**，并注明原因：

```markdown
> **SKIP:** TD-006 — Teams `ChannelMessage.Send` 权限未获得 tenant admin 批准。
> Email sharing 作为替代方案已验证。4 个 Teams 集成测试保持 skipped 状态。
```

---

## Step 2: UAT Seed 脚本 (2h)

### 输出文件：`backend/prisma/seed-uat.ts`

### 2.1 设计原则

- 使用 `upsert` 避免重复执行冲突
- 密码统一用 `password123`（与现有 seed.ts 一致）
- 利用现有用户（admin/issuer/manager/M365DevAdmin），不创建新的虚构邮箱
- Badge 数据涵盖多种状态：PENDING, CLAIMED, REVOKED, (含过期日期的)
- 所有 ID 使用固定 UUID（方便 UAT 时引用）

### 2.2 Seed 数据内容

```typescript
import { PrismaClient, UserRole, TemplateStatus, BadgeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting UAT seed data...\n');

  // ========================================
  // 1. USERS (4 roles, upsert)
  // ========================================
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gcredit.com' },
    update: { passwordHash, role: UserRole.ADMIN, isActive: true, emailVerified: true },
    create: {
      email: 'admin@gcredit.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      department: 'IT',
      isActive: true,
      emailVerified: true,
    },
  });

  const issuer = await prisma.user.upsert({
    where: { email: 'issuer@gcredit.com' },
    update: { passwordHash, role: UserRole.ISSUER, isActive: true, emailVerified: true },
    create: {
      email: 'issuer@gcredit.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Issuer',
      role: UserRole.ISSUER,
      department: 'HR',
      isActive: true,
      emailVerified: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@gcredit.com' },
    update: { passwordHash, role: UserRole.MANAGER, isActive: true, emailVerified: true },
    create: {
      email: 'manager@gcredit.com',
      passwordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      department: 'Engineering',
      isActive: true,
      emailVerified: true,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'M365DevAdmin@2wjh85.onmicrosoft.com' },
    update: { passwordHash, role: UserRole.EMPLOYEE, isActive: true, emailVerified: true },
    create: {
      email: 'M365DevAdmin@2wjh85.onmicrosoft.com',
      passwordHash,
      firstName: 'M365Dev',
      lastName: 'Admin',
      role: UserRole.EMPLOYEE,
      department: 'Development',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ 4 users created/updated');

  // ========================================
  // 2. BADGE TEMPLATES (5 templates)
  // ========================================
  // ... 5 ACTIVE templates with different categories
  // Use fixed UUIDs starting with 'uat-tmpl-...'

  // ========================================
  // 3. BADGES (10+ in various states)
  // ========================================
  // Distribute across users:
  // - Employee: 4 CLAIMED, 1 PENDING, 1 REVOKED
  // - Manager: 2 CLAIMED, 1 expired (expiresAt in the past)
  // - All issued by Issuer

  // ========================================
  // 4. EVIDENCE FILES (2-3 records)
  // ========================================
  // Link to existing badges, use placeholder blob URLs

  // ========================================
  // 5. MILESTONE CONFIGS (2 milestones)
  // ========================================
  // "First Badge" (BADGE_COUNT, threshold: 1)
  // "Five Badges" (BADGE_COUNT, threshold: 5)

  // ========================================
  // 6. AUDIT LOGS (3 entries for revocation)
  // ========================================
  // Record the revoked badge's audit trail

  console.log('\n🎉 UAT seed data complete!');
  console.log('\n📋 Quick Reference:');
  console.log('   Admin:    admin@gcredit.com / password123');
  console.log('   Issuer:   issuer@gcredit.com / password123');
  console.log('   Manager:  manager@gcredit.com / password123');
  console.log('   Employee: M365DevAdmin@2wjh85.onmicrosoft.com / password123');
}
```

> **上面是结构示意。** Dev 需要补充完整实现：5 个 template 的完整字段、10+ badge 的 assertionJson/recipientHash/claimToken/verificationId、evidence file 记录、milestone config。参考现有 `prisma/seed.ts` 和 `prisma/seed-story-4-5.ts` 的写法。

### 2.3 关键注意事项

1. **Badge 的 `assertionJson`** 必须是合法的 Open Badges 2.0 JSON-LD 结构：
   ```json
   {
     "@context": "https://w3id.org/openbadges/v2",
     "type": "Assertion",
     "id": "http://localhost:3000/api/verification/{verificationId}/assertion"
   }
   ```

2. **`recipientHash`** 使用 SHA-256：
   ```typescript
   const salt = 'gcredit-uat-salt';
   const recipientHash = crypto.createHash('sha256')
     .update(email + salt)
     .digest('hex');
   ```

3. **`verificationId`** 每个 badge 唯一，用固定 UUID（方便 UAT 时直接访问 verification page）

4. **`claimToken`** 仅 PENDING 状态的 badge 需要，用 32 位随机字符串

5. **Revoked badge** 需设置 `revokedAt`, `revokedBy`, `revocationReason` 字段

6. **Badge templates** 的 `imageUrl` 可用 `https://picsum.photos/400/400?random=N`

### 2.4 package.json 脚本

在 `backend/package.json` 的 `scripts` 中添加：

```json
{
  "seed:uat": "ts-node prisma/seed-uat.ts",
  "seed:reset": "npx prisma migrate reset --force && ts-node prisma/seed-uat.ts"
}
```

> **注意：** `seed:reset` 先执行 `prisma migrate reset --force`（清空数据库 + 重新运行所有 migration），然后执行 UAT seed。这确保干净的数据库状态。

---

## Step 3: JWT Token 过期配置 (0.5h)

### 3.1 当前配置

```
# backend/.env
JWT_ACCESS_EXPIRES_IN="15m"    # Access Token 15 分钟过期
JWT_REFRESH_EXPIRES_IN="7d"    # Refresh Token 7 天过期
```

Auth 模块读取 `JWT_ACCESS_EXPIRES_IN`：
```typescript
// auth.module.ts line 23
expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as StringValue,
```

### 3.2 UAT 配置操作

**无需修改代码。** 只需在 `.env.example` 加注释说明 UAT 期间如何调整：

在 `backend/.env.example` 的 JWT 配置区域添加注释：

```env
# JWT Configuration
JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_ACCESS_EXPIRES_IN="15m"        # Default: 15m. UAT: change to "4h" for extended sessions
JWT_REFRESH_EXPIRES_IN="7d"
```

在 UAT 测试计划的环境准备章节中已说明如何临时修改。

---

## Step 4: Known Limitations 文档 (0.5h)

### 输出文件：`docs/sprints/sprint-10/uat-known-limitations.md`

内容必须包含以下限制项：

```markdown
# G-Credit v1.0.0 — UAT Known Limitations

## Active Limitations

### LIM-001: Teams Channel Notifications (TD-006)
- **Impact:** Teams channel message 发送不可用
- **Root Cause:** Tenant admin 未批准 `ChannelMessage.Send` 权限
- **Workaround:** 使用 Email sharing 替代
- **Status:** 4 个 Teams 集成测试保持 skipped
- **Resolution:** 需 tenant admin 审批权限后重新启用

### LIM-002: Badge 发放仅限已注册用户
- **Impact:** Issuer/Admin 只能向系统内已注册用户发放 Badge
- **Root Cause:** Prisma schema `Badge.recipientId` 外键约束指向 `User.id`
- **Workaround:** UAT 期间使用 seed-uat.ts 预创建的 4 个测试用户
- **Future Plan:** FEAT-002 (Post-MVP) 邀请式发放，支持向任意邮箱发放

### LIM-003: Navbar 链接标签错误 (BUG-001)
- **Impact:** Navbar "My Wallet" 链接实际导航到 Dashboard (`/`)，无链接指向 `/wallet`
- **Workaround:** 直接在浏览器输入 `/wallet` 或通过 Dashboard Quick Actions 导航
- **Status:** 记录在 Story 10.8 pre-UAT known bugs，将在 UAT Bug Fix 阶段修复

### LIM-004: 批量发放同步处理限制 (TD-016)
- **Impact:** 每批最多 20 个 badge，超出需分多批处理
- **Root Cause:** 当前为同步处理，未集成 Redis + Bull Queue
- **Workaround:** UAT 时每次上传 ≤20 行的 CSV
- **Resolution:** Post-MVP 添加 async queue (P3 优先级)

### LIM-005: Email 分享发送范围
- **Impact:** Badge 分享邮件可发送到任意邮箱地址（无域名限制）
- **Scope:** 这是预期行为（Open Badges 标准的开放式分享设计）
- **UAT 策略:** 所有邮件测试收件人统一使用 `M365DevAdmin@2wjh85.onmicrosoft.com`
```

---

## Step 5: Story Doc Completion (0.5h)

完成后更新 story doc `10-6c-uat-test-plan-seed-data.md`：

1. 勾选所有 AC checkbox
2. 填写 Dev Agent Record（Agent Model, Completion Notes, File List）
3. 确保所有 Task checkbox 已勾选

### 验收检查清单

在提交前确认：

- [ ] `uat-test-plan.md` 至少 30 个测试用例，包含环境准备章节
- [ ] `seed-uat.ts` 可成功执行 `npm run seed:uat`，无错误
- [ ] `npm run seed:reset` 可一键清空重置
- [ ] 4 个测试账号均能成功登录（seed 后手动验证）
- [ ] `uat-known-limitations.md` 包含 5 个已知限制项
- [ ] `.env.example` 包含 JWT UAT 配置注释
- [ ] 所有文档使用英文编写（变量名、注释），中文仅用于说明性文字
- [ ] Story doc 所有 checkbox 已勾选

---

## 参考文件

| 文件 | 用途 |
|------|------|
| `project-context.md` | 全项目上下文，10 个 Epic 功能汇总 |
| `backend/prisma/schema.prisma` | 数据模型定义（410 行，15 个 model） |
| `backend/prisma/seed.ts` | 现有 seed（issuer + employee + 1 template + 1 badge） |
| `backend/prisma/seed-story-4-5.ts` | Story 4.5 seed（admin + employee + 2 templates） |
| `backend/.env` | 环境变量（JWT、Azure、Graph 配置） |
| `backend/src/modules/auth/auth.module.ts` | JWT 过期时间读取逻辑 |
| `docs/sprints/sprint-10/backlog.md` | Sprint 10 backlog（BUG-001, FEAT-002, TD-006） |
| `docs/testing/SKIPPED-TESTS-TRACKER.md` | Skipped tests（TD-006 Teams） |
| `docs/sprints/sprint-7/technical-debt-from-reviews.md` | 技术债务 master list |
