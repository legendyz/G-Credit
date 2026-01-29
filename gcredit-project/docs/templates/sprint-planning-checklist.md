# Sprint Planning Checklist

**目的：** 确保Sprint Planning全面、准确，避免重复工作和资源浪费  
**使用时机：** 每个Sprint开始前的Planning阶段  
**责任人：** Product Manager + Scrum Master  
**最后更新：** 2026-01-29（基于Sprint 2-5经验教训 + Agent自动化集成）

---

## 🤖 Agent 自动化指令 (FOR BMAD AGENT)

**当用户说：** "基于sprint-planning-checklist做sprint planning" 或类似指令时

**Agent 应自动执行以下步骤：**

1. **读取此 checklist** 并向用户展示关键检查项
2. **到达 Section 9（版本清单创建）时：**
   - ⚡ **自动运行** `gcredit-project/scripts/check-versions.ps1`
   - 展示版本输出给用户 review
   - 询问是否需要添加特殊注释（如：Prisma锁定原因）
   - 创建 `docs/sprints/sprint-N/version-manifest.md` 文件
   - 标记 Section 9 完成 ✅
3. **到达 Section 12（Sprint Backlog创建）时：**
   - ⚡ **自动使用** `sprint-backlog-template.md` 模板
   - 填充已知信息（Sprint目标、Story列表、版本清单引用等）
   - 询问是否需要添加额外技术任务
   - 创建 `docs/sprints/sprint-N/backlog.md` 文件
   - 标记 Section 12 完成 ✅
4. **引导用户** 完成其他手动检查项（资源清单回顾、Story分解等）
5. **最终确认** 所有必填项（标记🚨 MANDATORY）已完成

**Agent 无需等待用户单独说 "创建版本清单" 或 "创建Sprint Backlog"** - 这些应该是 Planning 流程的自动化部分。
   - 创建 `docs/sprints/sprint-N/version-manifest.md` 文件
   - 标记 Section 9 完成 ✅
3. **引导用户** 完成其他手动检查项（资源清单回顾、Story分解等）
4. **最终确认** 所有必填项（标记🚨 MANDATORY）已完成

**Agent 无需等待用户单独说 "创建版本清单"** - 这应该是 Planning 流程的自动化部分。

---

## 📋 Planning会议前准备（Pre-Planning Phase）

### 1. 回顾前一Sprint
- [ ] 检查前一Sprint的DoD（Definition of Done）是否全部完成
- [ ] 查看Sprint Retrospective中的改进行动项
- [ ] 确认所有技术债务已记录

### 2. 资源清单回顾（🚨 关键步骤）
- [ ] **必须：** 阅读 [`docs/setup/infrastructure-inventory.md`](../setup/infrastructure-inventory.md)
- [ ] 列出当前可用的Azure资源
- [ ] 列出当前可用的Database Tables/Models
- [ ] 检查`.env`文件中的环境变量配置
- [ ] 验证npm依赖包（`package.json`）

**为什么重要：**  
Sprint 2差点重复创建Azure Storage Account，因为Planning时没有回顾Sprint 0的交付物。检查资源清单可以避免：
- 重复创建云资源（浪费成本）
- 架构不一致
- 环境配置混乱
- 数据库表重复定义

**Sprint 3-5补充经验：**
- Sprint 3: UUID验证bug提醒我们**永远不要跳过失败的测试**，看似小问题可能隐藏真实bug
- Sprint 4: Timeline-based测试approach证明有效，继续在复杂功能中使用
- Sprint 5: 架构预先准备（Winston的ADRs）避免了开发中的技术争议，节省大量时间

### 2.5 回顾 Lessons Learned（🚨 MANDATORY）⚡ [AGENT AUTO-REMINDER]

**🤖 Agent 提醒：** 当执行Planning时，Agent应自动提示用户查看lessons-learned.md的关键部分，避免重复踩坑。

**文件位置：** `docs/lessons-learned/lessons-learned.md` (2,296 lines, 18个教训)

