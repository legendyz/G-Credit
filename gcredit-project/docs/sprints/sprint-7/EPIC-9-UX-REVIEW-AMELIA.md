# Epic 9: Badge Revocation - UX Review

**Reviewer:** Amelia, Senior UX Designer  
**Date:** January 31, 2026  
**Sprint:** Sprint 7  
**Epic:** Epic 9 - Badge Revocation (Stories 9.1-9.5)  
**Status:** 🔍 UX Review Complete - Decisions Required

---

## Executive Summary

This UX review evaluates the user-facing aspects of Badge Revocation across 5 stories (9.1-9.5). The review focuses on **how revoked badges are displayed, how admins revoke badges, and notification UX**.

**Critical Findings:**
- ✅ **3 APPROVED** design decisions align with UX principles
- ⚠️ **7 DECISIONS REQUIRED** - Product Owner input needed
- ❌ **2 UX VIOLATIONS** - Must change before implementation
- 💡 **8 RECOMMENDATIONS** - Improvements to enhance user experience

**Most Critical Decision Needed:**
- **Q1 (Story 9.3):** How should revoked badges appear in employee wallet? Current spec shows "Active/Revoked" filter tabs, but this violates **Recognition-First Design Principle** by treating revocation as a primary categorization.

---

## Story-by-Story UX Analysis

### Story 9.1: Badge Revocation API ✅

**Scope:** Backend API for revoking badges  
**UX Impact:** No direct user-facing UI

**Review:**
- ✅ Soft-delete pattern preserves original data (good for audit/transparency)
- ✅ Reason field required (enables meaningful communication to users)
- ✅ Notes field optional but recorded (allows contextual explanation)
- ✅ Audit logging ensures accountability

**UX Alignment:** APPROVED - Foundation supports transparent, accountable revocation process.

---

### Story 9.2: Revoked Badge Display in Verification Page ⚠️

**User:** Public Viewer/Verifier  
**Goal:** Understand if badge is valid and why it was revoked

#### UX Question 9: How to display revoked badge on public verification page?

**Current Spec (from Story 9.2):**
```
Red banner/alert at top: "🚫 BADGE REVOKED"
Revoked date + reason displayed
Original badge details grayed out (opacity 50%)
Download/Share buttons disabled
```

**⚠️ NEEDS DECISION: Status indicator design**

**Options:**
- **Option A:** Red banner "BADGE REVOKED" (current spec)
- **Option B:** Status badge chip - Green "VALID" → Red "REVOKED"
- **Option C:** Warning icon + neutral text "Status: No Longer Valid"

**UX Analysis:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **A: Red Banner** | High visibility, immediate recognition, clear urgency | Potentially harsh tone, may feel accusatory to recipient | ⚠️ Use with empathetic copy |
| **B: Status Badge** | Clean, professional, consistent with UI patterns | Less prominent, might be overlooked by verifiers | ❌ Too subtle for critical info |
| **C: Warning Icon** | Neutral tone, professional | "No longer valid" feels vague, doesn't explain "why" | ⚠️ Acceptable but less direct |

**💡 RECOMMENDATION:** 
**Hybrid Approach - Option A with softer copy:**
```
┌─────────────────────────────────────────┐
│ ⚠️ THIS BADGE IS NO LONGER VALID        │
│                                         │
│ Status: Revoked on February 5, 2026    │
│ This credential has been withdrawn.     │
│                                         │
│ [View Details] (expands to show reason) │
└─────────────────────────────────────────┘
```

**Rationale:**
- "No Longer Valid" is less harsh than "REVOKED" (softer tone)
- Warning icon (⚠️) instead of red X (🚫) feels informative, not punitive
- "Credential has been withdrawn" = neutral, professional language
- Collapsible reason section respects privacy while providing transparency

**✅ APPROVED:** Grayed-out original badge details (current spec)
- Good UX: Shows historical context, verifier can see what was claimed
- Maintains audit trail transparency

---

#### UX Question 10: Should external viewers see revocation reason?

**Current Spec:** Reason displayed publicly (Policy Violation, Issued in Error, etc.)

**⚠️ NEEDS DECISION: Privacy vs. Transparency**

**Options:**
- **Option A:** Always show reason publicly (current spec)
- **Option B:** Never show reason publicly (privacy first)
- **Option C:** Show only "safe" reasons publicly (e.g., "Expired" yes, "Policy Violation" no)
- **Option D:** Show generic message + contact info: "Contact issuer for details"

**UX Analysis:**

**Privacy Considerations:**
- "Policy Violation" publicly visible = potential reputation damage to employee
- "Issued in Error" = face-saving, less harmful
- "Expired" = neutral, expected lifecycle event
- "Employee Left Organization" = potentially sensitive (termination circumstances)

**HR/Legal Implications:**
- Displaying "Policy Violation" publicly could expose company to liability
- Different reasons have different sensitivity levels
- Employee may not have been informed about public visibility of reason

**Best Practice Reference:**
- Digital credential standards (IMS Global, Open Badges) recommend **minimal public disclosure**
- Professional certifications (AWS, Google Cloud) show "Revoked" status but rarely show reason
- LinkedIn profile updates don't show "why" someone left a company

**💡 RECOMMENDATION:**
**Option D + Reason Categories:**

**Publicly Visible Reasons:**
- ✅ "Expired" - Lifecycle event, not embarrassing
- ✅ "Issued in Error" - System/admin mistake, not employee fault
- ✅ "Credential Replaced" - Positive (upgraded to newer version)

**Privacy-Protected Reasons (show generic message):**
- 🔒 "Policy Violation" → Show: "Contact issuer for verification status"
- 🔒 "Employee Left Organization" → Show: "This credential is no longer active"
- 🔒 "Other" → Show: "Contact issuer for details"

**Example Implementation:**
```typescript
const publicReasons = ['Expired', 'Issued in Error', 'Credential Replaced'];

function getPublicRevocationMessage(reason: string) {
  if (publicReasons.includes(reason)) {
    return `Reason: ${reason}`;
  }
  return 'For verification inquiries, contact the issuing organization.';
}
```

**Rationale:**
- Balances transparency (for benign reasons) with privacy (for sensitive reasons)
- Protects employee reputation while maintaining system credibility
- Reduces legal risk for organization
- Aligns with **Privacy by Empowerment, Not Paranoia** UX principle

