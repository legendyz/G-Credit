# Sprint Planning Checklist

**目的：** 确保Sprint Planning全面、准确，避免重复工作和资源浪费  
**使用时机：** 每个Sprint开始前的Planning阶段  
**责任人：** Product Manager + Scrum Master  
**最后更新：** 2026-01-29（基于Sprint 2-5经验教训）

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

### 9. 时间估算
- [ ] 每个Story有时间估算（小时或Story Points）
- [ ] 估算基于团队历史速度（Velocity）
- [ ] 考虑团队成员的可用工作时间
- [ ] **调整：** 如果资源已存在，减少配置时间（如：Azure配置1.5h → 验证0.5h）

### 10. 依赖管理
- [ ] Story之间的依赖关系已明确
- [ ] 跨团队依赖已识别并沟通
- [ ] 关键路径（Critical Path）已识别

---

## 📝 文档创建阶段（Documentation Phase）

### 11. Sprint Backlog文档
- [ ] 创建 `sprint-{N}-backlog.md`
- [ ] 包含所有Story和Task的详细描述
- [ ] **交叉引用：** 引用 `docs/setup/infrastructure-inventory.md`
- [ ] **代码示例：** 使用环境变量，不要硬编码资源名称
- [ ] 包含验收标准和测试策略

**代码示例最佳实践：**
```typescript
// ❌ 错误：硬编码资源名
const containerName = 'badge-images';

// ✅ 正确：使用环境变量
const containerName = process.env.AZURE_STORAGE_CONTAINER_BADGES;
```

### 12. Sprint Kick-off文档
- [ ] 创建 `sprint-{N}-kickoff.md`
- [ ] 包含每日详细计划
- [ ] **调整时间：** 反映资源复用节省的时间
- [ ] 包含Sprint Review和Retrospective的时间安排
- [ ] 包含参考文档链接

### 13. 技术设置指南
- [ ] 如需新资源，创建 `sprint-{N}-{resource}-setup-guide.md`
- [ ] **明确说明：** 哪些资源已存在，哪些需新建
- [ ] 包含验证步骤（即使资源已存在）
- [ ] 包含故障排查部分

### 14. 资源清单更新计划
- [ ] 计划在Sprint结束时更新 `docs/setup/infrastructure-inventory.md`
- [ ] 在Sprint Backlog的DoD中明确列出
- [ ] 指定负责人

---

## ✅ 最终验证（Readiness Check）

### 15. 团队就绪度
- [ ] 所有团队成员理解Sprint目标
- [ ] 所有团队成员理解自己的任务
- [ ] 团队对Sprint承诺有信心

### 16. 技术就绪度
- [ ] 开发环境可用
- [ ] **资源清单已回顾，无重复创建风险** (参考 `docs/setup/infrastructure-inventory.md`)
- [ ] 所有工具和依赖已准备好
- [ ] 测试环境可用

### 17. 流程就绪度
- [ ] Sprint仪式（Ceremonies）时间已安排
- [ ] Daily Standup时间已确定
- [ ] Sprint Review和Retrospective已预订

### 18. 风险管理
- [ ] 高风险任务已识别
- [ ] 缓解计划已制定
- [ ] 应急方案已讨论

### 19. 沟通计划
- [ ] 利益相关者已通知Sprint目标
- [ ] 沟通渠道已明确
- [ ] 阻塞问题上报机制已确认

### 20. 最终批准
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
