## Review 结果: CHANGES REQUESTED

### 各 Story 状态
| Story | 状态 | 备注 |
|-------|------|------|
| 11.1  | ⚠️ | 锁定逻辑与测试已覆盖，但登录仍返回 `Account is inactive`，不满足“统一错误信息”要求。 |
| 11.2  | ✅ | Magic-byte 校验已接入图片/证据上传并有单测覆盖。 |
| 11.8  | ❌ | 仍有明文邮箱日志未脱敏（Admin Users + Badge Sharing）。 |
| 11.9  | ✅ | @SanitizeHtml 装饰器与测试完成，关键 DTO 覆盖，未污染 email/password 字段。 |
| 11.6  | ✅ | httpOnly cookie 迁移完成：apiFetch + cookie-parser + jwt strategy 双读 + Vite proxy 重写均到位。 |

### CI Fix Commits 审查
| Commit | 状态 | 备注 |
|--------|------|------|
| 5b054a6 | ⚠️ | 未按 commit diff 审查；当前代码未见新增 blanket `eslint-disable`，仍建议确认修复方式。 |
| 194f97e | ⚠️ | 未按 commit diff 审查；建议确认 TS1272 修复仅为 `import type` 正确化。 |
| 319b6cb | ⚠️ | 未按 commit diff 审查；建议确认 E2E register 测试与 cookie 响应一致。 |
| d08a88c | ⚠️ | 未按 commit diff 审查；建议确认 refresh token `jti` 变更为需求所需而非临时 workaround。 |

### 发现的问题（如有）
1. [MUST FIX] 登录失败返回信息不统一：`Account is inactive` 会泄露账户存在性，需改为 `Invalid credentials` 与其他失败路径一致。[auth.service.ts](gcredit-project/backend/src/modules/auth/auth.service.ts#L112)
2. [MUST FIX] Admin Users 日志仍输出明文邮箱，应改为 `userId` 或 `maskEmailForLog/safeUserRef`。[admin-users.controller.ts](gcredit-project/backend/src/admin-users/admin-users.controller.ts#L129)
3. [MUST FIX] Admin Users 更新角色/部门日志仍输出明文邮箱，需脱敏。[admin-users.controller.ts](gcredit-project/backend/src/admin-users/admin-users.controller.ts#L186)
4. [MUST FIX] Admin Users 更新部门日志仍输出明文邮箱，需脱敏。[admin-users.controller.ts](gcredit-project/backend/src/admin-users/admin-users.controller.ts#L241)
5. [MUST FIX] Badge 分享日志仍输出明文收件人邮箱，需脱敏处理。[badge-sharing.service.ts](gcredit-project/backend/src/badge-sharing/badge-sharing.service.ts#L40)

### 总结
Wave 2 的安全增强整体方向正确，但 Story 11.8 的 PII 日志脱敏未完成、Story 11.1 的统一错误信息仍有偏差，需要修复后再通过。未复跑测试与 CI，仅基于代码审查结论。