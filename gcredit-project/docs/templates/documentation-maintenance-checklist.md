# Documentation Maintenance Checklist

**Purpose:** Systematic checklist for maintaining project documentation consistency and accuracy  
**Target Audience:** BMAD agents (bmad-master, tech-writer) + Team members  
**Usage:** Reference this checklist **anytime** documentation needs updating or validation (not restricted to sprint phases!)  
**Version:** 1.1  
**Created:** 2026-01-29  
**Last Updated:** 2026-01-29

---

## ⚡ Quick Start (TL;DR)

**Can I use this anytime?** → ✅ **YES!** Not restricted to sprint phases.  

**Quick Commands:**

```bash
# Quick check (2 min) - Anytime
Master, quick documentation consistency check.

# After code change (5 min) - Anytime  
Master, I changed [X]. Please update related docs following Scenario [Y].

# Weekly sync (10 min) - Anytime
Master, sync all core documentation files.

# Sprint end (15 min) - Sprint milestone
Master, execute Sprint N completion documentation maintenance (Scenario A).

# Monthly audit (45 min) - Scheduled
@tech-writer, execute monthly documentation audit (Scenario H).
```

**Most Common Scenario for Frequent Maintenance:** → **Scenario I (Ad-hoc Maintenance)** - See below for 5 flexible options.

---

## 🎯 When to Use This Checklist

**Key Principle:** This checklist can be used **anytime** you need to maintain documentation - not restricted to sprint phases!

**Common Triggers:**

| Trigger | Frequency | Priority | Estimated Time | Can Execute Mid-Sprint? |
|---------|-----------|----------|----------------|-------------------------|
| **Sprint Completion** | Every sprint end | 🔴 CRITICAL | 10-15 min | N/A (sprint end) |
| **Sprint Planning Complete** | Every sprint start | 🟡 HIGH | 5-10 min | N/A (sprint start) |
| **Ad-hoc Maintenance** | Anytime you want! | 🟢 FLEXIBLE | 2-20 min | ✅ **YES** - Use Scenario I |
| **Major Architecture Change** | As needed | 🟡 HIGH | 15-20 min | ✅ YES |
| **New Feature Release** | Every release | 🟡 HIGH | 10-15 min | ✅ YES |
| **Project Structure Change** | As needed | 🟢 MEDIUM | 10-15 min | ✅ YES |
| **Periodic Audit** | Monthly/Quarterly | 🟢 MEDIUM | 30-45 min | ✅ YES |
| **Documentation Drift Detected** | As discovered | 🟡 HIGH | 15-30 min | ✅ YES |
| **Daily/Weekly Maintenance** | Your preference | 🟢 OPTIONAL | 2-10 min | ✅ **YES** - Frequent updates recommended |

**💡 Recommendation for Frequent Maintenance:**
- Use **Scenario I (Ad-hoc Maintenance)** for any non-sprint-specific updates
- No need to wait for sprint milestones to keep docs current
- Small, frequent updates are better than large batch updates

---

## 📋 Core Documentation Sync Checklist (ALWAYS REQUIRED)

### ✅ Step 1: Update `project-context.md` (Single Source of Truth)

**File Location:** `{project-root}/project-context.md`  
**Priority:** 🔴 CRITICAL - This is the SSOT for all BMAD agents

**Check and Update:**
- [ ] **Header Section (Lines 8-15):**
  - [ ] `Status:` line reflects current sprint state
  - [ ] `Sprint N:` line added with completion status
  - [ ] `Last Updated:` date is current (YYYY-MM-DD)
  
- [ ] **Implemented Features Section:**
  - [ ] New sprint entry added with:
    - [ ] Sprint completion date and metrics
    - [ ] API endpoints added/modified
    - [ ] Database models added/modified
    - [ ] Key features delivered
    - [ ] Testing statistics
    - [ ] Branch name and version tag
  
- [ ] **Next Actions Section (Item 14/15):**
  - [ ] Current sprint marked as ✅ COMPLETE
  - [ ] Next sprint added as 🔜 or 🟡 (planning)
  - [ ] Epic options listed
  - [ ] Prerequisites identified
  
- [ ] **Project Phases Table:**
  - [ ] New sprint row added
  - [ ] "Current Status" summary updated
  
- [ ] **Technical Stack (if changed):**
  - [ ] New dependencies documented
  - [ ] Version upgrades noted
  - [ ] Breaking changes documented
  
