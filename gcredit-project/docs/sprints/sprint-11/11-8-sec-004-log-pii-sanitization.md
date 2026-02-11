# Story 11.8: SEC-004 — Log PII Sanitization (14+ Cleartext Emails)

**Status:** backlog  
**Priority:** 🟡 LOW  
**Estimate:** 2h  
**Source:** Security Audit LOW  

## Story

As a compliance officer,  
I want all PII (emails, names) sanitized in application logs,  
So that logs don't contain cleartext personal data (GDPR compliance).

## Acceptance Criteria

1. [ ] Log sanitization utility created: `maskPiiForLog(value: string): string`
2. [ ] All 14+ log statements with cleartext emails use sanitized versions
3. [ ] Error stack traces don't leak PII
4. [ ] Log output still contains enough context to debug issues (masked, not removed)
5. [ ] Unit tests for sanitization utility
6. [ ] All existing tests pass

## Tasks / Subtasks

- [ ] **Task 1: Create PII sanitization utility** (AC: #1)
  - [ ] Create `backend/src/common/utils/log-sanitizer.util.ts`
  - [ ] `maskEmail(email: string): string` → `j***@company.com`
  - [ ] `maskName(name: string): string` → `J*** Z***`
  - [ ] `sanitizeLogMessage(message: string): string` → auto-detect and mask emails in string

- [ ] **Task 2: Find and replace PII in logs** (AC: #2, #3, #4)
  - [ ] Search all `this.logger.log/warn/error` calls containing email, name, or user data
  - [ ] Replace cleartext with masked versions:
    ```typescript
    // Before:
    this.logger.warn(`Failed login attempt for ${email}`);
    // After:
    this.logger.warn(`Failed login attempt for ${maskEmail(email)}`);
    ```
  - [ ] Key areas: auth.service.ts, badge-issuance, email services, m365-sync

- [ ] **Task 3: Tests** (AC: #5, #6)
  - [ ] Unit test: `maskEmail('john@example.com')` → `j***@example.com`
  - [ ] Unit test: `maskEmail('a@b.com')` → `a***@b.com` (short email)
  - [ ] Unit test: `sanitizeLogMessage('User john@test.com failed')` → masked
  - [ ] Run full test suite

## Dev Notes

### Source Tree Components
- **New file:** `backend/src/common/utils/log-sanitizer.util.ts`
- **Files to update:** auth.service.ts, badge-issuance services, email services, m365-sync

### Important
- This story should be completed BEFORE Story 11.13 (CQ-004 Logger Integration) so that new Logger instances use sanitized output

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
