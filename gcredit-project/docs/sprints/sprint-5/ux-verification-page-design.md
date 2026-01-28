# UX Verification Page Design

**Sprint:** Sprint 5 (Epic 6 - Badge Verification)  
**Designer:** Sally (UX Designer)  
**Date:** 2026-01-28  
**Status:** Ready for Development

---

## Overview

Public-facing badge verification page accessible at `/verify/{verificationId}`. No authentication required. Optimized for trust, clarity, and mobile responsiveness.

**Design Philosophy:** "Trust through transparency - show everything that matters."

---

## Page States

### 1. Valid Badge (Green Theme)
### 2. Expired Badge (Yellow Theme)
### 3. Revoked Badge (Red Theme)
### 4. Not Found (404)
### 5. Loading State

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  [G-Credit Logo]                        [Download ▼]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │        [Badge Image 256x256px]                   │  │
│  │                                                   │  │
│  │  ✅ VERIFIED                                      │  │
│  │  Python Programming Expert                       │  │
│  │  Issued by Microsoft Learn                       │  │
│  │  Jan 28, 2026                                    │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  📋 Badge Details                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Recipient: John Doe                                    │
│  Issued: January 28, 2026                               │
│  Expires: Never                                         │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  📝 Description                                          │
│  This badge recognizes proficiency in Python...         │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  🎯 Skills                                               │
│  [Python]  [OOP]  [Data Structures]                     │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ✓ Criteria                                              │
│  • Complete 10 Python projects                          │
│  • Pass final assessment (80%+)                         │
│  • Submit portfolio review                              │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  📎 Evidence (2 files)                                   │
│  📄 final-project.pdf         [Download]               │
│  🖼️ portfolio-screenshot.png  [Preview]                │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  🔗 Verification                                         │
│  https://g-credit.com/verify/abc-123                   │
│  [Copy Link]                                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
│  Verified by G-Credit | Privacy Policy | Report Issue   │
└─────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Hero Section (Badge Card)

**Dimensions:** 600px width × auto height (desktop), Full width (mobile)

**Valid Badge:**
```css
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
color: white;
border-radius: 16px;
padding: 48px;
box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3);
```

**Elements:**
- Badge Image: 256×256px, centered, white border (4px)
- Status Badge: ✅ "VERIFIED" (18px, bold, green-100 bg)
- Badge Name: 32px, font-weight 700
- Issuer: 18px, opacity 0.9
- Date: 16px, opacity 0.8

**Expired Badge:**
```css
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
status: ⚠️ "EXPIRED"
```

**Revoked Badge:**
```css
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
status: 🔒 "REVOKED"
```

---

### 2. Download Button (Top Right)