**❌ UX VIOLATION:** Current spec exposes all reasons publicly
- **Risk:** Reputation damage to employees, potential HR/legal issues
- **Must Change:** Implement reason categorization before launch

---

### Story 9.3: Employee Wallet Display for Revoked Badges ⚠️❌

**User:** Employee (Badge Owner)  
**Goal:** Understand which badges are revoked and why

#### UX Question 1: How should revoked badges appear in employee wallet?

**Current Spec (from Story 9.3):**
```
Filter tabs: [Active (5)] [Revoked (1)] [All (6)]
Default view: "Active" (hides revoked by default)
Revoked badges show red "REVOKED" badge overlay
Badge card grayed out (opacity 50%)
```

**⚠️ NEEDS DECISION: Display pattern**

**Options:**
- **Option A:** Greyed out with red "REVOKED" banner overlay (inline with active badges)
- **Option B:** Separate "Revoked Badges" section (collapsed by default) (current spec)
- **Option C:** Hidden by default with toggle "Show Revoked Badges"

**UX Analysis:**

**Option A: Inline with Banner Overlay**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Badge 1     │  │ Badge 2     │  │ 🚫 REVOKED  │
│ Python Pro  │  │ React Ninja │  │ Badge 3     │
│ Active      │  │ Active      │  │ (grayed)    │
└─────────────┘  └─────────────┘  └─────────────┘
```
**Pros:** 
- Chronological timeline preserved (shows career journey)
- Transparency: Employee always aware of revoked status
- No cognitive load switching between tabs

**Cons:** 
- Visual clutter if many revoked badges
- Violates **Recognition-First Design** principle (wallet should celebrate achievements)
- Emotional impact: Seeing revoked badges every time reduces motivation

**Option B: Separate Section (Filter Tabs) - Current Spec**
```
[Active (5)] [Revoked (1)] [All (6)]
─────────

Default shows only Active badges
Click "Revoked (1)" to see revoked section
```
**Pros:** 
- Clean default view (positive focus)
- Revoked badges accessible but not prominent
- Aligns with **Recognition-First Design**

**Cons:** 
- Requires user action to see revoked badges (reduces awareness)
- Tab pattern adds UI complexity
- Count in badge "(1)" could still feel negative

**Option C: Hidden with Toggle**
```
[✓] Show Revoked Badges (checkbox at bottom)

Only shows when explicitly toggled on
No count visible by default
```
**Pros:** 
- Maximum positivity (default view = achievements only)
- Minimal UI complexity
- Reduces psychological burden

**Cons:** 
- Employees might forget about revoked badges
- Less transparent than Options A/B
- Could feel like system is "hiding" information

**💡 RECOMMENDATION:**
**Modified Option B - "Timeline View with Collapsible Section"**

```
┌─────────────────────────────────────────┐
│ My Badge Journey                        │
│                                         │
│ 🎖️ Active Badges (5)                    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │ Badge 1 │ │ Badge 2 │ │ Badge 3 │   │
│ └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│ ▶ Badge History (1 revoked)            │ ← Collapsed by default
│   [Click to expand]                     │
└─────────────────────────────────────────┘

When expanded:
│ ▼ Badge History (1 revoked)            │
│ ┌─────────────┐                        │
│ │ ⚠️ Python Pro│                        │
│ │ No longer   │                        │
│ │ valid       │                        │
│ │ Revoked:    │                        │
│ │ Feb 5, 2026 │                        │
│ └─────────────┘                        │
```

**Rationale:**
- ✅ Aligns with **Recognition-First Design** (default shows achievements)
- ✅ Transparent (revoked section always visible, just collapsed)
- ✅ Neutral language ("Badge History" vs. "Revoked Badges")
- ✅ Empathetic design (employees not confronted with revocations every login)
- ✅ Maintains chronological awareness (section shows when badges were active)

**Key UX Principles Applied:**
1. **Recognition-First Design:** Wallet homepage celebrates active credentials
2. **Transparency with Empathy:** Revoked badges accessible but not prominent
3. **User Control:** Employee chooses to expand history section
4. **Neutral Tone:** "Badge History" frame = neutral vs. "Revoked" = negative

**❌ UX VIOLATION:** Current spec uses "Revoked" filter tab as primary categorization
- **Problem:** Treats revocation as equal to active status (cognitive framing issue)
- **Impact:** Reduces motivational value of badge wallet (no longer feels like achievement showcase)
- **Must Change:** Implement collapsible section pattern instead of tabs

---

#### UX Question 2: Share button on revoked badges - how to communicate it's disabled?

**Current Spec:** 
- Share button (LinkedIn, Teams) disabled
- Tooltip: "This badge has been revoked and cannot be shared"

**✅ APPROVED:** Disabled button with tooltip (current spec)

**Additional Recommendations:**

**💡 RECOMMENDATION: Enhanced Disabled State**
```css
.share-button-disabled {
  background: #E1DFDD;          /* Neutral-300 */
  color: #A19F9D;                /* Neutral-500 */
  cursor: not-allowed;
  pointer-events: none;          /* Prevents accidental clicks */
}

.share-button-disabled::after {
  content: "🔒";                 /* Visual lock icon */
}
```

**Tooltip Copy Improvement:**
```
Current: "This badge has been revoked and cannot be shared"
Improved: "This credential is no longer active and cannot be shared"
```

**Rationale:**
- "No longer active" = softer than "has been revoked"
- Lock icon (🔒) = clear visual signal without text
- `pointer-events: none` prevents tooltip flicker

**Accessibility:**
- `aria-disabled="true"` attribute added
- Screen reader announces: "Share button, disabled. This credential is no longer active."

---

#### UX Question 3: Should employees see WHY their badge was revoked?

**Current Spec:** 
- Revocation reason displayed (Policy Violation, Issued in Error, etc.)
- Optional notes explaining why

**⚠️ NEEDS DECISION: Privacy and Tone**

**Options:**
- **Option A:** Show full revocation reason + notes (current spec)
- **Option B:** Show generic message "Contact admin for details"
- **Option C:** Show reason but redact sensitive notes
- **Option D:** Different messages based on reason category

**UX Analysis:**

**HR/Employee Relations Considerations:**
- Employees deserve to know why their credential was revoked (fairness)
- BUT: Public notes field could contain sensitive HR information
- Different reasons require different communication approaches:
  - "Issued in Error" = Explain it was admin mistake (reduces employee confusion)
  - "Policy Violation" = May require HR conversation first (sensitive)
  - "Expired" = Expected lifecycle event (no explanation needed)
  - "Employee Left Organization" = Obvious, no detail needed

**Best Practice Reference:**
- Performance management UX: **Negative feedback should be delivered by humans, not automated systems**
- System should inform of status change, manager should explain "why"
- Avoid automated messages that feel like accusations

**💡 RECOMMENDATION:**
**Option D - Context-Aware Messaging**

**Category 1: System/Admin Errors (Safe to Explain)**
```
Reason: "Issued in Error"
Message: "This badge was issued incorrectly and has been withdrawn. 
         This was an administrative error, not a reflection on you."
