# Wave 2 Code Review Prompt

**Sprint:** 11 — Security & Quality Hardening  
**Wave:** 2 of 5 — Security Hardening  
**Branch:** `sprint-11/security-quality-hardening`  
**Commits:** `aa96156..d0ba889` (11 commits: 5 feature + 4 CI fixes + 1 style + 1 docs)  
**Changed Files:** 65 files, +1169 / -551 lines  
**Dev Test Results:** ⚠️ 4 consecutive CI failures before passing — see Lesson 40

---

## 📋 Review Scope

请对 Wave 2 的以下 5 个 Security Story 实现做 Code Review。

| Story | 标题 | Feature Commit | 改动范围 |
|-------|------|---------------|---------|
| 11.1 | Account Lockout | `553a03c` | Prisma migration, auth.service.ts, auth.service.spec.ts |
| 11.2 | File Upload Magic-Byte | `efb9175` | magic-byte-validator.ts, blob-storage.service.ts, evidence.service.ts |
| 11.8 | Log PII Sanitization | `4861cda` | log-sanitizer.ts, 7 service/controller 文件 |
| 11.9 | @SanitizeHtml Decorator | `87ae70c` | sanitize-html.decorator.ts, 10+ DTO 文件 |
| 11.6 | JWT httpOnly Cookies | `d907701` | auth.controller.ts, jwt.strategy.ts, apiFetch.ts, authStore.ts, 18+ 前端文件, ADR-010 |

**CI Fix Commits:** `5b054a6`, `194f97e`, `319b6cb`, `d08a88c` — lint/tsc/E2E 修复

---

## 📐 Review 参考文档

1. **实现规格:** `sprint-11/wave-2-dev-prompt.md` — 每个 Story 的修改位置、方案、验收标准
2. **验收标准:** `sprint-11/backlog.md` 中 Story 11.1, 11.2, 11.6, 11.8, 11.9 的 Deliverables
3. **技术条件:** `sprint-11/arch-review-result.md` — C-1 (11.6 估时+apiFetch), C-2 (ADR-010 必须), 11.9 @SanitizeHtml 方案A, SameSite=Lax
4. **Lesson 40:** `docs/lessons-learned/lessons-learned.md` — 本地检查不完整导致 4 次 CI 失败

---

## ✅ Review Checklist（逐 Story）

### Story 11.1: Account Lockout
- [ ] Prisma schema 新增 `failedLoginAttempts Int @default(0)` + `lockedUntil DateTime?`
- [ ] Migration 文件存在且内容正确
- [ ] `login()` 方法：密码失败 → `failedLoginAttempts` 递增
- [ ] 第 5 次失败 → `lockedUntil` 设置为 30 分钟后
- [ ] 锁定期间：正确密码也返回 `Invalid credentials`（通用错误）
- [ ] 锁定过期后：自动恢复登录能力
- [ ] 登录成功 → `failedLoginAttempts` 重置为 0, `lockedUntil` 清空
- [ ] 日志中使用 `user.id` 而非明文邮箱
- [ ] 无账户存在性泄露（所有错误返回相同 message）
- [ ] 单元测试覆盖：正常登录、失败递增、锁定、过期解锁

### Story 11.2: File Upload Magic-Byte
- [ ] `magic-byte-validator.ts` 创建，支持 JPEG/PNG/WebP/GIF/PDF/DOCX 签名
- [ ] `validateMagicBytes()` 检查 buffer 内容 vs 声明 MIME
- [ ] `blob-storage.service.ts` `validateImage()` 增加 magic-byte 检查
- [ ] `evidence.service.ts` 增加 magic-byte 检查（PDF + 图片）
- [ ] MIME 不匹配时返回有意义的错误信息
- [ ] CSV/TXT 上传未受影响（纯文本无 magic-byte）
- [ ] 单元测试覆盖：合法文件、伪造文件、空文件

### Story 11.8: Log PII Sanitization
- [ ] `log-sanitizer.ts` 创建：`maskEmailForLog()` + `safeUserRef()`
- [ ] `maskEmailForLog('john@example.com')` → `'j***@example.com'`
- [ ] `auth.service.ts` 日志全部替换（~10 处）
- [ ] `admin-users.controller.ts` 日志替换（~5 处）
- [ ] `email.service.ts`, `graph-email.service.ts` 日志替换
- [ ] `teams-badge-notification.service.ts`, `m365-sync.service.ts` 日志替换
- [ ] `badge-sharing.service.ts` 日志替换
- [ ] 无残留明文邮箱日志（grep 验证）
- [ ] 单元测试覆盖 maskEmailForLog + safeUserRef

