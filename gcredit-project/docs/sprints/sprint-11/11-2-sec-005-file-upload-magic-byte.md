# Story 11.2: SEC-005 — File Upload Magic-Byte Validation

**Status:** backlog  
**Priority:** 🔴 CRITICAL  
**Estimate:** 2-3h  
**Source:** Security Audit  

## Story

As a security engineer,  
I want uploaded files validated by magic bytes (file header signatures),  
So that MIME-type spoofing attacks are blocked.

## Acceptance Criteria

1. [ ] All file uploads validate magic bytes against expected file type
2. [ ] JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (52 49 46 46), GIF (47 49 46 38) signatures validated
3. [ ] PDF (25 50 44 46), DOCX (50 4B 03 04) signatures validated for evidence uploads
4. [ ] Files with mismatched extension/MIME vs magic bytes are rejected with 400 error
5. [ ] Existing file upload functionality unchanged for valid files
6. [ ] Unit tests for each file type + spoofed file rejection scenarios
7. [ ] All existing tests pass (0 regressions)

## Tasks / Subtasks

- [ ] **Task 1: Magic-byte validator utility** (AC: #1, #2, #3)
  - [ ] Create `backend/src/common/utils/file-validation.util.ts`
  - [ ] Implement `validateFileMagicBytes(buffer: Buffer, expectedMime: string): boolean`
  - [ ] Define magic byte signatures map:
    ```typescript
    const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
      'image/jpeg': [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
      'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47] }],
      'image/webp': [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }],
      'image/gif': [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
      'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
        [{ offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] }],
    };
    ```

- [ ] **Task 2: Integrate into Evidence upload** (AC: #4, #5)
  - [ ] In `evidence.service.ts` `uploadEvidence()` (L62-69):
    - After MIME type check, add `validateFileMagicBytes(file.buffer, file.mimetype)`
    - Reject with `BadRequestException('File content does not match declared type')`
  - [ ] Allowed types: PDF, PNG, JPEG, DOCX (already defined L18-25)

- [ ] **Task 3: Integrate into Badge Template image upload** (AC: #4, #5)
  - [ ] In `badge-templates.controller.ts` FileInterceptor `fileFilter` (L140-148):
    - Add magic-byte validation after MIME regex check
    - Reject with callback error if mismatch
  - [ ] Allowed types: JPEG, PNG, GIF, WebP

- [ ] **Task 4: Unit tests** (AC: #6)
  - [ ] Create `file-validation.util.spec.ts`
  - [ ] Test valid JPEG file → passes
  - [ ] Test valid PNG file → passes
  - [ ] Test valid PDF file → passes
  - [ ] Test .jpg file with PNG magic bytes → rejected
  - [ ] Test .exe file renamed to .jpg → rejected
  - [ ] Test empty file → rejected
  - [ ] Test file too small for magic byte check → rejected

- [ ] **Task 5: Verification** (AC: #7)
  - [ ] Run full test suite
  - [ ] Run `tsc --noEmit`

## Dev Notes

### Source Tree Components
- **Evidence upload:** `backend/src/evidence/evidence.service.ts` (L18-25 MIME types, L62-69 validation)
- **Badge image upload:** `backend/src/badge-templates/badge-templates.controller.ts` (L140-148 FileInterceptor)
- **New file:** `backend/src/common/utils/file-validation.util.ts`

### Architecture Patterns
- Shared utility in `src/common/utils/` (Pattern 3: common directory for shared infrastructure)
- Both upload endpoints call the same validation utility

### Testing Standards
- Use real file buffers (small test fixtures) for positive tests
- Use crafted byte arrays for negative tests (spoofed files)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
