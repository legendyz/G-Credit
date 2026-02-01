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

### ✅ Step 0: Verify Current Sprint Status (MANDATORY - Execute FIRST)

**File Location:** `{project-root}/gcredit-project/docs/sprints/sprint-N/sprint-status.yaml`  
**Priority:** 🔴 CRITICAL - Must complete BEFORE updating any documentation  
**Purpose:** Prevent incomplete/inaccurate documentation by verifying actual sprint state

**⚠️ CRITICAL RULE:** **ALWAYS read the COMPLETE file** - partial reads lead to missing completed stories!

**Verification Steps:**
- [ ] **Load sprint-status.yaml COMPLETELY:**
  - [ ] Read ENTIRE file (not just first 80-100 lines)
  - [ ] Verify file loaded to end (check for "technical_debt" section at bottom)
  - [ ] If using read_file tool, ensure endLine covers full file length
  
- [ ] **Extract Sprint Metrics:**
  - [ ] `sprint_info.status` - Current sprint status (in-progress/complete)
  - [ ] `sprint_metrics.completed_stories` - Number of done stories
  - [ ] `sprint_metrics.total_stories` - Total story count
  - [ ] `sprint_metrics.completion_rate` - Percentage complete
  - [ ] `sprint_metrics.actual_hours` - Hours spent so far
  - [ ] `sprint_metrics.estimated_hours` - Total estimated hours
  - [ ] `sprint_metrics.total_tests` - Test count
  - [ ] `sprint_metrics.core_tests_passing` - Passing tests
  
- [ ] **Identify ALL Stories Marked "done":**
  - [ ] Review `development_status` section completely
  - [ ] List every story with `status: done` or `status: "done"`
  - [ ] Count matches `sprint_metrics.completed_stories` (sanity check)
  - [ ] If counts don't match → STOP and investigate discrepancy
  
- [ ] **Extract Each Completed Story's Details:**
  - [ ] For EACH story marked "done", record:
    - [ ] `story_points` - Complexity estimate
    - [ ] `estimated_hours` vs `actual_hours` - Accuracy tracking
    - [ ] `start_date` and `completion_date` - Timeline
    - [ ] `tests_added` and `tests_passing` - Quality metrics
    - [ ] `code_review_issues` and `code_review_fixes` - Code quality
    - [ ] `acceptance_criteria` - Business value delivered
    - [ ] `notes` - Key implementation details, decisions, fixes
    - [ ] `depends_on` and `blocks` - Dependency tracking
  
- [ ] **Verify Dependency Chain:**
  - [ ] Check if completed stories unblock pending stories
  - [ ] Identify next stories ready for development
  - [ ] Note any blocked stories and reasons

**Cross-Validation (Data Integrity Check):**
- [ ] **Test Count Alignment:**
  - [ ] Sum `tests_added` for all "done" stories
  - [ ] Should approximately match delta in `total_tests` vs previous sprint
  - [ ] If mismatch > 10% → investigate (overlapping tests, refactoring, etc.)
  
- [ ] **Hours Alignment:**
  - [ ] Sum `actual_hours` for all "done" stories
  - [ ] Should match `sprint_metrics.actual_hours`
  - [ ] If mismatch → STOP and fix sprint-status.yaml first
  
- [ ] **Completion Rate Calculation:**
  - [ ] Manual: `(completed_stories / total_stories) * 100`
  - [ ] Should match `sprint_metrics.completion_rate`
  - [ ] If mismatch → use sprint-status.yaml value, note discrepancy

**Common Mistakes to Avoid:**
- ❌ **Reading only first 80-100 lines** → Stories 2, 3, 4+ will be missed
- ❌ **Assuming user input is complete** → Always verify against YAML file
- ❌ **Using cached/stale data** → Read current file, not remembered state
- ❌ **Skipping cross-validation** → Metrics errors propagate to all docs
- ❌ **Partial story details** → Missing test counts, hours, or review fixes

