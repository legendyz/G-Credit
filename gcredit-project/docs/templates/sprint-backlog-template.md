# Sprint Backlog Template

**Sprint Number:** Sprint X  
**Sprint Goal:** [One-sentence sprint goal]  
**Duration:** [Start Date] - [End Date] ([X] working days)  
**Team Capacity:** [X] person-days  
**Sprint Lead:** [Name]

---

## Sprint Goal

[1-2 sentence description of what this sprint aims to achieve]

**Success Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## User Stories

**📝 用户故事格式：**每个用户故事应使用 [user-story-template.md](./user-story-template.md) 创建详细文档。本Backlog仅列出摘要信息。

**完整用户故事参考：**
- 🔗 [user-story-template.md](./user-story-template.md) - 包含INVEST原则、验收标准、技术细节、DoD等完整格式
- 📂 实际故事文档存放位置：`docs/sprints/sprint-N/stories/`

---

### Epic: [Epic Name] - [Brief Description]

#### Story 1: [Story Title]
**Priority:** 🔴 High | 🟡 Medium | 🟢 Low  
**Story Points:** [X] SP  
**Estimate:** [X]h  
**Assigned:** [Name]  
**Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Done  
**Story Doc:** 📄 [Link to full story doc]

**Quick Summary:** As a [role], I want [feature] so that [benefit].

**Key Deliverables:**
- [ ] [Main feature/component 1]
- [ ] [Main feature/component 2]
- [ ] [Tests + Documentation]

**Dependencies:** [List story IDs or "None"]

---

#### Story 2: [Story Title]
**Priority:** 🔴 High | 🟡 Medium | 🟢 Low  
**Story Points:** [X] SP  
**Estimate:** [X]h  
**Assigned:** [Name]  
**Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Done  
**Story Doc:** 📄 [Link to full story doc]

**Quick Summary:** As a [role], I want [feature] so that [benefit].

**Key Deliverables:**
- [ ] [Main feature/component 1]
- [ ] [Main feature/component 2]
- [ ] [Tests + Documentation]

**Dependencies:** [List story IDs or "None"]

---

### Epic: [Epic Name] - [Brief Description]

#### Story 3: [Story Title]
**Priority:** 🔴 High | 🟡 Medium | 🟢 Low  
**Story Points:** [X] SP  
**Estimate:** [X]h  
**Assigned:** [Name]  
**Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Done  
**Story Doc:** 📄 [Link to full story doc]

**Quick Summary:** As a [role], I want [feature] so that [benefit].

**Key Deliverables:**
- [ ] [Main feature/component 1]
- [ ] [Main feature/component 2]
- [ ] [Tests + Documentation]

**Dependencies:** [List story IDs or "None"]

---

### 📊 Stories Summary

| Story ID | Title | Priority | Points | Hours | Assigned | Status |
|----------|-------|----------|--------|-------|----------|--------|
| Story 1 | [Title] | 🔴 High | X | Xh | [Name] | 🔴 |
| Story 2 | [Title] | 🟡 Med | X | Xh | [Name] | 🔴 |
| Story 3 | [Title] | 🟢 Low | X | Xh | [Name] | 🔴 |
| **Total** | - | - | **XX SP** | **XXh** | - | - |

---

## Definition of Done

**Story-Level DoD:**  
每个用户故事完成时必须满足 [user-story-template.md](./user-story-template.md) 中定义的 DoD 标准。

**Sprint-Level DoD (End of Sprint):** ⚠️ **CRITICAL**  
🔗 **完整清单参考:** [sprint-completion-checklist-template.md](./sprint-completion-checklist-template.md)

**关键项目：**
- [ ] **project-context.md已更新** (状态, Sprint N, 实现功能, 下一步动作)
- [ ] **Sprint summary + retrospective已创建**
- [ ] **CHANGELOG.md已更新** (frontend + backend)
- [ ] **代码已合并到main + Git tag已创建** (vX.Y.Z)
- [ ] **所有测试通过** (Unit >80%, E2E关键路径)
- [ ] **部署到目标环境** (Dev/Staging/Production)

---

## Technical Tasks

