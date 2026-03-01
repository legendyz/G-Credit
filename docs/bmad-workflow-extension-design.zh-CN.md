# BMAD 工作流自动化 VS Code 扩展 — 技术设计文档

> **文档类型**: Technical Design Document  
> **版本**: 0.1.0 (草案)  
> **创建日期**: 2026-03-01  
> **作者**: LegendZhu  
> **状态**: 设计探索阶段，尚未实施

---

## 1. 概述

### 1.1 项目背景

[BMAD 平台](https://github.com/bmadcode/BMAD-METHOD) (v6.0.0-alpha.23) 提供了一套完整的 Agent 驱动开发方法论，包括 Scrum Master (SM Bob)、Developer (Dev Amelia)、Code Reviewer (CR Murat/Tea) 等角色 Agent，以及 `create-story`、`dev-story`、`code-review` 等标准工作流。

当前，开发者在 VS Code 中通过 **3 个独立的 Copilot Chat 窗口** 手动切换执行这些工作流：

```
窗口 1: SM Bob     → 创建 Story
窗口 2: Dev Amelia → 实现 Story
窗口 3: CR Tea     → 代码审查
```

每次切换需要人工复制上下文、加载 Agent 模板、粘贴指令，整个流程既繁琐又容易出错。

### 1.2 目标

开发一个 VS Code 扩展，将 SM → Dev → CR 的完整工作流自动化为一条管道 (Pipeline)，实现：

- **零手工切换**: Agent 角色自动轮转，无需手动开启新 Chat 窗口
- **上下文自动传递**: Story 文件、代码变更、审查报告在 Agent 间自动流转
- **BMAD 原生集成**: 直接读取现有 `_bmad/` 目录下的 Agent 定义和 Workflow 模板
- **Git 操作自动化**: 按策略自动 commit、squash、push

### 1.3 适用范围

本扩展是**通用开发效率工具**，独立于任何特定项目。任何使用 BMAD 平台 + VS Code Copilot 的开发者均可使用。

---

## 2. 方案选型

在确定最终方案前，评估了 3 种可行路径：

### 方案对比

| 维度 | 方案 A: 单会话多角色 | 方案 B: 文件驱动半自动 | 方案 C: VS Code 扩展 |
|------|-------------------|---------------------|---------------------|
| **实现方式** | 同一 Chat 窗口中 `@agent` 切换角色 | 输出到文件 → 用户触发下一步 | 扩展通过 `vscode.lm` API 调用模型 |
| **上下文保持** | ⚠️ 窗口 token 限制，角色易混淆 | ✅ 文件天然持久化 | ✅ 程序化管理 |
| **自动化程度** | ❌ 全手动 | △ 半自动 | ✅ 全自动 |
| **开发成本** | 零 | 低（Shell 脚本） | 中（VS Code 扩展开发） |
| **可扩展性** | ❌ 差 | △ 一般 | ✅ 强 |

### 选择结论

**方案 C — VS Code 扩展**，理由：

1. **`vscode.lm` API** 是唯一能在 $0 成本下使用 Copilot 订阅模型 (如 Claude Opus) 的编程方式
2. GitHub Copilot Chat 模型 **没有公开的 REST API / PAT 访问方式**，只能通过 VS Code 扩展 API 调用
3. 全自动管道可以显著减少开发者的重复劳动

---

## 3. 架构设计

### 3.1 核心模块

```
┌─────────────────────────────────────────────┐
│              VS Code Extension               │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────┐  ┌─────────────────┐  │
│  │ PipelineOrchest- │  │   AgentManager   │  │
│  │     rator         │  │                 │  │
│  │  (状态机/调度器)   │  │  (LLM 调用层)   │  │
│  └────────┬─────────┘  └────────┬────────┘  │
│           │                     │            │
│  ┌────────▼─────────┐  ┌───────▼─────────┐  │
│  │   PromptLoader   │  │   GitManager    │  │
│  │                   │  │                 │  │
│  │ (BMAD 模板加载器) │  │ (Git 操作管理)  │  │
│  └──────────────────┘  └─────────────────┘  │
│                                              │
│  ┌──────────────────┐  ┌─────────────────┐  │
│  │  ConfigManager   │  │  OutputChannel  │  │
│  │                   │  │                 │  │
│  │  (配置管理)       │  │ (日志/进度面板) │  │
│  └──────────────────┘  └─────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

### 3.2 模块职责

#### PipelineOrchestrator — 管道编排器

- 有限状态机，管理 Pipeline 的阶段流转
- 维护当前状态 (`IDLE → SM_CREATING → DEV_IMPLEMENTING → CR_REVIEWING → ...`)
- 决定何时推进、何时回退 (CR 驳回时回退到 Dev)
- 处理异常和超时

#### AgentManager — Agent 管理器

- 通过 `vscode.lm.selectChatModels()` 获取可用模型
- 构建每个 Agent 的系统提示词 (system prompt)
- 调用 `model.sendRequest()` 执行 LLM 推理
- 解析 LLM 输出，提取结构化结果

#### PromptLoader — 提示词加载器

- 动态读取 `_bmad/` 目录下的 Agent 和 Workflow 文件
- 组装完整的 prompt：Agent 身份 + Workflow 指令 + 项目上下文
- 支持变量替换 (如 `{project-root}`、`{user_name}`)
- 缓存已加载的模板

#### GitManager — Git 管理器

- 封装 `git add`、`commit`、`push`、`rebase --squash` 操作
- 按策略执行 Git 操作（详见第 5.3 节）
- 生成规范的 commit message

#### ConfigManager — 配置管理器

- 读取 `.vscode/bmad-workflow.json` 用户配置
- 管理 3 级配置：默认 → BMAD config.yaml → 用户配置
- 运行时校验配置有效性

#### OutputChannel — 输出通道

- 在 VS Code Output Panel 中显示管道运行日志
- 支持 Webview 面板展示详细进度
- 每阶段记录输入/输出，便于调试

### 3.3 技术依赖

| 依赖 | 说明 |
|------|------|
| `vscode.lm` API | VS Code Language Model API，调用 Copilot 模型 |
| GitHub Copilot 订阅 | 用户需有 Copilot Individual / Business / Enterprise 订阅 |
| VS Code ≥ 1.90 | `vscode.lm` API 最低版本要求 |
| Node.js `simple-git` | Git 操作封装库 |
| BMAD 平台 ≥ 6.0 | `_bmad/` 目录结构兼容性 |

---

## 4. 工作流管道

### 4.1 完整流程

```
                    ┌─────────────┐
                    │   开始       │
                    └──────┬──────┘
                           ▼
                  ┌────────────────┐
                  │  SM 创建 Story  │
                  │  (create-story) │
                  └───────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │  Dev 实现 Story  │
                 │   (dev-story)    │
                 └───────┬─────────┘
                         ▼
                  ┌──────────────┐
                  │  Git Commit  │
                  │  (WIP 提交)  │
                  └──────┬───────┘
                         ▼
              ┌─────────────────────┐
              │  CR 代码审查         │
              │  (code-review)      │
              └──────┬──────────────┘
                     ▼
              ┌──────────────┐     ┌─────────────────┐
              │  审查通过？    │─否─▶│  Dev 修复问题    │
              └──────┬───────┘     └───────┬─────────┘
                     │                     ▼
                    是              ┌──────────────┐
                     │              │  Git Commit   │
                     ▼              │  (修复提交)   │
              ┌──────────────┐     └───────┬───────┘
              │  Git Squash  │             ▼
              │  合并提交     │     ┌──────────────────┐
              └──────┬───────┘     │ 再次 CR 审查      │
                     │             │ (≤3 轮, 否则中止) │
                     ▼             └──────────────────┘
              ┌──────────────┐
              │  SM 验收      │
              │  (可选检查点)  │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │  Git Push    │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │    完成       │
              └──────────────┘
```

### 4.2 阶段详解

| 阶段 | 使用的 Agent | 使用的 Workflow | 输入 | 输出 |
|------|-------------|----------------|------|------|
| SM 创建 Story | Bob (SM) | `create-story` | Sprint 计划、Epics、sprint-status.yaml | Story 文件 (`.md`) |
| Dev 实现 | Amelia (Dev) | `dev-story` | Story 文件、项目代码 | 代码变更、测试、更新的 Story 文件 |
| CR 审查 | Murat/Tea (CR) | `code-review` | Git diff、Story 文件、架构文档 | 审查报告 (APPROVED / CHANGES_REQUESTED) |
| Dev 修复 | Amelia (Dev) | `dev-story` (修复模式) | 审查报告、原始 Story | 修复后的代码变更 |
| SM 验收 | Bob (SM) | — (自定义验收逻辑) | Story 文件、最终代码 | 验收结果 |

### 4.3 状态机定义

```typescript
enum PipelineState {
  IDLE = 'IDLE',
  SM_CREATING_STORY = 'SM_CREATING_STORY',
  SM_STORY_CREATED = 'SM_STORY_CREATED',
  DEV_IMPLEMENTING = 'DEV_IMPLEMENTING',
  DEV_COMPLETE = 'DEV_COMPLETE',
  CR_REVIEWING = 'CR_REVIEWING',
  CR_APPROVED = 'CR_APPROVED',
  CR_CHANGES_REQUESTED = 'CR_CHANGES_REQUESTED',
  DEV_FIXING = 'DEV_FIXING',
  DEV_FIX_COMPLETE = 'DEV_FIX_COMPLETE',
  SM_ACCEPTING = 'SM_ACCEPTING',
  PIPELINE_COMPLETE = 'PIPELINE_COMPLETE',
  PIPELINE_FAILED = 'PIPELINE_FAILED',
}
```

---

## 5. 关键设计决策

### 5.1 CR ↔ Dev 循环机制

代码审查和修复形成**闭环循环**：

- CR 审查后输出状态为 `APPROVED` 或 `CHANGES_REQUESTED`
- 若 `CHANGES_REQUESTED`：自动将审查报告作为上下文传递给 Dev，进入修复阶段
- 修复完成后自动触发新一轮 CR
- **最大循环次数: 3 轮**（可配置），超过则中止管道并报告

```
CR Review → APPROVED → 继续
CR Review → CHANGES_REQUESTED → Dev Fix → CR Review (第2轮)
CR Review → CHANGES_REQUESTED → Dev Fix → CR Review (第3轮)
CR Review → CHANGES_REQUESTED → ⛔ 中止 (超过 max_cr_rounds)
```

### 5.2 手工确认点

默认情况下，管道**全自动运行**，无需 VS Code UI 交互。管道直接读写文件系统，不通过 VS Code Chat UI。

提供 **3 个可选的业务检查点** (默认关闭)，可在配置中按需开启：

| 检查点 | 触发时机 | 配置项 |
|--------|---------|--------|
| Story 确认 | SM 创建 Story 后，Dev 实现前 | `checkpoints.after_story_creation` |
| 实现确认 | Dev 实现后，CR 审查前 | `checkpoints.after_dev_implementation` |
| 验收确认 | CR 通过后，Git Push 前 | `checkpoints.after_cr_approval` |

当检查点开启时，管道暂停并在 VS Code 中弹出通知，等待用户点击 "Continue" 或 "Abort"。

### 5.3 Git 策略

```
时间线:
  ├── Dev 实现完成 → git commit -m "wip: story-13.1 implementation"
  ├── CR 第1轮驳回
  ├── Dev 修复 #1 → git commit -m "fix: CR round 1 - [修复摘要]"
  ├── CR 第2轮通过 ✓
  ├── git rebase -i → squash 为一条干净的提交
  │   → "feat(story-13.1): [Story 标题]"
  ├── SM 验收通过 ✓
  └── git push origin [branch]
```

关键规则：
- **每次 Dev 完成都 commit**：保留过程记录，便于回溯
- **CR 通过后 squash**：最终只保留一条语义化提交
- **Push 仅在 SM 验收后**：确保推送到远程的代码是完全通过审查和验收的
- **分支策略**：自动创建 `feature/story-{id}` 分支

### 5.4 单 Story vs 批量模式

当前设计聚焦**单 Story 执行**，确保核心流程稳定可靠。

未来扩展方向：

| 模式 | 描述 | 优先级 |
|------|------|--------|
| 单 Story | 执行一个 Story 的完整管道 | ✅ V1.0 |
| 批量 (Batch) | 依次执行多个 Story | 🔜 V1.1 |
| Wave | 按波次分组执行 (Sprint 11 模式) | 📋 V2.0 |
| Sprint | 自动发现并执行整个 Sprint 的所有 Story | 📋 V2.0 |

---

## 6. BMAD 集成

### 6.1 模板加载机制

扩展通过 `PromptLoader` 模块**动态读取**现有 `_bmad/` 目录结构，无需复制或硬编码模板内容：

```typescript
class PromptLoader {
  // 构建完整的 Agent 系统提示词
  async buildAgentPrompt(agentRole: 'sm' | 'dev' | 'cr'): Promise<string> {
    const agentFile = await this.loadAgentDefinition(agentRole);
    const workflowInstructions = await this.loadWorkflowInstructions(agentRole);
    const projectContext = await this.loadProjectContext();

    return this.assemblePrompt(agentFile, workflowInstructions, projectContext);
  }

  // 从 _bmad/ 目录加载 Agent 定义文件
  private async loadAgentDefinition(role: string): Promise<string> {
    // 读取 _bmad/_config/agent-manifest.csv → 查找对应 Agent
    // 读取 Agent .md 文件获取完整 persona 定义
  }

  // 加载 Workflow 的 instructions.xml
  private async loadWorkflowInstructions(role: string): Promise<string> {
    // SM → create-story/instructions.xml
    // Dev → dev-story/instructions.xml
    // CR → code-review/instructions.xml
  }
}
```

加载路径映射：

| Agent 角色 | Agent 定义文件 | Workflow 指令 |
|-----------|---------------|---------------|
| SM (Bob) | `_bmad/bmm/agents/sm.md` | `_bmad/bmm/workflows/4-implementation/create-story/instructions.xml` |
| Dev (Amelia) | `_bmad/bmm/agents/dev.md` | `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` |
| CR (Tea/Murat) | `_bmad/bmm/agents/tea.md` | `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` |

### 6.2 配置层级

扩展使用 **3 级配置合并**策略：

```
优先级 (低 → 高):
  ① 扩展内置默认值
  ② _bmad/bmm/config.yaml (BMAD 项目配置)
  ③ .vscode/bmad-workflow.json (用户本地配置)
```

从 `_bmad/bmm/config.yaml` 自动继承的配置：
- `user_name` → 用于 commit author
- `communication_language` → Agent 交互语言
- `document_output_language` → 输出文档语言
- `planning_artifacts` → Story/Epic 文件路径
- `implementation_artifacts` → Sprint 文件路径

### 6.3 用户配置文件

`.vscode/bmad-workflow.json` 示例：

```json
{
  "model": {
    "preferred": "claude-opus-4",
    "fallback": "gpt-4o"
  },
  "pipeline": {
    "max_cr_rounds": 3,
    "auto_commit": true,
    "auto_push_after_accept": true,
    "branch_prefix": "feature/story-"
  },
  "checkpoints": {
    "after_story_creation": false,
    "after_dev_implementation": false,
    "after_cr_approval": true
  },
  "agents": {
    "sm": {
      "agent_file": "_bmad/bmm/agents/sm.md",
      "workflow": "_bmad/bmm/workflows/4-implementation/create-story"
    },
    "dev": {
      "agent_file": "_bmad/bmm/agents/dev.md",
      "workflow": "_bmad/bmm/workflows/4-implementation/dev-story"
    },
    "cr": {
      "agent_file": "_bmad/bmm/agents/tea.md",
      "workflow": "_bmad/bmm/workflows/4-implementation/code-review"
    }
  },
  "bmad": {
    "config_path": "_bmad/bmm/config.yaml",
    "auto_discover": true
  }
}
```

---

## 7. 技术约束与前提

### 7.1 硬性约束

| 约束 | 说明 |
|------|------|
| **Copilot 订阅必需** | `vscode.lm` API 只能访问用户已订阅的 Copilot 模型，无法跳过订阅使用 |
| **VS Code 内运行** | 扩展必须在 VS Code 内运行，无法脱离 IDE 独立执行 |
| **无 REST API** | Copilot Chat 模型没有公开的 REST API / PAT 访问方式 |
| **模型可用性不确定** | `vscode.lm.selectChatModels()` 返回的模型列表取决于用户订阅级别 |
| **Token 限制** | 大型代码库的完整 diff 可能超过单次请求的 token 限制 |

### 7.2 前提假设

- 用户工作区中存在有效的 `_bmad/` 目录结构
- 工作区已初始化 Git 仓库
- 用户已在 VS Code 中登录 GitHub Copilot
- BMAD 平台版本 ≥ 6.0（目录结构兼容）

### 7.3 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| `vscode.lm` API 变更 | 中 | 封装为 AgentManager 适配层，隔离 API 变动 |
| LLM 输出不可预测 | 高 | 结构化输出解析 + 重试机制 + 人工检查点 |
| Token 超限 | 中 | 分块处理大 diff，智能截取关键部分 |
| BMAD 目录结构变更 | 低 | PromptLoader 使用 manifest 发现，而非硬编码路径 |

---

## 8. 待定事项

以下问题在实施前需要进一步确认：

- [ ] **扩展命名**: 暂定 `bmad-workflow-pilot`，待确认
- [ ] **发布方式**: 仅本地 `.vsix` 安装，还是发布到 VS Code Marketplace
- [ ] **多项目支持**: 当前假设单工作区，是否需要多根工作区支持
- [ ] **错误恢复**: 管道中途失败后的恢复策略（从断点续跑 vs 重新开始）
- [ ] **日志持久化**: 管道运行记录是否需要持久化存储
- [ ] **`vscode.lm` API 稳定性验证**: 需要原型验证 API 的实际行为和限制
- [ ] **Dev Agent 代码执行能力**: LLM 生成的代码如何实际写入文件系统（直接写入 vs 通过 VS Code Edit API）
- [ ] **测试执行集成**: Dev 阶段是否需要自动运行测试套件并将结果反馈给 Agent

---

## 附录 A: 相关文件参考

| 文件 | 用途 |
|------|------|
| `_bmad/_config/agent-manifest.csv` | 所有已注册 Agent 清单 |
| `_bmad/_config/workflow-manifest.csv` | 所有已注册 Workflow 清单 |
| `_bmad/bmm/config.yaml` | BMM 模块配置（项目路径、用户信息） |
| `_bmad/core/config.yaml` | 核心配置（语言、输出目录） |
| `_bmad/bmm/workflows/4-implementation/create-story/` | SM 创建 Story 工作流 |
| `_bmad/bmm/workflows/4-implementation/dev-story/` | Dev 实现 Story 工作流 |
| `_bmad/bmm/workflows/4-implementation/code-review/` | CR 代码审查工作流 |
| `project-context.md` | 项目上下文总览 |
