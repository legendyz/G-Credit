# Sprint 结束检查清单模板

**Sprint:** Sprint N - [Epic Name]  
**日期:** YYYY-MM-DD  
**负责人:** [Name/Role]  
**模板版本:** v1.1 (2026-01-29)

---

## ✅ Sprint 完成验证

### 1. 功能交付 ✅
- [ ] 所有 Story 已完成
- [ ] 所有验收标准通过 (X/X AC)
- [ ] 功能演示准备就绪
- [ ] 所有 TODO/FIXME 已解决或记录为技术债务
- [ ] **Sprint 3-5经验：** 没有跳过任何失败的测试（见Sprint 3 UUID bug）

### 2. 测试质量 ✅
- [ ] 单元测试通过率 100%
- [ ] E2E 测试通过率 100%
- [ ] UAT 场景测试完成 (X/X scenarios)
- [ ] 测试覆盖率达标 (目标: >80%)
- [ ] 无关键或阻塞性 Bug

### 3. 代码质量 ✅
- [ ] Code Review 已完成
- [ ] Linting 检查通过
- [ ] 格式化检查通过 (Prettier)
- [ ] 无 TypeScript 编译错误
- [ ] 无安全漏洞（或已记录并接受风险）

### 4. Git 管理 ✅
- [ ] 所有代码已提交到 Sprint 分支
- [ ] Commit messages 符合规范
- [ ] 代码已推送到远程仓库
- [ ] 无未追踪文件遗留
- [ ] 分支已准备好合并

---

## 📝 文档更新 (CRITICAL - 必须完成!)

### 必须更新的文档

#### A. project-context.md ✅ 最高优先级
❗ **文件位置:** `{project-root}/project-context.md` (工作区根目录)

- [ ] 更新 **Status** 行（当前 Sprint 状态）
- [ ] 更新 **Sprint N** 状态行
- [ ] 更新 **Last Updated** 日期
- [ ] 添加本 Sprint 成就到 "Implemented Features" 部分
  - [ ] API 端点数量
  - [ ] 数据模型变更
  - [ ] 关键功能列表
  - [ ] 测试统计
- [ ] 更新 "Repository Structure" (如有新模块/文件)
- [ ] 更新 "Next Actions" 部分（标记当前 Sprint 完成，添加下个 Sprint）
- [ ] 更新 "Project Phases" 表格
- [ ] 验证文件内容准确性

**Why Critical:** project-context.md 是 "Single Source of Truth"，被 BMAD agents 和团队成员依赖

#### B. Sprint 文档 ✅ 高优先级
- [ ] 创建 `docs/sprints/sprint-N/summary.md`
  - [ ] Sprint 概览（时间、团队、状态）
  - [ ] Story 完成情况
  - [ ] 技术实现亮点
  - [ ] 遇到的挑战和解决方案
  - [ ] 关键指标和统计
- [ ] 创建 `docs/sprints/sprint-N/retrospective.md`
  - [ ] What went well
  - [ ] What could be improved
  - [ ] Action items for next sprint
  - [ ] Lessons learned
- [ ] 更新 `docs/sprints/sprint-N/README.md`
  - [ ] 最终状态和指标
  - [ ] 链接到 summary 和 retrospective
- [ ] 更新 `docs/sprints/README.md`（Sprint 索引）
  - [ ] 添加 Sprint N 条目
  - [ ] 更新整体进度

#### C. CHANGELOG.md ✅ 高优先级
- [ ] 添加 vX.X.X 版本条目
- [ ] 列出所有新功能 (Added)
- [ ] 列出所有变更 (Changed)
- [ ] 列出所有修复 (Fixed)
- [ ] 列出技术债务解决情况
- [ ] 添加性能改进（如有）

#### D. README.md 文件更新 ✅ 中优先级
**注意：需要更新两个 README 文件，服务不同受众**

##### 1. {project-root}/README.md (工作区根目录) - GitHub 仓库首页展示
❗ **文件位置:** `{project-root}/README.md`
- [ ] 更新徽章状态（Sprint N Complete）
- [ ] 添加 Sprint N 徽章（如果需要）
- [ ] 更新版本徽章（v0.X.0）
- [ ] 更新 "Current Status" 行（Sprint N Complete - Epic Name）
- [ ] 添加 Sprint N 完成状态行
- [ ] 更新 "Version" 和 "Last Updated" 日期
- [ ] 更新 "Current Phase" 部分：
  - [ ] 添加 Sprint N 完成摘要
  - [ ] 更新 "Next Sprints" 部分
