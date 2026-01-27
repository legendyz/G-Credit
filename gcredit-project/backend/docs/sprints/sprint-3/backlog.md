# Sprint 3 Backlog - Epic 4: Badge Issuance

**Sprint Period:** TBD (estimated 1-2 days, 12.5 hours)  
**Epic:** Epic 4 - Badge Issuance  
**Team:** Solo Developer  
**Version:** v0.3.0 (Badge Issuance Module)  
**Created:** 2026-01-27  
**Status:** Ready to Start

---

## 📋 Sprint Goal

**Primary Goal:**  
Implement complete badge issuance and claiming workflow that allows authorized users to issue Open Badges 2.0 compliant badges, send email notifications, and enable recipients to claim their digital credentials.

**Success Criteria:**
- ✅ ADMIN/ISSUER can issue badges (single + bulk)
- ✅ Recipients receive email notifications
- ✅ Recipients can claim badges via unique token
- ✅ Badges include Open Badges 2.0 assertion
- ✅ Public verification endpoint functional
- ✅ 100% test pass rate (40 tests)

---

## 📊 Story Overview

| ID | Story | Estimate | Priority | Dependencies |
|----|-------|----------|----------|--------------|
| 4.1 | Single Badge Issuance | 2h | Must Have | Badge model |
| 4.5 | Email Notifications | 2h | Must Have | ACS setup |
| 4.3 | Badge Claiming Workflow | 2h | Must Have | Story 4.1, 4.5 |
| 4.2 | Batch Badge Issuance (CSV) | 3h | Must Have | Story 4.1 |
| 4.4 | Issuance History & Queries | 2h | Must Have | Story 4.1 |
| 4.6 | Badge Revocation | 1.5h | Should Have | Story 4.1 |

**Total Estimated Time:** 12.5 hours

**Execution Order:** 4.1 → 4.5 → 4.3 → 4.2 → 4.4 → 4.6

---

## 🎯 Story 4.1: Single Badge Issuance

### User Story
**As** an authorized user (ADMIN or ISSUER),  
**I want** to issue a single badge to an employee,  
**So that** I can recognize their achievement with a verifiable digital credential.

### Business Value
Core functionality for MVP. Enables manual recognition workflow.

### Acceptance Criteria
- [ ] AC1: POST `/api/badges` endpoint accepts: `templateId`, `recipientId`, `evidenceUrl` (optional), `expiresIn` (days, optional)
- [ ] AC2: System validates template exists and is ACTIVE
- [ ] AC3: System validates recipient exists
- [ ] AC4: System generates Open Badges 2.0 compliant assertion JSON
- [ ] AC5: System generates unique 32-character claim token
- [ ] AC6: Badge status defaults to PENDING
- [ ] AC7: System returns Badge object with `id`, `assertionUrl`, `claimToken`, `claimUrl`
- [ ] AC8: Only ADMIN and ISSUER roles can issue badges
- [ ] AC9: Issuer's user ID recorded in badge record
- [ ] AC10: Assertion includes issuer profile, recipient hash, badge class, issuance date

---

### Technical Tasks

#### Task 1.1: Create Badge Data Model (30 min)
**File:** `backend/prisma/schema.prisma`

**Changes:**
```prisma
model Badge {
  id              String        @id @default(uuid())
  templateId      String
  recipientId     String
  issuerId        String
  evidenceUrl     String?       // Azure Blob Storage URL
  issuedAt        DateTime      @default(now())
  expiresAt       DateTime?     // Calculated from expiresIn
  status          BadgeStatus   @default(PENDING)
  claimToken      String?       @unique // 32-char token
  claimedAt       DateTime?
  revokedAt       DateTime?
  revocationReason String?      @db.Text
  assertionJson   Json          // Open Badges 2.0 JSON-LD
  recipientHash   String        // SHA-256(email + salt)
  
  template        BadgeTemplate @relation(fields: [templateId], references: [id])
  recipient       User          @relation("BadgesReceived", fields: [recipientId], references: [id])
  issuer          User          @relation("BadgesIssued", fields: [issuerId], references: [id])
  
  @@index([recipientId, status])
  @@index([templateId, issuedAt])
  @@index([claimToken])
  @@index([status, expiresAt])
  @@map("badges")
}

enum BadgeStatus {
  PENDING   // Awaiting claim
  CLAIMED   // Claimed by recipient
  EXPIRED   // Past expiration date
  REVOKED   // Revoked by admin
}
```

**Commands:**
```bash
# Create migration
node_modules\.bin\prisma migrate dev --name add_badge_model

# Verify migration
node_modules\.bin\prisma studio
```

---

#### Task 1.2: Create Badge Issuance Module (15 min)
**Commands:**
```bash
cd backend/src
nest g module badge-issuance
nest g controller badge-issuance
nest g service badge-issuance
```

**File Structure:**
```
src/badge-issuance/
├── badge-issuance.module.ts
├── badge-issuance.controller.ts
├── badge-issuance.service.ts
├── dto/
│   ├── issue-badge.dto.ts
│   ├── badge-response.dto.ts
│   └── query-badge.dto.ts
└── services/
    └── assertion-generator.service.ts
```

---

#### Task 1.3: Create IssueBadgeDto (20 min)
**File:** `src/badge-issuance/dto/issue-badge.dto.ts`

**Content:**
```typescript
import { IsUUID, IsOptional, IsUrl, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueBadgeDto {
  @ApiProperty({
    description: 'Badge template ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  templateId: string;

  @ApiProperty({
    description: 'Recipient user ID',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsUUID()
  recipientId: string;

  @ApiPropertyOptional({
    description: 'Evidence URL (Azure Blob Storage)',
    example: 'https://storage.azure.com/evidence/cert-12345.pdf'
  })
  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;

  @ApiPropertyOptional({
    description: 'Expiration in days (null = no expiration)',
    example: 365,
    minimum: 1,
    maximum: 3650
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650) // Max 10 years
  expiresIn?: number;
}
```

**Validation Rules:**
- templateId: Must be valid UUID
- recipientId: Must be valid UUID
- evidenceUrl: Must be valid URL (if provided)
- expiresIn: 1-3650 days (if provided)

---

#### Task 1.4: Create AssertionGeneratorService (45 min)
**File:** `src/badge-issuance/services/assertion-generator.service.ts`