Contact: [View Correct Badge] (if reissued)
```

**Category 2: Policy/Expiration (Neutral Explanation)**
```
Reason: "Expired"
Message: "This credential expired on [date] and is no longer valid."
Contact: [Renew Credential] (if renewal available)
```

**Category 3: Sensitive Reasons (Manager Conversation Required)**
```
Reason: "Policy Violation"
Message: "This credential is no longer active. 
         If you have questions, please contact your manager or HR."
Contact: hr@company.com
```

**Implementation Logic:**
```typescript
function getEmployeeRevocationMessage(reason: string, notes?: string) {
  const safeReasons = ['Issued in Error', 'Expired', 'Credential Replaced'];
  
  if (safeReasons.includes(reason)) {
    return {
      reason: reason,
      message: getDetailedMessage(reason, notes),
      showContact: false
    };
  }
  
  // Sensitive reasons
  return {
    reason: 'No longer active',  // Generic
    message: 'If you have questions, please contact your manager or HR.',
    showContact: true,
    contactEmail: 'hr@company.com'
  };
}
```

**Rationale:**
- ✅ Balances transparency (employees informed) with sensitivity (HR/privacy concerns)
- ✅ Reduces employee anxiety for benign reasons (system errors, expirations)
- ✅ Protects sensitive situations (policy violations, terminations)
- ✅ Aligns with **Blame-Free Language Important** principle
- ✅ Directs employees to appropriate channels for questions

**❌ UX VIOLATION:** Current spec shows all notes to employees
- **Risk:** Sensitive HR notes (e.g., "terminated for misconduct") visible to employee before manager conversation
- **Impact:** Legal/HR compliance issues, poor employee experience
- **Must Change:** Implement reason categorization and note redaction

---

### Story 9.4: Revocation Notifications ⚠️

**User:** Employee (Badge Recipient)  
**Goal:** Be informed promptly about revocation with appropriate tone

#### UX Question 4: Email notification tone - how to communicate revocation sensitively?

**Current Spec (from Story 9.4):**
```
Subject: Badge Revocation Notification - [Badge Name]
Body: "We are writing to inform you that your badge for 
       '[Badge Name]' has been revoked as of [date]."
```

**⚠️ NEEDS DECISION: Tone and Framing**

**Options:**
- **Option A:** Formal/neutral tone (current spec)
- **Option B:** Apologetic tone (emphasizes system regret)
- **Option C:** Blame-free, matter-of-fact tone

**UX Analysis:**

**Current Spec Assessment:**
- ✅ Professional and clear
- ⚠️ "has been revoked" feels formal/bureaucratic
- ❌ "We are writing to inform you" = very stiff, legal-sounding
- ❌ Missing empathy/context

**Tone Comparison:**

| Tone | Example Opening | Pros | Cons |
|------|----------------|------|------|
| **Formal** (current) | "We are writing to inform you that your badge has been revoked" | Professional, clear | Cold, impersonal, feels punitive |
| **Apologetic** | "We apologize, but your badge is no longer valid due to..." | Shows empathy, humanizes system | Could imply company fault even when not applicable |
| **Blame-free Matter-of-fact** | "Your [Badge Name] credential status has changed" | Neutral, doesn't assign blame | Could feel too casual for serious situations |

**💡 RECOMMENDATION:**
**Adaptive Tone Based on Revocation Reason**

**Template 1: System/Admin Errors (Apologetic)**
```
Subject: Update to Your Badge - [Badge Name]

Hi [Employee Name],

We're reaching out because your [Badge Name] badge is no longer active.

This credential was issued in error, and we apologize for any confusion. 
This was an administrative mistake, not a reflection on your performance.

[If applicable: Your correct badge is ready to claim here: [Link]]

If you have any questions, please contact [Issuer Name] or reply to this email.

Thanks for your understanding,
G-Credit Team
```

**Template 2: Policy/Expiration (Neutral, Informative)**
```
Subject: Credential Status Update - [Badge Name]

Hi [Employee Name],

Your [Badge Name] badge expired on [date] and is no longer active.

To maintain this credential, you can renew by [renewal process].
[Or: Contact your manager about recertification options.]

View your active badges: [Wallet Link]

Questions? Contact: [HR/Admin Email]

G-Credit Team
```

**Template 3: Sensitive Reasons (Formal but Respectful)**
```
Subject: Important: Credential Status Change

Hi [Employee Name],

Your [Badge Name] credential is no longer active as of [date].

If you have questions about this change, please contact your manager or HR.

HR Contact: hr@company.com

