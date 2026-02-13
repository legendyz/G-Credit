# Sprint 11 — Wave 2 Dev Prompt

**Wave:** 2 of 5 — Security Hardening  
**Sprint Branch:** `sprint-11/security-quality-hardening`  
**Baseline Commit:** `537f946`  
**Estimated Time:** ~14-19h  
**Test Baseline:** Backend 537 + Frontend 527 = **1064 tests**

---

## 🎯 Wave 2 目标

完成全部安全加固 Story，消除所有 Security Audit 遗留 P0/P1 风险项。

**验收标准：**
- [ ] 账户锁定：5 次失败后锁定 30 分钟
- [ ] 文件上传 magic-byte 验证（防 MIME 欺骗）
- [ ] 日志 PII 脱敏（25+ 处明文邮箱）
- [ ] 全局 HTML 消毒装饰器（防 XSS）
- [ ] JWT 迁移到 httpOnly cookie（防 token 盗取）+ ADR-010
- [ ] 全部测试通过（0 regressions）
- [ ] Prettier + ESLint 0 errors

---

## Story 11.1: SEC-001 — Account Lockout (Failed Login Counter + Lock)

**预估:** 2-3h | **优先级:** 🔴 CRITICAL

### 当前状态
**文件:** `backend/src/modules/auth/auth.service.ts` L64-142

当前 `login()` 流程：
1. `findUnique({ where: { email } })` 查找用户
2. 检查 `user.isActive`
3. `bcrypt.compare()` 验证密码
4. 失败时：仅 log warning + 抛 `UnauthorizedException('Invalid credentials')`
5. 成功时：生成 JWT + 更新 `lastLoginAt`

**L86-89 注释：** `// Rate limiting deferred to Phase 2 — failed attempts logged for monitoring`

**User Model** (`prisma/schema.prisma` L20-66)：**无 lockout 相关字段**。

### 实现方案

#### 1. Prisma Schema — 新增 lockout 字段
**文件:** `backend/prisma/schema.prisma` — User model

在 `lastLoginAt` 字段后新增：

```prisma
failedLoginAttempts Int       @default(0)
lockedUntil         DateTime?
```

运行：
```bash
cd gcredit-project/backend
npx prisma migrate dev --name add-account-lockout-fields
```

#### 2. auth.service.ts — 增强 login() 方法
**文件:** `backend/src/modules/auth/auth.service.ts`

**常量定义（类顶部或 login 方法内）:**
```typescript
private readonly MAX_LOGIN_ATTEMPTS = 5;
private readonly LOCKOUT_DURATION_MINUTES = 30;
```

**修改 login() 流程（L64-142）:**

在步骤 2（检查 isActive）之后，步骤 3（验证密码）之前，新增锁定检查：

```typescript
// 2.5. Check if account is locked
if (user.lockedUntil) {
  if (user.lockedUntil > new Date()) {
    // Still locked — 不暴露剩余时间
    throw new UnauthorizedException('Invalid credentials');
  }
  // Lock expired — reset (will be fully reset on successful login below)
}
```

**修改密码验证失败逻辑（L85-91）:**

```typescript
if (!isPasswordValid) {
  const attempts = user.failedLoginAttempts + 1;
  const updateData: any = { failedLoginAttempts: attempts };

  if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
    updateData.lockedUntil = new Date(
      Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
    );
    this.logger.warn(
      `[SECURITY] Account locked after ${attempts} failed attempts: user ${user.id}`,
      'AccountLockout',
    );
  } else {
    this.logger.warn(
      `Failed login attempt ${attempts}/${this.MAX_LOGIN_ATTEMPTS} for user ${user.id}`,
      'LoginAttempt',
    );
  }

  await this.prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  // 始终返回通用错误 — 不暴露账户存在性
  throw new UnauthorizedException('Invalid credentials');
}
```

**修改登录成功逻辑（步骤 7 更新 lastLoginAt）:**

```typescript
// 7. Update lastLoginAt + reset lockout counters
await this.prisma.user.update({
  where: { id: user.id },
  data: {
    lastLoginAt: new Date(),
    failedLoginAttempts: 0,
    lockedUntil: null,
  },
});
```

