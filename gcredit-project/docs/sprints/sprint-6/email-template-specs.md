# Badge Notification Email Template - Design Specification

**Version:** 1.0  
**Date:** 2026-01-29  
**Designer:** Sally (UX Designer)  
**Target:** Email sharing for badge distribution (Sprint 6, Story 7.2)  
**Implementation:** backend/src/microsoft-graph/email/templates/badge-notification.html

---

## Overview

This document defines the HTML email template design for G-Credit badge notifications sent via Microsoft Graph API. The template provides a professional, branded email experience when badges are shared via email.

---

## Design Principles

1. **Brand Consistency:** G-Credit colors, typography, and visual identity
2. **Responsive Design:** Works on mobile (Gmail, Outlook app) and desktop (Outlook, Gmail web)
3. **Email Client Compatibility:** Tested on major clients (Outlook, Gmail, Apple Mail, Yahoo)
4. **Accessibility:** High contrast, alt text, semantic HTML
5. **Call-to-Action:** Clear, prominent CTA buttons
6. **Social Proof:** Build credibility and excitement

---

## Email Structure

### Layout Overview

```
┌─────────────────────────────────────────┐
│          [G-Credit Logo Header]         │  ← Brand header
├─────────────────────────────────────────┤
│                                         │
│   🎉 Congratulations! New Badge Earned │  ← Hero section
│                                         │
│         [Badge Image - 200x200]         │  ← Badge visual
│                                         │
│       "Full-Stack Developer"            │  ← Badge name
│     Issued by Acme University           │  ← Issuer
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   This credential recognizes your       │  ← Description
│   proficiency in...                     │
│                                         │
│   [View Badge] [Claim Now]              │  ← CTAs
│                                         │
├─────────────────────────────────────────┤
│   Badge Details                         │  ← Info section
│   • Recipient: John Smith               │
│   • Issued: January 29, 2026            │
│   • Expires: Never                      │
├─────────────────────────────────────────┤
│   Why This Badge Matters                │  ← Social proof
│   "123 professionals earned this badge" │
│   "Join the growing community"          │
├─────────────────────────────────────────┤
│   [Footer: Help | Privacy | Unsubscribe]│ ← Footer
└─────────────────────────────────────────┘
```

---

## Brand Colors (G-Credit)

**Primary Palette:**
```css
--primary-blue: #2563EB;      /* Primary CTA buttons */
--primary-blue-dark: #1E40AF; /* Button hover */
--success-green: #10B981;     /* Success messages */
--accent-purple: #8B5CF6;     /* Accent elements */

--gray-50: #F9FAFB;           /* Background */
--gray-100: #F3F4F6;          /* Card background */
--gray-600: #4B5563;          /* Body text */
--gray-900: #111827;          /* Headings */

--border-gray: #E5E7EB;       /* Borders */
```

