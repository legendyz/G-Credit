# Sprint 12 Backlog

**Sprint Number:** Sprint 12  
**Sprint Goal:** Complete the three core management UIs (Skill, User, Milestone) and unify the evidence system, giving admins full platform control through the browser.  
**Duration:** TBD (Phase 2 review will confirm dates)  
**Team Capacity:** Solo developer + AI agents  
**Sprint Lead:** LegendZhu

---

## Sprint Goal

Deliver the remaining admin management interfaces (Skill Category, Skill, User, Milestone) and resolve the dual evidence system (TD-010), so that ALL admin operations can be performed through the UI without direct database access. Secondary: clean up activity feed formatting (TD-016) and skill UUID display (TD-017).

**Success Criteria:**
- [ ] Admin can CRUD Skill Categories (hierarchical, 3-level tree)
- [ ] Admin can CRUD Skills within categories
- [ ] Admin can manage users (role edit, lock/unlock, search)
- [ ] Admin can manage Milestones (CRUD, activate/deactivate)
- [ ] Evidence system unified — single EvidenceFile model, no more Dual paths
- [ ] All existing tests pass + new tests for Sprint 12 features
- [ ] Activity feed shows readable descriptions (not JSON)

---

## Wave Structure (per Lesson 41)

### Wave 1: Admin Management UIs (Stories 12.1 — 12.4)
*Focus: New admin pages for Skill, User, Milestone management*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 12.1 | Skill Category Management UI | 🔴 HIGH | 10h | — |
| 12.2 | Skill Management UI | 🔴 HIGH | 10h | 12.1 |
| 12.3 | User Management UI Enhancement | 🔴 HIGH | 10h | — |
| 12.4 | Milestone Admin UI | 🟡 MEDIUM | 8h | — |

**Parallelization:** 12.1 → 12.2 (sequential). 12.3, 12.4 independent — can run parallel with 12.1/12.2.

### Wave 2: Evidence Unification (Stories 12.5 — 12.6)
*Focus: Resolve TD-010 — backend data model + frontend UI*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 12.5 | Evidence Unification — Data Model | 🔴 HIGH | 14h | — |
| 12.6 | Evidence Unification — UI | 🔴 HIGH | 10h | 12.5 |

**Parallelization:** 12.5 → 12.6 (sequential). Can run after Wave 1 or in parallel if not resource-constrained.

### Wave 3: Quick Fixes (Stories 12.7 — 12.8)
*Focus: Small tech debt items — can be done anytime*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 12.7 | Admin Activity Feed Formatting | 🟢 LOW | 3h | — |
| 12.8 | Skills UUID Fallback Hardening | 🟢 LOW | 2h | — |

**Parallelization:** Both independent — can be done anytime as buffer work.

### Wave 4: UAT (Story 12.9)
*Focus: User acceptance testing of all Sprint 12 features*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 12.9 | Sprint 12 UAT | 🟡 MEDIUM | 5h | 12.1–12.8 all complete |

**Timing:** Execute after all development stories are done, before merge to main.

---

## User Stories

### Wave 1: Admin Management UIs

#### Story 12.1: Skill Category Management UI
**Priority:** 🔴 High  
**Estimate:** 10h  
**Status:** ✅ Done  
**Story Doc:** 📄 [12-1-skill-category-management-ui.md](sprint-12/12-1-skill-category-management-ui.md)

**Quick Summary:** As an Admin, I want to manage skill categories in a hierarchical tree UI so that skills are organized into a browsable taxonomy.

**Key Deliverables:**
- [x] Shared `<AdminPageShell>`, `<ConfirmDialog>`, `<CategoryTree>` components
- [x] Tree view with drag-and-drop reorder (`@dnd-kit`, same-level)
- [x] CRUD operations (create, rename, reorder, delete with guard)
- [x] System-defined category protection (lock icon, no delete, 403)
- [ ] Responsive: tree → dropdown on <1024px *(deferred to Sprint 13 — D-1)*
- [x] Tests (70 new tests)

**Dependencies:** None

---

#### Story 12.2: Skill Management UI
**Priority:** 🔴 High  
**Estimate:** 10h  
**Status:** ✅ Done  
**Story Doc:** 📄 [12-2-skill-management-ui.md](sprint-12/12-2-skill-management-ui.md)

**Quick Summary:** As an Admin, I want to manage individual skills within categories so that the skill library is maintainable through the UI.

