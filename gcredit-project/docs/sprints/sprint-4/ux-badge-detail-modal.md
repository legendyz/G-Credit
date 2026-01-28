# Badge Detail Modal Design

**Sprint:** Sprint 4 (Epic 5 - Employee Badge Wallet)  
**Designer:** Sally (UX Designer)  
**Date:** 2026-01-28  
**Status:** Ready for Development

---

## Overview

The Badge Detail Modal is the primary interface for viewing comprehensive badge information. Users access this modal by clicking on any badge card in the wallet (grid or timeline view). This document defines the complete UX design for the modal.

**Design Philosophy:** "Show the complete story behind each badge—criteria, evidence, issuer, and actions—in a scannable, beautiful format."

---

## User Goals

**Primary:**
- Understand what this badge represents (criteria, skills)
- View issuer information and personalized message (if any)
- Verify authenticity (issue date, verification URL)
- Take actions (share, download, adjust privacy, view verification page)

**Secondary:**
- See evidence/justification submitted (if applicable)
- View timeline of events (issued → claimed → shared)
- Compare to other badges in same skill category

---

## Modal Trigger

**Entry Points:**
1. Click badge card in Grid View
2. Click badge card in Timeline View
3. Click badge in pending notifications
4. Direct link from email notification

**Technical:**
```tsx
// Badge card is clickable
<Card 
  className="cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => openBadgeDetail(badge.id)}
>
  {/* Badge card content */}
</Card>

// Modal state management
const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

<BadgeDetailModal 
  badgeId={selectedBadgeId}
  isOpen={!!selectedBadgeId}
  onClose={() => setSelectedBadgeId(null)}
/>
```

---

## Modal Layout - Desktop (1024px+)

### Visual Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Badge Details                                          [X] Close  │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │                                                                     │  │
│  │  ┌─────────────┐                                                   │  │
│  │  │   Badge     │   Python Pro                           🌐 Public  │  │
│  │  │   Image     │   Microsoft Learn                                 │  │
│  │  │  256x256px  │   ✅ Claimed • Jan 26, 2026                       │  │
│  │  │             │                                                    │  │
│  │  └─────────────┘   ┌──────────────────────────────────────────┐   │  │
│  │                    │  💬 Message from Wei Zhang (CTO)         │   │  │
│  │                    │  "Fantastic work on mastering Python!    │   │  │
│  │                    │   Your dedication to learning shows."    │   │  │
│  │                    └──────────────────────────────────────────┘   │  │
│  │                                                                     │  │
│  │  ───────────────────────────────────────────────────────────────  │  │
│  │                                                                     │  │
│  │  📋 Badge Information                                              │  │
│  │                                                                     │  │
│  │  Description:                                                      │  │
│  │  This badge recognizes advanced proficiency in Python programming │  │
│  │  including OOP, data structures, and real-world applications.     │  │
│  │                                                                     │  │
│  │  Skills: Python • Object-Oriented Programming • Data Structures   │  │
│  │                                                                     │  │
│  │  Criteria to Earn:                                                │  │
│  │  • Complete Python Advanced Course                                │  │
│  │  • Submit 3 project implementations                               │  │
│  │  • Pass final assessment (80%+)                                   │  │
│  │                                                                     │  │
│  │  ───────────────────────────────────────────────────────────────  │  │
│  │                                                                     │  │
│  │  📅 Timeline                                                       │  │
│  │                                                                     │  │
│  │  • Issued:  Jan 22, 2026 by Wei Zhang                            │  │
│  │  • Claimed: Jan 26, 2026                                          │  │
│  │  • Shared:  Jan 26, 2026 (LinkedIn)                              │  │
│  │  • Expires: Never                                                 │  │
│  │                                                                     │  │
│  │  ───────────────────────────────────────────────────────────────  │  │
│  │                                                                     │  │
│  │  🔗 Verification                                                   │  │
│  │                                                                     │  │
│  │  Public URL: https://gcredit.company.com/verify/abc123           │  │
│  │  [Copy Link] [Open Verification Page]                            │  │
│  │                                                                     │  │
│  │  ───────────────────────────────────────────────────────────────  │  │
│  │                                                                     │  │
│  │  [Share to LinkedIn] [Download Badge] [Toggle Privacy] [Report]   │  │
│  │                                                                     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Modal Container

