# README Update Checklist

**Purpose:** Sprint 完成后更新 README.md 所有相关位置，避免遗漏  
**Trigger:** 每次 Sprint 完成，执行 documentation-maintenance-checklist.md 时使用  
**Files:** `CODE/README.md` 和 `gcredit-project/README.md`

---

## 📋 CODE/README.md (6个更新位置)

### ✅ Location 1: Badges Section (Lines ~3-14)
**位置识别：** 文件开头的 badge 图标区域

**需要更新的 Badges：**
- [ ] `Status` badge:
  - 从: `Sprint%207%20In%20Progress%20(86%25)-yellow`
  - 到: `Sprint%207%20Complete%20(100%25)-brightgreen`
- [ ] `Sprint7` badge:
  - 从: `Sprint%207-In%20Progress%20(86%25)-yellow`
  - 到: `Sprint%207-Complete%20(100%25)-brightgreen`
- [ ] `Version` badge:
  - 从: `Version-v0.6.0-blue`
  - 到: `Version-v0.7.0-blue`
- [ ] `Tests` badge:
  - 从: `Tests-334%20Total%2C%20297%20Passing`
  - 到: `Tests-334%20Total%2C%20302%20Passing`

**搜索关键字：** `[![Status](https://img.shields.io/badge/Status-`

---

### ✅ Location 2: Project Overview Section (Lines ~20-40)

**位置识别：** `## 📋 Project Overview` 标题下方

**需要更新的字段：**
- [ ] `**Current Status:**` 行
  - 格式: `🟡 Sprint N In Progress (XX%)` → `✅ Sprint N Complete (100%)`
  - 包含: Sprint 名称、Epic 信息
  
- [ ] `**Sprint N:**` 行（添加新行）
  - 格式: `✅ Complete (100%, X/X stories, actual Xh / estimated Xh, YYYY-MM-DD, vX.X.X)`
  - 示例: `**Sprint 7:** ✅ Complete (100%, 10/10 stories, actual 38.5h / estimated 41-47h, 2026-02-02, v0.7.0)`

- [ ] `**Version:**` 行
  - 格式: `vX.X.X (Sprint N complete, XXX tests, XXX passing core tests, UAT XX%)`
  - 包含: 版本号、测试统计、UAT 结果

- [ ] `**Last Updated:**` 行
  - 格式: `YYYY-MM-DD`

**搜索关键字：** `**Current Status:**`

---

### ✅ Location 3: Recent Progress Section (Lines ~270-290)

**位置识别：** 最新 Sprint 的详细进展，通常在技术栈之前

**需要更新内容：**
- [ ] Sprint 标题行
  - 从: `**🟡 Sprint N In Progress (YYYY-MM-DD, XX% complete):**`
  - 到: `**✅ Sprint N Complete (YYYY-MM-DD, 100% complete):**`

- [ ] Story 状态（如有 pending）
  - 从: `🔵 Story X.X: ... (pending, Xh estimated)`
  - 到: `✅ Story X.X: ... (Xh, XX tests)`

- [ ] 添加新完成的 Stories
  - Phase A P0 fixes
  - Phase B P0 fixes
  - UAT story

- [ ] 更新汇总统计
  - `**Total:**` 从 `X/X stories` → `X/X stories complete`
  - `**Testing:**` 更新 passing tests 数量
  - `**UAT:**` 添加 UAT 结果（如适用）

- [ ] 更新 Branch 状态
  - 从: `**Branch:** sprint-N/...`
  - 到: `**Branch:** sprint-N/... (merged to main)`

- [ ] 添加 Git Tag
  - `**Git Tag:** vX.X.X`

- [ ] 更新 Next 步骤
  - 从: `**Next:** UAT testing and Sprint N completion`
  - 到: `**Next:** Sprint N+1 planning`

**搜索关键字：** `Sprint 7 In Progress` 或 `Sprint 7 Complete`

---

### ✅ Location 4: Roadmap Table (Lines ~475-495)

**位置识别：** `## 📅 Roadmap` 表格中的 Sprint 行

**需要更新内容：**
- [ ] Sprint N 表格行的 Status 列
  - 从: `🟡 In Progress (XX%, X/X stories, Xh/Xh)`
  - 到: `✅ Complete (YYYY-MM-DD, X/X stories, Xh/Xh, vX.X.X)`

- [ ] Duration 列（如实际时长与估算不同）
  - 从: `5 days`
  - 到: `2 days`（根据实际完成时间）

**搜索关键字：** `## 📅 Roadmap` 然后找 `→ Sprint 7` 行

---

### ✅ Location 5: Document Footer - Last Updated (Lines ~592-600)

**位置识别：** 文件底部，最后的分隔线后

**需要更新内容：**
- [ ] `**Last Updated:**` 行
  - 格式: `YYYY-MM-DD`
  - 示例: `**Last Updated:** 2026-02-02`

- [ ] `**Status:**` 行
  - 从: `Sprint N In Progress ⚠️ | Sprint N-1 Complete ✅ (vX.X.X)`
  - 到: `Sprint N Complete ✅ | vX.X.X Released 🚀`