- [ ] 更新核心功能状态（✅ Complete / 🔜 Upcoming）
- [ ] 验证所有链接有效

**目标受众：** GitHub 访客、潜在贡献者、外部开发者  
**内容重点：** 项目亮点、里程碑、功能展示、快速上手

##### 2. gcredit-project/README.md (项目目录) - 开发者本地参考
❗ **文件位置:** `{project-root}/gcredit-project/README.md`

- [ ] 更新项目状态（如果是重要里程碑）
- [ ] 更新功能列表（添加新功能）
- [ ] 更新 Getting Started（如有环境变更）
- [ ] 更新依赖版本（如有重大更新）

**目标受众：** 团队内部开发者、本地开发环境  
**内容重点：** 技术细节、开发指南、本地配置

#### E. API 文档 ✅ 中优先级（如有 API 变更）
- [ ] 更新 `backend/docs/api/README.md`
- [ ] 为新端点创建文档文件
- [ ] 更新 OpenAPI/Swagger 定义
- [ ] 添加 cURL 示例

#### F. 技术债务追踪 ✅ 低优先级
- [ ] 更新 `docs/technical-debt.md`（如有新债务）
- [ ] 更新 ADR（如有架构决策）
- [ ] 更新安全漏洞追踪（如有新发现）

---

## 🔄 Git 操作

### 1. 提交 Sprint 变更
```bash
# 确保在 Sprint 分支上
git checkout sprint-N/epic-X-feature-name

# 查看状态
git status

# 暂存所有变更（包括文档更新！）
git add .

# 提交（使用规范的 commit message）
git commit -m "feat: Complete Sprint N - [Epic Name]

Sprint N Summary:
- X stories completed (100%)
- X tests passing (100% pass rate)
- X API endpoints added
- Technical debt: [status]
- Documentation: Updated

Key Deliverables:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Testing:
- X unit tests
- X E2E tests
- X UAT scenarios

Closes #[issue-numbers]"

# 推送到远程
git push origin sprint-N/epic-X-feature-name
```

### 2. 创建 Pull Request
- [ ] 在 GitHub/GitLab 创建 PR
- [ ] 填写 PR 模板（from → to: main）
- [ ] 添加 Sprint Summary 到描述
- [ ] 添加相关截图/演示（如有）
- [ ] 链接相关 Issue/Story
- [ ] 请求 Code Review（如适用）

### 3. 测试验证（合并前）
```bash
# 最终测试运行
npm run test                    # 单元测试
npm run test:e2e               # E2E 测试
npm run lint                   # Linting 检查
npm run build                  # 生产构建测试
```

### 4. 合并到 main（通过后）
- [ ] 所有 CI/CD 检查通过
- [ ] Code Review 批准（如适用）
- [ ] 合并 PR（Squash 或 Merge）
- [ ] 删除远程 Sprint 分支（可选）

### 5. 创建 Git Tag
```bash
# 切换到 main 分支
git checkout main
git pull origin main

# 创建版本标签
git tag -a vX.X.X -m "Release vX.X.X - Sprint N: [Epic Name]

Sprint N Deliverables:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Metrics:
- X stories completed
- X tests (100% pass)
- X API endpoints
- Code quality: [score]/10

Production Readiness: [percentage]%"

# 推送标签
git push origin vX.X.X
```

---

## 🚀 Sprint 收官

### Phase 1: 文档完成 (必须)
预计时间: 30-45 分钟

1. ✅ 更新 project-context.md（15 分钟）
2. ✅ 创建 Sprint summary（10 分钟）
3. ✅ 创建 Sprint retrospective（10 分钟）
4. ✅ 更新 CHANGELOG.md（5 分钟）

### Phase 2: Git 操作 (必须)
预计时间: 15-20 分钟

5. ✅ 提交所有变更（5 分钟）
6. ✅ 推送到远程（5 分钟）
7. ✅ 创建 Pull Request（10 分钟）

### Phase 3: 最终验证 (必须)
预计时间: 15-20 分钟

8. ✅ 运行完整测试套件（15 分钟）
9. ✅ 验证构建成功（5 分钟）

