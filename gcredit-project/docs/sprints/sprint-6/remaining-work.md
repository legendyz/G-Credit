# Sprint 6 - 剩余工作清单

**更新日期**: 2026年1月30日  
**Sprint 状态**: 60% 完成 (3/5 stories)  
**剩余工作**: 2 stories + 文档完善

---

## 📋 必须完成的 Stories

### 🔵 Story 7.3: Embeddable Badge Widget
**状态**: 未开始  
**优先级**: MEDIUM  
**估算工作量**: 6-8 小时  
**Story 文件**: ✅ [7-3-widget-embedding.md](7-3-widget-embedding.md)

**待完成任务** (8个):
1. ✅ Widget Embedding API (GET /badges/:id/widget, /embed)
2. ✅ Widget Configuration Options (size, theme, details)
3. ✅ Widget Share Tracking (记录到 BadgeShare 表)
4. ✅ Widget Generator Page (前端页面)
5. ✅ Embeddable Widget Component (独立组件)
6. ✅ Unit Tests (>80% 覆盖率)
7. ✅ Integration Tests (嵌入测试 HTML)
8. ✅ Cross-Browser Testing (Chrome, Firefox, Safari, Edge)

**技术要点**:
- 公共 API (无需认证)
- CORS 配置允许跨域嵌入
- 支持 iframe 和独立 HTML 两种嵌入方式
- 响应式设计 (移动端/桌面端)

**依赖关系**:
- 依赖 Story 7.5 的 BadgeShare 表 (记录 widget 嵌入)
- 无其他阻塞依赖

---

### 🔵 Story 7.5: Sharing Analytics
**状态**: 准备开始  
**优先级**: MEDIUM (但 Stories 7.2, 7.3, 7.4 依赖此表)  
**估算工作量**: 4-6 小时  
**Story 文件**: ✅ [7-5-sharing-analytics.md](7-5-sharing-analytics.md)

**待完成任务** (11个):
1. ✅ 创建 BadgeShare 表 (Prisma migration)
2. ✅ BadgeAnalyticsService (recordShare, getShareStats, getShareHistory)
3. ✅ 集成 Story 7.2 (Email Sharing) - 移除 TODO 注释
4. ✅ 集成 Story 7.4 (Teams Notifications) - 移除 TODO 注释
5. ✅ 集成 Story 7.3 (Widget Embedding) - 添加记录调用
6. ✅ Analytics API Endpoints (GET /badges/:id/analytics/shares, /history)
7. ✅ Frontend: Badge Detail 显示分析数据
8. ⚪ OPTIONAL: Admin Analytics Page (可延期)
9. ✅ Unit Tests (>80% 覆盖率)
10. ✅ Integration Tests (数据库测试)
11. ✅ E2E Tests (完整流程测试)

**技术要点**:
- 数据库迁移添加 `badge_shares` 表
- JSON 元数据列存储平台特定数据
- 授权检查 (仅徽章所有者/发放者可查看)
- 索引优化 (badgeId + platform, sharedAt)

**依赖关系**:
- **被依赖**: Stories 7.2, 7.3, 7.4 需要此表记录分享数据
- **建议优先级**: 先完成 Story 7.5，再做 Story 7.3

---

## 📝 文档完善任务

### ✅ Story 文件状态

| Story | 文件名 | 状态 | 备注 |
|-------|--------|------|------|
| 7.1 | 7-1-microsoft-graph-setup.md | ✅ 今天创建 | 回溯文档，标记已完成 |
| 7.2 | 7-2-email-sharing.md | ✅ 今天创建 | 回溯文档，标记已完成 |
| 7.3 | 7-3-widget-embedding.md | ✅ 今天创建 | 准备开发，标记未开始 |
| 7.4 | 7-4-teams-notifications.md | ✅ 已存在 | 完整详细，10/12 任务完成 |
| 7.5 | 7-5-sharing-analytics.md | ✅ 今天创建 | 准备开发，详细任务清单 |

**所有 Story 文件已补全** ✅

### 待完善文档 (可选)

- [ ] `docs/setup/azure-ad-app-setup.md` - Azure AD 配置指南 (如果不存在)
- [ ] `docs/architecture/microsoft-graph-integration.md` - Graph API 架构文档
- [ ] `docs/sprints/sprint-6/sprint-retrospective.md` - Sprint 回顾 (Sprint 结束时)

---

## 🎯 建议实施顺序

### 第一阶段: Analytics 基础 (优先)
**时间**: 4-6 小时  
**理由**: Stories 7.3 和 7.4 需要记录分享数据