#### 3. 安全要点
- **不暴露账户存在性：** 无论用户不存在、被锁定还是密码错误，统一返回 `'Invalid credentials'`
- **不暴露剩余锁定时间：** 不返回 "请在 X 分钟后重试"
- **日志中使用 user.id 而非 email：** 符合 Story 11.8 PII 脱敏方向
- **自动解锁：** lockedUntil 过期后自动允许登录尝试

#### 4. 单元测试
**文件:** `backend/src/modules/auth/auth.service.spec.ts` — 新增 describe block

测试场景：
```
- 正常登录成功 → failedLoginAttempts 重置为 0
- 密码错误 → failedLoginAttempts +1
- 第 5 次失败 → lockedUntil 被设置
- 锁定期间 → 正确密码也被拒绝（返回 Invalid credentials）
- 锁定过期后 → 可以正常登录
- 用户不存在 → 返回 Invalid credentials（不暴露）
```

### 验收
- [ ] 连续 5 次错误密码后，账户被锁定
- [ ] 锁定期间即使正确密码也返回 `Invalid credentials`
- [ ] 30 分钟后自动解锁，可正常登录
- [ ] 登录成功后 `failedLoginAttempts` 重置为 0
- [ ] 所有错误场景返回统一的 `Invalid credentials`（无信息泄露）
- [ ] 日志记录使用 user.id 而非明文邮箱
- [ ] 新增单元测试覆盖全部锁定逻辑
- [ ] Prisma migration 成功运行

---

## Story 11.2: SEC-005 — File Upload Magic-Byte Validation

**预估:** 2-3h | **优先级:** 🔴 CRITICAL

### 当前状态
项目有 **3 个上传端点**，均仅检查 `file.mimetype`（客户端可伪造）：

| 端点 | 控制器 | 验证位置 | 允许类型 |
|------|--------|---------|---------|
| `POST /badge-templates` | `badge-templates.controller.ts` L143-156 | `fileFilter` + `blob-storage.service.ts` `validateImage()` | jpeg, png, gif, webp |
| `POST /badges/:id/evidence` | `evidence.controller.ts` L37 | `evidence.service.ts` L18-28 | pdf, png, jpeg, doc, docx |
| `POST /bulk-issuance/upload` | `bulk-issuance.controller.ts` L104 | Service 层 | csv, txt |

**`sharp`** 已安装（用于图片元数据），可用于图片 magic-byte 验证。

### 实现方案

#### 1. 安装 file-type 依赖
```bash
cd gcredit-project/backend
npm install file-type@16.5.4
```

> **注意：** `file-type` v17+ 是 ESM-only，NestJS (CommonJS) 需要 v16.x。如果 v16 有兼容问题，可改用手动 magic-byte 检查（见备选方案）。

**备选方案（无外部依赖）— 推荐：**

创建自定义 magic-byte 校验工具，不引入新依赖：

```typescript
// backend/src/common/utils/magic-byte-validator.ts

export interface MagicByteResult {
  detected: string | null; // e.g. 'image/png'
  isValid: boolean;
}

const SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    bytes: [0x50, 0x4b, 0x03, 0x04], // PK (ZIP-based)
  },
];

export function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;
    const match = sig.bytes.every((b, i) => buffer[offset + i] === b);
    if (match) {
      // WebP needs additional RIFF+WEBP check
      if (sig.mime === 'image/webp') {
        const webpTag = buffer.slice(8, 12).toString('ascii');
        if (webpTag !== 'WEBP') continue;
      }
      return sig.mime;
    }
  }
  return null;
}

export function validateMagicBytes(
  buffer: Buffer,
  declaredMime: string,
  allowedMimes: string[],
): MagicByteResult {
  const detected = detectMimeFromBuffer(buffer);
  // Normalize jpeg variants
  const normalize = (m: string) => m.replace('image/jpg', 'image/jpeg');
  const normalizedDeclared = normalize(declaredMime);
  const normalizedDetected = detected ? normalize(detected) : null;

  const isValid =
    normalizedDetected !== null &&
    normalizedDetected === normalizedDeclared &&
    allowedMimes.map(normalize).includes(normalizedDetected);

  return { detected: normalizedDetected, isValid };
}
```

#### 2. blob-storage.service.ts — 图片上传增强
**文件:** `backend/src/common/services/blob-storage.service.ts`

在 `validateImage()` 方法（L216-232）中添加 magic-byte 检查：