**Dimensions:**
- **Width:** 800px (desktop), 100% (mobile with 16px margins)
- **Max Height:** 90vh (scrollable if content exceeds)
- **Border Radius:** 12px (rounded-lg)
- **Shadow:** elevation-3 (8px 16px rgba(0,0,0,0.16))
- **Background:** White
- **Padding:** 0 (sections have their own padding)

**Backdrop:**
- **Color:** rgba(0,0,0,0.4) (dark semi-transparent)
- **Blur:** 4px backdrop-filter (modern browsers)
- **Click:** Closes modal when clicked outside

**Animation:**
```tsx
// Entry animation
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  {/* Modal content */}
</motion.div>
```

**Technical:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
    {/* Modal sections */}
  </DialogContent>
</Dialog>
```

---

### 2. Modal Header

**Layout:**
```
┌───────────────────────────────────────────────────────────┐
│  Badge Details                                  [X] Close  │
└───────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Height:** 64px
- **Padding:** 20px 24px
- **Border Bottom:** 1px solid Neutral-200
- **Background:** White (sticky on scroll)
- **Position:** Sticky top (remains visible when scrolling content)

**Title:**
- **Text:** "Badge Details"
- **Typography:** H3 (20px), Semibold, Neutral-800

**Close Button:**
- **Size:** 32x32px
- **Icon:** X (20x20px)
- **Style:** Ghost button, hover: Neutral-100 background
- **Position:** Absolute top-right (20px, 20px)
- **Keyboard:** ESC key also closes modal

**Technical:**
```tsx
<div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-5 flex items-center justify-between z-10">
  <DialogTitle className="text-xl font-semibold text-neutral-800">
    Badge Details
  </DialogTitle>
  <DialogClose asChild>
    <Button variant="ghost" size="icon" aria-label="Close">
      <X className="w-5 h-5" />
    </Button>
  </DialogClose>
</div>
```

---

### 3. Hero Section (Badge Image + Metadata)

**Layout:**
```
┌─────────────┐
│   Badge     │   Badge Title                      🌐 Public
│   Image     │   Issuer Name
│  256x256px  │   ✅ Claimed • Jan 26, 2026
│             │
└─────────────┘   [Issuer Message Box]
```

**Specifications:**
- **Padding:** 24px
- **Background:** Gradient from Neutral-50 to White (subtle)
- **Layout:** Flexbox (image left, content right)

**Badge Image:**
- **Size:** 256x256px
- **Border Radius:** 8px (rounded-md)
- **Shadow:** elevation-1
- **Hover:** None (not clickable)

**Badge Title:**
- **Typography:** H2 (28px), Semibold, Neutral-800
- **Max Width:** 400px
- **Word Break:** break-word if extremely long

**Issuer Name:**
- **Typography:** Body (14px), Regular, Neutral-600
- **Margin Top:** 4px
- **Format:** "Issuer Organization" (clickable to issuer profile, future)

