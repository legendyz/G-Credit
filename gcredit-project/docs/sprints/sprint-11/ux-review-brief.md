# Sprint 11 UX Review Brief

**Reviewer:** UX Designer (Sally)  
**Requested by:** SM (Bob)  
**Date:** 2026-02-13  
**Sprint:** Sprint 11 — Security + Quality + Feature Hardening  
**Target Version:** v1.1.0

---

## 📋 审核请求

请审核 Sprint 11 中涉及用户界面变更的 stories，评估 UX 一致性和交互设计。Backlog 位于：
- `gcredit-project/docs/sprints/sprint-11/backlog.md`

补充参考文档：
- `project-context.md` — 项目全局上下文
- `gcredit-project/docs/planning/feature-completeness-audit-2026-02.md` — 功能完整性审计
- `gcredit-project/frontend/src/` — 现有前端代码

---

## 🔍 重点审核项

### 1. FR19: Badge Visibility Toggle（Story 11.4）
**影响页面:** Badge Wallet, Public Profile, Verification Page

- 员工可以控制每个 badge 的公开/私密状态
- **需评估：**
  - Toggle 组件的位置：Badge 卡片内？Badge 详情页？Wallet 列表？
  - 默认值 PUBLIC 是否合理？（隐私优先 vs 分享优先）
  - 批量切换需求：一次性设全部为 PRIVATE？
  - 切换后的即时反馈（toast? 状态变化动画?）
  - Private badge 在公开 Profile 上的呈现：完全隐藏 vs "X badges hidden" 提示？
  - 对验证页的影响：访问 PRIVATE badge 验证链接时的 404 页面措辞

### 2. LinkedIn Share Tab（Story 11.5）
**影响页面:** BadgeShareModal

- 在现有的 badge 分享弹窗中新增 "LinkedIn" 标签页
- **需评估：**
  - 现有 BadgeShareModal 的 Tab 结构（当前有哪些 tabs？）
  - LinkedIn tab 的布局设计：分享预览 + 一键分享按钮
  - 分享文案模板（标题、描述、验证链接）
  - 分享成功后的反馈交互
  - 移动端适配：Tab 在小屏幕上的表现
  - LinkedIn 图标/品牌色的使用规范

### 3. 403 Access Denied Page（Story 11.19）
**影响:** 全局错误页面

- 用户无权限时的专用错误页面
- **需评估：**
  - 信息层次：标题 → 原因说明 → 行动建议
  - 是否显示当前角色和所需角色？（安全考虑 vs 用户体验）
  - "Go Back" 和 "Contact Admin" 按钮的设计
  - 与现有 404 页面的视觉一致性
  - 是否需要区分"未登录"（401） vs "已登录但无权限"（403）？

### 4. Analytics CSV Export（Story 11.17）
**影响页面:** Analytics Dashboard

- 新增 CSV 导出功能按钮
- **需评估：**
  - 导出按钮的位置：页面标题行右侧？筛选区？固定底部栏？
  - 导出触发后的交互：直接下载 vs 进度提示 vs 邮件发送？
  - 是否需要选择导出范围（日期区间、指标类型）？
  - 按钮样式：Primary vs Secondary vs Outline + 图标？
  - 文件名格式建议（如 `gcredit-analytics-2026-02-13.csv`）

### 5. User Management 导航（Story 11.23）
**影响:** Desktop Sidebar + Mobile Nav

- Desktop 和 Mobile 标签不一致（"Users" vs "User Management"）
- **需评估：**
  - 标签文本推荐："User Management" vs "Users" vs "Manage Users"？
  - 导航图标：当前用的 Users 图标是否合适？
  - 在导航列表中的位置顺序是否合理？
  - ADMIN-only 标识：是否需要视觉区分（如分隔线、灰色标签"Admin"）？

### 6. Issuer Email Masking（Story 11.7）
**影响页面:** Public Verification Page

- Issuer 邮箱从 `john@company.com` 变为 `j***@company.com`
- **需评估：**
  - 脱敏格式是否清晰易读？
  - 是否需要 tooltip 说明"出于隐私保护，邮箱已部分隐藏"？
  - 对验证页整体信任感的影响评估

### 7. Verification Skill UUID→Name（Story 11.18）
**影响页面:** Public Verification Page

- 验证页面当前显示 skill UUID 而非名称
- **需评估：**
  - Skill 名称的展示格式：Chip/Tag 样式 vs 逗号分隔列表？
  - 是否与 badge 详情页的 skill 展示保持一致？

---

## 📤 期望输出

1. **每个审核项的 UX 建议**（具体交互方案推荐）
2. **需要的线框图或 UI 规范**（如有必要）
3. **UX 一致性风险**（与现有页面的不协调之处）
4. **移动端适配注意事项**
5. **审核结论：** APPROVED / APPROVED WITH CONDITIONS / NEEDS REVISION

---

**审核文件保存位置（如需）:** `gcredit-project/docs/sprints/sprint-11/ux-review-result.md`