**Implementation:**
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AssertionGeneratorService {
  private readonly baseUrl: string;
  private readonly issuerProfile: any;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('APP_URL', 'https://gcredit.example.com');
    this.issuerProfile = {
      type: 'Profile',
      id: `${this.baseUrl}/issuer`,
      name: 'G-Credit Learning & Development',
      url: this.baseUrl,
      email: this.configService.get('EMAIL_FROM', 'badges@gcredit.example.com'),
    };
  }

  /**
   * Generate Open Badges 2.0 compliant assertion
   * Reference: https://www.imsglobal.org/spec/ob/v2p0/
   */
  generateAssertion(params: {
    badgeId: string;
    template: BadgeTemplate;
    recipient: User;
    issuer: User;
    issuedAt: Date;
    expiresAt?: Date;
    evidenceUrl?: string;
  }) {
    const { badgeId, template, recipient, issuer, issuedAt, expiresAt, evidenceUrl } = params;

    // Hash recipient email (privacy-preserving)
    const recipientHash = this.hashEmail(recipient.email);

    const assertion = {
      '@context': 'https://w3id.org/openbadges/v2',
      type: 'Assertion',
      id: `${this.baseUrl}/api/badges/${badgeId}/assertion`,
      
      // Badge Class
      badge: {
        type: 'BadgeClass',
        id: `${this.baseUrl}/api/badge-templates/${template.id}`,
        name: template.name,
        description: template.description,
        image: template.imageUrl,
        criteria: {
          narrative: template.issuanceCriteria?.description || 'Badge awarded for achievement',
        },
        issuer: this.issuerProfile,
      },
      
      // Recipient (hashed)
      recipient: {
        type: 'email',
        hashed: true,
        salt: this.getSalt(),
        identity: recipientHash,
      },
      
      // Issuance metadata
      issuedOn: issuedAt.toISOString(),
      ...(expiresAt && { expires: expiresAt.toISOString() }),
      
      // Verification
      verification: {
        type: 'hosted',
        url: `${this.baseUrl}/api/badges/${badgeId}/assertion`,
      },
      
      // Evidence (optional)
      ...(evidenceUrl && {
        evidence: [{
          id: evidenceUrl,
          name: 'Supporting Evidence',
          description: 'Evidence of achievement',
        }],
      }),
    };

    return assertion;
  }

  /**
   * Hash email with SHA-256 for privacy
   * Format: sha256$<hexdigest>
   */
  private hashEmail(email: string): string {
    const salt = this.getSalt();
    const hash = crypto
      .createHash('sha256')
      .update(email.toLowerCase() + salt)
      .digest('hex');
    return `sha256$${hash}`;
  }

  /**
   * Get salt for email hashing (from env or default)
   */
  private getSalt(): string {
    return this.configService.get('BADGE_SALT', 'gcredit-default-salt');
  }

  /**
   * Generate unique claim token (32 characters)
   */
  generateClaimToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get assertion URL for badge
   */
  getAssertionUrl(badgeId: string): string {
    return `${this.baseUrl}/api/badges/${badgeId}/assertion`;
  }

  /**
   * Get claim URL for badge
   */
  getClaimUrl(claimToken: string): string {
    return `${this.baseUrl}/claim-badge?token=${claimToken}`;
  }
}
```

**Unit Tests (8 tests):**
- ✅ Generates valid OB 2.0 structure
- ✅ Hashes email with SHA-256
- ✅ Includes evidence if provided
- ✅ Sets expiration if provided
- ✅ Generates unique claim tokens
- ✅ Formats assertion URL correctly
- ✅ Formats claim URL correctly
- ✅ Uses issuer profile from config

---

#### Task 1.5: Implement BadgeIssuanceService.issue() (45 min)
**File:** `src/badge-issuance/badge-issuance.service.ts`

**Implementation:**
```typescript
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { IssueBadgeDto } from './dto/issue-badge.dto';
import { BadgeStatus } from '@prisma/client';

@Injectable()
export class BadgeIssuanceService {
  constructor(
    private prisma: PrismaService,
    private assertionGenerator: AssertionGeneratorService,
  ) {}

  /**
   * Issue a single badge
   */
  async issueBadge(dto: IssueBadgeDto, issuerId: string) {
    // 1. Validate template exists and is ACTIVE
    const template = await this.prisma.badgeTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(`Badge template ${dto.templateId} not found`);
    }

    if (template.status !== 'ACTIVE') {
      throw new BadRequestException(`Badge template ${template.name} is not active`);
    }

    // 2. Validate recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException(`Recipient ${dto.recipientId} not found`);
    }

    // 3. Get issuer info
    const issuer = await this.prisma.user.findUnique({
      where: { id: issuerId },
    });

    // 4. Calculate expiration date
    const issuedAt = new Date();
    const expiresAt = dto.expiresIn
      ? new Date(issuedAt.getTime() + dto.expiresIn * 24 * 60 * 60 * 1000)
      : null;

    // 5. Generate claim token
    const claimToken = this.assertionGenerator.generateClaimToken();

    // 6. Generate Open Badges 2.0 assertion
    const assertion = this.assertionGenerator.generateAssertion({
      badgeId: 'temp-id', // Will be updated after creation
      template,
      recipient,
      issuer,
      issuedAt,
      expiresAt,
      evidenceUrl: dto.evidenceUrl,
    });

    // 7. Hash recipient email
    const recipientHash = this.hashEmail(recipient.email);

    // 8. Create badge in database
    const badge = await this.prisma.badge.create({
      data: {
        templateId: dto.templateId,
        recipientId: dto.recipientId,
        issuerId,
        evidenceUrl: dto.evidenceUrl,
        issuedAt,
        expiresAt,
        status: BadgeStatus.PENDING,
        claimToken,
        recipientHash,
        // IMPORTANT: Convert DTO to plain object (Lesson 13)
        assertionJson: JSON.parse(JSON.stringify(assertion)),
      },
      include: {
        template: true,
        recipient: true,
        issuer: true,
      },
    });

    // 9. Update assertion with actual badge ID
    const finalAssertion = {
      ...assertion,
      id: this.assertionGenerator.getAssertionUrl(badge.id),
    };

    await this.prisma.badge.update({
      where: { id: badge.id },
      data: {
        assertionJson: JSON.parse(JSON.stringify(finalAssertion)),
      },
    });

    // 10. Return badge response
    return {
      id: badge.id,
      status: badge.status,
      issuedAt: badge.issuedAt,
      expiresAt: badge.expiresAt,
      claimToken: badge.claimToken,
      claimUrl: this.assertionGenerator.getClaimUrl(badge.claimToken),
      assertionUrl: this.assertionGenerator.getAssertionUrl(badge.id),
      template: {
        id: badge.template.id,
        name: badge.template.name,
        imageUrl: badge.template.imageUrl,
      },
      recipient: {
        id: badge.recipient.id,
        name: badge.recipient.name,
        email: badge.recipient.email,
      },
    };
  }

  /**
   * Hash email with SHA-256
   */
  private hashEmail(email: string): string {
    // Delegate to AssertionGeneratorService
    return this.assertionGenerator['hashEmail'](email);
  }
}
```

---

#### Task 1.6: Implement Controller Endpoint (20 min)
**File:** `src/badge-issuance/badge-issuance.controller.ts`

**Implementation:**
```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BadgeIssuanceService } from './badge-issuance.service';
import { IssueBadgeDto } from './dto/issue-badge.dto';

@ApiTags('Badge Issuance')
@Controller('api/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BadgeIssuanceController {
  constructor(private readonly badgeService: BadgeIssuanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Issue a single badge' })
  @ApiResponse({ status: 201, description: 'Badge issued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Template or recipient not found' })
  async issueBadge(@Body() dto: IssueBadgeDto, @Request() req) {
    return this.badgeService.issueBadge(dto, req.user.userId);
  }
}
```

**ACTUAL Import Paths (Lesson 10):**
```typescript
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
```

---

#### Task 1.7: Update Module Imports (10 min)
**File:** `src/badge-issuance/badge-issuance.module.ts`

**Implementation:**
```typescript
import { Module } from '@nestjs/common';
import { BadgeIssuanceController } from './badge-issuance.controller';
import { BadgeIssuanceService } from './badge-issuance.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BadgeIssuanceController],
  providers: [BadgeIssuanceService, AssertionGeneratorService],
  exports: [BadgeIssuanceService],
})
export class BadgeIssuanceModule {}
```

**File:** `src/app.module.ts`
```typescript
import { BadgeIssuanceModule } from './badge-issuance/badge-issuance.module';

@Module({
  imports: [
    // ... existing modules
    BadgeIssuanceModule,
  ],
})
export class AppModule {}
```

---

#### Task 1.8: Write Tests (Unit + E2E) (40 min)

**Unit Tests (6 tests):**
**File:** `src/badge-issuance/badge-issuance.service.spec.ts`

**Test Cases:**
1. ✅ Issues badge successfully with valid inputs
2. ✅ Throws NotFoundException if template not found
3. ✅ Throws BadRequestException if template not ACTIVE
4. ✅ Throws NotFoundException if recipient not found
5. ✅ Generates unique claim token
6. ✅ Calculates expiration date correctly

**E2E Tests (3 tests):**
**File:** `test/badge-issuance.e2e-spec.ts`

**Test Cases:**
1. ✅ POST /api/badges - Authorized user issues badge successfully
2. ✅ POST /api/badges - Unauthorized user (EMPLOYEE) gets 403
3. ✅ POST /api/badges - Invalid template ID returns 404

**Commands:**
```bash
# Run unit tests
npm run test -- badge-issuance.service

