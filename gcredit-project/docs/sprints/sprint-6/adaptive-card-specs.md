# Badge Notification Adaptive Card - Design Specification

**Version:** 1.0  
**Date:** 2026-01-29  
**Designer:** Winston (Architect) + Sally (UX Designer)  
**Target:** Microsoft Teams notifications for badge issuance  
**Implementation:** Sprint 6, Story 7.4

---

## Overview

This document defines the Adaptive Card design for G-Credit badge notifications in Microsoft Teams. The card provides an interactive, visually appealing notification when a badge is issued, with direct action buttons for viewing and claiming badges.

---

## Design Principles

1. **Visual Hierarchy:** Badge image prominently displayed, clear call-to-action
2. **Brand Consistency:** G-Credit colors and typography
3. **Mobile-First:** Responsive design for Teams mobile app
4. **Actionable:** Two clear CTAs (View Badge, Claim Now)
5. **Informative:** Key badge details at a glance
6. **Accessible:** Meets WCAG 2.1 AA standards

---

## Adaptive Card Template (JSON)

### Full Card Structure

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "Container",
      "style": "emphasis",
      "items": [
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "width": "auto",
              "items": [
                {
                  "type": "Image",
                  "url": "${badgeImageUrl}",
                  "size": "Large",
                  "style": "Person"
                }
              ]
            },
            {
              "type": "Column",
              "width": "stretch",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "🎉 New Badge Earned!",
                  "weight": "Bolder",
                  "size": "Large",
                  "color": "Accent"
                },
                {
                  "type": "TextBlock",
                  "text": "${badgeName}",
                  "weight": "Bolder",
                  "size": "ExtraLarge",
                  "wrap": true
                },
                {
                  "type": "TextBlock",
                  "text": "Issued by ${issuerName}",
                  "size": "Medium",
                  "weight": "Lighter",
                  "spacing": "None",
                  "isSubtle": true
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "Container",
      "spacing": "Medium",
      "items": [
        {
          "type": "FactSet",
          "facts": [
            {
              "title": "Recipient:",
              "value": "${recipientName}"
            },
            {
              "title": "Issued On:",
              "value": "${issueDate}"
            },
            {
              "title": "Badge ID:",
              "value": "${badgeId}"
            }
          ]
        }
      ]
    },
    {
      "type": "Container",
      "spacing": "Medium",
      "items": [
        {
          "type": "TextBlock",
          "text": "${badgeDescription}",
          "wrap": true,
          "maxLines": 3,
          "size": "Default"
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "🔍 View Badge",
      "url": "${badgeWalletUrl}",
      "style": "default"
    },
    {
      "type": "Action.OpenUrl",
      "title": "✨ Claim Now",
      "url": "${claimUrl}",
      "style": "positive"
    }
  ]
}
```

---

## Card Components Breakdown

### 1. Header Section (Emphasis Container)

**Purpose:** Grab attention with badge image and celebration message

**Elements:**
- **Badge Image** (Large, Person style for circular crop)
- **Celebration Emoji** 🎉 (universal positive sentiment)
- **Badge Name** (ExtraLarge, Bolder for prominence)
- **Issuer Attribution** (Subtle, Lighter for secondary info)

**Design Notes:**
- `style: "emphasis"` provides colored background (Teams theme-dependent)
- ColumnSet for side-by-side layout (image left, text right)
- Image style `"Person"` creates circular crop (modern, friendly)

### 2. Details Section (FactSet)

**Purpose:** Provide key badge metadata at a glance

**Facts Displayed:**
- **Recipient Name** (who received the badge)
- **Issue Date** (when badge was issued)
- **Badge ID** (for reference/verification)

**Design Notes:**
- FactSet provides two-column layout automatically
- Left-aligned for readability
- Consistent formatting across all facts

### 3. Description Section

**Purpose:** Brief badge description for context

**Elements:**
- **Badge Description** (max 3 lines, wrap enabled)
- Truncated with ellipsis if too long

**Design Notes:**
- `maxLines: 3` prevents card from becoming too tall
- User can click "View Badge" for full description

### 4. Action Buttons

**Purpose:** Provide clear, actionable next steps

**Primary Actions:**
1. **View Badge** (Default style, secondary action)
   - Opens badge wallet page
   - View full badge details, description, criteria
   
2. **Claim Now** (Positive style, primary action)
   - Opens claim URL (if badge requires claiming)
   - Green/positive styling for primary CTA

**Design Notes:**
- Maximum 2 actions for mobile compatibility
- Positive style uses green color (success, go)
- OpenUrl actions open in browser (no in-app auth needed)

---

## Variable Placeholders

### Required Variables (Template Rendering)

| Variable | Type | Example | Source |
|----------|------|---------|--------|
| `${badgeImageUrl}` | URL | `https://api.g-credit.com/badges/123/image` | Badge.imageUrl |
| `${badgeName}` | String | "Full-Stack Developer Certification" | Badge.name |
| `${issuerName}` | String | "Acme Tech University" | Issuer.name |
| `${recipientName}` | String | "John Smith" | Recipient.name |
| `${issueDate}` | Date | "January 29, 2026" | Credential.issuedAt (formatted) |
| `${badgeId}` | String | "badge-456" | Badge.id (short) |
| `${badgeDescription}` | String | "This badge recognizes..." | Badge.description (truncated) |
| `${badgeWalletUrl}` | URL | `https://g-credit.com/wallet` | Frontend route |
| `${claimUrl}` | URL | `https://g-credit.com/claim?token=xyz` | Claim token URL |

