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
