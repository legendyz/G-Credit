# Story 9.4: Badge Revocation Notifications

**Story ID:** Story 9.4  
**Epic:** Epic 9 - Badge Revocation  
**Sprint:** Sprint 7  
**Priority:** MEDIUM → **NICE-TO-HAVE** ⚠️ **UPDATED**  
**Story Points:** 3  
**Status:** Backlog  
**Timeline:** Day 4 (moved from Day 2)  
**Last Updated:** February 1, 2026 (Post-Technical Review)

---

## ⚠️ PRIORITY UPDATE (Feb 1, 2026)

**Decision #18: Email Notifications = Nice-to-Have**
- Email notifications are **NOT a UAT blocker**
- UAT can proceed by verifying revocation via database/API
- If this story encounters issues on Day 4, it can defer to Sprint 8
- Core revocation functionality (Stories 9.1-9.3, 9.5) takes priority

**Timeline Change:** Moved from Day 2 to Day 4 (after core features complete)

**Reference:** See meeting minutes Part 4, Risk Assessment

---

## User Story

**As an** Employee whose badge was revoked,  
**I want** to receive a notification explaining the revocation,  
**So that** I am informed immediately and understand the reason.

---

## Background / Context

When a badge is revoked (Story 9.1), the employee should be notified proactively rather than discovering it later in their wallet. This provides:
1. Immediate awareness of status change
2. Explanation of revocation reason
3. Professional communication channel
4. Audit trail of notification sent

Notification should be sent via email (primary) and optionally in-app notification center (if implemented).

---

## Acceptance Criteria

### AC1: Email Notification Sent on Revocation
**Given** Admin or Issuer revokes a badge  
**When** Revocation API completes successfully  
**Then** Email notification sent to badge recipient

- [x] Email sent asynchronously (does not block API response)
- [x] Email contains: badge name, revocation date, reason, notes (if provided)
- [x] Email links to wallet page or badge details
- [x] Email uses professional tone (not accusatory)

### AC2: Email Content Template
- [x] Subject: "Badge Revocation Notification - [Badge Name]"
- [x] Body includes:
  - Badge template name
  - Revocation date
  - Revocation reason
  - Optional notes from admin
  - Link to view badge in wallet
  - Contact information for questions (HR or admin email)
- [x] Professional HTML template (matches existing badge claim email)

### AC3: Notification Service Integration
- [x] Use existing NotificationsService (if exists) or create new
- [x] Async queue (e.g., Bull, BullMQ) or simple async call
- [x] Retry logic for failed email sends (3 attempts)
- [x] Log notification success/failure in audit log

### AC4: In-App Notification (Optional, Nice-to-Have)
- [ ] If notification center exists, create in-app notification
- [ ] Notification type: "Badge Revoked"
- [ ] Links to wallet page with revoked badge highlighted
- [ ] Bell icon shows unread count

---

## Non-Functional Requirements

### Performance
- [x] Email sending does not block revocation API response (async)
- [x] Email sent within 5 minutes of revocation

### Reliability
- [x] Email failures logged but do not fail revocation operation
- [x] Retry logic for transient failures (SMTP errors)

### Security
- [x] Email does not include sensitive data beyond badge details
- [x] No admin password or internal notes exposed

---

## Technical Details

### Email Template (Plain Text Version)
```
Subject: Badge Revocation Notification - Advanced React Development

Dear [Employee Name],

We are writing to inform you that your badge for "Advanced React Development" 
has been revoked as of February 5, 2026.

Revocation Reason: Policy Violation
Additional Notes: [Optional admin notes]

You can view the revoked badge in your wallet:
https://gcredit.example.com/wallet

If you have questions about this revocation, please contact:
hr@example.com or your manager.

Thank you,
G-Credit System
```

### Email Template (HTML Version)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Reuse existing badge-claim email styles */
  </style>
</head>
<body>
  <div class="container">
    <h1>Badge Revocation Notification</h1>
    <p>Dear {{ employeeName }},</p>
    
    <p>We are writing to inform you that your badge for 
    <strong>{{ badgeName }}</strong> has been revoked as of 
    <strong>{{ revocationDate }}</strong>.</p>
    
    <div class="revocation-details">
      <p><strong>Revocation Reason:</strong> {{ revocationReason }}</p>
      {% if revocationNotes %}
      <p><strong>Additional Notes:</strong> {{ revocationNotes }}</p>
      {% endif %}
    </div>
    
    <a href="{{ walletUrl }}" class="btn">View in Wallet</a>
    
    <p>If you have questions about this revocation, please contact 
    <a href="mailto:hr@example.com">hr@example.com</a> or your manager.</p>
    
    <footer>
      <p>G-Credit Digital Credentialing System</p>
    </footer>
  </div>
