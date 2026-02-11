# Story 11.13: CQ-004 — NestJS Logger Integration (22 Services/Controllers)

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 2-3h  
**Source:** Code Quality Audit  

## Story

As a DevOps engineer,  
I want all services and controllers using NestJS's built-in Logger instead of console.log,  
So that logs are structured, leveled, and production-ready.

## Acceptance Criteria

1. [ ] All services/controllers have `private readonly logger = new Logger(ClassName.name)`
2. [ ] All `console.log/error/warn` replaced with `this.logger.log/error/warn`
3. [ ] Log format consistent with context labels
4. [ ] Log levels appropriate (debug/log/warn/error)
5. [ ] Log messages use PII sanitization from Story 11.8 where applicable
6. [ ] No functional regressions

## Tasks / Subtasks

- [ ] **Task 1: Audit current Logger adoption** (AC: #1)
  - [ ] From research: 30+ modules already use NestJS Logger
  - [ ] Only 3 console occurrences found (2 in spec files, 1 in string literal)
  - [ ] Identify any remaining modules WITHOUT Logger:
    - Grep for files in `src/` with exports but no `new Logger`
    - Check controllers, services, and middleware

- [ ] **Task 2: Add Logger to missing modules** (AC: #1, #2)
  - [ ] For each module missing Logger:
    ```typescript
    import { Logger } from '@nestjs/common';
    private readonly logger = new Logger(ClassName.name);
    ```
  - [ ] Replace any remaining `console.log/error/warn`

- [ ] **Task 3: Standardize log format** (AC: #3, #4)
  - [ ] Ensure consistent patterns:
    - `this.logger.log('Operation completed', { context })` — info
    - `this.logger.warn('Unusual condition', { context })` — warning
    - `this.logger.error('Failed operation', error.stack, { context })` — error
  - [ ] Use PII sanitization for emails/names in log messages

- [ ] **Task 4: Verify** (AC: #6)
  - [ ] Run `npm test`
  - [ ] Run `tsc --noEmit`
  - [ ] `grep -r "console\." src/ --include="*.ts" | grep -v spec | grep -v test`  — should be 0

## Dev Notes

### Source Tree Components
- **Already adopted (30+):** AuthService, AnalyticsService, DashboardService, M365SyncService, BadgeIssuanceService, MilestonesService, GraphEmailService, BadgeNotificationService, GraphTeamsService, etc.
- **Possibly missing:** Check with grep for files without Logger

### Important Dependency
- Story 11.8 (PII Sanitization) should be done FIRST so Logger uses sanitized output

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