```typescript
private validateImage(file: Express.Multer.File): void {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const maxSize = 2 * 1024 * 1024;

  // 1. MIME type check (existing)
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException(
      'Invalid image format. Only PNG and JPG images are allowed.',
    );
  }

  // 2. Size check (existing)
  if (file.size > maxSize) {
    throw new BadRequestException(
      'Image size exceeds 2MB limit. Please upload a smaller image.',
    );
  }

  // 3. Magic-byte validation (NEW)
  const { detected, isValid } = validateMagicBytes(
    file.buffer,
    file.mimetype,
    allowedTypes,
  );
  if (!isValid) {
    throw new BadRequestException(
      `File content does not match declared type. Detected: ${detected || 'unknown'}`,
    );
  }
}
```

#### 3. evidence.service.ts — 证据文件上传增强
**文件:** `backend/src/evidence/evidence.service.ts`

在文件验证逻辑中同样添加 magic-byte 校验。注意 `.doc` (legacy Word) 使用 OLE compound document 签名 `[0xD0, 0xCF, 0x11, 0xE0]`，可以额外加入 SIGNATURES 数组，或者对 `.doc` 文件仅做 MIME 检查（因为 legacy 格式复杂）。

**简化策略：** 对 PDF 和图片做 magic-byte 检查，对 DOCX 检查 ZIP header (`PK`)，对 legacy `.doc` 保留 MIME-only 检查。

#### 4. bulk-issuance — CSV 上传
CSV/TXT 是纯文本格式，没有可靠的 magic-byte 签名。**保持现有验证即可**（检查文件扩展名 + MIME + 内容解析）。

#### 5. 单元测试
**文件:** `backend/src/common/utils/magic-byte-validator.spec.ts`

```
- 合法 JPEG → detected = image/jpeg, isValid = true
- 合法 PNG → detected = image/png, isValid = true
- 合法 WebP → detected = image/webp, isValid = true
- 合法 PDF → detected = application/pdf, isValid = true
- 伪造文件（PNG 扩展名 + JPEG 内容）→ isValid = false
- 伪造文件（JPEG MIME + 纯文本内容）→ isValid = false
- 空文件 → detected = null, isValid = false
- DOCX (ZIP header) → detected = application/vnd.openxmlformats..., isValid = true
```

同时更新 `blob-storage.service.spec.ts`（如果存在）测试 validateImage 增强逻辑。

### 验收
- [ ] 上传合法 JPEG/PNG → 正常接受
- [ ] 上传 MIME 伪造文件（如 .txt 改 .jpg）→ 被拒绝，返回错误信息
- [ ] 上传真实 JPEG 但 MIME 声明为 PNG → 被拒绝
- [ ] Evidence 上传 PDF → 正常接受（magic-byte 验证）
- [ ] CSV 上传不受影响
- [ ] 现有上传功能无 regression
- [ ] 单元测试覆盖全部文件类型 + 伪造场景

---

## Story 11.8: SEC-004 — Log PII Sanitization (25+ Cleartext Emails)

**预估:** 2h | **优先级:** 🟡 LOW

### 当前状态
经代码审计，**25+ 处日志语句**包含明文邮箱地址，分布在 7 个文件中：

| 文件 | 数量 | 示例 |
|------|------|------|
| `auth.service.ts` | ~10 | `Successful login: ${user.email}`, `[AUDIT] Password reset requested: ${user.email}` |
| `admin-users.controller.ts` | ~5 | `Admin ${req.user.email} listing users` |
| `admin-users.service.ts` | 1 | `User ${result.email} ${action} by admin` |
| `email.service.ts` | 2 | `Email sent to ${options.to}` |
| `graph-email.service.ts` | 1 | `Sending email: ${subject} → ${toEmails.join(', ')}` |
| `teams-badge-notification.service.ts` | ~5 | `Badge issuance email sent to ${recipient.email}` |
| `badge-sharing.service.ts` | 1 | `Would send to: ${dto.recipientEmail}` |
| `m365-sync.service.ts` | ~3 | `Deactivated user: ${localUser.email}` |

### 实现方案

#### 1. 创建 PII 脱敏工具
**文件:** `backend/src/common/utils/log-sanitizer.ts`