- [ ] **Known Issues (if new):**
  - [ ] Technical debt items added
  - [ ] Security vulnerabilities updated

---

### ✅ Step 2: Sync README Files

#### A. `CODE/README.md` (GitHub Showcase - External Audience)

**File Location:** `{project-root}/README.md`  
**Purpose:** GitHub repository homepage, first impression for visitors

**Check and Update:**
- [ ] **Badges Section (Lines 3-12):**
  - [ ] Sprint badges added (e.g., `[![Sprint6](https://img.shields.io/badge/Sprint%206-Complete-brightgreen)]()`)
  - [ ] Version badge updated (e.g., `[![Version](https://img.shields.io/badge/Version-v0.X.0-blue)]()`)
  - [ ] Test count badge updated (e.g., `[![Tests](https://img.shields.io/badge/Tests-XXX%20Total-success)]()`)
  - [ ] Status badge reflects current state (Complete/Planning)

- [ ] **Project Overview Section (Lines 20-32):**
  - [ ] `Current Status:` line updated
  - [ ] Sprint 0-N completion lines accurate
  - [ ] Sprint N+1 status added (if planning complete)
  - [ ] `Version:` line matches latest tag
  - [ ] `Last Updated:` date current

- [ ] **Bottom Status Summary (Last 5 lines):**
  - [ ] `Status:` line updated
  - [ ] Sprint completion links added
  - [ ] `Next:` line reflects upcoming work

#### B. `gcredit-project/README.md` (Project Reference - Internal Audience)

**File Location:** `{project-root}/gcredit-project/README.md`  
**Purpose:** Local developer reference, quick start guide

**Check and Update:**
- [ ] **Project Status Section (Lines 6-16):**
  - [ ] `Current Sprint:` line updated
  - [ ] All sprint status lines accurate (Sprint 0-N)
  - [ ] `Version:` line matches latest tag
  - [ ] Sprint N+1 added (if planning complete)
  - [ ] `License:` line unchanged (MIT)

- [ ] **Documentation Links Section:**
  - [ ] New sprint directory link added
  - [ ] Sprint summary/retrospective links added

- [ ] **Sprint History Section (if exists):**
  - [ ] New sprint entry added with metrics
  - [ ] Deliverables summarized

- [ ] **Bottom Metadata:**
  - [ ] `Last Updated:` date current
  - [ ] `Version:` matches tag
  - [ ] `Sprint Status:` summary accurate

---

### ✅ Step 3: Update `backend/CHANGELOG.md` (If Code Changes)

**File Location:** `{project-root}/gcredit-project/backend/CHANGELOG.md`  
**Priority:** 🟡 HIGH (if sprint included backend changes)

**Check and Update:**
- [ ] **Version Header Added:**
  - [ ] `## [0.X.0] - YYYY-MM-DD` format
  - [ ] Sprint number and epic name in section title

- [ ] **Changes Categorized:**
  - [ ] `### Added` - New features
  - [ ] `### Changed` - Modifications to existing features
  - [ ] `### Fixed` - Bug fixes
  - [ ] `### Removed` - Deprecated features removed
  - [ ] `### Security` - Security fixes (if applicable)

- [ ] **Technical Details Included:**
  - [ ] API endpoints added/modified
  - [ ] Database migrations
  - [ ] Dependencies added/updated
  - [ ] Breaking changes highlighted

---

### ✅ Step 4: Verify Sprint Documentation Structure

**File Location:** `{project-root}/gcredit-project/docs/sprints/sprint-N/`  
**Priority:** 🟡 HIGH

**Check Structure:**
- [ ] **Sprint directory exists:** `docs/sprints/sprint-N/`
- [ ] **Required files present:**
  - [ ] `backlog.md` (sprint backlog)
  - [ ] `summary.md` or `sprint-N-completion-summary.md`
  - [ ] `retrospective.md`
- [ ] **Optional files (if created):**
  - [ ] `kickoff-readiness.md`
  - [ ] `ux-audit-report.md`
  - [ ] Technical specs (ADRs, design docs)

- [ ] **Sprint Index Updated:**
  - [ ] `docs/sprints/README.md` includes Sprint N entry

---

## 🔄 Scenario-Based Checklists (Execute as Needed)

