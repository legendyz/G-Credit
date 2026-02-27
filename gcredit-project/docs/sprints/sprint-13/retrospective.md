# Sprint 13 Retrospective — Azure AD SSO + Session Management

**Sprint:** Sprint 13  
**Date:** 2026-02-27  
**Facilitator:** SM Agent (Bob)  
**Result:** ✅ 8/8 stories delivered across 4 waves, 1,708 tests, 0 regressions  
**Version:** v1.3.0 | **PR:** #9 merged | **Release:** v1.3.0 tagged

---

## ✅ What Went Well

### 1. Enterprise SSO 端到端交付 — 从零到完整认证流
- 从无 SSO 能力到完整的 Azure AD Authorization Code Flow（PKCE），包含 JIT 配置、mini-sync、双入口登录页
- 4 个紧密耦合的 Story（13.1–13.4）无缝衔接：后端策略 → JIT → Mini-Sync → 前端登录页
- MSAL Confidential Client 集成稳定，token 交换一次成功
- **Impact:** M365 用户首次可以使用企业账号登录 G-Credit

### 2. 会话管理三层防护一次到位
- 401 Interceptor + Token Refresh Queue + Idle Timeout 三个独立机制同时交付
- Promise-based refresh queue 设计优雅 — 多个并发 401 只触发一次刷新
- Idle timeout 的 `isWarningRef` 解决了 warning 期间的事件竞争问题
- **Impact:** 用户 session 过期时无感刷新，长时间不活动自动登出

### 3. UAT 流程大幅改进 — 从 Sprint 12 的教训中学习
- Sprint 12 Action Item #6 要求"决定正式 vs 非正式 UAT"— Sprint 13 交出了双轨答卷：
  - Agent UAT: 47/47 自动化测试，13 个阶段，可重复执行
  - Manual UAT: 6 个阶段（M1–M6），覆盖 SSO 流、idle timeout、多标签页、端到端 badge 操作
- UAT 发现 4 个真实 Bug（M3.1, M4.2, M6.1, M6.2），全部当场修复
- **Key insight:** Agent UAT 捕获 API 级回归，Manual UAT 捕获 UX/交互级问题 — 两者互补

### 4. Pre-Push Hook 持续发挥价值
- Sprint 11 引入的 Husky pre-push hook 在本 Sprint 每次 push 都完整验证（lint + tsc + jest + build + vitest）
- Windows worker race issue 被及时发现并修复（Story 05e9f04）
- Tag push 时 hook 也触发成功（虽然对 tag push 不必要，以 `--no-verify` 跳过）
- **Impact:** 零 CI 失败，所有 push 到 origin 的代码都经过验证

### 5. Code Review 质量持续保持高水平
- 7 个开发 Story 全部首轮 review 通过（APPROVED）
- Review 发现的 nit 级问题（ApiError class、clock-skew guard、idempotent timeout guard）都及时修复
- 结构化 review prompt 确保每个 AC 都被验证
- **Impact:** 零 post-merge bug

---

## ⚠️ What Could Be Improved

### 1. Closeout 文档仍然滞后
- Sprint 12 Retrospective Action Item #5 要求"SM 接受后立即更新 story 状态"
- Sprint 13 中 `sprint-status.yaml` 仍然在 sprint 最后才批量更新（13.6 还停留在 `review`，13.7/13.8 停留在 `backlog`）
- **Root cause:** 开发节奏快，文档更新被推迟
- **Action:** 考虑在 SM acceptance commit 中同步更新 sprint-status.yaml

### 2. UAT Bug 修复与 closeout commit 混合
- UAT 发现的 4 个 bug 分布在 2 个修复 commit 中（`3eeb139` + `299a7b8`），与 closeout commit（`2441026`）分开
- 但 M6.2 的修复范围扩大到了数据驱动重构（TAB_CONFIG、PLATFORM_CONFIG），超出了 bug 修复的范围
- **Observation:** 重构改善了代码质量，但在 UAT 阶段做重构增加了风险
- **Action:** UAT 阶段的修复应最小化，重构类改进推迟到下一个 sprint

