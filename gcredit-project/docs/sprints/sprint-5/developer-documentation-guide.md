# Sprint 5 Quick Reference Card for Tech Lead
## 如何指导Developer使用文档

**创建日期：** 2026-01-28  
**适用对象：** LegendZhu (Tech Lead)  
**目标：** 明确告知Amelia (Developer) 需要阅读什么文档

---

## 📋 Sprint 5开始时的指令

### 给Developer的一句话指令

> **"Amelia，Sprint 5开始。请先读technical-design.md（30分钟），然后按backlog.md的Story顺序实现。所有代码示例和技术细节都在backlog中，遇到'为什么'的问题再查ADR。"**

---

## 📚 文档分类（3层结构）

### 🔴 Tier 1: 必读（开发前）

| 文档 | 阅读时间 | 何时读 | 关键作用 |
|------|----------|--------|----------|
| **technical-design.md** | 30分钟 | Day 1上午 | 理解整体架构和数据流 |
| **backlog.md** | 持续参考 | 每个Story开始前 | 获取实现细节和代码示例 |

**Total: 30分钟前期投入 + Story级持续参考**

---

### 🟡 Tier 2: 按需参考（遇到问题时）

| 文档 | 何时查阅 | 解决什么问题 |
|------|----------|-------------|
| **ADR-005** | 不理解为什么用托管验证 | "为什么不用GPG签名？" |
| **ADR-006** | 不理解安全设计理由 | "为什么速率限制是1000/小时？" |
| **ADR-007** | 不理解缓存策略 | "为什么延迟生成而不是提前生成？" |

**使用频率：** 预计每个Sprint查阅2-3次（总计30分钟）

---

### 🟢 Tier 3: 辅助文档（特定任务）

| 文档 | 触发条件 | 用途 |
|------|----------|------|
| **sharp-installation-guide.md** | `npm install sharp`报错 | Windows安装问题排查 |
| **external-validator-testing-guide.md** | Story 6.4集成测试 | 在Credly/Badgr测试徽章 |
| **ux-verification-page-design.md** | Story 6.2前端UI | 5种页面状态设计规范 |
| **seo-open-graph-setup.md** | Story 6.2 SEO优化 | Open Graph meta标签配置 |

**使用频率：** 按需（可能只用1-2个）

---

## ✅ backlog.md已包含的内容（Developer无需额外查文档）

### 代码示例（可直接复制使用）

- ✅ `generateOpenBadgesAssertion()` 完整实现（80行TypeScript）
- ✅ `@Public()` decorator实现（10行）
- ✅ `ThrottlerModule` 配置（20行）
- ✅ CORS配置（15行）
- ✅ Database Migration SQL（30行，含Rollback）
- ✅ sharp package使用示例（15行）
- ✅ Email hashing算法（5行）

**Total: ~200行可复制代码**

### 技术概念解释

- ✅ Open Badges 2.0三层架构（Issuer → BadgeClass → Assertion）
- ✅ JSON-LD的@context作用和必要性
- ✅ Hosted Verification工作原理（4步流程图）
- ✅ iTXt chunk在PNG中的作用
- ✅ SHA-256哈希保护隐私的原理

### 安全配置详解

- ✅ 为什么需要@Public() decorator
- ✅ 如何配置Rate Limiting（代码+解释）
- ✅ CORS配置的安全考量
- ✅ 隐私保护（email hashing、privacy enum）

---

## 🚫 常见错误（避免过度指导）

### ❌ 错误做法

```
Tech Lead: "Amelia，你需要先理解Open Badges 2.0规范，
           去这个网站看文档..."
           ↓
Developer: "我需要学习多久？"（不确定性，焦虑）
```

### ✅ 正确做法

```
Tech Lead: "Amelia，backlog的Story 6.1有完整代码示例，
           直接复制调整就行。"
           ↓
Developer: "好的，我看到代码了。"（明确，自信）
```

---

## 📊 预期文档使用统计（7天Sprint）

| 文档 | 预计打开次数 | 总阅读时间 |
|------|-------------|-----------|
| backlog.md | 50+ | 持续参考（每天1小时） |
| technical-design.md | 2-3 | 30分钟（Day 1） + 15分钟（复习） |
| ADR-005/006/007 | 3-5 | 30分钟（按需） |
| 辅助文档 | 2-3 | 20分钟（特定任务） |

**总文档阅读时间：** ~8小时（占56小时Sprint的14%）

**编码实际时间：** ~48小时（86%）

---

## 🎯 如何判断文档是否有效？

### 成功的标志

✅ Developer问："这个函数怎么写？" → 回答："看backlog Story 6.1代码示例"  
✅ Developer问："速率限制设多少？" → 回答："backlog中是1000/小时"  
✅ Developer问："为什么这么设计？" → 回答："查ADR-006第X节"

### 失败的标志

❌ Developer频繁问："backlog中没写，怎么办？"（说明backlog不完整）  
❌ Developer说："我看不懂ADR文档"（说明ADR太技术化）  
❌ Developer抱怨："文档太多，不知道看哪个"（说明缺少导航）

**当前状态：** ✅ 已解决所有潜在问题（backlog完整 + 清晰导航）

---

## 🔄 Sprint进行中的调整

### 如果Developer反馈"文档不够"

1. **首先确认：** 是否真的缺失，还是Developer没找到？
2. **如果确实缺失：** 立即补充到backlog.md（不新建文档）
3. **更新原则：** 所有实现细节归入backlog，架构决策归入ADR

### 如果Developer反馈"文档太多"

1. **检查：** 是否Developer在查阅不必要的文档？
2. **提醒：** "你只需要读backlog，ADR是可选的"
3. **如果仍觉得多：** 说明backlog中有冗余，需要精简

---

## 📝 快速回答Developer常见问题

### Q1: "我需要看完所有文档才能开始吗？"

**A:** 不需要。只需读technical-design.md（30分钟）了解架构，然后直接看backlog的Story开始编码。

### Q2: "代码怎么写？"

**A:** backlog中每个Story都有完整代码示例，复制调整即可。

### Q3: "为什么要这么设计？"

**A:** 这是架构决策，查对应的ADR文档（ADR-005/006/007）。但对实现不影响，可以先编码，后续有兴趣再读。

### Q4: "遇到sharp安装错误怎么办？"

**A:** 看sharp-installation-guide.md，里面有5个常见错误的解决方案。

### Q5: "如何测试Open Badges兼容性？"

**A:** Story 6.4集成测试时，参考external-validator-testing-guide.md。

---

## ✅ 最终检查清单

在Sprint开始前，确认：

- [x] backlog.md开头有"开发者必读文档清单"
- [x] technical-design.md有完整架构图
- [x] backlog.md包含所有Story的代码示例
- [x] ADR文档解释"为什么"而不是"怎么做"
- [x] 辅助文档针对特定问题（安装、测试、设计）
- [x] 给Developer的指令清晰（一句话即可）

---

**Status:** ✅ All Documentation Ready  
**Last Updated:** 2026-01-28  
**Owner:** Winston (Architect)  
**Next Review:** Sprint 5 Retrospective (2026-02-07)