G-Credit Team
```

**Key UX Principles Applied:**
1. **Blame-Free Language:** Avoid "revoked" (feels punitive), use "no longer active" (neutral)
2. **Adaptive Empathy:** Tone matches severity of situation
3. **Clear Next Steps:** Tell employee what to do (contact HR, renew, etc.)
4. **Human Voice:** "We're reaching out" vs. "We are writing to inform you"

**✅ APPROVED:** Email contains badge name, revocation date, link to wallet
**❌ UX VIOLATION:** Current spec uses stiff, formal tone ("We are writing to inform you")
- **Must Change:** Implement adaptive templates with human, empathetic tone

---

#### UX Question 5: Email content - what information to include?

**Current Spec Includes:**
- Badge name ✅
- Revocation date ✅
- Revocation reason ✅
- Optional notes from admin ⚠️
- Link to wallet ✅
- Contact information (HR or admin email) ✅

**UX Analysis:**

| Element | Current Spec | Recommendation | Rationale |
|---------|--------------|----------------|-----------|
| **Badge Name** | ✅ Included | ✅ Keep | Essential context |
| **Revocation Date** | ✅ Included | ✅ Keep | Audit trail, clarity |
| **Revocation Reason** | ✅ Always shown | ⚠️ Conditional (see Q3) | Privacy concerns for sensitive reasons |
| **Admin Notes** | ⚠️ Optional | ❌ Remove/Redact | Could contain sensitive HR information |
| **Wallet Link** | ✅ Included | ✅ Keep | Next step for employee |
| **Contact Info** | ✅ HR email | ✅ Keep, Make Adaptive | Different reasons need different contacts |
| **"No longer valid" warning** | ❌ Missing | ✅ Add | External verifiers need to know |
| **Next Steps** | ❌ Missing | ✅ Add | Reduces employee anxiety |

**💡 RECOMMENDATION: Enhanced Email Content Structure**

```
┌──────────────────────────────────────────────┐
│ Subject: [Adaptive Based on Reason]          │
│                                              │
│ Hi [Employee Name],                          │
│                                              │
│ 1. WHAT HAPPENED                             │
│    Your [Badge Name] credential status       │
│    changed on [date].                        │
│                                              │
│ 2. WHY (Conditional - see Q3 logic)          │
│    [Reason message based on category]        │
│                                              │
│ 3. WHAT THIS MEANS                           │
│    ⚠️ This badge is no longer valid and      │
│    cannot be verified or shared externally.  │
│                                              │
│ 4. NEXT STEPS                                │
│    • View your active badges: [Wallet Link]  │
│    • Questions? Contact: [Context-specific]  │
│    • [Conditional: Renewal/Replacement link] │
│                                              │
│ Thanks,                                      │
│ G-Credit Team                                │
└──────────────────────────────────────────────┘
```

**Accessibility:**
- Plain text version for email clients without HTML support
- High contrast (WCAG AA compliant)
- Links clearly labeled (no "click here")
- Mobile-responsive (60% of employees read email on mobile)

**✅ APPROVED:** Core content elements (badge name, date, wallet link, contact)
**⚠️ NEEDS DECISION:** Admin notes field - should it be included?
- **Recommendation:** Redact notes field, only show to admins/issuers, not employees

---

### Story 9.5: Admin Badge Revocation UI ⚠️

**User:** Admin/Issuer  
**Goal:** Revoke badges efficiently with proper safeguards

#### UX Question 6: Where does "Revoke" button appear in admin dashboard?

**Current Spec:**
- "Revoke" button on each badge row in Badge Management page
- Button visible only for ISSUED or CLAIMED badges
- Disabled if Issuer didn't issue the badge themselves

**⚠️ NEEDS DECISION: Button Placement Pattern**

**Options:**
- **Option A:** Per-badge action menu dropdown (current spec)
- **Option B:** Inline button next to badge
- **Option C:** Bulk selection + revoke button

**UX Analysis:**

**Option A: Action Menu Dropdown**
```
Badge List Table:
[Badge Name] | [Recipient] | [Status] | [...] ▼
                                        └─ View Details
                                           Edit Badge
                                           Revoke Badge
                                           Download Report
```
**Pros:**
- Clean table layout (no clutter)
- Scalable (can add more actions without UI bloat)
- Standard admin pattern

**Cons:**
- Requires two clicks (open menu → click revoke)
- Less immediate visibility (hidden behind dropdown)

**Option B: Inline Button (Current Spec)**
```
Badge List Table:
[Badge Name] | [Recipient] | [Status] | [Revoke]
```
**Pros:**
- One-click access
- High visibility (discoverages action)
- Fastest for single revocations

**Cons:**
- Visual clutter if many badges
- No room for additional actions
- Risk of accidental clicks

**Option C: Bulk Selection + Toolbar**
```
[✓] Select All  |  [Revoke Selected (3)] [Export (3)]

☑ Badge 1
☑ Badge 2
☑ Badge 3
☐ Badge 4
```
**Pros:**
- Efficient for multiple revocations
- Reduces repetitive actions
- Standard admin pattern (Gmail, Trello)

**Cons:**
- Requires selection step
- Dangerous (easier to revoke wrong badges in bulk)
- No single-badge quick action

**💡 RECOMMENDATION:**
**Hybrid: Option A (Dropdown) + Option C (Bulk for Admins Only)**

**For Issuers (Normal Use):**
```
[Badge Name] | [Recipient] | [Status] | [...] ▼
                                        ├─ View Details
                                        ├─ Edit Criteria
                                        ├─ ⚠️ Revoke Badge
                                        └─ Download JSON-LD
```
- Dropdown prevents accidental clicks
- "⚠️ Revoke Badge" icon makes action visually distinct
- Issuers rarely revoke badges (infrequent operation)

**For Admins (Bulk Operations):**
```
Badge Management Page - Admin View

[Filter: Status ▼] [Search...]  |  [☑ Bulk Actions ▼]
                                   ├─ Revoke Selected
                                   ├─ Export CSV
                                   └─ Change Issuer