### 3. 版本号在 push 前未更新
- Closeout commit 将 version 从 1.2.1 → 1.3.0，但之前 pre-push hook 输出显示 `backend@1.2.1`
- 直到最后的 closeout commit 才 bump version
- **Action:** 考虑在 sprint 第一个 commit 或 feature branch 创建时就 bump version

### 4. 部分临时文件被提交
- `_push-output.txt`、`test-output-13-3.txt`、`scripts/adm.txt`、`scripts/admpass.txt` 等临时文件进入了仓库
- `.gitignore` 应更严格地排除这些文件
- **Action:** 清理临时文件并更新 `.gitignore` 规则

---

## 🎯 Action Items for Sprint 14

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | 清理仓库临时文件（_push-output.txt, test-output-*.txt, scripts/*.txt） | Dev | 🟡 P1 |
| 2 | 更新 .gitignore 排除临时输出文件 | Dev | 🟡 P1 |
| 3 | SM acceptance 时同步更新 sprint-status.yaml | SM | 🟢 P2 |
| 4 | UAT 阶段仅做最小修复，重构推到 sprint 开头或 TD story | SM + Dev | 🟢 P2 |
| 5 | 取消注释 Teams tab/analytics（TD-006 一旦 Teams 分享实现） | Dev | 🟢 P3 |
| 6 | Pre-push hook 跳过 tag push（避免不必要的检查） | Dev | 🟢 P3 |
| 7 | 写 Sprint 13 Retrospective（本文档）✅ | SM | ✅ Done |

---

## 📊 Sprint Metrics

| Metric | Sprint 12 | Sprint 12.5 | Sprint 13 | Change (vs 12.5) |
|--------|-----------|-------------|-----------|-------------------|
| Stories | 8 | 2 | 8 | — |
| Total Tests | 1,549 | 1,593 | 1,708 | +115 (+7%) |
| BE Tests | 847 | 855 | 914 | +59 (+7%) |
| FE Tests | 702 | 738 | 794 | +56 (+8%) |
| ESLint Errors | 0 | 0 | 0 | Maintained |
| ESLint Warnings | 0 | 0 | 0 | Maintained |
| tsc Errors | 0 | 0 | 0 | Maintained |
| Bundle Size (index.js) | — | — | 252 KB | — |
| Commits on Branch | — | 10 | 30 | — |
| Files Changed | — | — | 133 | — |
| Lines Added | — | — | +15,135 | — |
| Lines Removed | — | — | -1,235 | — |

---

## Velocity

| Sprint | Stories | Estimated | Actual Structure |
|--------|---------|-----------|------------------|
| Sprint 10 | 12/12 | 95h | — |
| Sprint 11 | 25/25 | 64-80h | 7 waves |
| Sprint 12 | 8/8 | 72h | 3 waves |
| Sprint 12.5 | 2/2 | 7h | 1 wave |
| **Sprint 13** | **8/8** | **50-60h** | **4 waves** |

---

## Sprint 12 Action Items 回顾

| # | Action | Result |
|---|--------|--------|
| 1 | 执行 D-1~D-4 carry-forward | ✅ Sprint 12.5 完成 |
| 2 | 删除 Badge.evidenceUrl (D-4) | ✅ Sprint 12.5 完成 |
| 3 | 解决 DEC-001~DEC-006 | ✅ DEC-001(双入口), DEC-002(保留密码), DEC-005(env var bootstrap) 已执行 |
| 4 | 评估 F-1~F-4 未来增强 | 🔵 Carry forward |
| 5 | SM 接受后立即更新 story 状态 | ⚠️ 部分改善，仍在最后批量更新 |
| 6 | 决定正式 vs 非正式 UAT | ✅ 双轨 UAT（Agent + Manual），效果显著 |

---

**Created:** 2026-02-27  
**Author:** SM Agent (Bob)  
**Next Review:** Sprint 14 Planning