# Run E2E tests
npm run test:e2e -- badge-issuance
```

---

### Definition of Done

- [ ] Prisma migration applied successfully
- [ ] Badge model created with all fields
- [ ] AssertionGeneratorService generates valid OB 2.0 JSON
- [ ] BadgeIssuanceService.issueBadge() works correctly
- [ ] POST /api/badges endpoint functional
- [ ] RBAC enforced (ADMIN/ISSUER only)
- [ ] Unit tests pass (6/6)
- [ ] E2E tests pass (3/3)
- [ ] Swagger documentation complete
- [ ] No console.log in code
- [ ] Code reviewed and formatted

---

### Testing Commands

```bash
# Database migration
node_modules\.bin\prisma migrate dev --name add_badge_model

# Run development server
npm run start:dev

# Test endpoint (PowerShell)
$token = "your-jwt-token"
$templateId = "uuid-of-template"
$recipientId = "uuid-of-user"

$body = @{
  templateId = $templateId
  recipientId = $recipientId
  evidenceUrl = "https://example.com/cert.pdf"
  expiresIn = 365
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/badges" `
  -Method POST `
  -Headers @{Authorization = "Bearer $token"} `
  -ContentType "application/json" `
  -Body $body
```

---

### Estimated Time: **2 hours**

---

## 🎯 Story 4.5: Email Notifications

### User Story
**As** the system,  
**I want** to send email notifications to recipients when badges are issued,  
**So that** recipients know they have a badge to claim.

### Business Value
Essential for user engagement. Recipients need to know about their badges.

### Acceptance Criteria
- [ ] AC1: Email sent immediately after badge issuance
- [ ] AC2: Email contains badge name, description, and image
- [ ] AC3: Email contains clickable claim link with token
- [ ] AC4: Email has 7-day expiration reminder
- [ ] AC5: Email sent from configured FROM address
- [ ] AC6: Email uses HTML template with branding
- [ ] AC7: Failed email sending logs error but doesn't fail issuance
- [ ] AC8: Development environment uses Ethereal (fake SMTP)
- [ ] AC9: Production environment uses Azure Communication Services
- [ ] AC10: Email delivery tracked in logs

---

### Technical Tasks

#### Task 5.1: Update EmailService for Production (1h)
**File:** `src/common/email.service.ts`

**Current State:** Uses Ethereal (test SMTP) from Sprint 1

**Required Changes:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailClient } from '@azure/communication-email';
import * as nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private acsClient: EmailClient;
  private etherealTransporter: any;
  private readonly isDevelopment: boolean;
  private readonly fromAddress: string;

  constructor(private configService: ConfigService) {
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';
    this.fromAddress = this.configService.get('EMAIL_FROM', 'badges@gcredit.example.com');

    if (this.isDevelopment) {
      this.initializeEthereal();
    } else {
      this.initializeACS();
    }
  }

  /**
   * Initialize Azure Communication Services (Production)
   */
  private initializeACS() {
    const connectionString = this.configService.get('AZURE_COMMUNICATION_CONNECTION_STRING');
    if (!connectionString) {
      throw new Error('AZURE_COMMUNICATION_CONNECTION_STRING not configured');
    }
    this.acsClient = new EmailClient(connectionString);
    this.logger.log('✅ Azure Communication Services Email initialized');
  }

  /**
   * Initialize Ethereal (Development)
   */
  private async initializeEthereal() {
    const testAccount = await nodemailer.createTestAccount();
    this.etherealTransporter = nodemailer.createTransporter({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    this.logger.log('✅ Ethereal Email initialized (development)');
  }

  /**
   * Send email (production or development)
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      if (this.isDevelopment) {
        await this.sendViaEthereal(options);
      } else {
        await this.sendViaACS(options);
      }
      this.logger.log(`✅ Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error.message);
      // Don't throw - email failure shouldn't block badge issuance
    }
  }

  /**
   * Send via Azure Communication Services
   */
  private async sendViaACS(options: SendMailOptions): Promise<void> {
    const message = {
      senderAddress: this.fromAddress,
      content: {
        subject: options.subject,
        html: options.html,
        plainText: options.text || this.stripHtml(options.html),
      },
      recipients: {
        to: [{ address: options.to }],
      },
    };

    const poller = await this.acsClient.beginSend(message);
    await poller.pollUntilDone();
  }

  /**
   * Send via Ethereal (Development)
   */
  private async sendViaEthereal(options: SendMailOptions): Promise<void> {
    const info = await this.etherealTransporter.sendMail({
      from: this.fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    this.logger.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
```

**Install Dependencies:**
```bash
npm install @azure/communication-email
```

**Update `.env.example`:**
```env
# Azure Communication Services (Production)
AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://...;accesskey=..."
EMAIL_FROM="badges@gcredit.example.com"

# Node Environment
NODE_ENV="development"
```

---

#### Task 5.2: Create Badge Notification Email Template (30 min)
**File:** `src/badge-issuance/templates/badge-claim-notification.html`

**HTML Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've earned a badge!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .badge-image {
      text-align: center;
      margin: 20px 0;
    }
    .badge-image img {
      max-width: 200px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .cta-button {
      display: inline-block;
      background: #0078d4;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .cta-button:hover {
      background: #005a9e;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #0078d4;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">🎓 Congratulations!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">You've earned a new digital badge</p>
  </div>
  
  <div class="content">
    <p>Hi {{recipientName}},</p>
    
    <p>Great news! You've been awarded the <strong>{{badgeName}}</strong> badge for your outstanding achievement.</p>
    
    <div class="badge-image">
      <img src="{{badgeImageUrl}}" alt="{{badgeName}}">
    </div>
    
    <div class="info-box">
      <p><strong>Badge Description:</strong></p>
      <p>{{badgeDescription}}</p>
    </div>
    
    <p><strong>What's next?</strong></p>
    <p>Click the button below to claim your badge and add it to your digital wallet. You'll be able to share it on LinkedIn, download it, and showcase your achievement.</p>
    
    <div style="text-align: center;">
      <a href="{{claimUrl}}" class="cta-button">Claim Your Badge</a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      ⏰ This claim link expires in 7 days. Make sure to claim your badge soon!
    </p>
    
    <div class="info-box" style="border-left-color: #28a745;">
      <p><strong>✨ Why digital badges?</strong></p>
      <p>Digital badges are verifiable credentials that showcase your skills and achievements. They're based on Open Badges 2.0 standard and can be shared across professional networks.</p>
    </div>
  </div>
  
  <div class="footer">
    <p><strong>G-Credit Digital Credentialing Platform</strong></p>
    <p>This is an automated email. Please do not reply.</p>
    <p>If you have questions, contact <a href="mailto:badges@gcredit.example.com">badges@gcredit.example.com</a></p>
  </div>
</body>
</html>
```

**Template Variables:**
- `{{recipientName}}` - User's display name
- `{{badgeName}}` - Badge template name
- `{{badgeImageUrl}}` - Badge image URL
- `{{badgeDescription}}` - Badge description
- `{{claimUrl}}` - Claim link with token

---

#### Task 5.3: Create Email Notification Service (30 min)
**File:** `src/badge-issuance/services/badge-notification.service.ts`

**Implementation:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../common/email.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BadgeNotificationService {
  private readonly logger = new Logger(BadgeNotificationService.name);
  private badgeClaimTemplate: string;

  constructor(private emailService: EmailService) {
    // Load email template
    const templatePath = path.join(__dirname, '../templates/badge-claim-notification.html');
    this.badgeClaimTemplate = fs.readFileSync(templatePath, 'utf-8');
  }

  /**
   * Send badge claim notification email
   */
  async sendBadgeClaimNotification(params: {
    recipientEmail: string;
    recipientName: string;
    badgeName: string;
    badgeDescription: string;
    badgeImageUrl: string;
    claimUrl: string;
  }): Promise<void> {
    try {
      // Replace template variables
      const html = this.badgeClaimTemplate
        .replace(/\{\{recipientName\}\}/g, params.recipientName || 'there')
        .replace(/\{\{badgeName\}\}/g, params.badgeName)
        .replace(/\{\{badgeDescription\}\}/g, params.badgeDescription)
        .replace(/\{\{badgeImageUrl\}\}/g, params.badgeImageUrl)
        .replace(/\{\{claimUrl\}\}/g, params.claimUrl);

      await this.emailService.sendMail({
        to: params.recipientEmail,
        subject: `🎓 You've earned the ${params.badgeName} badge!`,
        html,
      });

      this.logger.log(`✅ Badge claim notification sent to ${params.recipientEmail}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send badge notification:`, error);
      // Don't throw - email failure shouldn't block badge issuance
    }
  }

  /**
   * Send badge revocation notification
   */
  async sendBadgeRevocationNotification(params: {
    recipientEmail: string;
    recipientName: string;
    badgeName: string;
    revocationReason: string;
  }): Promise<void> {
    // Implementation in Story 4.6
  }
}
```

---

#### Task 5.4: Integrate Email into Badge Issuance (20 min)
**File:** `src/badge-issuance/badge-issuance.service.ts`

**Changes:**
```typescript
import { BadgeNotificationService } from './services/badge-notification.service';

@Injectable()
export class BadgeIssuanceService {
  constructor(
    private prisma: PrismaService,
    private assertionGenerator: AssertionGeneratorService,
    private notificationService: BadgeNotificationService, // NEW
  ) {}

  async issueBadge(dto: IssueBadgeDto, issuerId: string) {
    // ... existing code ...

    const badge = await this.prisma.badge.create({
      // ... existing code ...
    });

    // 11. Send email notification (NEW)
    await this.notificationService.sendBadgeClaimNotification({
      recipientEmail: recipient.email,
      recipientName: recipient.name || recipient.email,
      badgeName: template.name,
      badgeDescription: template.description,
      badgeImageUrl: template.imageUrl,
      claimUrl: this.assertionGenerator.getClaimUrl(badge.claimToken),
    });

    return {
      // ... existing return ...
    };
  }
}
```

**Update Module:**
```typescript
// badge-issuance.module.ts
import { BadgeNotificationService } from './services/badge-notification.service';
import { EmailModule } from '../common/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [
    BadgeIssuanceService,
    AssertionGeneratorService,
    BadgeNotificationService, // NEW
  ],
})
export class BadgeIssuanceModule {}
```

---

#### Task 5.5: Setup Azure Communication Services (Manual, 1h)

**Azure Portal Steps:**
1. Navigate to Azure Portal → Create Resource
2. Search "Communication Services" → Create
3. Configuration:
   - Resource Group: `rg-gcredit-dev`
   - Name: `gcredit-communication`
   - Location: `East US`
   - Data Location: `United States`
4. Review + Create
5. Go to Resource → Keys → Copy Connection String
6. Add to `.env`:
   ```env
   AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://gcredit-communication.unitedstates.communication.azure.com/;accesskey=..."
   ```

**Email Domain Setup (Optional, 24-48h wait):**
1. Communication Services → Email → Domains → Add Domain
2. Custom domain: `gcredit.example.com`
3. Add DNS records (TXT, SPF, DKIM)
4. Wait for verification

**Quick Start (No wait):**
- Use Azure-provided domain: `DoNotReply@{guid}.azurecomm.net`
- No DNS setup needed
- Works immediately for testing

---

### Testing

**Manual Test (Development - Ethereal):**
```bash
# Set NODE_ENV=development in .env
npm run start:dev

# Issue a badge (will send email to Ethereal)
# Check console for preview URL
```

**Manual Test (Production - ACS):**
```bash
# Set NODE_ENV=production in .env
# Add AZURE_COMMUNICATION_CONNECTION_STRING

npm run start:dev

# Issue a badge
# Check recipient's actual email inbox
```

**E2E Test:**
```typescript
// test/badge-issuance.e2e-spec.ts
it('should send email notification when badge is issued', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/badges')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      templateId: templateId,
      recipientId: recipientId,
    });
  
  expect(response.status).toBe(201);
  // Email service mocked in tests
});
```

---

### Definition of Done

- [ ] EmailService supports ACS and Ethereal
- [ ] Email template created and tested
- [ ] BadgeNotificationService sends emails
- [ ] Email integrated into badge issuance
- [ ] Development uses Ethereal (preview URLs in console)
- [ ] Production uses ACS (actual email delivery)
- [ ] Failed email doesn't block badge issuance
- [ ] Email delivery logged
- [ ] Template variables work correctly
- [ ] Email HTML renders correctly in Gmail/Outlook

---

### Estimated Time: **2 hours**

---

## 🎯 Story 4.3: Badge Claiming Workflow

### User Story
**As** a badge recipient,  
**I want** to claim my badge using the link in my email,  
**So that** my badge appears in my digital wallet.

### Business Value
Completes the issuance-to-claim cycle. Recipients take ownership of their badges.

### Acceptance Criteria
- [ ] AC1: POST `/api/badges/:id/claim` accepts `claimToken` in body
- [ ] AC2: Valid token changes badge status from PENDING → CLAIMED
- [ ] AC3: Claim timestamp recorded
- [ ] AC4: Invalid token returns 404
- [ ] AC5: Already claimed badge returns 400 "Badge already claimed"
- [ ] AC6: Expired token returns 410 "Token expired"
- [ ] AC7: Revoked badge cannot be claimed (returns 410)
- [ ] AC8: Claim endpoint is PUBLIC (no authentication required)
- [ ] AC9: Claim returns badge details (name, image, assertion URL)
- [ ] AC10: Token can only be used once

---

### Technical Tasks

#### Task 3.1: Create ClaimBadgeDto (10 min)
**File:** `src/badge-issuance/dto/claim-badge.dto.ts`

```typescript
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimBadgeDto {
  @ApiProperty({
    description: 'Unique 32-character claim token from email',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    minLength: 32,
    maxLength: 32
  })
  @IsString()
  @Length(32, 32)
  claimToken: string;
}
```

---

#### Task 3.2: Implement claimBadge() Service Method (40 min)
**File:** `src/badge-issuance/badge-issuance.service.ts`

```typescript
import { BadRequestException, NotFoundException, GoneException } from '@nestjs/common';

