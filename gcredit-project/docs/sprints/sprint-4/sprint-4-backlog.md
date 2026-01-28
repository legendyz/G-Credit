# Sprint 4 Backlog - Epic 5: Employee Badge Wallet

**Sprint Number:** Sprint 4  
**Sprint Goal:** Deliver employee-facing Badge Wallet with Timeline View, admin-configurable milestones, evidence file management, and similar badge recommendations  
**Duration:** 2026-01-29 → 2026-02-12 (11 working days, ~85 hours capacity)  
**Team Capacity:** 1 developer × 11 days × 8 hours = 88 hours (85h after 3h buffer)  
**Sprint Lead:** LegendZhu

---

## 📋 Sprint Goal

Build the **complete Employee Badge Wallet experience** featuring an innovative Timeline View (replacing traditional grid), admin-configurable milestone celebrations, evidence file display with Azure Blob integration, similar badge recommendations, and comprehensive empty state handling.

**Success Criteria:**
- [ ] Timeline View displays badges chronologically with date navigation
- [ ] Admin can configure milestones (badge count, skill tracks, anniversaries)
- [ ] Evidence files uploaded during issuance are displayed with download/preview
- [ ] Similar badges recommended based on skills/category/issuer
- [ ] 4 empty state scenarios handled gracefully
- [ ] Badge Detail Modal shows all information including evidence and similar badges
- [ ] Inline report form submits to g-credit@outlook.com
- [ ] 65+ tests pass (30 unit + 20 integration + 15 E2E)
- [ ] Mobile responsive design validated
- [ ] WCAG 2.1 AA accessibility compliance verified

---

## 🎯 Pre-Sprint Readiness Check ✅

### ✅ Infrastructure Resources Review (Per Sprint Planning Checklist)

**Existing Azure Resources (Sprint 0-3):** ✅ **NO NEW RESOURCES NEEDED**
- **Azure Storage Account:** `gcreditdevstoragelz` ✅ **EXISTS** (created Sprint 0)
  - Container `badges`: ✅ Public blob access (for badge images)
  - Container `evidence`: ✅ Private (for evidence files) - **READY FOR USE**
- **Azure PostgreSQL:** `gcredit-dev-db-lz` ✅ **EXISTS** (created Sprint 0)
  - Connection verified, current migrations applied
- **Azure Communication Services:** ✅ **EXISTS** (configured Sprint 3)
  - Email service active (g-credit@outlook.com configured)

**Existing Database Tables (Sprint 1-3):** ✅ **3 NEW TABLES REQUIRED**
- ✅ `users` table - EXISTS (Sprint 1)
- ✅ `badges` table - EXISTS (Sprint 3)
- ✅ `badge_templates` table - EXISTS (Sprint 2)
- ❌ `milestone_configs` table - **NEW** (Story 4.2)
- ❌ `milestone_achievements` table - **NEW** (Story 4.2)
- ❌ `evidence_files` table - **NEW** (Story 4.3)

**Existing NPM Dependencies:** ✅ **NO NEW PACKAGES NEEDED**
- `@azure/storage-blob@^12.30.0` ✅ **INSTALLED** (Sprint 2)
- `@azure/communication-email@^1.1.1` ✅ **INSTALLED** (Sprint 3)
- `@nestjs/*` packages ✅ ALL INSTALLED
- `prisma@6.19.2` ✅ **VERSION LOCKED** (Sprint 0)
- Frontend: React 19.2.3, Tailwind CSS 4.1.18 ✅ ALL READY

**Environment Variables:** ✅ **ALL CONFIGURED**
```env
# Azure Storage (Sprint 0) - ✅ VERIFIED
AZURE_STORAGE_CONNECTION_STRING=*** (exists)
AZURE_STORAGE_CONTAINER_BADGES=badges (exists)
AZURE_STORAGE_CONTAINER_EVIDENCE=evidence (exists)

# Database (Sprint 0) - ✅ VERIFIED  
DATABASE_URL=*** (exists)

# Email (Sprint 3) - ✅ VERIFIED
AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING=*** (exists)
AZURE_COMMUNICATION_SERVICES_SENDER_ADDRESS=g-credit@outlook.com (exists)
```

**Key Takeaway from Sprint 2 Lesson:**  
> ✅ **NO DUPLICATE RESOURCE CREATION** - All infrastructure resources already exist from Sprint 0-3. Sprint 4 only requires database schema extensions (3 new tables) and service logic. This saves ~2-3 hours of setup time compared to planning estimates.

---

### ✅ Lessons Learned Review (From lessons-learned.md)

**Applied to Sprint 4:**
1. **Lesson 1 (Version Locking):** ✅ All packages version-locked in package.json
2. **Lesson 2 (Local Binaries):** ✅ Use `node_modules\.bin\prisma` for migrations
3. **Lesson 4 (Real-time Documentation):** ✅ Update docs as we develop
4. **Lesson 10 (Resource Inventory Check):** ✅ Verified all Azure resources exist (no duplication)
5. **Lesson 11 (Documentation Organization):** ✅ Sprint 4 docs in `gcredit-project/docs/sprints/sprint-4/`
6. **Lesson 14 (Email Service Pattern):** ✅ Reuse Azure Communication Services setup from Sprint 3
7. **Lesson 15 (SSOT Enforcement):** ✅ Reference `infrastructure-inventory.md` throughout backlog
8. **Lesson 17 (Test Organization):** ✅ Organize tests by feature domain

---

### ✅ Technical Dependencies Check

**Frontend Dependencies:**
- [ ] React Router v6 (for Timeline View navigation) - **TO BE ADDED** (Story 4.1)
- [ ] TanStack Query v5 (for data fetching) - **TO BE ADDED** (Story 4.1)
- [ ] react-window (virtual scrolling) - **DEFERRED** to performance sprint

**Backend Dependencies:**
- [x] Prisma Client (badge wallet queries) - ✅ READY
- [x] Azure Blob Storage SDK (evidence files) - ✅ READY
- [x] JWT Auth Guards (employee role protection) - ✅ READY (Sprint 1)

