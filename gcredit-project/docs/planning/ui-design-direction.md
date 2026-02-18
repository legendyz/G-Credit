# G-Credit UI Design Direction Specification

**Created:** 2026-02-18  
**Author:** Sally (UX Designer) — via Party Mode team discussion  
**Participants:** John (PM), Winston (Architect), Sally (UX Designer), Bob (Scrum Master), LegendZhu (Product Owner)  
**Target Sprint:** Sprint 13 (UI Polish Pass)  
**Status:** Approved by Product Owner

---

## 1. Executive Summary

G-Credit v1.1.0 has a functionally complete UI built across 11 sprints. The current interface is "engineer-built functional" — it works, but lacks the visual polish and cohesive identity expected of an enterprise HR platform. This document defines the **design direction, reference products, and specific component-level improvement targets** for the UI Polish Pass in Sprint 13.

### Design Philosophy

> Ship a UI that feels like it was **designed by a product company**, not assembled by a dev team sprint-by-sprint. Users should feel G-Credit is trustworthy, professional, and delightful — worthy of representing their professional achievements.

### Key Decisions from Team Discussion

| Decision | Detail |
|----------|--------|
| No A/B testing | Pre-pilot stage (<100 users). Qualitative feedback > A/B data |
| No dual UI maintenance | Old UI preserved in `v1.1.0` git tag + `main` branch for demos |
| Build first, polish second | Sprint 12 builds new management UIs → Sprint 13 applies unified polish |
| Design spec before dev | This document guides Sprint 13 implementation with concrete targets |

---

## 2. Current UI Inventory

