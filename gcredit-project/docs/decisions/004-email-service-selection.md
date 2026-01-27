# ADR 004: Email Service Selection for Badge Notifications

**Date:** 2026-01-27  
**Status:** Accepted  
**Deciders:** Development Team  
**Tags:** email, notifications, azure, infrastructure

---

## Context

Sprint 3 implements badge issuance with email notifications. When a badge is issued, recipients need to be notified via email to claim their badge. We need to select an email service that:

1. Integrates with Azure ecosystem (where our infrastructure lives)
2. Provides reliable delivery with tracking
3. Supports transactional emails (not marketing)
4. Offers reasonable pricing for enterprise internal use
5. Handles SMTP authentication and security
6. Supports email templates

**Current State:**
- Sprint 1 implemented `EmailService` with Nodemailer + Ethereal (test-only)
- File: `backend/src/common/email.service.ts`
- Configuration: `.env` (EMAIL_HOST, EMAIL_PORT, etc.)
- Status: Works for development, not production-ready

## Decision Drivers

- **Azure Integration**: Prefer Azure-native services for consistency
- **Cost**: Internal use (~500-1000 emails/month in MVP phase)
- **Reliability**: 99.9% delivery SLA required
- **Security**: TLS encryption, SPF/DKIM support
- **Developer Experience**: Simple API, good documentation
- **Email Deliverability**: Avoid spam folders

## Options Considered

### Option 1: Azure Communication Services (ACS) - Email ✅ **SELECTED**

**Service:** Azure Communication Services Email  
**Pricing:** $0.10 per 1,000 emails (first 1,000/month free)  
**Setup:** Azure Portal → Communication Services → Email Domain

**Architecture:**
```typescript
// Keep existing EmailService interface
// Change implementation from Nodemailer to ACS SDK

import { EmailClient } from '@azure/communication-email';

export class EmailService {
  private client: EmailClient;

  constructor(configService: ConfigService) {
    const connectionString = configService.get('AZURE_COMMUNICATION_CONNECTION_STRING');
    this.client = new EmailClient(connectionString);
  }

  async sendMail(options: EmailOptions) {
    const message = {
      senderAddress: 'badges@gcredit.example.com',
      content: {
        subject: options.subject,
        html: options.html,
      },
      recipients: {
        to: [{ address: options.to }],
      },
    };
    return await this.client.beginSend(message);
  }
}
```

**Pros:**
- ✅ Azure-native (same account as PostgreSQL, Blob Storage)
- ✅ Unified billing and monitoring
- ✅ Integrates with Azure Monitor and Application Insights
- ✅ Excellent deliverability (Microsoft infrastructure)
- ✅ SPF, DKIM, DMARC configured automatically
- ✅ SDK supports Node.js (TypeScript)
- ✅ Free tier sufficient for MVP (1,000 emails/month)
- ✅ Scales to enterprise volume if needed

**Cons:**
- ⚠️ Requires custom domain verification (gcredit.example.com)
- ⚠️ Email domain setup takes 24-48 hours
- ⚠️ Limited template features (compared to SendGrid)

**Cost Analysis (MVP Phase):**
- Month 1-3: 0-1,000 emails/month → **$0 (free tier)**
- Month 4-6: 1,000-5,000 emails/month → **$0.40/month**
- Year 1: ~10,000 emails/year → **$1/year**

**Implementation Effort:** 2-3 hours
- Install `@azure/communication-email` SDK
- Update `.env` with ACS connection string
- Modify `EmailService` implementation
- Test email delivery
- Update documentation

---

### Option 2: SendGrid

**Service:** Twilio SendGrid  
**Pricing:** Free tier (100 emails/day), then $15/month (40,000 emails)  
**Setup:** SendGrid account → API Key

**Pros:**
- ✅ Popular choice (widely used)
- ✅ Rich template features
- ✅ Good analytics dashboard
- ✅ Marketing email support (future newsletters)

**Cons:**
- ❌ External vendor (outside Azure ecosystem)
- ❌ Separate billing
- ❌ Monitoring not integrated with Azure
- ❌ Free tier limit (100/day = 3,000/month) may be insufficient
- ❌ Paid tier expensive for our volume ($15/month for 40K emails)

