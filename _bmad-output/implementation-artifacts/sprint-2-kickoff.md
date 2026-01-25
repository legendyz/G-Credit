# Sprint 2 启动文档（Sprint Kick-off）

**Sprint名称：** Sprint 2 - Epic 3: Badge Template Management  
**Sprint周期：** 2026-01-27（周一）至 2026-02-07（周五），10个工作日  
**Sprint目标：** 建立完整的数字徽章模板管理系统，支持灵活的技能分类体系和Azure Blob图片存储  
**估算工作量：** 32-33小时  
**工作节奏：** 每天3-3.5小时，正常强度

---

## ✅ Sprint 2 准备度最终确认

**Readiness检查日期：** 2026-01-25  
**检查结果：** ✅ **READY TO GO (99%)**

| 维度 | 就绪度 | 状态 |
|-----|-------|------|
| 业务就绪 | 100% | ✅ Ready |
| 技术就绪 | 100% | ✅ Ready（Azure可用）|
| 团队就绪 | 100% | ✅ Ready |
| 流程就绪 | 95% | ✅ Ready |
| 环境就绪 | 100% | ✅ Ready（Azure配置清单已准备）|
| **综合评分** | **99%** | ✅ **GO** |

**批准启动：** ✅ Scrum Master已批准  
**Azure订阅：** ✅ 已确认可用

---

## 🎯 Sprint 2目标与范围

### 主要目标
1. **建立徽章模板数据模型** - 支持灵活的Badge Template定义
2. **实现技能分类体系** - 5个预设分类 + 自定义能力（最多3层）
3. **集成Azure Blob存储** - 徽章图片上传/管理
4. **完整的CRUD API** - 创建、查询、更新、搜索徽章模板
5. **颁发标准定义** - 灵活的JSON Schema验证机制

### Sprint 2 Scope

**包含（In Scope）：**
- ✅ Story 3.1: 徽章模板与技能分类数据模型（5-6h）
- ✅ Story 3.2: 创建徽章模板API + Azure Blob集成（6-7h）
- ✅ Story 3.3: 查询徽章模板API（3-4h）
- ✅ Story 3.4: 徽章目录与搜索优化（4-5h）
- ✅ Story 3.5: 颁发标准定义（3-4h）
- ✅ Story 3.6: 自定义技能分类管理（4-5h）
- ✅ Enhancement 1: Azure Blob图片完整管理（2-3h）

**排除（Out of Scope）：**
- ❌ 徽章审批工作流（延期到Sprint 3+）
- ❌ 完整的分类管理UI（仅基础API）
- ❌ 分类模板市场/导入导出

---

## 📅 Sprint 2 详细时间表

### Week 1: 数据模型与核心API（2026-01-27 至 01-31）

**Day 1（周一，1月27日）- Azure配置 + Story 3.1启动**
- ⏰ 上午（1-1.5h）
  - [ ] Azure Blob Storage配置
  - [ ] 运行连接测试脚本
  - [ ] 验证图片上传功能
- ⏰ 下午（2-2.5h）
  - [ ] Task 3.1.1: 设计BadgeTemplate模型（1.5h）
  - [ ] Task 3.1.2: 设计SkillCategory模型（开始，1h）
- 📊 **预计完成：** 3.5-4小时
- 🎯 **交付：** Azure配置完成，数据模型设计50%

**Day 2（周二，1月28日）- Story 3.1完成 + Story 3.6启动**
- ⏰ 全天（3.5-4h）
  - [ ] Task 3.1.2: SkillCategory模型完成（1h）
  - [ ] Task 3.1.3: Skill模型设计（1h）
  - [ ] Task 3.1.4: 数据库迁移（0.5h）
  - [ ] Task 3.1.5: 创建种子数据（1h）
  - [ ] Task 3.6.1: 分类管理DTO（0.5h，如有时间）
- 📊 **预计完成：** 3.5-4小时
- 🎯 **交付：** Story 3.1完成，数据库迁移成功，5个分类模板已加载

**Day 3（周三，1月29日）- Story 3.6完成 + Story 3.2启动**
- ⏰ 全天（3.5-4h）
  - [ ] Task 3.6.2: 分类CRUD API（2.5h）
  - [ ] Task 3.6.3: 技能管理API（1h）
  - [ ] Task 3.2.1: Azure Blob配置代码（开始，0.5h）
- 📊 **预计完成：** 3.5-4小时
- 🎯 **交付：** Story 3.6完成，自定义分类管理API就绪

**Day 4（周四，1月30日）- Story 3.2开发**
- ⏰ 全天（3.5-4h）
  - [ ] Task 3.2.1: Azure Blob配置完成（1h）
  - [ ] Task 3.2.2: 图片上传Service（2h）
  - [ ] Task 3.2.3: DTO和验证（0.5h）
