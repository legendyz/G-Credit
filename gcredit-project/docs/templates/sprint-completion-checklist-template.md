# Sprint 结束检查清单模板

**Sprint:** Sprint N - [Epic Name]  
**日期:** YYYY-MM-DD  
**负责人:** [Name/Role]  
**模板版本:** v1.2 (2026-01-29 + Agent自动化集成)

---

## 🤖 Agent 自动化指令 (FOR BMAD AGENT)

**当用户说：** "基于sprint-completion-checklist做收尾" 或类似指令时

**Agent 应自动执行以下步骤：**

1. **读取此 checklist** 并向用户展示关键检查项
2. **文档更新阶段（Phase 1）：**
   - ⚡ **自动执行** [documentation-maintenance-checklist.md](./documentation-maintenance-checklist.md) Scenario A
   - 包括自动运行 `verify-versions.ps1` 验证版本清单
   - 更新 project-context.md, README, CHANGELOG 等核心文档
   - 创建 Sprint summary + retrospective 文档
3. **Lessons Learned 更新（Phase 1.5）：**
   - ⚡ **自动提醒** 更新 [lessons-learned.md](../../lessons-learned/lessons-learned.md)
   - 使用 Retrospective 的内容添加新教训
   - 更新 Velocity Metrics 表格
   - 询问："本Sprint有哪些值得记录的新教训？"
4. **Git 操作阶段（Phase 2-4）：**
   - 引导用户完成 Git 提交、PR 创建、合并、Tag 创建
5. **验证版本清单（自动）：**
   - ⚡ **自动运行** `gcredit-project/scripts/verify-versions.ps1 -ManifestFile "docs/sprints/sprint-N/version-manifest.md"`
   - 展示验证结果（✅ 通过 / ❌ 发现不匹配）
   - 如果不匹配，询问是否自动修正
6. **最终确认** 所有 CRITICAL 文档已更新

**Agent 无需等待用户单独说 "验证版本清单" 或 "更新Lessons Learned"** - 这些应该是 Completion 流程的自动化部分。

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

### 🎯 使用标准文档维护流程

**📚 完整流程参考：** [documentation-maintenance-checklist.md](./documentation-maintenance-checklist.md)

**⚠️ 重要：** Sprint完成时的文档更新必须使用 **Scenario A (Sprint Completion)** 流程。

---

### 执行步骤：

1. **打开标准文档维护清单：**
   - 文件路径：`docs/templates/documentation-maintenance-checklist.md`
   - 或直接用命令：`code docs/templates/documentation-maintenance-checklist.md`

2. **执行 Scenario A：Sprint Completion Documentation Update**
   - 时间估算：20-30分钟（取决于Sprint复杂度）
   - 涵盖：project-context.md, README文件, CHANGELOG, Sprint文档创建
   - 包含验证命令和代理协助说明

3. **确认所有核心文档已更新：**
   - [ ] ✅ `project-context.md` - Status行更新为 "Sprint N Complete ✅"
   - [ ] ✅ `CODE/README.md` - Sprint badge + Current Status更新
   - [ ] ✅ `gcredit-project/README.md` - 项目状态更新（如重要里程碑）
   - [ ] ✅ `docs/sprints/sprint-N/summary.md` - 已创建
   - [ ] ✅ `docs/sprints/sprint-N/retrospective.md` - 已创建
   - [ ] ✅ `backend/CHANGELOG.md` + `frontend/CHANGELOG.md` - vX.X.X条目已添加
   - [ ] ✅ 所有文档 "Last Updated" 日期为今天

---

### 快速验证命令：

```powershell
# 验证核心文档已更新（检查今日日期）
Get-ChildItem -Path "project-context.md", "README.md", "gcredit-project/README.md" | Select-Object Name, LastWriteTime

# 验证Sprint文档已创建
Test-Path "gcredit-project/docs/sprints/sprint-N/summary.md"
Test-Path "gcredit-project/docs/sprints/sprint-N/retrospective.md"

# 验证CHANGELOG已更新
Select-String -Path "gcredit-project/backend/CHANGELOG.md" -Pattern "## \[v0\.X\.X\]" | Select-Object -First 1
```

---

### 🚨 Why Critical?

**project-context.md 是 "Single Source of Truth"：**
- 被 BMAD agents 依赖做决策
- 新团队成员参考了解项目状态
- Definition of Done 的关键部分

**如果不更新的后果：**
- ❌ 信息不一致导致混淆
- ❌ AI agents 产生错误建议
- ❌ 下个Sprint规划基于错误信息
- ❌ 技术债务累积（文档债务）

