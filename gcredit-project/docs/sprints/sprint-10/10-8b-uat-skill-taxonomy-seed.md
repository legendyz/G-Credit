# Story 10.8b: UAT Skill Taxonomy Seed Data

**Status:** ready  
**Priority:** 🟡 MEDIUM  
**Estimate:** 1h  
**Sprint:** Sprint 10  
**Type:** Data Fix (UAT Seed Gap)  
**Dependencies:** Story 10.8 (BUG-009 fix)  
**Discovered:** Re-UAT Round 2 — PO noticed skill selector shows "No skills available"

---

## Story

As a **UAT tester**,  
I want **SkillCategory and Skill seed data present in the UAT environment**,  
So that **badge template creation can test the full skill taxonomy feature (技能分类管理系统)**.

## Background

Sprint 2 (Story 3.4) 实现了完整的技能分类管理系统：
- `SkillCategory` 模型：3级树形层级结构（parent-child self-reference）
- `Skill` 模型：带 SkillLevel (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT)
- 5 大系统预定义分类，20 个子分类
- 后端 API：`/api/skill-categories` (tree)、`/api/skills`、`/api/skills/search`
- 前端：`useSkills()` hook、`BadgeTemplateFormPage` 技能选择器

**问题：** `seed-skills.ts` 包含完整的开发种子数据（5大分类 + skills），但 `seed-uat.ts` **没有调用它**，导致 UAT 环境下：
- `SkillCategory` 表为空
- `Skill` 表为空
- 前端创建徽章模板时显示 "No skills available"
- 所有 UAT 模板的 `skillIds: []`

**BUG-009 修复上下文：** Story 10.8 Re-UAT 期间发现 `CreateBadgeTemplateDto.skillIds` 验证问题（commit `f501f9a` 已修复）。虽然 skillIds 现在可以为空数组，但技能分类功能本身未被 UAT 覆盖。

## Acceptance Criteria

1. [ ] `seed-uat.ts` 包含 5 大系统预定义 SkillCategory（含子分类）
2. [ ] `seed-uat.ts` 包含至少 6 个 Skill 实体（覆盖不同分类和等级）
3. [ ] 至少 2 个 UAT 模板的 `skillIds` 关联到实际 Skill
4. [ ] 前端创建模板时技能选择器能正常加载和选择
5. [ ] 所有现有测试不受影响（1,061+ tests pass）
6. [ ] UAT 数据库 reset 后可正常 seed

## Tasks

### Task 1: 在 seed-uat.ts 中添加 SkillCategory 数据 (20min)

在 templates 创建之前插入 SkillCategory 种子数据：

```typescript
// Fixed UUIDs for SkillCategories
const SKILL_CAT_IDS = {
  tech: 'uat-scat-0001-0001-0001-000000000001',
  soft: 'uat-scat-0001-0001-0001-000000000002',
  domain: 'uat-scat-0001-0001-0001-000000000003',
  company: 'uat-scat-0001-0001-0001-000000000004',
  professional: 'uat-scat-0001-0001-0001-000000000005',
  // Level 2 sub-categories
  programming: 'uat-scat-0001-0001-0001-000000000011',
  cloud: 'uat-scat-0001-0001-0001-000000000012',
  communication: 'uat-scat-0001-0001-0001-000000000021',
  leadership: 'uat-scat-0001-0001-0001-000000000022',
};
```

5 个一级分类 + 4 个二级子分类（Programming、Cloud、Communication、Leadership）。

### Task 2: 在 seed-uat.ts 中添加 Skill 数据 (15min)

```typescript
const SKILL_IDS = {
  typescript: 'uat-skil-0001-0001-0001-000000000001',
  azure: 'uat-skil-0001-0001-0001-000000000002',
  docker: 'uat-skil-0001-0001-0001-000000000003',
  publicSpeaking: 'uat-skil-0001-0001-0001-000000000004',
  teamLeadership: 'uat-skil-0001-0001-0001-000000000005',
  projectMgmt: 'uat-skil-0001-0001-0001-000000000006',
};
```

6 个 Skill，覆盖 Technical（3个不同 level）+ Soft Skills（2个）+ Professional（1个）。

### Task 3: 更新 UAT 模板 skillIds (10min)

将部分模板关联到实际 Skill：

| 模板 | 当前 skillIds | 更新后 |
|------|--------------|--------|
| tmpl1 (Cloud Expert) | `[]` | `[typescript, azure, docker]` |
| tmpl2 (Leadership) | `[]` | `[teamLeadership, publicSpeaking]` |
| tmpl3 (Innovation) | `[]` | 保持 `[]` — 测试无技能模板 |
| tmpl4 (Security) | `[]` | 保持 `[]` |
| tmpl5 (Team Player) | `[]` | `[projectMgmt]` |

### Task 4: Cleanup 顺序更新 (5min)

在 seed-uat.ts 的 CLEANUP 部分添加 `Skill` 和 `SkillCategory` 的 deleteMany（在 template 删除之后）。

### Task 5: 验证 (10min)

- [ ] `npm run seed:reset` 成功
- [ ] 前端技能选择器加载 5 大分类 + skills
- [ ] 创建模板时可选择 skills
- [ ] 所有测试通过

## 技能分类参考（Sprint 2 设计）

| # | 中文名 | 英文名 | 描述 |
|---|--------|--------|------|
| 1 | 技术技能 | Technical Skills | 编程、开发工具、云平台等 |
| 2 | 软技能 | Soft Skills | 沟通、领导力、团队协作等 |
| 3 | 行业知识 | Domain Knowledge | 特定行业专业知识 |
| 4 | 公司特定能力 | Company-Specific | 企业文化、内部流程、合规要求等 |
| 5 | 通用职业技能 | Professional Skills | 项目管理、数据分析等 |

## Definition of Done

- [ ] seed-uat.ts 包含 SkillCategory + Skill 数据
- [ ] 至少 2 个模板有 skillIds 关联
- [ ] `npm run seed:reset` 无错误
- [ ] 前端技能选择器功能正常
- [ ] 1,061+ tests pass (0 regressions)
- [ ] Code review completed

---

**Story Source:** PO 在 Re-UAT 期间提出徽章分类/技能关联功能未被 UAT 覆盖  
**Related:** seed-skills.ts (dev seed), BUG-009 fix (commit `f501f9a`)