- 📊 **预计完成：** 3.5小时
- 🎯 **交付：** 图片上传功能完成80%

**Day 5（周五，1月31日）- Story 3.2完成 + Story 3.3启动**
- ⏰ 全天（3-3.5h）
  - [ ] Task 3.2.4: Controller和Service完成（1.5h）
  - [ ] Story 3.2集成测试（0.5h）
  - [ ] Task 3.3.1: 查询DTO（0.5h）
  - [ ] Task 3.3.2: 公开查询接口（开始，1h）
- 📊 **预计完成：** 3-3.5小时
- 🎯 **交付：** Story 3.2完成，Story 3.3进行中

**Week 1总结：**
- 完成Stories: 3.1, 3.6, 3.2, 3.3（部分）
- 累计时间: ~17-19小时
- Azure集成：✅ 完成
- 数据模型：✅ 完成

---

### Week 2: 高级功能与收尾（2026-02-03 至 02-07）

**Day 6（周一，2月3日）- Story 3.3完成 + Story 3.4启动**
- ⏰ 全天（3-3.5h）
  - [ ] Task 3.3.2: 公开查询完成（0.5h）
  - [ ] Task 3.3.3: 管理员详情查询（1h）
  - [ ] Task 3.4.1: 优化数据库索引（1h）
  - [ ] Task 3.4.2: 分类树状浏览（开始，1h）
- 📊 **预计完成：** 3-3.5小时
- 🎯 **交付：** Story 3.3完成，搜索优化启动

**Day 7（周二，2月4日）- Story 3.4 + Story 3.5**
- ⏰ 全天（3.5-4h）
  - [ ] Task 3.4.2: 分类树完成（1h）
  - [ ] Task 3.4.3: 高级搜索（1.5h）
  - [ ] Task 3.4.4: 性能测试（0.5h）
  - [ ] Task 3.5.1: 颁发标准Schema（开始，1h）
- 📊 **预计完成：** 3.5-4小时
- 🎯 **交付：** Story 3.4完成，Story 3.5进行中

**Day 8（周三，2月5日）- Story 3.5完成 + Enhancement**
- ⏰ 全天（3-3.5h）
  - [ ] Task 3.5.1: Schema完成（0.5h）
  - [ ] Task 3.5.2: 验证Service（1h）
  - [ ] Task 3.5.3: 更新Service（0.5h）
  - [ ] Task 3.5.4: 标准模板API（1h）
  - [ ] Task E1.1: 图片删除功能（开始，0.5h）
- 📊 **预计完成：** 3-3.5小时
- 🎯 **交付：** Story 3.5完成，Enhancement启动

**Day 9（周四，2月6日）- 测试与Bug修复**
- ⏰ 全天（3-4h）
  - [ ] Task E1.1: 图片删除完成（0.5h）
  - [ ] Task E1.2: 图片优化（1h）
  - [ ] Task E1.3: CDN配置文档（0.5h）
  - [ ] 完整集成测试（1h）
  - [ ] Bug修复（1h缓冲）
- 📊 **预计完成：** 3-4小时
- 🎯 **交付：** 所有功能完成，测试通过

**Day 10（周五，2月7日）- Sprint收尾**
- ⏰ 全天（2-3h）
  - [ ] API文档更新（Swagger）（0.5h）
  - [ ] 技术文档完善（0.5h）
  - [ ] Sprint Demo准备（0.5h）
  - [ ] Sprint 2 Retrospective（0.5-1h）
  - [ ] 合并到main分支（0.5h）
- 📊 **预计完成：** 2-3小时
- 🎯 **交付：** Sprint 2完整交付

**Week 2总结：**
- 完成Stories: 3.3, 3.4, 3.5, Enhancement 1
- 累计时间: ~15-17小时
- **Sprint 2总计: 32-36小时**

---

## 🎯 Sprint 2 交付物清单

### 代码交付
- [ ] **3个新Prisma模型**
  - BadgeTemplate
  - SkillCategory
  - Skill
- [ ] **15+个新API端点**
  - 5个Badge Template API
  - 5个Skill Category API
  - 3个Skill API
  - 2个辅助API（标准模板、验证）
- [ ] **Azure Blob集成**
  - BlobStorageService
  - 图片上传/删除/优化
- [ ] **60+个测试用例**
  - 单元测试（80%覆盖率）
  - 集成测试
  - E2E测试

### 数据交付
- [ ] **5个预设技能分类模板**
  1. 技术技能 (Technical Skills)
  2. 软技能 (Soft Skills)
  3. 行业知识 (Domain Knowledge)
  4. 公司特定能力 (Company-Specific Competencies) ⭐
  5. 通用职业技能 (Professional Skills)