### Tech Stack
- **Component Library:** Shadcn/ui (New York style)
- **CSS:** Tailwind CSS 4.1.18 + @tailwindcss/postcss
- **Icons:** Lucide React
- **Charts:** Recharts 3.x
- **Fonts:** Inter (sans), Cascadia Code (mono)
- **Color Base:** Microsoft Fluent-inspired (#0078D4 blue primary)
- **Layout:** Top navbar (`<Navbar>`) + desktop/mobile responsive (`<MobileNav>`)
- **Page Wrapper:** `<PageTemplate>` with title/description/actions

### Existing UI Components (14 Shadcn/ui)
`button`, `alert`, `card`, `input`, `label`, `FormError`, `dialog`, `skeleton`, `select`, `StatusBadge`, `SkipLink`, `textarea`

### Current Pages (28 files)
- **Dashboards (4):** Admin, Employee, Issuer, Manager
- **Badge Operations (5):** Issue, Bulk Issuance, Claim, Verify, Embed
- **Admin (3):** Badge Management, Template List, Template Form
- **User/Profile (3):** Profile, User Management, Analytics
- **Auth/Error (3):** Login, 404, 403 Access Denied

### Current Design Themes
- **Brand Colors:** Defined in `index.css` with Microsoft Fluent palette (brand-50 to brand-900)
- **Semantic Colors:** Success (#107C10), Warning (#F7630C), Error (#D13438), Info (#0078D4)
- **Gold accent:** #FFB900 (used for badge/achievement highlights)
- **Elevation:** 4-level shadow system (elevation-1 to elevation-4)
- **Dark mode:** CSS variables defined but likely untested/unpolished

---

## 3. Reference Products & What to Borrow

### 3.1 Credly (credly.com) — Digital Badge Platform (Direct Competitor)

**Relevance:** G-Credit's closest functional ancestor. The benchmark for how badges should *look and feel*.

**Key Patterns to Adopt:**
- **Badge cards as hero elements.** Large badge images (not thumbnails) with clear visual status indicators. Badges should feel like *achievements*, not database rows in a table.
- **Profile-as-portfolio.** Earner profiles are designed to impress — grid layout with hover reveals, skill highlights, and a professional "showcase" feeling.
- **Trust-first verification.** Green checkmark seal, issuer logo prominently displayed, simple "Verified" banner. Trust is communicated through visual design, not just text.

**Specific Adaptations for G-Credit:**
- Badge card redesign with larger images, glow/shadow effects, colored status chips
- Employee Dashboard → "trophy case" mindset
- Verification page → green seal + issuer branding

---

### 3.2 LinkedIn Learning (linkedin.com/learning) — Credential Display Expert

**Relevance:** The world's largest professional network — sets expectations for how achievements are displayed and celebrated.

**Key Patterns to Adopt:**
- **Visual progress tracking.** Ring progress indicators, completion percentages, streak counters. Users *feel* their progress rather than reading numbers.
- **Celebration-first certificate moment.** Full-screen modal with animation, social share prompts, beautiful certificate image when earned.
- **Elegant skill pills.** Rounded, colored tags with clear categorization — easy to scan at a glance.

**Specific Adaptations for G-Credit:**
- Milestone progress → ring indicators instead of flat progress bars
- Badge claim → full-screen celebration modal with animation + immediate share prompt
- Skill display → colored category tags with hover tooltips

---

### 3.3 Notion (notion.so) — Admin UX Benchmark

**Relevance:** Gold standard for clean data management interfaces. G-Credit's admin pages (User Management, Skill Management, Badge Management) should aspire to this level of clarity.

**Key Patterns to Adopt:**
- **Beautiful data tables.** Clean borders, generous row height, sortable columns with visual indicators. Data feels approachable, not overwhelming.
- **Empty states with personality.** Illustrations, clear CTAs, helpful hints. "No items yet" becomes an invitation, not a dead end.
- **Sidebar navigation.** Persistent navigation that lets you see context and content simultaneously.

**Specific Adaptations for G-Credit:**
- All admin data tables → more whitespace, better column sizing, row hover states, inline action buttons
- All empty states → custom SVG illustrations + action CTAs
- Admin layout → collapsible sidebar navigation (see Section 5.1)

---

### 3.4 Vercel Dashboard (vercel.com/dashboard) — Modern Enterprise UI

**Relevance:** The benchmark for modern, clean SaaS dashboards. Sets the bar for how KPI cards and metrics should look.

**Key Patterns to Adopt:**
- **Card hierarchy.** Primary metrics are large and bold. Secondary info is muted. You know instantly what matters.
- **Subtle animations.** Cards fade in on load, numbers count up, charts draw progressively. The interface feels alive without being distracting.
- **Beautiful dark mode.** High contrast, polished borders, glass-morphism effects that don't sacrifice readability.

**Specific Adaptations for G-Credit:**
- Dashboard metric cards → hierarchical sizing (primary 2x), animated count-up numbers, trend arrows with color
- Page transitions → subtle fade-in via Framer Motion
- Dark mode audit and polish

---

### 3.5 Lattice (lattice.com) — HR/People Platform

**Relevance:** Direct competitor space in enterprise HR tech. People-first design philosophy.

**Key Patterns to Adopt:**
- **Avatars everywhere.** User lists, activity feeds, team views all show human faces. Makes the platform feel human rather than a spreadsheet.
- **Rich activity feeds.** Avatar + action icon + context + timestamp, with color-coded action types. Scannable at a glance.
- **Visual skill tracking.** Radar charts for skill profiles, progress bars for goals. Data visualization, not just lists.

**Specific Adaptations for G-Credit:**
- Activity feeds → avatar + color-coded action icon + rich description
- Skill profiles → consider radar/spider chart visualization for employee skill categories
- Manager Dashboard → team capability heatmap or visualization

---

## 4. G-Credit Visual Identity Refinement

### 4.1 Color Palette

The existing Microsoft Fluent blue palette is retained as the primary brand color. We add semantic accent colors for the credentialing domain.

```
PRIMARY (Brand Blue — existing)
  brand-600: #0078D4  ← primary actions, links, sidebar active
  brand-500: #2B88D8  ← hover states
  brand-100: #CCE7FF  ← selected backgrounds, highlights

ACHIEVEMENT GOLD (existing, expanded usage)
  gold:       #FFB900  ← badge icons, milestone markers, earned indicators
  gold-light: #FFF100  ← achievement backgrounds, celebration accents

VERIFICATION GREEN (existing semantic, elevated)
  success:       #107C10  ← verified badge seal, active status
  success-light: #DFF6DD  ← verified badge background, positive callouts

STATUS COLORS (existing, consistent application)
  warning:  #F7630C  ← pending, expiring soon
  error:    #D13438  ← revoked, failed, destructive actions
  info:     #0078D4  ← informational banners

NEUTRAL (existing, enforce usage)
  neutral-50:  #FAFAFA  ← page backgrounds
  neutral-100: #F3F2F1  ← card backgrounds, section dividers
  neutral-600: #605E5C  ← secondary text, descriptions
  neutral-900: #201F1E  ← primary text, headings
```

### 4.2 Typography

Retain existing `Inter` (sans) and `Cascadia Code` (mono) with emphasis on hierarchy:

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 4.25rem | Semibold | Hero numbers (dashboard primary metrics) |
| H1 | 2.625rem | Semibold | Page titles (rare, reserved) |
| H2 | 1.75rem | Semibold | Section titles, card titles |
| H3 | 1.25rem | Medium | Subsections, modal titles |
| Body Large | 1rem | Regular | Primary content text |
| Body | 0.875rem | Regular | Default body text, table content |
| Body Small | 0.75rem | Regular | Captions, metadata, timestamps |

**New emphasis:** Use `Display` size for dashboard hero numbers (total badges issued, active users). Currently under-utilized.

### 4.3 Spacing System

Standardize on an 8px grid rhythm:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (pill padding, icon margins) |
| `space-2` | 8px | Default gap (inline elements) |
| `space-3` | 12px | Card internal padding |
| `space-4` | 16px | Section gaps, card padding |
| `space-6` | 24px | Section separators, page sidebar gap |
| `space-8` | 32px | Page top/bottom padding |
| `space-12` | 48px | Major section breaks |

### 4.4 Elevation & Shadows

Existing 4-level shadow system is good. Enforce consistent application:

| Level | CSS Token | Usage |
|-------|-----------|-------|
| Elevation 1 | `shadow-elevation-1` | Cards at rest, dropdown menus |
| Elevation 2 | `shadow-elevation-2` | Cards on hover, active sidebar items |
| Elevation 3 | `shadow-elevation-3` | Modals, floating panels |
| Elevation 4 | `shadow-elevation-4` | Toast notifications, full-screen overlays |

**New:** Add a `badge-glow` shadow for badge cards:
```css
--shadow-badge-glow: 0 0 20px rgba(255, 185, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
```

---

## 5. Component-Level Design Targets

### 5.1 Navigation: Admin Sidebar (HIGH PRIORITY)

**Current:** Top `<Navbar>` with horizontal links for all roles.  
**Target:** Collapsible sidebar for admin/issuer views; retain top nav for employee views.

**Design Spec:**
- Fixed sidebar on left, 280px expanded / 64px collapsed
- Sidebar sections: Dashboard, Badge Management, User Management, Skills, Milestones, Analytics, Settings
- Each section has icon (Lucide) + label
- Active route highlighted with `brand-600` left border + `brand-100` background
- Collapse toggle at bottom of sidebar
- Mobile: sidebar becomes overlay drawer (existing `<MobileNav>` pattern)
- Employee role: keep current top nav (simpler experience, fewer navigation needs)

**Implementation Notes:**
- Shadcn/ui has a `sidebar` component — use it as base
- Create `<AdminLayout>` wrapper alongside existing `<Layout>`
- Role-based layout selection in router: `role === 'ADMIN' || role === 'ISSUER' ? <AdminLayout> : <Layout>`
- CSS variables for sidebar already defined in `index.css` (`--sidebar`, `--sidebar-foreground`, etc.)

**Reference:** Notion sidebar, Vercel dashboard sidebar

**Effort:** ~8h

---

### 5.2 Badge Cards (HIGH PRIORITY)

**Current:** Functional card with small badge image, text-heavy layout.  
**Target:** Badge images as visual hero, status chips, achievement-oriented design.

**Design Spec:**
- Badge image: minimum 120px × 120px (currently likely smaller)
- Image container: circular or rounded-square with subtle `badge-glow` shadow
- Status chip: colored rounded pill below or overlaid on image
  - CLAIMED: `success` green + checkmark icon
  - PENDING: `warning` orange + clock icon
  - REVOKED: `error` red + x-circle icon
  - EXPIRED: `neutral-500` gray + alert icon
- Card hover: elevation-1 → elevation-2, subtle scale(1.02) transform
- Skills displayed as colored pills (see 5.5)
- Issuer name with small avatar/icon
- Date in `Body Small` / muted color

**Reference:** Credly badge cards

**Effort:** ~6h

---

### 5.3 Dashboard Metric Cards (HIGH PRIORITY)

**Current:** Uniform 4-column grid, same size cards, static numbers.  
**Target:** Hierarchical sizing, animated numbers, trend indicators.

**Design Spec:**
- Primary metrics (2 cards): span 2 columns on desktop, use `Display` font size for numbers
- Secondary metrics (2-4 cards): span 1 column, use `H2` font size
- Animated count-up on page load (Framer Motion `useSpring` or `react-countup`)
- Trend indicator: small colored arrow + percentage change
  - Up + green = positive
  - Down + red = negative
  - Neutral = `neutral-500` dash
- Metric icon: larger (32px), positioned top-left of card
- Subtle entry animation: cards fade + slide up on load (staggered 100ms delay each)

**Reference:** Vercel dashboard, Stripe dashboard

**Effort:** ~4h

**New dependency:** Consider adding `framer-motion` for animations (lightweight, tree-shakeable).

---

### 5.4 Data Tables (MEDIUM PRIORITY)

**Current:** Basic table implementations across Badge Management, User Management.  
**Target:** Notion-style clean tables with generous spacing and clear actions.

**Design Spec:**
- Row height: minimum 52px (currently likely tighter)
- Row hover: subtle `neutral-50` background
- Column headers: `Body Small` uppercase, `neutral-500` color, bottom border
- Sortable columns: show sort icon (chevron-up/down), active sort in `brand-600`
- Actions column: icon buttons (eye, edit, trash) visible on row hover, not always visible
- Pagination: bottom-right, showing "Showing 1-10 of 47"
- Search input: top-left, with search icon, subtle border, focus ring
- Filter chips: horizontal pill row above table for active filters

**Reference:** Notion tables, GitHub issues list

**Effort:** ~6h (applied across all table pages)

---

### 5.5 Skill Tags (MEDIUM PRIORITY)

**Current:** Basic rounded pills rendering text (previously showed UUIDs, now fixed).  
**Target:** Category-colored tags with clear visual grouping.

**Design Spec:**
- Each skill category gets a consistent color (map category ID → color index):
  - Technical: `brand-100` bg / `brand-700` text
  - Leadership: `gold-light` bg / `neutral-800` text
  - Communication: `success-light` bg / `success` text
  - Creative: `chart-4` purple bg / white text
  - (extend as needed)
- Pill shape: rounded-full, `px-3 py-1`, `Body Small` font
- Hover: tooltip showing skill description and category name
- In badge cards: max 3 visible + "+N more" pill if overflow

**Reference:** LinkedIn Learning skill tags, GitHub topic tags

**Effort:** ~3h

---

### 5.6 Empty States (MEDIUM PRIORITY)

**Current:** Text-based `<EmptyState>` and `<NoActivityState>` components with basic messaging.  
**Target:** Illustrated empty states with personality and clear CTAs.

**Design Spec:**
- Each major empty state gets a simple SVG illustration (64px-96px):
  - No badges yet → Shield/award outline illustration
  - No skills configured → Tag/puzzle piece illustration
  - No users found → People silhouettes illustration
  - No activity → Clock/timeline illustration
  - No milestones → Flag/target illustration
- Text below illustration: `H3` title + `Body` description
- CTA button: primary button for the most logical next action ("Issue First Badge", "Add Skills", etc.)
- Muted color treatment: illustrations in `neutral-300`, text in `neutral-600`

**Reference:** Notion, Slack, Linear empty states

**Effort:** ~4h (illustrations can be sourced from undraw.co or created as simple SVGs)

**Note:** SVG illustrations should be placed in `frontend/src/assets/illustrations/` as React components for easy theming.

---

### 5.7 Activity Feed (MEDIUM PRIORITY)

**Current:** Text rows in Admin Dashboard with `description` field rendered directly.  
**Target:** Rich activity feed with avatars, action icons, and structured display.

**Design Spec:**
- Each activity item: `[Avatar] [Action Icon] [Rich Description] [Timestamp]`
- Avatar: 32px circle, user initials fallback (gradient background per user)
- Action icons by type, color-coded:
  - ISSUED: `Award` icon, `brand-600` blue
  - CLAIMED: `CheckCircle` icon, `success` green
  - REVOKED: `XCircle` icon, `error` red
  - NOTIFICATION_SENT: `Mail` icon, `neutral-500` gray
  - CREATED: `PlusCircle` icon, `brand-500` blue
  - UPDATED: `Edit` icon, `warning` orange
- Timestamp: relative ("2 hours ago"), `Body Small`, `neutral-500`
- Hover: subtle background highlight

**Reference:** Lattice activity feed, GitHub activity timeline

**Effort:** ~4h

---

### 5.8 Badge Claim Celebration (LOW PRIORITY — HIGH DELIGHT)

**Current:** `BadgeEarnedCelebration` component exists with confetti animations (CSS keyframes defined).  
**Target:** Enhanced full-screen celebration moment with share prompt.

**Design Spec:**
- Full-screen overlay (z-50) with animated entrance
- Center: large badge image (200px+) with glow animation
- Confetti particles (existing `animate-confetti` keyframe, enhance with variety)
- "Congratulations!" in `Display` font, gold color
- Badge name in `H2`
- Two CTA buttons: "Share on LinkedIn" (primary) + "View in Wallet" (secondary)
- Auto-dismiss after 5s OR click outside
- Celebration sound: optional (future, not Sprint 13)

**Reference:** LinkedIn Learning certificate modal, Duolingo lesson complete

**Effort:** ~4h (building on existing `BadgeEarnedCelebration` component)

---

### 5.9 Milestone Progress (LOW PRIORITY)

**Current:** Flat progress bars on Employee Dashboard.  
**Target:** Ring/circular progress indicators with animated fill.

**Design Spec:**
- SVG ring indicator: 64px diameter, `brand-600` fill, `neutral-200` track
- Percentage number centered inside ring
- Animation: ring fill from 0% → current on page load
- Below ring: milestone title in `Body`, progress text in `Body Small`
- Completed milestones: gold ring with checkmark overlay

**Reference:** LinkedIn Learning progress rings, Apple Watch activity rings

**Effort:** ~4h

---

## 6. Implementation Strategy

### Sequencing (Sprint 13)

| Order | Item | Depends On | Effort |
|-------|------|-----------|--------|
| 1 | Admin Sidebar Layout (`<AdminLayout>`) | — | 8h |
| 2 | Milestone Admin UI (uses new layout) | #1 | 16-20h |
| 3 | Evidence Admin Completion (uses new layout) | #1 | 8-12h |
| 4 | Dashboard Card Hierarchy + Animations | #1 | 4h |
| 5 | Badge Card Visual Upgrade | — | 6h |
| 6 | Data Table Styling | — | 6h |
| 7 | Skill Tags Restyling | — | 3h |
| 8 | Activity Feed Enhancement | — | 4h |
| 9 | Empty State Illustrations | — | 4h |
| 10 | Claim Celebration Enhancement | — | 4h |
| 11 | Milestone Progress Rings | — | 4h |

**Items 4-11 (polish) total: ~35h.** May need to trim scope — prioritize #4, #5, #6 as the highest visual impact.

### New Dependencies to Evaluate

| Package | Purpose | Size Impact | Decision |
|---------|---------|-------------|----------|
| `framer-motion` | Card animations, count-up, page transitions | ~32KB gzip | ✅ Recommended (tree-shakeable, widely adopted) |
| `react-countup` | Animated numbers on dashboard | ~3KB | Optional (can implement with framer-motion) |

### CSS Additions (in `index.css`)

```css
/* Badge glow — for badge card hero images */
--shadow-badge-glow: 0 0 20px rgba(255, 185, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);

/* Card hover transition — standard for all interactive cards */
.card-interactive {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card-interactive:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-elevation-2);
}
```

---

## 7. Quality Checklist for UI Polish Pass

Before marking the polish sprint complete, verify:

- [ ] Admin sidebar navigation functional on desktop and mobile
- [ ] All admin pages render correctly in new `<AdminLayout>`
- [ ] Employee pages still use top nav (`<Layout>`)
- [ ] Badge cards show hero images with glow effect
- [ ] Dashboard primary metrics use Display font + animated count-up
- [ ] All data tables have consistent row height, hover states, action columns
- [ ] Skill tags are category-colored across all pages they appear
- [ ] No empty state shows bare "No data" text — all have illustration + CTA
- [ ] Activity feed shows avatars + colored action icons
- [ ] Dark mode renders correctly across all updated pages
- [ ] All existing 1,307+ tests still pass (0 regressions)
- [ ] Lighthouse accessibility score maintained or improved
- [ ] Pages load without layout shift (CLS < 0.1)
- [ ] No new ESLint warnings introduced

---

## 8. What This Document Does NOT Cover

- **Phase 2 integration UIs** (LMS, HRIS, Teams) — deferred until pilot validates need
- **A/B testing infrastructure** — not needed at pre-pilot stage
- **Mobile app design** — web-only for now
- **Full brand identity** (logo redesign, marketing materials) — out of scope
- **Async bulk processing UI** (TD-016) — deprioritized, revisit at pilot
- **LinkedIn OG meta tags** (TD-030) — deprioritized, revisit at pilot

---

## Appendix A: Discussion Context

This design direction was established during a Party Mode discussion on 2026-02-18, involving:

- **📋 John (PM):** Framed the strategic question — validate before adding features. Advocated for feature completeness + visual quality as prerequisites for pilot.
- **🏗️ Winston (Architect):** Assessed technical readiness, flagged TD-010 (Evidence) and layout refactor as architectural concerns. Recommended building new pages before polishing.
- **🎨 Sally (UX Designer):** Proposed 5 reference products (Credly, LinkedIn Learning, Notion, Vercel, Lattice) with specific patterns to adapt. Defined the 3 high-impact priorities: sidebar, badge cards, dashboard hierarchy.
- **🏃 Bob (Scrum Master):** Structured Sprint 12/13 split with clear dependencies. Sequenced sidebar layout as Sprint 13 foundation before polish work.
- **LegendZhu (Product Owner):** Prioritized management UI completeness (User, Skills, Evidence) + UI beautification. Approved Sally's reference-based design direction. Confirmed demo strategy (main branch = always demo-ready, no A/B needed).