**Output Checklist (before proceeding to Step 1):**
- [ ] **I have a complete list of ALL done stories** (not just the first one)
- [ ] **I have full details for EACH done story** (hours, tests, review fixes)
- [ ] **I have verified sprint metrics** (completion %, hours, tests)
- [ ] **I have cross-validated data integrity** (sums match, no discrepancies)
- [ ] **I am ready to update documentation with accurate, complete information**

**If ANY checkbox above is unchecked → STOP. Do NOT proceed to Step 1.**

**Example - What Good Verification Looks Like:**

```
✅ Sprint 7 Status Verified (from sprint-status.yaml):

Completed Stories (4/7 = 57%):
- Story 0.1: Git Branch (5min, prerequisite)
- Story 9.1: Badge Revocation API (5h, 47 tests, 4 review fixes)
- Story 9.2: Revoked Badge Verification (4.5h, 25 tests, 6 review fixes)
- Story 9.3: Employee Wallet Revoked Display (4.5h, 24 tests, 6 review fixes)

Sprint Metrics:
- Hours: 14h actual / 20-26h estimated (70% of low estimate)
- Tests: 278 total, 241 passing core (100% pass rate)
- Test Delta: +34 tests from Sprint 6 (47+25+24 = 96, overlaps = 62)
- Completion: 57% (4/7 stories)

Ready to proceed: ✅ All data verified, cross-validation complete
```

---

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

**⚠️ IMPORTANT:** README files have **multiple locations** that need updating. Use the detailed checklist below to avoid missing any section.

**📋 Detailed Reference:** See [README-update-checklist.md](./README-update-checklist.md) for comprehensive location-by-location guide.

#### A. `CODE/README.md` (GitHub Showcase - External Audience)

**File Location:** `{project-root}/README.md`  
**Purpose:** GitHub repository homepage, first impression for visitors

**⚡ Quick Checklist (6 Update Locations):**
- [ ] **Location 1: Badges Section** (Lines ~3-14) - Status, Sprint, Version, Tests badges
- [ ] **Location 2: Project Overview** (Lines ~20-40) - Current Status, Sprint lines, Version, Last Updated
- [ ] **Location 3: Recent Progress** (Lines ~270-290) - Sprint details, stories, metrics, Git tag
- [ ] **Location 4: Roadmap Table** (Lines ~475-495) - Sprint row status and duration
- [ ] **Location 5: Footer Last Updated** (Lines ~592-600) - Date, Status, Version
- [ ] **Location 6: Footer Sprint Status** (Lines ~601-609) - Sprint list, links, Next steps

**Detailed Instructions:**
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

- [ ] **Current Phase Section (Lines ~156-280):**
  - [ ] Latest sprint entry added with COMPLETE details
  - [ ] Include: completion date, metrics, deliverables, tests
  - [ ] Previous sprint entries remain accurate
  - [ ] Remove outdated "Planning" or "Awaiting" text
  - [ ] Add "In Progress" details for active sprint (if applicable)

- [ ] **Roadmap Section (Lines ~462-480):**
  - [ ] Phase 3 week number updated (e.g., Week 6 → Week 7)
  - [ ] All completed sprints marked "✅ Complete" with full metrics
  - [ ] Current sprint shows "🟡 In Progress" with completion %
  - [ ] Future sprints remain "⏳ Planned"
  - [ ] Sprint durations reflect actual time (not estimates)

- [ ] **Bottom Status Summary (Last ~15 lines):**
  - [ ] `Last Updated:` date is TODAY
  - [ ] `Status:` line reflects current + completed sprints
  - [ ] `Version:` matches latest tag
  - [ ] All sprint links added (Sprint 0-N)
  - [ ] `Next:` line shows immediate next action
  - [ ] Sprint completion links added

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

### ✅ Step 4: Update API Documentation (If New Endpoints Added)

**File Location:** `{project-root}/gcredit-project/backend/docs/API-GUIDE.md`  
**Priority:** 🔴 CRITICAL (if sprint added/modified API endpoints)  
**Trigger:** Sprint completed stories that added or modified API endpoints