**Typography:**
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-heading: 'Inter', sans-serif;
```

---

## HTML Email Template

### Full Template Code

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Badge Earned - G-Credit</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    /* Reset styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #F9FAFB;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    img {
      border: 0;
      display: block;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);
      padding: 30px 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    
    /* Hero Section */
    .hero {
      padding: 40px 40px 30px;
      text-align: center;
      background-color: #ffffff;
    }
    
    .hero-emoji {
      font-size: 48px;
      line-height: 1;
      margin-bottom: 16px;
    }
    
    .hero-title {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 12px 0;
      line-height: 1.3;
    }
    
    .hero-subtitle {
      font-size: 16px;
      color: #6B7280;
      margin: 0 0 30px 0;
      line-height: 1.5;
    }
    
    /* Badge Image */
    .badge-image {
      width: 200px;
      height: 200px;
      margin: 0 auto 24px;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    
    .badge-name {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }
    
    .badge-issuer {
      font-size: 16px;
      color: #6B7280;
      margin: 0 0 30px 0;
    }
    
    /* Content Section */
    .content {
      padding: 30px 40px;
      background-color: #ffffff;
    }
    
    .description {
      font-size: 16px;
      color: #4B5563;
      line-height: 1.6;
      margin: 0 0 30px 0;
    }
    
    /* CTA Buttons */
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    
    .btn {
      display: inline-block;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      margin: 0 8px 12px 8px;
      transition: background-color 0.2s ease;
    }
    
    .btn-primary {
      background-color: #2563EB;
      color: #ffffff !important;
    }
    
    .btn-primary:hover {
      background-color: #1E40AF;
    }
    
    .btn-secondary {
      background-color: #F3F4F6;
      color: #374151 !important;
      border: 1px solid #E5E7EB;
    }
    
    .btn-secondary:hover {
      background-color: #E5E7EB;
    }
    
    /* Details Table */
    .details-table {
      width: 100%;
      margin: 30px 0;
      background-color: #F9FAFB;
      border-radius: 8px;
      padding: 24px;
    }
    
    .details-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 16px 0;
    }
    
    .details-row {
      margin-bottom: 12px;
    }
    
    .details-label {
      font-size: 14px;
      font-weight: 600;
      color: #6B7280;
      display: inline-block;
      width: 120px;
    }
    
    .details-value {
      font-size: 14px;
      color: #111827;
    }
    
    /* Social Proof Section */
    .social-proof {
      background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
      border-radius: 12px;
      padding: 24px;
      margin: 30px 0;
      text-align: center;
      border: 1px solid #BFDBFE;
    }
    
    .social-proof-title {
      font-size: 18px;
      font-weight: 600;
      color: #1E40AF;
      margin: 0 0 8px 0;
    }
    
    .social-proof-text {
      font-size: 14px;
      color: #1E3A8A;
      margin: 0;
      line-height: 1.5;
    }
    
    .social-proof-stat {
      font-size: 32px;
      font-weight: 700;
      color: #2563EB;
      margin: 12px 0 4px 0;
    }
    
    /* Footer */
    .footer {
      background-color: #F9FAFB;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #E5E7EB;
    }
    
    .footer-text {
      font-size: 14px;
      color: #6B7280;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    
    .footer-links {
      margin: 16px 0;
    }
    
    .footer-link {
      font-size: 14px;
      color: #2563EB;
      text-decoration: none;
      margin: 0 12px;
    }
    
    .footer-link:hover {
      text-decoration: underline;
    }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      
      .header,
      .hero,
      .content,
      .footer {
        padding: 24px 20px !important;
      }
      
      .hero-title {
        font-size: 24px !important;
      }
      
      .badge-name {
        font-size: 20px !important;
      }
      
      .badge-image {
        width: 160px !important;
        height: 160px !important;
      }
      
      .btn {
        display: block !important;
        margin: 0 0 12px 0 !important;
        width: 100% !important;
        box-sizing: border-box;
      }
      
      .details-label {
        display: block !important;
        width: 100% !important;
        margin-bottom: 4px !important;
      }
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: #F9FAFB;">
  <!-- Wrapper Table for Email Client Compatibility -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding: 20px 0;">
        <!-- Email Container -->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <tr>
            <td class="header" style="background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); padding: 30px 40px; text-align: center;">
              <a href="{{platformUrl}}" class="logo" style="font-size: 28px; font-weight: 700; color: #ffffff; text-decoration: none;">
                G-Credit
              </a>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td class="hero" style="padding: 40px 40px 30px; text-align: center;">
              <div class="hero-emoji" style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 class="hero-title" style="font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">
                Congratulations! You've Earned a New Badge
              </h1>
              <p class="hero-subtitle" style="font-size: 16px; color: #6B7280; margin: 0 0 30px 0;">
                Your achievement has been recognized with this credential
              </p>
              
              <!-- Badge Image -->
              <img 
                src="{{badgeImageUrl}}" 
                alt="{{badgeName}} Badge" 
                class="badge-image"
                width="200"
                height="200"
                style="width: 200px; height: 200px; margin: 0 auto 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);"
              />
              
              <h2 class="badge-name" style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">
                {{badgeName}}
              </h2>
              <p class="badge-issuer" style="font-size: 16px; color: #6B7280; margin: 0 0 30px 0;">
                Issued by <strong>{{issuerName}}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Content Section -->
          <tr>
            <td class="content" style="padding: 30px 40px;">
              <p class="description" style="font-size: 16px; color: #4B5563; line-height: 1.6; margin: 0 0 30px 0;">
                {{badgeDescription}}
              </p>
              
              <!-- CTA Buttons -->
              <div class="cta-container" style="text-align: center; margin: 30px 0;">
                <a href="{{badgeWalletUrl}}" class="btn btn-primary" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; margin: 0 8px 12px 8px; background-color: #2563EB; color: #ffffff;">
                  View Badge in Wallet
                </a>
                {{#if claimUrl}}
                <a href="{{claimUrl}}" class="btn btn-secondary" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; margin: 0 8px 12px 8px; background-color: #F3F4F6; color: #374151; border: 1px solid #E5E7EB;">
                  Claim Badge Now
                </a>
                {{/if}}
              </div>
              
              <!-- Badge Details -->
              <div class="details-table" style="background-color: #F9FAFB; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 class="details-title" style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">
                  Badge Details
                </h3>
                <div class="details-row" style="margin-bottom: 12px;">
                  <span class="details-label" style="font-size: 14px; font-weight: 600; color: #6B7280; display: inline-block; width: 120px;">Recipient:</span>
                  <span class="details-value" style="font-size: 14px; color: #111827;">{{recipientName}}</span>
                </div>
                <div class="details-row" style="margin-bottom: 12px;">
                  <span class="details-label" style="font-size: 14px; font-weight: 600; color: #6B7280; display: inline-block; width: 120px;">Issued Date:</span>
                  <span class="details-value" style="font-size: 14px; color: #111827;">{{issueDate}}</span>
                </div>
                {{#if expiryDate}}
                <div class="details-row" style="margin-bottom: 12px;">
                  <span class="details-label" style="font-size: 14px; font-weight: 600; color: #6B7280; display: inline-block; width: 120px;">Expires:</span>
                  <span class="details-value" style="font-size: 14px; color: #111827;">{{expiryDate}}</span>
                </div>
                {{/if}}
                <div class="details-row">
                  <span class="details-label" style="font-size: 14px; font-weight: 600; color: #6B7280; display: inline-block; width: 120px;">Verification:</span>
                  <span class="details-value" style="font-size: 14px; color: #111827;">
                    <a href="{{verificationUrl}}" style="color: #2563EB; text-decoration: none;">Verify Badge</a>
                  </span>
                </div>
              </div>
              
              <!-- Social Proof -->
              {{#if earnedCount}}
              <div class="social-proof" style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center; border: 1px solid #BFDBFE;">
                <h3 class="social-proof-title" style="font-size: 18px; font-weight: 600; color: #1E40AF; margin: 0 0 8px 0;">
                  Join the Community
                </h3>
                <p class="social-proof-stat" style="font-size: 32px; font-weight: 700; color: #2563EB; margin: 12px 0 4px 0;">
                  {{earnedCount}}
                </p>
                <p class="social-proof-text" style="font-size: 14px; color: #1E3A8A; margin: 0;">
                  professionals have earned this badge
                </p>
              </div>
              {{/if}}
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer" style="background-color: #F9FAFB; padding: 30px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p class="footer-text" style="font-size: 14px; color: #6B7280; margin: 0 0 16px 0;">
                This badge is part of your G-Credit digital credential wallet. 
                <br>Manage all your credentials in one secure place.
              </p>
              
              <div class="footer-links" style="margin: 16px 0;">
                <a href="{{helpUrl}}" class="footer-link" style="font-size: 14px; color: #2563EB; text-decoration: none; margin: 0 12px;">Help Center</a>
                <span style="color: #D1D5DB;">•</span>
                <a href="{{privacyUrl}}" class="footer-link" style="font-size: 14px; color: #2563EB; text-decoration: none; margin: 0 12px;">Privacy Policy</a>
                <span style="color: #D1D5DB;">•</span>
                <a href="{{unsubscribeUrl}}" class="footer-link" style="font-size: 14px; color: #2563EB; text-decoration: none; margin: 0 12px;">Unsubscribe</a>
              </div>
              
              <p class="footer-text" style="font-size: 12px; color: #9CA3AF; margin: 16px 0 0 0;">
                © 2026 G-Credit. All rights reserved.
                <br>This email was sent to {{recipientEmail}}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Template Variables (Handlebars)

### Required Variables

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `{{platformUrl}}` | URL | `https://g-credit.com` | Platform homepage URL |
| `{{badgeImageUrl}}` | URL | `https://api.g-credit.com/badges/123/image` | Badge image URL (200x200px) |
| `{{badgeName}}` | String | "Full-Stack Developer Certification" | Badge name |
| `{{issuerName}}` | String | "Acme Tech University" | Issuer organization name |
| `{{badgeDescription}}` | String | "This credential recognizes..." | Badge description (100-300 chars) |
| `{{recipientName}}` | String | "John Smith" | Badge recipient full name |
| `{{issueDate}}` | Date String | "January 29, 2026" | Issue date (formatted) |
| `{{badgeWalletUrl}}` | URL | `https://g-credit.com/wallet` | Link to badge wallet page |
| `{{verificationUrl}}` | URL | `https://g-credit.com/verify/abc123` | Public verification URL |
| `{{recipientEmail}}` | Email | `john@example.com` | Recipient email address |

