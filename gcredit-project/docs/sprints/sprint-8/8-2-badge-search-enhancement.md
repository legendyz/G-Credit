# Story 8.2: Badge Search & Filter Enhancement

**Story ID:** Story 8.2  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** MEDIUM  
**Story Points:** 3  
**Estimated Hours:** 4h  
**Status:** backlog  
**Created:** 2026-02-02

---

## Context

Current badge wallet and verification pages have basic filtering (Active/All/Revoked) but lack search and advanced filtering capabilities. Users with 20+ badges struggle to find specific credentials.

This story enhances search and filtering UX across the platform.

**Reference:** Sprint 7 UX Review, PRD FR-15 (Badge Discovery)

---

## User Story

**As a** User (Employee/Issuer/External Verifier),  
**I want** to search and filter badges by name, issuer, skill, and date,  
**So that** I can quickly find relevant badges in large collections.

---

## Acceptance Criteria

### AC1: Employee Wallet Search
**Given** I am viewing my badge wallet (/wallet)  
**When** I use the search box  
**Then** I can search badges by:

- Badge template name (fuzzy match)
- Issuer name (fuzzy match)
- Skills (tag-based)
- Issue date range (from/to date pickers)

**Search Behavior:**
- Debounced input (500ms delay to avoid excessive API calls)
- Minimum 2 characters to trigger search
- Search results update in real-time
- "No results" empty state when no matches

**Mobile Search UX:**
- Search bar: Sticky to top on scroll, 48px height (touch-friendly)
- Input focus: Auto-expand to full width, temporarily hide filter chips
- Search icon: 44×44px tap target, left-aligned (iOS/Android standard)
- Clear button: 44×44px "X" icon, appears only when text entered
- Keyboard: Opens immediately on tap, `type="search"` for mobile keyboard optimization
- Results: Scroll behind sticky search bar, infinite scroll on mobile

**Empty States:**
- No results for query: "No badges found for '{query}'" with suggestions:
  - "Try different keywords"
  - "Clear filters" button (if filters active)
  - "Browse all badges" link
- No badges at all: "No badges available" with role-specific CTA
  - Employee: "Earn your first badge!"
  - Admin/Issuer: "Create your first badge template"
- Visual: Search icon + friendly message (not blank screen)

### AC2: Badge Management Page Search (Admin/Issuer)
**Given** I am viewing the badge management page (/badges/manage)  
**When** I use the search and filters  
**Then** I can filter by:

- Recipient name/email (existing)
- Template name (existing)
- **NEW:** Skills (multi-select)
- **NEW:** Date issued range
- **NEW:** Issuer (for Admin view)

**Combined Filters:**
- All filters work together (AND logic)
- Clear all filters button
- Filter count badge (e.g., "3 active filters")

### AC3: Badge Template Catalog Search (Future-Ready)
**Given** I am browsing badge templates (/catalog - future)  
**When** I use the search  
**Then** I can search by:

- Template name
- Skills required
- Category
- Difficulty level (if applicable)

**Note:** Catalog page is Sprint 9+, but search component should be reusable.

### AC4: Advanced Filter UI Components
**Given** any page with badge search  
**When** I interact with filters  
**Then** I see:

- **Search Input:**
  - Magnifying glass icon
  - Placeholder text: "Search by name, issuer, or skill..."
  - Clear button (X) when text is entered
  
- **Filter Dropdowns:**
  - Multi-select for Skills (with checkboxes)
  - Date range picker (from/to)
  - Issuer dropdown (Admin only)
  
- **Active Filters Display:**
  - Chip/tag display of active filters
  - Individual remove buttons on chips
  - "Clear all" button when 2+ filters active

### AC5: Search Performance & Optimization
**Given** I am searching across 100+ badges  
**When** search executes  
**Then** performance meets standards:

- **Client-side filtering** for <50 badges (instant)
- **Server-side search** for 50+ badges (API call)
- Loading spinner during API search
- Maximum 300ms response time (server-side)
- Pagination when results exceed 20 items

---

## Tasks / Subtasks

### Task 1: Shared Search Components - 1.5h
- [ ] Create `SearchInput.tsx` component
  - [ ] Implement debounced input (500ms)
  - [ ] Add clear button
  - [ ] Add magnifying glass icon
  - [ ] Write unit tests (5 tests)
- [ ] Create `FilterChips.tsx` component
  - [ ] Display active filters as chips
  - [ ] Add remove buttons
  - [ ] Add "Clear all" button
  - [ ] Write unit tests (4 tests)
- [ ] Create `DateRangePicker.tsx` component
  - [ ] From/To date inputs
  - [ ] Validation (from <= to)
  - [ ] Write unit tests (3 tests)

### Task 2: Employee Wallet Search (AC1) - 1h
- [ ] Update `WalletPage.tsx` with search UI
  - [ ] Add SearchInput component
  - [ ] Add Skills multi-select filter
  - [ ] Add DateRangePicker
  - [ ] Implement client-side filtering logic (for <50 badges)