### Conditional Variables (Optional)

| Variable | Condition | Fallback |
|----------|-----------|----------|
| `${claimUrl}` | If badge requires claiming | Hide "Claim Now" button |
| `${badgeDescription}` | If description exists | Hide description section |

---

## Brand Styling (G-Credit)

### Color Palette (Adaptive Card Limitations)

**Note:** Adaptive Cards use semantic colors that adapt to Teams theme (light/dark). We cannot specify exact hex colors, but can use:

- **Accent:** Primary brand color (used for celebration message)
- **Good/Positive:** Green (used for primary CTA)
- **Default:** Neutral (used for secondary CTA)
- **Emphasis:** Highlighted background (header section)

**G-Credit Brand Colors (for reference in HTML email):**
- Primary: #2563EB (Blue)
- Success: #10B981 (Green)
- Accent: #8B5CF6 (Purple)

### Typography

**Adaptive Card Text Sizes:**
- **ExtraLarge:** Badge name (most prominent)
- **Large:** Celebration message
- **Medium:** Issuer attribution
- **Default:** Badge description
- **Small:** Not used (too small for readability)

**Font Weights:**
- **Bolder:** Badge name, celebration
- **Default:** Description, facts
- **Lighter:** Issuer attribution (subtle)

---

## Responsive Behavior

### Desktop Teams (Wide Layout)
- ColumnSet displays image and text side-by-side
- Actions appear as horizontal buttons at bottom
- Full badge description visible (3 lines)

### Mobile Teams (Narrow Layout)
- ColumnSet stacks vertically (image top, text below)
- Actions stack vertically (full-width buttons)
- Badge description wraps, maintaining 3-line limit

### Adaptive Card Renderer Behavior
- Automatically adjusts to container width
- Teams handles responsive rendering (no custom CSS)
- Image scales proportionally (max size: Large)

---

## Accessibility Features

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text color vs background meets 4.5:1 ratio (Teams enforces)
- Action button colors meet contrast requirements

**Keyboard Navigation:**
- All actions keyboard accessible (Tab + Enter)
- Teams handles focus management

**Screen Reader Support:**
- Image alt text: "Badge image for ${badgeName}"
- Action button labels are descriptive
- FactSet structure semantic (label + value pairs)

**Emoji Usage:**
- 🎉 (celebration) as visual enhancement, not content
- ✨ (sparkles) in button label for visual appeal
- Screen readers announce emoji names