### 📌 Scenario A: Sprint Completion (CRITICAL - Execute Every Sprint)

**Trigger:** Sprint review complete, all stories delivered, ready to tag

**Execute:**
1. ✅ All Core Documentation Sync steps (Steps 1-4 above)
2. ✅ Additional Sprint-Specific checks:
   - [ ] Create `docs/sprints/sprint-N/summary.md`
     - [ ] Sprint overview (dates, team, metrics)
     - [ ] Story completion list
     - [ ] Test statistics
     - [ ] Technical achievements
     - [ ] Challenges and solutions
   
   - [ ] Create `docs/sprints/sprint-N/retrospective.md`
     - [ ] What went well
     - [ ] What could be improved
     - [ ] Action items for next sprint
     - [ ] Lessons learned
   
   - [ ] Update `docs/lessons-learned/lessons-learned.md`
     - [ ] Add new lessons from retrospective
     - [ ] Update sprint coverage metadata
     - [ ] Update metrics table
   
   - [ ] Update `docs/setup/infrastructure-inventory.md` (if infrastructure changes)
     - [ ] New Azure resources added
     - [ ] New database tables documented
     - [ ] New npm dependencies listed
     - [ ] Environment variables added
   
   - [ ] Verify Git status:
     - [ ] All changes committed to sprint branch
     - [ ] Sprint branch pushed to remote
     - [ ] Ready for PR/merge
     - [ ] Git tag prepared (vX.X.X)

**Estimated Time:** 15-20 minutes  
**Agent Recommendation:** `bmad-master` (orchestration) → `tech-writer` (quality check)

---

### 📌 Scenario B: Sprint Planning Complete

**Trigger:** Sprint N+1 planning finished, backlog created, ready to kick off (but not started yet)

**Execute:**
1. ✅ Update `project-context.md`:
   - [ ] Add Sprint N+1 status line: "🟡 Planning Complete (Epic X, Xh estimated)"
   - [ ] Update "Next Actions" section:
     - [ ] Add item for Sprint N+1 planning complete
     - [ ] List planning artifacts created
     - [ ] Document scope decisions
     - [ ] List estimated effort
     - [ ] Note prerequisites/blockers

2. ✅ Update README files (optional, can wait for sprint completion):
   - [ ] Add Sprint N+1 status badge (yellow/planning)
   - [ ] Update "Current Sprint" line
   - [ ] Add "Next" line for upcoming kickoff

3. ✅ Verify Sprint N+1 documentation:
   - [ ] `docs/sprints/sprint-N+1/` directory exists
   - [ ] `backlog.md` created
   - [ ] `kickoff-readiness.md` created (if applicable)
   - [ ] UX/design specs created (if applicable)

**Estimated Time:** 5-10 minutes  
**Agent Recommendation:** `bmad-master`

---

### 📌 Scenario C: Architecture Decision (ADR Created)

**Trigger:** New ADR created in `docs/decisions/`

**Execute:**
1. ✅ Verify ADR follows template:
   - [ ] Numbered sequentially (ADR-XXX)
   - [ ] Status field present (Proposed/Accepted/Rejected)
   - [ ] All required sections filled
   - [ ] Related documents linked

2. ✅ Update `docs/decisions/README.md`:
   - [ ] Add ADR to index/table
   - [ ] Update status if superseded

3. ✅ Update `project-context.md` (if major decision):
   - [ ] Technical Stack section (if tech choice)
   - [ ] Architecture references

4. ✅ Update `docs/architecture/system-architecture.md`:
   - [ ] Reference new ADR in relevant sections
   - [ ] Update architecture diagrams if needed

**Estimated Time:** 10-15 minutes  
**Agent Recommendation:** `tech-writer` (Winston or Paige)

---

### 📌 Scenario D: Database Schema Change

**Trigger:** Prisma migration created, new models/columns added

**Execute:**
1. ✅ Update `docs/setup/infrastructure-inventory.md`:
   - [ ] Add new tables to "Database Schema" section
   - [ ] Document table purpose
   - [ ] List key columns
   - [ ] Note relationships
   - [ ] Update migration count

2. ✅ Update `project-context.md`:
   - [ ] Implemented Features section (note DB changes)
   - [ ] Technical Stack (if new ORM features used)

3. ✅ Update `backend/CHANGELOG.md`:
   - [ ] Document schema changes under "Changed" or "Added"
   - [ ] Note migration name