### Story 11.9: @SanitizeHtml Decorator
- [ ] `sanitize-html.decorator.ts` 创建，使用 `sanitize-html` 库 (`allowedTags: []`)
- [ ] 基于 `class-transformer` `@Transform` 实现
- [ ] 应用到以下 DTO（至少）：badge-template, skill, register, update-profile, share-badge-email, share-badge-teams, update-user-department, milestone, skill-category, issuance-criteria
- [ ] `email` 和 `password` 字段**未**添加 @SanitizeHtml
- [ ] `main.ts` ValidationPipe 仍有 `transform: true`（装饰器生效前提）
- [ ] 单元测试：`<script>alert('xss')</script>` → 被清除

### Story 11.6: JWT httpOnly Cookies
- [ ] **apiFetch.ts** 创建：`credentials: 'include'` + Content-Type
- [ ] 所有前端 `localStorage.getItem('accessToken')` 调用已移除（原 30 处）
- [ ] 所有 `Authorization: Bearer` header 手动拼接已移除
- [ ] **auth.controller.ts**: login/refresh 设置 `Set-Cookie` (httpOnly, SameSite=Lax)
- [ ] Access token cookie: `path: '/api'`
- [ ] Refresh token cookie: `path: '/api/auth'`
- [ ] `Secure` flag 仅在 production 为 true
- [ ] **jwt.strategy.ts**: 双读策略（cookie 优先，header fallback）
- [ ] **cookie-parser** 已安装并在 `main.ts` 中注册
- [ ] **authStore.ts**: 移除 `localStorage.setItem/removeItem` 调用
- [ ] **vite.config.ts**: 添加 `cookieDomainRewrite: 'localhost'`
- [ ] Logout 清除 cookie（`res.clearCookie`）
- [ ] **ADR-010** 文档存在且内容完整（Context, Decision, Consequences, Migration Strategy）
- [ ] 文件上传（FormData）的 fetch 未设置 `Content-Type`（浏览器自动设置）
- [ ] 前端测试已适配新的 apiFetch 模式

---

## 🔍 横向检查项

- [ ] **测试:** BE 测试通过（预期 ~550+，baseline 537），FE 测试通过（527+ baseline）
- [ ] **Lint:** ESLint 0 errors + 0 warnings (`npm run lint` with `--max-warnings=0`)
- [ ] **TypeScript:** `npx tsc --noEmit` 通过（无 TS1272 等错误）
- [ ] **Prettier:** 格式化通过
- [ ] **E2E:** `npx jest --config test/jest-e2e.json` 通过
- [ ] **CI Pipeline:** 最终状态为绿色（注意有 4 个 fix(ci) commit）
- [ ] **Commit 规范:** 每个 Story 独立 commit，message 格式 `fix(security)` / `feat(security)` / `feat(auth)`
- [ ] **安全:** 无 hardcoded secrets, cookie secret 使用环境变量
- [ ] **无副作用:** 未修改 Wave 2 范围外的功能逻辑

---

## ⚠️ 特别关注项

### CI 失败历史（Lesson 40）
Wave 2 发生 4 次 CI 失败后才通过。请特别审查 CI fix commits 是否引入了 shortcuts 或 workarounds：
- [ ] `5b054a6` lint fix — 是否只是加了 `// eslint-disable` 而非真正修复？
- [ ] `194f97e` TS1272 fix — `import type` 是否正确？
- [ ] `319b6cb` E2E register test — 测试修改是否合理反映了新的 token 响应格式？
- [ ] `d08a88c` jti for refresh tokens — 是 feature 需要还是 workaround？

### 安全实现深度
- [ ] Account lockout: 是否有 timing attack 风险（locked vs not-found 的响应时间差异）？
- [ ] Magic-byte: WebP 的 RIFF+WEBP 双重检查是否实现？
- [ ] JWT cookies: CSRF 防护是否足够（SameSite=Lax 是否 cover 所有 mutation 请求）？
- [ ] Sanitization: 是否有 DTO 遗漏？（检查所有 POST/PUT/PATCH 的 @Body() 参数）

---

## 📝 Review 输出格式

请按以下格式输出 review 结果：

```
## Review 结果: [APPROVED / APPROVED WITH COMMENTS / CHANGES REQUESTED]

### 各 Story 状态
| Story | 状态 | 备注 |
|-------|------|------|
| 11.1  | ✅/⚠️/❌ | ... |
| 11.2  | ✅/⚠️/❌ | ... |
| 11.8  | ✅/⚠️/❌ | ... |
| 11.9  | ✅/⚠️/❌ | ... |
| 11.6  | ✅/⚠️/❌ | ... |

### CI Fix Commits 审查
| Commit | 状态 | 备注 |
|--------|------|------|
| 5b054a6 | ✅/⚠️ | ... |
| 194f97e | ✅/⚠️ | ... |
| 319b6cb | ✅/⚠️ | ... |
| d08a88c | ✅/⚠️ | ... |

### 发现的问题（如有）
1. [MUST FIX] 描述...
2. [SUGGESTION] 描述...

### 总结
...
```

---

**Created:** 2026-02-14  
**Author:** SM Agent (Bob)