**Status Badge:**
- **Component:** Badge pill
- **Size:** 12px font, 4px 8px padding
- **Style:**
  - ✅ Claimed: Green (#DFF6DD background, #107C10 text)
  - 🟡 Pending: Yellow (#FFF4CE background, #F7630C text)
  - 🚫 Revoked: Gray (#F3F2F1 background, #605E5C text)

**Issue Date:**
- **Typography:** Body Small (12px), Regular, Neutral-500
- **Format:** "• Jan 26, 2026" (bullet separator)

**Visibility Indicator:**
- **Position:** Top-right of content area
- **Component:** Badge pill with icon
- **Styles:**
  - 🌐 Public: Primary-600 background, white text
  - 🔒 Internal: Neutral-600 background, white text
- **Size:** 16px font, 8px 12px padding
- **Clickable:** Opens privacy toggle dropdown

**Issuer Message Box:**
- **Condition:** Only show if personalizedMessage exists
- **Background:** Neutral-50
- **Border:** 1px solid Neutral-200
- **Border Radius:** 8px
- **Padding:** 16px
- **Margin Top:** 16px
- **Max Width:** 500px

**Message Content:**
- **Icon:** 💬 (24x24px, top-left)
- **Header:** "Message from [Issuer Name] ([Title])"
  - Typography: Body (14px), Medium, Neutral-700
- **Message Text:**
  - Typography: Body (14px), Regular, Neutral-700, italic
  - Max Length: 500 characters
  - Line Height: 1.5

**Technical:**
```tsx
<div className="bg-gradient-to-b from-neutral-50 to-white p-6">
  <div className="flex gap-6">
    {/* Badge image */}
    <img 
      src={badge.imageUrl} 
      alt={badge.title}
      className="w-64 h-64 rounded-md shadow-elevation-1"
    />
    
    {/* Content */}
    <div className="flex-1">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-1">
            {badge.title}
          </h2>
          <p className="text-sm text-neutral-600">{badge.issuer}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={getStatusVariant(badge.status)}>
              {getStatusIcon(badge.status)} {badge.status}
            </Badge>
            <span className="text-xs text-neutral-500">
              • {formatDate(badge.issuedAt)}
            </span>
          </div>
        </div>
        
        {/* Visibility badge */}
        <Badge 
          className={cn(
            "cursor-pointer",
            badge.visibility === 'PUBLIC' ? "bg-primary-600" : "bg-neutral-600"
          )}
          onClick={() => togglePrivacy()}
        >
          {badge.visibility === 'PUBLIC' ? '🌐 Public' : '🔒 Internal'}
        </Badge>
      </div>
      
      {/* Issuer message */}
      {badge.personalizedMessage && (
        <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-md p-4 max-w-md">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-6 h-6 text-neutral-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-1">
                Message from {badge.issuerName} ({badge.issuerTitle})
              </p>
              <p className="text-sm text-neutral-700 italic leading-relaxed">
                "{badge.personalizedMessage}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>
```

---

### 4. Badge Information Section

**Layout:**
```
📋 Badge Information

Description:
This badge recognizes advanced proficiency in Python programming...

Skills: Python • OOP • Data Structures

Criteria to Earn:
• Complete Python Advanced Course
• Submit 3 project implementations
• Pass final assessment (80%+)
```

**Specifications:**
- **Padding:** 24px
- **Background:** White
- **Border Top:** 1px solid Neutral-200

**Section Heading:**
- **Text:** "📋 Badge Information"
- **Typography:** H3 (20px), Semibold, Neutral-800
- **Margin Bottom:** 16px

**Description:**
- **Label:** "Description:"
  - Typography: Body (14px), Medium, Neutral-700
  - Margin Bottom: 4px
- **Text:** Badge description (from template)
  - Typography: Body (14px), Regular, Neutral-700
  - Line Height: 1.5
  - Max Length: 500 characters

**Skills Tags:**
- **Label:** "Skills:"
  - Typography: Body (14px), Medium, Neutral-700
  - Margin Top: 16px, Margin Bottom: 8px
- **Tags:** Horizontal list of badge pills
  - Background: Primary-50 (#E6F3FF)
  - Text Color: Primary-600
  - Font: 12px, Medium
  - Padding: 4px 12px
  - Border Radius: 9999px (fully rounded)
  - Gap: 8px
  - Separator: Bullet • between tags

**Criteria:**
- **Label:** "Criteria to Earn:"
  - Typography: Body (14px), Medium, Neutral-700
  - Margin Top: 16px, Margin Bottom: 8px
- **List:** Bulleted list
  - Typography: Body (14px), Regular, Neutral-700
  - Line Height: 1.5
  - Bullet: • (16px, Primary-600)
  - Gap: 8px between items

**Evidence/Proof Files (If Exists):**
- **Decision:** ✅ **Show employee-uploaded evidence files when present**
- **Label:** "Evidence Submitted:"
  - Typography: Body (14px), Medium, Neutral-700
  - Margin Top: 16px, Margin Bottom: 8px
- **File Display:**
  - File name with icon (📎 or appropriate file type icon)
  - File size in parentheses
  - Download link
  - Thumbnail preview for images
  - Max 5 files displayed, "View all" for more
- **Layout:**
```
Evidence Submitted:
📎 python_project.pdf (2.3 MB) [Download]
📷 certificate.png (450 KB) [Download] [Preview]
```

**Technical:**
```tsx
<section className="px-6 py-6 border-t border-neutral-200">
  <h3 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2">
    <FileText className="w-5 h-5" />
    Badge Information
  </h3>
  
  {/* Description */}
  <div className="mb-4">
    <p className="text-sm font-medium text-neutral-700 mb-1">Description:</p>
    <p className="text-sm text-neutral-700 leading-relaxed">
      {badge.description}
    </p>
  </div>
  
  {/* Skills */}
  {badge.skills && badge.skills.length > 0 && (
    <div className="mb-4">
      <p className="text-sm font-medium text-neutral-700 mb-2">Skills:</p>
      <div className="flex flex-wrap gap-2">
        {badge.skills.map((skill) => (
          <Badge 
            key={skill} 
            variant="secondary"
            className="bg-primary-50 text-primary-600"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  )}
  
  {/* Criteria */}
  {badge.criteria && badge.criteria.length > 0 && (
    <div className="mb-4">
      <p className="text-sm font-medium text-neutral-700 mb-2">Criteria to Earn:</p>
      <ul className="space-y-2">
        {badge.criteria.map((criterion, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
            <span className="text-primary-600 mt-0.5">•</span>
            <span>{criterion}</span>
          </li>
        ))}
      </ul>
    </div>
  )}
  
  {/* Evidence Files - ✅ New Section */}
  {badge.evidenceFiles && badge.evidenceFiles.length > 0 && (
    <div>
      <p className="text-sm font-medium text-neutral-700 mb-2">Evidence Submitted:</p>
      <ul className="space-y-2">
        {badge.evidenceFiles.slice(0, 5).map((file) => (
          <li key={file.id} className="flex items-center gap-2 text-sm text-neutral-700">
            <FileIcon type={file.type} className="w-4 h-4 text-primary-600" />
            <span className="flex-1">{file.name}</span>
            <span className="text-xs text-neutral-500">({formatFileSize(file.size)})</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => downloadFile(file.id)}
            >
              <Download className="w-4 h-4" />
            </Button>
            {file.type.startsWith('image/') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => previewImage(file.url)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </li>
        ))}
        {badge.evidenceFiles.length > 5 && (
          <li>
            <Button variant="link" size="sm" onClick={() => viewAllEvidence()}>
              View all {badge.evidenceFiles.length} files →
            </Button>
          </li>
        )}
      </ul>
    </div>
  )}
</section>
```

---

### 5. Timeline Section

**Layout:**
```
📅 Timeline

• Issued:  Jan 22, 2026 by Wei Zhang
• Claimed: Jan 26, 2026
• Shared:  Jan 26, 2026 (LinkedIn)
• Expires: Never
```

**Specifications:**
- **Padding:** 24px
- **Border Top:** 1px solid Neutral-200

**Section Heading:**
- **Text:** "📅 Timeline"
- **Typography:** H3 (20px), Semibold, Neutral-800
- **Margin Bottom:** 16px

**Timeline Items:**
- **Layout:** Vertical list
- **Item Structure:**
  - **Label:** "Issued:", "Claimed:", etc. (bold)
  - **Value:** Date + additional info
- **Typography:** Body (14px), Regular, Neutral-700
- **Gap:** 8px between items
- **Bullet:** • (16px, Neutral-400) before each item

**Events to Show:**
1. **Issued:** Always present
   - Format: "{Date} by {Issuer Name}"
2. **Claimed:** Only if status = CLAIMED
   - Format: "{Date}"
3. **Shared:** Only if shared (future feature)
   - Format: "{Date} ({Platform})"
4. **Revoked:** Only if status = REVOKED
   - Format: "{Date} - Reason: {Reason}"
5. **Expires:** Always present
   - Format: "Never" or "{Date}"

**Technical:**
```tsx
<section className="px-6 py-6 border-t border-neutral-200">
  <h3 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2">
    <Calendar className="w-5 h-5" />
    Timeline
  </h3>
  
  <ul className="space-y-2">
    {/* Issued */}
    <li className="flex items-start gap-2 text-sm text-neutral-700">
      <span className="text-neutral-400">•</span>
      <span>
        <strong>Issued:</strong> {formatDate(badge.issuedAt)} by {badge.issuerName}
      </span>
    </li>
    
    {/* Claimed */}
    {badge.claimedAt && (
      <li className="flex items-start gap-2 text-sm text-neutral-700">
        <span className="text-neutral-400">•</span>
        <span>
          <strong>Claimed:</strong> {formatDate(badge.claimedAt)}
        </span>
      </li>
    )}
    
    {/* Shared */}
    {badge.sharedAt && (
      <li className="flex items-start gap-2 text-sm text-neutral-700">
        <span className="text-neutral-400">•</span>
        <span>
          <strong>Shared:</strong> {formatDate(badge.sharedAt)} ({badge.sharePlatform})
        </span>
      </li>
    )}
    
    {/* Revoked */}
    {badge.revokedAt && (
      <li className="flex items-start gap-2 text-sm text-neutral-700">
        <span className="text-neutral-400">•</span>
        <span>
          <strong>Revoked:</strong> {formatDate(badge.revokedAt)} - Reason: {badge.revokeReason}
        </span>
      </li>
    )}
    
    {/* Expires */}
    <li className="flex items-start gap-2 text-sm text-neutral-700">
      <span className="text-neutral-400">•</span>
      <span>
        <strong>Expires:</strong> {badge.expiresAt ? formatDate(badge.expiresAt) : 'Never'}
      </span>
    </li>
  </ul>
</section>
```

---

### 6. Verification Section

**Layout:**
```
🔗 Verification

Public URL: https://gcredit.company.com/verify/abc123
[Copy Link] [Open Verification Page]
```

**Specifications:**
- **Padding:** 24px
- **Border Top:** 1px solid Neutral-200
- **Condition:** Only show if visibility = PUBLIC

**Section Heading:**
- **Text:** "🔗 Verification"
- **Typography:** H3 (20px), Semibold, Neutral-800
- **Margin Bottom:** 16px

**URL Display:**
- **Label:** "Public URL:"
  - Typography: Body (14px), Medium, Neutral-700
  - Margin Bottom: 8px
- **URL Text:**
  - Typography: Body (14px), Monospace (Cascadia Code), Neutral-600
  - Background: Neutral-50
  - Padding: 8px 12px
  - Border Radius: 4px
  - Border: 1px solid Neutral-200
  - Word Break: break-all
  - User Select: all (easy copy)

**Action Buttons:**
- **Layout:** Horizontal row, 8px gap
- **Margin Top:** 12px

**Copy Link Button:**
- **Text:** "Copy Link"
- **Icon:** Copy icon (16x16px, left)
- **Style:** Secondary button
- **Size:** Medium
- **Behavior:**
  - On click: Copy URL to clipboard
  - Show toast: "✓ Link copied!"
  - Button text changes to "Copied!" for 2 seconds

**Open Verification Button:**
- **Text:** "Open Verification Page"
- **Icon:** ExternalLink icon (16x16px, right)
- **Style:** Secondary button
- **Size:** Medium
- **Behavior:** Open URL in new tab

**Technical:**
```tsx
{badge.visibility === 'PUBLIC' && (
  <section className="px-6 py-6 border-t border-neutral-200">
    <h3 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2">
      <Link2 className="w-5 h-5" />
      Verification
    </h3>
    
    <div>
      <p className="text-sm font-medium text-neutral-700 mb-2">Public URL:</p>
      <div className="bg-neutral-50 border border-neutral-200 rounded p-3 font-mono text-sm text-neutral-600 break-all select-all">
        {badge.verificationUrl}
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(badge.verificationUrl);
            toast.success('Link copied!');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <Copy className="w-4 h-4 mr-2" />
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => window.open(badge.verificationUrl, '_blank')}
        >
          Open Verification Page
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  </section>
)}
```

---

### 7. Action Footer

**Layout:**
```
[Share to Linked✅ **Open inline form** (embedded modal/dialog)
  - **Decision:** Use inline form for Sprint 4 (may switch to external system later)
  - **Form Fields:**
    - Issue Type dropdown (Incorrect info, Technical problem, Other)
    - Description textarea (500 char max)
    - Email confirmation (pre-filled with user email)
    - Submit button
  - **Submission:** Email to g-credit@outlook.com with badge details
  - **Future:** May integrate with ticketing system (Jira, ServiceNow, etc.)ggle Privacy] [Report Issue]
```

**Specifications:**
- **Padding:** 20px 24px
- **Background:** Neutral-50
- **Border Top:** 1px solid Neutral-200
- **Position:** Sticky bottom (always visible)
- **Layout:** Horizontal flex, gap 8px, wrap on mobile

**Share to LinkedIn Button:**
- **Text:** "Share to LinkedIn"
- **Icon:** LinkedIn icon (20x20px, left) - use react-icons or Lucide
- **Style:** Primary button
- **Size:** Medium
- **Behavior:** Open LinkedIn share dialog (see Sprint 3 implementation)
- **Condition:** Only show if status = CLAIMED

**Download Badge Button:**
- **Text:** "Download Badge"
- **Icon:** Download icon (20x20px, left)
- **Style:** Secondary button
- **Size:** Medium
- **Behavior:** Download badge image as PNG (512x512px)

**Toggle Privacy Button:**
- **Text:** "Toggle Privacy"
- **Icon:** Current visibility icon (🌐 or 🔒)
- **Style:** Secondary button
- **Size:** Medium
- **Behavior:** Switch between PUBLIC ↔ INTERNAL
- **Confirmation:** Show confirmation dialog if switching to PUBLIC

**Report Issue Button:**
- **Text:** "Report Issue"
- **Icon:** AlertCircle icon (20x20px, left)
- **Style:** Ghost button (text-only, minimal)
- **Size:** Medium
- **Position:** Far right (margin-left: auto)
- **Behavior:** Open support/report form

**Technical:**
```tsx
<div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-5 flex flex-wrap gap-2">
  {/* Share to LinkedIn */}
  {badge.status === 'CLAIMED' && (
    <Button onClick={() => shareToLinkedIn(badge)}>
      <Linkedin className="w-5 h-5 mr-2" />
      Share to LinkedIn
    </Button>
  )}
  
  {/* Download */}
  <Button variant="secondary" onClick={() => downloadBadge(badge.id)}>
    <Download className="w-5 h-5 mr-2" />
    Download Badge
  </Button>
  
  {/* Toggle Privacy */}
  <Button variant="secondary" onClick={() => togglePrivacy(badge.id)}>
    {badge.visibility === 'PUBLIC' ? (
      <><Globe className="w-5 h-5 mr-2" />Make Internal</>
    ) : (
      <><Lock className="w-5 h-5 mr-2" />Make Public</>
    )}
  </Button>
  
  {/* Report Issue */}
  <Button variant="ghost" className="ml-auto" onClick={() => reportIssue(badge.id)}>
    <AlertCircle className="w-5 h-5 mr-2" />
    Report Issue
  </Button>
</div>
```

---

## Mobile Modal Layout (≤768px)

### Layout Adaptations

**Key Changes:**
- **Width:** 100% viewport width with 16px margin
- **Max Height:** 95vh (more vertical space)
- **Image Size:** 160x160px (smaller)
- **Layout:** All content stacks vertically
- **Footer Actions:** Vertical stack (full-width buttons)
- **Font Sizes:** Reduced by 2-4px
- **Padding:** Reduced to 16px

**Mobile Footer:**
```
[Share to LinkedIn]  (full width)
[Download Badge]     (full width)
[Toggle Privacy]     (full width)
[Report Issue]       (full width, ghost)
```

**Technical:**
```tsx
<div className="sm:max-w-[800px] max-w-full mx-4 sm:mx-auto">
  {/* Modal content with responsive classes */}
</div>

// Footer mobile layout
<div className="flex flex-col sm:flex-row gap-2">
  {/* Buttons stack vertically on mobile, horizontal on desktop */}
</div>
```

---

## Accessibility

### Keyboard Navigation

**Tab Order:**
1. Close button (X)
2. Visibility badge (if clickable)
3. Copy Link button (if visible)
4. Open Verification button (if visible)
5. Share to LinkedIn button
6. Download Badge button
7. Toggle Privacy button
8. Report Issue button

**Keyboard Shortcuts:**
- `ESC`: Close modal
- `Tab` / `Shift+Tab`: Navigate elements
- `Enter` / `Space`: Activate buttons

**Focus Management:**
```tsx
const modalRef = useRef<HTMLDivElement>(null);
const closeButtonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (isOpen) {
    // Trap focus within modal
    closeButtonRef.current?.focus();
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [isOpen]);
```

### Screen Reader Support

**ARIA Labels:**
```tsx
<Dialog 
  open={isOpen} 
  onOpenChange={onClose}
  aria-labelledby="badge-detail-title"
  aria-describedby="badge-detail-description"
>
  <DialogTitle id="badge-detail-title" className="sr-only">
    {badge.title} Badge Details
  </DialogTitle>
  
  <div id="badge-detail-description" className="sr-only">
    Detailed information about the {badge.title} badge including description, 
    criteria, timeline, and verification details.
  </div>
  
  {/* Content with proper semantic HTML */}
</Dialog>
```

**Section Headings:**
- All sections use proper heading hierarchy (h2, h3)
- Headings have IDs for screen reader navigation

**Live Regions:**
```tsx
<div role="status" aria-live="polite" className="sr-only">
  {copied && "Link copied to clipboard"}
  {privacyChanged && `Badge is now ${badge.visibility.toLowerCase()}`}
</div>
```

---

## Performance

### Lazy Loading

**Modal Content:**
- Badge details fetched only when modal opens
- Show loading skeleton while fetching

**Loading State:**
```tsx
{isLoading ? (
  <div className="p-6">
    <Skeleton className="w-64 h-64" />
    <Skeleton className="w-full h-8 mt-4" />
    <Skeleton className="w-3/4 h-4 mt-2" />
  </div>
) : (
  <BadgeDetailContent badge={badge} />
)}
```

### Animations

**Smooth Transitions:**
- Modal entrance: 200ms fade + scale
- Section transitions: None (instant)
- Button hovers: 100ms color/shadow
- Badge image: No animation (static)

---

## Testing Checklist

### Functional Testing

- [ ] Modal opens when badge card clicked
- [ ] Close button closes modal
- [ ] ESC key closes modal
- [ ] Click outside backdrop closes modal
- [ ] All buttons navigate/perform correct actions
- [ ] Copy Link copies to clipboard correctly
- [ ] Privacy toggle updates badge visibility
- [ ] Share to LinkedIn opens correct dialog
- [ ] Download badge downloads correct file
- [ ] Issuer message displays when present
- [ ] Timeline shows correct events
- [ ] Verification section only shows for public badges
- [ ] Report issue opens support form

### Accessibility Testing

- ✅ Team Decisions Confirmed (2026-01-28):**
- ✅ Evidence Files: **YES** - Show employee-uploaded evidence files with download/preview
  - Display file name, size, type icon
  - Download button for all files
  - Preview button for images
  - Show max 5 files, "View all" link for more
- ✅ Similar Badges: **YES** - Add "Similar Badges" recommendation section (see new section below)
- ✅ Report Issue: **Inline form** for Sprint 4 (may switch to external system later)
  - Simple form: Issue type, description, email
  - Submits to g-credit@outlook.com
  - Future: Integrate with ticketing system
- 📋 Version History: Not in Sprint 4 scope (consider for future enhancement)

---

## Similar Badges Section (New Addition)

**Decision:** ✅ **Include in Sprint 4**

**Component:** Similar Badges Recommendation

**Layout:**
```
─────────────────────────────────────────────────────────────────

🎯 Similar Badges You Might Like

[Badge 1]        [Badge 2]        [Badge 3]
Python Advanced  Data Science    Machine Learning
Microsoft Learn  Coursera         edX
[View Details]   [View Details]   [View Details]
```

**Specifications:**
- **Position:** After Verification section, before Action Footer
- **Padding:** 24px
- **Border Top:** 1px solid Neutral-200

**Section Heading:**
- **Text:** "🎯 Similar Badges You Might Like"
- **Typography:** H3 (20px), Semibold, Neutral-800
- **Margin Bottom:** 16px

**Badge Cards:**
- **Layout:** Horizontal scrollable row (3 visible on desktop, 1 on mobile)
- **Card Size:** 200x240px
- **Content:**
  - Badge image (128x128px)
  - Badge title (16px, Semibold, truncate)
  - Issuer name (14px, Regular, Neutral-600)
  - "View Details" button (Secondary style)
- **Gap:** 16px between cards
- **Overflow:** Horizontal scroll (show scroll arrows)

**Recommendation Logic:**
- **By Skills:** Badges with matching skills
- **By Category:** Same skill category (e.g., Technical Skills → Programming)
- **By Issuer:** Other badges from same issuer
- **By Popularity:** Most claimed badges in organization
- **Limit:** Show max 6 recommendations

**Technical:**
```tsx
{similarBadges && similarBadges.length > 0 && (
  <section className="px-6 py-6 border-t border-neutral-200">
    <h3 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2">
      <Target className="w-5 h-5" />
      Similar Badges You Might Like
    </h3>
    
    <div className="flex gap-4 overflow-x-auto pb-4">
      {similarBadges.map((similarBadge) => (
        <Card 
          key={similarBadge.id} 
          className="flex-shrink-0 w-[200px] p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => openBadgeDetail(similarBadge.id)}
        >
          <img 
            src={similarBadge.imageUrl} 
            alt={similarBadge.title}
            className="w-32 h-32 mx-auto mb-3 rounded-md"
          />
          <h4 className="font-semibold text-center mb-1 truncate" title={similarBadge.title}>
            {similarBadge.title}
          </h4>
          <p className="text-sm text-neutral-600 text-center mb-3 truncate">
            {similarBadge.issuer}
          </p>
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              openBadgeDetail(similarBadge.id);
            }}
          >
            View Details
          </Button>
        </Card>
      ))}
    </div>
  </section>
)}
```
- [ ] All buttons have ARIA labels
- [ ] Color contrast meets WCAG AA
- [ ] Text is readable at 200% zoom

### Visual Testing

- [ ] Layout matches specifications (desktop)
- [ ] Layout adapts correctly on mobile
- [ ] Typography scales correctly
- [ ] Spacing matches design tokens
- [ ] Buttons have correct hover states
- [ ] Modal backdrop blur works
- [ ] Badge image loads correctly
- [ ] Scrolling works when content exceeds height

---

## Design Deliverables Summary

✅ **Completed:**
1. Complete modal layout specification (desktop + mobile)
2. Seven component sections defined
3. Technical implementation examples
4. Accessibility guidelines
5. Performance considerations
6. Testing checklist
7. Mobile adaptations

**Ready for:** Sprint 4 Development

---

## Next Steps

1. **API Design:** Ensure backend provides all required badge fields
2. **Story Creation:** Bob includes modal stories in Sprint 4 backlog
3. **Component Development:** Implement BadgeDetailModal component
4. **Integration:** Connect modal to badge cards in wallet views
5. **QA Testing:** Validate all interactions and edge cases

---

**Questions for Team:**
- Should we show badge evidence/justification files (if uploaded by employee)?
- Do we want to add "Similar Badges" section at bottom (recommendations)?
- Should Report Issue open inline form or external support ticket system?
- Do we need badge version history (if template gets updated after issuance)?