**Check and Update:**
- [ ] **Top Metadata (Lines 1-6):**
  - [ ] `Version:` updated to match sprint version (e.g., 0.7.0)
  - [ ] `Last Updated:` changed to TODAY
  - [ ] Add sprint description in version (e.g., "Sprint 7 - Badge Revocation")

- [ ] **Table of Contents:**
  - [ ] New API chapters added (e.g., Badge Issuance, Badge Revocation)
  - [ ] Section links work correctly

- [ ] **New API Endpoints Documented:**
  - [ ] Endpoint path and HTTP method clearly stated
  - [ ] Authentication requirements specified
  - [ ] Authorization roles listed (ADMIN, ISSUER, EMPLOYEE, etc.)
  - [ ] Request body schema with field descriptions
  - [ ] Response schema with status codes
  - [ ] Error responses documented
  - [ ] cURL examples provided (both PowerShell and Bash)
  - [ ] Query parameters explained (if applicable)

- [ ] **Bottom Metadata:**
  - [ ] `Last Updated:` is TODAY
  - [ ] `API Version:` matches sprint version
  - [ ] `Coverage:` lists sprint range (e.g., "Sprint 0-7")
  - [ ] Links to detailed API docs (if exists)

**How to Identify New Endpoints:**
1. Check sprint-status.yaml `story_details` for completed stories
2. For each "done" story, check its story file for "API Endpoints" section
3. Look for POST/GET/PUT/DELETE endpoints in story acceptance criteria
4. Check CHANGELOG.md for "API endpoints added/modified" entries

**Common Mistakes to Avoid:**
- ❌ Forgetting to update version number and date
- ❌ Adding endpoint description but missing cURL examples
- ❌ Not updating Table of Contents when adding new chapters
- ❌ Copying old date/version from previous section
- ❌ Missing authorization rules (who can call this endpoint)

---

### ✅ Step 5: Verify Sprint Documentation Structure

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

---

## 📖 Lessons Learned (From Real Incidents)

### Incident #1: Partial sprint-status.yaml Read (2026-02-01)

**What Happened:**
- Documentation maintenance executed for Sprint 7
- Only Story 9.1 completion reported in docs
- Stories 9.2 and 9.3 completion missed entirely
- Completion rate incorrectly reported as 18% (should be 57%)
- Test count incorrectly reported as 270 (should be 278)

**Root Cause:**
- Agent read only first 80 lines of sprint-status.yaml (partial read)
- Stories 9.2 and 9.3 details located in lines 80-130 (missed)
- Assumed "user mentioned 9.1 complete" meant only 9.1 done
- documentation-maintenance-checklist.md lacked explicit Step 0 for status verification

**Impact:**
- Incomplete documentation published to Git
- 2 completed stories (9.2, 9.3) not credited
- 9 hours of work (4.5h + 4.5h) not documented
- 49 tests (25 + 24) not counted
- Stakeholder visibility: misleading 18% vs actual 57% progress

**Fix Applied:**
- Added Step 0: "Verify Current Sprint Status (MANDATORY)"
- Explicit requirement to read COMPLETE sprint-status.yaml file
- Cross-validation checklist (test counts, hours, completion rate)
- "Common Mistakes to Avoid" section with examples
- Corrective documentation update committed (commit 354a007)

**Prevention Measures:**
- ✅ Step 0 now MANDATORY before any documentation update
- ✅ "Read ENTIRE file" emphasized in bold/red priority
- ✅ Cross-validation checklist catches data integrity issues
- ✅ Example output provided showing what good verification looks like
- ✅ "If ANY checkbox unchecked → STOP" enforcement rule

**Lessons for Agents:**
1. **Never assume based on user input** → Always verify against source files
2. **Never read files partially** → Use appropriate endLine covering full content
3. **Always cross-validate metrics** → Sum story hours should match sprint total
4. **Always follow checklist steps in order** → Step 0 exists for a reason
5. **When in doubt, read more context** → Partial data leads to incomplete conclusions

