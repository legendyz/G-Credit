# Architecture Decision Record Template

**ADR Number:** [e.g., 001]  
**Title:** [Short, descriptive title]  
**Date:** [YYYY-MM-DD]  
**Status:** [Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-XXX]  
**Author(s):** [Names]  
**Deciders:** [Names of decision makers]

---

## 📌 何时使用ADR模板？

**✅ 应该写ADR的场景：**

1. **架构选型决策**
   - 选择框架/库（React vs Vue, Prisma vs TypeORM）
   - 选择数据库（PostgreSQL vs MongoDB）
   - 选择云服务商（Azure vs AWS）
   - **示例：** Sprint 5 - ADR-006 Winston Logging Strategy

2. **技术方案设计**
   - 如何实现某个复杂功能（认证机制、文件存储、缓存策略）
   - 代码组织结构（模块化、分层）
   - API设计风格（RESTful vs GraphQL）
   - **示例：** Sprint 4 - ADR-005 Open Badges 2.0 Integration Strategy

3. **安全风险接受**
   - 知道有安全漏洞但决定接受风险
   - 需要明确记录原因和缓解措施
   - **示例：** Sprint 4 - ADR-002 Lodash Security Risk Acceptance

4. **重大重构**
   - 改变核心代码结构
   - 迁移到新技术栈
   - 性能优化方案

5. **不确定性决策**
   - 多个方案都有优缺点，需要权衡
   - 未来可能需要回顾“为什么当时这么决定”
   - **Solo开发特别重要：** 3个月后你可能忘记当时的思考过程

**❌ 不需要写ADR的场景：**

1. **常规代码实现**
   - 按照既定模式写业务逻辑
   - 添加CRUD端点
   - UI组件开发

2. **Bug修复**
   - 除非修复过程中发现架构问题

3. **小优化**
   - 代码清理、性能微调

4. **文档/配置更新**
   - 除非涉及重大配置策略变更

**💡 Solo开发的ADR使用技巧：**

1. **Sprint Planning阶段写ADR**
   - 复杂Epic开始前先写ADR（参考Sprint 5经验）
   - 避免开发过程中反复纠结架构问题

2. **与自己对话**
   - 把ADR当作“未来的自己”的留言
   - 3个月后你会感谢现在的详细记录

3. **不要过度设计**
   - ADR不需要完美，1-2页足够
   - 重点是“为什么”，不是“怎么做”的每个细节

4. **实施后更新Implementation Tracking**
   - 确保决策真的被执行了
   - 记录实际实施与设计的偏差

---

## Context

### Problem Statement
[Clearly describe the architectural problem or decision that needs to be made. What is the issue that motivates this decision?]

### Background
[Provide relevant background information:]
- Current system state
- Constraints (technical, business, time, budget)
- Assumptions
- Dependencies
- Stakeholders affected

### Goals
[What are we trying to achieve with this decision?]
- Goal 1
- Goal 2
- Goal 3

---

## Decision

### Solution
[Describe the architectural solution or approach chosen. Be specific and concrete.]

### Rationale
[Explain why this solution was chosen. What factors led to this decision?]
- Reason 1
- Reason 2
- Reason 3

### Alternatives Considered
[List and describe alternative solutions that were evaluated]

#### Alternative 1: [Name]
- **Description:** [Brief description]
- **Pros:** 
  - Pro 1
  - Pro 2
- **Cons:**
  - Con 1
  - Con 2