**Desktop:**
```css
position: fixed;
top: 24px;
right: 24px;
background: white;
border: 2px solid #e5e7eb;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

**Dropdown Menu:**
- Download PNG (baked badge)
- Download JSON-LD
- Share on LinkedIn
- Copy verification link

---

### 3. Badge Details Section

**Layout:** Two-column on desktop, single-column on mobile

**Fields:**
```
┌────────────────────┬────────────────────┐
│ Recipient:         │ Issued:            │
│ John Doe           │ Jan 28, 2026       │
├────────────────────┼────────────────────┤
│ Privacy:           │ Expires:           │
│ 🌐 Public          │ Never              │
└────────────────────┴────────────────────┘
```

**Typography:**
- Label: 14px, text-gray-600, font-weight 500
- Value: 16px, text-gray-900, font-weight 600

---

### 4. Description Section

**Max width:** 720px  
**Line height:** 1.75  
**Font size:** 16px  
**Color:** text-gray-700

**Truncation:** Show first 300 chars, "Read more" link if longer

---

### 5. Skills Section

**Skill Chip:**
```css
display: inline-block;
background: #dbeafe;  /* blue-100 */
color: #1e40af;       /* blue-800 */
padding: 8px 16px;
border-radius: 9999px;
font-size: 14px;
font-weight: 600;
margin: 4px;
```

**Max display:** 10 skills, "+ X more" if exceeds

---

### 6. Criteria Section

**List Style:**
```css
list-style: none;
padding-left: 0;
```

**Each item:**
- Checkmark icon: ✓ (green-600)
- Bullet alternative: • (gray-400)
- Font: 15px, line-height 1.8
- Spacing: 12px between items

---

### 7. Evidence Section

**File Item:**
```
┌──────────────────────────────────────────────┐
│ 📄 final-project.pdf                         │
│ 2.3 MB                         [Download] ↓  │
└──────────────────────────────────────────────┘
```

**Image Preview (if image):**
- Thumbnail: 80×80px
- [Preview] button opens lightbox

**Empty State:**
```
No evidence files submitted
```

---

### 8. Verification Section

**Verification URL:**
```css
display: flex;
background: #f3f4f6;  /* gray-100 */
padding: 16px;
border-radius: 8px;
font-family: monospace;
font-size: 14px;
```

**Copy Button:**
- Icon: 📋
- Hover: Shows "Copy to clipboard"
- Click: Shows "✓ Copied!" (2 seconds)

---

## Revoked Badge Special Treatment

### Red Warning Banner

```
┌─────────────────────────────────────────────────────────┐
│ 🔒 CREDENTIAL REVOKED                                    │
│ This credential has been revoked and is no longer valid. │
│                                                          │
│ Revoked on: January 30, 2026                            │
│ Reason: Issued in error                                 │
└─────────────────────────────────────────────────────────┘
```

**Styling:**
```css
background: #fef2f2;  /* red-50 */
border: 2px solid #ef4444;  /* red-500 */
border-radius: 12px;
padding: 24px;
margin-bottom: 32px;
```

**Revocation Reasons (sanitized for public):**
- "Issued in error"
- "Policy violation"
- "Credential expired"
- "Reissued with updated information"
- (Do NOT show internal details)

---

## Mobile Responsive Breakpoints

### Mobile (<768px)

**Changes:**
- Hero: Full width, padding: 24px
- Badge Image: 192×192px
- Font sizes: -2px
- Two-column layout → Single column
- Download button: Bottom fixed bar
- Skills: Stack vertically
- Evidence: Full width tiles

### Tablet (768px - 1024px)

**Changes:**
- Hero: 90% width, max 720px
- Badge Image: 224×224px
- Maintain two-column where possible

### Desktop (>1024px)

**Max content width:** 900px, centered

---

## Loading States

### Skeleton Screen

```
┌─────────────────────────────────────────────────────────┐
│  [G-Credit Logo]                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │        [Gray Circle 256×256]                      │  │
│  │        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                          │  │
│  │        ▓▓▓▓▓▓▓▓▓▓▓                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Animation:** Shimmer effect (left to right, 2s loop)

---

## Error States

### 404 - Badge Not Found

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              🔍                                          │
│                                                          │
│         Badge Not Found                                 │
│                                                          │
│  The badge you're looking for doesn't exist or          │
│  the verification link is invalid.                      │
│                                                          │
│  [Go to G-Credit Home]                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 500 - Server Error

```
┌─────────────────────────────────────────────────────────┐
│              ⚠️                                          │
│                                                          │
│      Something Went Wrong                               │
│                                                          │
│  We're unable to verify this badge right now.           │
│  Please try again in a few moments.                     │
│                                                          │
│  [Try Again]  [Contact Support]                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Accessibility (WCAG 2.1 AA)

### Color Contrast
- Valid badge text on green: 4.5:1 minimum ✅
- Expired badge text on yellow: Check with contrast checker
- All body text: 4.5:1 minimum ✅

### Keyboard Navigation
- Tab order: Logo → Download → Badge sections → Footer
- Focus indicators: 2px blue outline
- Skip to content link for screen readers

### ARIA Labels
```html
<div role="main" aria-label="Badge verification page">
  <section aria-label="Badge details" role="region">
    <h1 id="badge-title">Python Programming Expert</h1>
    <p aria-describedby="badge-title">Issued by Microsoft Learn</p>
  </section>
