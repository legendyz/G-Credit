# Sprint 11 候选任务清单

**Created:** 2026-02-11
**Author:** PM Agent (John)
**Purpose:** 整合审计发现与MVP遗留工作，供PO与Scrum Master讨论Sprint 11范围
**Status:** 待确认

---

## 背景

本清单整合了以下来源的待办工作：
1. **Post-MVP 6项审计** (2026-02-11) — PRD compliance, Security, Architecture, Code Quality, Feature/UX
2. **MVP遗留技术债务** (TD-006 ~ TD-027) — 来自 `sprint-7/technical-debt-from-reviews.md` 和 `project-context.md`
3. **MVP遗留功能需求** (FEAT-001 ~ FEAT-008) — 来自 `sprint-10/backlog.md`

已去除重复项，标注来源，按优先级排序。

---

## Sprint 11 目标声明 (建议)

> **"安全加固 + 代码质量提升 + 核心功能补全"**
> 
> 在推进生产部署之前，修复所有P0安全问题，提升测试覆盖，并补全用户预期的核心功能（隐私控制、LinkedIn分享）。

---

## P0 — Pilot阻塞项 (必须完成)

| ID | 任务 | 来源 | 工时 | 说明 |
|----|------|------|------|------|
| **SEC-001** | Account Lockout — 失败登录计数+账户锁定 | Security Audit | 2-3h | 防暴力破解 |
| **SEC-005** | File Upload Magic-byte验证 | Security Audit | 2-3h | 防MIME类型欺骗 |
| **SEC-007 + DEP-001** | npm audit fix + Swagger条件加载 | Security Audit | 30min | 修复2个HIGH漏洞，生产环境隐藏API文档 |
| **FR19** | Badge Visibility Toggle (公开/私有控制) | PRD Audit + Feature Audit P0-1 | 4-6h | 用户核心预期：控制badge可见性 |
| **FEATURE-P0-2** | LinkedIn Share Tab | Feature Audit P0-2 | 3-4h | PRD指定的"病毒式传播引擎" |

**P0 小计：12-16.5h**

---

## P1 安全 — 生产部署前应完成

| ID | 任务 | 来源 | 工时 | 说明 |
|----|------|------|------|------|
| **SEC-002** | JWT迁移到httpOnly Cookie | Security Audit HIGH | 4-6h | 防XSS窃取token |
| **SEC-003** | Issuer邮箱脱敏 (公开验证页) | Security Audit MEDIUM | 30min | 应用现有maskEmail()函数 |
| **SEC-004** | 日志PII清理 (14+处明文邮箱) | Security Audit LOW | 2h | GDPR合规 |
| **SEC-006** | 全局HTML清洗管道 | Security Audit MEDIUM | 2-3h | 防存储型XSS |

**P1安全 小计：9-11.5h**

---

## P1 代码质量

| ID | 任务 | 来源 | 工时 | 说明 |
|----|------|------|------|------|
| **CQ-001** | `badge-templates.service.ts` 单元测试 | Code Quality Audit | 4-6h | 386行核心模块，0测试 |
| **CQ-002** | `issuance-criteria-validator.service.ts` 单元测试 | Code Quality Audit | 3-4h | 358行复杂验证，0测试 |
| **CQ-003** | `blob-storage.service.ts` 单元测试 | Code Quality Audit | 3-4h | 346行关键基础设施，0测试 |
| **CQ-004** | 22个服务/控制器添加NestJS Logger | Code Quality Audit | 2-3h | 改善可观测性 |
| **CQ-005** | 移除未用依赖 (keyv, framer-motion, tailwindcss-animate) | Code Quality Audit | 15min | 清理死代码 |
| **CQ-006** | 前端设计系统一致性 (inline style→Tailwind) | Code Quality + Feature Audit P1-1 | 2-3h | 统一设计语言 |
| **CQ-007** | 分页响应格式标准化 (`PaginatedResponse<T>`) | Code Quality Audit | 4-6h | 消除5种不同分页格式 |

**P1代码质量 小计：19-26h**