**External Dependencies:**
- [x] Azure PostgreSQL connection - ✅ VERIFIED
- [x] Azure Blob Storage access - ✅ VERIFIED
- [x] Email service (for report submissions) - ✅ VERIFIED (Sprint 3)

---

## 📝 User Stories

### Epic 5: Employee Badge Wallet & Claiming

---

### Story 4.1: Badge Wallet Timeline View - Frontend & API

**Priority:** **P0** (Critical - Core wallet experience)  
**Story Points:** 13  
**Estimate:** 12 hours  
**Assigned To:** LegendZhu  
**Dependencies:** None (can start immediately)

**User Story:**  
As an **Employee**, I want **to view my badges in a chronological timeline** so that **I can see my learning journey as a narrative story with context about when I earned each credential**.

**Acceptance Criteria:**

**Frontend (Timeline View):**
- [ ] AC 1.1: Timeline View displays vertical timeline line (2px, Neutral-200) with chronological badges
- [ ] AC 1.2: Each badge has timeline dot (16px circle, color-coded: green=claimed, yellow=pending, gray=revoked)
- [ ] AC 1.3: Date grouping headers show "Month Year" (e.g., "January 2026") with separator line
- [ ] AC 1.4: Badge Timeline Cards show:
  - Badge image (128x128px)
  - Title, issuer name
  - Status badge (✅ Claimed, 🟡 Pending, 🔒 Revoked)
  - Privacy indicator (🌐 Public, 🔒 Internal)
  - Action icons (👁️ View, ⬇️ Download)
- [ ] AC 1.5: View Toggle allows switching between Timeline and Grid views
- [ ] AC 1.6: Date Navigation Sidebar (240px) shows:
  - Year sections with month list
  - Badge count per month (e.g., "• January (5)")
  - Click month → smooth scroll to that section
  - Active month highlighted with Primary-600 background
- [ ] AC 1.7: Empty months shown in gray text, not clickable
- [ ] AC 1.8: Skeleton loading states while fetching badges
- [ ] AC 1.9: Responsive mobile: Sidebar collapsible, single-column cards

**Backend (Wallet API):**
- [ ] AC 1.10: Implement `GET /api/badges/wallet` endpoint
  - Query params: `page`, `limit`, `status`, `sort`
  - Response includes: badges array, pagination meta, dateGroups array
- [ ] AC 1.11: dateGroups format:
  ```json
  [
    { "label": "January 2026", "count": 12, "startIndex": 0 },
    { "label": "December 2025", "count": 15, "startIndex": 12 }
  ]
  ```
- [ ] AC 1.12: Pagination: Default 50 badges/page (sufficient for MVP, virtual scroll deferred)
- [ ] AC 1.13: Filter by status: ALL, CLAIMED, PENDING, REVOKED
- [ ] AC 1.14: Sort by issuedAt DESC (newest first)
- [ ] AC 1.15: Only return badges for authenticated user (JWT guard)
- [ ] AC 1.16: Include template info (name, imageUrl, issuer) via join

**Performance:**
- [ ] AC 1.17: Wallet query <150ms for 50 badges (with existing indexes)
- [ ] AC 1.18: Use existing `idx_badges_timeline` index: `(recipientId, status, issuedAt DESC)`

**Technical Notes:**
- **Frontend Stack:** React 19.2.3 + Tailwind CSS 4.1.18 + Shadcn/ui
- **State Management:** TanStack Query v5 for server state
- **Router:** React Router v6 for navigation
- **Components to Create:**
  - `TimelineView.tsx` - Main timeline container
  - `TimelineLine.tsx` - Vertical line with dots
  - `BadgeTimelineCard.tsx` - Horizontal badge card
  - `DateNavigationSidebar.tsx` - Mini-calendar navigation
  - `DateGroupHeader.tsx` - Month/year headers
  - `ViewToggle.tsx` - Timeline/Grid switch
- **Backend Files:**
  - `src/badges/badges.controller.ts` - Add `getWallet()` method
  - `src/badges/badges.service.ts` - Add `getWalletBadges()` query
  - `src/badges/dto/wallet-query.dto.ts` - Query params DTO

**Dependencies:**
- [ ] React Router v6 installation required
- [ ] TanStack Query v5 installation required
- [ ] No Azure resource creation needed ✅

**Definition of Done:**
- [ ] Code written and peer-reviewed
- [ ] 10 unit tests written (frontend + backend)
  - Timeline date grouping logic
  - Wallet query filtering
  - Pagination calculations
- [ ] 5 E2E tests written
  - Load wallet with 50+ badges
  - Switch between Timeline and Grid views
  - Date navigation sidebar click → scroll
  - Filter by status
  - Mobile responsive layout
- [ ] UX specs from `ux-badge-wallet-timeline-view.md` followed exactly
- [ ] Accessibility: WCAG 2.1 AA (keyboard navigation, ARIA labels)
- [ ] Performance: <1.5s page load verified
- [ ] Documentation: Component README with props
- [ ] Deployed to dev environment

---

### Story 4.2: Admin-Configurable Milestones System

**Priority:** **P1** (High - Enhances user engagement)  
**Story Points:** 8  
**Estimate:** 8 hours  
**Assigned To:** LegendZhu  
**Dependencies:** Story 4.1 (Timeline View must exist to display milestones)

**User Story:**  
As an **Administrator**, I want **to configure milestone triggers** (badge counts, skill track completion, anniversaries) so that **employees receive celebrations at meaningful achievement points**.

**Acceptance Criteria:**

**Database Schema:**
- [ ] AC 2.1: Create `milestone_configs` table with columns:
  - `id` (UUID primary key)
  - `type` (enum: BADGE_COUNT, SKILL_TRACK, ANNIVERSARY, CUSTOM)
  - `title` (string, e.g., "10 Badges Earned!")
  - `description` (string, e.g., "Keep up the great work!")
  - `trigger` (JSONB, e.g., `{ "type": "badge_count", "value": 10 }`)
  - `icon` (string, e.g., "🎉")
  - `isActive` (boolean, default true)
  - `createdBy` (UUID, FK to users)
  - `createdAt` (timestamp)