**Key Deliverables:**
- [x] Split layout: category tree (left) + skills table (right)
- [x] Skill CRUD (add, edit, delete with badge-usage guard)
- [x] Colored skill tags (10-color palette, auto-assign, propagated to 3 existing pages)
- [x] useSkills bug fix (`category` → `categoryName`)
- [x] Tests (32 new tests)

**Dependencies:** Story 12.1

---

#### Story 12.3: User Management UI Enhancement
**Priority:** 🔴 High  
**Estimate:** 10h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-3-user-management-ui-enhancement.md](sprint-12/12-3-user-management-ui-enhancement.md)

**Quick Summary:** As an Admin, I want to manage users with role editing, account lock/unlock, and detail panels so that user administration is complete.

**Key Deliverables:**
- [ ] Enhanced user table with search, filter, sort
- [ ] Role edit (inline or modal)
- [ ] Account lock/unlock toggle
- [ ] User detail slide-over panel
- [ ] Tests

**Dependencies:** None

---

#### Story 12.4: Milestone Admin UI
**Priority:** 🟡 Medium  
**Estimate:** 8h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-4-milestone-admin-ui.md](sprint-12/12-4-milestone-admin-ui.md)

**Quick Summary:** As an Admin, I want to create and manage milestone configurations so that achievement tracking is configurable through the UI.

**Key Deliverables:**
- [ ] Milestone card grid layout
- [ ] Dynamic form per milestone type (BADGE_COUNT, SKILL_TRACK, ANNIVERSARY, CUSTOM)
- [ ] Active/inactive toggle
- [ ] Achievement count display
- [ ] Tests

**Dependencies:** None (resolves TD-009)

---

### Wave 2: Evidence Unification

#### Story 12.5: Evidence Unification — Data Model
**Priority:** 🔴 High  
**Estimate:** 14h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-5-evidence-unification-data-model.md](sprint-12/12-5-evidence-unification-data-model.md)

**Quick Summary:** As a Developer, I want to unify the dual evidence system into a single EvidenceFile model with migration so that evidence is consistent across the platform.

**Key Deliverables:**
- [ ] EvidenceFile schema: type (FILE|URL), `sourceUrl` field
- [ ] Two-phase migration: schema (Prisma) + data script (standalone)
- [ ] Unified `EvidenceItem` API contract
- [ ] Bulk issuance update (20+ file references)
- [ ] Tests

**Dependencies:** None (resolves TD-010 Phase 1)

---

#### Story 12.6: Evidence Unification — UI
**Priority:** 🔴 High  
**Estimate:** 10h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-6-evidence-unification-ui.md](sprint-12/12-6-evidence-unification-ui.md)

**Quick Summary:** As an Admin/Issuer, I want badge issuance to support file uploads and all pages to display evidence uniformly.

**Key Deliverables:**
- [ ] Shared EvidenceList component
- [ ] File upload in IssueBadgePage
- [ ] Evidence column in Badge Management
- [ ] SAS token fix for VerifyBadgePage
- [ ] Tests

**Dependencies:** Story 12.5 (resolves TD-010 Phase 2)

---

### Wave 3: Quick Fixes

#### Story 12.7: Admin Activity Feed Formatting
**Priority:** 🟢 Low  
**Estimate:** 3h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-7-admin-activity-feed-formatting.md](sprint-12/12-7-admin-activity-feed-formatting.md)

**Quick Summary:** As an Admin, I want the dashboard activity feed to show human-readable descriptions instead of JSON.

**Key Deliverables:**
- [ ] `formatActivityDescription()` function
- [ ] All action types: ISSUED, CLAIMED, REVOKED, etc.
- [ ] Tests

**Dependencies:** None (resolves TD-016)

---

#### Story 12.8: Skills UUID Fallback Hardening
**Priority:** 🟢 Low  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-8-skills-uuid-fallback-hardening.md](sprint-12/12-8-skills-uuid-fallback-hardening.md)

**Quick Summary:** As a Developer, I want to ensure no UUID is ever shown to users when skill name lookup fails.

**Key Deliverables:**
- [ ] Audit all skill display locations
- [ ] Apply `useSkillNamesMap()` where missing
- [ ] "Unknown Skill" fallback
- [ ] Tests

**Dependencies:** None (resolves TD-017)

---

### Wave 4: UAT

#### Story 12.9: Sprint 12 UAT — Management UIs + Evidence Unification
**Priority:** 🟡 Medium  
**Estimate:** 5h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [12-9-sprint-12-uat.md](sprint-12/12-9-sprint-12-uat.md)