@Injectable()
export class BadgeIssuanceService {
  // ... existing methods ...

  /**
   * Claim a badge using claim token
   */
  async claimBadge(claimToken: string) {
    // 1. Find badge by claim token
    const badge = await this.prisma.badge.findUnique({
      where: { claimToken },
      include: {
        template: true,
        recipient: true,
      },
    });

    if (!badge) {
      throw new NotFoundException('Invalid claim token');
    }

    // 2. Check if already claimed
    if (badge.status === BadgeStatus.CLAIMED) {
      throw new BadRequestException('Badge has already been claimed');
    }

    // 3. Check if revoked
    if (badge.status === BadgeStatus.REVOKED) {
      throw new GoneException('Badge has been revoked');
    }

    // 4. Check if expired
    if (badge.expiresAt && badge.expiresAt < new Date()) {
      // Update status to EXPIRED
      await this.prisma.badge.update({
        where: { id: badge.id },
        data: { status: BadgeStatus.EXPIRED },
      });
      throw new GoneException('Badge has expired');
    }

    // 5. Check if claim token expired (7 days from issuance)
    const tokenExpirationDate = new Date(badge.issuedAt);
    tokenExpirationDate.setDate(tokenExpirationDate.getDate() + 7);
    if (tokenExpirationDate < new Date()) {
      throw new GoneException('Claim token has expired');
    }

    // 6. Claim the badge
    const claimedBadge = await this.prisma.badge.update({
      where: { id: badge.id },
      data: {
        status: BadgeStatus.CLAIMED,
        claimedAt: new Date(),
        claimToken: null, // Clear token (one-time use)
      },
      include: {
        template: true,
        recipient: true,
      },
    });

    // 7. Return badge details
    return {
      id: claimedBadge.id,
      status: claimedBadge.status,
      claimedAt: claimedBadge.claimedAt,
      badge: {
        name: claimedBadge.template.name,
        description: claimedBadge.template.description,
        imageUrl: claimedBadge.template.imageUrl,
      },
      assertionUrl: this.assertionGenerator.getAssertionUrl(claimedBadge.id),
      message: 'Badge claimed successfully! You can now view it in your wallet.',
    };
  }
}
```

---

#### Task 3.3: Add Controller Endpoint (15 min)
**File:** `src/badge-issuance/badge-issuance.controller.ts`

```typescript
import { Public } from '../common/decorators/public.decorator';