☐ [Badge 1] | [Recipient] | ISSUED | 2026-01-15 | [...]
☐ [Badge 2] | [Recipient] | CLAIMED | 2026-01-16 | [...]
```
- Bulk mode hidden by default (reduces UI complexity)
- Checkbox column appears when "Bulk Actions" toggled on
- Useful for mass revocations (e.g., program discontinued, batch error)

**Rationale:**
- ✅ Prevents accidental single-badge revocations (dropdown hides action)
- ✅ Efficient bulk operations for admins (rare but critical use case)
- ✅ Scalable (can add more actions to dropdown)
- ✅ Role-appropriate UI (Issuers see simple dropdown, Admins see advanced tools)

**Key UX Principles Applied:**
1. **Progressive Disclosure:** Dangerous actions hidden behind dropdown
2. **Role-Based Complexity:** Admins get power tools, Issuers get simplicity
3. **Error Prevention:** Two-click pattern reduces accidental revocations

---

#### UX Question 7: Revocation modal design - how to prevent accidental revocations?

**Current Spec:**
```
Modal:
- Title: "Revoke Badge - [Badge Name]"
- Reason dropdown (required)
- Notes textarea (optional, max 1000 chars)
- "Confirm Revoke" button (red/danger style)
- "Cancel" button
```

**⚠️ NEEDS DECISION: Confirmation Pattern**

**Options:**
- **Option A:** Confirmation step required (current spec)
- **Option B:** Type badge name to confirm
- **Option C:** Two-step process (select reason first, then confirm)

**UX Analysis:**

**Current Spec Assessment:**
- ✅ Reason dropdown = forces admin to think about revocation reason
- ✅ Red button = visual warning
- ⚠️ No friction beyond clicking "Confirm" = possible accidental clicks

**Error Prevention Patterns:**

| Pattern | Friction Level | Error Prevention | User Frustration | Use Case |
|---------|----------------|------------------|------------------|----------|
| **Single Click** | Low | ❌ None | ✅ Low | Non-destructive actions |
| **Confirmation Modal** (current) | Medium | ⚠️ Some | ✅ Low | Reversible actions |
| **Type to Confirm** | High | ✅ High | ⚠️ Medium | Irreversible + critical |
| **Two-Step Modal** | High | ✅ High | ⚠️ Medium | Complex decisions |

**Badge Revocation Characteristics:**
- **Irreversible?** ⚠️ Semi-reversible (can re-issue, but loses claim history)
- **High Impact?** ✅ Yes (affects employee's credential portfolio)
- **Frequency?** ❌ Rare (most badges never revoked)
- **Bulk Operation?** ⚠️ Sometimes (program discontinued, batch errors)

**Best Practice Reference:**
- **GitHub:** Delete repository requires typing repo name
- **AWS:** Terminate EC2 instance requires checkbox + typed confirmation
- **Slack:** Archive channel requires modal confirmation (no typing)
- **Trello:** Delete board requires modal confirmation (no typing)

**💡 RECOMMENDATION:**
**Modified Current Spec - Enhanced Modal with Preview + Checkbox**

```
┌──────────────────────────────────────────────┐
│ ⚠️ Revoke Badge                              │
│                                              │
│ You are about to revoke:                     │
│ ┌────────────────────────────────────────┐  │
│ │ [Badge Image]  Python Pro               │  │
│ │                Earned by: John Doe      │  │
│ │                Issued: Jan 15, 2026     │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ ⚠️ This will:                                │
│ • Invalidate the credential immediately      │
│ • Prevent external verification              │
│ • Send notification to badge recipient       │
│ • Create permanent audit log entry           │
│                                              │
│ Reason * (required)                          │
│ [Dropdown: Policy Violation ▼]              │
│   ├─ Policy Violation                        │
│   ├─ Issued in Error                         │
│   ├─ Expired                                 │
│   ├─ Employee Left Organization              │
│   └─ Other                                   │
│                                              │
│ Internal Notes (optional)                    │
│ [Textarea: 0/1000 characters]                │
│ ℹ️ Notes visible to admins only              │
│                                              │
│ ☐ I understand this action cannot be undone │ ← NEW
│                                              │
│ [Cancel]  [Revoke Badge] ← Disabled until ✓ │
└──────────────────────────────────────────────┘
```

**Key UX Improvements:**
1. **Visual Preview:** Shows badge image + recipient name (confirms correct target)
2. **Impact Statement:** Lists consequences (educates admin about action gravity)
3. **Checkbox Confirmation:** "I understand this action cannot be undone"
4. **Disabled Submit:** Button only enables after checkbox checked + reason selected
5. **Info Tooltip:** "Notes visible to admins only" (privacy transparency)

**Keyboard Accessibility:**
- Tab order: Reason → Notes → Checkbox → Cancel → Revoke
- Enter key on checkbox = check (no accidental form submit)
- Escape key = Cancel modal

**Character Count Indicator:**
```
Internal Notes (optional)
[Textarea content...]
847/1000 characters • Notes visible to admins only
```
- Real-time count updates
- Warning at 900+ characters (approaching limit)

**Rationale:**
- ✅ Checkbox adds friction without being annoying (one extra click)
- ✅ Badge preview prevents wrong-target revocations
- ✅ Impact statement educates admins (especially new users)
- ✅ Balances error prevention with usability (not as extreme as "type badge name")
- ✅ Scales well for bulk operations (checkbox per badge too tedious)

**For Bulk Revocations:**
```
┌──────────────────────────────────────────────┐
│ ⚠️ Revoke Multiple Badges (3 selected)       │
│                                              │
│ You are about to revoke:                     │
│ • Python Pro - John Doe                      │
│ • React Ninja - Jane Smith                   │
│ • AWS Cloud - Mike Chen                      │
│                                              │
│ Reason * (applies to all)                    │
│ [Dropdown: Select reason ▼]                  │
│                                              │
│ ⚠️ This action will affect 3 employees       │
│                                              │
│ ☐ I confirm revoking all 3 badges           │
│                                              │
│ [Cancel]  [Revoke All]                       │
└──────────────────────────────────────────────┘
```
- Same checkbox pattern for consistency
- Clear count: "3 selected", "3 employees"
- Single reason applies to all (bulk efficiency)

**✅ APPROVED:** Current spec modal structure (reason dropdown, notes, cancel/confirm)
**💡 RECOMMENDATION:** Add checkbox confirmation + badge preview + impact statement

---

#### UX Question 8: Audit log visibility - where do admins see revocation history?

**Current Spec:** Not explicitly defined in stories

**⚠️ NEEDS DECISION: Audit Log UX**

**Options:**
- **Option A:** Separate "Audit Log" page (dedicated view)
- **Option B:** Badge detail page shows history (contextual)
- **Option C:** User profile shows all revocations for that user (user-centric)
- **Option D:** All of the above (multiple entry points)

**UX Analysis:**

**Use Cases for Audit Log Access:**
1. **Investigate specific badge:** "Why was Badge X revoked?"
2. **Review admin actions:** "What did Admin Y revoke this month?"
3. **Track user credential history:** "Show all badge changes for User Z"
4. **Compliance reporting:** "Export all revocations for Q1 2026"

**Best Practice Reference:**
- **GitHub:** Audit log = dedicated page + per-repo security tab
- **AWS:** CloudTrail = dedicated service + per-resource event history
- **Salesforce:** Setup Audit Trail = dedicated page, exportable

**💡 RECOMMENDATION:**
**Option D - Multiple Entry Points (Federated Audit Log)**

**Entry Point 1: Dedicated Audit Log Page**
```
/admin/audit-log