**Key Takeaway:**  
> "Trust, but verify. User says Story X is done? Great! Now verify sprint-status.yaml to see if X+1, X+2 are also done. Complete data > assumptions."

---

### Incident #2: README Section Omissions (2026-02-01)

**What Happened:**
- Sprint 6 actual hours wrong: 30h in docs, 35h in sprint-status.yaml
- README.md "Current Phase" section stopped at Sprint 6 Planning (outdated)
- README.md "Roadmap" section showed Week 6 (actual: Week 7, Sprint 7 in progress)
- README.md "Last Updated" dated 2026-01-29 (3 days stale, should be 2026-02-01)

**Root Cause:**
- Step 2 checklist too vague: "Project Overview Section" lacks specific sections
- No explicit line number references for critical README sections
- No "Current Phase Section" checklist item (this section often updated)
- No "Roadmap Section" checklist item (week number + sprint status)
- No TODAY date enforcement for "Last Updated" field
- Instructions like "update Status line" too generic

**Impact:**
- Misleading project status for GitHub visitors (outdated by 3 days)
- Sprint 6 completion not visible (showed "Planning" instead of "Complete")
- Sprint 7 progress not documented (86% complete, 6/7 stories)
- Metrics inaccuracy (30h vs 35h) propagated across files
- Required full README audit and 3-section correction

**Fix Implemented:**
- Added **"Current Phase Section (Lines ~156-280)"** with detailed checklist:
  - Verify latest sprint has COMPLETE details
  - Remove "Planning" or "Awaiting" text
  - Add "In Progress" for active sprints
- Added **"Roadmap Section (Lines ~462-480)"** with detailed checklist:
  - Update Phase 3 week number
  - Mark completed sprints "✅ Complete" with metrics
  - Show current sprint "🟡 In Progress" with %
- Added **"Bottom Status Summary"** with specific checks:
  - "Last Updated" must be TODAY
  - "Status" reflects current + completed
  - All sprint links present
- Specific line number ranges provided for easy navigation

**Prevention - 5 Key Lessons:**
1. **Be specific with sections** - "Lines ~156-280: Current Phase" > vague "Project Overview"
2. **Check ALL critical sections** - Not just top status, also Roadmap + Last Updated
3. **Verify dates are current** - "Last Updated" MUST be TODAY when performing update
4. **Remove stale language** - Delete "Planning" when sprint completes, delete "Awaiting" when started
5. **Cross-check data sources** - If metrics differ, always trust sprint-status.yaml as source

**Double-check principle:**  
> After updating README, scan ENTIRE file for ANY occurrence of:
> - Old sprint numbers (e.g., "Sprint 6 Planning" when 6 is complete)
> - Stale dates (anything not TODAY in "Last Updated")
> - Outdated text ("Planning", "Awaiting", old week numbers)
> - Metric discrepancies (compare with sprint-status.yaml)

---

### Incident #3: API Documentation Not Updated (2026-02-01)

**What Happened:**
- API-GUIDE.md severely outdated: Last Updated 2026-01-26 (6 days old, Sprint 2 era)
- Version stuck at 0.2.0 (should be 0.7.0 after Sprint 7)
- Missing 5 sprints of API endpoints (Sprint 3-7):
  - ❌ Badge Issuance API (Sprint 3: POST /badges, POST /badges/bulk, POST /badges/:id/claim)
  - ❌ Badge Verification API (Sprint 5: GET /verify/:id, GET /badges/:id/assertion)
  - ❌ Badge Sharing API (Sprint 6: POST /badges/:id/share-email)
  - ❌ Badge Revocation API (Sprint 7: POST /badges/:id/revoke) ← Current sprint core feature!
- Total: ~15+ new endpoints undocumented

**Root Cause:**
- documentation-maintenance-checklist.md **completely lacked** API documentation step
- No Step 4: "Update API Documentation (If New Endpoints Added)"
- Checklist only had Steps 1-3: project-context.md, READMEs, CHANGELOG.md
- No trigger to check if sprint added API endpoints
- No guidance on how to identify new endpoints from sprint files

