# Story 10.8: UAT Bug Fixes

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 8h (buffer)  
**Sprint:** Sprint 10  
**Type:** Bug Fix Buffer  
**Dependencies:** Story 10.7 (UAT Execution)

---

## Story

As a **developer**,  
I want **all P0/P1 bugs discovered during UAT fixed before v1.0.0**,  
So that **the release is production-ready with no critical defects**.

## Background

This story is a buffer allocation for bugs discovered during full UAT (Story 10.7). Sprint 7 UAT found 0 P0/P1 bugs (thanks to pre-UAT reviews), but a full 10-Epic UAT may uncover issues.

## Acceptance Criteria

1. [ ] All P0 bugs fixed (UAT blocker)
2. [ ] All P1 bugs fixed or have documented workaround
3. [ ] P2 bugs logged as tech debt for future sprints
4. [ ] Regression tests added for each fixed bug
5. [ ] Re-run affected UAT test cases → all pass
6. [ ] All 1087+ tests still pass

## Tasks / Subtasks

_Tasks will be populated after Story 10.7 UAT execution._

### Pre-UAT Known Bugs

- [ ] **BUG-001: Navbar "My Wallet" 标签指向 Dashboard** (P1 — 1h)
  - Navbar.tsx 第一个链接 `to="/"` 标签为 "My Wallet"，实际 `/` 是 Dashboard
  - 无导航链接指向 `/wallet`（真正的钱包页），导致 Wallet 页导航无高亮
  - 同时影响 MobileNav.tsx（`to: '/'` 标签也是 "My Wallet"）
  - **修复方案：** 将 `to="/"` 标签改为 "Dashboard"，新增 `to="/wallet"` 标签 "My Wallet"
  - 发现于：Story 10.6d 验收截屏审查 (2026-02-09)

### UAT-Discovered Bugs

- [ ] **Task 1: Bug Triage** (AC: #1, #2, #3)
  - [ ] Classify discovered bugs by severity (P0/P1/P2)
  - [ ] Assign fix priority

- [ ] **Task 2: Fix P0 Bugs** (AC: #1)
  - [ ] _To be determined_

- [ ] **Task 3: Fix P1 Bugs** (AC: #2)
  - [ ] _To be determined_

- [ ] **Task 4: Add Regression Tests** (AC: #4)
  - [ ] Write test for each fixed bug

- [ ] **Task 5: Re-run UAT** (AC: #5, #6)
  - [ ] Re-execute failed UAT test cases
  - [ ] Verify full test suite

## Dev Notes

### Historical Context
- Sprint 7 UAT: 15/15 passed, 0 bugs — Pre-UAT reviews were key
- Sprint 8 Code Review: 30 issues found and fixed (100%)
- If Sprint 10 discovers significant bugs, consider deferring v1.0.0

### Buffer Allocation
- 8h allocated as buffer
- If unused, time returns to Sprint capacity
- If exceeded, escalate to PO for scope decision

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
