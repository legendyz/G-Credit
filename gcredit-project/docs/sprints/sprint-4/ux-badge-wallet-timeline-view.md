# Badge Wallet - Timeline View Design

**Sprint:** Sprint 4 (Epic 5 - Employee Badge Wallet)  
**Designer:** Sally (UX Designer)  
**Date:** 2026-01-28  
**Status:** Ready for Development

---

## Overview

This document defines the **Timeline View** design for the Employee Badge Wallet, replacing the traditional grid gallery approach with a narrative-driven chronological display that tells the employee's learning journey story.

**Design Philosophy:** "Your achievements are not just a collection, but a story of growth."

---

## Design Rationale

### Why Timeline View over Grid View?

**Traditional Grid View Problems:**
- ❌ All badges appear equal in importance
- ❌ No sense of progression or growth
- ❌ Lacks emotional narrative
- ❌ Hard to see learning journey context

**Timeline View Benefits:**
- ✅ **Narrative Power:** Visualizes learning journey as a story
- ✅ **Context Preservation:** Shows when skills were acquired
- ✅ **Emotional Resonance:** "Look how far I've come!"
- ✅ **Milestone Celebration:** Natural breaking points for achievements
- ✅ **Familiar Pattern:** LinkedIn profile, GitHub contribution timeline

**User Mental Model:** Similar to LinkedIn's experience section or GitHub's contribution graph—users already understand chronological storytelling.

---

## Timeline View - Desktop Layout

### Visual Structure

```
┌────────────────────────────────────────────────────────────────────┐
│  My Badge Wallet                              [Grid] [Timeline] ✓  │
│                                                                     │
│  [Search badges...]  [Filter: All Skills ▾] [Sort: Newest First ▾]│
│                                                                     │
│  ════════════════════════════════════════════════════════════════  │
│                                                                     │
│  January 2026                                                       │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ●───────  Jan 26, 2026                                            │
│  │                                                                  │
│  │   ┌─────────────────────────────────────────────┐              │
│  │   │  [Badge Image 128x128]   Python Pro         │              │
│  │   │                           Microsoft Learn    │              │
│  │   │  ✅ Claimed                                  │  [👁️] [⬇️]  │
│  │   │  🌐 Public                                   │              │
│  │   └─────────────────────────────────────────────┘              │
│  │                                                                  │
│  ●───────  Jan 22, 2026                                            │
│  │                                                                  │
│  │   ┌─────────────────────────────────────────────┐              │
│  │   │  [Badge Image 128x128]   Data Analysis      │              │
│  │   │                           Coursera           │              │
│  │   │  ✅ Claimed                                  │  [👁️] [⬇️]  │
│  │   │  🔒 Internal                                 │              │
│  │   └─────────────────────────────────────────────┘              │
│  │                                                                  │
│  │   🎉 Milestone: 10 Badges Earned!                              │
│  │                                                                  │
│  ●───────  Jan 15, 2026                                            │
│  │                                                                  │
│  │   ┌─────────────────────────────────────────────┐              │
│  │   │  [Badge Image 128x128]   JavaScript Basics  │              │
│  │   │                           Internal Training  │              │
│  │   │  🟡 Pending                                  │  [Claim]    │
│  │   │  🔒 Internal                                 │              │
│  │   └─────────────────────────────────────────────┘              │
│  │                                                                  │
│  December 2025                                                      │
│  ────────────────────────────────────────────────────────────────  │
│  ...                                                                │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. View Toggle (Top Right)

**Component:** Segmented Control

**Layout:**
```
[Grid] [Timeline] ← Active state has blue underline + background
```

**States:**
- **Grid View:** Shows 4-column responsive grid (existing design)
- **Timeline View:** Shows chronological timeline (new design)

**Technical:**
```tsx
<div className="flex gap-1 bg-neutral-100 rounded-sm p-1">
  <button 
    className={cn(
      "px-4 py-2 rounded-sm text-sm font-medium transition-all",
      view === 'grid' 
        ? "bg-white shadow-sm text-neutral-900" 
        : "text-neutral-600 hover:text-neutral-900"
    )}
    onClick={() => setView('grid')}
  >
    Grid
  </button>
  <button 
    className={cn(
      "px-4 py-2 rounded-sm text-sm font-medium transition-all",
      view === 'timeline' 
        ? "bg-white shadow-sm text-neutral-900" 
        : "text-neutral-600 hover:text-neutral-900"
    )}
    onClick={() => setView('timeline')}
  >
    Timeline
  </button>
