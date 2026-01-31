# Amelia - Sprint 7 Activation (Simple Version)

> **📍 如何使用本文件：**  
> Product Owner只需说：  
> _"请阅读 `gcredit-project/docs/sprints/sprint-7/amelia-activation-simple.md`，按照里面的指导，然后执行你的 [DS] Execute Dev Story workflow"_

---

**Sprint:** Sprint 7 (7 working days)  
**Branch:** `sprint-7/epic-9-revocation-lifecycle-uat`

---

## 🎯 Your Mission

Hi Amelia! 你好！

请按照你自己的**Dev Story workflow**来工作，结合下面的Sprint 7特定信息。

---

## 📋 First Story to Execute

**Story File:** `gcredit-project/docs/sprints/sprint-7/9-1-revoke-api.md`

**Story 9.1: Badge Revocation API (7 hours)**
- 实现Badge revocation功能
- **CRITICAL:** 必须使用TDD approach（先写测试，再写实现）
- Architect在story文件里写了500行实施指南（"ARCHITECT NOTES - Implementation Guidance"）

**Key Requirements:**
- Manager可以revoke badge
- Employee/Admin不能revoke（403 error）
- 创建AuditLog记录
- 支持idempotency（重复revoke返回200 OK）

---

## 📚 Sprint 7 Complete Context

**详细信息请参考：** `gcredit-project/docs/sprints/sprint-7/amelia-day1-prompt.md` (1,100+ lines)

这个文件包含：
- Sprint 7完整overview（11 stories, 7天timeline）
- 所有7个关键文档的路径
- TDD 3-phase实施步骤
- Day 3 PO coordination要求（M365 sync测试）
- Success criteria & quality gates
- Escalation protocol
- 技术决策摘要

**When to read it:**
- 在开始Story 9.1之前
- 当你需要Sprint 7整体context时
- 当你需要确认后续coordination要求时

---

## 🔑 Key Info for Your Workflow

### Story File Location:
```
gcredit-project/docs/sprints/sprint-7/9-1-revoke-api.md
```

### Implementation Artifacts Folder:
```
gcredit-project/docs/sprints/sprint-7/
```

### Sprint Status (if needed):
```
_bmad-output/implementation-artifacts/bmm-workflow-status.yaml
```

### Project Context:
```
project-context.md
```

---

## 🚨 Special Requirements for Story 9.1

**TDD Mandatory:**
- ✅ Write failing test FIRST
- ✅ Implement to make test pass
- ✅ Refactor while keeping tests green
- ✅ Follow Architect's phase guide in story file

**Authorization Check:**
- Only `Manager` role can revoke badges
- `Employee` and `Admin` roles get 403 error
- Check user role before any state changes

**Idempotency:**
- Revoking already-revoked badge returns 200 OK
- No error on repeated revoke operations

**Audit Logging:**
- Every revocation creates AuditLog entry
- Record WHO (userId), WHAT (action), WHEN (timestamp), WHY (reason)

---

## 📅 Upcoming Coordination Alert

当执行Stories 0.2a和U.2a时，需要**Product Owner参与M365 sync测试**。

When you reach Story U.2a:
- 提前notify Product Owner准备2-3个真实M365用户邮箱
- PO需要验证M365 org structure是否正确
- 这是sprint的关键依赖点

---

## ✅ How to Proceed

**Step 1:** 激活你自己的Dev workflow（[DS] Execute Dev Story）

**Step 2:** 当workflow要求时，读取这两个文件：
- Story file: `9-1-revoke-api.md`（815 lines，contains 500-line Architect guide）
- Sprint context: `amelia-day1-prompt.md`（1,100 lines，complete Sprint 7 details）

**Step 3:** 按照story file里的tasks/subtasks顺序执行：
- Follow Architect's Phase 1 → Phase 2 → Phase 3
- Write tests FIRST for each phase
- Mark [x] only when tests pass

**Step 4:** 在完成Story 9.1前验证axe-core setup是否工作（快速验证，5分钟）

**Step 5:** 完成工作后发送status update给Product Owner

---

## 🎬 Ready to Start?

请执行你的**[DS] Execute Dev Story workflow**，story file path是：

```
gcredit-project/docs/sprints/sprint-7/9-1-revoke-api.md
```

如果有任何questions或blockers超过30分钟，请立即escalate给Product Owner。

Good luck! 🚀

---

**Note:** 这个简短版本假设你会使用自己的Dev Story workflow。完整的Sprint 7 context（timeline、所有stories、技术决策等）都在`amelia-day1-prompt.md`里，你可以随时参考。
