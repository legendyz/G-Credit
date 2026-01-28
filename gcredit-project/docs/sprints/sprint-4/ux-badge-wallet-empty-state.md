# Badge Wallet - Empty State Design

**Sprint:** Sprint 4 (Epic 5 - Employee Badge Wallet)  
**Designer:** Sally (UX Designer)  
**Date:** 2026-01-28  
**Status:** Ready for Development

---

## Overview

Empty states are critical first impressions for new employees or users who haven't earned badges yet. This document defines the **Empty State Design** for the Badge Wallet to ensure a welcoming, motivational, and actionable experience.

**Design Philosophy:** "Empty states are not dead ends—they're invitations to get started."

---

## Empty State Scenarios

### Scenario 1: New Employee (No Badges Ever)

**Context:**
- Brand new employee, just logged in for first time
- Has never earned or been issued any badges
- Needs clear guidance on what badges are and how to get them

**User Goal:** Understand what G-Credit is and how to earn first badge

**Emotional Tone:** Welcoming, encouraging, educational

---

### Scenario 2: No Claimed Badges (Pending Badges Exist)

**Context:**
- Employee has been issued badges but hasn't claimed any yet
- Likely received email notification but hasn't acted
- Needs reminder to check notifications

**User Goal:** Claim pending badges

**Emotional Tone:** Gentle nudge, action-oriented

---

### Scenario 3: All Badges Revoked (Edge Case)

**Context:**
- Employee had badges but all were revoked (rare, likely policy violation)
- Sensitive situation requiring careful messaging
- Needs support contact info

**User Goal:** Understand why and what to do next

**Emotional Tone:** Neutral, supportive, professional

---

### Scenario 4: Filtered Results Empty

**Context:**
- User applied filter/search with no matching results
- Not a true empty state—badges exist, just hidden by filter
- Needs clear indication that filter is active

**User Goal:** Adjust filter to see badges

**Emotional Tone:** Helpful, not frustrating

---

## Design Specifications

### Scenario 1: New Employee Empty State

**Layout (Desktop):**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        [Illustration]                           │
│                     🎓 Badge Wallet Icon                        │
│                      (256x256px, subtle)                        │
│                                                                 │
│              Welcome to Your Badge Wallet!                      │
│                                                                 │
│   Your digital credentials will appear here as you earn them.  │
│      Start your learning journey and unlock achievements!      │
│                                                                 │
│              ┌──────────────────────────┐                      │
│              │  Browse Available Badges │                      │
│              └──────────────────────────┘                      │
│                                                                 │
│              ┌──────────────────────────┐                      │
│              │   Learn How to Earn      │                      │
│              └──────────────────────────┘                      │
│                                                                 │
│              ─────────────────────────────                     │
│                                                                 │
│              💡 Did you know?                                  │
│              Badges validate your skills for internal          │
│              opportunities and external job applications.      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Visual Elements:**

**Illustration:**
- **Type:** Simple, friendly illustration or icon
- **Size:** 256x256px
- **Style:** Line art, 2-color (Primary-600 + Neutral-300)
- **Content:** Badge/medal icon with sparkles or graduation cap
- **Position:** Centered, 64px from top

**Heading:**
- **Text:** "Welcome to Your Badge Wallet!"
- **Typography:** H1 (42px), Semibold, Neutral-800
- **Position:** Centered, 32px below illustration

**Body Text:**
- **Text:** "Your digital credentials will appear here as you earn them. Start your learning journey and unlock achievements!"
- **Typography:** Body Large (16px), Regular, Neutral-600
- **Position:** Centered, 16px below heading
- **Max Width:** 600px
- **Line Height:** 1.5

**Primary CTA (Button):**
- **Text:** "Browse Available Badges"
- **Style:** Primary button (Primary-600 background, white text)
- **Size:** 200px width, 48px height
- **Position:** Centered, 32px below body text
- **Icon:** 🔍 (Search icon, 20x20px, left of text)
- **Action:** Navigate to Badge Catalog page