---

## P1 功能修复

| ID | 任务 | 来源 | 工时 | 说明 |
|----|------|------|------|------|
| **FR26** | Analytics CSV Export | PRD Audit + Feature Audit P1-5 | 3h | HR需要可下载报告 |
| **FEATURE-P1-6** | Verification Page Skill UUID→Name | Feature Audit | 1h | 公开页面显示UUID影响信任度 |
| **FEATURE-P1-4** | 403 Access Denied Page | Feature Audit | 2h | 当前无权限时显示通用错误 |
| **FEATURE-P1-8** | ClaimPage硬编码UUID修复 | Feature Audit | 1h | 避免未来潜在bug |

**P1功能 小计：7h**

---

## P1 遗留技术债务

| ID | 任务 | 来源 | 工时 | 说明 |
|----|------|------|------|------|
| **TD-023** | CI Chinese Character Gate | project-context.md | 1h | 自动化检查中文字符 |
| **TD-024** | CI console.log Gate | project-context.md | 1h | 自动化检查console语句 |
| **TD-025** | Husky Pre-commit Hooks | project-context.md | 2h | 本地提交前检查 |

**P1遗留TD 小计：4h**

---

## P1 遗留功能需求 (与审计发现合并)

| ID | 任务 | 来源 | 工时 | 说明 | 与审计关系 |
|----|------|------|------|------|-----------|
| **FEAT-008-P0** | User Management导航入口修复 | sprint-10/backlog.md | 0.5天 | Desktop/Mobile Nav缺少链接 | Feature Audit也发现 |
| **FEAT-008-P2** | ~~忘记密码前端UI~~ | sprint-10/backlog.md | ~~1-2天~~ | **已合并到P1功能FEATURE-P1-7** | 重复 |
| **FEAT-007-部分** | ~~API调用模式统一~~ | sprint-10/backlog.md | ~~2-3天~~ | **已拆解到CQ-007** | 部分重复 |

**说明：**
- FEAT-008的"忘记密码UI"与审计发现的"Forgot Password"重复，保留审计版本
- FEAT-007的"集中HTTP Client"与CQ-007有重叠，需SM与Architect讨论是否合并

---

## P2 — 可选/Backlog

### P2 代码质量
| ID | 任务 | 来源 | 工时 |
|----|------|------|------|
| CQ-008 | API调用模式统一 (51个fetch→集中client) | Code Quality Audit | 4-6h |
| CQ-009 | 大组件拆分 (BadgeShareModal 742行等) | Code Quality Audit | 8-12h |
| CQ-010 | badge-issuance.controller测试扩展 (1测试→完整覆盖) | Code Quality Audit | 4-6h |
| CQ-011 | 62个前端组件添加测试 | Code Quality Audit | 20-30h |

### P2 功能/UX
| ID | 任务 | 来源 | 工时 |
|----|------|------|------|
| UX-001 | BadgeTemplateListPage分页 | Feature Audit P2-1 | 2-3h |
| UX-002 | TimelineView分页/无限滚动 | Feature Audit P2-2 | 3-4h |
| UX-003 | 删除确认模态框替代browser confirm() | Feature Audit P2-5 | 1-2h |
| UX-004 | LoginPage使用shadcn Input组件 | Feature Audit P2-6 | 1h |
| UX-005 | Emoji→Lucide图标统一 | Feature Audit P2-7 | 2h |
| UX-006 | z-index规范化 | Feature Audit P2-8 | 1h |
| UX-007 | 用户手动创建能力 | Feature Audit P2-9 = FEAT-008-P3 | 1-2天 |
| UX-008 | Mobile Nav添加Issue Badge | Feature Audit P2-10 | 1h |
| UX-009 | Badge Template Preview模式 | Feature Audit P2-12 | 3-4h |

### P2 遗留TD
| ID | 任务 | 来源 | 工时 |
|----|------|------|------|
| TD-026 | SM Audit Triage Workflow | project-context.md | 1h |
| TD-027 | Playwright Visual Regression CI | project-context.md | 4h |