**Impact:**
- Developers cannot reference latest API endpoints (manual code inspection required)
- External integrators see incomplete/outdated API (v0.2.0 vs actual v0.7.0)
- 5 sprints of API changes invisible to users
- Core Sprint 7 feature (Badge Revocation) completely undocumented in API-GUIDE.md
- Required emergency documentation update during sprint

**Fix Implemented:**
- Added **Step 4: Update API Documentation** to checklist with:
  - 🔴 CRITICAL priority when sprint adds endpoints
  - Clear trigger: "Sprint completed stories that added/modified API endpoints"
  - Detailed checklist: Version, TOC, Endpoint details, cURL examples, Bottom metadata
  - "How to Identify New Endpoints" guide (4 detection methods)
  - "Common Mistakes to Avoid" (5 pitfalls)
  - Line number references for easy navigation
- Updated API-GUIDE.md to v0.7.0 with 3 new chapters (Badge Issuance, Revocation, Verification)
- Added 300+ lines of API documentation covering Sprint 3-7

**Prevention - 5 Key Lessons:**
1. **Check for API changes in every sprint** - Review story files for "API Endpoints" sections
2. **API docs are as critical as README** - Not optional, same priority as project-context.md
3. **Version numbers must match sprints** - API-GUIDE.md version = current sprint version
4. **Date must be TODAY when updating** - Stale dates = stale docs
5. **Add examples, not just schemas** - cURL examples make API docs actually usable

**Detection Strategy (for agents):**
```
After Step 0 verification, before updating project-context.md:
1. For each "done" story, check story file for keywords:
   - "POST /api/", "GET /api/", "PUT /api/", "DELETE /api/"
   - "API Endpoint", "Request Body", "Response"
2. If ANY match found → Set flag: api_endpoints_added = true
3. If flag is true → Step 4 becomes MANDATORY (not optional)
4. Extract endpoint details from story files
5. Update API-GUIDE.md with new endpoints
```

**Key Takeaway:**  
> "API documentation is as critical as README updates. Every sprint that adds endpoints MUST update API-GUIDE.md. No exceptions. Check story files for 'API Endpoints' sections."

---

## 🚨 Red Flags - Stop and Fix Immediately

**Documentation Update is SUCCESSFUL when:**
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

---

## 🎯 Success Criteria for Documentation Maintenance

**Step 0 Verification is SUCCESSFUL when:**
1. ✅ sprint-status.yaml read COMPLETELY (not partially)
2. ✅ ALL completed stories identified and listed
3. ✅ Sprint metrics extracted and verified
4. ✅ Cross-validation passed (hours sum, test sum, completion rate)

**Documentation Update is SUCCESSFUL when:**
- ✅ **Accuracy:** ALL completed stories documented (not just some)
- ✅ **Completeness:** All 4 core files updated (project-context.md, 2 READMEs, CHANGELOG.md)
- ✅ **Consistency:** Same sprint number, version, dates, completion rate across all files
- ✅ **Verifiability:** Anyone can reproduce your numbers from sprint-status.yaml
- ✅ All files pass validation commands
- ✅ Sprint status consistent across all files
- ✅ No broken links or missing files
- ✅ All "Last Updated" dates current
- ✅ Infrastructure inventory matches reality
- ✅ Lessons learned captured
- ✅ No orphaned or duplicate documents

**Red Flags (Indicates Incomplete/Inaccurate Update):**
- ❌ You mentioned only 1-2 stories but sprint has 4+ done
- ❌ Completion rate suspiciously low (<30%) despite multiple stories done
- ❌ Test count didn't increase despite new stories
- ❌ Hours much lower than expected
- ❌ You can't explain where metrics came from

**If you see a red flag → Go back to Step 0 and re-verify sprint-status.yaml**

---

**Remember:** This template evolves with the project. Update it when you discover new documentation scenarios or better practices!

**💡 Pro Tip:** For frequent documentation maintenance, use Scenario I with small, regular updates rather than batching everything to sprint end. Current docs = happy team! 🚀