</div>
```

**Default:** Timeline view (more engaging for users)

---

### 2. Timeline Axis (Vertical Line)

**Visual Style:**
- **Line:** 2px solid #E1DFDD (Neutral-300)
- **Position:** 24px from left edge of container
- **Height:** Full height of timeline section
- **Z-index:** Behind badge cards (z-0)

**Timeline Dots:**
- **Size:** 16x16px circle
- **Style:** Solid fill for claimed badges, outlined for pending
- **Colors:**
  - Claimed: #107C10 (Success-600 green) with subtle pulse animation on hover
  - Pending: #FFB900 (Gold) with gentle pulse animation
  - Revoked: #D2D0CE (Neutral-400 gray), no animation
- **Position:** Centered on timeline line

**Technical:**
```css
.timeline-line {
  position: absolute;
  left: 24px;
  width: 2px;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    #E1DFDD 10%, 
    #E1DFDD 90%, 
    transparent 100%
  );
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: absolute;
  left: 16px; /* 24px - 8px (half of dot) */
  box-shadow: 0 0 0 4px white; /* White ring around dot */
}

.timeline-dot.claimed {
  background: #107C10;
  animation: pulse-subtle 2s ease-in-out infinite;
}

.timeline-dot.pending {
  background: #FFB900;
  border: 2px solid #FFB900;
  animation: pulse-pending 1.5s ease-in-out infinite;
}
```

---

### 3. Date Grouping Headers

**Component:** Month/Year Headers

**Visual Style:**
```
January 2026
────────────────────────────────────────────────────────────────
```

**Typography:**
- Font Size: 20px (H3)
- Font Weight: 600 (Semibold)
- Color: Neutral-800
- Margin Top: 48px (first section: 0)
- Margin Bottom: 16px

**Divider Line:**
- Width: 100%
- Height: 1px
- Color: Neutral-200
- Margin Bottom: 24px

**Grouping Logic:**
- Group badges by month if within current year
- Group by quarter if older than 1 year
- Group by year if older than 2 years

**Technical:**
```tsx
const groupBadgesByDate = (badges: Badge[]) => {
  const grouped = new Map<string, Badge[]>();
  
  badges.forEach(badge => {
    const date = new Date(badge.issuedAt);
    const now = new Date();
    const monthsAgo = (now.getFullYear() - date.getFullYear()) * 12 
                    + (now.getMonth() - date.getMonth());
    
    let key: string;
    if (monthsAgo < 12) {
      // Group by month: "January 2026"
      key = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } else if (monthsAgo < 24) {
      // Group by quarter: "Q1 2025"
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      key = `Q${quarter} ${date.getFullYear()}`;
    } else {
      // Group by year: "2024"
      key = date.getFullYear().toString();
    }
    
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(badge);
  });
  
  return grouped;
};
```

---

### 4. Badge Timeline Card

**Component:** Horizontal Badge Card

**Layout:**
```
●───────  Jan 26, 2026
│
│   ┌─────────────────────────────────────────────────────────────┐
│   │ [Badge     │  Badge Title                           │  [🌐]  │
│   │  Image     │  Issuer Name                           │  [👁️] │
│   │  128x128px]│  ✅ Claimed                            │  [⬇️]  │
│   └─────────────────────────────────────────────────────────────┘
│
```

**Dimensions:**
- **Total Width:** 100% of container (max 800px)
- **Height:** 140px (auto-expand if content exceeds)
- **Padding:** 16px
- **Border Radius:** 8px (rounded-md)
- **Shadow:** elevation-1 (resting), elevation-2 (hover)

**Layout Grid:**
- **Image:** 128x128px, left-aligned, 16px from left edge
- **Content:** Flex column, 16px left of image
- **Actions:** Vertical stack, 16px from right edge, right-aligned

**Content Structure:**

**Badge Title:**
- Font: 20px (H3), Semibold, Neutral-800
- Max width: 400px
- Truncate with ellipsis if exceeds

**Issuer Name:**
- Font: 14px (Body), Regular, Neutral-600
- Margin top: 4px

**Status Badge:**
- Font: 12px (Body Small), Medium
- Padding: 4px 8px
- Border radius: 4px (rounded-sm)
- Margin top: 8px
- Colors:
  - ✅ Claimed: Green background (#DFF6DD), Green text (#107C10)
  - 🟡 Pending: Yellow background (#FFF4CE), Orange text (#F7630C)
  - 🚫 Revoked: Gray background (#F3F2F1), Gray text (#605E5C)

**Visibility Indicator:**
- Icon + Text: 🌐 Public / 🔒 Internal
- Font: 12px, Regular, Neutral-500
- Margin top: 4px

**Actions Column:**
- **View Details Icon:** 👁️ (Eye icon, 20x20px)
- **Download Icon:** ⬇️ (Download icon, 20x20px)
- **Share Icon:** 🔗 (Link icon, 20x20px) - only for claimed badges
- **Claim Button:** Only for pending badges (Primary-600 button, 100px width)

**Hover State:**
- Card: Elevate to shadow-elevation-2
- Badge Image: Scale 1.05 with smooth transition
- Timeline Dot: Gentle pulse animation

**Technical:**
```tsx
<div className="relative pl-16"> {/* Space for timeline line */}
  {/* Timeline dot */}
  <div className={cn(
    "timeline-dot absolute top-8",
    badge.status === 'CLAIMED' && "claimed",
    badge.status === 'PENDING' && "pending",
    badge.status === 'REVOKED' && "revoked"
  )} />
  
  {/* Date label */}
  <div className="text-sm text-neutral-600 mb-3 pl-4">
    {formatDate(badge.issuedAt, 'MMM DD, YYYY')}
  </div>
  
  {/* Badge card */}
  <Card className="ml-4 hover:shadow-elevation-2 transition-shadow group">
    <div className="flex items-start gap-4 p-4">
      {/* Badge image */}
      <img 
        src={badge.imageUrl} 
        alt={badge.title}
        className="w-32 h-32 rounded-md group-hover:scale-105 transition-transform"
      />
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-neutral-800 truncate">
          {badge.title}
        </h3>
        <p className="text-sm text-neutral-600 mt-1">{badge.issuer}</p>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={getStatusVariant(badge.status)}>
            {getStatusIcon(badge.status)} {badge.status}
          </Badge>
          <span className="text-xs text-neutral-500">
            {badge.visibility === 'PUBLIC' ? '🌐 Public' : '🔒 Internal'}
          </span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="icon" onClick={() => viewDetails(badge.id)}>
          <Eye className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => download(badge.id)}>
          <Download className="w-5 h-5" />
        </Button>
        {badge.status === 'CLAIMED' && (
          <Button variant="ghost" size="icon" onClick={() => share(badge.id)}>
            <Share className="w-5 h-5" />
          </Button>
        )}
        {badge.status === 'PENDING' && (
          <Button onClick={() => claimBadge(badge.id)}>
            Claim
          </Button>
        )}
      </div>
    </div>
  </Card>