Filters:
[Action ▼] [User ▼] [Date Range] [Search]
  ├─ Badge Issued
  ├─ Badge Claimed
  ├─ Badge Revoked  ← Focus
  └─ Badge Edited

Table:
Timestamp | Action | Badge | User | Admin | Reason
2026-01-31 10:15 | Revoked | Python Pro | John Doe | Admin Alice | Policy Violation
2026-01-30 14:22 | Revoked | React Ninja | Jane Smith | Issuer Bob | Issued in Error
```
**Pros:**
- Comprehensive view (all actions, not just revocations)
- Powerful filtering and export
- Compliance-friendly (audit requirement)

**Entry Point 2: Badge Detail Page - History Tab**
```
/admin/badges/:badgeId

Tabs: [Overview] [Criteria] [History]

History Tab:
Timeline View:
┌──────────────────────────────────────┐
│ ⚠️ Revoked by Admin Alice            │
│    Feb 5, 2026 at 10:15 AM           │
│    Reason: Policy Violation          │
│    Notes: [Admin notes visible]      │
└──────────────────────────────────────┘
│ ✓ Claimed by John Doe                │
│    Jan 16, 2026 at 2:30 PM           │
└──────────────────────────────────────┘
│ 🎖️ Issued by Issuer Bob              │
│    Jan 15, 2026 at 10:00 AM          │
└──────────────────────────────────────┘
```
**Pros:**
- Contextual (shows full badge lifecycle)
- Useful for investigations ("What happened to this badge?")
- Visual timeline = easy to understand

**Entry Point 3: User Profile - Credentials Tab**
```
/admin/users/:userId

Tabs: [Profile] [Credentials] [Activity]

Credentials Tab:
Active Badges (3)
Revoked Badges (1)
  • Python Pro - Revoked Feb 5, 2026 (Reason: Policy Violation)
```
**Pros:**
- User-centric view (useful for HR/manager reviews)
- Shows pattern of revocations (red flag for fraud investigation)

**Entry Point 4: Admin Dashboard - Recent Activity Widget**
```
Admin Dashboard Homepage

┌──────────────────────────────────────┐
│ Recent Revocations (Last 7 Days)     │
│                                      │
│ 5 badges revoked by 3 admins         │
│ [View Full Audit Log]                │
│                                      │
│ • Python Pro - John Doe (Today)      │
│ • React Ninja - Jane Smith (2d ago)  │
└──────────────────────────────────────┘
```
**Pros:**
- At-a-glance awareness for admins
- Quick access to full audit log

**Implementation Priority:**
1. **MVP (Sprint 7):** Entry Point 2 (Badge Detail Page History)
   - Minimal dev effort (already building badge detail page)
   - Covers most common use case (investigate specific badge)
2. **Phase 2:** Entry Point 1 (Dedicated Audit Log Page)
   - Compliance requirement (comprehensive reporting)
3. **Phase 3:** Entry Points 3 & 4 (User Profile, Dashboard Widget)
   - Nice-to-have, lower priority

**Audit Log Data Model:**
```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'ISSUED' | 'CLAIMED' | 'REVOKED' | 'EDITED';
  badgeId: string;
  badgeName: string;
  recipientId: string;
  recipientName: string;
  actorId: string;  // Admin/Issuer who performed action
  actorName: string;
  reason?: string;  // For revocations
  notes?: string;   // For revocations
  metadata?: Record<string, any>;  // Additional context
}
```

**Export Functionality:**
```
Audit Log Page:
[Export ▼]
  ├─ Export as CSV
  ├─ Export as JSON
  └─ Schedule Weekly Report (Email)
```
- Compliance requirement (external audits)
- Date range filter applied to export
- Max 10,000 records per export (performance limit)

**Rationale:**
- ✅ Multiple entry points serve different use cases
- ✅ Badge detail page history = MVP (most common need)
- ✅ Dedicated audit log page = compliance (comprehensive view)
- ✅ Aligns with **Audit Logging** principle in UX spec (line 547)

**💡 RECOMMENDATION:** Implement Badge Detail History (MVP) + plan for Audit Log Page (Phase 2)

---

## Summary of UX Decisions Required

### 🚨 Critical Decisions (Block Development)

| Question | Current Spec | Recommendation | Rationale |
|----------|--------------|----------------|-----------|
| **Q1: Wallet Display Pattern** | Filter tabs (Active/Revoked/All) | ❌ **Change to Collapsible Section** | Violates Recognition-First Design principle |
| **Q3: Employee Sees Why?** | Always show reason + notes | ❌ **Implement Reason Categorization** | Privacy/HR risk - sensitive notes exposed |
| **Q10: Public Reason Visibility** | Always show reason publicly | ❌ **Categorize Reasons (Public vs. Private)** | Reputation damage risk to employees |

### ⚠️ Important Decisions (Affect User Experience)

| Question | Options | Recommendation |
|----------|---------|----------------|
| **Q4: Email Notification Tone** | Formal / Apologetic / Matter-of-fact | **Adaptive Tone** (based on reason category) |
| **Q5: Email Content** | Current spec sufficient? | **Add "What This Means" + "Next Steps" sections** |
| **Q6: Admin Revoke Button Placement** | Dropdown / Inline / Bulk | **Hybrid: Dropdown (Issuer) + Bulk Mode (Admin)** |
| **Q7: Modal Confirmation Pattern** | Current modal | **Add checkbox + badge preview + impact statement** |
| **Q8: Audit Log Visibility** | Not specified | **Badge Detail History (MVP) + Audit Log Page (Phase 2)** |

### ✅ Approved Design Decisions

| Aspect | Current Spec | Status |
|--------|--------------|--------|
| API Structure (Story 9.1) | Soft-delete, audit logging | ✅ Approved |
| Verification Page Status (Q9) | Red banner "REVOKED" | ✅ Approved with copy refinement |
| Share Button Disabled State (Q2) | Disabled with tooltip | ✅ Approved with enhanced styling |
| Email Core Content (Q5) | Badge name, date, wallet link | ✅ Approved |
| Modal Structure (Q7) | Reason dropdown, notes, confirm/cancel | ✅ Approved with additions |

---

## UX Violations to Address

### ❌ Violation 1: Public Display of All Revocation Reasons (Story 9.2)

**Current Spec:** All reasons displayed publicly on verification page

**Problem:**
- "Policy Violation" publicly visible = reputation damage to employee
- "Employee Left Organization" = could expose termination circumstances
- Legal/HR risk if employee claims defamation

**Must Change:**
```typescript
// Implement reason categorization
const publicReasons = ['Expired', 'Issued in Error', 'Credential Replaced'];
const privateReasons = ['Policy Violation', 'Employee Left Organization', 'Other'];