</body>
</html>
```

### Backend Implementation
```typescript
// src/modules/badges/badges.service.ts
async revokeBadge(badgeId: string, userId: string, dto: RevokeBadgeDto) {
  // ... existing revocation logic ...
  
  const badge = await this.prisma.badge.update({ ... });
  
  // Send notification asynchronously
  this.notificationsService.sendBadgeRevokedEmail({
    recipientEmail: badge.recipient.email,
    recipientName: badge.recipient.name,
    badgeName: badge.template.name,
    revocationDate: badge.revokedAt,
    revocationReason: badge.revocationReason,
    revocationNotes: badge.revocationNotes,
    walletUrl: `${this.configService.get('FRONTEND_URL')}/wallet`
  }).catch(err => {
    this.logger.error('Failed to send revocation email', err);
    // Do not throw - notification failure should not fail revocation
  });
  
  return badge;
}
```

```typescript
// src/modules/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}
  
  async sendBadgeRevokedEmail(data: BadgeRevokedEmailDto) {
    try {
      await this.mailerService.sendMail({
        to: data.recipientEmail,
        subject: `Badge Revocation Notification - ${data.badgeName}`,
        template: 'badge-revoked',  // Handlebars template
        context: {
          employeeName: data.recipientName,
          badgeName: data.badgeName,
          revocationDate: format(data.revocationDate, 'MMMM d, yyyy'),
          revocationReason: data.revocationReason,
          revocationNotes: data.revocationNotes,
          walletUrl: data.walletUrl
        }
      });
      
      this.logger.log(`Revocation email sent to ${data.recipientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send revocation email', error);
      throw error;  // Will be caught in badges.service
    }
  }
}
```

### Dependencies
- `@nestjs-modules/mailer` (existing)
- `nodemailer` (existing)
- Handlebars email templates (existing)

---

## Test Plan

### Unit Tests
- [x] Mock email service and verify sendBadgeRevokedEmail called
- [x] Verify email template renders correctly with sample data
- [x] Verify revocation succeeds even if email fails (async, no throw)
- [x] Test retry logic for failed email sends

### E2E Tests
- [x] Revoke a badge and verify email sent (use test email service)
- [x] Check email content matches template
- [x] Verify email contains correct badge details and revocation reason

### Manual Testing
- [x] Send test revocation email to real email address
- [x] Verify email received, renders correctly in Gmail, Outlook
- [x] Verify links work (wallet URL, contact email)

---

## Definition of Done

### Code Complete
- [x] Email template created (HTML + plain text)
- [x] NotificationsService.sendBadgeRevokedEmail implemented
- [x] BadgesService calls notification service on revocation
- [x] Async error handling (email failure does not break revocation)
- [x] No TypeScript errors

### Testing Complete
- [x] Unit tests for email service (>80% coverage)
- [x] E2E test verifies email sent
- [x] Manual email test successful
- [x] Test in Gmail, Outlook, Apple Mail

### Documentation Complete
- [x] Email template documented in code comments
- [x] Story file updated with sample email screenshot
- [x] Notification flow documented

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| Email template creation (HTML + text) | 0.5h | Dev |
| NotificationsService.sendBadgeRevokedEmail | 1h | Dev |
| BadgesService integration | 0.5h | Dev |
| Unit tests | 1h | Dev |
| E2E tests | 0.5h | Dev |
| Manual testing (send real emails) | 0.5h | Dev |
| **Total** | **4h** | |

### Confidence Level
High - Reuses existing email infrastructure

---

## Dependencies

### Depends On
- [x] Story 0.1: Git Branch Creation
- [x] Story 9.1: Badge Revocation API (triggers email)

### Blocks
- Story U.1: Complete Lifecycle UAT (notifications tested)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| SMTP failures block revocation | Low | High | Async send, catch errors, log only |
| Email goes to spam | Medium | Medium | Use authenticated SMTP, SPF/DKIM configured |
| Employee misses email | Medium | Low | Also show in wallet (Story 9.3) |

---

## Questions & Assumptions

### Assumptions
- Email is primary notification channel (no SMS, push notifications)
- In-app notification is nice-to-have (not MVP requirement)
- Email uses existing MailerService and SMTP configuration
- Retry logic is simple (3 attempts with exponential backoff)

### Open Questions
- Should we CC the issuer or admin on notification? → No, privacy concern
- Should we allow employees to opt-out of revocation emails? → No, critical notification
- Should we send daily digest of revocations? → Not in this story

---

## Timeline

**Estimated Start:** February 4, 2026 (Day 2)  
**Estimated Completion:** February 4, 2026 (Day 2)  
**Actual Start:** [TBD]  
**Actual Completion:** [TBD]

---

## Related Links

- **Epic 9:** Badge Revocation (in epics.md)
- **Sprint 7 Backlog:** [backlog.md](backlog.md)
- **Story 9.1:** [Badge Revocation API](9-1-revoke-api.md) (prerequisite)
- **Existing Email Templates:** `backend/src/templates/emails/`

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| 2026-01-31 | Backlog | Bob (Scrum Master) | Story created during planning |

---

**Next Story:** [9.5: Admin Revocation UI](9-5-admin-ui.md)