### Phase 4: 合并和发布 (推荐)
预计时间: 10-15 分钟

10. ✅ 合并 PR 到 main（5 分钟）
11. ✅ 创建 Git Tag（5 分钟）
12. ✅ 创建 GitHub Release（5 分钟，可选）

**总计时间: 70-100 分钟 (1.5-2 小时)**

---

## 📋 验证清单（最终检查）

在标记 Sprint 为"完成"之前，确认：

- [ ] ✅ 所有代码已提交并推送
- [ ] ✅ project-context.md 已更新（最重要！）
- [ ] ✅ Sprint 文档已创建（summary + retrospective）
- [ ] ✅ CHANGELOG.md 已更新
- [ ] ✅ 所有测试 100% 通过
- [ ] ✅ Pull Request 已创建
- [ ] ✅ Code Review 完成（如适用）
- [ ] ✅ PR 已合并到 main
- [ ] ✅ Git Tag 已创建
- [ ] ✅ 团队已通知（如适用）

---

## 🎯 Sprint N+1 准备

完成当前 Sprint 后：

1. [ ] 安排 Sprint Planning 会议
2. [ ] Review Product Backlog
3. [ ] 确定下个 Sprint 的 Epic
4. [ ] 评估团队 Velocity
5. [ ] 创建 Sprint N+1 Backlog

---

## 📌 重要提醒

### ⚠️ 为什么 project-context.md 更新是 CRITICAL?

1. **Single Source of Truth**
   - 被定义为项目的唯一真实信息来源
   - BMAD agents 依赖它做决策
   - 新团队成员参考它了解项目状态

2. **避免信息过时**
   - 过时的 project-context.md 会误导决策
   - 导致 AI agents 产生错误建议
   - 影响新 Sprint 的规划准确性

3. **流程完整性**
   - Definition of Done 的一部分
   - Sprint 没有完整文档 = Sprint 未完成
   - 保持项目历史记录的连续性

### 💡 如果忘记更新 project-context.md

**后果:**
- ❌ 违背 SSOT 原则
- ❌ 信息不一致导致混淆
- ❌ 技术债务累积（文档债务）
- ❌ 下个 Sprint 规划基于错误信息

**补救:**
- 立即补充更新（任何时候都不嫌晚）
- 在 Retrospective 中记录为 "Improvement Item"
- 添加提醒机制到下个 Sprint

---

## 📝 模板使用说明

### 如何使用此模板：

1. **Sprint 开始时:**
   - 复制此模板到 `docs/sprints/sprint-N/completion-checklist.md`
   - 填写 Sprint 信息（Sprint N, Epic Name, Date）

2. **Sprint 进行中:**
   - 定期检查功能完成状态
   - 在完成关键任务时勾选清单

3. **Sprint 结束时:**
   - 使用此清单作为收官指南
   - **必须完成所有 "文档更新" 部分**
   - 按顺序执行 Phase 1-4

4. **验证:**
   - 使用"验证清单"确保没有遗漏
   - 所有项目勾选后，Sprint 正式完成

---

**模板版本:** v1.1  
**创建日期:** 2026-01-27  
**最后更新:** 2026-01-29 (添加Sprint 3-5经验教训)  
**维护者:** GCredit Development Team

---

**记住: 没有更新 project-context.md 的 Sprint 不算真正完成！** 🎯

---

## 📚 Sprint 3-5 经验教训总结

### Sprint 3: 永远不要跳过失败的测试
**教训：** UUID验证bug被失败测试发现，如果跳过就会遗漏真实问题  
**行动：** 所有失败测试必须调查原因，不能直接跳过

### Sprint 4: Timeline-based 测试方法有效
**教训：** 复杂功能（如badge wallet timeline）的测试需要基于时间序列数据  
**行动：** 继续在时间相关功能中使用这种方法

### Sprint 5: 架构预先准备节省时间
**教训：** Winston在Sprint开始前完成ADRs，开发过程中零架构争论  
**行动：** 复杂Epic开始前让架构师预先分析并形成ADR

### Sprint 5: 参考Lessons-Learned避免重复错误
**教训：** 主动回顾Sprint 0-4的retrospectives，成功避免了过往失误  
**行动：** 每个Sprint Planning前必须复习过往经验教训