```typescript
/**
 * Mask email for logging: john.doe@company.com → j***@company.com
 * 保留首字符 + 完整域名（便于问题排查）
 */
export function maskEmailForLog(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}

/**
 * Mask user identifier for logging
 * 优先使用 user ID (UUID)，如无则脱敏邮箱
 */
export function safeUserRef(user: { id?: string; email?: string }): string {
  if (user.id) return `user:${user.id}`;
  if (user.email) return maskEmailForLog(user.email);
  return 'unknown-user';
}
```

#### 2. 逐文件替换
对每个文件中的明文邮箱引用，替换为脱敏版本：

**auth.service.ts** — 优先使用 `user.id` 代替 `user.email`：
```typescript
// 替换前
this.logger.log(`Successful login: ${user.email} (${user.id}, role: ${user.role})`);
// 替换后
this.logger.log(`Successful login: user:${user.id} (role: ${user.role})`);

// 替换前
this.logger.warn(`Failed login attempt for user: ${dto.email}`);
// 替换后（login 时可能还没有 user 对象，用脱敏邮箱）
this.logger.warn(`Failed login attempt for: ${maskEmailForLog(dto.email)}`);

// 替换前
this.logger.log(`[AUDIT] Password reset requested: ${user.email}`);
// 替换后
this.logger.log(`[AUDIT] Password reset requested: user:${user.id}`);
```

**admin-users.controller.ts** — `req.user` 有 `userId` 属性：
```typescript
// 替换前
this.logger.log(`Admin ${req.user.email} listing users`);
// 替换后
this.logger.log(`Admin user:${req.user.userId} listing users`);
```

**email.service.ts / graph-email.service.ts** — 邮件发送目标需部分保留域名：
```typescript
// 替换前
this.logger.log(`Email sent to ${options.to}`);
// 替换后
this.logger.log(`Email sent to ${maskEmailForLog(options.to as string)}`);
```

**m365-sync.service.ts / teams-badge-notification.service.ts** — 同理替换。

#### 3. 处理原则
- **有 user.id 时**：用 `user:${user.id}`（可追溯且无 PII）
- **仅有邮箱时**（如 login dto）：用 `maskEmailForLog(email)`
- **多邮箱拼接时**（如 toEmails.join）：逐个脱敏 `.map(maskEmailForLog).join(', ')`
- **不修改 error stack traces**：NestJS 默认不在 stack 中包含用户数据

#### 4. 单元测试
**文件:** `backend/src/common/utils/log-sanitizer.spec.ts`

```
- maskEmailForLog('john@example.com') → 'j***@example.com'
- maskEmailForLog('a@b.com') → 'a***@b.com'
- maskEmailForLog('') → '***'
- maskEmailForLog(null/undefined) → '***'
- safeUserRef({ id: 'uuid-123', email: 'x@y.com' }) → 'user:uuid-123'
- safeUserRef({ email: 'x@y.com' }) → 'x***@y.com'
- safeUserRef({}) → 'unknown-user'
```

### 验收
- [ ] `grep -rn "\.email\}" backend/src/ | grep -i "log\|warn\|error"` — 0 明文邮箱
- [ ] 全部日志使用 `user:${id}` 或 `maskEmailForLog()` 格式
- [ ] 日志仍可用于问题排查（保留域名、用户 ID）
- [ ] 单元测试覆盖 maskEmailForLog + safeUserRef
- [ ] 现有测试通过（尤其 auth.service.spec.ts）

---

## Story 11.9: SEC-006 — Global HTML Sanitization Decorator

**预估:** 2-3h | **优先级:** 🟡 MEDIUM

### 当前状态
- `sanitize-html` **已安装**（package.json L57: `"sanitize-html": "^2.17.0"`）
- 仅在 `csv-validation.service.ts` 中局部使用
- **主应用无全局 HTML 消毒**
- `main.ts` L233-237 的 `ValidationPipe` 配置了 `whitelist`, `forbidNonWhitelisted`, `transform`
- backend 有 **42 个 DTO 文件**，写操作 DTO 约 10+ 个

### 实现方案（Arch Review 确认：@SanitizeHtml() 装饰器方案）

#### 1. 创建 @SanitizeHtml() 装饰器
**文件:** `backend/src/common/decorators/sanitize-html.decorator.ts`

```typescript
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

/**
 * 装饰器：自动清除字符串字段中的 HTML 标签
 * 使用 sanitize-html 库 (allowedTags: [])
 * 仅对写操作 DTO 的 @Body() 字段使用
 */
export function SanitizeHtml(): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  });
}
```

#### 2. 应用到所有写操作 DTO