if (privateReasons.includes(reason)) {
  return 'For verification inquiries, contact the issuing organization.';
}
```

**Impact if Not Fixed:**
- Legal liability for organization
- Employee trust eroded
- External verifiers see sensitive HR information

---

### ❌ Violation 2: Wallet Filter Tabs Treat Revocation as Primary Category (Story 9.3)

**Current Spec:** `[Active (5)] [Revoked (1)] [All (6)]` tabs

**Problem:**
- Violates **Recognition-First Design** principle (UX spec Section 1)
- Wallet should celebrate achievements, not categorize failures
- "Revoked (1)" count feels like a scarlet letter
- Reduces motivational value of badge wallet

**Must Change:**
```
Replace: Filter tabs
With: Collapsible "Badge History" section

┌─────────────────────────────────────────┐
│ 🎖️ Active Badges (5)                    │
│ [Badge grid...]                         │
│                                         │
│ ▶ Badge History (1 no longer valid)    │ ← Collapsed by default
└─────────────────────────────────────────┘
```

**Impact if Not Fixed:**
- Employees less motivated to earn badges (negative framing)
- Badge wallet feels like "achievement + failures list"
- Misaligned with project vision ("create culture of continuous learning")

---

### ❌ Violation 3: Sensitive Admin Notes Visible to Employees (Story 9.4)

**Current Spec:** Admin notes field sent in email notification to employee

**Problem:**
- Admin might write sensitive HR information: "Revoked due to performance issues"
- Employee receives this before manager conversation
- Violates **Blame-Free Language Important** principle

**Must Change:**
```typescript
// Redact notes field from employee notification
function getEmployeeNotificationData(badge: Badge) {
  return {
    badgeName: badge.templateName,
    reason: getCategorizedReason(badge.revocationReason),
    // notes field intentionally omitted
  };
}
```

**Impact if Not Fixed:**
- HR/legal issues if employee takes notes as evidence of wrongful termination
- Poor employee relations (learning about disciplinary action from automated email)
- Trust in system eroded

---

## UX Recommendations (Prioritized)

### 💡 High Priority (Strongly Recommended for MVP)

1. **Adaptive Email Templates** (Story 9.4)
   - Different tone for system errors vs. policy violations
   - Human, empathetic language instead of formal legal-speak
   - Clear next steps for employee

2. **Enhanced Revocation Modal** (Story 9.5)
   - Badge preview (prevent wrong-target revocations)
   - Impact statement (educate admins)
   - Checkbox confirmation (add friction to prevent accidents)

3. **Reason Categorization** (Stories 9.2, 9.3, 9.4)
   - Public vs. private reasons
   - Employee-facing vs. verifier-facing messages
   - Protects privacy while maintaining transparency

### 💡 Medium Priority (Improve UX, Not Critical)

4. **Collapsible Badge History Section** (Story 9.3)
   - Replaces filter tabs
   - Maintains Recognition-First Design principle
   - Reduces negative psychological impact

5. **Badge Detail History Timeline** (Story 9.5, Q8)
   - Visual timeline on badge detail page
   - Shows full lifecycle (Issued → Claimed → Revoked)
   - Useful for investigations

6. **Enhanced Disabled Button State** (Story 9.3, Q2)
   - Lock icon visual indicator
   - Improved tooltip copy
   - Better accessibility

### 💡 Lower Priority (Nice-to-Have)

7. **Admin Dashboard Revocation Widget** (Story 9.5, Q8)
   - "Recent Revocations (Last 7 Days)" widget
   - Quick link to audit log
   - Awareness tool for admin team

8. **Bulk Revocation Mode** (Story 9.5, Q6)
   - Admin-only feature
   - Checkbox selection + bulk action toolbar
   - Rare use case but high value when needed

---

## Design Assets Needed

### For Development Team

1. **Email Templates (HTML + Plain Text)**
   - Template 1: System/Admin Errors (Apologetic tone)
   - Template 2: Policy/Expiration (Neutral tone)
   - Template 3: Sensitive Reasons (Formal but respectful)
   - **Owner:** Amelia (UX Designer)
   - **Due:** Before Story 9.4 development starts

2. **Revocation Modal Wireframe**
   - Enhanced modal with badge preview + checkbox
   - Bulk revocation modal variant
   - **Owner:** Amelia (UX Designer)
   - **Due:** Before Story 9.5 development starts

3. **Badge History Section Component**
   - Collapsible timeline design
   - Revoked badge card styling
   - **Owner:** Amelia (UX Designer)
   - **Due:** Before Story 9.3 development starts

### For Copywriting

4. **Revocation Message Library**
   - Email subject lines (per reason category)
   - Body copy templates (adaptive tone)
   - Wallet UI copy ("Badge History" vs. "Revoked Badges")
   - Verification page copy ("No Longer Valid" vs. "REVOKED")
   - **Owner:** Amelia (UX Designer) + Product Owner
   - **Due:** Before Story 9.4 development starts

5. **Admin UI Helper Text**
   - Modal impact statement
   - Tooltip copy for disabled buttons
   - Audit log column descriptions
   - **Owner:** Amelia (UX Designer)
   - **Due:** Before Story 9.5 development starts

---

## UX Spec Alignment Check

### UX Design Principles Referenced

| Principle (from UX Spec) | Application in Epic 9 | Status |
|--------------------------|------------------------|--------|
| **Recognition-First Design** (Line 301) | Revoked badges in collapsible section, not prominent tabs | ✅ Applied |
| **Privacy by Empowerment, Not Paranoia** (Line 311) | Reason categorization protects privacy without hiding info | ✅ Applied |
| **Blame-Free Language Important** (Story 9.4) | "No longer active" vs. "REVOKED", adaptive tone | ✅ Applied |
| **Effortless Interactions** (Line 188) | Disabled button with clear tooltip, one-click revoke access | ✅ Applied |
| **Celebration-First Experience** (Line 109) | Wallet maintains positive frame, revocations de-emphasized | ✅ Applied |

### Open Badges 2.0 Compliance

**Revocation in Open Badges Spec:**
- ✅ Revoked badges remain in blockchain/credential store (soft-delete)
- ✅ Public verification URL shows revocation status
- ✅ JSON-LD assertion includes `revoked: true` and `revocationReason` fields
- ⚠️ Standard does NOT prescribe UX/messaging (implementation decision)

**G-Credit Implementation:**
- All spec requirements met
- UX goes beyond spec (adaptive messaging, privacy categorization)
- No compliance issues with recommended changes

---

## Testing Recommendations

### UX Validation Tests (Before Sprint 7 Completion)

1. **Employee Wallet Revocation Test**
   - Task: Find revoked badge in wallet
   - Success Criteria: Found in <10 seconds, understands why revoked
   - User: 3 employees (varied technical skill)

2. **Admin Revocation Flow Test**
   - Task: Revoke a badge with reason + notes
   - Success Criteria: Completes without errors, confirmation feels appropriate
   - User: 2 admins (1 experienced, 1 new)

3. **Email Tone Test**
   - Task: Read revocation email, assess emotional response
   - Success Criteria: Does NOT feel accusatory, understands next steps
   - User: 5 employees (varied roles)

4. **Verification Page Clarity Test**
   - Task: View revoked badge verification link, determine if valid
   - Success Criteria: Immediately recognizes "not valid" status in <5 seconds
   - User: 3 external viewers (recruiters, hiring managers)

### Accessibility Tests

1. **Screen Reader Navigation**
   - NVDA + Chrome: Revoked badge wallet section
   - JAWS + Edge: Revocation modal confirmation
   - VoiceOver + Safari: Disabled share button

2. **Keyboard Navigation**
   - Tab order in revocation modal
   - Escape key closes modal
   - Enter key behavior (doesn't accidentally submit)

3. **Color Contrast**
   - Red "REVOKED" banner: 4.5:1 minimum (WCAG AA)
   - Grayed-out badge cards: Still readable (3:1 minimum)
   - Disabled button text: Sufficient contrast

---

## Next Steps for Product Owner

### Decisions Required This Week

1. **Q1: Wallet Display Pattern** (Critical)
   - Decision: Filter tabs or collapsible section?
   - Recommendation: Collapsible section
   - Impact: Affects Story 9.3 implementation

2. **Q3 & Q10: Reason Visibility** (Critical)
   - Decision: Which reasons shown to employees vs. public?
   - Recommendation: Categorize as Public/Private
   - Impact: Affects Stories 9.2, 9.3, 9.4

3. **Q4: Email Tone** (Important)
   - Decision: Adaptive templates or single formal template?
   - Recommendation: Adaptive (3 templates)
   - Impact: Affects Story 9.4, requires additional copywriting

### Review Meeting Agenda

**Attendees:** Product Owner, Amelia (UX), Lead Developer, HR Representative

**Agenda:**
1. Review UX violations (5 min)
2. Decide on critical questions Q1, Q3, Q10 (15 min)
3. Approve/reject adaptive email templates (10 min)
4. Discuss HR/legal concerns with reason visibility (10 min)
5. Prioritize recommendations (high/medium/low) (10 min)

**Meeting Duration:** 50 minutes

**Deliverable:** Decision matrix for all 10 UX questions

---

## Document Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-31 | 1.0 | Initial UX review completed | Amelia |

---

## Appendices

### Appendix A: UX Spec References

- **Recognition-First Design:** [ux-design-specification.md](../planning/ux-design-specification.md#L301)
- **Privacy by Empowerment:** [ux-design-specification.md](../planning/ux-design-specification.md#L311)
- **Effortless Interactions:** [ux-design-specification.md](../planning/ux-design-specification.md#L188)
- **Audit Logging Principle:** [ux-design-specification.md](../planning/ux-design-specification.md#L547)

### Appendix B: Related Documents

- Story 9.1: [9-1-revoke-api.md](9-1-revoke-api.md)
- Story 9.2: [9-2-verification-status.md](9-2-verification-status.md)
- Story 9.3: [9-3-wallet-display.md](9-3-wallet-display.md)
- Story 9.4: [9-4-notifications.md](9-4-notifications.md)
- Story 9.5: [9-5-admin-ui.md](9-5-admin-ui.md)

### Appendix C: Competitive Analysis

**How Other Platforms Handle Revocation:**

| Platform | Revocation Visibility | Reason Shown? | Tone |
|----------|----------------------|---------------|------|
| **Credly (Acclaim)** | Badge shows "Expired" status | Generic (Expired/Invalid) | Neutral |
| **Badgr** | Badge shows "Revoked" | Optional (issuer decides) | Formal |
| **LinkedIn Certifications** | Removed from profile | Not shown | N/A (hidden) |
| **Google Cloud Certs** | Verification fails | "No longer valid" | Neutral |
| **AWS Certifications** | Badge grayed out | Generic message | Neutral |

**Key Insights:**
- Most platforms use **generic, neutral language** ("No longer valid" vs. specific reasons)
- Reason details **rarely shown publicly** (privacy preference)
- Employee-facing UI **de-emphasizes revocations** (not primary category)
- Verification pages **clear but not harsh** (informative, not accusatory)

**G-Credit Competitive Positioning:**
- More transparent than LinkedIn (doesn't hide revoked badges)
- More privacy-conscious than Badgr (categorizes reasons)
- More empathetic than generic "Invalid" messages (adaptive tone)
- Better UX than AWS (collapsible section vs. mixed in active badges)

---

**End of UX Review**

**Prepared by:** Amelia, Senior UX Designer  
**Date:** January 31, 2026  
**Contact:** amelia@gcredit-project.com  
**Next Review:** After PO decisions, before Story 9.3 implementation