**Agent 执行步骤：**
1. 读取 lessons-learned.md 的最新内容
2. 提取最相关的3-5个教训（基于历史Sprint）
3. 向用户展示：
   - Velocity Metrics（估时参考）
   - 最近3个Sprint的关键教训
   - 常见陷阱（Common Pitfalls）
4. 询问："这些教训是否影响本Sprint的规划？"
5. 标记此项完成 ✅

---

**必须回顾的部分：**
- [ ] **Velocity Metrics** - 历史估时准确性（Sprint 0-5）
- [ ] **最近3个Sprint Lessons** - 避免重复错误
- [ ] **Cross-Sprint Patterns** - 12个已验证的开发模式
- [ ] **Common Pitfalls** - 常见陷阱清单

**重点教训（必看）：**
- ⚠️ **Lesson 1:** 版本漂移问题 → 已解决（Section 9自动创建Version Manifest）
- ⚠️ **Lesson 11:** 文档组织原则（SSOT vs 副本）
- ⚠️ **Lesson 15:** SSOT需要强制执行
- 📊 **Velocity指标:** Sprint 0-5的估时准确性数据

**快速检查命令（可选）：**
```powershell
# 查看最新更新日期
Get-Item "gcredit-project/docs/lessons-learned/lessons-learned.md" | Select LastWriteTime

# 搜索特定关键词
Select-String -Path "gcredit-project/docs/lessons-learned/lessons-learned.md" -Pattern "版本|路径|测试"
```

**对BMad的快速命令：**
- "展示历史Velocity指标"
- "回顾最近的Lessons Learned"
- "在Lessons中搜索：[关键词]"

🔗 **参考：** [lessons-learned.md](../../lessons-learned/lessons-learned.md) - 完整教训文档

### 3. 技术环境验证
- [ ] 确认开发环境（Dev）可用
- [ ] 确认数据库连接正常
- [ ] 确认Azure服务连接正常（如适用）
- [ ] 确认Git分支策略清晰

### 4. 前置依赖检查
- [ ] 确认所有阻塞问题已解决
- [ ] 确认外部依赖（如API、第三方服务）可用
- [ ] 确认团队成员可用性

---

## 🎯 Sprint Planning会议中（Planning Phase）

### 5. Sprint目标定义
- [ ] Sprint目标清晰、可度量
- [ ] 团队对目标达成共识
- [ ] Sprint目标与产品路线图一致

### 6. Epic/Story分解
- [ ] Epic已分解为可在一个Sprint完成的Stories
- [ ] 每个Story符合INVEST原则（Independent, Negotiable, Valuable, Estimable, Small, Testable）
- [ ] Story的验收标准明确

### 7. 技术任务识别
- [ ] 每个Story的技术任务已列出
- [ ] 识别所有技术依赖
- [ ] 识别所有技术风险

### 8. 资源需求分析（🚨 关键步骤）
- [ ] **逐一检查：** 每个技术任务是否需要新资源？
- [ ] **新Azure资源：** 是否已存在？参考 `docs/setup/infrastructure-inventory.md`
- [ ] **新Database Table：** 是否与现有Schema冲突？
- [ ] **新npm Package：** 是否已安装？版本兼容吗？
- [ ] **新环境变量：** 命名是否与现有冲突？

**检查表：**
```markdown
| 任务 | 需要的资源 | 状态 | 备注 |
|-----|----------|------|-----|
| Task X.Y.Z | Azure Storage Account | ✅ 已存在（Sprint 0） | 使用 gcreditdevstoragelz |
| Task A.B.C | PostgreSQL Table "badges" | ❌ 需创建 | 新表，无冲突 |
| Task D.E.F | npm: @azure/storage-blob | ✅ 已安装（v12.30.0） | 无需重复安装 |
```

### 9. 版本清单创建（🚨 MANDATORY）⚡ [AGENT AUTO-EXEC]