</div>
```

---

### 5. Milestone Markers

**Component:** Celebration Milestone Card

**When to Show:**
- Every 10 badges earned
- Completion of specific skill tracks (e.g., "Python Track Complete")
- Anniversary milestones (e.g., "1 year on G-Credit")

**✅ Admin Configuration Required:**
- **Decision:** Milestone triggers must be configurable by administrators
- **Configuration UI:** Admin panel to define:
  - Badge count milestones (default: 10, 25, 50, 100)
  - Skill track completion definitions
  - Anniversary dates and messages
  - Custom milestone rules (e.g., "All Python badges earned")
- **Implementation:** Backend configuration table + Admin UI (Epic 12)

**Visual Style:**
```
│   
│   🎉 Milestone: 10 Badges Earned!
│   Keep up the great work! You've achieved 10 credentials.
│   
```

**Layout:**
- **Background:** Gradient from Primary-500 to Primary-600
- **Text Color:** White
- **Icon:** 🎉 (24x24px)
- **Padding:** 16px 24px
- **Border Radius:** 8px
- **Margin:** 16px vertical
- **Position:** Between timeline cards at chronologically appropriate point

**Typography:**
- Title: 16px (Body Large), Semibold
- Subtitle: 14px (Body), Regular

**Animation:**
- Fade in on scroll (when entering viewport)
- Subtle scale animation on first view

**Technical:**
```tsx
<div className="relative pl-16 my-4">
  <div className="ml-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-md p-4 text-white">
    <div className="flex items-center gap-3">
      <span className="text-2xl">🎉</span>
      <div>
        <p className="font-semibold">Milestone: 10 Badges Earned!</p>
        <p className="text-sm opacity-90">Keep up the great work! You've achieved 10 credentials.</p>
      </div>
    </div>
  </div>