@Controller('api/badges')
export class BadgeIssuanceController {
  // ... existing endpoints ...

  @Post(':id/claim')
  @Public() // No authentication required
  @ApiOperation({ summary: 'Claim a badge using claim token' })
  @ApiResponse({ status: 200, description: 'Badge claimed successfully' })
  @ApiResponse({ status: 400, description: 'Badge already claimed' })
  @ApiResponse({ status: 404, description: 'Invalid claim token' })
  @ApiResponse({ status: 410, description: 'Badge expired or revoked' })
  async claimBadge(@Param('id') id: string, @Body() dto: ClaimBadgeDto) {
    return this.badgeService.claimBadge(dto.claimToken);
  }
}
```

**Note:** `@Public()` decorator bypasses JWT authentication (from Sprint 1)

---

#### Task 3.4: Write Tests (Unit + E2E) (55 min)

**Unit Tests (5 tests):**
```typescript
describe('claimBadge', () => {
  it('should claim badge with valid token', async () => {
    // Test successful claim
  });

  it('should throw NotFoundException for invalid token', async () => {
    // Test invalid token
  });

  it('should throw BadRequestException if already claimed', async () => {
    // Test double claim
  });

  it('should throw GoneException if revoked', async () => {
    // Test revoked badge
  });

  it('should throw GoneException if token expired (7 days)', async () => {
    // Test expired token
  });
});
```

**E2E Tests (4 tests):**
```typescript
describe('POST /api/badges/:id/claim', () => {
  it('should claim badge with valid token', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/badges/${badgeId}/claim`)
      .send({ claimToken: validToken });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CLAIMED');
  });

  it('should return 404 for invalid token', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/badges/${badgeId}/claim`)
      .send({ claimToken: 'invalid-token-12345678901234567890' });
    
    expect(response.status).toBe(404);
  });

  it('should return 400 if badge already claimed', async () => {
    // Claim once
    await request(app.getHttpServer())
      .post(`/api/badges/${badgeId}/claim`)
      .send({ claimToken: validToken });
    
    // Try to claim again
    const response = await request(app.getHttpServer())
      .post(`/api/badges/${badgeId}/claim`)
      .send({ claimToken: validToken });
    
    expect(response.status).toBe(400);
  });

  it('should return 410 for expired token', async () => {
    // Mock badge with issuedAt 8 days ago
    const response = await request(app.getHttpServer())
      .post(`/api/badges/${expiredBadgeId}/claim`)
      .send({ claimToken: expiredToken });
    
    expect(response.status).toBe(410);
  });
});
```

**PowerShell E2E Test:**
```powershell
# test-badge-claim.ps1
$claimToken = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
$badgeId = "uuid-of-badge"

# Test valid claim
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/badges/$badgeId/claim" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{claimToken = $claimToken} | ConvertTo-Json)

Write-Host "✅ Badge claimed: $($response.badge.name)"
Write-Host "Assertion URL: $($response.assertionUrl)"
```

---

### Definition of Done

- [ ] ClaimBadgeDto created with validation
- [ ] claimBadge() service method works correctly
- [ ] POST /api/badges/:id/claim endpoint functional
- [ ] Endpoint is public (no auth required)
- [ ] Badge status updates to CLAIMED
- [ ] Claim timestamp recorded
- [ ] Token cleared after use (one-time)
- [ ] Expired tokens rejected
- [ ] Revoked badges rejected
- [ ] Unit tests pass (5/5)
- [ ] E2E tests pass (4/4)
- [ ] Swagger documentation complete

---

### Estimated Time: **2 hours**

---

## 🎯 Story 4.2: Batch Badge Issuance (CSV)

### User Story
**As** an authorized user (ADMIN or ISSUER),  
**I want** to upload a CSV file to issue badges in bulk,  
**So that** I can efficiently recognize multiple employees at once.

### Business Value
Essential for scalability. Manual one-by-one issuance doesn't scale for large recognition programs.

### Acceptance Criteria
- [ ] AC1: POST `/api/badges/bulk` accepts CSV file upload
- [ ] AC2: CSV format: `recipientEmail,templateId,evidenceUrl,expiresIn`
- [ ] AC3: Validates CSV headers before processing
- [ ] AC4: Processes up to 1000 badges per upload
- [ ] AC5: Returns summary: `total, successful, failed, errors[]`
- [ ] AC6: Partial failures don't rollback successful issuances
- [ ] AC7: Error messages include row number and field name
- [ ] AC8: Invalid rows logged with specific error
- [ ] AC9: Only ADMIN and ISSUER can upload
- [ ] AC10: All successful badges trigger email notifications

---

### Technical Tasks

#### Task 2.1: Install CSV Parser (5 min)
```bash
npm install csv-parse
npm install -D @types/csv-parse
```

---

#### Task 2.2: Create BulkIssueBadgesDto (15 min)
**File:** `src/badge-issuance/dto/bulk-issue-badges.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class BulkIssueBadgesDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CSV file with badge issuance data'
  })
  file: Express.Multer.File;
}

export interface BulkIssuanceRow {
  recipientEmail: string;
  templateId: string;
  evidenceUrl?: string;
  expiresIn?: number;
}

export interface BulkIssuanceResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    row: number;
    email: string;
    success: boolean;
    badgeId?: string;
    error?: string;
  }>;
}
```

---

#### Task 2.3: Create CSVParserService (1h)
**File:** `src/badge-issuance/services/csv-parser.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { BulkIssuanceRow } from '../dto/bulk-issue-badges.dto';