**🤖 Agent 自动执行：** 当处理此 checklist 时，Agent 应在到达此步骤时自动运行版本检查脚本，无需等待用户额外指令。

**脚本位置：** `gcredit-project/scripts/check-versions.ps1`

**Agent 执行步骤：**
1. 自动运行 check-versions.ps1
2. 展示所有依赖版本给用户
3. 询问："是否需要添加特殊注释？（如：Prisma锁定6.19.2的原因）"
4. 根据用户回复创建或更新 version-manifest.md
5. 标记此项完成 ✅

---

**为什么重要（Sprint 0 经验教训）：**
防止版本漂移！Sprint 0 时 Prisma 7 意外安装导致 1 小时调试降级。Version manifest 记录每个 Sprint 的版本快照，即使不添加新依赖，也要记录当前版本状态。

**手动方法（备用）：**
- "运行check-versions脚本并创建文档"

**BMad会自动：**
1. 运行 `check-versions.ps1` 脚本
2. 展示所有依赖版本给你review
3. 询问是否需要特殊注释（如："Prisma锁定6.19.2是因为7.0.0不兼容"）
4. 创建 `docs/sprints/sprint-N/version-manifest.md` 文件
5. 标记此清单项完成 ✅

**手动方法（备用）：**
```powershell
# 如果需要手动执行
.\gcredit-project\scripts\check-versions.ps1
```

**检查清单：**
- [ ] **版本清单已创建** （通过BMad Agent或手动）
- [ ] Frontend stack 版本已记录（React, Vite, TypeScript, etc.）
- [ ] Backend stack 版本已记录（NestJS, Prisma, Node.js, etc.）
- [ ] Database & Infrastructure 版本已记录
- [ ] 新依赖安装命令已准备（如有）
- [ ] 已知安全问题已记录（如有）
- [ ] 特殊版本锁定原因已注释（如：Prisma 6.19.2）

**🔗 参考：** [sprint-version-manifest-template.md](./sprint-version-manifest-template.md) - 包含Agent命令完整说明

### 10. 时间估算
- [ ] 每个Story有时间估算（小时或Story Points）
- [ ] 估算基于团队历史速度（Velocity）
- [ ] 考虑团队成员的可用工作时间
- [ ] **调整：** 如果资源已存在，减少配置时间（如：Azure配置1.5h → 验证0.5h）

### 11. 依赖管理
- [ ] Story之间的依赖关系已明确
- [ ] 跨团队依赖已识别并沟通
- [ ] 关键路径（Critical Path）已识别

---

## 📝 文档创建阶段（Documentation Phase）

### 12. Sprint Backlog文档创建 ⚡ [AGENT AUTO-EXEC]

**🤖 Agent 自动执行：** 当处理此 checklist 到达此步骤时，Agent 应自动基于 `sprint-backlog-template.md` 创建Sprint Backlog文档。

**模板位置：** `docs/templates/sprint-backlog-template.md`  
**输出位置：** `docs/sprints/sprint-N/backlog.md`

**Agent 执行步骤：**
1. 读取 `sprint-backlog-template.md` 模板
2. 填充已知信息：
   - Sprint目标（从之前步骤获取）
   - 用户故事列表（引用详细story文档）
   - 版本清单（引用Section 9创建的version-manifest.md）
3. 向用户展示初步Backlog内容
4. 询问："是否需要添加额外的技术任务或注释？"
5. 创建 `docs/sprints/sprint-N/backlog.md` 文件
6. 标记此项完成 ✅

---

**Backlog文档应包含：**
- [ ] Sprint目标和成功标准
- [ ] 所有User Stories（精简版 + 链接到详细story文档）
- [ ] 技术任务列表
- [ ] 容量规划表
- [ ] 风险和依赖
- [ ] **交叉引用：** 引用 `infrastructure-inventory.md` 和 `version-manifest.md`
- [ ] Sprint仪式时间表

