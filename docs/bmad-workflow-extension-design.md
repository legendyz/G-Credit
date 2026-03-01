# BMAD Workflow Automation VS Code Extension — Technical Design Document

> **Document Type**: Technical Design Document  
> **Version**: 0.1.0 (Draft)  
> **Created**: 2026-03-01  
> **Author**: LegendZhu  
> **Status**: Design Exploration — Not Yet Implemented

---

## 1. Overview

### 1.1 Background

The [BMAD Platform](https://github.com/bmadcode/BMAD-METHOD) (v6.0.0-alpha.23) provides a comprehensive Agent-driven development methodology, including role-based Agents such as Scrum Master (SM Bob), Developer (Dev Amelia), and Code Reviewer (CR Murat/Tea), along with standardized workflows like `create-story`, `dev-story`, and `code-review`.

Currently, developers execute these workflows manually through **3 separate Copilot Chat windows** in VS Code:

```
Window 1: SM Bob     → Create Story
Window 2: Dev Amelia → Implement Story
Window 3: CR Tea     → Code Review
```

Each context switch requires manually copying context, loading Agent templates, and pasting instructions — a tedious and error-prone process.

### 1.2 Goals

Build a VS Code extension that automates the full SM → Dev → CR workflow into a single pipeline:

- **Zero manual switching**: Agent roles rotate automatically without opening new Chat windows
- **Automatic context passing**: Story files, code changes, and review reports flow between Agents automatically
- **Native BMAD integration**: Reads Agent definitions and Workflow templates directly from the existing `_bmad/` directory
- **Automated Git operations**: Commits, squashes, and pushes according to a defined strategy

### 1.3 Scope

This extension is a **general-purpose developer productivity tool**, independent of any specific project. Any developer using BMAD Platform + VS Code Copilot can benefit from it.

---

## 2. Approach Selection

Three feasible approaches were evaluated before arriving at the final solution:

### Comparison Matrix

| Dimension | Approach A: Single-Session Multi-Role | Approach B: File-Driven Semi-Auto | Approach C: VS Code Extension |
|-----------|--------------------------------------|----------------------------------|-------------------------------|
| **Implementation** | Switch roles via `@agent` in same Chat window | Output to files → user triggers next step | Extension calls models via `vscode.lm` API |
| **Context Retention** | ⚠️ Token limits, role confusion | ✅ Files are naturally persistent | ✅ Programmatic management |
| **Automation Level** | ❌ Fully manual | △ Semi-automatic | ✅ Fully automatic |
| **Dev Cost** | Zero | Low (shell scripts) | Medium (VS Code extension) |
| **Extensibility** | ❌ Poor | △ Fair | ✅ Strong |

### Decision

**Approach C — VS Code Extension**, for the following reasons:

1. **`vscode.lm` API** is the only way to programmatically access Copilot subscription models (e.g., Claude Opus) at $0 cost
2. GitHub Copilot Chat models have **no public REST API / PAT access** — only accessible through the VS Code Extension API
3. A fully automated pipeline significantly reduces repetitive developer effort

---

## 3. Architecture Design

### 3.1 Core Modules

```
┌─────────────────────────────────────────────┐
│              VS Code Extension               │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────┐  ┌─────────────────┐  │
│  │ PipelineOrchest- │  │  AgentManager   │  │
│  │     rator         │  │                 │  │
│  │ (State Machine/   │  │ (LLM Call Layer)│  │
│  │  Dispatcher)      │  │                 │  │
│  └────────┬─────────┘  └────────┬────────┘  │
│           │                     │            │
│  ┌────────▼─────────┐  ┌───────▼─────────┐  │
│  │  PromptLoader    │  │   GitManager    │  │
│  │                   │  │                 │  │
│  │ (BMAD Template   │  │ (Git Operations │  │
│  │  Loader)          │  │  Manager)       │  │
│  └──────────────────┘  └─────────────────┘  │
│                                              │
│  ┌──────────────────┐  ┌─────────────────┐  │
│  │  ConfigManager   │  │  OutputChannel  │  │
│  │                   │  │                 │  │
│  │ (Configuration   │  │ (Logging /      │  │
│  │  Manager)         │  │  Progress Panel)│  │
│  └──────────────────┘  └─────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

### 3.2 Module Responsibilities

#### PipelineOrchestrator — Pipeline Orchestrator

- Finite state machine managing pipeline phase transitions
- Maintains current state (`IDLE → SM_CREATING → DEV_IMPLEMENTING → CR_REVIEWING → ...`)
- Decides when to advance or rollback (rollback to Dev when CR rejects)
- Handles exceptions and timeouts

#### AgentManager — Agent Manager

- Obtains available models via `vscode.lm.selectChatModels()`
- Constructs system prompts for each Agent
- Executes LLM inference via `model.sendRequest()`
- Parses LLM output to extract structured results

#### PromptLoader — Prompt Loader

- Dynamically reads Agent and Workflow files from the `_bmad/` directory
- Assembles complete prompts: Agent identity + Workflow instructions + project context
- Supports variable substitution (e.g., `{project-root}`, `{user_name}`)
- Caches loaded templates

#### GitManager — Git Manager

- Wraps `git add`, `commit`, `push`, `rebase --squash` operations
- Executes Git operations according to the defined strategy (see Section 5.3)
- Generates conventional commit messages

#### ConfigManager — Configuration Manager

- Reads `.vscode/bmad-workflow.json` user configuration
- Manages 3-tier configuration: Defaults → BMAD config.yaml → User config
- Validates configuration at runtime

#### OutputChannel — Output Channel

- Displays pipeline run logs in the VS Code Output Panel
- Supports a Webview panel for detailed progress display
- Records inputs/outputs per phase for debugging

### 3.3 Technical Dependencies

| Dependency | Description |
|------------|-------------|
| `vscode.lm` API | VS Code Language Model API for calling Copilot models |
| GitHub Copilot subscription | User must have Copilot Individual / Business / Enterprise |
| VS Code ≥ 1.90 | Minimum version for `vscode.lm` API support |
| Node.js `simple-git` | Git operations wrapper library |
| BMAD Platform ≥ 6.0 | Directory structure compatibility |

---

## 4. Workflow Pipeline

### 4.1 Complete Flow

```
                    ┌─────────────┐
                    │    Start     │
                    └──────┬──────┘
                           ▼
                  ┌────────────────┐
                  │  SM Creates    │
                  │  Story         │
                  │ (create-story) │
                  └───────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │ Dev Implements  │
                 │  Story          │
                 │  (dev-story)    │
                 └───────┬─────────┘
                         ▼
                  ┌──────────────┐
                  │  Git Commit  │
                  │  (WIP)       │
                  └──────┬───────┘
                         ▼
              ┌─────────────────────┐
              │  CR Code Review     │
              │  (code-review)      │
              └──────┬──────────────┘
                     ▼
              ┌──────────────┐     ┌─────────────────┐
              │  Review      │─NO─▶│  Dev Fixes      │
              │  Passed?     │     │  Issues          │
              └──────┬───────┘     └───────┬─────────┘
                     │                     ▼
                    YES             ┌──────────────┐
                     │              │  Git Commit   │
                     ▼              │  (fix)        │
              ┌──────────────┐     └───────┬───────┘
              │  Git Squash  │             ▼
              │  Commits     │     ┌──────────────────┐
              └──────┬───────┘     │ Re-run CR Review │
                     │             │ (≤3 rounds, else │
                     ▼             │  abort)          │
              ┌──────────────┐     └──────────────────┘
              │  SM Accept   │
              │  (optional   │
              │  checkpoint) │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │  Git Push    │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │    Done       │
              └──────────────┘
```

### 4.2 Phase Details

| Phase | Agent Used | Workflow | Input | Output |
|-------|-----------|----------|-------|--------|
| SM Create Story | Bob (SM) | `create-story` | Sprint plan, Epics, sprint-status.yaml | Story file (`.md`) |
| Dev Implement | Amelia (Dev) | `dev-story` | Story file, project codebase | Code changes, tests, updated Story file |
| CR Review | Murat/Tea (CR) | `code-review` | Git diff, Story file, architecture docs | Review report (APPROVED / CHANGES_REQUESTED) |
| Dev Fix | Amelia (Dev) | `dev-story` (fix mode) | Review report, original Story | Fixed code changes |
| SM Accept | Bob (SM) | — (custom acceptance logic) | Story file, final code | Acceptance result |

### 4.3 State Machine Definition

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

## 5. Key Design Decisions

### 5.1 CR ↔ Dev Loop Mechanism

Code review and fixes form a **closed-loop cycle**:

- CR outputs a status of either `APPROVED` or `CHANGES_REQUESTED`
- On `CHANGES_REQUESTED`: the review report is automatically passed as context to Dev for the fix phase
- After fixes, a new CR round is triggered automatically
- **Maximum loop count: 3 rounds** (configurable) — pipeline aborts if exceeded

```
CR Review → APPROVED → Continue
CR Review → CHANGES_REQUESTED → Dev Fix → CR Review (Round 2)
CR Review → CHANGES_REQUESTED → Dev Fix → CR Review (Round 3)
CR Review → CHANGES_REQUESTED → ⛔ Abort (exceeds max_cr_rounds)
```

### 5.2 Manual Checkpoints

By default, the pipeline runs **fully automatically** with no VS Code UI interaction required. The pipeline reads from and writes to the file system directly, bypassing the VS Code Chat UI.

**3 optional business checkpoints** are available (disabled by default), configurable as needed:

| Checkpoint | Trigger Point | Config Key |
|------------|--------------|------------|
| Story Confirmation | After SM creates Story, before Dev implements | `checkpoints.after_story_creation` |
| Implementation Confirmation | After Dev completes, before CR reviews | `checkpoints.after_dev_implementation` |
| Acceptance Confirmation | After CR approves, before Git Push | `checkpoints.after_cr_approval` |

When a checkpoint is enabled, the pipeline pauses and shows a VS Code notification, waiting for the user to click "Continue" or "Abort".

### 5.3 Git Strategy

```
Timeline:
  ├── Dev implementation done → git commit -m "wip: story-13.1 implementation"
  ├── CR Round 1 rejects
  ├── Dev Fix #1 → git commit -m "fix: CR round 1 - [fix summary]"
  ├── CR Round 2 approves ✓
  ├── git rebase -i → squash into one clean commit
  │   → "feat(story-13.1): [Story title]"
  ├── SM accepts ✓
  └── git push origin [branch]
```

Key rules:
- **Commit after every Dev completion**: Preserves process history for rollback
- **Squash after CR approval**: Final result is a single semantic commit
- **Push only after SM acceptance**: Ensures remote only receives fully reviewed and accepted code
- **Branch strategy**: Automatically creates `feature/story-{id}` branches

### 5.4 Single Story vs. Batch Mode

The current design focuses on **single Story execution** to ensure the core pipeline is stable and reliable.

Future extension roadmap:

| Mode | Description | Priority |
|------|-------------|----------|
| Single Story | Execute one Story through the full pipeline | ✅ V1.0 |
| Batch | Execute multiple Stories sequentially | 🔜 V1.1 |
| Wave | Execute Stories in grouped waves (Sprint 11 pattern) | 📋 V2.0 |
| Sprint | Auto-discover and execute all Stories in a Sprint | 📋 V2.0 |

---

## 6. BMAD Integration

### 6.1 Template Loading Mechanism

The extension uses the `PromptLoader` module to **dynamically read** the existing `_bmad/` directory structure — no template copying or hardcoding required:

```typescript
class PromptLoader {
  // Build complete Agent system prompt
  async buildAgentPrompt(agentRole: 'sm' | 'dev' | 'cr'): Promise<string> {
    const agentFile = await this.loadAgentDefinition(agentRole);
    const workflowInstructions = await this.loadWorkflowInstructions(agentRole);
    const projectContext = await this.loadProjectContext();

    return this.assemblePrompt(agentFile, workflowInstructions, projectContext);
  }

  // Load Agent definition from _bmad/ directory
  private async loadAgentDefinition(role: string): Promise<string> {
    // Read _bmad/_config/agent-manifest.csv → find matching Agent
    // Read Agent .md file for full persona definition
  }

  // Load Workflow instructions.xml
  private async loadWorkflowInstructions(role: string): Promise<string> {
    // SM → create-story/instructions.xml
    // Dev → dev-story/instructions.xml
    // CR → code-review/instructions.xml
  }
}
```

Loading path mappings:

| Agent Role | Agent Definition File | Workflow Instructions |
|-----------|----------------------|----------------------|
| SM (Bob) | `_bmad/bmm/agents/sm.md` | `_bmad/bmm/workflows/4-implementation/create-story/instructions.xml` |
| Dev (Amelia) | `_bmad/bmm/agents/dev.md` | `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` |
| CR (Tea/Murat) | `_bmad/bmm/agents/tea.md` | `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` |

### 6.2 Configuration Hierarchy

The extension uses a **3-tier configuration merge** strategy:

```
Priority (low → high):
  ① Extension built-in defaults
  ② _bmad/bmm/config.yaml (BMAD project configuration)
  ③ .vscode/bmad-workflow.json (user local configuration)
```

Configurations automatically inherited from `_bmad/bmm/config.yaml`:
- `user_name` → Used for commit author
- `communication_language` → Agent interaction language
- `document_output_language` → Output document language
- `planning_artifacts` → Story/Epic file paths
- `implementation_artifacts` → Sprint file paths

### 6.3 User Configuration File

`.vscode/bmad-workflow.json` example:

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

## 7. Technical Constraints & Prerequisites

### 7.1 Hard Constraints

| Constraint | Description |
|-----------|-------------|
| **Copilot subscription required** | `vscode.lm` API can only access models from the user's active Copilot subscription |
| **Must run inside VS Code** | The extension cannot operate independently outside the IDE |
| **No REST API available** | Copilot Chat models have no public REST API / PAT access |
| **Model availability varies** | `vscode.lm.selectChatModels()` returns models based on the user's subscription tier |
| **Token limits** | Full diffs from large codebases may exceed single-request token limits |

### 7.2 Assumptions

- A valid `_bmad/` directory structure exists in the user's workspace
- The workspace has an initialized Git repository
- The user is signed into GitHub Copilot in VS Code
- BMAD Platform version ≥ 6.0 (directory structure compatibility)

### 7.3 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| `vscode.lm` API changes | Medium | Encapsulate in AgentManager adapter layer to isolate API changes |
| Unpredictable LLM output | High | Structured output parsing + retry mechanism + manual checkpoints |
| Token limit exceeded | Medium | Chunked processing of large diffs, intelligent key-section extraction |
| BMAD directory structure changes | Low | PromptLoader uses manifest discovery rather than hardcoded paths |

---

## 8. Open Items

The following questions need to be resolved before implementation:

- [ ] **Extension name**: Tentatively `bmad-workflow-pilot` — to be confirmed
- [ ] **Distribution method**: Local `.vsix` install only, or publish to VS Code Marketplace
- [ ] **Multi-project support**: Current design assumes single workspace — multi-root workspace support needed?
- [ ] **Error recovery**: Recovery strategy for mid-pipeline failures (resume from checkpoint vs. restart)
- [ ] **Log persistence**: Should pipeline run history be persistently stored?
- [ ] **`vscode.lm` API stability validation**: Prototype needed to verify actual API behavior and limitations
- [ ] **Dev Agent code execution**: How does LLM-generated code get written to the file system (direct file write vs. VS Code Edit API)
- [ ] **Test execution integration**: Should the Dev phase automatically run test suites and feed results back to the Agent?

---

## Appendix A: Related File References

| File | Purpose |
|------|---------|
| `_bmad/_config/agent-manifest.csv` | Registry of all available Agents |
| `_bmad/_config/workflow-manifest.csv` | Registry of all available Workflows |
| `_bmad/bmm/config.yaml` | BMM module configuration (project paths, user info) |
| `_bmad/core/config.yaml` | Core configuration (language, output directory) |
| `_bmad/bmm/workflows/4-implementation/create-story/` | SM Create Story workflow |
| `_bmad/bmm/workflows/4-implementation/dev-story/` | Dev Implement Story workflow |
| `_bmad/bmm/workflows/4-implementation/code-review/` | CR Code Review workflow |
| `project-context.md` | Project context overview |