以下 DTO 的 **所有 `@IsString()` 字段**需加 `@SanitizeHtml()`：

| DTO 文件 | 字段 | 操作 |
|---------|------|------|
| `badge-templates/dto/badge-template.dto.ts` | `name`, `description`, `category` | POST, PUT |
| `skills/dto/skill.dto.ts` | `name`, `description` | POST, PUT |
| `modules/auth/dto/register.dto.ts` | `firstName`, `lastName` | POST |
| `modules/auth/dto/update-profile.dto.ts` | `firstName`, `lastName` | PATCH |
| `badge-sharing/dto/share-badge-email.dto.ts` | `message` | POST |
| `badge-sharing/dto/share-badge-teams.dto.ts` | `message` | POST |
| `admin-users/dto/update-user-department.dto.ts` | `department` | PATCH |
| `milestones/dto/milestone.dto.ts` | `name`, `description` | POST, PUT |
| `skill-categories/dto/skill-category.dto.ts` | `name`, `description` | POST, PUT |
| `badge-templates/dto/issuance-criteria.dto.ts` | criteria text fields | POST, PUT |

**不加 @SanitizeHtml() 的字段：**
- `email`、`password` — 这些有专用验证（@IsEmail, 密码不应被 sanitize）
- GET `@Query()` 参数 — 不写入数据库，不需要消毒
- `recipientEmail` — 邮箱格式，不含 HTML 风险

示例（badge-template.dto.ts）：
```typescript
import { SanitizeHtml } from '../../common/decorators/sanitize-html.decorator';

export class CreateBadgeTemplateDto {
  @IsString()
  @IsNotEmpty()
  @SanitizeHtml()
  name: string;

  @IsString()
  @IsOptional()
  @SanitizeHtml()
  description?: string;

  @IsString()
  @IsOptional()
  @SanitizeHtml()
  category?: string;
}
```

#### 3. ValidationPipe transform 确认
**文件:** `backend/src/main.ts` L233-237

当前已配置 `transform: true`，这是 `class-transformer` 装饰器生效的前提。**无需修改 main.ts。**

#### 4. 单元测试
**文件:** `backend/src/common/decorators/sanitize-html.decorator.spec.ts`

```
- 纯文本 → 保持不变
- '<script>alert("xss")</script>' → '' (空字符串)
- '<b>Bold</b> text' → 'Bold text'
- '<img src="x" onerror="alert(1)">' → ''
- '  spaces  ' → 'spaces' (trimmed)
- null/undefined → 原值返回
- 数字 → 原值返回
- 嵌套标签 '<div><script>x</script></div>' → ''
```

集成测试建议：通过 E2E 或 controller spec 发送含 HTML 的 badge template name，确认存储后 HTML 标签已被清除。

### 验收
- [ ] 创建 `@SanitizeHtml()` 装饰器基于 `sanitize-html` 库
- [ ] 所有写操作 DTO 的 string 字段添加 `@SanitizeHtml()`（email、password 除外）
- [ ] 发送 `<script>alert('xss')</script>` 作为 badge name → 存储为空或纯文本
- [ ] 现有功能不受影响（正常文本无变化）
- [ ] 单元测试覆盖 XSS payload 过滤
- [ ] 创建 DTO checklist 确保所有写入 DTO 都已覆盖

---

## Story 11.6: SEC-002 — JWT Migration to httpOnly Cookies

**预估:** 6-8h | **优先级:** 🟡 HIGH  
**Arch Review 条件:** C-1 (估时 6-8h), C-2 (ADR-010 必须), SameSite=Lax

### 当前状态

| 层 | 文件 | 现状 |
|----|------|------|
| Token 生成 | `auth.service.ts` L93-142 | 返回 JSON body `{ accessToken, refreshToken, user }` |
| Token 提取 | `jwt.strategy.ts` L46 | `ExtractJwt.fromAuthHeaderAsBearerToken()` only |
| Token 存储 | `authStore.ts` L91-93 | `localStorage.setItem('accessToken', ...)` |
| Token 使用 | 30 个 `localStorage.getItem` 调用 | 手动拼 `Authorization: Bearer ${token}` |
| CORS | `main.ts` L200-228 | `credentials: true` ✅ |
| Proxy | `vite.config.ts` L15-21 | `/api → localhost:3000`，无 cookie 配置 |