**📋 模板关系说明：**
- `sprint-backlog-template.md` 定义Backlog的**结构和格式**
- `user-story-template.md` 定义**详细用户故事**的格式
- Backlog中的Story部分使用**精简格式**（标题+链接），详细内容在独立的story文档中

**代码示例最佳实践（Backlog中的技术任务）：**
```typescript
// ❌ 错误：硬编码资源名
const containerName = 'badge-images';

// ✅ 正确：使用环境变量
const containerName = process.env.AZURE_STORAGE_CONTAINER_BADGES;
```

**🔗 参考：** [sprint-backlog-template.md](./sprint-backlog-template.md) - 完整Backlog模板

### 13. Sprint Kick-off文档
- [ ] 创建 `sprint-{N}-kickoff.md`
- [ ] 包含每日详细计划
- [ ] **调整时间：** 反映资源复用节省的时间
- [ ] 包含Sprint Review和Retrospective的时间安排
- [ ] 包含参考文档链接

### 14. 技术设置指南
- [ ] 如需新资源，创建 `sprint-{N}-{resource}-setup-guide.md`
- [ ] **明确说明：** 哪些资源已存在，哪些需新建
- [ ] 包含验证步骤（即使资源已存在）
- [ ] 包含故障排查部分

### 15. 资源清单更新计划
- [ ] 计划在Sprint结束时更新 `docs/setup/infrastructure-inventory.md`
- [ ] 在Sprint Backlog的DoD中明确列出
- [ ] 指定负责人

---

## 🌿 Git分支策略（🚨 CRITICAL - Sprint启动前必须执行）

### 16. Git分支规划（🚨 MANDATORY）

**⚠️ 重要：** 这是Sprint启动的第一步，必须在任何开发工作前完成！

- [ ] **确认分支命名规范**
  - 格式：`sprint-N/epic-X-description`
  - 示例：`sprint-6/epic-7-badge-sharing`
  - 遵循项目GitFlow策略

- [ ] **验证main分支状态**
  - [ ] 切换到main分支：`git checkout main`
  - [ ] 拉取最新代码：`git pull origin main`
  - [ ] 确认工作区干净：`git status`（无未提交变更）

- [ ] **计划分支创建时间点**
  - [ ] **Kickoff会议结束后立即执行**（作为Story 0.1）
  - [ ] 或Planning完成并提交准备文档到main后

- [ ] **分支创建命令准备**
  ```bash
  # 创建并切换到新分支
  git checkout -b sprint-N/epic-X-description
  
  # 推送到远程并设置上游跟踪
  git push -u origin sprint-N/epic-X-description
  
  # 验证当前分支
  git branch
  ```

- [ ] **将分支创建纳入Sprint Backlog**
  - [ ] 在Sprint Backlog中列为Story 0.1
  - [ ] 标记为CRITICAL优先级
  - [ ] 明确"必须在任何代码修改前完成"

**🎓 Lesson Learned（Sprint 6经验）：**
> Git分支创建容易被遗漏！必须在Planning阶段明确规划，并在Kickoff后立即执行。如果在main分支开发，会违反GitFlow并导致后续merge困难。

**防止遗漏检查清单：**
- [ ] ✅ Planning时已规划分支名称
- [ ] ✅ Sprint Tracking文档中Story 0.1是"Create Git Branch"
- [ ] ✅ Kickoff Checklist中包含分支创建验证
- [ ] ✅ 在开始Story 0.2（安装依赖）前验证已在正确分支

---

## ✅ 最终验证（Readiness Check）

### 17. 团队就绪度
- [ ] 所有团队成员理解Sprint目标
- [ ] 所有团队成员理解自己的任务
- [ ] 团队对Sprint承诺有信心

### 18. 技术就绪度
- [ ] 开发环境可用
- [ ] **资源清单已回顾，无重复创建风险** (参考 `docs/setup/infrastructure-inventory.md`)
- [ ] **版本清单已创建** (参考 `docs/sprints/sprint-N/version-manifest.md`) 🚨 MANDATORY
- [ ] **Git分支策略已规划** (分支名称已确定) 🚨 MANDATORY
- [ ] 所有工具和依赖已准备好
- [ ] 测试环境可用