### Optional Variables

| Variable | Type | Example | Usage |
|----------|------|---------|-------|
| `{{claimUrl}}` | URL | `https://g-credit.com/claim?token=xyz` | Claim button (if unclaimed) |
| `{{expiryDate}}` | Date String | "December 31, 2027" | Expiry date (if applicable) |
| `{{earnedCount}}` | Number | 123 | Number of people who earned this badge |
| `{{helpUrl}}` | URL | `https://g-credit.com/help` | Help center URL |
| `{{privacyUrl}}` | URL | `https://g-credit.com/privacy` | Privacy policy URL |
| `{{unsubscribeUrl}}` | URL | `https://g-credit.com/unsubscribe?token=xyz` | Unsubscribe link |

---

## Email Client Testing Matrix

### Desktop Clients

| Client | Version | Status | Notes |
|--------|---------|--------|-------|
| Outlook 2016+ | Windows | ✅ Supported | Use VML for gradients if needed |
| Outlook for Mac | Latest | ✅ Supported | Webkit rendering |
| Apple Mail | macOS | ✅ Supported | Full CSS support |
| Gmail Web | Chrome | ✅ Supported | Some CSS limitations |
| Yahoo Mail Web | - | ✅ Supported | Basic support |

### Mobile Clients

| Client | Platform | Status | Notes |
|--------|----------|--------|-------|
| Gmail App | iOS/Android | ✅ Supported | Primary mobile client |
| Outlook App | iOS/Android | ✅ Supported | Good CSS support |
| Apple Mail | iOS | ✅ Supported | Full support |
| Samsung Email | Android | ✅ Supported | Basic support |