**Cost Analysis:**
- Free tier: 100 emails/day (sufficient for MVP)
- Paid tier: $15/month (overkill for 1,000 emails/month)

**Verdict:** Rejected - Cost and integration disadvantages

---

### Option 3: Office 365 SMTP Relay

**Service:** Microsoft 365 SMTP relay  
**Pricing:** Included with Microsoft 365 subscription  
**Setup:** Configure SMTP connector in Exchange Admin

**Pros:**
- ✅ No additional cost (if company has M365)
- ✅ Microsoft infrastructure
- ✅ Works with existing company email domain

**Cons:**
- ❌ Requires Microsoft 365 subscription
- ❌ Rate limits (30 messages/minute per connection)
- ❌ Not designed for application-to-user emails
- ❌ No SDK (SMTP only, via Nodemailer)
- ❌ Difficult troubleshooting (IT admin involvement)

**Verdict:** Rejected - Designed for relay, not transactional emails

---

### Option 4: Keep Ethereal (Development Only)

**Service:** Ethereal Email (fake SMTP)  
**Current Status:** Already implemented in Sprint 1

**Pros:**
- ✅ Works for development/testing
- ✅ No cost
- ✅ Easy to inspect emails in browser

**Cons:**
- ❌ Not a production solution
- ❌ Emails not actually delivered
- ❌ Cannot be used for MVP deployment

**Verdict:** Keep for development, not for production

---

## Decision

**We will use Azure Communication Services (ACS) Email** for production badge notifications.

### Implementation Plan

#### Phase 1: Azure Setup (30 min)
1. Create Azure Communication Services resource
   - Resource Group: `rg-gcredit-dev`
   - Location: East US
   - Pricing: Free tier (1,000 emails/month)

2. Verify custom domain (gcredit.example.com)
   - Add TXT records for domain verification
   - Configure SPF, DKIM, DMARC records
   - Wait 24-48 hours for verification

3. Get connection string
   - Copy from Azure Portal → Keys section
   - Add to `.env` as `AZURE_COMMUNICATION_CONNECTION_STRING`

#### Phase 2: Code Changes (1-2 hours)
1. Install SDK
   ```bash
   npm install @azure/communication-email
   ```

2. Update `EmailService` implementation
   ```typescript
   // src/common/email.service.ts
   import { EmailClient } from '@azure/communication-email';
   
   @Injectable()
   export class EmailService {
     private client: EmailClient;
     private readonly from: string;
   
     constructor(private configService: ConfigService) {
       const connectionString = this.configService.get('AZURE_COMMUNICATION_CONNECTION_STRING');
       this.from = this.configService.get('EMAIL_FROM', 'badges@gcredit.example.com');
       
       if (this.configService.get('NODE_ENV') === 'development') {
         // Keep Ethereal for development
         this.initializeEthereal();
       } else {
         // Use ACS for production
         this.client = new EmailClient(connectionString);
       }
     }
   
     async sendMail(options: SendMailOptions): Promise<void> {
       if (this.configService.get('NODE_ENV') === 'development') {
         return this.sendViaEthereal(options);
       }
       
       const message = {
         senderAddress: this.from,
         content: {
           subject: options.subject,
           html: options.html,
           plainText: options.text,
         },
         recipients: {
           to: [{ address: options.to, displayName: options.name }],
         },
       };
       
       const poller = await this.client.beginSend(message);
       await poller.pollUntilDone();
     }
   }
   ```

3. Update `.env.example`
   ```env
   # Email Service (Azure Communication Services)
   AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://...;accesskey=..."
   EMAIL_FROM="badges@gcredit.example.com"
   
   # Development only (Ethereal)
   EMAIL_HOST="smtp.ethereal.email"
   EMAIL_PORT=587
   EMAIL_USER="..."
   EMAIL_PASS="..."
   ```

#### Phase 3: Testing (30 min)
1. Unit tests: Mock ACS client
2. Integration test: Send test email
3. Verify deliverability (check spam folder)
4. Monitor Azure Portal for delivery status