- [ ] Update backend API (optional server-side):
  - [ ] Add query params: `?search=keyword&skills=id1,id2&fromDate=&toDate=`
  - [ ] Implement filtering in `GET /api/badges/my-badges`
- [ ] Write tests (6 tests: search, filters, edge cases)

### Task 3: Badge Management Search Enhancement (AC2) - 1h
- [ ] Update `BadgeManagementPage.tsx`
  - [ ] Add Skills filter dropdown
  - [ ] Add Date range filter
  - [ ] Add Issuer filter (Admin view only)
  - [ ] Update existing search to use new SearchInput component
- [ ] Update backend API:
  - [ ] Extend `GET /api/badge-issuance/issued-badges` query params
  - [ ] Add skills, dateRange, issuerId filters
- [ ] Write tests (6 tests)

### Task 4: Search Performance Optimization (AC5) - 0.5h
- [ ] Implement client vs server-side decision logic
  - [ ] If badgeCount < 50 → client-side filter
  - [ ] If badgeCount >= 50 → server-side API call
- [ ] Add pagination to search results (>20 items)
- [ ] Add loading states during server-side search
- [ ] Write performance tests (2 tests)

---

## Backend API Changes

### Updated Endpoints

#### 1. GET /api/badges/my-badges (Enhanced)
**New Query Parameters:**
```
?search=keyword           // Search in badge name, issuer name
&skills=skillId1,skillId2 // Filter by skills (comma-separated UUIDs)
&fromDate=2026-01-01      // Issue date >= this date
&toDate=2026-02-01        // Issue date <= this date
&limit=20                 // Pagination limit
&offset=0                 // Pagination offset
```

**Example:**
```bash
GET /api/badges/my-badges?search=python&skills=uuid1,uuid2&fromDate=2026-01-01&limit=20
```

#### 2. GET /api/badge-issuance/issued-badges (Enhanced)
**New Query Parameters:**
```
?search=keyword           // Existing: recipient/template name
&skills=skillId1,skillId2 // NEW: Filter by skills
&issuerId=uuid            // NEW: Filter by issuer (Admin only)
&fromDate=2026-01-01      // NEW: Issue date range
&toDate=2026-02-01
&activeOnly=true          // Existing
&limit=20                 // NEW: Pagination
&offset=0
```

---

## Dev Notes

### Architecture Patterns Used
- **Reusable Search Components:** SearchInput, FilterChips, DateRangePicker
- **Conditional Filtering Strategy:** Client-side (<50) vs Server-side (50+)
- **Debounced Input:** useDebounce hook (500ms) to reduce API calls
- **Controlled Components:** All inputs managed by React state

### Source Tree Components
```
src/
├── components/
│   ├── search/
│   │   ├── SearchInput.tsx (NEW)
│   │   ├── FilterChips.tsx (NEW)
│   │   └── DateRangePicker.tsx (NEW)
│   ├── wallet/
│   │   └── TimelineView.tsx (UPDATED - add search UI)
│   └── admin/
│       └── BadgeManagementPage.tsx (UPDATED)
├── hooks/
│   ├── useDebounce.ts (NEW)
│   └── useBadgeSearch.ts (NEW - encapsulate search logic)
└── utils/
    └── searchFilters.ts (NEW - client-side filtering logic)
```

### Testing Standards
- **Component Tests:** 18 tests (SearchInput: 5, FilterChips: 4, DateRangePicker: 3, integration: 6)
- **Hook Tests:** 4 tests (useDebounce, useBadgeSearch)
- **E2E Tests:** 4 tests (wallet search, management search, filter combinations, pagination)
- **Total:** ~26 tests

### Performance Considerations
- **Debouncing:** Reduces API calls by 80% (500ms delay)
- **Client-side First:** Instant results for small datasets
- **Pagination:** Limits DOM rendering to 20 items max
- **Index Requirements:** Backend needs indexes on:
  - `badges.templateId` (already exists)
  - `badges.issuedAt` (new index needed)
  - `badgeTemplates.name` (already exists)

---

## Definition of Done

- [ ] All 5 Acceptance Criteria met
- [ ] 26 tests passing (component + hooks + E2E)
- [ ] Backend API updated with new query parameters
- [ ] Swagger documentation updated
- [ ] Search responds in <300ms for server-side queries
- [ ] No performance regression on large datasets (tested with 200+ badges)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Code review complete
- [ ] Story file updated with completion notes

---

## Dependencies

**Blocked By:**
- None (can start immediately)

**Blocks:**
- None (independent enhancement)

---

## References

- PRD FR-15: Badge Discovery & Search
- Sprint 7 UX Audit: "Search functionality lacking"
- Similar implementations: Story 9.5 (Admin UI search)