</div>
```

---

## Mobile Timeline View (≤768px)

### Layout Adaptations

**Simplified Structure:**
```
┌──────────────────────────────┐
│ My Badge Wallet       [≡]    │
│                               │
│ January 2026                  │
│ ─────────────────────────────│
│                               │
│ ● Jan 26, 2026               │
│ │ ┌───────────────────────┐  │
│ │ │ [Badge Image 96x96]   │  │
│ │ │ Python Pro            │  │
│ │ │ Microsoft Learn       │  │
│ │ │ ✅ Claimed 🌐 Public  │  │
│ │ │ [View] [Download]     │  │
│ │ └───────────────────────┘  │
│ │                            │
│ ● Jan 22, 2026               │
│ │ ┌───────────────────────┐  │
│ │ │ [Badge Image 96x96]   │  │
│ │ │ ...                    │  │
└──────────────────────────────┘
```

**Changes from Desktop:**
- Timeline line: 16px from left (instead of 24px)
- Timeline dot: 12x12px (instead of 16x16px)
- Badge image: 96x96px (instead of 128x128px)
- Card padding: 12px (instead of 16px)
- Actions: Horizontal row (instead of vertical column)
- Font sizes: Reduced by 2px across the board

**Touch Targets:**
- All buttons: Minimum 44x44px
- Card: Entire card is tappable to open details

---

## Interaction Behaviors

### 1. Infinite Scroll / Pagination

**Strategy:** Infinite scroll with "Load More" fallback

**Behavior:**
- Initially load 20 most recent badges
- When user scrolls to bottom, automatically load next 20
- Show loading skeleton during fetch
- If API error: Show "Load More" button

**Loading State:**
```
Loading more badges...
[Skeleton badge card]
[Skeleton badge card]
```

**Technical:**
```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['badges', 'timeline'],
  queryFn: ({ pageParam = 1 }) => fetchBadges(pageParam, 20),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});

// Intersection Observer for infinite scroll
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { threshold: 0.5 }
  );
  
  if (sentinelRef.current) observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage]);
```

---

### 2. Smooth Scroll Animations

**Fade-in on Scroll:**
- Badge cards fade in (opacity 0 → 1) as they enter viewport
- Stagger animation: Each card delayed by 50ms from previous
- Duration: 300ms with ease-out

**Scroll to Date:**
- Month/year headers are sticky during scroll
- Clicking a date in mini-calendar (future feature) scrolls to that month

**Technical:**
```tsx
// Framer Motion for scroll animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  <BadgeCard {...badge} />
</motion.div>
```

---

### 3. Filter & Sort Persistence

**Behavior:**
- Filter/sort selections persist when switching between Grid/Timeline views
- State saved to URL query params: `?view=timeline&filter=python&sort=newest`
- Allows bookmarking and sharing filtered views

**Technical:**
```tsx
const [searchParams, setSearchParams] = useSearchParams();

const view = searchParams.get('view') || 'timeline';
const filter = searchParams.get('filter') || 'all';
const sort = searchParams.get('sort') || 'newest';

const updateView = (newView: string) => {
  setSearchParams({ view: newView, filter, sort });
};
```

---

## Accessibility

### Keyboard Navigation

**Tab Order:**
1. View toggle (Grid/Timeline)
2. Search input
3. Filter dropdown
4. Sort dropdown
5. First badge card → All actions (View, Download, Share, Claim)
6. Next badge card... (repeat)

**Keyboard Shortcuts:**
- `Tab` / `Shift+Tab`: Navigate between elements
- `Enter` / `Space`: Activate buttons
- `Arrow Up/Down`: Navigate between badge cards (custom implementation)
- `/`: Focus search input (like GitHub)

**Technical:**
```tsx
<div 
  role="article" 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') viewDetails(badge.id);
    if (e.key === 'ArrowDown') focusNextBadge();
    if (e.key === 'ArrowUp') focusPrevBadge();
  }}
>
  {/* Badge card content */}
</div>
```

---

### Screen Reader Support

**ARIA Labels:**
```tsx
<div role="feed" aria-label="Badge timeline">
  <section aria-labelledby="month-jan-2026">
    <h2 id="month-jan-2026">January 2026</h2>
    
    <article aria-label="Python Pro badge, earned January 26, 2026">
      <img alt="Python Pro badge" src={...} />
      <h3>Python Pro</h3>
      <p>Issued by Microsoft Learn</p>
      <span role="status" aria-label="Status: Claimed">✅ Claimed</span>
      <span aria-label="Visibility: Public">🌐 Public</span>
      
      <button aria-label="View badge details">
        <Eye aria-hidden="true" />
      </button>
    </article>
  </section>
</div>
```

**Live Region for Dynamic Content:**
```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {isFetchingNextPage && "Loading more badges..."}
  {claimSuccess && "Badge claimed successfully!"}