---

### Sprint特有文档（需手动创建）

#### Retrospective 内容要点：
- ✅ **What went well** - 至少3项成功经验
- ⚠️ **What could be improved** - 至少2项改进点
- 🎯 **Action items for next sprint** - 可执行的具体行动
- 📚 **Lessons learned** - 可复用的经验（参考Sprint 3-5教训）

#### Summary 内容要点：
- 📊 Story完成情况 (X/X stories, 100%)
- 🎯 Epic目标达成情况
- 🔧 技术实现亮点
- ⚠️ 遇到的挑战和解决方案
- 📈 关键指标（测试覆盖率、性能、代码质量）

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
预计时间: 20-30 分钟

1. ✅ 执行 [documentation-maintenance-checklist.md](./documentation-maintenance-checklist.md) Scenario A（20-30 分钟）
   - 包含：project-context.md, README文件, CHANGELOG, Sprint文档创建

### Phase 1.5: Lessons Learned 更新 (必须) ⚡ [AGENT AUTO-REMINDER]
预计时间: 10-15 分钟

**🤖 Agent 自动提醒：** 当到达此步骤时，Agent 应自动提示用户更新 lessons-learned.md。

**Agent 执行步骤：**
1. 读取 retrospective.md 的内容
2. 提示用户："根据Retrospective，本Sprint有哪些值得记录的新教训？"
3. 展示 lessons-learned.md 的"Lessons Learned Review"模板
4. 引导用户添加：
   - 新的Lesson到Sprint N section
   - 更新Velocity Metrics表格
   - 更新Last Updated日期
5. 标记此项完成 ✅

---

**必须更新的内容：**
- [ ] **新的Lesson（如有）** - 添加到 Sprint N section
  - What worked well?（成功经验）
  - What didn't work?（失败教训）
  - What to try next?（改进建议）

- [ ] **Velocity Metrics表格** - 更新本Sprint数据
  ```markdown
  | Sprint N | X/Y (Z%) | Xh估算 | Yh实际 | 准确率 | ~Xh/story |
  ```

- [ ] **Last Updated日期** - 更新为今天
  ```markdown
  **Last Updated:** 2026-01-29 (Post-Sprint N)
  ```

- [ ] **Total Lessons计数** - 增加本Sprint新增的Lesson数量
  ```markdown
  **Total Lessons:** XX lessons (Sprint 0: 5, ..., Sprint N: X)
  ```

**快速模板（复制粘贴到lessons-learned.md）：**
```markdown
## Sprint N Lessons (January 2026)
### [Epic Name]

### 🎯 Lesson XX: [标题]

**What Happened:**
[描述情况]

**Root Cause:**
[根本原因]

**Solution Implemented:**
[解决方案]

**Prevention for Future:**
- [预防措施1]
- [预防措施2]

**Key Takeaway:**
> [一句话总结]

---
```

**对BMad的命令：**
- "帮我更新Lessons Learned"
- "基于Retrospective添加新教训"
- "更新Sprint N的Velocity指标"

🔗 **参考：** [lessons-learned.md](../../lessons-learned/lessons-learned.md) - 完整教训文档
   - 使用标准化流程，确保完整性

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

**代码交付：**
- [ ] ✅ 所有代码已提交并推送
- [ ] ✅ 所有测试 100% 通过
- [ ] ✅ Pull Request 已创建
- [ ] ✅ Code Review 完成（如适用）
- [ ] ✅ PR 已合并到 main
- [ ] ✅ Git Tag 已创建

**文档完成：**（参考 [documentation-maintenance-checklist.md](./documentation-maintenance-checklist.md) Scenario A）
- [ ] ✅ project-context.md 已更新（最重要！）
- [ ] ✅ Sprint 文档已创建（summary + retrospective）
- [ ] ✅ CHANGELOG.md 已更新（frontend + backend）
- [ ] ✅ README 文件已更新（CODE/ + gcredit-project/）

**Lessons Learned 更新：**（参考 Phase 1.5）
- [ ] ✅ 新教训已添加到 lessons-learned.md（如有）
- [ ] ✅ Velocity Metrics 表格已更新
- [ ] ✅ Last Updated 日期已更新

**团队协作：**
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

**模板版本:** v1.2  
**创建日期:** 2026-01-27  
**最后更新:** 2026-01-29 (精简文档更新部分，委托给documentation-maintenance-checklist.md Scenario A)  
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