**Quick Summary:** As a PO/Tester, I want to validate all Sprint 12 features through structured UAT so that the release is verified.

**Key Deliverables:**
- [ ] UAT test plan document (`sprint-12/uat-test-plan.md`)
- [ ] ~24 new feature test cases (Skill Category, Skill, User, Milestone, Evidence, Quick Fixes)
- [ ] ~6 regression test cases (issuance, wallet, verify, revoke, sharing, RBAC)
- [ ] Seed data updated for new entities
- [ ] Sign-off

**Dependencies:** All Stories 12.1–12.8

---

### 📊 Stories Summary

| Story ID | Title | Priority | Hours | Status | Tech Debt |
|----------|-------|----------|-------|--------|-----------|
| 12.1 | Skill Category Management UI | 🔴 High | 10h | ✅ Done | — |
| 12.2 | Skill Management UI | 🔴 High | 10h | ✅ Done | — |
| 12.3 | User Management UI Enhancement | 🔴 High | 10h | 🔴 | — |
| 12.4 | Milestone Admin UI | 🟡 Med | 8h | 🔴 | TD-009 |
| 12.5 | Evidence Unification — Data Model | 🔴 High | 14h | 🔴 | TD-010 P1 |
| 12.6 | Evidence Unification — UI | 🔴 High | 10h | 🔴 | TD-010 P2 |
| 12.7 | Admin Activity Feed Formatting | 🟢 Low | 3h | 🔴 | TD-016 |
| 12.8 | Skills UUID Fallback Hardening | 🟢 Low | 2h | 🔴 | TD-017 |
| 12.9 | Sprint 12 UAT | 🟡 Med | 5h | 🔴 | — |
| **Total** | **9 stories** | — | **72h** | — | — |

---

## Definition of Done

**Story-Level DoD:**
- All Acceptance Criteria met
- Unit tests written and passing
- No TypeScript errors
- No ESLint warnings
- Pre-push hook passes
- Story doc updated with completion notes

**Sprint-Level DoD:**
- [ ] UAT test plan created and executed (Story 12.9)
- [ ] All CRITICAL/HIGH UAT test cases PASS
- [ ] project-context.md updated
- [ ] Sprint summary + retrospective created
- [ ] CHANGELOG.md updated (frontend + backend)
- [ ] Code merged to main + Git tag (v1.2.0)
- [ ] All tests pass (Unit >80%, E2E critical paths)

---

## Sprint Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Evidence migration corrupts data | Medium | High | Reversible migration + backup, test on copy first |
| Skill tree performance (deep nesting) | Low | Medium | Limit to 3 levels (schema enforced) |
| API contract changes break frontend | Medium | Medium | Version API, update consumers in same PR |
| Scope creep from Phase 2 review | Medium | Low | Architect/UX can suggest but SM gates scope |

---

## Dependencies

### Internal Dependencies
- 12.2 depends on 12.1 (Skill UI needs Category tree component)
- 12.6 depends on 12.5 (Evidence UI needs unified API)

### External Dependencies
- None — no new Azure resources, no SSO changes

---

## Testing Strategy

### Unit Testing
- Target coverage: >80%
- New test files for each story
- Key: migration script tests, tree CRUD tests, evidence type tests

### E2E Impact
- Existing E2E scripts should not break (no auth changes)
- New pages: manual walkthrough + optional Playwright updates

---

## Notes

### Phase 2 Review Items
All 8 stories are marked "⚠️ Phase 2 Review Needed". Party Mode session with Architect (Winston) + UX Designer (Sally) will:
- Review tech approach for Evidence Unification (12.5/12.6)
- Review UI layouts/interactions for new admin pages (12.1-12.4)
- Validate estimates
- Confirm/adjust wave ordering

### Phase 2 Review Findings (Applied)
All 8 stories reviewed by Architect (Winston) + UX Designer (Sally) on 2026-02-19.

**Key decisions:**
- Drag-and-drop for tree reorder (`@dnd-kit`, same-level only)
- Skill tag colors derived from category (`color` field on SkillCategory)
- Inline add skill (tab-to-submit)
- Shared components: `<AdminPageShell>`, `<ConfirmDialog>`, `<CategoryTree>`, `<EvidenceList>`
- Milestone trigger Zod schemas per type
- Evidence field renamed: `sourceUrl` (not `externalUrl`)
- Two-phase migration (schema + data script separately)
- Bulk issuance impact: +2h to Story 12.5
- Two-step issuance UX (issue → attach evidence)
- `Badge.evidenceUrl` kept through Sprint 12 for backward compat, removed Sprint 13

