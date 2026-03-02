# BMAD Workflow Automation VS Code Extension — Technical Design Document

> **Document Type**: Technical Design Document  
> **Version**: 0.2.0 (Draft)  
> **Created**: 2026-03-01  
> **Last Updated**: 2026-03-02  
> **Author**: LegendZhu  
> **Status**: Design Exploration — Not Yet Implemented

### Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-03-01 | Initial design document |
| 0.2.0 | 2026-03-02 | Feasibility correction: full automated pipeline IS feasible (dev prompt / CR prompt are Agent-generated, not human-written); SM acceptance upgraded to mandatory stage; added CI verification closed loop; added Agent intermediate artifacts (dev prompt / CR prompt) passing mechanism; expanded multi-story execution modes (single/batch/wave/sprint) |

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

> **Key Finding (v0.2.0):** In practice, dev prompts and CR prompts are **entirely Agent-generated** (e.g., the SM Agent generates a detailed dev prompt when creating a Story — with per-file, per-line surgical instructions, often 400+ lines). The developer's role is merely **manual transport** of these Agent-generated artifacts between 3 Chat windows. This means a fully automated pipeline is absolutely feasible — the extension only needs to replace the manual transport steps.

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
              ┌────────────────────────┐
              │  SM Creates Story      │
              │  (create-story)        │
              │  Output: Story file    │
              │      + dev prompt (*)  │
              └───────────┬────────────┘
                          ▼
              ┌────────────────────────┐
              │  SM Generates Dev      │
              │  Prompt (based on      │
              │  Story — detailed dev  │
              │  instructions, 400+    │
              │  lines)                │
              └───────────┬────────────┘
                          ▼
              ┌────────────────────────┐
              │  Dev Implements Story  │
              │   Input: Story + dev  │
              │          prompt        │
              │   (dev-story)          │
              └───────────┬────────────┘
                          ▼
                  ┌──────────────┐
                  │  Git Commit  │
                  │  (WIP)       │
                  └──────┬───────┘
                         ▼
              ┌────────────────────────┐
              │  SM Generates CR       │
              │  Prompt (based on git  │
              │  diff + Story —        │
              │  review instructions)  │
              └───────────┬────────────┘
                          ▼
              ┌────────────────────────┐
              │  CR Code Review        │
              │  Input: Story + CR     │
              │   prompt + git diff    │
              │  (code-review)         │
              └──────┬─────────────────┘
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
              │  SM Accept   │  ← Mandatory stage (not optional)
              │  (story      │
              │  acceptance) │
              └──────┬───────┘
                     ▼
              ┌──────────────┐     ┌───────────────────┐
              │  Accepted?   │─NO─▶│ Dev Fix → CR → SM │
              └──────┬───────┘     │ (back to fix loop)│
                     │             └───────────────────┘
                    YES
                     ▼
              ┌──────────────┐
              │  Git Push    │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │  CI Verify   │  ← Poll GitHub Actions
              └──────┬───────┘
                     ▼
              ┌──────────────┐     ┌───────────────────┐
              │  CI Passed?  │─NO─▶│ Dev Fix → CR → SM │
              └──────┬───────┘     │ → Push → CI again │
                     │             └───────────────────┘
                    YES
                     ▼
              ┌──────────────┐
              │   Done ✅     │
              └──────────────┘