</div>
```

---

## Performance Considerations

### Virtualization for Large Lists

**Decision:** ⏸️ **Deferred to Performance Optimization Sprint** (not Sprint 4)

**Rationale:**
- Sprint 4 focuses on core Timeline View functionality
- Most users will have <50 badges initially (MVP scope)
- Virtual scrolling adds complexity that can be addressed later
- Standard React rendering sufficient for initial user base

**When to Implement:**
- Performance optimization sprint (after MVP)
- When user testing shows scroll performance issues
- When average user has 100+ badges

**Future Implementation (Reference):**
```tsx
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

<AutoSizer>
  {({ height, width }) => (
    <List
      height={height}
      width={width}
      itemCount={badges.length}
      itemSize={(index) => getItemHeight(badges[index])} // Dynamic height
      overscanCount={3} // Render 3 items outside viewport
    >
      {({ index, style }) => (
        <div style={style}>
          <BadgeTimelineCard badge={badges[index]} />
        </div>
      )}
    </List>
  )}
</AutoSizer>
```

### Image Lazy Loading

**Strategy:**
- Use native `loading="lazy"` attribute
- Placeholder blur effect during load
- Progressive image loading (low-res → high-res)

**Technical:**
```tsx
<img 
  src={badge.imageUrl}
  alt={badge.title}
  loading="lazy"
  className="w-32 h-32 rounded-md"
  onLoad={(e) => e.currentTarget.classList.add('loaded')}
  style={{ 
    backgroundImage: `url(${badge.thumbnailUrl})`,
    backgroundSize: 'cover'
  }}
/>

// CSS
img {
  filter: blur(10px);
  transition: filter 0.3s;
}
img.loaded {
  filter: none;
}
```

---

## Design Deliverables Summary

✅ **Completed:**
1. Visual structure and layout specifications
2. Component-level specifications (5 components)
3. Desktop and mobile responsive behavior
4. Interaction patterns and animations
5. Accessibility guidelines (keyboard, screen reader, ARIA)
6. Performance optimization strategies
7. Technical implementation guidance with code examples

**Ready for:** Sprint 4 Development → Winston (Architect) → Bob (Scrum Master) → Dev Team

---

## Next Steps
✅ Team Decisions Confirmed (2026-01-28):**
- ✅ Virtualization: Deferred to performance optimization sprint
- ✅ Date Navigation: **YES** - Include sidebar mini-calendar for quick jumps to specific months
- ✅ Milestone Configuration: **YES** - Must be admin-configurable via Admin Panel

---

## Date Navigation Sidebar (Additional Feature)

**Decision:** ✅ **Include in Sprint 4**

**Component:** Mini-Calendar Sidebar Navigation

**Layout:**
```
┌────────────────────┐
│  Quick Jump        │
│                    │
│  📅 2026           │
│  • January (5)     │ ← Currently viewing
│  • December (3)    │
│                    │
│  📅 2025           │
│  • November (2)    │
│  • October (4)     │
│  • September (1)   │
│  • August (0)      │
│  ...               │
└────────────────────┘
```

**Specifications:**
- **Position:** Left sidebar (fixed or collapsible)
- **Width:** 240px (desktop), collapsible on mobile
- **Items:** Year + Month with badge count
- **Interaction:** Click month → smooth scroll to that section
- **Visual:** Active month highlighted (Primary-600 background)
- **Badge Count:** Shows number of badges in parentheses
- **Empty Months:** Gray text, not clickable

**Technical:**
```tsx
function DateNavigationSidebar({ badges, currentMonth }: Props) {
  const groupedByMonth = groupBadgesByMonth(badges);
  
  return (
    <aside className="w-60 bg-white border-r border-neutral-200 p-4 sticky top-0 h-screen overflow-y-auto">
      <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Quick Jump
      </h3>
      
      {Array.from(groupedByMonth.entries()).map(([year, months]) => (
        <div key={year} className="mb-4">
          <p className="text-sm font-medium text-neutral-700 mb-2">📅 {year}</p>
          <ul className="space-y-1">
            {months.map(([month, count]) => (
              <li key={month}>
                <button
                  onClick={() => scrollToMonth(month)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded text-sm transition-colors",
                    currentMonth === month 
                      ? "bg-primary-600 text-white font-medium"
                      : "text-neutral-700 hover:bg-neutral-100",
                    count === 0 && "text-neutral-400 cursor-not-allowed"
                  )}
                  disabled={count === 0}
                >
                  • {month} ({count})
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
```
4. **Component Development:** Dev team implements Timeline View
5. **QA Testing:** Validate accessibility, performance, and UX flow

---

**Questions for Team:**
- Should we implement virtualization from Sprint 4, or defer to performance optimization sprint?
- Do we want a mini-calendar date navigation in the sidebar for quick jumps?
- Should milestone cards be configurable by admins (what triggers a milestone)?