**Estimate change:** 61h → 65h (+2h Story 12.1 for dnd + shared components, +2h Story 12.5 for bulk issuance) → 70h (+5h Story 12.9 UAT added) → **72h** (+2h Story 12.2 for category color propagation)

### Items Deferred to Sprint 13

| # | Item | Source | Est. | Reason |
|---|------|--------|------|--------|
| D-1 | Responsive tree→dropdown (`<1024px`) | Story 12.1 Task 1 | ~2h | Admin 管理页面主要桌面端使用，非核心 AC |
| D-2 | Blue insertion line (DnD visual feedback) | Story 12.1 Task 2 | ~1h | 需要 DragOverlay 自定义，当前 opacity 反馈可用 |
| D-3 | Cross-level "Move to..." action | Story 12.1 Task 2 | ~3h | 需新增后端 reparent API + MoveToDialog，独立功能点 |
| D-4 | Remove deprecated `Badge.evidenceUrl` field | Story 12.5 | ~1h | Sprint 12 保留向后兼容，Sprint 13 移除 |

**Total Sprint 13 carry-forward: ~7h**

### Future Enhancement Candidates (No Decision Made)

| # | Area | Description | Analysis Date | Est. Effort | Notes |
|---|------|-------------|---------------|-------------|-------|
| F-1 | Fine-Grained RBAC | Issuer scope control: template-level access, recipient scope restriction, data isolation between issuers | 2026-02-22 | 8-60h (3 levels) | Current RBAC is coarse-grained (4 roles, endpoint-level guards). Analysis identified 3 evolution paths: L1 ownership scoping (~8-12h), L2 template-issuer assignment (~16-24h), L3 full RBAC/ABAC engine (~40-60h). Architecture is extensible — NestJS Guards + Prisma `where` injection patterns already support it. **No decision made — record for future sprint planning.** See: PRD FR10 gap analysis note. |
| F-2 | Config Lifecycle Management | "迁移 → 归档 → 删除" 三步流程，解决 SkillCategory → Skill → BadgeTemplate → Badge 引用链的配置管理问题 | 2026-02-24 | 28-44h (2 phases) | **⚠️ 初步想法，尚未成熟，需进一步讨论后再决定方案。** **Problem:** 删除操作被整条引用链的 FK 约束锁死，缺少"优雅退役"和迁移路径，导致配置管理不便。**核心思路：** 先迁移（把所有关联数据指向新目标）→ 旧实体无引用后归档 → 可选删除。**Phase 1 — Skill/Category 级迁移（~12h）：** (1) Skill 合并/替换 — 批量替换 Template.skillIds 中的引用，将旧 Skill 的关联转移到新 Skill (~4h); (2) Category 合并 — 批量移动 Skill 到新 Category（已有跨 category 迁移功能）(~2h); (3) Skill/SkillCategory `isActive` 字段 — 归档后从 picker/tree 隐藏 (~4h); (4) 管理 UI 归档过滤器 — show/hide archived 切换 (~2h). **Phase 2 — BadgeTemplate 级迁移（~16-20h，复杂度高）：** (1) Badge 重新归属 — 管理员选择目标 template，预览影响（badge 数量/状态分布）(~4h); (2) assertionJson 策略决策 — 保留旧断言 vs 重新生成（涉及 metadataHash、验证页面显示）(~6-8h); (3) 审计日志记录迁移操作 (~2h); (4) 迁移完成后旧 template 可安全归档/删除 (~2h). **注意：** Phase 2 中 Badge 迁移会影响 Open Badges JSON-LD 断言完整性和外部验证页面显示，需谨慎评估。Skill 跨 Category 迁移已有现成功能。**Dependencies:** None — additive changes. **Status:** 💡 Idea stage — 需 PM + Architect 讨论确认方案后再做 story 拆分。 |
| F-3 | Multi-tenant / Data Isolation | 支持多个管理员分别管理完全隔离的 badge 分发系统 | 2026-02-24 | 16-120h (3 paths) | **💡 未来系统演进方向，仅记录探索。** 当前系统为单租户架构，ADMIN 角色可见所有数据。三种演进路径：**Path A — 数据归属隔离（~16-24h）：** 基于 F-1 的 RBAC 延伸，新增 "Template Group" 或 "Department" 归属，每个 ISSUER/Admin 只管理归属组的 Template/Skill/Badge。Super Admin 仍有全局视图。适合同一组织内部门隔离场景。**Path B — 独立实例部署（~16-24h DevOps）：** Docker/K8s 多实例部署，每实例独立数据库 + 子域名路由。零代码改动，天然物理隔离。适合完全独立组织。运维成本高。**Path C — 真多租户 SaaS（~80-120h）：** 所有核心表加 `tenantId`（BadgeTemplate, Skill, SkillCategory, Badge, User），Tenant 模型 + TenantAdmin 关系，所有 Prisma 查询加 tenant 过滤，API 层 TenantGuard 中间件，前端 tenant 上下文 + 切换器。适合商业化/SaaS 场景。改动面巨大。**当前评估：** 架构可扩展（NestJS Guards + Prisma `where` injection），但无明确业务需求驱动。**Status:** 🔭 Vision — 仅记录方向，待业务需求明确后再评估。 |
| F-4 | AI Agent 对话式交互层 | 用 AI Agent 对话替代 Web UI，用户通过自然语言完成所有系统操作 | 2026-02-24 | 3-10 days (3 tiers) | **💡 源自 Sprint 10 FEAT-001，根据 Sprint 12 现状重新评估。** **现状（v1.2.0 Sprint 12）：** 19 个 Controller、**97 个 API 端点**（较 Sprint 10 的 88 个增加 10%），新增 SkillCategories (6)、AdminUsers (8 expanded)、Milestones (5)、Evidence (5)。全部 RESTful JSON + JWT 认证。Swagger/OpenAPI 文档已就绪（`/api-docs`，DocumentBuilder 配置完备），可直接导出 OpenAPI 3.0 schema 供 Agent 消费。**核心优势：** API-first 架构使 Agent 集成为"连接层"而非"重写"，所有业务逻辑已在后端，Agent 只需做意图→端点映射。**三层演进路径：** **Tier 1 — MCP Server 包装（~3-4 days）：** 基于 OpenAPI schema 自动生成 MCP Tool 定义，每个 API 端点映射为一个 Tool。Agent 通过 MCP 协议调用。覆盖所有 CRUD + 查询操作。适合开发者/Admin 场景，Claude Desktop / Copilot Chat 直接使用。**Tier 2 — 多步骤工作流 + 文件处理（~3-4 days additional）：** (1) 编排层 — "创建模板 → 批量发证 → 通知到 Teams"等串联操作 (~1.5d); (2) 文件适配 — multipart 上传（模板图片）、CSV 批量导入、PNG/CSV 下载转发 (~1d); (3) 会话状态 — 操作确认（"确定要撤销这 5 个 badge 吗？"）、上下文保持 (~0.5d). **Tier 3 — 企业级集成（~3-5 days additional）：** (1) Teams Bot Framework 集成 — 用户在 Teams 聊天中直接操作 G-Credit (~2d); (2) SSE/WebSocket 异步通知 — 批量操作完成推送 (~1d); (3) 安全 Token 代理 — Agent 代表用户操作的 RBAC 边界控制 (~1d); (4) 审计 — Agent 操作记录与人工操作同等记录 (~0.5d). **典型对话场景：** "给张三发一个 Azure 认证徽章" → `POST /api/badges`; "本月有多少人获得了徽章？" → `GET /api/analytics/system-overview`; "把 Cloud Skills 分类下所有技能列出来" → `GET /api/skill-categories` + `GET /api/skills`; "批量导入这个名单" → `POST /api/bulk-issuance/upload` → `POST /api/bulk-issuance/confirm/:sessionId`. **与其他 F 项关联：** F-1（RBAC 细化）直接影响 Tier 3 安全代理设计；F-3（多租户）决定 Agent 的 tenant 上下文感知。**Status:** 💡 Idea — API 基础设施完备，MCP 生态已成熟，技术可行性高。待确定优先级和目标用户群后启动。 |

### Lessons Applied from Sprint 11
- **Lesson 41:** Wave structure for parallelization
- **Lesson 42:** Stories are implementation-ready with explicit ACs and task lists
- **Lesson 43:** E2E test awareness — grep for affected consumers before committing

---

**Last Updated:** 2026-02-20 — Story 12.2 completed (SM accepted), 2/9 stories done  
**Status:** In Development — Stories 12.1–12.2 done, Story 12.3 next  
**Template Version:** v1.2