#### Phase 4: Documentation (30 min)
1. Update DEPLOYMENT.md with ACS setup steps
2. Add email troubleshooting section
3. Document environment variables

---

## Consequences

### Positive
- ✅ **Unified Azure Ecosystem**: All infrastructure in one place
- ✅ **Cost-Effective**: Free for MVP phase, scales cheaply
- ✅ **Reliable Delivery**: Microsoft infrastructure (99.9% SLA)
- ✅ **Security**: Automatic SPF/DKIM configuration
- ✅ **Monitoring**: Integrated with Azure Application Insights
- ✅ **Developer Experience**: TypeScript SDK, async/await pattern

### Negative
- ⚠️ **Domain Verification**: 24-48 hour wait (plan ahead)
- ⚠️ **Template Limitations**: No visual template editor (use handlebars in code)
- ⚠️ **Learning Curve**: New SDK (vs familiar Nodemailer)

### Risks & Mitigations
- **Risk**: Domain verification fails
  - **Mitigation**: Use Azure-provided domain (donotreply@{guid}.azurecomm.net) for MVP
  - **Mitigation**: Prepare DNS records in advance

- **Risk**: Emails land in spam
  - **Mitigation**: Verify SPF, DKIM, DMARC setup
  - **Mitigation**: Test with multiple email providers (Gmail, Outlook, Yahoo)
  - **Mitigation**: Include clear from address and subject lines

- **Risk**: Rate limiting
  - **Mitigation**: ACS default: 100 emails/second (sufficient for our use case)
  - **Mitigation**: Implement queue for bulk badge issuance

---

## Email Templates

### Badge Claim Notification
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>You've earned a badge!</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>🎓 Congratulations!</h1>
  <p>Hi {{recipientName}},</p>
  <p>You've been awarded the <strong>{{badgeName}}</strong> badge!</p>
  <img src="{{badgeImageUrl}}" alt="{{badgeName}}" style="max-width: 200px;" />
  <p><strong>Description:</strong> {{badgeDescription}}</p>
  <p><a href="{{claimUrl}}" style="background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Claim Your Badge</a></p>
  <p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
  <hr>
  <p style="color: #999; font-size: 12px;">G-Credit Digital Credentialing Platform</p>
</body>
</html>
```

### Badge Revocation Notification
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>⚠️ Badge Revoked</h1>
  <p>Hi {{recipientName}},</p>
  <p>Your <strong>{{badgeName}}</strong> badge has been revoked.</p>
  <p><strong>Reason:</strong> {{revocationReason}}</p>
  <p>If you have questions, please contact <a href="mailto:badges@gcredit.example.com">badges@gcredit.example.com</a>.</p>
</body>
</html>
```

---

## Configuration Reference

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `AZURE_COMMUNICATION_CONNECTION_STRING` | (empty, uses Ethereal) | Required | ACS connection string |
| `EMAIL_FROM` | no-reply@ethereal.email | badges@gcredit.example.com | Sender address |
| `NODE_ENV` | development | production | Environment |

### Azure Resources

- **Resource Group:** `rg-gcredit-dev`
- **Communication Service:** `gcredit-communication`
- **Email Domain:** `gcredit.example.com`
- **Monthly Cost (MVP):** $0 (free tier)

---

## References

- [Azure Communication Services Email Documentation](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview)
- [ACS Email Node.js SDK](https://www.npmjs.com/package/@azure/communication-email)
- [Sprint 1 EmailService Implementation](../backend/src/common/email.service.ts)
- [Lesson 12: Security Debt Management](../docs/lessons-learned/lessons-learned.md#lesson-12)

---

## Review Schedule

- **Next Review:** After Sprint 3 (based on actual email delivery metrics)
- **Consider SendGrid:** If need advanced templates or marketing emails (Sprint 6+)
- **Monitor:** Email bounce rate, spam complaints, delivery time

---

**ADR Status:** ✅ Accepted  
**Implementation Sprint:** Sprint 3  
**Related ADRs:** ADR-003 (Badge Assertion Format)  
**Estimated Setup Time:** 3-4 hours (including domain verification wait)