---

## Implementation Code (TypeScript)

### Adaptive Card Builder Service

```typescript
// backend/src/microsoft-graph/teams/adaptive-cards/badge-notification.card.ts

import { AdaptiveCard, TextBlock, Image, FactSet, ActionOpenUrl } from 'adaptivecards';

export interface BadgeNotificationCardData {
  badgeImageUrl: string;
  badgeName: string;
  issuerName: string;
  recipientName: string;
  issueDate: string;
  badgeId: string;
  badgeDescription: string;
  badgeWalletUrl: string;
  claimUrl?: string; // Optional
}

export class BadgeNotificationCardBuilder {
  /**
   * Build Adaptive Card for badge notification
   */
  static build(data: BadgeNotificationCardData): object {
    const card = {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        // Header section
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  width: 'auto',
                  items: [
                    {
                      type: 'Image',
                      url: data.badgeImageUrl,
                      size: 'Large',
                      style: 'Person',
                      altText: `Badge image for ${data.badgeName}`
                    }
                  ]
                },
                {
                  type: 'Column',
                  width: 'stretch',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '🎉 New Badge Earned!',
                      weight: 'Bolder',
                      size: 'Large',
                      color: 'Accent'
                    },
                    {
                      type: 'TextBlock',
                      text: data.badgeName,
                      weight: 'Bolder',
                      size: 'ExtraLarge',
                      wrap: true
                    },
                    {
                      type: 'TextBlock',
                      text: `Issued by ${data.issuerName}`,
                      size: 'Medium',
                      weight: 'Lighter',
                      spacing: 'None',
                      isSubtle: true
                    }
                  ]
                }
              ]
            }
          ]
        },
        
        // Details section
        {
          type: 'Container',
          spacing: 'Medium',
          items: [
            {
              type: 'FactSet',
              facts: [
                { title: 'Recipient:', value: data.recipientName },
                { title: 'Issued On:', value: data.issueDate },
                { title: 'Badge ID:', value: data.badgeId }
              ]
            }
          ]
        },
        
        // Description section
        {
          type: 'Container',
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: data.badgeDescription,
              wrap: true,
              maxLines: 3,
              size: 'Default'
            }
          ]
        }
      ],
      
      // Actions
      actions: [
        {
          type: 'Action.OpenUrl',
          title: '🔍 View Badge',
          url: data.badgeWalletUrl,
          style: 'default'
        }
      ]
    };
    
    // Add "Claim Now" button if claimUrl provided
    if (data.claimUrl) {
      card.actions.push({
        type: 'Action.OpenUrl',
        title: '✨ Claim Now',
        url: data.claimUrl,
        style: 'positive'
      });
    }
    
    return card;
  }
  
  /**
   * Validate card structure (for testing)
   */
  static validate(card: object): boolean {
    // Use Adaptive Cards SDK to validate
    const adaptiveCard = new AdaptiveCard();
    try {
      adaptiveCard.parse(card);
      return true;
    } catch (error) {
      console.error('Invalid Adaptive Card:', error);
      return false;
    }
  }
}
```

---

## Testing Strategy

### 1. Visual Testing (Adaptive Card Designer)