**Estimated Time:** 5-10 minutes  
**Agent Recommendation:** `bmad-master` or `tech-writer`

---

### 📌 Scenario E: New Azure Resource Created

**Trigger:** New Azure service provisioned (storage, database, app service, etc.)

**Execute:**
1. ✅ Update `docs/setup/infrastructure-inventory.md`:
   - [ ] Add resource to appropriate section
   - [ ] Document resource name, tier, region
   - [ ] List environment variables needed
   - [ ] Document access patterns
   - [ ] Update estimated monthly cost

2. ✅ Update `.env.example`:
   - [ ] Add new environment variables
   - [ ] Add comments explaining usage

3. ✅ Update setup guides (if needed):
   - [ ] Create new setup guide if complex
   - [ ] Update existing setup guides with new requirements

**Estimated Time:** 10-15 minutes  
**Agent Recommendation:** `bmad-master`

---

### 📌 Scenario F: New npm Dependency Added

**Trigger:** `npm install <package>` executed, `package.json` modified

**Execute:**
1. ✅ Update `docs/setup/infrastructure-inventory.md`:
   - [ ] Add to "NPM Dependencies" section
   - [ ] Document version
   - [ ] Explain purpose/usage
   - [ ] Note if version locked (and why)

2. ✅ Update sprint version manifest (if in active sprint):
   - [ ] Add to "Sprint N New Dependencies" section
   - [ ] Document rationale for version choice

3. ✅ Check for security vulnerabilities:
   - [ ] Run `npm audit`
   - [ ] Document any known issues
   - [ ] Add to Known Issues section if risk accepted

**Estimated Time:** 5 minutes  
**Agent Recommendation:** `bmad-master`

---

### 📌 Scenario G: Project Structure Change

**Trigger:** Directory moved/renamed, files reorganized

**Execute:**
1. ✅ Update `DOCUMENTATION-STRUCTURE.md`:
   - [ ] Reflect new directory structure
   - [ ] Update file location references
   - [ ] Update documentation categories

2. ✅ Find and fix broken links:
   - [ ] Search for old paths across all `.md` files
   - [ ] Update relative links
   - [ ] Verify all links work

3. ✅ Update `docs/INDEX.md`:
   - [ ] Update directory tree
   - [ ] Update file paths

4. ✅ Update README files:
   - [ ] Update "Project Structure" section
   - [ ] Update documentation links

**Estimated Time:** 15-30 minutes  
**Agent Recommendation:** `tech-writer` (Paige)

---

### 📌 Scenario H: Periodic Documentation Audit (Monthly/Quarterly)

**Trigger:** Scheduled audit (e.g., end of month, end of quarter)

**Execute:**
1. ✅ Comprehensive sync check:
   - [ ] Verify `project-context.md` matches reality
   - [ ] Check all README files in sync
   - [ ] Verify all sprint directories complete
   - [ ] Check for orphaned documents

2. ✅ Quality checks:
   - [ ] All "Last Updated" dates recent?
   - [ ] All links working?
   - [ ] All images/diagrams loading?
   - [ ] Consistent formatting?

3. ✅ Completeness checks:
   - [ ] All ADRs documented?
   - [ ] All sprints have retrospectives?
   - [ ] All lessons learned captured?
   - [ ] Infrastructure inventory complete?

4. ✅ Cleanup:
   - [ ] Archive deprecated documents
   - [ ] Delete duplicate/obsolete files
   - [ ] Consolidate similar documents
   - [ ] Update "archive" folder

**Estimated Time:** 30-45 minutes  
**Agent Recommendation:** `tech-writer` (Paige) with `bmad-master` oversight

---

### 📌 Scenario I: Ad-hoc Documentation Maintenance (Anytime)

**Trigger:** Anytime you feel documentation needs attention (no specific sprint phase required)

**Common Use Cases:**
- Mid-sprint: You notice docs are outdated
- After daily work: Want to keep docs current
- Before context switch: Clean up before moving to different work
- Random discovery: Found inconsistency or broken link
- Frequent maintenance: You prefer to update docs continuously rather than batch at sprint end
- Team review prep: Preparing for documentation review
- Onboarding prep: Ensuring docs are accurate for new team member

**Flexible Execution (Choose What You Need):**