```

> (*) Dev prompt can be generated by the SM Agent alongside Story creation, or as an independent step where the SM Agent generates it based on an existing Story file.

### 4.2 Phase Details

| Phase | Agent Used | Workflow | Input | Output |
|-------|-----------|----------|-------|--------|
| SM Create Story | Bob (SM) | `create-story` | Sprint plan, Epics, sprint-status.yaml | Story file (`.md`) |
| **SM Generate Dev Prompt** | **Bob (SM)** | **custom** | **Story file, project code structure** | **dev prompt (`.md`)** — detailed per-file, per-line dev instructions |
| Dev Implement | Amelia (Dev) | `dev-story` | **Story file + dev prompt**, project codebase | Code changes, tests, updated Story file |
| **SM Generate CR Prompt** | **Bob (SM)** | **custom** | **Story file, git diff, commit SHA** | **CR prompt (`.md`)** — segmented diff commands and review focus areas |
| CR Review | Murat/Tea (CR) | `code-review` | **Story file + CR prompt** + git diff, architecture docs | Review report (APPROVED / CHANGES_REQUESTED) |
| Dev Fix | Amelia (Dev) | `dev-story` (fix mode) | Review report, original Story | Fixed code changes |
| **SM Accept** | **Bob (SM)** | **custom acceptance logic** | **Story file, final code, CR approval report** | **Acceptance result (ACCEPTED / REJECTED)** |
| **CI Verify** | **— (automation)** | **— (GitHub Actions)** | **pushed code** | **CI status (PASS / FAIL)** |

> **Agent Intermediate Artifacts (v0.2.0):** Dev prompts and CR prompts are key intermediate artifacts in the pipeline, automatically generated by the SM Agent and passed to Dev/CR Agents. These prompts contain a level of precision (specific file paths, line numbers, categorized decisions) that would be difficult to write manually, but Agents can produce them automatically from Story files and project code.

### 4.3 State Machine Definition

```typescript
enum PipelineState {
  IDLE = 'IDLE',
  SM_CREATING_STORY = 'SM_CREATING_STORY',
  SM_STORY_CREATED = 'SM_STORY_CREATED',
  SM_GENERATING_DEV_PROMPT = 'SM_GENERATING_DEV_PROMPT',    // v0.2.0
  DEV_PROMPT_READY = 'DEV_PROMPT_READY',                   // v0.2.0
  DEV_IMPLEMENTING = 'DEV_IMPLEMENTING',
  DEV_COMPLETE = 'DEV_COMPLETE',
  SM_GENERATING_CR_PROMPT = 'SM_GENERATING_CR_PROMPT',      // v0.2.0
  CR_PROMPT_READY = 'CR_PROMPT_READY',                     // v0.2.0
  CR_REVIEWING = 'CR_REVIEWING',
  CR_APPROVED = 'CR_APPROVED',
  CR_CHANGES_REQUESTED = 'CR_CHANGES_REQUESTED',
  DEV_FIXING = 'DEV_FIXING',
  DEV_FIX_COMPLETE = 'DEV_FIX_COMPLETE',
  SM_ACCEPTING = 'SM_ACCEPTING',                           // mandatory stage
  SM_ACCEPTED = 'SM_ACCEPTED',                             // v0.2.0
  SM_REJECTED = 'SM_REJECTED',                             // v0.2.0
  GIT_PUSHING = 'GIT_PUSHING',                             // v0.2.0
  CI_WAITING = 'CI_WAITING',                               // v0.2.0
  CI_PASSED = 'CI_PASSED',                                 // v0.2.0
  CI_FAILED = 'CI_FAILED',                                 // v0.2.0
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

### 5.2 SM Acceptance (Mandatory Stage)

SM acceptance has been upgraded from an optional checkpoint to a **mandatory stage**:

- After CR approval, the SM Agent automatically performs Story acceptance
- Verifies that all Acceptance Criteria are satisfied
- Outputs `ACCEPTED` or `REJECTED`
- **On REJECTED**: loops back to Dev → CR → SM, consistent with CR rejection handling
- **On ACCEPTED**: proceeds to git squash + push

```
CR APPROVED → SM Accept
    ├── ACCEPTED → git squash → git push → CI
    └── REJECTED → Dev Fix → CR Review → SM Accept (≤3 rounds)
```

### 5.3 CI Verification Closed Loop (v0.2.0)

The pipeline does NOT end immediately after push. Instead, it enters a **CI verification stage**:

- Polls GitHub Actions API for CI results
- CI PASS → `PIPELINE_COMPLETE` ✅
- CI FAIL → pulls failure logs and passes them to Dev Agent → loops back to Dev → CR → SM → Push → CI

**CI-only checks** (not covered by local pre-push hooks):
- Chinese character source code check
- E2E tests (requires PostgreSQL container)
- Linux environment differences (path case sensitivity, `npm ci` strict install)

### 5.4 Manual Checkpoints

By default, the pipeline runs **fully automatically** (including SM acceptance and CI verification), with no VS Code UI interaction required.

**3 optional business checkpoints** are available (disabled by default), configurable as needed:

| Checkpoint | Trigger Point | Config Key |
|------------|--------------|------------|
| Story Confirmation | After SM creates Story + dev prompt, before Dev implements | `checkpoints.after_story_creation` |
| Implementation Confirmation | After Dev completes, before CR reviews | `checkpoints.after_dev_implementation` |
| Push Confirmation | After SM accepts, before Git Push | `checkpoints.after_sm_acceptance` |

When a checkpoint is enabled, the pipeline pauses and shows a VS Code notification, waiting for the user to click "Continue" or "Abort".

### 5.5 Git Strategy

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

### 5.6 Multi-Story Execution Modes

Four execution modes are supported, selectable via configuration:

| Mode | Trigger | Git Strategy | CI Timing | Priority |
|------|---------|-------------|-----------|----------|
| **single** | Specify 1 story | Single branch, push after story completes | Immediately after push | ✅ V1.0 |
| **batch** | Specify N stories | One commit per story | Configurable: per-story or batch-end | 🔜 V1.1 |
| **wave** | Specify wave number | Same branch, one commit per story | After wave completes | 📋 V1.5 |
| **sprint** | Specify sprint number | Auto-group by wave | After each wave completes | 📋 V2.0 |

**Multi-Story Pipeline Flow (Sprint Mode Example):**

```
Read backlog.md → Parse wave structure
    ↓
Wave 1: [15.1, 15.2]
    ↓
Story 15.1: SM→Dev→CR→SM→✅
Story 15.2: SM→Dev→CR→SM→✅
    ↓
git push wave 1 → CI_WAITING → CI_PASS
    ↓
Wave 2: [15.3, 15.4, 15.5]
    ↓
Story 15.3: SM→Dev→CR→SM→✅
Story 15.4: SM→Dev→CR→SM→✅  (depends on 15.3 → sequential)
Story 15.5: SM→Dev→CR→SM→✅
    ↓
git push wave 2 → CI_WAITING → CI_PASS
    ↓
Sprint COMPLETE
```

**Key Design Decisions:**

| Design Point | Strategy |
|-------------|----------|
| **Dependencies** | Parsed from backlog's `Depends On` column; dependent stories run sequentially |
| **Story failure** | Skip failed story and continue; add to retry queue; summarize at wave end |
| **CI failure impact** | Pause entire pipeline; resume from failed story after fix |
| **Progress persistence** | Pipeline state written to `.vscode/bmad-pipeline-state.json`; recoverable after VS Code restart |

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
    "max_sm_rejection_rounds": 3,
    "max_ci_retry_rounds": 2,
    "auto_commit": true,
    "auto_push_after_accept": true,
    "branch_prefix": "feature/story-"
  },
  "execution": {
    "mode": "single",
    "stories": [],
    "wave": null,
    "sprint": null,
    "ci_strategy": "per_story",
    "git_strategy": "branch_per_story"
  },
  "checkpoints": {
    "after_story_creation": false,
    "after_dev_implementation": false,
    "after_sm_acceptance": true
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
- [x] ~~**Error recovery**: Recovery strategy for mid-pipeline failures~~ → Resolved: state persisted to `.vscode/bmad-pipeline-state.json`, supports checkpoint recovery
- [x] ~~**Log persistence**~~ → Resolved: must persist, recording each Agent's input/output (including dev prompt and CR prompt)
- [ ] **`vscode.lm` API stability validation**: Prototype needed to verify actual API behavior and limitations
- [ ] **Dev Agent code execution**: How does LLM-generated code get written to the file system (direct file write vs. VS Code Edit API)
- [ ] **Test execution integration**: Should the Dev phase automatically run test suites and feed results back to the Agent?
- [ ] **GitHub Actions API integration**: Authentication method and polling frequency strategy for CI result retrieval
- [ ] **Dev prompt generation timing**: Generated alongside Story creation, or as an independent step?
- [ ] **CR prompt git diff token management**: How to chunk large diffs for CR Agent consumption

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