- **Reason for Rejection:** [Why this wasn't chosen]

#### Alternative 2: [Name]
- **Description:** [Brief description]
- **Pros:**
  - Pro 1
- **Cons:**
  - Con 1
- **Reason for Rejection:** [Why this wasn't chosen]

---

## Consequences

### Positive Consequences
[What benefits will result from this decision?]
- Benefit 1
- Benefit 2
- Benefit 3

### Negative Consequences
[What drawbacks or trade-offs does this decision introduce?]
- Drawback 1
- Drawback 2

### Risks
[What risks are associated with this decision?]
- **Risk 1:** [Description]
  - **Mitigation:** [How to mitigate]
- **Risk 2:** [Description]
  - **Mitigation:** [How to mitigate]

---

## Implementation

### Changes Required
[What changes need to be made to implement this decision?]
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

### Migration Path
[If applicable, how will we migrate from the old approach to the new one?]
1. Step 1
2. Step 2
3. Step 3

### Timeline
[Expected implementation timeline]
- **Start Date:** [YYYY-MM-DD]
- **Target Completion:** [YYYY-MM-DD]
- **Estimated Effort:** [e.g., 2 weeks, 5 person-days]

---

## Validation

### Success Criteria
[How will we know if this decision was successful?]
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Metrics
[What metrics will we track to measure success?]
- Metric 1: [e.g., API response time < 200ms]
- Metric 2: [e.g., Test coverage > 80%]
- Metric 3: [e.g., Developer onboarding time < 2 hours]

### Review Date
[When will we review this decision?]
**Scheduled Review:** [YYYY-MM-DD]

---

## Related

### Related ADRs
- [ADR-XXX: Related Decision Title](./XXX-related-decision.md)

### Related Documents
- [Technical Specification](../architecture/system-design.md)
- [API Documentation](../../backend/docs/api/README.md)

### References
- [External link or resource 1](https://example.com)
- [External link or resource 2](https://example.com)

---

## 📊 Implementation Tracking

**Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Implemented | ⚪ Deprecated

**Implementation Sprint:** Sprint N (哪个Sprint实施此ADR)  
**Implemented By:** [Name/Team]  
**Completion Date:** YYYY-MM-DD

### Implementation Checklist
- [ ] 核心决策已编码实现
- [ ] 配置文件已更新（如适用）
- [ ] 相关文档已同步更新
- [ ] 测试覆盖决策的关键场景
- [ ] Code Review确认符合ADR设计

### Verification Criteria
**如何验证此ADR已正确实现？**

- [ ] [验证步骤1 - 例如：检查Winston配置文件包含4个transport]
- [ ] [验证步骤2 - 例如：运行日志测试，确认所有级别正确输出]
- [ ] [验证步骤3 - 例如：检查生产环境日志文件正常生成]

**验证命令（如适用）：**
```bash
# 例如：验证Prisma版本
 npm list prisma --depth=0

# 例如：验证Winston配置
 cat backend/src/config/winston.config.ts | grep "transports"
```

### Implementation Deviations
**实现过程中的调整或偏差：**

[如果实现时发现ADR设计需要调整，记录在这里]

**示例：**
> 原设计使用4个transport，但实际只用了3个（移除了Syslog transport）。  
> **原因：** 生产环境没有Syslog服务器。  
> **影响评估：** 这个调整不影响核心决策，其他3个transport足以满足需求。

**偏差类型：**
- ✅ **Minor Deviation** - 不影响核心决策，无需更新ADR
- ⚠️ **Moderate Deviation** - 部分调整，建议更新ADR“Consequences”部分
- ❌ **Major Deviation** - 重大改变，必须创建Superseding ADR

### Related Code
**实现此ADR的关键文件/模块：**

- `backend/src/config/[config-file].ts` - [描述]
- `backend/src/[module]/[service].ts` - [描述]
- `backend/test/[test-file].spec.ts` - [相关测试]

**示例（Winston ADR）：**
- `backend/src/config/winston.config.ts` - Winston配置
- `backend/src/common/logger/logger.service.ts` - Logger服务封装
- `backend/test/logging.e2e-spec.ts` - 日志测试

### Follow-up Actions
**后续行动项（如有）：**

- [ ] [行动项1 - 例如：添加日志轮转配置]
- [ ] [行动项2 - 例如：优化日志性能]
- [ ] [行动项3 - 例如：集成云日志服务]

**跟踪方式：** 在Sprint Backlog中创建Technical Task或User Story

---

**💡 Implementation Tracking 使用指南：**

1. **ADR创建时：** Status设为 🔴 Not Started
2. **开始实施时：** 更新Status为 🟡 In Progress + 填写Implementation Sprint
3. **实施完成时：** 
   - 更新Status为 🟢 Implemented
   - 填写Completion Date
   - 勾选Implementation Checklist
   - 填写Verification Criteria
   - 记录Related Code
   - 记录Deviations（如有）
4. **Sprint Completion时：** Code Review阶段对照ADR检查

---

## Notes

### Discussion Log
[Key points from discussions leading to this decision]
- [Date] - [Note]
- [Date] - [Note]

### Update History
[Track changes to this ADR after initial acceptance]
| Date | Author | Change |
|------|--------|--------|
| YYYY-MM-DD | Name | Initial draft |
| YYYY-MM-DD | Name | Updated after review |

---

**Example: How to Use This Template**

See [ADR-002: Lodash Security Risk Acceptance](../decisions/002-lodash-security-risk-acceptance.md) or [ADR-005: Open Badges 2.0 Integration Strategy](../decisions/005-open-badges-integration-strategy.md) for real examples.

**Tips:**
1. Keep it concise - aim for 1-2 pages
2. Focus on "why" not just "what"
3. Document alternatives seriously considered
4. Update status as decision evolves
5. Link to related documentation
6. Include concrete examples when helpful

---

**Template Version:** v1.2  
**Last Updated:** 2026-01-29 (添加Implementation Tracking + 使用时机说明)  
**Maintained By:** GCredit Development Team