- [ ] AC 2.2: Create `milestone_achievements` table with columns:
  - `id` (UUID primary key)
  - `milestoneId` (UUID, FK to milestone_configs, cascade delete)
  - `userId` (UUID, FK to users, cascade delete)
  - `achievedAt` (timestamp)
  - **UNIQUE constraint** on (milestoneId, userId) - one achievement per user per milestone
  - **INDEX** on (userId, achievedAt) for query performance
- [ ] AC 2.3: Run Prisma migration: `20260129_sprint4_milestones`

**Backend API (Admin Only):**
- [ ] AC 2.4: Implement `POST /api/admin/milestones` (create milestone config)
  - Request body: `{ type, title, description, trigger, icon }`
  - Response: Created milestone config
  - RBAC: ADMIN role only
- [ ] AC 2.5: Implement `GET /api/admin/milestones` (list all milestone configs)
  - Response: Array of milestone configs
  - RBAC: ADMIN role only
- [ ] AC 2.6: Implement `PATCH /api/admin/milestones/:id` (update config)
  - Can update: title, description, trigger, icon, isActive
  - Cannot update: type (enum change requires new config)
- [ ] AC 2.7: Implement `DELETE /api/admin/milestones/:id` (soft delete via isActive=false)

**Milestone Detection Service:**
- [ ] AC 2.8: Create `MilestonesService.checkMilestones(userId)` method
  - Called asynchronously after badge issuance/claiming
  - Fetches active milestone configs
  - Evaluates trigger for each config:
    - **BADGE_COUNT:** Count user's claimed badges
    - **SKILL_TRACK:** Count claimed badges in specific category
    - **ANNIVERSARY:** Check user registration date
  - Creates achievement record if:
    - Trigger condition met
    - User hasn't achieved this milestone before
- [ ] AC 2.9: Milestone detection runs in <500ms (background job, non-blocking)
- [ ] AC 2.10: Failed detections logged but don't block badge operations