### 19. 流程就绪度
- [ ] Sprint仪式（Ceremonies）时间已安排
- [ ] Daily Standup时间已确定
- [ ] Sprint Review和Retrospective已预订
- [ ] **Git分支创建已列为Story 0.1** 🚨 MANDATORY

### 20. 风险管理
- [ ] 高风险任务已识别
- [ ] 缓解计划已制定
- [ ] 应急方案已讨论

### 20. 沟通计划
- [ ] 利益相关者已通知Sprint目标
- [ ] 沟通渠道已明确
- [ ] 阻塞问题上报机制已确认

### 21. 最终批准
- [ ] Scrum Master批准就绪度
- [ ] Product Owner批准Sprint Backlog
- [ ] 团队对Sprint开始达成共识

---

## 🎓 经验教训（Lessons Learned）

### Sprint 2案例：Azure资源重复创建风险

**问题：**  
Sprint 2的Planning文档建议创建新的Azure Storage Account `gcreditdev`和Container `badge-images`，但Sprint 0已经创建了`gcreditdevstoragelz`和`badges`容器，完全满足需求。

**根本原因：**
1. Planning时没有系统性回顾前一Sprint的交付物
2. 没有"资源清单"作为单一真实来源（Single Source of Truth）
3. 文档创建时间与实施时间间隔长，信息衰减

**影响（如果未发现）：**
- Azure成本增加（重复Storage Account ~$5/月）
- 架构不一致（图片分散在两个账户）
- 代码混乱（不知道用哪个Container）
- 未来需要数据迁移

**解决方案：**
1. ✅ 创建 `docs/infrastructure-inventory.md`（单一真实来源）
2. ✅ 在Planning Checklist中添加"资源清单回顾"步骤
3. ✅ 修正Sprint 2所有Planning文档（"创建" → "验证"）
4. ✅ 更新Sprint Planning流程，强制检查资源清单

**教训：**
- **永远先查后建：** 在Planning任何"创建"任务前，先查 `infrastructure-inventory.md`
- **环境变量优先：** 代码中使用环境变量，避免硬编码资源名称
- **文档交叉引用：** Planning文档必须引用资源清单
- **DoD包含清单更新：** Sprint完成后必须更新资源清单

---

## 📚 相关文档

- **资源清单：** [docs/setup/infrastructure-inventory.md](../setup/infrastructure-inventory.md)
- **Sprint文档：** [docs/sprints/](../sprints/) (Sprint 0-5完整文档)
- **经验教训：** [docs/lessons-learned/lessons-learned.md](../lessons-learned/lessons-learned.md)
- **架构决策：** [docs/decisions/](../decisions/) (ADRs)

---

## 📊 Checklist使用记录

| Sprint | Planning日期 | 检查完成率 | 发现的问题 | 备注 |
|--------|------------|----------|-----------|------|
| Sprint 0 | 2026-01-24 | N/A | N/A | Checklist尚未存在 |
| Sprint 1 | 2026-01-25 | N/A | N/A | Checklist尚未存在 |
| Sprint 2 | 2026-01-25 | ~85% | 未回顾Sprint 0资源 | **已修正文档** |
| Sprint 3 | 2026-01-27 | ~95% | 无重大问题 | 使用此Checklist，成功避免资源重复 |
| Sprint 4 | 2026-01-28 | ~90% | 无重大问题 | 架构复杂度高但准备充分 |
| Sprint 5 | 2026-01-29 | 100% | 架构预先准备成功 | Winston的ADRs节省大量开发时间 |
| Sprint 6 | TBD | TBD | TBD | 计划使用 |

---

**版本历史：**
- v1.0（2026-01-26）- 初始版本，基于Sprint 2经验教训创建
- v1.1（2026-01-29）- 添加Sprint 3-5经验教训，修复路径引用