</div>
```

### Screen Reader Announcements
```html
<div role="status" aria-live="polite">
  Badge verification loaded successfully
</div>
```

---

## SEO & Social Sharing

### Open Graph Tags

```html
<meta property="og:title" content="Python Programming Expert - Verified Credential" />
<meta property="og:description" content="Badge issued by Microsoft Learn on January 28, 2026. Recognizes proficiency in Python programming." />
<meta property="og:image" content="https://gcreditdevstoragelz.blob.core.windows.net/badges/python-expert.png" />
<meta property="og:url" content="https://g-credit.com/verify/abc-123" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="G-Credit" />
```

### Twitter Cards

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Python Programming Expert" />
<meta name="twitter:description" content="Verified credential from Microsoft Learn" />
<meta name="twitter:image" content="https://gcreditdevstoragelz.blob.core.windows.net/badges/python-expert.png" />
```

### Structured Data (JSON-LD)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalCredential",
  "name": "Python Programming Expert",
  "description": "Badge recognizing proficiency in Python programming",
  "credentialCategory": "certificate",
  "recognizedBy": {
    "@type": "Organization",
    "name": "Microsoft Learn"
  },
  "dateCreated": "2026-01-28"
}
</script>
```

---

## Component Implementation

### React Component Structure

```typescript
// src/pages/VerifyBadgePage.tsx
export function VerifyBadgePage() {
  const { verificationId } = useParams();
  const { data: badge, isLoading, error } = useQuery({
    queryKey: ['badge-verification', verificationId],
    queryFn: () => verificationApi.verifyBadge(verificationId)
  });

  if (isLoading) return <VerificationSkeleton />;
  if (error) return <VerificationError error={error} />;
  if (!badge) return <BadgeNotFound />;

  return (
    <div className="verify-page">
      <VerificationHeader />
      <BadgeHeroCard badge={badge} />
      {badge.status === 'REVOKED' && <RevokedBanner badge={badge} />}
      <BadgeDetails badge={badge} />
      <BadgeDescription description={badge.description} />
      <BadgeSkills skills={badge.skills} />
      <BadgeCriteria criteria={badge.criteria} />
      <EvidenceFiles files={badge.evidenceFiles} />
      <VerificationSection verificationUrl={badge.verificationUrl} />
      <VerificationFooter />
    </div>
  );
}
```

---

## Design Assets

### Colors

```css
/* Valid Badge */
--badge-valid-primary: #10b981;  /* green-500 */
--badge-valid-secondary: #059669;  /* green-600 */

/* Expired Badge */
--badge-expired-primary: #f59e0b;  /* amber-500 */
--badge-expired-secondary: #d97706;  /* amber-600 */

/* Revoked Badge */
--badge-revoked-primary: #ef4444;  /* red-500 */
--badge-revoked-secondary: #dc2626;  /* red-600 */

/* Neutral */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-600: #4b5563;
--gray-900: #111827;
```

### Typography

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;
```

---

## Testing Checklist

- [ ] Desktop layout (1920×1080, 1366×768)
- [ ] Tablet layout (768×1024)
- [ ] Mobile layout (375×667, 414×896)
- [ ] Valid badge displays correctly
- [ ] Expired badge shows warning
- [ ] Revoked badge shows red banner
- [ ] 404 page shows for invalid ID
- [ ] Loading skeleton displays
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader reads content correctly
- [ ] Color contrast passes WCAG AA
- [ ] Open Graph tags validate on Facebook
- [ ] Twitter Card displays correctly
- [ ] Download button works (PNG, JSON-LD)
- [ ] Copy verification URL works
- [ ] Evidence files download
- [ ] Image lightbox opens for previews

---

**Status:** ✅ Ready for Development  
**Designer:** Sally (UX Designer)  
**Approved By:** LegendZhu  
**Implementation:** Sprint 5 Story 6.2