@Injectable()
export class CSVParserService {
  /**
   * Parse CSV file and validate structure
   */
  parseBulkIssuanceCSV(fileBuffer: Buffer): BulkIssuanceRow[] {
    try {
      // Parse CSV with headers
      const records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Validate headers
      this.validateHeaders(records[0]);

      // Validate and transform rows
      return records.map((row, index) => this.validateRow(row, index + 2)); // +2 for header row
    } catch (error) {
      throw new BadRequestException(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Validate required CSV headers
   */
  private validateHeaders(firstRow: any) {
    const requiredHeaders = ['recipientEmail', 'templateId'];
    const optionalHeaders = ['evidenceUrl', 'expiresIn'];
    const allHeaders = [...requiredHeaders, ...optionalHeaders];

    const actualHeaders = Object.keys(firstRow);
    
    // Check for required headers
    const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Check for unexpected headers
    const unexpectedHeaders = actualHeaders.filter(h => !allHeaders.includes(h));
    if (unexpectedHeaders.length > 0) {
      throw new Error(`Unexpected headers: ${unexpectedHeaders.join(', ')}`);
    }
  }

  /**
   * Validate and transform a single row
   */
  private validateRow(row: any, rowNumber: number): BulkIssuanceRow {
    const errors: string[] = [];

    // Validate recipientEmail
    if (!row.recipientEmail || !this.isValidEmail(row.recipientEmail)) {
      errors.push(`Invalid email: ${row.recipientEmail}`);
    }

    // Validate templateId (UUID format)
    if (!row.templateId || !this.isValidUUID(row.templateId)) {
      errors.push(`Invalid templateId: ${row.templateId}`);
    }

    // Validate evidenceUrl (optional)
    if (row.evidenceUrl && !this.isValidURL(row.evidenceUrl)) {
      errors.push(`Invalid evidenceUrl: ${row.evidenceUrl}`);
    }

    // Validate expiresIn (optional)
    if (row.expiresIn) {
      const days = parseInt(row.expiresIn);
      if (isNaN(days) || days < 1 || days > 3650) {
        errors.push(`Invalid expiresIn (must be 1-3650 days): ${row.expiresIn}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Row ${rowNumber}: ${errors.join(', ')}`);
    }

    return {
      recipientEmail: row.recipientEmail.toLowerCase().trim(),
      templateId: row.templateId.trim(),
      evidenceUrl: row.evidenceUrl?.trim() || undefined,
      expiresIn: row.expiresIn ? parseInt(row.expiresIn) : undefined,
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate URL format
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
```

---

#### Task 2.4: Implement bulkIssueBadges() Service Method (1h)
**File:** `src/badge-issuance/badge-issuance.service.ts`

```typescript
import { CSVParserService } from './services/csv-parser.service';
import { BulkIssuanceResult } from './dto/bulk-issue-badges.dto';

@Injectable()
export class BadgeIssuanceService {
  constructor(
    private prisma: PrismaService,
    private assertionGenerator: AssertionGeneratorService,
    private notificationService: BadgeNotificationService,
    private csvParser: CSVParserService, // NEW
  ) {}

  /**
   * Bulk issue badges from CSV file
   */
  async bulkIssueBadges(fileBuffer: Buffer, issuerId: string): Promise<BulkIssuanceResult> {
    // 1. Parse CSV
    let rows;
    try {
      rows = this.csvParser.parseBulkIssuanceCSV(fileBuffer);
    } catch (error) {
      throw new BadRequestException(`CSV parsing failed: ${error.message}`);
    }

    // 2. Limit to 1000 badges per upload
    if (rows.length > 1000) {
      throw new BadRequestException(`Too many rows (${rows.length}). Maximum 1000 badges per upload.`);
    }

    // 3. Process each row
    const results: BulkIssuanceResult['results'] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 for header row

      try {
        // Find recipient by email
        const recipient = await this.prisma.user.findUnique({
          where: { email: row.recipientEmail },
        });

        if (!recipient) {
          throw new Error(`Recipient not found: ${row.recipientEmail}`);
        }

        // Issue badge (reuse existing method)
        const badge = await this.issueBadge({
          templateId: row.templateId,
          recipientId: recipient.id,
          evidenceUrl: row.evidenceUrl,
          expiresIn: row.expiresIn,
        }, issuerId);

        results.push({
          row: rowNumber,
          email: row.recipientEmail,
          success: true,
          badgeId: badge.id,
        });
        successCount++;
      } catch (error) {
        results.push({
          row: rowNumber,
          email: row.recipientEmail,
          success: false,
          error: error.message,
        });
        failCount++;
      }
    }

    // 4. Return summary
    return {
      total: rows.length,
      successful: successCount,
      failed: failCount,
      results,
    };
  }
}
```

---

#### Task 2.5: Add Controller Endpoint with File Upload (30 min)
**File:** `src/badge-issuance/badge-issuance.controller.ts`

```typescript
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('api/badges')
export class BadgeIssuanceController {
  // ... existing endpoints ...

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk issue badges from CSV file' })
  @ApiBody({
    description: 'CSV file with columns: recipientEmail, templateId, evidenceUrl (optional), expiresIn (optional)',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Bulk issuance completed' })
  @ApiResponse({ status: 400, description: 'Invalid CSV format' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkIssueBadges(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    return this.badgeService.bulkIssueBadges(file.buffer, req.user.userId);
  }
}
```

**Install Multer:**
```bash
npm install @nestjs/platform-express
```

---

#### Task 2.6: Create CSV Template (10 min)
**File:** `backend/test/fixtures/bulk-badges-template.csv`

```csv
recipientEmail,templateId,evidenceUrl,expiresIn
john.doe@example.com,123e4567-e89b-12d3-a456-426614174000,https://example.com/cert1.pdf,365
jane.smith@example.com,123e4567-e89b-12d3-a456-426614174000,,730
bob.wilson@example.com,123e4567-e89b-12d3-a456-426614174001,https://example.com/cert2.pdf,
```

---

#### Task 2.7: Write Tests (Unit + E2E) (1h)

**Unit Tests (6 tests):**
```typescript
describe('CSVParserService', () => {
  it('should parse valid CSV', () => {
    const csv = `recipientEmail,templateId,evidenceUrl,expiresIn
john@example.com,uuid-1,https://example.com,365`;
    const buffer = Buffer.from(csv);
    const result = csvParser.parseBulkIssuanceCSV(buffer);
    expect(result).toHaveLength(1);
  });

  it('should throw error for missing headers', () => {
    const csv = `email,template
john@example.com,uuid-1`;
    const buffer = Buffer.from(csv);
    expect(() => csvParser.parseBulkIssuanceCSV(buffer)).toThrow('Missing required headers');
  });

  // ... more tests ...
});
```

**E2E Tests (3 tests):**
```typescript
describe('POST /api/badges/bulk', () => {
  it('should issue badges from valid CSV', async () => {
    const csvContent = `recipientEmail,templateId
test1@example.com,${templateId}
test2@example.com,${templateId}`;
    
    const response = await request(app.getHttpServer())
      .post('/api/badges/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csvContent), 'badges.csv');
    
    expect(response.status).toBe(201);
    expect(response.body.successful).toBe(2);
    expect(response.body.failed).toBe(0);
  });

  it('should reject invalid CSV format', async () => {
    const csvContent = `wrong,headers
value1,value2`;
    
    const response = await request(app.getHttpServer())
      .post('/api/badges/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csvContent), 'invalid.csv');
    
    expect(response.status).toBe(400);
  });

  it('should handle partial failures gracefully', async () => {
    const csvContent = `recipientEmail,templateId
valid@example.com,${templateId}
invalid-email,${templateId}`;
    
    const response = await request(app.getHttpServer())
      .post('/api/badges/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csvContent), 'mixed.csv');
    
    expect(response.status).toBe(201);
    expect(response.body.successful).toBe(1);
    expect(response.body.failed).toBe(1);
  });
});
```

---

### Definition of Done

- [ ] CSV parser service works correctly
- [ ] Validates CSV structure and data
- [ ] bulkIssueBadges() processes rows correctly
- [ ] Partial failures handled (no rollback)
- [ ] POST /api/badges/bulk endpoint functional
- [ ] File upload with Multer configured
- [ ] CSV template provided for users
- [ ] Error messages include row numbers
- [ ] Limit of 1000 badges enforced
- [ ] Unit tests pass (6/6)
- [ ] E2E tests pass (3/3)
- [ ] Swagger documentation complete

---

### Estimated Time: **3 hours**

---

## 🎯 Story 4.4: Issuance History & Queries

### User Story
**As** a user,  
**I want** to view badges I've received or issued,  
**So that** I can track my achievements or monitor issuance activity.

### Business Value
Provides visibility into badge ecosystem. Essential for user engagement and issuer accountability.

### Acceptance Criteria
- [ ] AC1: GET `/api/badges/my-badges` returns badges I received
- [ ] AC2: GET `/api/badges/issued` returns badges I issued (ADMIN/ISSUER only)
- [ ] AC3: Supports pagination (page, limit)
- [ ] AC4: Supports filtering by status (PENDING, CLAIMED, EXPIRED, REVOKED)
- [ ] AC5: Supports filtering by templateId
- [ ] AC6: Supports sorting (issuedAt, claimedAt)
- [ ] AC7: Returns badge details with template info
- [ ] AC8: EMPLOYEE can only see their own badges
- [ ] AC9: ADMIN can see all badges
- [ ] AC10: Includes pagination metadata (totalCount, totalPages)

---

### Technical Tasks

#### Task 4.1: Create QueryBadgeDto (15 min)
**File:** `src/badge-issuance/dto/query-badge.dto.ts`

```typescript
import { IsOptional, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BadgeStatus } from '@prisma/client';

export class QueryBadgeDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filter by status', 
    enum: BadgeStatus,
    example: 'CLAIMED'
  })
  @IsOptional()
  @IsEnum(BadgeStatus)
  status?: BadgeStatus;

  @ApiPropertyOptional({ description: 'Filter by template ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['issuedAt', 'claimedAt'],
    example: 'issuedAt',
    default: 'issuedAt'
  })
  @IsOptional()
  sortBy?: 'issuedAt' | 'claimedAt' = 'issuedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc'
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

---

#### Task 4.2: Implement Query Methods (1h)
**File:** `src/badge-issuance/badge-issuance.service.ts`

```typescript
@Injectable()
export class BadgeIssuanceService {
  // ... existing methods ...

  /**
   * Get badges received by a user
   */
  async getMyBadges(userId: string, query: QueryBadgeDto) {
    const { page, limit, status, templateId, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      recipientId: userId,
    };

    if (status) {
      where.status = status;
    }

    if (templateId) {
      where.templateId = templateId;
    }

    // Count total
    const totalCount = await this.prisma.badge.count({ where });

    // Fetch badges
    const badges = await this.prisma.badge.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            category: true,
          },
        },
        issuer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Format response
    const data = badges.map(badge => ({
      id: badge.id,
      status: badge.status,
      issuedAt: badge.issuedAt,
      claimedAt: badge.claimedAt,
      expiresAt: badge.expiresAt,
      template: badge.template,
      issuer: badge.issuer,
      assertionUrl: this.assertionGenerator.getAssertionUrl(badge.id),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + badges.length < totalCount,
      },
    };
  }

  /**
   * Get badges issued by a user (ADMIN/ISSUER only)
   */
  async getIssuedBadges(userId: string, userRole: UserRole, query: QueryBadgeDto) {
    const { page, limit, status, templateId, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // ISSUER can only see badges they issued
    // ADMIN can see all badges
    if (userRole === UserRole.ISSUER) {
      where.issuerId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (templateId) {
      where.templateId = templateId;
    }

    // Count total
    const totalCount = await this.prisma.badge.count({ where });

    // Fetch badges
    const badges = await this.prisma.badge.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            category: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Format response
    const data = badges.map(badge => ({
      id: badge.id,
      status: badge.status,
      issuedAt: badge.issuedAt,
      claimedAt: badge.claimedAt,
      expiresAt: badge.expiresAt,
      template: badge.template,
      recipient: badge.recipient,
      assertionUrl: this.assertionGenerator.getAssertionUrl(badge.id),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + badges.length < totalCount,
      },
    };
  }
}
```

---

#### Task 4.3: Add Controller Endpoints (20 min)
**File:** `src/badge-issuance/badge-issuance.controller.ts`

```typescript
@Controller('api/badges')
export class BadgeIssuanceController {
  // ... existing endpoints ...

  @Get('my-badges')
  @ApiOperation({ summary: 'Get my received badges' })
  @ApiResponse({ status: 200, description: 'Badges retrieved successfully' })
  async getMyBadges(@Query() query: QueryBadgeDto, @Request() req) {
    return this.badgeService.getMyBadges(req.user.userId, query);
  }

  @Get('issued')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Get badges I issued (ADMIN/ISSUER only)' })
  @ApiResponse({ status: 200, description: 'Badges retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getIssuedBadges(@Query() query: QueryBadgeDto, @Request() req) {
    return this.badgeService.getIssuedBadges(
      req.user.userId,
      req.user.role,
      query,
    );
  }
}
```

---

#### Task 4.4: Write Tests (Unit + E2E) (45 min)

**E2E Tests (4 tests):**
```typescript
describe('GET /api/badges/my-badges', () => {
  it('should return my badges with pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/badges/my-badges?page=1&limit=10')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
  });

  it('should filter by status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/badges/my-badges?status=CLAIMED')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.every(b => b.status === 'CLAIMED')).toBe(true);
  });
});

describe('GET /api/badges/issued', () => {
  it('should return badges I issued (ISSUER)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/badges/issued')
      .set('Authorization', `Bearer ${issuerToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should return 403 for EMPLOYEE role', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/badges/issued')
      .set('Authorization', `Bearer ${employeeToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

---

### Definition of Done

- [ ] QueryBadgeDto with pagination and filtering
- [ ] getMyBadges() returns user's badges
- [ ] getIssuedBadges() returns issued badges (with RBAC)
- [ ] Pagination works correctly
- [ ] Filtering by status and templateId works
- [ ] Sorting works (issuedAt, claimedAt)
- [ ] RBAC enforced (ISSUER sees own, ADMIN sees all)
- [ ] E2E tests pass (4/4)
- [ ] Swagger documentation complete
- [ ] Response format consistent

---

### Estimated Time: **2 hours**

---

## 🎯 Story 4.6: Badge Revocation

### User Story
**As** an administrator,  
**I want** to revoke a badge,  
**So that** I can invalidate badges issued in error or when criteria are no longer met.

### Business Value
Essential for badge integrity. Allows correction of mistakes and enforcement of policies.

### Acceptance Criteria
- [ ] AC1: POST `/api/badges/:id/revoke` revokes a badge
- [ ] AC2: Accepts `reason` in request body (required)
- [ ] AC3: Badge status changes to REVOKED
- [ ] AC4: Revocation timestamp recorded
- [ ] AC5: Revocation reason stored
- [ ] AC6: Email notification sent to recipient
- [ ] AC7: Revoked badge cannot be claimed
- [ ] AC8: Assertion endpoint returns 410 Gone for revoked badges
- [ ] AC9: Only ADMIN can revoke badges
- [ ] AC10: Cannot revoke already revoked badge

---

### Technical Tasks

#### Task 6.1: Create RevokeBadgeDto (10 min)
**File:** `src/badge-issuance/dto/revoke-badge.dto.ts`

```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeBadgeDto {
  @ApiProperty({
    description: 'Reason for revocation',
    example: 'Badge issued in error - recipient did not meet criteria',
    minLength: 10,
    maxLength: 500
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
```

---

#### Task 6.2: Implement revokeBadge() Service Method (30 min)
**File:** `src/badge-issuance/badge-issuance.service.ts`

```typescript
@Injectable()
export class BadgeIssuanceService {
  // ... existing methods ...

  /**
   * Revoke a badge
   */
  async revokeBadge(badgeId: string, reason: string, adminId: string) {
    // 1. Find badge
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        template: true,
        recipient: true,
      },
    });

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    // 2. Check if already revoked
    if (badge.status === BadgeStatus.REVOKED) {
      throw new BadRequestException('Badge is already revoked');
    }

    // 3. Revoke badge
    const revokedBadge = await this.prisma.badge.update({
      where: { id: badgeId },
      data: {
        status: BadgeStatus.REVOKED,
        revokedAt: new Date(),
        revocationReason: reason,
        claimToken: null, // Clear token
      },
    });

    // 4. Send revocation notification email
    await this.notificationService.sendBadgeRevocationNotification({
      recipientEmail: badge.recipient.email,
      recipientName: badge.recipient.name || badge.recipient.email,
      badgeName: badge.template.name,
      revocationReason: reason,
    });

    // 5. Log revocation (audit trail)
    this.logger.log(`Badge ${badgeId} revoked by admin ${adminId}: ${reason}`);

    return {
      id: revokedBadge.id,
      status: revokedBadge.status,
      revokedAt: revokedBadge.revokedAt,
      revocationReason: revokedBadge.revocationReason,
      message: 'Badge revoked successfully',
    };
  }
}
```

---

#### Task 6.3: Create Revocation Email Template (20 min)
**File:** `src/badge-issuance/templates/badge-revocation-notification.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Badge Revoked</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">⚠️ Badge Revoked</h1>
  </div>
  
  <div class="content">
    <p>Hi {{recipientName}},</p>
    
    <p>We're writing to inform you that your <strong>{{badgeName}}</strong> badge has been revoked.</p>
    
    <div class="info-box">
      <p><strong>Reason for Revocation:</strong></p>
      <p>{{revocationReason}}</p>
    </div>
    
    <p>This badge is no longer valid and cannot be verified or shared.</p>
    
    <p>If you believe this is an error or have questions, please contact our support team at <a href="mailto:badges@gcredit.example.com">badges@gcredit.example.com</a>.</p>
    
    <p>We appreciate your understanding.</p>
  </div>
  
  <div class="footer">
    <p><strong>G-Credit Digital Credentialing Platform</strong></p>
  </div>
</body>
</html>
```

---

#### Task 6.4: Update BadgeNotificationService (15 min)
**File:** `src/badge-issuance/services/badge-notification.service.ts`

```typescript
@Injectable()
export class BadgeNotificationService {
  private badgeRevocationTemplate: string;

  constructor(private emailService: EmailService) {
    // Load revocation template
    const revocationTemplatePath = path.join(__dirname, '../templates/badge-revocation-notification.html');
    this.badgeRevocationTemplate = fs.readFileSync(revocationTemplatePath, 'utf-8');
  }

  // ... existing methods ...

  /**
   * Send badge revocation notification
   */
  async sendBadgeRevocationNotification(params: {
    recipientEmail: string;
    recipientName: string;
    badgeName: string;
    revocationReason: string;
  }): Promise<void> {
    try {
      const html = this.badgeRevocationTemplate
        .replace(/\{\{recipientName\}\}/g, params.recipientName)
        .replace(/\{\{badgeName\}\}/g, params.badgeName)
        .replace(/\{\{revocationReason\}\}/g, params.revocationReason);

      await this.emailService.sendMail({
        to: params.recipientEmail,
        subject: `Badge Revoked: ${params.badgeName}`,
        html,
      });

      this.logger.log(`✅ Revocation notification sent to ${params.recipientEmail}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send revocation notification:`, error);
    }
  }
}
```

---

#### Task 6.5: Add Controller Endpoint (15 min)
**File:** `src/badge-issuance/badge-issuance.controller.ts`

```typescript
@Controller('api/badges')
export class BadgeIssuanceController {
  // ... existing endpoints ...

  @Post(':id/revoke')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revoke a badge (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Badge revoked successfully' })
  @ApiResponse({ status: 400, description: 'Badge already revoked' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async revokeBadge(
    @Param('id') id: string,
    @Body() dto: RevokeBadgeDto,
    @Request() req,
  ) {
    return this.badgeService.revokeBadge(id, dto.reason, req.user.userId);
  }
}
```

---

#### Task 6.6: Update Assertion Endpoint to Handle Revoked Badges (10 min)
**File:** `src/badge-issuance/badge-issuance.controller.ts`

```typescript
@Get(':id/assertion')
@Public()
@ApiOperation({ summary: 'Get Open Badges 2.0 assertion (public)' })
@ApiResponse({ status: 200, description: 'Assertion retrieved successfully' })
@ApiResponse({ status: 404, description: 'Badge not found' })
@ApiResponse({ status: 410, description: 'Badge revoked' })
async getAssertion(@Param('id') id: string) {
  const badge = await this.badgeService.findOne(id);

  if (!badge) {
    throw new NotFoundException('Badge not found');
  }

  if (badge.status === BadgeStatus.REVOKED) {
    throw new GoneException('Badge has been revoked');
  }

  return badge.assertionJson;
}
```

---

#### Task 6.7: Implement findOne() Helper (10 min)
**File:** `src/badge-issuance/badge-issuance.service.ts`

```typescript
@Injectable()
export class BadgeIssuanceService {
  // ... existing methods ...

  /**
   * Find badge by ID (helper method)
   */
  async findOne(id: string) {
    return this.prisma.badge.findUnique({
      where: { id },
      include: {
        template: true,
        recipient: true,
        issuer: true,
      },
    });
  }
}
```

---

#### Task 6.8: Write Tests (Unit + E2E) (30 min)

**E2E Tests (3 tests):**
```typescript
describe('POST /api/badges/:id/revoke', () => {
  it('should revoke badge successfully (ADMIN)', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/badges/${badgeId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Badge issued in error' });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('REVOKED');
  });

  it('should return 403 for non-ADMIN user', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/badges/${badgeId}/revoke`)
      .set('Authorization', `Bearer ${issuerToken}`)
      .send({ reason: 'Reason' });
    
    expect(response.status).toBe(403);
  });

  it('should return 400 if badge already revoked', async () => {
    // Revoke once
    await request(app.getHttpServer())
      .post(`/api/badges/${badgeId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'First revocation' });
    
    // Try to revoke again
    const response = await request(app.getHttpServer())
      .post(`/api/badges/${badgeId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Second revocation' });
    
    expect(response.status).toBe(400);
  });
});

describe('GET /api/badges/:id/assertion', () => {
  it('should return 410 for revoked badge', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/badges/${revokedBadgeId}/assertion`);
    
    expect(response.status).toBe(410);
  });
});
```

---

### Definition of Done

- [ ] RevokeBadgeDto with validation
- [ ] revokeBadge() service method works correctly
- [ ] POST /api/badges/:id/revoke endpoint functional
- [ ] Only ADMIN can revoke badges
- [ ] Badge status updates to REVOKED
- [ ] Revocation timestamp and reason stored
- [ ] Email notification sent
- [ ] Revoked badge returns 410 on assertion endpoint
- [ ] Cannot revoke already revoked badge
- [ ] E2E tests pass (3/3)
- [ ] Swagger documentation complete

---

### Estimated Time: **1.5 hours**

---

## 🎯 Sprint 3 Public Verification Endpoint

**Note:** This is a bonus task covered by Story 4.1 implementation (getAssertion endpoint)

### Endpoint Already Implemented
```typescript
@Get(':id/assertion')
@Public()
async getAssertion(@Param('id') id: string) {
  const badge = await this.badgeService.findOne(id);
  if (!badge) throw new NotFoundException('Badge not found');
  if (badge.status === 'REVOKED') throw new GoneException('Badge revoked');
  return badge.assertionJson;
}
```

**Verification URL Format:**
```
https://gcredit.example.com/api/badges/{badgeId}/assertion
```

**This endpoint:**
- ✅ Is public (no authentication)
- ✅ Returns Open Badges 2.0 JSON-LD
- ✅ Verifies badge authenticity
- ✅ Returns 404 if badge not found
- ✅ Returns 410 if badge revoked

---

## 📊 Sprint 3 Summary

### Total Stories: 6
1. ✅ Story 4.1: Single Badge Issuance (2h)
2. ✅ Story 4.5: Email Notifications (2h)
3. ✅ Story 4.3: Badge Claiming Workflow (2h)
4. ✅ Story 4.2: Batch Badge Issuance (CSV) (3h)
5. ✅ Story 4.4: Issuance History & Queries (2h)
6. ✅ Story 4.6: Badge Revocation (1.5h)

### Total Estimated Time: **12.5 hours**

### New API Endpoints: 8
- POST `/api/badges` - Issue single badge
- POST `/api/badges/bulk` - Bulk issue (CSV)
- POST `/api/badges/:id/claim` - Claim badge
- GET `/api/badges/my-badges` - My badges
- GET `/api/badges/issued` - Issued badges
- POST `/api/badges/:id/revoke` - Revoke badge
- GET `/api/badges/:id/assertion` - Public assertion
- GET `/api/badges/:id/verify` - Verify badge (covered by assertion)

### New Database Models: 1
- Badge (with BadgeStatus enum)

### New Services: 4
- BadgeIssuanceService
- AssertionGeneratorService
- BadgeNotificationService
- CSVParserService

### Tests: 40
- Unit tests: 20
- Jest E2E tests: 15
- PowerShell E2E tests: 5

---

## 📚 Reference Documentation

- [Sprint 3 Kickoff](./kickoff.md)
- [ADR-003: Badge Assertion Format](../../decisions/003-badge-assertion-format.md)
- [ADR-004: Email Service Selection](../../decisions/004-email-service-selection.md)
- [Lessons Learned](../../lessons-learned/lessons-learned.md)
- [DOCUMENTATION-STRUCTURE.md](../../../DOCUMENTATION-STRUCTURE.md)

---

## ✅ Sprint Ready Checklist

- [x] All stories have detailed technical tasks
- [x] Acceptance criteria defined
- [x] Time estimates based on Sprint 2 velocity
- [x] Import paths verified (Lesson 10)
- [x] DTO design considers Prisma JSON types (Lesson 13)
- [x] Union types have validation decorators (Lesson 14)
- [x] Test strategy included for each story
- [x] Definition of Done clear
- [x] Dependencies identified
- [x] ADRs created for major decisions
- [x] Email templates prepared
- [x] CSV format specified

---

**Status:** ✅ Ready to Start  
**Next Action:** Begin with Story 4.1 (Single Badge Issuance)

**Good luck with Sprint 3! 🚀**