**Secondary CTA (Button):**
- **Text:** "Learn How to Earn"
- **Style:** Secondary button (Neutral-100 background, Neutral-700 text)
- **Size:** 200px width, 48px height
- **Position:** Centered, 8px below primary CTA
- **Icon:** 📚 (Book icon, 20x20px, left of text)
- **Action:** ✅ **Navigate to documentation** (`/docs/help/earning-badges`)
  - **Decision:** Link to documentation first (video tutorial in future phase)
  - **Future Enhancement:** Add video tutorial when content is ready

**Info Box:**
- **Icon:** 💡 (Lightbulb, 24x24px)
- **Background:** Info-light (#E6F3FF)
- **Border:** 1px solid Info-600
- **Padding:** 16px
- **Border Radius:** 8px
- **Position:** Centered, 48px below secondary CTA
- **Max Width:** 600px
- **Text:** "💡 Did you know? Badges validate your skills for internal opportunities and external job applications."

**Technical Implementation:**

```tsx
function EmptyStateNewEmployee() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      {/* Illustration */}
      <div className="mb-8">
        <svg width="256" height="256" viewBox="0 0 256 256" className="text-primary-600">
          {/* Badge wallet illustration SVG */}
        </svg>
      </div>
      
      {/* Heading */}
      <h1 className="text-4xl font-semibold text-neutral-800 mb-4 text-center">
        Welcome to Your Badge Wallet!
      </h1>
      
      {/* Body */}
      <p className="text-lg text-neutral-600 text-center max-w-xl mb-8 leading-relaxed">
        Your digital credentials will appear here as you earn them.
        Start your learning journey and unlock achievements!
      </p>
      
      {/* CTAs */}
      <div className="flex flex-col gap-2 mb-12">
        <Button 
          size="lg" 
          className="w-[200px]"
          onClick={() => navigate('/catalog')}
        >
          <Search className="w-5 h-5 mr-2" />
          Browse Available Badges
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          className="w-[200px]"
          onClick={() => navigate('/help/earning-badges')}
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Learn How to Earn
        </Button>
      </div>
      
      {/* Info box */}
      <div className="bg-info-light border border-info-600 rounded-md p-4 max-w-xl">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-info-600 flex-shrink-0" />
          <p className="text-sm text-neutral-700">
            <strong>Did you know?</strong> Badges validate your skills for internal 
            opportunities and external job applications.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### Scenario 2: No Claimed Badges (Pending Exist)

**Layout (Desktop):**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        [Illustration]                           │
│                     📬 Notification Icon                        │
│                      (256x256px, animated)                      │
│                                                                 │
│              You Have Badges Waiting!                           │
│                                                                 │
│   You've been awarded 3 badges that need to be claimed.        │
│             Check your email or claim them below.               │
│                                                                 │
│              ┌──────────────────────────┐                      │
│              │   View Pending Badges    │  ← Badge count (3)  │
│              └──────────────────────────┘                      │
│                                                                 │
│              ─────────────────────────────                     │
│                                                                 │
│              Pending Badges:                                    │
│                                                                 │
│   [Badge Preview 1]  [Badge Preview 2]  [Badge Preview 3]     │
│   Python Pro         Data Analysis      JavaScript Basics      │
│   [Claim Now]        [Claim Now]        [Claim Now]            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Visual Elements:**

**Illustration:**
- **Type:** Notification bell or mailbox with badge icons
- **Animation:** Gentle shake or pulse to draw attention
- **Color:** Warning-600 (#F7630C) to indicate action needed

**Heading:**
- **Text:** "You Have Badges Waiting!"
- **Typography:** H1 (42px), Semibold, Warning-600 (attention-grabbing)

**Body Text:**
- **Text:** "You've been awarded {count} badge(s) that need to be claimed. Check your email or claim them below."
- **Typography:** Body Large (16px), Regular, Neutral-700
- **Dynamic Count:** Replace {count} with actual number

**Primary CTA:**
- **Text:** "View Pending Badges" with badge count badge
- **Badge Count:** Small circular badge (24x24px) with number, positioned top-right of button

**Badge Preview Cards:**
- **Layout:** Horizontal row (max 3 visible, scroll for more)
- **Card Size:** 200x200px
- **Content:**
  - Badge image (128x128px)
  - Badge title (16px, Semibold)
  - "Claim Now" button (Primary style)
- **Spacing:** 16px gap between cards

**Technical Implementation:**

```tsx
function EmptyStateWithPendingBadges({ pendingBadges }: { pendingBadges: Badge[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      {/* Animated illustration */}
      <div className="mb-8 animate-bounce-subtle">
        <Bell className="w-64 h-64 text-warning-600" />
      </div>
      
      {/* Heading */}
      <h1 className="text-4xl font-semibold text-warning-600 mb-4 text-center">
        You Have Badges Waiting!
      </h1>
      
      {/* Body */}
      <p className="text-lg text-neutral-700 text-center max-w-xl mb-8">
        You've been awarded <strong>{pendingBadges.length} badge{pendingBadges.length > 1 ? 's' : ''}</strong> that need to be claimed.
        Check your email or claim them below.
      </p>
      
      {/* CTA with badge count */}
      <div className="relative mb-12">
        <Button 
          size="lg"
          onClick={() => scrollToPending()}
        >
          View Pending Badges
        </Button>
        <span className="absolute -top-2 -right-2 bg-warning-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {pendingBadges.length}
        </span>
      </div>
      
      {/* Divider */}
      <div className="w-full max-w-4xl border-t border-neutral-200 mb-8" />
      
      {/* Preview pending badges */}
      <div className="w-full max-w-4xl">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Pending Badges:</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pendingBadges.slice(0, 5).map(badge => (
            <Card key={badge.id} className="flex-shrink-0 w-[200px] p-4">
              <img src={badge.imageUrl} alt={badge.title} className="w-32 h-32 mx-auto mb-2" />
              <h3 className="text-center font-semibold mb-2 truncate">{badge.title}</h3>
              <Button 
                className="w-full"
                onClick={() => claimBadge(badge.id)}
              >
                Claim Now
              </Button>
            </Card>
          ))}
          {pendingBadges.length > 5 && (
            <div className="flex-shrink-0 w-[200px] flex items-center justify-center text-neutral-500">
              +{pendingBadges.length - 5} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Scenario 3: All Badges Revoked (Edge Case)

**Layout (Desktop):**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        [Illustration]                           │
│                     ⚠️ Warning Icon                             │
│                      (256x256px, subtle)                        │
│                                                                 │
│              Your Badge Wallet is Currently Empty               │
│                                                                 │
│       All your badges have been revoked. If you believe        │
│      this is an error, please contact your HR department.      │
│                                                                 │
│              ┌──────────────────────────┐                      │
│              │    Contact Support       │                      │
│              └──────────────────────────┘                      │
│                                                                 │
│              ┌──────────────────────────┐                      │
│              │  View Revocation Policy  │                      │
│              └──────────────────────────┘                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Key Differences:**
- **Tone:** Neutral and supportive, not accusatory
- **Color Scheme:** Neutral grays (no red/error color)
- **CTA:** Direct to support/HR contact
- **Transparency:** Link to revocation policy
- **No Blame:** Avoid implying wrongdoing directly in UI

**Technical Implementation:**

```tsx
function EmptyStateAllRevoked() {
  // ✅ Decision: Support contact email is g-credit@outlook.com (may change in future)
  const SUPPORT_EMAIL = 'g-credit@outlook.com';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      <AlertCircle className="w-64 h-64 text-neutral-400 mb-8" />
      
      <h1 className="text-4xl font-semibold text-neutral-800 mb-4 text-center">
        Your Badge Wallet is Currently Empty
      </h1>
      
      <p className="text-lg text-neutral-600 text-center max-w-xl mb-8">
        All your badges have been revoked. If you believe this is an error,
        please contact support at <strong>{SUPPORT_EMAIL}</strong>.
      </p>
      
      <div className="flex flex-col gap-2">
        <Button 
          size="lg"
          onClick={() => window.open(`mailto:${SUPPORT_EMAIL}?subject=Badge Revocation Inquiry`)}
        >
          <Mail className="w-5 h-5 mr-2" />
          Contact Support
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg"
          onClick={() => navigate('/policies/revocation')}
        >
          <FileText className="w-5 h-5 mr-2" />
          View Revocation Policy
        </Button>
      </div>
    </div>
  );
}
```

---

### Scenario 4: Filtered Results Empty

**Layout (Desktop):**

```
┌────────────────────────────────────────────────────────────────┐
│  My Badge Wallet                                                │
│                                                                 │
│  [Search: "python"] [Filter: Data Science ▾] [Clear Filters]  │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│                        [Illustration]                           │
│                     🔍 Search Icon                              │
│                      (128x128px, small)                         │
│                                                                 │
│              No Badges Match Your Filters                       │
│                                                                 │
│         Try adjusting your search or filter criteria.          │
│                                                                 │
│              ┌──────────────────────────┐                      │
│              │     Clear All Filters    │                      │
│              └──────────────────────────┘                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Key Differences:**
- **Smaller Illustration:** 128x128px (less prominent, not main focus)
- **Active Filters Visible:** Show what filters are applied
- **Clear Action:** Single CTA to reset filters
- **Helpful Suggestion:** "Try adjusting your search or filter criteria"

**Technical Implementation:**

```tsx
function EmptyStateFiltered({ activeFilters, onClearFilters }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <Search className="w-32 h-32 text-neutral-300 mb-6" />
      
      <h2 className="text-2xl font-semibold text-neutral-800 mb-2 text-center">
        No Badges Match Your Filters
      </h2>
      
      <p className="text-base text-neutral-600 text-center mb-6">
        Try adjusting your search or filter criteria.
      </p>
      
      {/* Show active filters */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {activeFilters.map(filter => (
          <Badge key={filter.key} variant="secondary" className="text-sm">
            {filter.label}: {filter.value}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={() => removeFilter(filter.key)}
            />
          </Badge>
        ))}
      </div>
      
      <Button onClick={onClearFilters}>
        Clear All Filters
      </Button>
    </div>
  );
}
```

---

## Mobile Empty State Adaptations

### Layout Changes (≤768px)

**Key Adjustments:**
- Illustration size: 128x128px (instead of 256x256px)
- Heading: 28px (H2 instead of H1)
- Body text: 14px (Body instead of Body Large)
- Button width: Full width (100% instead of 200px)
- Padding: 16px (instead of 32px)

**Vertical Stacking:**
- All elements remain vertically centered
- No horizontal layout changes
- Touch-friendly button sizes (48px height minimum)

**Example (Mobile):**

```
┌──────────────────────────┐
│                           │
│    [Illustration 128px]   │
│                           │
│  Welcome to Your Badge    │
│        Wallet!            │
│                           │
│  Your digital credentials │
│  will appear here...      │
│                           │
│  ┌────────────────────┐  │
│  │  Browse Badges     │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  Learn How to Earn │  │
│  └────────────────────┘  │
│                           │
│  💡 Did you know?...     │
│                           │
└──────────────────────────┘
```

---

## Accessibility

### Screen Reader Support

**Semantic HTML:**
```tsx
<section 
  role="status" 
  aria-label="Empty badge wallet"
  className="empty-state"
>
  <img 
    src={illustration} 
    alt="Empty badge wallet illustration"
    role="img"
  />
  
  <h1 id="empty-state-heading">Welcome to Your Badge Wallet!</h1>
  
  <p aria-describedby="empty-state-heading">
    Your digital credentials will appear here...
  </p>
  
  <nav aria-label="Get started actions">
    <Button aria-label="Browse available badges in catalog">
      Browse Available Badges
    </Button>
    <Button aria-label="Learn how to earn badges">
      Learn How to Earn
    </Button>
  </nav>
</section>
```

### Focus Management

**First Interactive Element:**
- Primary CTA receives focus when empty state loads
- Allows keyboard users to immediately take action

**Technical:**
```tsx
const buttonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  // Auto-focus primary CTA when empty state renders
  buttonRef.current?.focus();
}, []);

<Button ref={buttonRef}>Browse Available Badges</Button>
```

---

## Animation & Delight

### Entry Animation

**Fade-in with Slight Scale:**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  {/* Empty state content */}
</motion.div>
```

### Illustration Animation

**Subtle Floating Effect:**
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.illustration {
  animation: float 3s ease-in-out infinite;
}
```

### CTA Hover Effects

**Scale + Shadow:**
```tsx
<Button 
  className="transition-all hover:scale-105 hover:shadow-lg"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Browse Available Badges
</Button>
```

---

## Illustrations

### Design Guidelines

**Style:**
- **Type:** Line art with 2-color palette (Primary-600 + Neutral-300)
- **Complexity:** Simple, not overly detailed
- **Emotion:** Friendly, approachable, professional
- **Brand Alignment:** Consistent with G-Credit visual language

**Recommended Illustrations:**
1. **New Employee:** Graduation cap + badge icon + sparkles
2. **Pending Badges:** Notification bell with badge icons flying out
3. **Revoked:** Neutral folder or document icon (no negative imagery)
4. **Filtered:** Magnifying glass with filter icon

**Source Options:**
- **Custom:** Create in Figma with design tokens
- **Library:** Use unDraw (free, customizable), Humaaans, or Streamline Icons
- **Placeholder:** Use emoji + icon until custom illustrations ready

**SVG Format:**
```tsx
// Example: Badge wallet illustration
<svg width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#0078D4" />
      <stop offset="100%" stopColor="#2B88D8" />
    </linearGradient>
  </defs>
  
  {/* Badge shape */}
  <path d="M..." fill="url(#grad1)" />
  
  {/* Sparkles */}
  <circle cx="..." cy="..." r="4" fill="#FFB900" />
  <circle cx="..." cy="..." r="3" fill="#FFB900" />
</svg>
```

---

## Testing Checklist

### Functional Testing

- [ ] New employee sees correct empty state on first login
- [ ] Pending badges empty state shows accurate count
- [ ] Pending badge preview cards are clickable and functional
- [ ] Filtered empty state shows active filters correctly
- [ ] "Clear All Filters" button resets to full list
- [ ] All CTAs navigate to correct destinations
- [ ] Support contact email opens correctly
- [ ] Illustrations load without errors
- [ ] Mobile layout displays correctly on all screen sizes

### Accessibility Testing

- [ ] Screen reader announces empty state heading
- [ ] All buttons have proper ARIA labels
- [ ] Keyboard navigation reaches all interactive elements
- [ ] Focus indicator visible on all elements
- [ ] Illustrations have descriptive alt text
- [ ] Color contrast meets WCAG AA standards

### Visual Testing

- [ ] Illustrations match design specifications
- [ ] Typography scales correctly on mobile
- [ ] Spacing matches design tokens
- [ ] Hover states work on all buttons
- [ ] Animations are smooth (60fps)
- [ ] Layout doesn't break at edge cases (long text, many filters)

---

## Design Deliverables Summary

✅ **Completed:**
1. Four empty state scenarios defined
2. Desktop and mobile layouts specified
3. Visual element specifications
4. Technical implementation examples
5. Accessibility guidelines
6. Animation specifications
7. Illustration guidelines
8. Testing checklist

**Ready for:** Sprint 4 Development

---

## Next Steps

1. **Create Illustrations:** Designer creates SVG illustrations in Figma
2. **Story Breakdown:** Bob includes empty state stories in Sprint 4 backlog
3. **Component Development:** Dev team implements EmptyState component variants
4. **Content Review:** Marketing/HR reviews copy for tone and accuracy
5. **QA Validation:** Test all scenarios and edge cases
✅ Team Decisions Confirmed (2026-01-28):**
- ✅ Tutorial Format: **Documentation first** - Link to `/docs/help/earning-badges`
  - Future enhancement: Video tutorial when content ready
- ✅ Support Contact: **g-credit@outlook.com** (subject to change in future)
  - Mailto link with pre-filled subject: "Badge Revocation Inquiry"
- 📊 Analytics: To be decided - recommend tracking empty state CTA clicks for optimization
- Should we create a video tutorial for "Learn How to Earn" or just documentation?
- What's the best support contact email/link for revoked badge scenario?
- Do we want to track analytics on which CTA users click in empty states?