---

## P3 — 明确推迟

### 推迟到Sprint 12
| ID | 任务 | 来源 | 工时 | 推迟原因 |
|----|------|------|------|----------|
| **FR27** | Azure AD SSO | PRD Phase 3 | 16-24h | PO决定先提升代码质量 |
| **PROD** | Production Deployment (Azure App Service) | Roadmap | 8-12h | SSO完成后一起做 |
| **FEAT-008-P1** | M365同步前端UI | sprint-10/backlog.md | 2-3天 | 依赖生产部署 |

### 推迟到Phase 2
| ID | 任务 | 来源 | 说明 |
|----|------|------|------|
| FR5 | Badge Template审批流程 | PRD | 单人管理时风险低 |
| FR8 | LMS自动发证 | PRD Phase 2 | Epic 10 |
| FR9 | Manager审批流程 | PRD Phase 2 | Epic 11 |
| FR18 | Badge自动认领 | PRD | 手动认领可用 |
| FR4 | Badge续期 | PRD | 重新发放可替代 |
| TD-016 | Async Bulk Processing (Redis) | project-context.md | 20 badge限制够用 |
| FEAT-001 | AI Agent集成层 | sprint-10/backlog.md | 需求不紧急 |
| FEAT-002 | 邀请式Badge发放 | sprint-10/backlog.md | 当前流程可用 |
| FEAT-003 | M365角色自动映射 | sprint-10/backlog.md | 手动分配可用 |
| FEAT-004 | 角色模型重构 | sprint-10/backlog.md | 架构变更需充分设计 |
| FEAT-006 | Category/Skill管理UI | sprint-10/backlog.md | 后端已有API，优先级低 |

### 外部阻塞
| ID | 任务 | 来源 | 阻塞原因 |
|----|------|------|----------|
| **TD-006** | Teams Channel Permissions | project-context.md | 需要租户管理员批准ChannelMessage.Send权限 |

---

## 工时汇总

| 类别 | 工时范围 |
|------|----------|
| P0 Pilot阻塞 | 12-16.5h |
| P1 安全 | 9-11.5h |
| P1 代码质量 | 19-26h |
| P1 功能 | 7h |
| P1 遗留TD | 4h |
| **P0+P1 合计** | **51-65h** |
| P2 可选 | 50-80h (不建议全部纳入) |

---

## 建议Sprint 11范围

### 如果容量70h:
纳入所有P0 + P1，跳过P2。

### 如果容量50h:
纳入所有P0 + P1安全 + P1代码质量(CQ-001~CQ-006)，推迟CQ-007和部分P1功能。

### 如果容量40h:
仅纳入P0 + P1安全，代码质量推迟到Sprint 12。

---

## 需Scrum Master确认的问题

1. **容量确认** — Sprint 11预期工时是多少？
2. **FEAT-007 vs CQ-007** — "集中HTTP Client"和"分页标准化"是否合并为一个story？
3. **FEAT-008拆分** — 用户管理的多个P0/P1/P2子项是拆成独立story还是作为一个大story？
4. **TD-006** — 是否需要PO主动联系租户管理员？还是继续等待？
5. **优先级调整** — 是否有其他业务需求需要插入？

---

## 附录：审计报告位置

| 审计 | 文件路径 |
|------|----------|
| PRD Compliance | `docs/planning/prd-compliance-matrix.md` |
| Security | `docs/security/security-audit-2026-02.md` |
| Architecture Compliance | `docs/architecture/architecture-compliance-audit-2026-02.md` |
| Architecture Quality | `docs/architecture/architecture-quality-assessment-2026-02.md` |
| Code Quality | `docs/development/code-quality-audit-2026-02.md` |
| Feature & UX | `docs/planning/feature-completeness-audit-2026-02.md` |
| Post-MVP Audit Plan | `docs/planning/post-mvp-audit-plan.md` |

---

*此文档由PM Agent生成，供PO与Scrum Master讨论Sprint 11范围使用。最终backlog由Scrum Master创建。*