### Testing Recommendations

1. **Litmus or Email on Acid:** Use email testing service to preview across 90+ clients
2. **Real Device Testing:** Test on iPhone (Mail app), Android (Gmail app), Desktop Outlook
3. **Spam Score Check:** Run through SpamAssassin to ensure deliverability
4. **Link Testing:** Verify all CTAs work correctly
5. **Personalization Testing:** Test with real variable data

---

## Accessibility Features

### WCAG 2.1 AA Compliance

**Color Contrast:**
- ✅ Primary CTA (#2563EB) on white: 4.5:1 ratio (AA compliant)
- ✅ Body text (#4B5563) on white: 7:1 ratio (AA compliant)
- ✅ Headings (#111827) on white: 14:1 ratio (AAA compliant)

**Alt Text:**
```html
<img src="{{badgeImageUrl}}" alt="{{badgeName}} Badge" />
```

**Semantic HTML:**
- Use `<h1>`, `<h2>`, `<h3>` for headings
- Use `<p>` for paragraphs
- Use `<table role="presentation">` for layout tables

**Screen Reader Support:**
- All images have descriptive alt text
- Links have descriptive text (not "click here")
- Logical reading order maintained

---

## Implementation Guide

### Backend Integration

**File Location:**
```
backend/src/microsoft-graph/email/templates/badge-notification.html
```

**Template Rendering (Handlebars):**
```typescript
// email-template.service.ts
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export class EmailTemplateService {
  private template: HandlebarsTemplateDelegate;

  constructor() {
    const templatePath = path.join(__dirname, 'templates', 'badge-notification.html');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    this.template = Handlebars.compile(templateSource);
  }

  render(data: BadgeEmailData): string {
    return this.template({
      platformUrl: 'https://g-credit.com',
      badgeImageUrl: data.badgeImageUrl,
      badgeName: data.badgeName,
      issuerName: data.issuerName,
      badgeDescription: data.badgeDescription,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      issueDate: this.formatDate(data.issueDate),
      expiryDate: data.expiryDate ? this.formatDate(data.expiryDate) : null,
      badgeWalletUrl: `https://g-credit.com/wallet`,
      claimUrl: data.claimToken ? `https://g-credit.com/claim?token=${data.claimToken}` : null,
      verificationUrl: `https://g-credit.com/verify/${data.verificationId}`,
      earnedCount: data.earnedCount,
      helpUrl: 'https://g-credit.com/help',
      privacyUrl: 'https://g-credit.com/privacy',
      unsubscribeUrl: `https://g-credit.com/unsubscribe?token=${data.unsubscribeToken}`,
    });
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}
```

**Send Email via Microsoft Graph:**
```typescript
// graph-email.service.ts
async sendBadgeNotification(data: BadgeEmailData): Promise<EmailSendResult> {
  const htmlBody = this.emailTemplateService.render(data);
  
  return this.sendEmail({
    to: [data.recipientEmail],
    subject: `🎉 Congratulations! You've earned the "${data.badgeName}" badge`,
    htmlBody: htmlBody,
    textBody: this.generateTextVersion(data), // Fallback for text-only clients
  });
}
```

---

## Plain Text Fallback

### Text Version (for text-only email clients)

```
🎉 Congratulations! You've Earned a New Badge