**Tool:** [Adaptive Cards Designer](https://adaptivecards.io/designer/)

**Steps:**
1. Copy JSON template into designer
2. Provide sample data for all variables
3. Preview in Teams light/dark themes
4. Test desktop and mobile layouts
5. Validate action buttons work

**Test Data:**
```json
{
  "badgeImageUrl": "https://via.placeholder.com/150",
  "badgeName": "Full-Stack Developer Certification",
  "issuerName": "Acme Tech University",
  "recipientName": "John Smith",
  "issueDate": "January 29, 2026",
  "badgeId": "badge-123",
  "badgeDescription": "This badge recognizes proficiency in full-stack web development, including React, Node.js, and PostgreSQL.",
  "badgeWalletUrl": "https://g-credit.com/wallet",
  "claimUrl": "https://g-credit.com/claim?token=abc123"
}
```

### 2. Unit Tests (Card Builder)

```typescript
describe('BadgeNotificationCardBuilder', () => {
  it('should build valid Adaptive Card', () => {
    const data: BadgeNotificationCardData = {
      badgeImageUrl: 'https://example.com/badge.png',
      badgeName: 'Test Badge',
      issuerName: 'Test Issuer',
      recipientName: 'Test User',
      issueDate: '2026-01-29',
      badgeId: 'badge-001',
      badgeDescription: 'Test description',
      badgeWalletUrl: 'https://example.com/wallet',
      claimUrl: 'https://example.com/claim'
    };
    
    const card = BadgeNotificationCardBuilder.build(data);
    
    expect(card.type).toBe('AdaptiveCard');
    expect(card.version).toBe('1.4');
    expect(card.actions).toHaveLength(2); // View + Claim
  });
  
  it('should omit Claim button if no claimUrl', () => {
    const data = { /* ... */ claimUrl: undefined };
    const card = BadgeNotificationCardBuilder.build(data);
    
    expect(card.actions).toHaveLength(1); // View only
  });
  
  it('should validate card structure', () => {
    const card = BadgeNotificationCardBuilder.build(testData);
    const isValid = BadgeNotificationCardBuilder.validate(card);
    
    expect(isValid).toBe(true);
  });
});
```

### 3. Integration Tests (Real Teams)

**Setup:**
- Send test notification to Teams test channel
- Use Microsoft 365 Developer Subscription environment

**Test Cases:**
1. Send notification with claim URL → Verify both buttons appear
2. Send notification without claim URL → Verify only View button
3. Test long badge name → Verify wrapping works
4. Test long description → Verify 3-line truncation
5. Click View Badge button → Opens wallet page
6. Click Claim Now button → Opens claim page with token

---

## Design Variations (Future)

### Variation 1: Badge Claim Required (Urgent)
- Add yellow/warning banner: "⚠️ Action Required: Claim by ${expiryDate}"
- Change header color to warning

### Variation 2: Badge Revoked (Negative)
- Red/danger styling
- Text: "❌ Badge Revoked"
- Single action: "Learn More"

### Variation 3: Badge Expiring Soon (Reminder)
- Orange/attention styling
- Text: "⏰ Badge Expiring in ${daysLeft} Days"
- Actions: "Renew Now" + "View Details"

### Variation 4: Milestone Achievement (Multiple Badges)
- Show badge count: "🎉 You've earned 5 badges this month!"
- Thumbnail grid of recent badges
- Action: "View All Badges"

---

## References

### Microsoft Documentation
- [Adaptive Cards Overview](https://adaptivecards.io/)
- [Adaptive Card Schema Explorer](https://adaptivecards.io/explorer/)
- [Teams Adaptive Card Design Guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/design-effective-cards)
- [Adaptive Cards in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/cards-reference#adaptive-card)

### Design Tools
- [Adaptive Cards Designer](https://adaptivecards.io/designer/) - Visual card builder
- [Adaptive Cards Samples](https://adaptivecards.io/samples/) - Inspiration gallery

### Related Documents
- [ADR-008: Microsoft Graph Integration Strategy](../../decisions/ADR-008-microsoft-graph-integration.md)
- [Sprint 6 Kickoff Readiness](./kickoff-readiness.md)
- [Email Template Design Specs](./email-template-specs.md) (to be created by Sally)

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-29 | 1.0 | Initial design | Winston + Sally |

---

**Design Status:** ✅ Ready for Implementation  
**Implementation:** Story 7.4 (Sprint 6)  
**Next Action:** Sally reviews and approves visual design  
**Test Environment:** Microsoft 365 Developer Subscription

---

**Designed By:** Winston (Architect)  
**To Be Reviewed By:** Sally (UX Designer), Amelia (Dev)  
**Last Updated:** 2026-01-29