### 实现方案（6 个 Sub-task，按依赖顺序执行）

#### Sub-1 (1h): 创建 `apiFetch()` 包装器
**文件:** `frontend/src/lib/apiFetch.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * 便捷方法：apiFetch + JSON 解析
 */
export async function apiFetchJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}
```

然后 **批量替换** 前端所有 30 个 `localStorage.getItem('accessToken')` + `Authorization` header 模式：

**替换模式（每个文件）：**
```typescript
// 替换前
const token = localStorage.getItem('accessToken');
const response = await fetch(`${API_BASE_URL}/some/path`, {
  headers: { Authorization: `Bearer ${token}` },
});

// 替换后
import { apiFetch } from '../lib/apiFetch';
const response = await apiFetch('/some/path');
```

涉及的文件（30 个调用点，约 18 个文件）：
- `authStore.ts` (2)
- `adminUsersApi.ts` (1)
- `analyticsApi.ts` (1)
- `badgesApi.ts` (1)
- `badgeShareApi.ts` (4)
- `badgeTemplatesApi.ts` (1)
- `useDashboard.ts` (1)
- `useSkills.ts` (1)
- `useWallet.ts` (1)
- `BadgeDetailModal.tsx` (3)
- `EvidenceSection.tsx` (3)
- `ReportIssueForm.tsx` (1)
- `SimilarBadgesSection.tsx` (1)
- `BulkPreviewPage.tsx` (3)
- `ProcessingComplete.tsx` (1)
- `TemplateSelector.tsx` (1)
- `ProfilePage.tsx` (1)
- `IssueBadgePage.tsx` (2)
- `BulkIssuancePage.tsx` (1)

**注意事项：**
- 文件上传（FormData）的 fetch 不要设置 `Content-Type`（浏览器自动设置）
- `authStore.ts` 中 login/register 的 fetch 也要换成 `apiFetch`，但注意 login 响应不再需要从 body 取 token
- 公开页面的 fetch（如 `VerifyBadgePage`, `ClaimBadgePage`）不需要 auth header，但加 `credentials: 'include'` 无害

#### Sub-2 (2h): Backend — Set-Cookie 响应 + 双读策略
**文件:** `backend/src/modules/auth/auth.service.ts`

修改 `login()` 和 `refreshToken()` 方法，需要注入 `Response` 对象来设置 cookie。

**方案：在 Controller 层设 cookie**（更符合 NestJS 惯例）

**文件:** `backend/src/modules/auth/auth.controller.ts`

```typescript
import { Response } from 'express';

@Post('login')
async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const result = await this.authService.login(dto);

  // Set httpOnly cookies
  this.setAuthCookies(res, result.accessToken, result.refreshToken);

  // 双写过渡期：body 仍返回 token（前端逐步移除 localStorage 依赖后可删除）
  return result;
}

@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
  const result = await this.authService.refreshToken(dto.refreshToken);
  this.setAuthCookies(res, result.accessToken, result.refreshToken);
  return result;
}

@Post('logout')
async logout(@Body() dto: any, @Res({ passthrough: true }) res: Response) {
  // Clear cookies
  res.clearCookie('access_token', { path: '/api' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
  return this.authService.logout(dto.refreshToken);
}

private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api',
    maxAge: 15 * 60 * 1000, // 15 min (match JWT expiry)
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}
```

**文件:** `backend/src/modules/auth/strategies/jwt.strategy.ts`

修改 `jwtFromRequest` 为双读（cookie 优先，header fallback）：

```typescript
import { Request } from 'express';

jwtFromRequest: ExtractJwt.fromExtractors([
  // 1. 优先从 cookie 提取
  (req: Request) => req?.cookies?.access_token || null,
  // 2. 回退到 Authorization header（双写过渡期）
  ExtractJwt.fromAuthHeaderAsBearerToken(),
]),
```

**安装 cookie-parser（如未安装）：**
```bash
cd gcredit-project/backend
npm install cookie-parser
npm install -D @types/cookie-parser
```

**文件:** `backend/src/main.ts` — 添加 cookie-parser 中间件：
```typescript
import * as cookieParser from 'cookie-parser';
// 在 app.enableCors() 之前或之后
app.use(cookieParser());
```

#### Sub-3 (1h): Frontend — 移除 localStorage token 依赖
**文件:** `frontend/src/stores/authStore.ts`