- [ ] `**Version:**` 行
  - 从: `vX.X.X (Released YYYY-MM-DD)`
  - 到: `vX.X.X (Released YYYY-MM-DD)` (更新版本号和日期)

**搜索关键字：** 文件最后 `**Last Updated:**`

---

### ✅ Location 6: Document Footer - Sprint Status List (Lines ~601-609)

**位置识别：** 紧接着 Last Updated 后的 Sprint 列表

**需要更新内容：**
- [ ] 添加新 Sprint N 行
  - 格式: `**Sprint N:** ✅ Complete (100%, X/X stories, actual Xh / estimated Xh, vX.X.X) - [Completion Report](link) | [Retrospective](link)`
  - 示例: `**Sprint 7:** ✅ Complete (100%, 10/10 stories, actual 38.5h / estimated 41-47h, v0.7.0) - [Completion Report](./gcredit-project/docs/sprints/sprint-7/sprint-7-completion-report.md) | [Retrospective](./gcredit-project/docs/sprints/sprint-7/sprint-7-retrospective.md)`

- [ ] 更新 `**Next:**` 行
  - 从: `Story U.1 UAT Testing → Sprint N Completion → vX.X.X Release 🚀`
  - 到: `Sprint N+1 Planning (Analytics & Advanced Features)`

**搜索关键字：** `**Sprint 7:**` 在底部区域

---

## 📋 gcredit-project/README.md (2个更新位置)

### ✅ Location 1: Project Status Section (Lines ~5-17)

**位置识别：** `## 📊 Project Status` 标题下方

**需要更新内容：**
- [ ] `**Current Sprint:**` 行
  - 从: `🟡 Sprint N In Progress (XX% complete, X/X stories, Epic N - ...)`
  - 到: `✅ Sprint N Complete (100%, X/X stories, Epic N - ...)`

- [ ] `**Sprint N:**` 行（第二行）
  - 从: `🟡 In Progress (XX%, X/X stories, actual Xh / estimated Xh, Stories X.X-X.X complete, UAT pending)`
  - 到: `✅ Complete (100%, X/X stories, actual Xh / estimated Xh, YYYY-MM-DD, vX.X.X)`

- [ ] `**Version:**` 行
  - 从: `vX.X.X (Sprint N-1 complete, Sprint N in progress - XXX tests total, XXX passing core tests)`
  - 到: `vX.X.X (Sprint N complete, XXX tests total, XXX passing core tests, UAT XX%)`

**搜索关键字：** `**Current Sprint:**`

---

## 🔧 执行流程（按顺序）

1. **Step 0: 准备数据**
   - [ ] 从 `sprint-status.yaml` 获取准确数据
   - [ ] 从 `sprint-completion-report.md` 获取汇总信息
   - [ ] 确认 Git tag 和 release 已创建

2. **Step 1: CODE/README.md (6个位置)**
   - [ ] Location 1: Badges (顶部)
   - [ ] Location 2: Project Overview (约20-40行)
   - [ ] Location 3: Recent Progress (约270-290行)
   - [ ] Location 4: Roadmap Table (约475-495行)
   - [ ] Location 5: Footer Last Updated (约592-600行)
   - [ ] Location 6: Footer Sprint Status (约601-609行)

3. **Step 2: gcredit-project/README.md (2个位置)**
   - [ ] Location 1: Project Status (约5-17行)

4. **Step 3: 验证**
   - [ ] 运行 `grep -n "Sprint 7\|v0.7\|Last Updated" README.md` 检查所有位置
   - [ ] 确认没有遗留 `In Progress` 或旧版本号
   - [ ] 确认所有日期都是最新的

5. **Step 4: 提交**
   - [ ] `git add README.md gcredit-project/README.md`
   - [ ] `git commit -m "docs: update README badges, roadmap, and sprint status for vX.X.X"`
   - [ ] `git push origin main`

---

## 🤖 自动化建议

**VS Code 搜索技巧：**
```
搜索: Sprint 7|v0\.6\.0|In Progress|2026-02-01
替换前检查所有匹配项
```

**PowerShell 验证脚本：**
```powershell
# 检查是否有遗留的旧版本引用
Select-String -Path "README.md" -Pattern "Sprint 7.*In Progress|v0\.6\.0|2026-02-01" -Context 1,1
```

---

## 📝 常见遗漏位置

根据历史经验，最容易遗漏的位置：
1. ❌ **Recent Progress** 区域（第270-290行） - 容易忘记更新详细列表
2. ❌ **Roadmap Table** - 容易只更新状态忘记更新 Duration 或完成日期
3. ❌ **Footer Last Updated** - 容易忘记更新日期

**预防措施：**
- 使用本 checklist 逐项核对
- 更新后运行 grep 搜索验证
- 提交前用 `git diff` 检查所有变更位置

---

**Last Updated:** 2026-02-02  
**Version:** 1.0.0  
**Created For:** Sprint 7 documentation lessons learned