### Infrastructure
- [ ] Task 1: [Description] - [Estimate] - [Assigned]
- [ ] Task 2: [Description] - [Estimate] - [Assigned]

### Bug Fixes
- [ ] Bug 1: [Description] - [Estimate] - [Assigned]
- [ ] Bug 2: [Description] - [Estimate] - [Assigned]

### Technical Debt
- [ ] Refactor 1: [Description] - [Estimate] - [Assigned]
- [ ] Refactor 2: [Description] - [Estimate] - [Assigned]

---

## Sprint Capacity Planning

| Team Member | Capacity (days) | Assigned (days) | Buffer (days) |
|-------------|-----------------|-----------------|---------------|
| Developer 1 | 10 | 8 | 2 |
| Developer 2 | 10 | 9 | 1 |
| QA Engineer | 10 | 7 | 3 |
| **Total** | **30** | **24** | **6** |

**Note:** 20% buffer for unplanned work, meetings, reviews

---

## Sprint Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Mitigation plan] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Mitigation plan] |

---

## Dependencies

### External Dependencies
- [ ] Dependency 1: [Description] - [Owner] - [Status]
- [ ] Dependency 2: [Description] - [Owner] - [Status]

### Internal Dependencies
- [ ] Dependency 1: [Description] - [Story #] - [Status]
- [ ] Dependency 2: [Description] - [Story #] - [Status]

---

## Sprint Ceremonies

| Ceremony | Day | Time | Duration | Participants |
|----------|-----|------|----------|--------------|
| Sprint Planning | Monday | 9:00 AM | 2 hours | Full team |
| Daily Standup | Daily | 9:30 AM | 15 min | Full team |
| Backlog Refinement | Wednesday | 2:00 PM | 1 hour | Full team |
| Sprint Review | Friday | 3:00 PM | 1 hour | Full team + stakeholders |
| Sprint Retrospective | Friday | 4:00 PM | 1 hour | Full team |

---

## Testing Strategy

### Unit Testing
- Target coverage: > 80%
- Key areas:
  - Business logic
  - Data validation
  - Error handling

### E2E Testing
- Critical user flows:
  - Flow 1: [Description]
  - Flow 2: [Description]
  - Flow 3: [Description]

### UAT Testing
- Test scenarios: [X]
- Testers: [Names]
- Timeline: [Days before sprint end]

---

## Deployment Plan

### Environments
- [ ] **Dev:** Continuous deployment (automatic)
- [ ] **Staging:** Deploy on [Date]
- [ ] **Production:** Deploy on [Date] (if all tests pass)

### Rollback Plan
[Description of rollback procedure if deployment fails]

---

## Success Metrics

### Velocity
- **Target Velocity:** [X] story points
- **Previous Sprint:** [X] story points
- **Average Velocity:** [X] story points

### Quality
- **Target Test Coverage:** > 80%
- **Target Bug Count:** < 5 critical bugs
- **Target Code Review Time:** < 24 hours

### Delivery
- **Target Completion:** 100% of committed stories
- **Target On-Time Delivery:** [Date]

---

## Notes

### Sprint Kickoff Notes
[Key points from sprint planning meeting]
- Note 1
- Note 2

### Blockers / Issues
[Track ongoing blockers]
- [ ] Blocker 1: [Description] - [Owner] - [Status]
- [ ] Blocker 2: [Description] - [Owner] - [Status]

---

## Progress Tracking

### Daily Updates

**Day 1 ([Date]):**
- Stories completed: [X]
- Stories in progress: [X]
- Blockers: [X]

**Day 2 ([Date]):**
- Stories completed: [X]
- Stories in progress: [X]
- Blockers: [X]

[Continue for each day]

---

## Related Documents

- [Sprint Retrospective](./retrospective.md)
- [Sprint Summary](./summary.md)
- [Previous Sprint Backlog](../sprint-X/backlog.md)

---

**Last Updated:** [Date]  
**Status:** [In Progress | Completed]  
**Template Version:** v1.2 (2026-01-29 - 简化用户故事格式，引用user-story-template.md，减少重复内容)