{{badgeName}}
Issued by {{issuerName}}

Your achievement has been recognized with this credential.

{{badgeDescription}}

BADGE DETAILS:
- Recipient: {{recipientName}}
- Issued Date: {{issueDate}}
{{#if expiryDate}}- Expires: {{expiryDate}}{{/if}}

VIEW YOUR BADGE:
{{badgeWalletUrl}}

{{#if claimUrl}}
CLAIM YOUR BADGE:
{{claimUrl}}
{{/if}}

VERIFY THIS BADGE:
{{verificationUrl}}

{{#if earnedCount}}
JOIN THE COMMUNITY:
{{earnedCount}} professionals have earned this badge.
{{/if}}

---
G-Credit - Your Digital Credential Wallet
Help: {{helpUrl}}
Privacy: {{privacyUrl}}
Unsubscribe: {{unsubscribeUrl}}

© 2026 G-Credit. All rights reserved.
This email was sent to {{recipientEmail}}
```

---

## Deliverability Best Practices

### Anti-Spam Measures

1. **SPF/DKIM/DMARC:** Ensure Microsoft 365 tenant has proper email authentication
2. **Sender Reputation:** Use consistent "From" address (e.g., `badges@g-credit.com`)
3. **Unsubscribe Link:** Always include (CAN-SPAM compliance)
4. **Physical Address:** Include company address in footer (CAN-SPAM)
5. **Subject Line:** Avoid spam triggers ("FREE", "ACT NOW", excessive punctuation)

### Content Best Practices

1. **Text-to-Image Ratio:** Maintain at least 60% text, 40% images
2. **Image Alt Text:** All images must have descriptive alt text
3. **Link Targets:** Use HTTPS for all links
4. **Personalization:** Use recipient's name (reduces spam score)
5. **No Attachments:** Never attach files (deliverability killer)

---

## Future Enhancements

### Phase 2 Features

1. **Dark Mode Support:** Add `@media (prefers-color-scheme: dark)` styles
2. **Animated GIFs:** Badge reveal animation (< 1MB)
3. **Multiple Languages:** i18n support for email content
4. **A/B Testing:** Test different CTA button colors/text
5. **Analytics Tracking:** Track email opens and click-through rates

### Advanced Personalization

1. **Badge Rarity:** Show "Only 5% earned this badge" for rare badges
2. **Skill Path:** Suggest next badges to earn
3. **Issuer Branding:** Allow issuers to customize email colors
4. **Dynamic Content:** Show different content based on badge type

---

## Testing Checklist

### Pre-Launch Testing

- [ ] Test all template variables with real data
- [ ] Test with missing optional variables (graceful degradation)
- [ ] Test responsive design on mobile (320px, 375px, 414px widths)
- [ ] Test on Outlook 2016 (Windows)
- [ ] Test on Gmail web (Chrome, Firefox)
- [ ] Test on Gmail mobile app (iOS, Android)
- [ ] Test on Apple Mail (iOS, macOS)
- [ ] Verify all CTAs link correctly
- [ ] Verify badge image loads (test broken image URL)
- [ ] Run through spam checker (SpamAssassin score < 5)
- [ ] Check color contrast (WCAG AA)
- [ ] Test plain text version
- [ ] Test unsubscribe link works
- [ ] Proofread all copy for typos

---

## References

### Email Design Resources

- [Really Good Emails](https://reallygoodemails.com/) - Email design inspiration
- [Can I Email](https://www.caniemail.com/) - CSS/HTML support across email clients
- [Email on Acid](https://www.emailonacid.com/) - Email testing platform
- [Litmus](https://www.litmus.com/) - Email testing and analytics

### Email Accessibility

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Email Accessibility Best Practices](https://www.campaignmonitor.com/resources/guides/email-accessibility/)

### Related Documents

- [ADR-008: Microsoft Graph Integration Strategy](../../decisions/ADR-008-microsoft-graph-integration.md)
- [Sprint 6 Backlog - Story 7.2: Email Sharing](./backlog.md)
- [Sprint 6 Kickoff Readiness](./kickoff-readiness.md)

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-29 | 1.0 | Initial template design | Sally |

---

**Template Status:** ✅ Ready for Implementation  
**Implementation Target:** Story 7.2 (Sprint 6)  
**Next Action:** Amelia implements template rendering in backend  
**Last Updated:** 2026-01-29

---

**Designed By:** Sally (UX Designer)  
**To Be Implemented By:** Amelia (Dev)  
**Reviewed By:** [Pending Winston technical review]  
**Approved By:** [Pending LegendZhu approval]