- [ ] **20+个示例子分类**（每个顶层分类4个子分类）
- [ ] **50+个示例技能**
- [ ] **10个测试徽章模板**

### 文档交付
- [ ] **API文档（Swagger）**
  - 所有15+个endpoint
  - 请求/响应示例
  - 错误码说明
- [ ] **数据模型文档**
  - ER图
  - 字段说明
  - 关系解释
- [ ] **颁发标准Schema文档**
  - JSON Schema定义
  - 示例模板
  - 验证规则
- [ ] **Azure Blob配置指南**
  - 配置步骤
  - 测试脚本
  - 故障排查
- [ ] **Sprint 2 Retrospective**
  - 完成情况总结
  - 经验教训
  - 改进建议

---

## 🔧 技术准备清单

### 开发环境
- [x] Node.js 20+ 已安装
- [x] PostgreSQL 16 运行正常
- [x] VS Code + 扩展配置
- [x] Git配置正确
- [ ] Azure订阅已激活 ⚠️ **Day 1上午完成**

### npm包准备
需要新安装的包：
```bash
npm install @azure/storage-blob
npm install sharp
npm install --save-dev @types/sharp
npm install ajv  # JSON Schema验证
```

### 环境变量
需要添加到 `backend/.env`：
```env
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_ACCOUNT_NAME=gcreditdev
AZURE_BLOB_CONTAINER_BADGES=badge-images
```

### Git分支
- [x] 主分支：`main` 
- [x] Sprint 2分支：`sprint-2/epic-3-badge-templates` ✅ 已创建

---

## 📊 Definition of Done

每个Story完成需满足：
- [ ] 代码实现完整
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过
- [ ] Code Review通过（solo dev自我审查）
- [ ] API文档已更新
- [ ] 无阻塞性bug
- [ ] 符合验收标准

Sprint 2完成需满足：
- [ ] 所有6个Story完成
- [ ] Enhancement 1完成
- [ ] 所有测试通过（60+个）
- [ ] API文档完整
- [ ] Azure集成验证通过
- [ ] Demo可运行
- [ ] Retrospective完成

---

## ⚠️ 风险与缓解措施

| 风险 | 等级 | 缓解措施 | 负责人 |
|-----|------|---------|--------|
| Azure Blob配置失败 | Medium | Day 1上午优先完成，准备降级方案（本地存储） | SM |
| 技能分类设计复杂 | Medium | 先实现基础3层，复杂逻辑延后 | Architect |
| 图片上传性能问题 | Low | 添加文件大小限制，使用流式上传 | Dev |
| 工作量超出预期 | Medium | P1任务可调整，优先完成P0 | SM |

---

## 📞 Sprint仪式安排

### Daily Standup（可选，solo dev）
- **时间：** 每天开始开发前
- **内容：** 
  - 昨天完成了什么？
  - 今天计划做什么？
  - 有什么阻碍？

### Sprint Review
- **时间：** 2026-02-07（周五）下午
- **参与：** PO, SM, Dev Team
- **内容：** Demo所有完成的功能

### Sprint Retrospective
- **时间：** 2026-02-07（周五）Review后
- **参与：** SM, Dev Team
- **内容：** 
  - What went well?
  - What could be improved?
  - Action items for Sprint 3

---

## 🎬 立即行动（今天2026-01-25）

### ✅ 已完成
- [x] Sprint 2 Backlog创建并批准
- [x] Readiness检查完成（99% Ready）
- [x] Sprint 2分支创建（`sprint-2/epic-3-badge-templates`）
- [x] Azure配置指南准备
- [x] README更新（Sprint 2 Ready to Start）

### 🔜 下一步（周一上午，2026-01-27）

1. **Azure配置（必须，1-1.5小时）**
   ```bash
   # 按照 sprint-2-azure-setup-guide.md 执行
   - 创建Storage Account
   - 创建Container
   - 获取Connection String
   - 运行测试脚本
   ```

2. **开始Story 3.1（2-2.5小时）**
   ```bash
   # 切换到开发者模式
   .dev
   # 开始Task 3.1.1
   ```

---

## 📚 参考文档

- **Sprint 2 Backlog:** `_bmad-output/implementation-artifacts/sprint-2-backlog.md`
- **Azure配置指南:** `_bmad-output/implementation-artifacts/sprint-2-azure-setup-guide.md`
- **Sprint 1 Retrospective:** `_bmad-output/implementation-artifacts/sprint-1-retrospective.md`
- **项目README:** `README.md`

---

**Sprint 2状态：** ✅ **READY TO GO**  
**开始时间：** 2026-01-27（周一）  
**结束时间：** 2026-02-07（周五）  

**祝Sprint 2顺利！🚀**