#### Option 1: Quick Consistency Check (2-3 minutes)
**When:** Just want to verify nothing is severely out of sync

**Execute:**
- [ ] Run PowerShell validation commands (see Tools section below)
- [ ] Check sprint status consistency
- [ ] Verify "Last Updated" dates aren't too stale
- [ ] Quick visual scan of key files

**Command:**
```
Master, please do a quick documentation consistency check (validation only, no changes).
```

#### Option 2: Targeted Update (5-10 minutes)
**When:** You changed something specific and want to reflect it in docs

**Execute:**
- [ ] Identify what changed (code, architecture, infrastructure, etc.)
- [ ] Find matching scenario from Scenarios A-H
- [ ] Execute only relevant checklist items
- [ ] Update "Last Updated" dates for modified files

**Example:**
```
Master, I just added a new npm package "axios@1.6.0". 
Please update relevant documentation following Scenario F.
```

#### Option 3: Sync Core Documents (8-10 minutes)
**When:** Want to ensure SSOT and READMEs are accurate without full audit

**Execute:**
- [ ] Execute "Core Documentation Sync Checklist" (Steps 1-4)
- [ ] Skip scenario-specific checks
- [ ] Focus on project-context.md and READMEs
- [ ] Validate consistency

**Command:**
```
Master, please sync all core documentation files (project-context.md + READMEs).
Reference: Core Documentation Sync Checklist (Steps 1-4)
```

#### Option 4: Full Maintenance Pass (15-20 minutes)
**When:** Haven't updated docs in a while, want comprehensive update

**Execute:**
- [ ] Start with Core Documentation Sync (Steps 1-4)
- [ ] Review recent changes (git log, commits, PRs)
- [ ] Execute relevant scenario checklists for changes found
- [ ] Run validation commands
- [ ] Update all "Last Updated" dates

**Command:**
```
Master, please perform a full documentation maintenance pass.
Review recent changes and update all relevant documentation.
Reference: documentation-maintenance-checklist.md
```

#### Option 5: Fix Specific Issue (Variable time)
**When:** You or someone identified a specific doc problem

**Execute:**
- [ ] Understand the issue (broken link, outdated info, missing doc, etc.)
- [ ] Find relevant section in Core or Scenario checklists
- [ ] Fix the specific issue
- [ ] Validate fix doesn't break anything else
- [ ] Update related documents if needed

**Example:**
```
Master, the infrastructure-inventory.md is missing the new Redis cache we added.
Please update following Scenario E (New Azure Resource).
```

---

### 💡 Tips for Frequent Documentation Maintenance

**Best Practice #1: Little and Often**
- ✅ Update docs right after making changes (2-5 min each time)
- ✅ Prevents large documentation debt
- ✅ Context is fresh in your mind
- ❌ Avoid batching all updates to sprint end

**Best Practice #2: Use Git as a Trigger**
- Before committing code → Ask yourself: "What docs need updating?"
- After merging PR → Check if any docs affected
- After creating ADR → Update related architecture docs

**Best Practice #3: Set Personal Rhythm**
- Daily: Quick consistency check (2 min)
- Weekly: Sync core documents (10 min)
- Sprint end: Full maintenance (20 min) + Scenario A
- Monthly: Full audit (45 min) + Scenario H

**Best Practice #4: Leverage Agents**
```
# Daily quick check
Master, quick doc consistency check.

# After code change
Master, I changed the Badge API. What docs need updating?

# Weekly maintenance
Master, sync all core docs and check for issues.

# Before team meeting
Master, ensure all docs are current for tomorrow's review.
```

**Best Practice #5: Documentation as Code**
- Treat docs like code: version control, review, refactor
- Don't fear "over-maintaining" - current docs save time
- If you touch code, touch docs
- Documentation debt compounds like technical debt

---

**Estimated Time:** Flexible (2-20 minutes depending on option chosen)  
**Agent Recommendation:** `bmad-master` (any option) or `tech-writer` (Option 4-5 for quality focus)  
**Frequency:** As needed - no sprint phase restriction!

---

## 🛠️ Tools and Validation Commands

### Quick Validation Commands (PowerShell)

