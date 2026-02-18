# Story 11.9: SEC-006 — Global HTML Sanitization Pipe

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 2-3h  
**Source:** Security Audit MEDIUM  

## Story

As a security engineer,  
I want all user-submitted text fields globally sanitized for HTML/script injection,  
So that stored XSS attacks are prevented at the input layer.

## Acceptance Criteria

1. [ ] HTML sanitization library installed (`sanitize-html` or `isomorphic-dompurify`)
2. [ ] NestJS global pipe strips dangerous HTML from all string DTO fields
3. [ ] Legitimate text content preserved (no over-sanitization)
4. [ ] XSS payloads like `<script>alert('xss')</script>` are stripped
5. [ ] HTML entities in regular text preserved (e.g., `&` stays as `&`)
6. [ ] Unit tests for sanitization pipe
7. [ ] E2E test confirming sanitized output stored in DB
8. [ ] All existing tests pass

## Tasks / Subtasks

- [ ] **Task 1: Install sanitization library** (AC: #1)
  - [ ] `cd backend && npm install sanitize-html`
  - [ ] `npm install -D @types/sanitize-html`
  - [ ] Pin exact version in package.json

- [ ] **Task 2: Create sanitization pipe** (AC: #2, #3, #4, #5)
  - [ ] Create `backend/src/common/pipes/sanitize-html.pipe.ts`
  - [ ] Implement as NestJS `PipeTransform`:
    ```typescript
    @Injectable()
    export class SanitizeHtmlPipe implements PipeTransform {
      transform(value: any) {
        if (typeof value === 'string') {
          return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
        }
        if (typeof value === 'object' && value !== null) {
          return this.sanitizeObject(value);
        }
        return value;
      }
      private sanitizeObject(obj: Record<string, any>): Record<string, any> {
        // Recursively sanitize string properties
      }
    }
    ```
  - [ ] Register as global pipe in `main.ts`: `app.useGlobalPipes(new SanitizeHtmlPipe())`
  - [ ] Place BEFORE `ValidationPipe` in pipe order

- [ ] **Task 3: Configure allowed content** (AC: #3, #5)
  - [ ] Strip all HTML tags by default (`allowedTags: []`)
  - [ ] If any fields need rich text in future, create field-level override decorator

- [ ] **Task 4: Tests** (AC: #6, #7, #8)
  - [ ] Unit test: `<script>alert('xss')</script>` → empty string
  - [ ] Unit test: `<img src=x onerror=alert(1)>` → empty string
  - [ ] Unit test: `Hello <b>World</b>` → `Hello World`
  - [ ] Unit test: `Tom & Jerry` → `Tom & Jerry` (preserved)
  - [ ] Unit test: nested object with string fields → all sanitized
  - [ ] E2E test: create badge template with XSS payload → stored without tags
  - [ ] Run full test suite

## Dev Notes

### Source Tree Components
- **New file:** `backend/src/common/pipes/sanitize-html.pipe.ts`
- **main.ts:** Register global pipe (L~200 area, near ValidationPipe)
- **New dependency:** `sanitize-html` (backend only)

### Architecture Patterns
- Global pipe approach = defense-in-depth (every input sanitized)
- Combined with existing class-validator DTO validation
- Consider: some fields like `assertionJson` contain valid JSON — don't break serialized content

### Risk
- Over-sanitization could break JSON fields or URLs — test with existing API calls
- Badge template `criteria` field may contain markdown-like content — verify

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