**⚠️ CRITICAL: Prisma Schema 命名规范检查（Lesson 22）**
在修改任何 Prisma schema 前，必须阅读并遵守：
- 📖 **必读**: [Lesson 22 - Prisma Schema Naming Conventions](../../lessons-learned/lessons-learned.md#lesson-22-prisma-schema-naming-conventions-and-mock-testing-pitfalls)
- 🚨 **强制规范**: 禁止运行 `npx prisma format`
- ✅ **正确模式**: `model User { ... @@map("users") }` (PascalCase model + snake_case table)
- ❌ **禁止模式**: `model users { ... }` (snake_case model)
- 🔧 **三步验证**: `prisma generate` → `npm run build` → `npm test`

1. **Story 7.5 - Tasks 1-2** (2 小时)
   - [ ] **开始前必做**: 检查现有 schema.prisma 中所有 model 命名（必须 PascalCase）
   - [ ] 创建 BadgeShare 表迁移
     - ⚠️ 使用 `model BadgeShare { ... @@map("badge_shares") }`
     - ❌ 绝对禁止: `model badge_shares { ... }`
   - [ ] 实现 BadgeAnalyticsService
   - [ ] **完成后必做**: 运行三步验证 (generate → build → test)

2. **Story 7.5 - Tasks 3-4** (1 小时)
   - [ ] 集成 Story 7.2 (Email) - 移除 TODO
   - [ ] 集成 Story 7.4 (Teams) - 移除 TODO
   - [ ] **验证 Prisma 关系名**:
     - ✅ 使用 `badge.template` (不是 `badgeTemplate`)
     - ✅ 使用 `badge.issuer` (不是 `badge.badgeTemplate.issuer`)
     - ✅ 使用 VSCode 自动完成验证
   - [ ] 运行测试验证集成

3. **Story 7.5 - Task 6** (1 小时)
   - [ ] 实现 Analytics API Endpoints
   - [ ] Swagger 文档更新

4. **Story 7.5 - Tasks 9-10** (1-2 小时)
   - [ ] 单元测试和集成测试
   - [ ] **测试模拟数据必须匹配真实 schema**:
     - ✅ Mock 结构: `{ template: {...}, issuer: {...} }`
     - ❌ 错误结构: `{ badgeTemplate: {...} }`
   - [ ] 验证数据正确记录

**✅ Checkpoint**: Analytics 后端完成，Stories 7.2 & 7.4 集成完毕

---

### 第二阶段: Widget 功能 (次要)
**时间**: 6-8 小时  
**理由**: 新功能开发，依赖 Story 7.5 已完成

**⚠️ Prisma 使用提醒（Lesson 22）**
Story 7.3 需要查询 Badge 和 BadgeShare 数据，请遵守：
- ✅ 使用正确关系名: `badge.template`, `badge.issuer`
- ✅ Mock 数据匹配真实 schema: `{ template: {...}, issuer: {...} }`
- ✅ 每次修改查询后运行: `npm run build`
- 📖 详细规范见: [Story 7.3 文档](7-3-widget-embedding.md#-critical-prisma-使用规范开始前必读)

1. **Story 7.3 - Tasks 1-3** (2-3 小时)
   - [ ] **开始前**: 阅读 Story 7.3 中的 Prisma 使用规范
   - [ ] Widget API 端点 (GET /badges/:id/widget, /embed)
     - 查询 Badge 数据时使用正确关系名
   - [ ] Widget 配置选项 (size, theme, details)
   - [ ] Widget 分享跟踪 (调用 BadgeAnalyticsService)
     - 记录到 BadgeShare 表
   - [ ] **完成后**: Run `npm run build` 验证类型

2. **Story 7.3 - Tasks 4-5** (2-3 小时)
   - Widget Generator Page (前端)
   - Embeddable Widget Component
   - 嵌入代码生成器

3. **Story 7.3 - Tasks 6-8** (2 小时)
   - 单元测试、集成测试
   - **验证**: Mock 数据使用正确的关系名结构
   - 跨浏览器测试

**✅ Checkpoint**: Widget 功能完成，可嵌入外部网站

---

### 第三阶段: 前端完善 & E2E (最后)
**时间**: 2-3 小时

1. **Story 7.5 - Task 7** (1-2 小时)
   - Badge Detail 页面显示分析数据
   - 分享计数和历史记录

2. **Story 7.5 - Task 11** (1 小时)
   - E2E 测试: Email → 验证分析更新
   - E2E 测试: Teams → 验证分析更新
   - E2E 测试: Widget → 验证分析更新

3. **Story 7.4 - Tasks 9-10** (如果需要)
   - M365 开发者订阅集成测试
   - Sally 审批 Adaptive Card 设计

**✅ Checkpoint**: 所有功能完成，E2E 测试通过

---

## 📊 工作量汇总

| Story | 估算 | 任务数 | 优先级 | 依赖 |
|-------|------|--------|--------|------|
| Story 7.5 | 4-6h | 11 tasks | **先做** | 无 |
| Story 7.3 | 6-8h | 8 tasks | 后做 | 依赖 7.5 |
| **总计** | **10-14h** | **19 tasks** | | |

**时间分配建议**:
- **Day 1-2**: Story 7.5 (Analytics) - 4-6 小时
- **Day 3-4**: Story 7.3 (Widget) - 6-8 小时
- **Day 5**: 测试、文档、代码审查 - 2-3 小时

**总计**: 约 2-3 个工作日 (按每天 5-6 小时计算)

---

## ✅ 完成标准

### Story 7.3 完成标准:
- [ ] 所有 8 个任务完成 ✅
- [ ] Widget API 端点可访问 (公共 API)
- [ ] Widget 可嵌入外部网站 (iframe + 独立 HTML)
- [ ] Widget 支持 3 种尺寸、3 种主题
- [ ] Widget 分享记录到 BadgeShare 表
- [ ] 单元测试覆盖率 >80%
- [ ] 集成测试通过 (嵌入测试 HTML)
- [ ] 跨浏览器测试通过 (Chrome, Firefox, Safari, Edge)
- [ ] CHANGELOG 更新
- [ ] 代码审查通过
- [ ] 合并到 sprint-6 分支

### Story 7.5 完成标准:
- [ ] 所有 11 个任务完成 ✅ (Task 8 可选)
- [ ] BadgeShare 表创建并迁移成功
- [ ] Stories 7.2, 7.4 集成完成 (TODO 移除)
- [ ] Story 7.3 集成完成 (如果 Story 7.3 完成)
- [ ] Analytics API 端点可访问 (需认证)
- [ ] Badge Detail 显示分享统计和历史
- [ ] 授权正确 (仅所有者/发放者可查看)
- [ ] 单元测试覆盖率 >80%
- [ ] 集成测试通过 (数据库操作)
- [ ] E2E 测试通过 (完整分享流程)
- [ ] CHANGELOG 更新
- [ ] 代码审查通过
- [ ] 合并到 sprint-6 分支

### Sprint 6 整体完成标准:
- [ ] 5/5 stories 完成 (7.1 ✅, 7.2 ✅, 7.3 ⏳, 7.4 ✅, 7.5 ⏳)
- [ ] 所有测试通过 (目标: 220+ tests, 100% pass rate)
- [ ] CHANGELOG 更新到 v0.7.0
- [ ] 所有代码合并到 main 分支
- [ ] Git tag: `v0.7.0-sprint-6`
- [ ] Sprint 回顾完成
- [ ] 文档更新完整

---

## 🚀 下一步行动

### 今天 (2026-01-30) - 休息日 ✅
**无开发工作** - 文档准备已完成

### 明天开始 - 实施计划

**Day 1 (第一天)**:
1. 复习 Story 7.5 文件 (7-5-sharing-analytics.md)
2. 创建 BadgeShare 表迁移
3. 实现 BadgeAnalyticsService
4. 集成 Stories 7.2 & 7.4
5. 运行测试验证

**Day 2 (第二天)**:
1. 完成 Story 7.5 API 端点
2. 单元测试和集成测试
3. 复习 Story 7.3 文件 (7-3-widget-embedding.md)
4. 开始 Story 7.3 后端实现

**Day 3 (第三天)**:
1. 完成 Story 7.3 后端和前端
2. 单元测试和集成测试
3. 跨浏览器测试

**Day 4 (第四天)**:
1. E2E 测试 (Stories 7.3 & 7.5)
2. 前端分析显示 (Story 7.5 Task 7)
3. 代码审查和修复

**Day 5 (第五天)**:
1. CHANGELOG 更新
2. 文档完善
3. 合并代码到 main
4. Sprint 回顾

---

## 📞 需要支持时

**遇到问题联系**:
- **技术问题**: Winston (Architect)
- **流程问题**: Bob (Scrum Master)
- **设计问题**: Sally (UX Designer)
- **项目决策**: LegendZhu (Project Lead)

**常见问题参考**:
- Prisma 迁移: `docs/development/database-migrations.md`
- Microsoft Graph API: `docs/setup/teams-integration-setup.md`
- 测试策略: `docs/testing/test-strategy.md`
- Lessons Learned: `docs/lessons-learned/`

---

**创建日期**: 2026年1月30日  
**创建者**: Bob (Scrum Master)  
**目的**: 明确 Sprint 6 剩余工作，指导后续开发