```powershell
# Check sprint status consistency across key files
Select-String -Path "README.md", "project-context.md", "gcredit-project/README.md" -Pattern "Sprint [0-9].*Complete"

# Find all "Last Updated" dates
Select-String -Path "*.md" -Pattern "Last Updated:" -Recurse

# Check for broken internal links (simple check)
Select-String -Path "*.md" -Pattern "\[.*\]\((?!http).*\)" -Recurse

# Find files not following naming convention
Get-ChildItem -Recurse -Filter "*.md" | Where-Object { $_.Name -match " " }

# Find orphaned docs (not in standard directories)
Get-ChildItem -Recurse -Filter "*.md" | Where-Object { $_.DirectoryName -notmatch "(docs|sprints|templates|decisions|architecture|planning)" }
```

### Validation Checklist

- [ ] **Consistency Check:**
  - [ ] All files mention same current sprint
  - [ ] All version numbers match (v0.X.0)
  - [ ] All "Last Updated" dates are recent

- [ ] **Completeness Check:**
  - [ ] All sprints have directory in `docs/sprints/`
  - [ ] All sprints have summary + retrospective
  - [ ] All ADRs numbered sequentially

- [ ] **Link Check:**
  - [ ] No broken internal links
  - [ ] All referenced files exist
  - [ ] All images/diagrams load

- [ ] **Structure Check:**
  - [ ] All docs follow `DOCUMENTATION-STRUCTURE.md`
  - [ ] No files in wrong directories
  - [ ] Naming conventions followed

---

## 🤖 How to Use with BMAD Agents

### With `bmad-master` (Orchestration)

**Command:**
```
Master, please execute documentation maintenance for [Scenario X].
Reference: docs/templates/documentation-maintenance-checklist.md
```

**Example:**
```
Master, please execute documentation maintenance for Sprint 5 completion.
Reference: docs/templates/documentation-maintenance-checklist.md
Scenario: A (Sprint Completion)
```

**What Master will do:**
1. Load this checklist
2. Execute relevant scenario checklist
3. Read current state from files
4. Update all required files
5. Validate consistency
6. Report changes made

---

### With `tech-writer` (Paige) (Quality Focus)

**Command:**
```
@tech-writer Please review and update project documentation following docs/templates/documentation-maintenance-checklist.md, Scenario [X].
```

**Example:**
```
@tech-writer Please review and update project documentation following docs/templates/documentation-maintenance-checklist.md, Scenario H (Periodic Audit).
```

**What Paige will do:**
1. Load checklist
2. Perform quality-focused review
3. Check for clarity and consistency
4. Update documentation with educational approach
5. Ensure documentation standards met
6. Suggest improvements

---

## 📊 Maintenance Log (Optional)

Track when documentation maintenance was last performed:

| Date | Scenario | Agent | Files Updated | Notes |
|------|----------|-------|---------------|-------|
| 2026-01-29 | Sprint 5 Completion | bmad-master | project-context.md, 2x README, CHANGELOG | Initial sync after template creation |
| YYYY-MM-DD | [Scenario] | [Agent] | [Files] | [Notes] |

---

## 📚 Related Documents

- [Sprint Completion Checklist Template](./sprint-completion-checklist-template.md)
- [Sprint Planning Checklist](./sprint-planning-checklist.md)
- [Documentation Structure Guide](../DOCUMENTATION-STRUCTURE.md)
- [Lessons Learned](../lessons-learned/lessons-learned.md)
- [Infrastructure Inventory](../setup/infrastructure-inventory.md)

---

**Template Version:** 1.1  
**Created:** 2026-01-29  
**Last Updated:** 2026-01-29 (Added Scenario I: Ad-hoc Maintenance for anytime usage)  
**Maintained By:** G-Credit Development Team  
**Recommended Agent:** `bmad-master` (orchestration) or `tech-writer` (quality review)  
**Key Feature:** ✅ **Can be used anytime** - not restricted to sprint phases!

---

## 🎯 Success Criteria

Documentation maintenance is successful when:
- ✅ All files pass validation commands
- ✅ Sprint status consistent across all files
- ✅ No broken links or missing files
- ✅ All "Last Updated" dates current
- ✅ Infrastructure inventory matches reality
- ✅ Lessons learned captured
- ✅ No orphaned or duplicate documents

---

**Remember:** This template evolves with the project. Update it when you discover new documentation scenarios or better practices!

**💡 Pro Tip:** For frequent documentation maintenance, use Scenario I with small, regular updates rather than batching everything to sprint end. Current docs = happy team! 🚀
