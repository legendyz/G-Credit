# Wave 1 Code Review Prompt

**Sprint:** 11 — Security & Quality Hardening  
**Wave:** 1 of 5 — Quick Wins + Security Foundation  
**Branch:** `sprint-11/security-quality-hardening`  
**Commits:** `1fbfc10..106fc39` (7 commits)  
**Dev Test Results:** BE 537 passed (+3 new) | FE 527 passed (0 regressions)

---

## 📋 Review Scope

请对 Wave 1 的以下 5 个 Story 实现做 Code Review。

| Story | 标题 | Commit | 改动文件 |
|-------|------|--------|---------|
| 11.3 | npm audit fix + Swagger 条件加载 | `da97c2b` | backend/package-lock.json, backend/src/main.ts |
| 11.14 | 删除未使用依赖 (keyv, framer-motion) | `91af113` | backend/package.json, backend/package-lock.json, frontend/package.json, frontend/package-lock.json, frontend/vite.config.ts |
| 11.23 | MobileNav "User Management" → "Users" | `3ede231` | frontend/src/components/layout/MobileNav.tsx |
| 11.7 | Issuer 邮箱脱敏 + 隐私信任声明 | `d775021` | backend/src/badge-verification/badge-verification.service.ts, backend/src/badge-verification/badge-verification.service.spec.ts, frontend/src/pages/VerifyBadgePage.tsx |
| 11.20 | POST /badges/claim 路由 + ClaimPage 修复 | `cdd1525` | backend/src/badge-issuance/badge-issuance.controller.ts, backend/src/badge-issuance/badge-issuance.controller.spec.ts, frontend/src/pages/ClaimBadgePage.tsx |

另有 2 个辅助 commit：`0f570ab` (Prettier formatting), `106fc39` (lint fix: as any → typed DTO)

---

## 📐 Review 参考文档

1. **实现规格:** `sprint-11/wave-1-dev-prompt.md` — 每个 Story 的具体修改位置、代码片段、验收标准
2. **验收标准:** `sprint-11/backlog.md` 中 Story 11.3, 11.7, 11.14, 11.20, 11.23 的 Deliverables 段落
3. **技术条件:** `sprint-11/arch-review-result.md` — Conditions C-1~C-7（Wave 1 相关：C-7 信任声明）
4. **UX 条件:** `sprint-11/ux-review-result.md` — 11.23 统一为 "Users"，11.7 信任声明文案

---

## ✅ Review Checklist（逐 Story）

### Story 11.3: npm audit + Swagger
- [ ] `npm audit` 双端 0 HIGH/CRITICAL 漏洞
- [ ] Swagger 用 `process.env.NODE_ENV !== 'production'` 条件包裹
- [ ] `NODE_ENV=production` 时 `/api-docs` 不可访问
- [ ] Swagger 日志输出也在条件块内
- [ ] 未引入不必要的依赖版本变更

### Story 11.14: 删除未使用依赖
- [ ] `keyv` 已从 backend/package.json 移除
- [ ] `framer-motion` 已从 frontend/package.json 移除
- [ ] vite.config.ts 中 `animation-vendor` chunk 配置已删除
- [ ] `tailwindcss-animate` **保留**未删除
- [ ] 无残留 import 引用

### Story 11.23: Nav 标签统一
- [ ] MobileNav.tsx: `label: 'User Management'` → `label: 'Users'`
- [ ] Navbar.tsx: 保持 "Users" **未被修改**
- [ ] 仅 ADMIN 角色可见逻辑未受影响
- [ ] 路由 `/admin/users` 未变

### Story 11.7: Issuer 邮箱脱敏
- [ ] `badge-verification.service.ts`: `badge.issuer.email` → `this.maskEmail(badge.issuer.email)`
- [ ] `maskEmail()` 方法已存在、无需新增
- [ ] Recipient 邮箱脱敏逻辑未受影响
- [ ] VerifyBadgePage.tsx: 底部添加了隐私信任声明文案
- [ ] 信任声明文案内容: "Personal information is partially hidden to protect privacy. Badge authenticity is verified by G-Credit's cryptographic signature."
- [ ] 样式使用 `text-xs text-neutral-400`（与页面风格一致）
- [ ] 新增单元测试覆盖 Issuer 邮箱脱敏场景

### Story 11.20: ClaimPage 硬编码 UUID
- [ ] 新增 `POST /badges/claim` 路由（静态路由，在 `:id/claim` 参数路由之前声明）
- [ ] 新路由要求 `claimToken` 必填，缺失时抛 `BadRequestException`
- [ ] 原 `POST /badges/:id/claim` 保留不变，兼容已有功能
- [ ] ClaimBadgePage.tsx: URL 从 `/badges/00000000.../claim` 改为 `/badges/claim`
- [ ] 硬编码 UUID 和相关注释已删除
- [ ] 新路由有 Swagger 装饰器（@ApiOperation, @ApiResponse）
- [ ] 新增后端测试覆盖新路由

---

## 🔍 横向检查项

- [ ] **测试:** BE 537 passed (baseline 534 + 3 new), FE 527 passed (baseline 527)
- [ ] **Lint:** ESLint 0 errors, 无 `as any` 残留
- [ ] **Prettier:** 格式化通过
- [ ] **Commit 规范:** 每个 Story 独立 commit，message 格式 `fix(scope)` / `feat(scope)` / `chore(scope)`
- [ ] **安全:** 无敏感信息泄露（API keys, secrets）
- [ ] **无副作用:** 未修改不在 Wave 1 范围内的文件功能

---

## 📝 Review 输出格式

请按以下格式输出 review 结果：

```
## Review 结果: [APPROVED / APPROVED WITH COMMENTS / CHANGES REQUESTED]

### 各 Story 状态
| Story | 状态 | 备注 |
|-------|------|------|
| 11.3  | ✅/⚠️/❌ | ... |
| 11.14 | ✅/⚠️/❌ | ... |
| 11.23 | ✅/⚠️/❌ | ... |
| 11.7  | ✅/⚠️/❌ | ... |
| 11.20 | ✅/⚠️/❌ | ... |

### 发现的问题（如有）
1. [MUST FIX] 描述...
2. [SUGGESTION] 描述...

### 总结
...
```

---

**Created:** 2026-02-14  
**Author:** SM Agent (Bob)