```typescript
// 移除以下行
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// Login 方法简化为
const login = async (email: string, password: string) => {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  // Cookie 由后端自动 Set-Cookie，前端无需存储
  set({ user: data.user, isAuthenticated: true });
};
```

移除 logout 中的 `localStorage.removeItem`，改为调用后端 logout（清 cookie）。

移除 `checkAuth()` 中的 `localStorage.getItem('accessToken')` 检查，改为通过 `/api/auth/me` 验证 cookie 是否有效。

#### Sub-4 (配合 Sub-2): Cookie Path 配置
**已在 Sub-2 的 setAuthCookies 中包含：**
- Access Token: `path: '/api'` — 所有 API 请求携带
- Refresh Token: `path: '/api/auth'` — 仅 auth 相关请求携带

#### Sub-5 (1h): Vite Proxy Cookie 配置
**文件:** `frontend/vite.config.ts`

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    cookieDomainRewrite: 'localhost', // 确保 dev 环境 cookie 正确
  },
},
```

#### Sub-6 (1h): ADR-010 + 测试
**文件:** `gcredit-project/docs/decisions/ADR-010-jwt-token-transport.md`

ADR 内容要点：
```
# ADR-010: JWT Token Transport Migration

## Status: Accepted
## Date: 2026-02-14
## Context: JWT tokens stored in localStorage are vulnerable to XSS
## Decision: Migrate to httpOnly cookies with SameSite=Lax
## Consequences:
  - Positive: XSS cannot steal tokens
  - Positive: Automatic token transport (no manual header)
  - Negative: CSRF risk (mitigated by SameSite=Lax + API-only path)
  - Negative: One-time migration effort (30 fetch call sites)
## Migration Strategy: Dual-write period (cookie + body response)
```

**测试更新：**
- `auth.service.spec.ts` — 现有测试应全部通过（service 层未变）
- `auth.controller.spec.ts` / E2E — 验证 Set-Cookie header 存在
- 前端测试可能需要 mock `apiFetch` 而非原来的 `fetch`

### 验收
- [ ] Login 响应包含 `Set-Cookie: access_token` (httpOnly, SameSite=Lax)
- [ ] Login 响应包含 `Set-Cookie: refresh_token` (httpOnly, path=/api/auth)
- [ ] 前端不再有 `localStorage.getItem('accessToken')` 调用
- [ ] 所有 API 请求通过 `apiFetch()` + `credentials: 'include'`
- [ ] `jwt.strategy.ts` 支持 cookie 和 header 双读
- [ ] Logout 清除 cookie
- [ ] Vite proxy 配置 `cookieDomainRewrite`
- [ ] ADR-010 文档已创建
- [ ] 现有 auth 测试通过
- [ ] 新增 Set-Cookie 验证测试

---

## 📋 执行顺序

```
1. Story 11.1  → Account Lockout (Prisma migration + auth.service 增强)
2. Story 11.2  → File Upload Magic-Byte (magic-byte-validator + 3 service 集成)
3. Story 11.8  → Log PII Sanitization (log-sanitizer + 7 文件替换)
4. Story 11.9  → HTML Sanitization Decorator (@SanitizeHtml + 10 DTO 应用)
5. Story 11.6  → JWT httpOnly Cookies (最大变更，放最后，Sub-1→6 顺序执行)
```

**依赖说明：**
- 11.1 放第一：涉及 Prisma migration，尽早完成减少冲突
- 11.8 在 11.1 之后：11.1 中的新日志已使用 `user.id` 而非 email，11.8 清理其余文件
- 11.6 放最后：变更面最大（30+ 文件），且前面的 story 完成后可以在 11.6 中一并处理

每个 Story 完成后：
1. 运行 `npm run test` (BE) + `npx vitest run` (FE) 确认 0 regressions
2. `npx prettier --check` 确认格式
3. 单独 commit（commit message 格式: `fix(security): description` 或 `feat(auth): description`）

## 📋 Wave 2 完成后

- [ ] 全部 5 stories committed
- [ ] `git push` 推送到远程
- [ ] 运行完整测试确认：BE ≥537 + FE ≥527
- [ ] 准备 Wave 2 code review

---

**Created:** 2026-02-14  
**Author:** SM Agent (Bob)  
**New Test Baseline After Wave 2:** Backend ~550+ | Frontend 527 (目标增 ~15+ BE tests)