**Employee API:**
- [ ] AC 2.11: Implement `GET /api/milestones/achievements` (user's milestones)
  - Response: Array of achieved milestones with metadata
  - RBAC: Any authenticated user (see own achievements)
  - Join with milestone_configs to get title, icon, description

**Timeline Integration:**
- [ ] AC 2.12: Wallet API includes milestones in dateGroups:
  ```json
  {
    "type": "milestone",
    "milestoneId": "uuid",
    "title": "🎉 10 Badges Earned!",
    "description": "Keep up the great work!",
    "achievedAt": "2026-01-26T10:00:00Z"
  }
  ```
- [ ] AC 2.13: Frontend displays milestone cards in Timeline View:
  - Centered on timeline (no dot)
  - Yellow background (#FFF4CE)
  - Icon + title + description
  - Celebration animation on first render (optional)

**Technical Notes:**
- **Trigger JSON Examples:**
  ```json
  { "type": "badge_count", "value": 10 }
  { "type": "skill_track", "categoryId": "uuid", "requiredBadgeCount": 5 }
  { "type": "anniversary", "months": 12 }
  ```
- **Admin UI:** Epic 12 (future sprint) - For now, API only (Postman/curl testing)
- **Performance:** Cache milestone configs in memory (reload every 5 minutes)
- **Files to Create:**
  - `src/milestones/milestones.module.ts`
  - `src/milestones/milestones.controller.ts`
  - `src/milestones/milestones.service.ts`
  - `src/milestones/entities/milestone-config.entity.ts`
  - `src/milestones/dto/create-milestone.dto.ts`
  - `prisma/migrations/20260129_sprint4_milestones/migration.sql`

**Dependencies:**
- [ ] No new Azure resources needed ✅
- [ ] Database migration required
- [ ] Story 4.1 must be complete (Timeline View exists)

**Definition of Done:**
- [ ] Code written and peer-reviewed
- [ ] 10 unit tests written
  - Milestone trigger evaluation (badge count, skill track, anniversary)
  - Duplicate achievement prevention
  - Admin RBAC enforcement
- [ ] 5 integration tests written
  - Create milestone config
  - Detect milestone after badge claim
  - Fetch user achievements
- [ ] Database migration tested on dev environment
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] Performance: Milestone detection <500ms verified
- [ ] Deployed to dev environment

---

### Story 4.3: Evidence File Management & Display

**Priority:** **P0** (Critical - Required for Badge Detail Modal)  
**Story Points:** 8  
**Estimate:** 6 hours  
**Assigned To:** LegendZhu  
**Dependencies:** None (can run parallel to Story 4.1)

**User Story:**  
As an **Employee**, I want **to view evidence files attached to my badges** (certificates, project docs, images) so that **I can download or preview proof of my achievements**.

**Acceptance Criteria:**

**Database Schema:**
- [ ] AC 3.1: Create `evidence_files` table with columns:
  - `id` (UUID primary key)
  - `badgeId` (UUID, FK to badges, cascade delete)
  - `fileName` (string, e.g., "abc123-python-project.pdf")
  - `originalName` (string, user's original filename)
  - `fileSize` (integer, bytes)
  - `mimeType` (string, e.g., "application/pdf")
  - `blobUrl` (string, Azure Blob URL)
  - `uploadedBy` (UUID, FK to users)
  - `uploadedAt` (timestamp)
  - **INDEX** on (badgeId) for fast lookups
- [ ] AC 3.2: Run Prisma migration: `20260129_sprint4_evidence_files`

**Azure Blob Storage Strategy:**
- [ ] AC 3.3: Use **existing** `evidence` container (created Sprint 0) ✅ **NO NEW RESOURCE**
- [ ] AC 3.4: File naming: `{badgeId}/{fileId}-{sanitized-filename}.ext`
  - Example: `evidence/badge-uuid-123/file-uuid-456-python-project.pdf`
- [ ] AC 3.5: Container access: **Private** (no anonymous read)
- [ ] AC 3.6: Generate SAS tokens for download/preview:
  - **5-minute expiry** (security)
  - Read-only permission
  - Verify user owns badge before generating token

**Backend API:**
- [ ] AC 3.7: Implement `POST /api/badges/:badgeId/evidence` (upload evidence)
  - Request: multipart/form-data with file upload
  - Validation:
    - File size ≤ 10MB
    - Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - Response: Evidence file metadata
  - RBAC: ADMIN, ISSUER (upload during issuance)
- [ ] AC 3.8: Implement `GET /api/badges/:badgeId/evidence` (list evidence files)
  - Response: Array of evidence file metadata (without SAS token)
  - RBAC: Badge owner or ADMIN
- [ ] AC 3.9: Implement `GET /api/badges/:badgeId/evidence/:fileId/download` (generate download SAS)
  - Response: `{ url: "https://...?sasToken...", expiresAt: "2026-01-29T10:05:00Z" }`
  - SAS token valid for 5 minutes
  - RBAC: Badge owner or ADMIN
- [ ] AC 3.10: Implement `GET /api/badges/:badgeId/evidence/:fileId/preview` (generate preview SAS)
  - Same as download, but for inline viewing (images only)
  - Response: `{ url: "...", isImage: true }`

**Badge Detail Modal Integration:**
- [ ] AC 3.11: Badge Detail Modal shows "Evidence Submitted" section if files exist
- [ ] AC 3.12: Display up to 5 files with:
  - File type icon (📎 PDF, 📷 Image, 📄 Doc)
  - File name
  - File size (formatted: "2.3 MB")
  - Download button → generates SAS token → triggers browser download
  - Preview button (images only) → opens lightbox with image
- [ ] AC 3.13: If more than 5 files, show "View all {count} files" link
- [ ] AC 3.14: Empty state: Section hidden if no evidence files

**Technical Notes:**
- **Environment Variables:** ✅ **ALL EXIST** (from Sprint 0)
  ```env
  AZURE_STORAGE_CONNECTION_STRING=*** (verified)
  AZURE_STORAGE_CONTAINER_EVIDENCE=evidence (verified)
  ```
- **Reuse BlobStorageService:** ✅ Extend existing service from Sprint 2
- **SAS Token Security:**
  - 5-minute expiry prevents long-term URL sharing
  - Read-only permission
  - Verify user owns badge before generating
- **Files to Create:**
  - `src/evidence/evidence.module.ts`
  - `src/evidence/evidence.controller.ts`
  - `src/evidence/evidence.service.ts`
  - `src/evidence/dto/upload-evidence.dto.ts`
  - Extend `BlobStorageService` with `generateDownloadSasToken()`
  - `frontend/components/BadgeDetailModal/EvidenceSection.tsx`

**Dependencies:**
- [ ] Azure Blob Storage `evidence` container ✅ **EXISTS** (Sprint 0)
- [ ] BlobStorageService ✅ **EXISTS** (Sprint 2)
- [ ] No new packages needed ✅

**Definition of Done:**
- [ ] Code written and peer-reviewed
- [ ] 12 unit tests written
  - File upload validation (size, MIME type)
  - SAS token generation
  - User ownership verification
- [ ] 8 integration tests written
  - Upload evidence file
  - List evidence files
  - Generate download SAS token
  - Preview image file
  - Unauthorized access blocked
- [ ] Evidence section in Badge Detail Modal functional
- [ ] File download/preview tested (real Azure Blob)
- [ ] Documentation: Evidence file management guide
- [ ] Deployed to dev environment

---

### Story 4.4: Badge Detail Modal - Full Implementation

**Priority:** **P0** (Critical - Core UX interaction)  
**Story Points:** 10  
**Estimate:** 10 hours  
**Assigned To:** LegendZhu  
**Dependencies:** Story 4.3 (Evidence files), Story 4.5 (Similar badges)

**User Story:**  
As an **Employee**, I want **to view comprehensive badge details** (criteria, issuer message, evidence files, similar badges, verification URL) so that **I understand the full context and value of my credential**.

**Acceptance Criteria:**

**Modal Structure (7 Sections):**
- [ ] AC 4.1: **Header** with badge title and Close button (X icon)
- [ ] AC 4.2: **Hero Section** (256x256px badge image + metadata)
  - Badge image prominently displayed
  - Privacy indicator (🌐 Public / 🔒 Internal)
  - Status badge (✅ Claimed, 🟡 Pending, 🔒 Revoked)
  - Issuance date (formatted: "Jan 26, 2026")
- [ ] AC 4.3: **Issuer Message Section** (if exists)
  - 💬 Icon + issuer name
  - Personalized message in gray callout box
  - Example: "Fantastic work on mastering Python! Your dedication to learning is impressive."
- [ ] AC 4.4: **Badge Info Section**
  - Description paragraph
  - Skills tags (interactive chips, Primary-600 color)
  - Criteria list (bulleted, 14px font)
  - Evidence files section (from Story 4.3) ✅
- [ ] AC 4.5: **Timeline Section**
  - Issued date
  - Claimed date (if claimed)
  - Expiration date (if applicable, with warning if <30 days)
- [ ] AC 4.6: **Verification Section**
  - Public verification URL with copy button
  - "Verify on G-Credit" link (opens in new tab)
  - QR code (optional, future enhancement)
- [ ] AC 4.7: **Similar Badges Section** (from Story 4.5) ✅
  - "🎯 Similar Badges You Might Like" heading
  - Horizontal scrollable row (3 cards visible desktop, 1 mobile)
  - Each card: Image, title, issuer, "View Details" button
- [ ] AC 4.8: **Action Footer**
  - Left: Share button (opens share options)
  - Center: Download button (PNG/JSON-LD options)
  - Right: Report Issue button (opens inline form)

**Report Issue Form:**
- [ ] AC 4.9: Inline form with fields:
  - Issue Type dropdown: "Incorrect info", "Technical problem", "Other"
  - Description textarea (500 char max)
  - Email confirmation (pre-filled with user email)
  - Submit button
- [ ] AC 4.10: Submit form → `POST /api/badges/:id/report`
  - Request body: `{ issueType, description, email }`
  - Email sent to g-credit@outlook.com with badge details
  - Response: Success message "Report submitted. We'll review within 2 business days."
- [ ] AC 4.11: Use **existing** Azure Communication Services ✅ (Sprint 3)

**Modal Behavior:**
- [ ] AC 4.12: Desktop: 800px width, centered, overlay backdrop (rgba(0,0,0,0.5))
- [ ] AC 4.13: Mobile: Full-screen modal, slide-up animation
- [ ] AC 4.14: Keyboard navigation:
  - Escape key → close modal
  - Tab key → cycle through interactive elements
  - Focus trap (can't tab outside modal)
- [ ] AC 4.15: Click backdrop → close modal (with confirmation if report form dirty)
- [ ] AC 4.16: Smooth scroll within modal content

**Technical Notes:**
- **Component:** `BadgeDetailModal.tsx` (compound component pattern)
- **Sub-components:**
  - `ModalHeader.tsx`
  - `ModalHero.tsx`
  - `IssuerMessage.tsx`
  - `BadgeInfo.tsx`
  - `TimelineSection.tsx`
  - `VerificationSection.tsx`
  - `SimilarBadges.tsx` (from Story 4.5)
  - `EvidenceSection.tsx` (from Story 4.3)
  - `ReportIssueForm.tsx`
  - `ModalFooter.tsx`
- **State Management:** Zustand for modal open/close state
- **Animations:** Framer Motion for smooth open/close transitions
- **Accessibility:**
  - ARIA roles: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
  - Focus management with `react-focus-lock`
  - Screen reader announcements

**Dependencies:**
- [ ] Story 4.3 (Evidence files) must be complete
- [ ] Story 4.5 (Similar badges) must be complete
- [ ] Azure Communication Services ✅ **EXISTS** (Sprint 3)

**Definition of Done:**
- [ ] Code written and peer-reviewed
- [ ] 15 E2E tests written
  - Open modal from Timeline View
  - All 7 sections render correctly
  - Evidence files display and download
  - Similar badges display
  - Report form submission
  - Mobile responsive layout
  - Keyboard navigation
  - Close modal (Escape, backdrop click, X button)
- [ ] UX specs from `ux-badge-detail-modal.md` followed exactly
- [ ] Accessibility: WCAG 2.1 AA verified (focus management, ARIA)
- [ ] Performance: Modal opens in <300ms
- [ ] Documentation: Component props and usage examples
- [ ] Deployed to dev environment

---

### Story 4.5: Similar Badge Recommendations Algorithm

**Priority:** **P1** (High - Enhances discovery)  
**Story Points:** 5  
**Estimate:** 4 hours  
**Assigned To:** LegendZhu  
**Dependencies:** None (can run parallel to other stories)

**User Story:**  
As an **Employee**, I want **to see similar badges I might be interested in** so that **I discover related learning opportunities and credentials**.

**Acceptance Criteria:**

**Algorithm (Phase 1 - Simple Scoring):**
- [ ] AC 5.1: Implement similarity scoring function:
  ```typescript
  calculateSimilarity(currentBadge, candidateBadge) {
    score = 0
    // Same skills: +20 points per match
    skillMatches = intersection(current.skillIds, candidate.skillIds).length
    score += skillMatches * 20
    
    // Same category: +15 points
    if (current.category === candidate.category) score += 15
    
    // Same issuer: +10 points
    if (current.createdBy === candidate.createdBy) score += 10
    
    // Popularity: +1 point per 10 badges issued
    score += Math.floor(candidate.badgesIssuedCount / 10)
    
    return score
  }
  ```
- [ ] AC 5.2: Exclude badges user already owns (claimed or pending)
- [ ] AC 5.3: Only consider ACTIVE templates
- [ ] AC 5.4: Return top 6 highest-scoring badges

**Backend API:**
- [ ] AC 5.5: Implement `GET /api/badges/:id/similar?limit=6`
  - Response: Array of BadgeTemplate objects with similarity scores
  - Limit parameter (default 6, max 10)
  - RBAC: Any authenticated user
- [ ] AC 5.6: Query optimization:
  - Fetch all ACTIVE templates with badge counts in single query
  - Score in-memory (acceptable for <500 templates)
  - Sort by score DESC
- [ ] AC 5.7: Performance target: <200ms for recommendation query

**Frontend Integration:**
- [ ] AC 5.8: Display in Badge Detail Modal:
  - Section title: "🎯 Similar Badges You Might Like"
  - Horizontal scrollable row (3 cards desktop, 1 mobile)
  - Scroll arrows for navigation
  - Smooth scroll behavior
- [ ] AC 5.9: Each card shows:
  - Badge image (128x128px, rounded)
  - Badge title (truncated if long)
  - Issuer name (14px, gray)
  - "View Details" button (Secondary style)
- [ ] AC 5.10: Click card or button → open that badge's template details (new modal or route)
- [ ] AC 5.11: Empty state: Hide section if no similar badges found

**Future Enhancement (Phase 2 - Not Sprint 4):**
- Collaborative filtering (users with similar badges also liked X)
- User click tracking (implicit feedback)
- Azure ML integration for advanced recommendations
- Personalized recommendations based on role/department

**Technical Notes:**
- **Files to Create:**
  - `src/badges/recommendations.service.ts`
  - `src/badges/dto/similar-badges-response.dto.ts`
  - `frontend/components/BadgeDetailModal/SimilarBadgesSection.tsx`
- **Performance:** In-memory scoring acceptable for MVP (<500 templates)
- **Future Optimization:** Cache template data, refresh every 10 minutes

**Dependencies:**
- [ ] No new Azure resources needed ✅
- [ ] No new packages needed ✅

**Definition of Done:**
- [ ] Code written and peer-reviewed
- [ ] 8 unit tests written
  - Similarity scoring algorithm (various scenarios)
  - Badge exclusion logic (user owns badge)
  - Edge cases (no similar badges, all badges owned)
- [ ] 5 integration tests written
  - Fetch similar badges API
  - Score accuracy verification
  - Performance <200ms verified
- [ ] Similar badges section in Badge Detail Modal functional
- [ ] Horizontal scroll works on mobile
- [ ] Documentation: Recommendation algorithm explanation
- [ ] Deployed to dev environment

---

### Story 4.6: Empty State Handling - 4 Scenarios

**Priority:** **P0** (Critical - First impression for new users)  
**Story Points:** 5  
**Estimate:** 5 hours  
**Assigned To:** LegendZhu  
**Dependencies:** Story 4.1 (Timeline View must exist)

**User Story:**  
As an **Employee**, I want **to see helpful empty states** when I have no badges so that **I understand what badges are and how to earn them**.

**Acceptance Criteria:**

**Scenario 1: New Employee (No Badges Ever):**
- [ ] AC 6.1: Display when user has 0 badges in all statuses
- [ ] AC 6.2: Content:
  - Illustration (empty badge wallet icon, 256x256px)
  - Heading: "Welcome to Your Badge Wallet!" (H1, 32px)
  - Description: "Badges are digital credentials that recognize your skills and achievements. Start earning badges by completing learning programs."
  - Primary CTA button: "Explore Badge Catalog" → navigate to badge template catalog
  - Secondary CTA button: "Learn How to Earn" → navigate to `/docs/help/earning-badges`
- [ ] AC 6.3: Emotional tone: Welcoming, encouraging, educational

**Scenario 2: Pending Badges Exist (No Claimed Badges):**
- [ ] AC 6.4: Display when user has PENDING badges but 0 CLAIMED badges
- [ ] AC 6.5: Content:
  - Illustration (gift box icon, 256x256px, with animation)
  - Heading: "You Have Badges Waiting!"
  - Description: "You've been awarded {count} badge(s). Review and claim them to add to your profile."
  - Primary CTA button: "View Pending Badges" → switch to Pending tab
- [ ] AC 6.6: Emotional tone: Excitement, urgency (gentle nudge)

**Scenario 3: All Badges Revoked (Sensitive):**
- [ ] AC 6.7: Display when user had badges but all are REVOKED
- [ ] AC 6.8: Content:
  - Illustration (alert circle icon, 256x256px, neutral color)
  - Heading: "Your Badge Wallet is Currently Empty"
  - Description: "All your badges have been revoked. If you believe this is an error, please contact support at g-credit@outlook.com."
  - Primary CTA button: "Contact Support" → mailto:g-credit@outlook.com with pre-filled subject
  - Secondary CTA button: "View Revocation Policy" → navigate to `/policies/revocation`
- [ ] AC 6.9: Emotional tone: Neutral, supportive, professional (not accusatory)

**Scenario 4: Filtered Results Empty:**
- [ ] AC 6.10: Display when badges exist but filter returns 0 results
- [ ] AC 6.11: Content:
  - Illustration (empty search icon, 128x128px, smaller)
  - Heading: "No Badges Match This Filter"
  - Description: "Try adjusting your filters or search terms."
  - Primary CTA button: "Clear Filters" → reset all filters
- [ ] AC 6.12: Filter status indicator: "Filtering by: {status}" with X to remove

**Implementation:**
- [ ] AC 6.13: Empty state component: `EmptyState.tsx` (props: scenario, badgeCount)
- [ ] AC 6.14: Automatic detection based on wallet API response
- [ ] AC 6.15: Illustrations: Use Shadcn/ui Lucide icons or custom SVG
- [ ] AC 6.16: Mobile responsive: Stack content, reduce illustration size

**Technical Notes:**
- **Files to Create:**
  - `frontend/components/BadgeWallet/EmptyState.tsx`
  - `frontend/components/BadgeWallet/EmptyStateScenarios/` (4 scenario components)
- **UX Specs:** Follow `ux-badge-wallet-empty-state.md` exactly
- **Animation:** Optional subtle animation on illustration (Framer Motion)

**Dependencies:**
- [ ] Story 4.1 (Timeline View) must be complete
- [ ] Documentation page `/docs/help/earning-badges` must exist (create placeholder)

**Definition of Done:**
- [ ] Code written and peer-reviewed
- [ ] 8 E2E tests written (one per scenario + edge cases)
  - New employee empty state
  - Pending badges exist empty state
  - All revoked empty state
  - Filtered results empty state
- [ ] All 4 scenarios display correctly
- [ ] CTAs navigate correctly
- [ ] Mailto link pre-fills subject: "Badge Revocation Inquiry"
- [ ] Mobile responsive verified
- [ ] UX specs followed exactly
- [ ] Deployed to dev environment

---

### Story 4.7: Database Migration & Schema Updates

**Priority:** **P0** (Critical - Blocker for all backend stories)  
**Story Points:** 3  
**Estimate:** 3 hours  
**Assigned To:** LegendZhu  
**Dependencies:** None (must run first)

**User Story:**  
As a **Developer**, I want **to execute database migrations** for Sprint 4 schema changes so that **all new tables and indexes are created correctly**.

**Acceptance Criteria:**

**Migration Files:**
- [ ] AC 7.1: Create migration: `20260129_sprint4_badge_wallet/migration.sql`
- [ ] AC 7.2: Migration includes:
  - Create `milestone_configs` table
  - Create `milestone_achievements` table
  - Create `evidence_files` table
  - Create index `idx_milestone_achievements_user` on (userId, achievedAt)
  - Create index `idx_evidence_files_badge` on (badgeId)
  - Create index `idx_badges_timeline` on (recipientId, status, issuedAt DESC)
- [ ] AC 7.3: Migration is idempotent (can run multiple times safely)

**Prisma Schema Updates:**
- [ ] AC 7.4: Update `schema.prisma` with new models
- [ ] AC 7.5: Add relations to existing models:
  - `Badge.evidenceFiles` → `EvidenceFile[]`
  - `User.milestoneAchievements` → `MilestoneAchievement[]`
- [ ] AC 7.6: Generate Prisma Client: `npx prisma generate`

**Migration Execution:**
- [ ] AC 7.7: Run migration on dev database: `npx prisma migrate dev`
- [ ] AC 7.8: Verify tables created: `SELECT * FROM information_schema.tables WHERE table_name IN ('milestone_configs', 'milestone_achievements', 'evidence_files')`
- [ ] AC 7.9: Verify indexes created: Check PostgreSQL index metadata
- [ ] AC 7.10: Test rollback (create rollback script if needed)

**Seed Data (Optional):**
- [ ] AC 7.11: Create seed script: `prisma/seeds/sprint4-milestones.seed.ts`
- [ ] AC 7.12: Seed default milestones:
  - 10 badges earned
  - 25 badges earned
  - 50 badges earned
  - 1 year anniversary
- [ ] AC 7.13: Run seed: `npx prisma db seed`

**Technical Notes:**
- **Use Local Binary:** ✅ `node_modules\.bin\prisma` (Lesson 2)
- **Version Locked:** ✅ Prisma 6.19.2 (no Prisma 7 upgrade)
- **Backup First:** Create database backup before migration
- **Files to Create:**
  - `prisma/migrations/20260129_sprint4_badge_wallet/migration.sql`
  - `prisma/schema.prisma` (update existing)
  - `prisma/seeds/sprint4-milestones.seed.ts` (optional)

**Dependencies:**
- [ ] Azure PostgreSQL connection ✅ **VERIFIED** (Sprint 0)
- [ ] No new database creation needed ✅

**Definition of Done:**
- [ ] Migration file created and reviewed
- [ ] Prisma schema updated
- [ ] Migration executed successfully on dev database
- [ ] All 3 tables exist in database
- [ ] All indexes created
- [ ] Prisma Client regenerated
- [ ] Seed data created (optional)
- [ ] Migration documented in `CHANGELOG.md`
- [ ] Rollback script tested (if applicable)

---

## 📊 Sprint Capacity Planning

**Total Estimated Hours:** 58 hours  
**Team Capacity:** 88 hours (11 days × 8 hours)  
**Buffer:** 30 hours (34% buffer for unknowns, meetings, code reviews)

| Story | Estimate | Priority | Dependencies |
|-------|----------|----------|--------------|
| 4.1 - Timeline View | 12h | P0 | None ✅ |
| 4.2 - Milestones | 8h | P1 | 4.1 |
| 4.3 - Evidence Files | 6h | P0 | None ✅ |
| 4.4 - Badge Detail Modal | 10h | P0 | 4.3, 4.5 |
| 4.5 - Similar Badges | 4h | P1 | None ✅ |
| 4.6 - Empty States | 5h | P0 | 4.1 |
| 4.7 - Database Migration | 3h | P0 | None ✅ (START FIRST) |
| **Testing & Polish** | 10h | P0 | All stories |
| **Total Committed** | **58h** | | |
| **Buffer Remaining** | **30h** | | |

**Execution Sequence (Optimized for Parallelization):**
- **Week 1, Day 1-2 (Mon-Tue):** Story 4.7 (Migration) → BLOCKER for all backend work
- **Week 1, Day 2-4 (Tue-Thu):** Stories 4.1 + 4.3 + 4.5 (parallel - no dependencies)
- **Week 1, Day 5 - Week 2, Day 2 (Fri-Tue):** Stories 4.4 + 4.6 (depend on 4.1, 4.3, 4.5)
- **Week 2, Day 3-4 (Wed-Thu):** Story 4.2 (Milestones, depends on 4.1)
- **Week 2, Day 5 (Fri):** Testing, polish, UAT, documentation

---

## 🧪 Testing Strategy

### Unit Testing (30 tests target)
**Coverage Target:** > 80%

**Key Areas:**
- Timeline date grouping logic (6 tests)
- Milestone trigger evaluation (10 tests)
- Evidence file validation (5 tests)
- Similar badge scoring algorithm (6 tests)
- Empty state detection (3 tests)

### Integration Testing (20 tests target)
**Focus:** API endpoints + database interactions

**Test Cases:**
- Badge wallet API with various filters (5 tests)
- Milestone CRUD and detection (5 tests)
- Evidence file upload/download with Azure Blob (5 tests)
- Similar badges recommendation query (3 tests)
- Report form submission with email (2 tests)

### E2E Testing (15 tests target)
**Focus:** Critical user flows

**Test Scenarios:**
- Load Timeline View with 50+ badges (1 test)
- Switch between Timeline and Grid views (1 test)
- Date navigation sidebar click → scroll (1 test)
- Open Badge Detail Modal, view all sections (1 test)
- Download evidence file (1 test)
- Preview image evidence file (1 test)
- Submit report issue form (1 test)
- Click similar badge → open new modal (1 test)
- Empty state scenarios (4 tests)
- Mobile responsive layouts (3 tests)

**Total Tests:** 65 tests (Sprint 4 target)

---

## 🔒 Sprint Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| **Timeline performance with 100+ badges** | Medium | Medium | Use pagination (50/page), monitor query time, defer virtual scrolling to performance sprint |
| **Evidence file SAS token security issues** | Low | High | Use 5-min expiry, verify badge ownership before generating token, audit all accesses |
| **Milestone detection adds latency** | Low | Medium | Run asynchronously (non-blocking), cache milestone configs, <500ms target |
| **Similar badge algorithm inaccuracy** | Medium | Low | Start with simple scoring, iterate based on user feedback, plan ML enhancement for Phase 2 |
| **Azure Blob storage costs exceed budget** | Low | Low | Monitor usage weekly, implement 10MB file limit, educate users on file optimization |
| **Database migration fails** | Low | High | Test migration on dev first, create backup, have rollback script ready |

---

## 📅 Sprint Ceremonies

| Ceremony | Day | Duration | Notes |
|----------|-----|----------|-------|
| Sprint Planning | Day 1 (Mon) | 2 hours | Review backlog, commit to stories |
| Daily Standup | Daily | 15 min | 9:30 AM - Progress, blockers, plan |
| Sprint Review | Day 11 (Fri) | 1 hour | Demo Timeline View, milestones, evidence files |
| Sprint Retrospective | Day 11 (Fri) | 1 hour | Lessons learned, action items |

---

## 🚀 Deployment Plan

### Environments
- **Dev:** Continuous deployment (automatic on commit to `sprint-4-badge-wallet` branch)
- **Staging:** Deploy on Day 10 (Thu, Feb 11) after all tests pass
- **Production:** Not applicable (MVP development phase)

### Rollback Plan
If deployment fails:
1. Revert database migration: Run rollback script
2. Revert Git commit: `git revert {commitHash}`
3. Redeploy previous stable version (v0.3.0 from Sprint 3)
4. Investigate issue, fix, redeploy

---

## 📋 Success Metrics

### Velocity
- **Target Velocity:** 34 story points (7 stories)
- **Previous Sprint 3:** 6 stories, 100% completion
- **Average Velocity:** Increasing (Sprint 1: 21h, Sprint 2: ~3h, Sprint 3: 13h)

### Quality
- **Target Test Coverage:** > 80%
- **Target Bug Count:** 0 critical bugs
- **Target Code Review Time:** < 24 hours

### Delivery
- **Target Completion:** 100% of P0 stories (4.1, 4.3, 4.4, 4.6, 4.7)
- **Stretch Goal:** 100% of all stories including P1 (4.2, 4.5)
- **Target On-Time Delivery:** 2026-02-12

---

## 📝 Definition of Done (Sprint-Level)

**Per-Story DoD (Standard):**
- [ ] Code written and peer-reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration/E2E tests added
- [ ] Documentation updated
- [ ] Deployed to dev environment
- [ ] QA approved (manual testing)

**Sprint-Level DoD (End of Sprint):** ⚠️ **CRITICAL**
- [ ] **project-context.md updated**
  - Status: Sprint 4 Complete
  - Last Updated: 2026-02-12
  - Implemented Features: Add Epic 5 section
  - Next Actions: Sprint 5 planning
- [ ] **Sprint 4 retrospective created**
  - File: `gcredit-project/docs/sprints/sprint-4/retrospective.md`
  - Include: Velocity analysis, lessons learned, action items
- [ ] **CHANGELOG.md updated**
  - Add Sprint 4 section with all delivered features
  - Include: Database migrations, API endpoints, frontend components
- [ ] **Code merged to main branch**
  - Branch: `sprint-4-badge-wallet` → `main`
  - Merge strategy: Squash and merge with descriptive commit message
- [ ] **Git tag created: v0.4.0**
  - Tag message: "Sprint 4: Employee Badge Wallet - Timeline View, Milestones, Evidence Files"
- [ ] **Documentation consolidated**
  - Update `docs/sprints/README.md` with Sprint 4 summary
  - Update `infrastructure-inventory.md` with new tables
  - Create `docs/development/badge-wallet-guide.md`

---

## 🎓 Key Learnings Applied from Previous Sprints

**From Sprint 0:**
- ✅ Lock all dependency versions explicitly (no "latest")
- ✅ Use local binaries for Prisma commands
- ✅ Document troubleshooting in real-time

**From Sprint 1:**
- ✅ Perfect time estimation is achievable (track actual vs estimated)
- ✅ RBAC patterns established (reuse JWT guards)
- ✅ Test organization by feature domain

**From Sprint 2:**
- ✅ **CRITICAL:** Check infrastructure-inventory.md before creating resources
- ✅ Use environment variables, never hard-code resource names
- ✅ Reuse existing Azure resources (Storage, PostgreSQL, Email)

**From Sprint 3:**
- ✅ Email service pattern established (reuse for report submissions)
- ✅ Dual-mode testing (ACS production + Ethereal dev)
- ✅ UAT scenarios drive E2E test design

---

## 📚 Related Documents

**Planning Documents:**
- [UX Design - Timeline View](../sprint-4/ux-badge-wallet-timeline-view.md) ✅
- [UX Design - Empty States](../sprint-4/ux-badge-wallet-empty-state.md) ✅
- [UX Design - Badge Detail Modal](../sprint-4/ux-badge-detail-modal.md) ✅
- [Winston's Architecture Analysis](../sprint-4/sprint-4-architecture-analysis.md) ✅
- [Epic 5 User Stories](_bmad-output/planning-artifacts/epics.md#epic-5) ✅

**Reference Documents:**
- [Infrastructure Inventory](../../setup/infrastructure-inventory.md) ✅
- [Lessons Learned](../../lessons-learned/lessons-learned.md) ✅
- [Sprint Planning Checklist](../../templates/sprint-planning-checklist.md) ✅
- [Backlog Template](../../templates/sprint-backlog-template.md) ✅

**Previous Sprints:**
- [Sprint 0 Backlog](_bmad-output/implementation-artifacts/sprint-0-backlog.md)
- [Sprint 1 Backlog](_bmad-output/implementation-artifacts/sprint-1-backlog.md)
- [Sprint 2 Backlog](../sprint-2/backlog.md)
- [Sprint 3 Backlog](../sprint-3/backlog.md)

---

## 🎯 Sprint 4 Focus: Quality Over Speed

**Philosophy:** This sprint introduces complex UX patterns (Timeline View, milestones, evidence files). Prioritize:
1. **Pixel-perfect UX implementation** (follow Sally's specs exactly)
2. **Security** (SAS tokens, RBAC, evidence file validation)
3. **Accessibility** (WCAG 2.1 AA compliance, keyboard navigation)
4. **Performance** (Timeline query <150ms, modal open <300ms)

**Not This Sprint:**
- Virtual scrolling (deferred to performance sprint)
- Admin UI for milestone configuration (Epic 12, future sprint)
- ML-based recommendations (Phase 2 enhancement)
- Badge download (moved to Epic 7 - Sharing)

---

**Last Updated:** 2026-01-28  
**Status:** ✅ Ready for Development  
**Next Review:** Daily standup (2026-01-29, 9:30 AM)

---

## 🔗 Quick Links

- **Jira Board:** [Sprint 4 Board](#) (if using Jira)
- **GitHub Project:** [Sprint 4 Project](#) (if using GitHub Projects)
- **Dev Environment:** http://localhost:3000
- **API Docs:** http://localhost:3001/api/docs
- **Azure Portal:** [gcredit-dev-db-lz](#)
- **Blob Storage:** [gcreditdevstoragelz](#)

---

**Prepared By:** Bob (Scrum Master)  
**Reviewed By:** Sally (UX Designer), Winston (Architect)  
**Approved By:** LegendZhu (Product Owner / Developer)
